/* ============================================================
   資料層  DB  —  三種模式，自動偵測，對外 API 相同
   1) Firebase（Firestore）：config.js 填了 FIREBASE_CONFIG.apiKey
   2) Supabase：填了 SUPABASE_URL / SUPABASE_ANON_KEY
   3) 示範模式：以上皆空 → 用瀏覽器 localStorage
   表（集合）：students / lessons / questions / results
   ============================================================ */
(function () {
  const FB = window.FIREBASE_CONFIG;
  const hasFirebase = !!(FB && FB.apiKey && window.firebase && window.firebase.firestore);
  const hasSupabase = !!(window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase && window.supabase.createClient);

  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }
  const stamp = () => new Date().toISOString();

  /* ---------- 1) Firebase / Firestore ---------- */
  let fdb = null;
  if (hasFirebase) {
    if (!firebase.apps.length) firebase.initializeApp(FB);
    fdb = firebase.firestore();
  }
  async function fbDelWhere(table, field, val) {
    const snap = await fdb.collection(table).where(field, "==", val).get();
    const ps = []; snap.forEach(d => ps.push(d.ref.delete())); await Promise.all(ps);
  }
  // 寫入前先把登入憑證刷新一次，避免 token 過期造成「Missing or insufficient permissions」
  async function fbFresh() {
    try { const u = window.firebase && firebase.auth && firebase.auth().currentUser; if (u) await u.getIdToken(true); } catch (e) {}
  }
  const firebaseDB = {
    async list(table) {
      const snap = await fdb.collection(table).get();
      return snap.docs.map(d => Object.assign({ id: d.id }, d.data()))
        .sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""));
    },
    async listWhere(table, field, val) {
      const snap = await fdb.collection(table).where(field, "==", val).get();
      return snap.docs.map(d => Object.assign({ id: d.id }, d.data()))
        .sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""));
    },
    async insert(table, obj) {
      await fbFresh();
      const row = Object.assign({ created_at: stamp() }, obj);
      const ref = await fdb.collection(table).add(row);
      return Object.assign({ id: ref.id }, row);
    },
    async update(table, id, patch) {
      await fbFresh();
      await fdb.collection(table).doc(id).update(patch);
      return Object.assign({ id }, patch);
    },
    async remove(table, id) {
      await fbFresh();
      await fdb.collection(table).doc(id).delete();
      if (table === "lessons") { await fbDelWhere("questions", "lesson_id", id); await fbDelWhere("results", "lesson_id", id); }
      if (table === "students") { await fbDelWhere("results", "student_id", id); }
      return true;
    },
    async upsertResult(lesson_id, student_id, patch) {
      await fbFresh();
      const q = (patch && patch.uid)
        ? fdb.collection("results").where("uid", "==", patch.uid)
        : fdb.collection("results").where("student_id", "==", student_id);
      const snap = await q.get();
      const found = snap.docs.find(d => d.data().lesson_id === lesson_id);
      if (found) { await found.ref.update(Object.assign({ updated_at: stamp() }, patch)); return Object.assign({ id: found.id }, found.data(), patch); }
      const row = Object.assign({ lesson_id, student_id, created_at: stamp(), updated_at: stamp() }, patch);
      const ref = await fdb.collection("results").add(row);
      return Object.assign({ id: ref.id }, row);
    },
  };

  /* ---------- 2) Supabase ---------- */
  let sb = null;
  if (!hasFirebase && hasSupabase) sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const supabaseDB = {
    async list(table) { const { data, error } = await sb.from(table).select("*").order("created_at", { ascending: true }); if (error) throw error; return data || []; },
    async listWhere(table, field, val) { const { data, error } = await sb.from(table).select("*").eq(field, val).order("created_at", { ascending: true }); if (error) throw error; return data || []; },
    async insert(table, obj) { const { data, error } = await sb.from(table).insert(obj).select().single(); if (error) throw error; return data; },
    async update(table, id, patch) { const { data, error } = await sb.from(table).update(patch).eq("id", id).select().single(); if (error) throw error; return data; },
    async remove(table, id) { const { error } = await sb.from(table).delete().eq("id", id); if (error) throw error; return true; },
    async upsertResult(lesson_id, student_id, patch) {
      const row = Object.assign({ lesson_id, student_id, updated_at: stamp() }, patch);
      const { data, error } = await sb.from("results").upsert(row, { onConflict: "lesson_id,student_id" }).select().single();
      if (error) throw error; return data;
    },
  };

  /* ---------- 3) 示範模式（localStorage） ---------- */
  const LS = "hyc_";
  const lsGet = (t) => { try { return JSON.parse(localStorage.getItem(LS + t) || "[]"); } catch (e) { return []; } };
  const lsSet = (t, rows) => localStorage.setItem(LS + t, JSON.stringify(rows));
  const localDB = {
    async list(table) { return lsGet(table).slice().sort((a, b) => (a.created_at || "").localeCompare(b.created_at || "")); },
    async listWhere(table, field, val) { return lsGet(table).filter(r => r[field] === val).sort((a, b) => (a.created_at || "").localeCompare(b.created_at || "")); },
    async insert(table, obj) { const rows = lsGet(table); const row = Object.assign({ id: uid(), created_at: stamp() }, obj); rows.push(row); lsSet(table, rows); return row; },
    async update(table, id, patch) { const rows = lsGet(table); const i = rows.findIndex(r => r.id === id); if (i < 0) return null; rows[i] = Object.assign({}, rows[i], patch); lsSet(table, rows); return rows[i]; },
    async remove(table, id) {
      lsSet(table, lsGet(table).filter(r => r.id !== id));
      if (table === "lessons") { lsSet("questions", lsGet("questions").filter(q => q.lesson_id !== id)); lsSet("results", lsGet("results").filter(r => r.lesson_id !== id)); }
      if (table === "students") { lsSet("results", lsGet("results").filter(r => r.student_id !== id)); }
      return true;
    },
    async upsertResult(lesson_id, student_id, patch) {
      const rows = lsGet("results"); let i = rows.findIndex(r => r.lesson_id === lesson_id && r.student_id === student_id);
      if (i < 0) { rows.push(Object.assign({ id: uid(), lesson_id, student_id, created_at: stamp() }, patch, { updated_at: stamp() })); i = rows.length - 1; }
      else { rows[i] = Object.assign({}, rows[i], patch, { updated_at: stamp() }); }
      lsSet("results", rows); return rows[i];
    },
  };

  const mode = hasFirebase ? "firebase" : (hasSupabase ? "supabase" : "local");
  const impl = hasFirebase ? firebaseDB : (hasSupabase ? supabaseDB : localDB);
  window.DB = Object.assign({ mode }, impl);
})();
