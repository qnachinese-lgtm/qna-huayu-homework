/* ⚠️ HANZI_NOTE 漢字遊戲（字族工坊）備註——改這個檔案之前請先看：
   1. 漢字遊戲的程式「不在」這個檔案裡，全部在 hanzi.html、hanzi-game.js、hanzi-data.js、hanzi-teacher.js、hanzi-student.js。
   2. 它是靠 db.js 最後面的「HANZI_LOADER」那一段，自動接到老師後台（teacher.html）和學生頁（student.html）。
   3. 所以：不要在 teacher.html／teacher-app.js／student.html 裡加漢字遊戲的程式；也不要刪 db.js 的 HANZI_LOADER、根目錄的 check-hanzi.js、vercel.json 的 buildCommand。
   4. 每次修改前先從 GitHub 下載「最新」的檔案再改，不要拿電腦裡或別的對話裡的舊檔案上傳（舊檔案會把別人改過的東西蓋掉）。
   5. 上傳後如果 GitHub 出現紅色 ✕，代表漢字遊戲需要的東西被弄掉了，網站會維持上一版，點進去看說明再補回來。 */
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
    /* ══════ LONGPOLL_V1404 Firestore 連不上就自動改用長輪詢 ══════
       Quinn 的 Console 截圖裡有這兩條：
         GET https://firestore.googleapis.com/.../Firestore/Listen/channel  404 (Not Found)
         @firebase/firestore: WebChannelConnection RPC 'Listen' stream transport errored
       意思是 Firestore 用的那條即時連線（WebChannel）被擋掉或接不起來。
       常見原因是中間有防毒／擋廣告／公司或電信的代理在擋那條連線。
       接不起來的時候，程式會一直等資料回來，畫面看起來就是「卡住」或「超慢」。
       這是 Firebase 官方給的對策：偵測到接不起來就自動改用長輪詢（長輪詢比較慢一點，
       但一定連得上）。連得上的人完全不受影響。
       settings() 一定要在任何一次讀寫之前呼叫，所以放在這裡；
       萬一哪裡已經設定過會丟例外，包起來不讓它擋住整個程式。 */
    try { fdb.settings({ experimentalAutoDetectLongPolling: true, merge: true }); } catch (e) {}
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

/* ══════ HANZI_LOADER 漢字遊戲外掛 ══════
   老師後台（teacher.html）自動載入 hanzi-teacher.js，學生端（student.html）自動載入 hanzi-student.js。
   漢字遊戲的程式全部在那兩支檔案裡，teacher.html／student.html 不用寫任何東西，
   所以改後台、用舊檔案覆蓋都不會讓漢字遊戲不見。這一段請保留。 */
(function () {
  var p = location.pathname, f = /\/teacher(\.html)?$/.test(p) ? 'hanzi-teacher.js' : (/\/student(\.html)?$/.test(p) ? 'hanzi-student.js' : null);
  if (!f) return;
  function go() { var s = document.createElement('script'); s.src = f; document.body.appendChild(s); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
