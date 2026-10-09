(() => {
"use strict";
// ================= 資料 =================
const FAM = DATA.families, BONUS = DATA.bonus, HZ = DATA.hz8k || { levels:[], chars:{}, cards:{} };
const CH = {};
Object.entries(HZ.chars).forEach(([c, e]) => { CH[c] = Object.assign({ c }, e); });
FAM.forEach(f => { f.key = f.name.replace(/（.*）/, "").split("／")[0]; if (f.name === "形近字") f.key = "形"; f.chars.forEach(x => { CH[x.c] = Object.assign({}, CH[x.c] || {}, x); }); });
const RAD = {}, COMP = {};
Object.entries(HZ.cards).forEach(([k, v]) => { if (v.k === "r") RAD[k] = { name:v.n, hint:v.h || "" }; else COMP[k] = v.py || ""; });
Object.assign(RAD, DATA.radicals); Object.assign(COMP, DATA.components);
Object.keys(RAD).forEach(k => { delete COMP[k]; });
// 一個字所有的讀音（第一個是主要讀音；多音字的其他讀音在 py2）
const pysOf = s => { const e = CH[s]; const a = [pyOf(s)].filter(Boolean); if (e && e.py2) e.py2.forEach(([p]) => { if (a.indexOf(p) < 0) a.push(p); }); return a; };
const pyLine = x => { const e = CH[x.c]; return e && e.py2 && e.py2.length ? "多音字：" + [[x.py, x.w]].concat(e.py2).map(([p, w]) => p + (w && w.length > 1 ? `（${w}）` : "")).join("／") : ""; };
const pyOf = s => COMP[s] || (CH[s] && CH[s].py) || "";
const BON = {}; BONUS.forEach(b => BON[b.c] = b);
const NOSTROKE = new Set(DATA.nostroke || []);
// 關卡：第 0 組是精選字族，後面是華語八千詞的七個等級
const LEVELS = [{ name:"精選字族", short:"精選", stages: FAM.map(f => ({ id:f.name, name:f.name, key:f.key, chars:f.chars.map(x => x.c), curated:true })) }]
  .concat(HZ.levels.map(L => ({ name:L.name, short:L.name.replace("級", ""), stages:L.stages })));
const STAGES = {};
LEVELS.forEach((L, li) => L.stages.forEach((s, i) => { s.li = li; s.i = i; STAGES[s.id] = s; }));
const stageName = id => String(id).startsWith("L:") ? "課本・" + ((C.byId[String(id).slice(2)] || {}).label || "課") : STAGES[id] ? (STAGES[id].li ? LEVELS[STAGES[id].li].short + "・" : "") + STAGES[id].name : id;
// 拆字只在「這一關的題目」裡往下拆：其他的字直接給一張卡
let SCOPE = new Set(), KEYMAP = {}, BONKEY = {}, ALLEXP = [], TOP = {};
function expand(s, seen){ seen = seen || []; if (SCOPE.has(s) && CH[s] && CH[s].p && seen.indexOf(s) < 0) return CH[s].p.flatMap(p => expand(p, seen.concat(s))); return [s]; }
const keyOf = arr => arr.flatMap(x => expand(x)).sort().join("|");
Object.values(CH).forEach(x => { if (x.p) TOP[x.p.slice().sort().join("|")] = x.c; });
function setScope(targets, curated){
  SCOPE = new Set(targets); KEYMAP = {}; BONKEY = {};
  targets.forEach(c => { const k = keyOf(CH[c].p); (KEYMAP[k] = KEYMAP[k] || []).push(c); });
  if (curated) BONUS.forEach(b => { BONKEY[b.p.slice().sort().join("|")] = b.c; });
  ALLEXP = targets.map(c => expand(c)).concat(curated ? BONUS.map(b => b.p.slice()) : []);
}
function subMulti(a, b){ const m = {}; b.forEach(x => m[x] = (m[x] || 0) + 1); return a.every(x => (m[x] = (m[x] || 0) - 1) >= 0); }
const canGrow = pieces => { const e = pieces.flatMap(x => expand(x)); return ALLEXP.some(t => t.length > e.length && subMulti(e, t)); };
const toneless = p => String(p || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const $ = s => document.querySelector(s);
const el = (tag, attrs = {}, kids = []) => { const n = document.createElement(tag); for (const k in attrs){ if (k === "class") n.className = attrs[k]; else if (k === "text") n.textContent = attrs[k]; else n.setAttribute(k, attrs[k]); } [].concat(kids).forEach(k => k != null && n.append(k)); return n; };
const svgEl = html => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; };
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const blankWord = x => x.w.split("").map(ch => ch === x.c ? "□" : ch).join("");
// 讀題目：「忘，忘記的忘」——說清楚只要拼一個字
const sayQ = x => `${x.c}，${x.w}的${x.c}`;
// 完成後的詞：目標字正常顯示，其他字變淡
const wordMark = x => { const w = el("div", {class:"w"}); x.w.split("").forEach(ch => w.append(el("span", {class: ch === x.c ? "t" : "o", text:ch}))); return w; };
// 筆順資料由 hanzi-writer 自動從 jsDelivr 下載
const use = n => (window.claude && typeof window.claude.use === "function") ? Promise.resolve(window.claude.use(n)).catch(() => null) : Promise.resolve(null);
const ls = { get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }, set(k, v){ try { localStorage.setItem(k, v); } catch(e){} } };
function shuffle(a, rnd = Math.random){ a = a.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function seeded(seed){ let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const STAR = on => `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="${on ? "star-on" : "star-off"}" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>`;
const HEART = on => `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="${on ? "heart-on" : "heart-off"}" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 5.3 3 1.7-1.9 3.2-3 5.3-3 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>`;
const SPEAK = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>`;
const starsHtml = n => `<span class="stars">${[0,1,2].map(i => STAR(i < n)).join("")}</span>`;

// ================= 讀音與音效 =================
let voice = null;
function pickVoice(){ try { const vs = speechSynthesis.getVoices(); voice = vs.find(v => /zh[-_]TW/i.test(v.lang)) || vs.find(v => /zh/i.test(v.lang)) || null; } catch(e){} }
try { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; } catch(e){}
function say(text){ try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = "zh-TW"; if (voice) u.voice = voice; u.rate = .85; speechSynthesis.speak(u); } catch(e){} }
let actx = null, soundOn = ls.get("zzgf-snd") !== "0";
function tone(freq, t0, dur, type = "sine", vol = .12){
  if (!soundOn) return;
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain(); o.type = type; o.frequency.value = freq;
    const t = actx.currentTime + t0; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur + .05); } catch(e){}
}
const sfx = {
  pick(){ tone(660, 0, .06, "triangle", .06); },
  good(){ tone(523, 0, .12); tone(784, .09, .18); },
  combo(n){ tone(523 + n * 40, 0, .1); tone(784 + n * 40, .08, .16); tone(1046 + n * 40, .16, .2); },
  bad(){ tone(180, 0, .22, "sawtooth", .08); },
  star(i){ tone(880 + i * 220, 0, .25, "triangle", .1); },
  win(){ [523, 659, 784, 1046].forEach((f, i) => tone(f, i * .1, .3, "triangle", .1)); },
  lose(){ [392, 330, 262].forEach((f, i) => tone(f, i * .15, .3, "sine", .1)); }
};
$("#sndToggle").checked = soundOn;
$("#sndToggle").onchange = e => { soundOn = e.target.checked; ls.set("zzgf-snd", soundOn ? "1" : "0"); };

// ================= 特效 =================
const fx = $("#fx"), fctx = fx.getContext("2d"); let parts = [], fxRun = false;
const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
function burst(x, y, n = 28){
  if (reduce) return;
  const cols = [css("--navy"), css("--green"), css("--plum"), css("--gold")];
  for (let i = 0; i < n; i++){ const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 5; parts.push({ x, y, vx:Math.cos(a) * v, vy:Math.sin(a) * v - 2, life:1, c:cols[i % 4], r:2 + Math.random() * 4, sq:Math.random() < .5 }); }
  if (!fxRun){ fxRun = true; requestAnimationFrame(stepFx); }
}
function stepFx(){
  const dpr = window.devicePixelRatio || 1; if (fx.width !== innerWidth * dpr){ fx.width = innerWidth * dpr; fx.height = innerHeight * dpr; }
  fctx.setTransform(dpr, 0, 0, dpr, 0, 0); fctx.clearRect(0, 0, innerWidth, innerHeight);
  parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .18; p.life -= .018; fctx.globalAlpha = Math.max(0, p.life); fctx.fillStyle = p.c; if (p.sq) fctx.fillRect(p.x, p.y, p.r * 1.6, p.r * 1.6); else { fctx.beginPath(); fctx.arc(p.x, p.y, p.r, 0, 7); fctx.fill(); } });
  parts = parts.filter(p => p.life > 0);
  if (parts.length) requestAnimationFrame(stepFx); else { fctx.clearRect(0, 0, innerWidth, innerHeight); fxRun = false; }
}
function popText(x, y, text){ const p = el("div", {class:"pop", text}); p.style.left = x + "px"; p.style.top = y + "px"; document.body.append(p); setTimeout(() => p.remove(), 1200); }
function toast(text){ const t = el("div", {class:"toast", text}); document.body.append(t); setTimeout(() => t.remove(), 3300); }
const centerOf = node => { const r = node.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

// ================= 紀錄 =================
const store = { me:null, uid:null, teacher:false, tasks:[], saved:"" };
let LSKEY = "hz-rec-guest";
function emptyRec(){ return { v:2, xp:0, totalScore:0, found:{}, hard:{}, recall:{done:0, ok:0}, stars:{easy:{}, normal:{}, hard:{}}, badges:{}, bestCombo:0, bonus:{}, originViews:0, wins:0, lastAt:0, sessions:[], course:{}, review:{}, wrong:{} }; }
function normRec(r){ const e = emptyRec(); r = Object.assign(e, r || {}); r.stars = Object.assign({easy:{}, normal:{}, hard:{}}, r.stars || {}); if (!r.xp && r.totalScore) r.xp = r.totalScore; ['course', 'review', 'wrong'].forEach(k => { if (!r[k] || typeof r[k] !== 'object') r[k] = {}; }); return r; }
let rec = normRec(JSON.parse(ls.get(LSKEY) || "null"));
let saveTimer = null, saving = false, dirty = false;
function save(){ rec.lastAt = Date.now(); rec.totalScore = rec.xp; ls.set(LSKEY, JSON.stringify(rec)); clearTimeout(saveTimer); saveTimer = setTimeout(flush, 1500); renderTasks(); }
async function flush(){
  if (!store.me || !store.uid || !window.DB || DB.mode === "local") return;
  if (saving){ dirty = true; return; }
  saving = true;
  try {
    const sm = k => Object.values(rec.stars[k] || {}).reduce((a, b) => a + b, 0);
    await DB.upsertResult("__hanzi__", store.me.id, { uid:store.uid, kind:"hanzi", student_name:store.me.name || "", rec:JSON.parse(JSON.stringify(rec)),
      xp:rec.xp, stars_easy:sm("easy"), stars_normal:sm("normal"), stars_hard:sm("hard"), found_n:Object.keys(rec.found).length });
    setWho("紀錄已儲存");
  } catch(e){ setWho("紀錄暫時存不進去，會再試一次"); dirty = true; setTimeout(() => { saving = false; flush(); }, 8000); return; }
  saving = false; if (dirty){ dirty = false; flush(); }
}
function setWho(t){ const w = $("#who"); if (w) w.textContent = (store.me ? (store.me.name || "已登入") + "・" : "") + t; }
// 等級
const XPLV = [[0, "漢字學徒"], [300, "拼字工匠"], [1000, "字族達人"], [2500, "字源學者"], [5000, "漢字大師"]];
function levelOf(xp){ let i = 0; XPLV.forEach((l, k) => { if (xp >= l[0]) i = k; }); return i; }
function renderLevel(){
  // 老師帳號只是試玩：不顯示等級（等級是學生累積經驗值升級用的）
  if (store.teacher && !store.me){ $("#lvlNum").textContent = "師"; $("#lvlName").textContent = "老師試玩"; $("#lvlXp").textContent = "學生玩才會累積經驗值升級"; $("#lvlBar").style.width = "0%"; return; }
  const i = levelOf(rec.xp), cur = XPLV[i][0], next = XPLV[i + 1] ? XPLV[i + 1][0] : null;
  $("#lvlNum").textContent = i + 1; $("#lvlName").textContent = XPLV[i][1];
  $("#lvlXp").textContent = next ? `${rec.xp} / ${next} XP` : `${rec.xp} XP`;
  $("#lvlBar").style.width = next ? Math.min(100, (rec.xp - cur) / (next - cur) * 100) + "%" : "100%";
}
function addXp(n){ const before = levelOf(rec.xp); rec.xp += Math.round(n); const after = levelOf(rec.xp); renderLevel(); if (after > before){ toast(`升級了！你現在是「${XPLV[after][1]}」`); sfx.win(); } }
// 成就
const BADGES = [
  ["first", "初", "第一個字", "拼出第一個字"],
  ["big4", "大", "大字工匠", "拼出一個用 4 張卡的字"],
  ["combo5", "連", "連擊 5", "一關裡連續拼對 5 個字"],
  ["combo10", "擊", "連擊 10", "一關裡連續拼對 10 個字"],
  ["star3", "星", "三星達人", "任何一關拿到三顆星"],
  ["allclear", "全", "精選全通關", "精選字族的每一關（入門難度）都至少一顆星"],
  ["hardclear", "高", "高手之路", "用高手難度通過一關"],
  ["boss", "形", "形近字剋星", "形近字關拿到三顆星"],
  ["recall8", "憶", "過目不忘", "回想關 8 題全部寫對"],
  ["clearhard", "淨", "清空難字本", "難字本從有字變成沒有字"],
  ["origin15", "源", "字源探險家", "打開 15 次《說文解字》說明"],
  ["bonus5", "寶", "加分字獵人", "找到 5 個加分字"],
  ["lv3", "達", "字族達人", "升到第 3 級"],
];
function unlock(id){ if (rec.badges[id]) return false; rec.badges[id] = Date.now(); const b = BADGES.find(x => x[0] === id); toast(`獲得徽章：${b[2]}`); save(); renderBadges(); return true; }
function checkBadges(){
  if (Object.keys(rec.found).length) unlock("first");
  if (rec.bestCombo >= 5) unlock("combo5"); if (rec.bestCombo >= 10) unlock("combo10");
  if (Object.values(rec.stars).some(m => Object.values(m).some(v => v >= 3))) unlock("star3");
  if (LEVELS[0].stages.every(f => (rec.stars.easy[f.id] || 0) > 0)) unlock("allclear");
  if (Object.values(rec.stars.hard).some(v => v > 0)) unlock("hardclear");
  if (Object.values(rec.stars).some(m => (m["形近字"] || 0) >= 3)) unlock("boss");
  if (rec.originViews >= 15) unlock("origin15");
  if (Object.keys(rec.bonus).length >= 5) unlock("bonus5");
  if (levelOf(rec.xp) >= 2) unlock("lv3");
}

// ================= 字源 =================
const SCRIPTS = [["oracle", "甲骨文"], ["bronze", "金文"], ["seal", "小篆"]];
function glyphRow(src){
  const row = el("div", {class:"gwrow"});
  SCRIPTS.forEach(([k, label]) => { const g = GLYPHS[src + "-" + k]; if (!g) return;
    const s = el("span", {class:"gw", role:"img", "aria-label":src + " " + label}); s.style.setProperty("--m", `url("data:image/webp;base64,${g}")`);
    row.append(el("figure", {}, [s, el("figcaption", {text:label})])); });
  if (!row.children.length) return null;
  row.append(el("span", {class:"arrow", text:"→"}), el("figure", {}, [el("span", {class:"kai", text:src}), el("figcaption", {text:"楷書"})]));
  return row;
}
function originBlock(sym){
  const o = ORIGIN[sym]; if (!o) return null;
  const name = sym in RAD && RAD[sym].name !== sym ? RAD[sym].name : (pysOf(sym).length ? "讀 " + pysOf(sym).join("／") : "部件");
  const box = el("div", {class:"origin"}, [el("h4", {}, [el("span", {class:"hz", text:sym}), name])]);
  o.src.forEach(src => { const r = glyphRow(src); if (r) box.append(r); });
  box.append(el("p", {text:o.story}));
  const sw = el("details", {}, [el("summary", {text:"《說文解字》"})]);
  o.sw.split("／").forEach(t => sw.append(el("div", {}, [el("q", {text:t})])));
  sw.addEventListener("toggle", () => { if (sw.open){ rec.originViews++; save(); checkBadges(); } });
  box.append(sw);
  return box;
}

// ================= 難度設定 =================
const DIFF = {
  easy:  { name:"入門", hearts:0, clue:"full",  check:"auto",   extra:3,  perChar:0,  info:"看拼音和詞猜字，放上卡片就會自動檢查，拼錯不扣分。適合第一次玩。" },
  normal:{ name:"進階", hearts:5, clue:"word",  check:"submit", extra:6,  perChar:0,  info:"只給詞，沒有拼音和卡片數；要按「確定」才檢查，拼錯扣一顆心。干擾卡變多。" },
  /* NOLISTEN_V1409 高手原本是 clue:"audio"——不給詞也不給拼音，只放聲音，
     那就是 Quinn 不要的那種聽力考試。改成 clue:"word"（只給詞，不給拼音）。
     「一題一題來」本來是綁在 clue==="audio" 上的，改用獨立的 seq 旗標，
     這樣拿掉聲音之後，一題一題的節奏還在，高手不會退化成進階。 */
  hard:  { name:"高手", hearts:3, clue:"word", seq:true, check:"submit", extra:10, perChar:20, info:"一題一題來，只給詞、不給拼音；拼錯扣一顆心，還有倒數計時（可以關掉）。剩下的時間會變成加分。" },
  battle:{ name:"對戰", hearts:0, clue:"full",  check:"auto",   extra:4,  perChar:0,  info:"" }
};

/* ══════ HZTIMER_V1406 高手難度的倒數計時，學生可以自己關掉 ══════
   高手是「只聽讀音拼字、3 顆心、10 張干擾卡」，再加每字 20 秒倒數，
   對初學的越南學生壓力太大，很多人會因為趕時間而不敢挑這個難度。
   預設還是有倒數（想拚時間加分的人不受影響），但給一個開關；
   關掉之後不計時，自然也就沒有時間加分——難度本身沒有變簡單。
   存在這台裝置的 localStorage，跟音效（zzgf-snd）同一個做法。 */
function timerOff(){ return ls.get("hz-notimer") === "1"; }
function perCharOf(D){ return (D && D.perChar && !timerOff()) ? D.perChar : 0; }
function renderTimerToggle(){
  const info = document.getElementById("diffInfo"); if (!info) return;
  let w = document.getElementById("hz-timeropt");
  if (!DIFF[diff] || !DIFF[diff].perChar){ if (w) w.remove(); return; }   /* 只有高手才出現 */
  if (!w){
    w = document.createElement("label");
    w.id = "hz-timeropt";
    w.style.cssText = "display:inline-flex;align-items:center;gap:7px;min-height:32px;margin:0 0 6px;font-size:13px;cursor:pointer";
    const cb = document.createElement("input");
    cb.type = "checkbox"; cb.id = "hz-notimer-cb";
    cb.style.cssText = "width:auto;margin:0;min-width:18px;min-height:18px";
    cb.onchange = () => { ls.set("hz-notimer", cb.checked ? "1" : "0"); };
    w.append(cb, document.createTextNode("關掉倒數計時（不趕時間，但就沒有時間加分）"));
    info.insertAdjacentElement("afterend", w);
  }
  const cb = document.getElementById("hz-notimer-cb"); if (cb) cb.checked = timerOff();
}

// ================= 部首的位置 =================
// HZPOS[字] = "LR0"：兩個部件各在哪裡（L 左、R 右、T 上、B 下、O 外、I 內），最後一碼是字典部首是第幾個部件（- 表示不知道）
const HZP = window.HZPOS || {};
const posOf = (c, sym) => { const e = CH[c], v = HZP[c]; if (!e || !e.p || !v) return ""; const i = e.p.indexOf(sym); return i >= 0 && i < 2 ? v[i] : ""; };
function dictRad(c, parts){ const v = HZP[c], e = CH[c]; if (!c || !v || !e || !e.p || v[2] === "-") return ""; const r = e.p[Number(v[2])]; return parts.includes(r) ? r : ""; }
// 「日字旁」這種名字只有放在左邊才對；放在上面叫「日字頭」，在別的位置就只說位置
const STANDALONE = n => /^(.)字(旁|頭|底)$/.exec(n || "");
function radName(sym, c){
  const n = RAD[sym] ? RAD[sym].name : ""; const m = STANDALONE(n); if (!m || m[1] !== sym) return n;
  const p = c ? posOf(c, sym) : "";
  return { L:sym + "字旁", T:sym + "字頭", B:sym + "字底", R:"在右邊", I:"在裡面", O:"在外面" }[p] || "";
}
// 卡片上：本身就是一個字的部首（日、木、口……）不寫「字旁」，寫讀音
const radCardLabel = sym => { const n = RAD[sym] ? RAD[sym].name : ""; const m = STANDALONE(n); return m && m[1] === sym ? (pyOf(sym) || sym) : n; };
// 少數字的字理要特別說明（自動規則講不清楚的）
const ZILI = {
  "做": "「做」是「作」的後起字（《說文》只收「作」：起也，从人从乍）。亻表示人，人去「做」事；右邊的「故」只是字形，不表音",
  "閒": "《說文》：「閒，隙也。从門从月。」晚上關上門，月光從門縫照進來，表示「縫隙」，後來引申為「有空」。部首是「門」；這裡的「月」是月亮，不是肉月。「門」和「月」都是表示意思，不表讀音",
  "間": "「間」本來寫作「閒」，《說文》：「閒，隙也。从門从月。」晚上關上門，月光從門縫照進來，表示「縫隙、中間」。後來把「月」寫成「日」，就成了「間」。部首是「門」；「門」和「日」都是表示意思，不表讀音"
};
// 韻母核心：去掉聲母和介音，ing≈eng、in≈en，用來判斷「讀音相近」
const pyFinal = p => toneless(p).replace(/^(zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])/, "").replace(/^[iuvü](?=[aeo])/, "").replace(/^ing$/, "eng").replace(/^in$/, "en");
function zili(parts, c, WHYPY){
  if (c && ZILI[c]) return ZILI[c];
  const SKIP = "口十八丷冂厶亠一丁";
  // 每個部件的讀音和這個字比一比（多音的部件挑最接近的讀音）
  const rk = p => toneless(p) === toneless(WHYPY) ? 2 : (pyFinal(p) && pyFinal(p) === pyFinal(WHYPY) ? 1 : 0);
  const sound = s => { if (!WHYPY || !pyOf(s) || SKIP.indexOf(s) >= 0) return null; const all = pysOf(s).map(p => p.split(/[\/,，、 ]/)[0]); const a = all.slice().sort((p, q) => rk(q) - rk(p))[0]; return { s, all, a, k:rk(a) }; };
  const snd = parts.map(sound).filter(Boolean);
  const dr = dictRad(c, parts);
  // 聲音線索：讀音最接近的部件（同分時，不是部首卡的優先）；字典部首只有讀音完全一樣才算聲音線索
  const ph = snd.filter(x => x.k === 2 || (x.k === 1 && x.s !== dr)).sort((x, y) => y.k - x.k || (x.s in RAD) - (y.s in RAD) || (x.s === dr) - (y.s === dr))[0] || null;
  // 表示意思的部件：部首卡裡、不是聲音線索的那個；字典部首優先
  const cand = parts.filter(s => s in RAD && (!ph || s !== ph.s));
  const r = cand.includes(dr) ? dr : cand[0];
  const bits = [];
  if (dr && dr !== r && (!ph || dr !== ph.s) && !(dr in RAD)) bits.push(`「${dr}」是這個字的部首`);
  const nm = r ? radName(r, c) : "", rn = nm && nm !== r ? `（${nm}）` : "";
  // 「月」在左邊、下面多半是肉月；在右邊、裡面多半是月亮
  const hint = r === "月" && /[RIO]/.test(posOf(c, r)) ? "月亮、時間" : r && RAD[r].hint;
  if (r && hint) bits.push(`${r}${rn}表示「${hint.replace(/\n/g, "；")}」`);
  else if (r) bits.push(`${r}${rn}`);
  const x = ph || snd.find(z => z.s !== r);
  if (x){
    const head = x.all.length > 1 ? `「${x.s}」有 ${x.all.length} 個讀音（${x.all.join("／")}），讀 ${x.a} 時` : `「${x.s}」讀 ${x.a}，`;
    if (x.k === 2) bits.push(head + (x.a.toLowerCase() === String(WHYPY).toLowerCase() ? "和這個字的讀音一樣，是聲音線索" : "和這個字只差聲調，是聲音線索"));
    else if (x.k === 1) bits.push(head + "和這個字的讀音相近，可以當聲音線索");
    else bits.push(`「${x.s}」` + (toneless(x.a) !== x.a.toLowerCase() ? `（${x.all.join("／")}）` : "") + `跟這個字的讀音不同，不是讀音線索`);
  }
  return bits.join("；");
}

// ================= 工坊（關卡核心） =================
// ================= 透明卡（疊字）圖：每個字拆成兩張，放在它在字裡的位置 =================
const OV = {}, OVSH = {}, OVN = 24;
function loadOv(chars){
  const need = [...new Set(chars.filter(Boolean).map(c => c.codePointAt(0) % OVN))];
  return Promise.all(need.map(i => OVSH[i] || (OVSH[i] = fetch(`hz-ov-${String(i).padStart(2, "0")}.json?v=${window.OVV || ""}`).then(r => r.ok ? r.json() : {}).then(d => Object.assign(OV, d)).catch(() => {}))));
}
const ovStyle = img => `--m:url("data:image/webp;base64,${img}")`;
function ovFind(sym){ for (const c in OV){ const v = OV[c]; const i = v[0].indexOf(sym); if (i >= 0) return v[i + 1]; } return null; }
function Shop(root, cfg){
  let st = null;
  const api = {};
  /* ══════ CALM_V1471 課本①拼：不計時、不扣心 ══════
     Quinn 看了提案之後要改這一條。提案寫「預設不計時，以完成與發現規律為主」，
     也寫「不以提示作為處罰」（提示本來就已經不扣星了，見 HZSTAR_V1406）。
     課本那一輪是練習，不是挑戰，所以不管學生在上面選的是哪個難度，
     進到①拼一律拿掉倒數和生命值；題目難度（給不給拼音、要不要按確定、
     干擾卡幾張、一題一題還是自由順序）照她選的走，沒有變簡單。
     關卡地圖那邊（stageShop）不帶 calm，照原本的規則。 */
  function diffOf(){ const d = DIFF[st.diff]; return st.calm ? Object.assign({}, d, { hearts:0, perChar:0 }) : d; }
  function build(){
    root.innerHTML = "";
    const D = diffOf();
    // 狀態列
    const bar = el("div", {class:"stagebar"});
    const scoreB = el("b", {text:"0"}), comboB = el("b", {class:"combo", text:"—"}), progB = el("b", {text:"0／0"});
    const hearts = el("div", {class:"hearts"}); const timerB = el("b", {class:"timer", text:""});
    bar.append(el("span", {class:"ttl", text: cfg.title ? cfg.title(st) : st.fams.join("、")}));
    bar.append(el("div", {class:"stat"}, [el("small", {text:"分數"}), scoreB]));
    bar.append(el("div", {class:"stat"}, [el("small", {text:"進度"}), progB]));
    bar.append(el("div", {class:"stat"}, [el("small", {text:"連擊"}), comboB]));
    if (D.hearts) bar.append(el("div", {class:"stat"}, [el("small", {text:"生命"}), hearts]));
    if (perCharOf(D)) bar.append(el("div", {class:"stat"}, [el("small", {text:"時間"}), timerB]));
    const right = el("div", {class:"right"});
    const hintB = el("button", {class:"btn small", text:"提示"}); hintB.onclick = hint;
    right.append(hintB);
    if (cfg.onQuit){ const q = el("button", {class:"btn small", text:"回地圖"}); q.onclick = () => { stopTimer(); cfg.onQuit(); }; right.append(q); }
    bar.append(right);
    root.append(bar);
    // 主體
    const left = el("div", {class:"box"}), rightBox = el("div", {class:"box"});
    const shop = el("div", {class:"shop"}, [left, rightBox]); root.append(shop);
    /* ══════ PZ_V1470 ①拼 改成一次一題 ══════
       Quinn：「這裡的這個遊戲我覺得設計很不美，很醜欸」。原本是左右兩欄：
       左欄把六題的提示卡全部攤開，可是一次只做得了一題，另外五張只是佔位子，
       下面整片空白（左欄的高度是被右欄撐出來的）。
       改成單欄、一次一題：上面一排進度點（做完的那一格直接顯示拼出來的字），
       中間是放大的當題，再下面是疊字板和卡片。手機和投影是同一個樣子。
       非 seq 的難度可以點進度點跳題（st.pick），順序自由還在。 */
    const qcard = el("div", {class:"qcard"}); const clues = el("div", {class:"clues dots"});
    const sb = el("button", {class:"say big", "aria-label":"聽這個詞"}); sb.innerHTML = SPEAK; sb.onclick = () => sayCurrent();
    qcard.append(sb, el("div", {}, [el("div", {class:"qt"}), el("div", {class:"qh"})]));
    /* ══════ TWOCOL_V1471 改回左右兩欄，但照提案的分法 ══════
       V1470 我把它改成單欄，因為原本的兩欄左邊只放提示卡、下面空一大片。
       Quinn 讀了提案之後要用提案的分法：左區放任務、題號和疊卡字框，
       右區放候選卡和說明。左邊有字框就不會空了——他們是用另一個方式
       解掉同一個問題。手機維持上下排（@media 一欄）。 */
    left.append(clues, qcard, el("p", {class:"muted", style:"font-size:13px;margin:10px 0 12px", text: D.seq
      ? "每一題只要拼「一個字」。看詞拼出被挖掉的那個字就好；想聽讀音可以按喇叭。拼錯兩次以後會出現拼音提示。"
      : "看詞猜猜□是哪個字，然後用右邊的卡片疊出來。上面的圓點可以跳到別題。"}));
    const mat = el("div", {class:"mat"});
    const bench = el("div", {class:"bench", "aria-label":"工作檯"});
    const msg = el("div", {class:"benchmsg"});
    const clearB = el("button", {class:"btn small", text:"清空"});
    const okB = el("button", {class:"btn primary", text:"確定"});
    const acts = el("div", {class:"row"}, [clearB]); if (D.check === "submit") acts.append(okB);
    /* TWOCOL_V1471 照提案的分區：左邊是任務和字框，右邊是候選卡、答案檢查、說明。
       所以「清空／確定」和回饋訊息從字框底下搬到右欄卡片下面。 */
    const benchact = el("div", {class:"benchact"}, [msg, acts]);
    mat.append(el("h3", {text:"工作檯"}), bench);
    const result = el("div", {class:"result", hidden:""});
    const trayBuilt = el("div", {class:"tray"}), trayAll = el("div", {class:"tray"});
    const lblBuilt = el("div", {class:"traylabel", text:"已拼出的字（可以拿來升級成更大的字）"});
    // 卡片緊接在疊字板下面；拼出來的字的說明放在最下面，不會把卡片擠到畫面外
    /* PZ_V1470 Quinn：「應該是不需要把部件卡跟部首卡分出來吧？」——對，而且不只是好看的問題。
       拆成兩排等於先講「上排挑一張、下排挑一張」，學生知道是「陳」的時候，
       根本不用判斷 阝 跟 東 哪個表意哪個表音，一排挑一個就湊出來了。
       合成一排他才真的要想。「部首表意、聲符表音」本來就寫在答對之後的「字理」那一行，
       教學沒有少，只是移到他拼出來之後才講——那時候他看得懂。 */
    /* TWOCOL_V1471 疊字板搬到左欄，跟任務放在一起；右欄只放卡片和說明。 */
    left.append(mat);
    rightBox.append(lblBuilt, trayBuilt, el("div", {class:"traylabel", text:"卡片"}), trayAll, benchact, result);
    Object.assign(st.ui, { bar, scoreB, comboB, progB, hearts, timerB, qcard, clues, bench, msg, okB, result, trayBuilt, trayAll, lblBuilt, shop, hintB });
    clearB.onclick = () => { st.bench = []; renderBench(); setMsg(""); };
    okB.onclick = submit;
  }
  function setMsg(t, cls = ""){ st.ui.msg.className = "benchmsg " + cls; st.ui.msg.textContent = t; }
  function kindOf(sym){ return sym in RAD ? "rad" : (SCOPE.has(sym) && st.found.has(sym)) ? "built" : "comp"; }
  function cardEl(sym, kind, i){
    const b = el("button", {class:"card " + kind + " deal", type:"button", "aria-label":sym, "data-sym":sym});
    b.style.animationDelay = (i * 22) + "ms";
    const label = kind === "rad" ? radCardLabel(sym) : kind === "comp" ? (diffOf().clue === "full" ? pyOf(sym) : "") : (CH[sym] ? CH[sym].py : "");
    const img = st.ovMode && (st.ov[sym] || ovFind(sym));
    if (img){ b.classList.add("ovc"); const m = el("span", {class:"ovm"}); const i = el("i"); i.setAttribute("style", ovStyle(img)); m.append(i);
      b.append(m, el("span", {class:"l", text: sym + (label ? " " + label : "")})); }
    else b.append(el("span", {class:"s", text:sym}), el("span", {class:"l", text:label}));
    b.title = kind === "rad" ? `${RAD[sym].name}：${RAD[sym].hint.replace(/\n/g, " ")}` : sym;
    attachDrag(b, sym); return b;
  }
  function attachDrag(b, sym){
    let sx, sy, ghost = null, id = null; const bench = () => st.ui.bench;
    const inside = e => { const r = bench().getBoundingClientRect(); return e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom; };
    b.addEventListener("pointerdown", e => { if (st.locked) return; id = e.pointerId; sx = e.clientX; sy = e.clientY; try { b.setPointerCapture(id); } catch(_){} });
    b.addEventListener("pointermove", e => { if (e.pointerId !== id) return;
      if (!ghost && Math.hypot(e.clientX - sx, e.clientY - sy) > 6){ ghost = b.cloneNode(true); ghost.classList.remove("deal", "glow"); ghost.classList.add("ghost"); document.body.append(ghost); }
      if (ghost){ ghost.style.left = e.clientX + "px"; ghost.style.top = e.clientY + "px"; bench().classList.toggle("over", inside(e)); } });
    const end = e => { if (e.pointerId !== id) return; id = null;
      if (ghost){ ghost.remove(); ghost = null; bench().classList.remove("over"); if (e.type === "pointerup" && inside(e)) add(sym); }
      else if (e.type === "pointerup") add(sym); };
    b.addEventListener("pointerup", end); b.addEventListener("pointercancel", end);
    b.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " "){ e.preventDefault(); add(sym); } });
  }
  function renderBench(showT){
    const bench = st.ui.bench; bench.innerHTML = ""; bench.classList.remove("wrong", "right");
    if (st.ovMode){
      if (st.ui.okB) st.ui.okB.disabled = st.bench.length < 2;
      // 疊字板：卡片疊在同一個方格裡
      const board = el("div", {class:"ovboard"});
      const k = keyOf(st.bench); const t = showT || (st.bench.length >= 2 ? (KEYMAP[k] || []).find(x => OV[x]) : null);
      const layers = t && OV[t] ? [OV[t][1], OV[t][2]] : st.bench.map(sy => st.ov[sy] || ovFind(sy));
      layers.forEach((img, i) => { if (img){ const L = el("i", {class:"ovl"}); L.setAttribute("style", ovStyle(img)); board.append(L); }
        else if (!t){ board.append(el("span", {class:"ovtxt", text:st.bench[i]})); } });
      if (!st.bench.length && !showT){ const nx = st.targets && st.targets.find(c => !st.found.has(c)); const D = diffOf();
        board.append(el("div", {class:"empty"}, nx && st.found.size && !D.seq ? [el("b", {class:"ovnext", text:"下一個：" + blankWord(CH[nx])}), el("br"), "把透明卡疊到這裡"] : ["把透明卡疊到這裡"])); }
      if (showT) board.classList.add("done");
      bench.append(board);
      if (st.bench.length){ const chips = el("div", {class:"ovchips"});
        st.bench.forEach((sy, i) => { const c = el("button", {class:"btn small", type:"button", title:"點一下拿回去", text:sy + " ✕"}); c.onclick = () => { st.bench.splice(i, 1); renderBench(); setMsg(""); }; chips.append(c); });
        bench.append(chips); }
      return;
    }
    if (st.ui.okB) st.ui.okB.disabled = st.bench.length < 2;
    if (!st.bench.length){ bench.append(el("div", {class:"empty", text:"把卡片拖到這裡，或點一下卡片"})); return; }
    st.bench.forEach((s, i) => {
      if (i) bench.append(el("span", {class:"plus", text:"＋"}));
      const c = el("button", {class:"card " + kindOf(s), type:"button", title:"點一下拿回去"}, [el("span", {class:"s", text:s}), el("span", {class:"l", text:"拿回"})]);
      c.onclick = () => { st.bench.splice(i, 1); renderBench(); setMsg(""); };
      bench.append(c);
    });
  }
  function add(sym){
    if (st.locked || st.over) return;
    if (st.bench.length >= 4){ setMsg("工作檯最多放 4 張卡。", "bad"); return; }
    sfx.pick(); st.bench.push(sym); renderBench();
    if (diffOf().check === "auto") autoCheck(); else setMsg("");
  }
  function current(){ return st.seq ? st.targets.find(c => !st.found.has(c)) : null; }
  function autoCheck(){
    const k = keyOf(st.bench); const cs = KEYMAP[k] || []; const c = cs.find(x => !st.found.has(x)) || cs[0];
    if (c && st.bench.length >= 2){
      if (st.found.has(c)){ setMsg(`「${c}」已經拼過了。可以再加卡，升級成更大的字。`); if (!canGrow(st.bench)){ st.bench = []; setTimeout(renderBench, 900); } return; }
      return success(c, false);
    }
    const b = BONKEY[st.bench.slice().sort().join("|")]; if (b && st.bench.length >= 2 && !st.bonus.has(b)) return success(b, true);
    const other = st.bench.length >= 2 && TOP[st.bench.slice().sort().join("|")];
    if (other && !SCOPE.has(other)){ st.ui.bench.classList.add("wrong"); setMsg(`「${other}」是真的字，但不在這一關。點卡片拿回去再試試。`, "bad"); return; }
    if (!canGrow(st.bench)){ st.ui.bench.classList.add("wrong"); setMsg("這樣拼不出字，點卡片拿回去再試試。", "bad"); }
    else if (st.bench.length >= 2) setMsg("還不是一個字，可以再加卡。");
  }
  function submit(){
    if (st.locked || st.over || st.bench.length < 2) return;
    const k = keyOf(st.bench), cs = KEYMAP[k] || [], cur = current();
    const c = st.seq ? (cs.includes(cur) ? cur : cs[0]) : (cs.find(x => !st.found.has(x)) || cs[0]);
    const b = BONKEY[st.bench.slice().sort().join("|")];
    const other = !c && TOP[st.bench.slice().sort().join("|")];
    if (other && !SCOPE.has(other)){ setMsg(`「${other}」是真的字，但不在這一關，不扣分。`); return; }
    if (c && st.found.has(c)){ setMsg(`「${c}」已經拼過了，不扣分。`); return; }
    if (c && (st.seq ? c === cur : st.targets.includes(c))) return success(c, false);
    if (!st.seq && b && !st.bonus.has(b)) return success(b, true);
    if (c && !st.seq){ setMsg(`「${c}」是真的字，但不在這一關，不扣分。`); return; }
    mistake(c ? `「${c}」不是這一題的答案。` : "這樣拼不出正確的字。");
  }
  function mistake(text){
    const D = diffOf();
    st.mistakes++; st.combo = 0; st.curMiss++; sfx.bad();
    st.ui.bench.classList.add("wrong"); setMsg(text + (D.hearts ? " 扣一顆心。" : ""), "bad");
    if (D.hearts){ st.hearts--; renderStatus(); if (st.hearts <= 0) return finish(false, "生命用完了"); }
    renderStatus(); renderClues();
  }
  function success(c, isBonus){
    const x = isBonus ? BON[c] : CH[c];
    const n = isBonus ? 2 : Math.max(2, expand(c).length);
    if (isBonus){ st.bonus.add(c); rec.bonus[c] = 1; } else { st.found.add(c); rec.found[c] = (rec.found[c] || 0) + 1; }
    st.combo++; st.bestCombo = Math.max(st.bestCombo, st.combo); rec.bestCombo = Math.max(rec.bestCombo, st.combo);
    const mult = 1 + Math.min(st.combo - 1, 10) * .1;
    const pts = Math.round(n * 10 * mult);
    st.score += pts; st.curMiss = 0;
    const [bx, by] = centerOf(st.ui.bench);
    burst(bx, by, 18 + n * 6); popText(bx, by - 30, `+${pts}` + (st.combo > 1 ? `　連擊 ×${st.combo}` : ""));
    if (st.combo > 1) sfx.combo(Math.min(st.combo, 8)); else sfx.good();
    if (st.ovMode && OV[c]){ st.bench = []; renderBench(c); st.ui.bench.classList.add("right"); const me = st; setTimeout(() => { if (st === me && !st.bench.length) renderBench(); }, 1600); }
    else { st.bench = []; renderBench(); st.ui.bench.classList.add("right"); }
    { const left = st.targets.filter(t => !st.found.has(t) && t !== c).length;
      setMsg((isBonus ? `加分字！「${c}」` : `${st.ovMode ? "疊" : "拼"}出來了！「${c}」`) + (left ? `　接著做下一題（還有 ${left} 個字），題目在上面，卡片在下面。` : ""), "good");
      if (left) setTimeout(() => { const cl = st.ui.clues.querySelector(".pzdot.cur"); if (cl){ cl.classList.add("nextup"); setTimeout(() => cl.classList.remove("nextup"), 2500); } }, 300); }
    if (!isBonus && n >= 4) unlock("big4");
    checkBadges();
    showResult(x, isBonus); say(x.c + "，" + x.w);
    renderClues(); buildTray(false); renderStatus();
    save(); cfg.onScore && cfg.onScore(st);
    if (st.targets.every(t => st.found.has(t))) setTimeout(() => finish(true), 1300);
    /* NOLISTEN_V1409 原本每題會自動唸出來，現在聲音只在學生自己按喇叭時才響。 */
  }
  let WHYPY = "";
  const why = (parts, c) => zili(parts, c, WHYPY);
  function showResult(x, isBonus){
    const result = st.ui.result; result.hidden = false; result.innerHTML = "";
    const parts = isBonus ? x.p : (CH[x.c].p || []);
    const hw = el("div", {class:"hw"});
    const info = el("div", {}, [el("div", {class:"big"}, [el("b", {text:x.c}), "　" + x.py + "　" + x.w]),
      el("div", {class:"why", text: isBonus ? "加分字" : "記憶提示：" + x.tip}), ...(isBonus || !pyLine(x) ? [] : [el("div", {class:"why", text: pyLine(x)})]), el("div", {class:"why", text:(WHYPY = x.py, "字理：" + why(parts, isBonus ? "" : x.c))})]);
    const sayB = el("button", {class:"btn small", text:"聽讀音"}); sayB.onclick = () => say(x.c + "，" + x.w);
    const againB = el("button", {class:"btn small", text:"再看一次筆順"});
    const acts = el("div", {class:"acts"}, [sayB, againB]);
    const left = st.targets.filter(t => !st.found.has(t)).length;
    if (left){ const nx = el("button", {class:"btn small primary", text:`繼續${st.ovMode ? "疊" : "拼"}下一個字（還有 ${left} 個）→`});
      nx.onclick = () => { result.hidden = true; const cl = st.ui.clues.querySelector(".pzdot.cur"); if (cl){ cl.classList.add("nextup"); setTimeout(() => cl.classList.remove("nextup"), 1600); }
        st.ui.bench.scrollIntoView({behavior:"smooth", block:"center"}); setMsg("看上面的題目，把下一個字拼出來。"); };
      acts.append(nx); }
    info.append(acts);
    result.append(hw, info);
    const og = el("div", {class:"origins"}); [...new Set(parts.flatMap(x => expand(x)))].forEach(b => { const ob = originBlock(b); if (ob) og.append(ob); });
    if (og.children.length) result.append(og);
    if (window.HanziWriter){
      const w = HanziWriter.create(hw, x.c, { width:140, height:140, padding:8, strokeColor:css("--navy"), outlineColor:css("--line"), strokeAnimationSpeed:1.3, delayBetweenStrokes:160 });
      w.animateCharacter(); againB.onclick = () => w.animateCharacter();
    } else { hw.append(el("div", {class:"hz", style:"font-size:100px;text-align:center;line-height:140px", text:x.c})); againB.hidden = true; }
  }
  /* PZ_V1470 現在在做哪一題：seq 的難度照舊「由上往下」，
     其他難度可以按上面的進度點跳題（st.pick）。 */
  function curTarget(){
    if (!st.targets) return null;
    if (!st.seq && st.pick && st.targets.includes(st.pick) && !st.found.has(st.pick)) return st.pick;
    return st.targets.find(c => !st.found.has(c)) || null;
  }
  function renderClues(){
    const D = diffOf(), clues = st.ui.clues; clues.innerHTML = "";
    const cur = curTarget();
    /* PZ_V1470 進度點：做完的直接顯示那個字，沒做的顯示題號，正在做的反白。 */
    st.targets.forEach((c, i) => {
      const done = st.found.has(c);
      const d = el("button", {class:"pzdot" + (done ? " done" : "") + (c === cur ? " cur" : ""), type:"button",
        title: done ? `第 ${i + 1} 題　${c}　完成` : `第 ${i + 1} 題`,
        "aria-label": done ? `第 ${i + 1} 題 已完成` : `第 ${i + 1} 題`,
        text: done ? c : String(i + 1)});
      if (done || D.seq || c === cur) d.disabled = true;
      else d.onclick = () => { st.pick = c; st.bench = []; renderClues(); renderBench(); setMsg(""); };
      clues.append(d);
    });
    const q = st.ui.qcard;
    if (cur){
      const x = CH[cur];
      q.hidden = false;
      const n = expand(cur).length;
      q.querySelector(".qt").textContent = `第 ${st.targets.indexOf(cur) + 1}／${st.targets.length} 題　這個字要 ${n} 張卡`;
      q.querySelector(".qh").textContent = (D.clue === "full" || st.curMiss >= 2 || st.hintLevel) ? `${x.py}　${blankWord(x)}` : blankWord(x);
    } else q.hidden = true;
  }
  function sayCurrent(){ const c = curTarget(); if (c) say(sayQ(CH[c])); }/* PZ_V1470 非 seq 的難度也要能按喇叭 */
  function renderStatus(){
    const u = st.ui, D = diffOf();
    u.scoreB.textContent = st.score; u.comboB.textContent = st.combo > 1 ? "×" + st.combo : "—";
    u.progB.textContent = `${st.targets.filter(c => st.found.has(c)).length}／${st.targets.length}`;
    if (D.hearts) u.hearts.innerHTML = Array.from({length:D.hearts}, (_, i) => HEART(i < st.hearts)).join("");
  }
  function buildTray(deal = true){
    const D = diffOf();
    const need = new Set(st.targets.flatMap(c => expand(c)));
    let rads = [...need].filter(s => s in RAD), comps = [...need].filter(s => !(s in RAD));
    if (!st.extras){
      // 干擾卡：從同一個等級的其他關卡挑
      const lvPieces = new Set(); (LEVELS[st.stage.li] || LEVELS[0]).stages.forEach(sg => sg.chars.forEach(c => (CH[c].p || []).forEach(p => lvPieces.add(p))));
      const pool = [...lvPieces].filter(s => !need.has(s));
      st.extras = { r: shuffle(pool.filter(s => s in RAD), st.rnd).slice(0, D.extra), c: shuffle(pool.filter(s => !(s in RAD)), st.rnd).slice(0, D.extra) };
    }
    rads = rads.concat(st.extras.r); comps = comps.concat(st.extras.c);
    const oR = Object.keys(RAD), oC = [...need].filter(s => !(s in RAD)).concat(Object.keys(COMP));
    if (D.clue === "full"){ rads.sort((a, b) => oR.indexOf(a) - oR.indexOf(b)); }
    else { rads = shuffle(rads.sort(), seeded(st.seed)); comps = shuffle(comps.sort(), seeded(st.seed + 1)); }
    const u = st.ui;
    /* PZ_V1470 兩排併成一排。順序也要洗過——照「先全部部首、再全部部件」排下去，
       等於換個方式把拆開這件事講出來，那就白合併了。 */
    if (deal){ u.trayAll.innerHTML = "";
      shuffle(rads.map(s => [s, "rad"]).concat(comps.map(s => [s, "comp"])), seeded(st.seed + 2))
        .forEach(([s, k], i) => u.trayAll.append(cardEl(s, k, i))); }
    u.trayBuilt.innerHTML = "";
    const built = [...st.found].filter(c => canGrow([c]));
    built.forEach((c, i) => u.trayBuilt.append(cardEl(c, "built", 0)));
    u.lblBuilt.hidden = u.trayBuilt.hidden = !built.length;
    if (!deal) u.trayAll.querySelectorAll(".card").forEach(c => c.classList.remove("deal", "glow"));
  }
  function hint(){
    if (st.over) return;
    const target = current() || st.targets.find(c => !st.found.has(c)); if (!target) return;
    st.hints++; st.hintLevel = 1;
    const parts = expand(target);
    const show = st.hints >= 2 ? parts : (parts.filter(s => s in RAD).slice(0, 1).length ? parts.filter(s => s in RAD).slice(0, 1) : parts.slice(0, 1));
    document.querySelectorAll("#" + root.id + " .tray .card").forEach(c => c.classList.toggle("glow", show.includes(c.dataset.sym)));
    /* HZSTAR_V1406 提示已經不扣星了，這兩句不能再寫「最多兩顆星」，不然畫面在騙學生。 */
    setMsg(st.hints >= 2 ? "發光的卡片可以拼出一個字。" : "先試試發光的那一張卡。");/* PZ_V1470 卡片已經不分兩排了 */
    renderClues();
  }
  // 計時
  function startTimer(){
    const D = diffOf(); const per = perCharOf(D); if (!per) return;
    st.deadline = Date.now() + (per * st.targets.length + 20) * 1000;
    st.tick = setInterval(() => { const left = Math.max(0, st.deadline - Date.now()); const s = Math.ceil(left / 1000);
      st.ui.timerB.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); st.ui.timerB.classList.toggle("low", s <= 15);
      if (left <= 0) finish(false, "時間到了"); }, 250);
  }
  function stopTimer(){ if (st && st.tick){ clearInterval(st.tick); st.tick = null; } }
  function finish(ok, reason){
    if (st.over) return; st.over = true; stopTimer(); st.locked = true; root.classList.add("locked");
    let stars = 0, timeBonus = 0;
    if (ok){
      /* HZSTAR_V1406 提示不再扣星，只看拼錯幾次。
         原本用了提示最多兩顆，等於在懲罰求助；提示本來就是讓學生學會的工具，
         初學的越南學生最需要它。拼錯還是照扣，所以「會不會」仍然算得準。 */
      stars = st.mistakes === 0 ? 3 : (st.mistakes <= 2 ? 2 : 1);
      if (st.deadline) timeBonus = Math.round(Math.max(0, st.deadline - Date.now()) / 1000) * 2;
    }
    const total = st.score + timeBonus;
    if (cfg.onEnd) cfg.onEnd({ ok, reason, stars, score:st.score, timeBonus, total, st });
  }
  api.start = (opt) => {
    stopTimer();
    const stage = opt.stage;
    st = { stage, fams:[stage.id], diff:opt.diff, seq: !!DIFF[opt.diff].seq, calm: !!opt.calm/* CALM_V1471 */ /* NOLISTEN_V1409 */, seed: opt.seed || Math.floor(Math.random() * 1e9), ui:{}, bench:[], found:new Set(), bonus:new Set(),
      score:0, combo:0, bestCombo:0, mistakes:0, hints:0, hintLevel:0, curMiss:0, hearts: opt.calm ? 0 : DIFF[opt.diff].hearts, locked:false, over:false, extras:null };
    st.rnd = seeded(st.seed);
    let targets = stage.chars.filter(c => CH[c] && CH[c].p);
    setScope(targets, !!stage.curated);
    // 多層字要在基礎字後面出現（高手一題一題時，也照順序出）
    targets = st.seq ? shuffle(targets, st.rnd).sort((a, b) => expand(a).length - expand(b).length) : targets;
    st.targets = targets;
    root.classList.remove("locked");
    st.ov = {}; st.ovMode = false;
    build(); renderClues(); renderBench(); buildTray(true); renderStatus(); startTimer();
    const me = st;
    loadOv(targets.concat(targets.flatMap(c => expand(c)))).then(() => {
      if (st !== me || !targets.some(c => OV[c])) return;
      targets.concat(Object.keys(OV).filter(c => SCOPE.has(c))).forEach(c => { const v = OV[c]; if (v) v[0].forEach((sy, i) => { if (!st.ov[sy]) st.ov[sy] = v[i + 1]; }); });
      st.ovMode = true; root.classList.add("ovmode"); renderBench(); buildTray(true);
      const h3 = root.querySelector(".mat h3"); if (h3) h3.textContent = "疊字板：把透明卡疊上去，疊對了就是一個字";
      const tip = root.querySelector(".box > p.muted"); if (tip && !diffOf().seq) tip.textContent = "看拼音和詞，猜猜□是哪個字，然後把右邊的透明卡疊起來。每張卡上的部件，都在它在字裡的位置。";
    });
    /* NOLISTEN_V1409 開場也不自動唸了。 */
  };
  api.lock = v => { if (st){ st.locked = v; root.classList.toggle("locked", v); } };
  api.stop = () => stopTimer();
  api.state = () => st;
  return api;
}

// ================= 分頁 =================
function showTab(name){
  document.querySelectorAll("nav.tabs button").forEach(x => x.setAttribute("aria-selected", x.dataset.tab === name || (name === "stage" && x.dataset.tab === "map")));
  document.querySelectorAll(".panel").forEach(p => p.hidden = p.id !== "p-" + name);
  if (name === "me") renderMe();
  if (name === "map") renderMap();
}
document.querySelectorAll("nav.tabs button").forEach(b => b.onclick = () => { if (b.dataset.tab === "course"){ courseShop.stop(); unpatch(); showCourseHome(); return; } if (b.dataset.tab === "map" && stageShop.state() && !stageShop.state().over && !$("#p-stage").hidden) return; showTab(b.dataset.tab); });

// ================= 關卡地圖 =================
let diff = ls.get("zzgf-diff") || "easy"; if (!DIFF[diff] || diff === "battle") diff = "easy";
function setDiff(d){ diff = d; ls.set("zzgf-diff", d); document.querySelectorAll("#diffSeg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.d === d)); $("#diffInfo").textContent = DIFF[d].info; renderMap(); }
document.querySelectorAll("#diffSeg button").forEach(b => b.onclick = () => setDiff(b.dataset.d));
let curLv = Math.min(LEVELS.length - 1, Math.max(0, Number(ls.get("hz-lv") || 0) || 0));
function setLv(i){ curLv = i; ls.set("hz-lv", String(i)); renderMap(); }
/* HZOPEN_V1406 解鎖改成「難度之間共用」。
   原本是 rec.stars[diff][前一關] > 0：星星分難度記，所以學生把 27 個字族
   在入門全破了，切到進階會整排重新鎖起來，得照順序再破一次才走得到後面。
   已經會的字不該重新鎖。改成任一難度拿過星就算解鎖；關卡順序和
   「前一關要先過」的結構都沒動，只是不再因為換難度而倒退。 */
const DIFFKEYS = ["easy", "normal", "hard"];
function unlocked(stage){
  if (stage.i === 0 || store.teacher) return true;
  if (taskFams().includes(stage.id)) return true;
  const prev = LEVELS[stage.li].stages[stage.i - 1];
  return DIFFKEYS.some(d => ((rec.stars[d] || {})[prev.id] || 0) > 0);
}
function renderLvSeg(){
  const seg = $("#lvSeg"); if (!seg) return; seg.innerHTML = "";
  LEVELS.forEach((L, i) => {
    const got = L.stages.reduce((a, s) => a + (rec.stars[diff][s.id] || 0), 0);
    const b = el("button", {"aria-pressed": i === curLv}, [L.short, el("small", {text:` ${got}／${L.stages.length * 3}`})]);
    b.onclick = () => setLv(i); seg.append(b);
  });
}
function renderMap(){
  renderLvSeg();
  try { renderTimerToggle(); } catch(e){}   /* HZTIMER_V1406 */
  const L = LEVELS[curLv]; const map = $("#map"); map.innerHTML = "";
  let sum = 0;
  $("#lvInfo").textContent = curLv === 0 ? "老師挑選的 27 個字族，有字源和記憶提示。" : `華語八千詞・${L.name}：${L.stages.length} 關、${L.stages.reduce((a, s) => a + s.chars.length, 0)} 個字。關卡依「同一個部件」自動分組。`;
  L.stages.forEach((sg, i) => {
    const stars = rec.stars[diff][sg.id] || 0; sum += stars;
    const open = unlocked(sg), boss = sg.name === "形近字";
    const node = el("button", {class:"node" + (boss ? " boss" : "") + (stars ? " cleared" : ""), type:"button"});
    if (!open) node.setAttribute("disabled", "");
    node.append(el("span", {class:"num", text:String(i + 1)}));
    if (taskFams().includes(sg.id)) node.append(el("span", {class:"tag", text:"作業"}));
    else if (boss) node.append(el("span", {class:"tag", text:"魔王"}));
    node.append(el("span", {class:"seal", text: open ? (sg.key === "綜" ? "綜" : sg.key) : "鎖"}), el("span", {class:"nm", text:sg.name}));
    const s = el("span", {}); s.innerHTML = starsHtml(stars); node.append(s.firstChild);
    node.append(el("span", {class:"cnt", text: open ? sg.chars.join("") : `${sg.chars.length} 個字`}));
    node.onclick = () => { if (open) playStage(sg.id); };
    map.append(node);
  });
  // 不能拆的字（例如「人、山、上」）：放在最後，可以看筆順、聽讀音
  if (curLv > 0){
    const atoms = Object.values(CH).filter(x => x.lv === curLv - 1 && !x.p);
    if (atoms.length){
      const node = el("button", {class:"node basic", type:"button"}, [el("span", {class:"seal", text:"字"}), el("span", {class:"nm", text:"基本字"}), el("span", {class:"cnt", text:`${atoms.length} 個字，不用拼，看筆順`})]);
      node.onclick = () => showBasic(atoms); map.append(node);
    }
  }
  $("#starSum").textContent = `${sum}／${L.stages.length * 3}`;
  renderTasks();
}
function showBasic(atoms){
  const card = $("#endcard"); card.innerHTML = "";
  card.append(el("h2", {text:"基本字"}), el("p", {class:"muted", text:"這些字本身就是一個完整的部件，不需要拼。點一下聽讀音、看筆順。"}));
  const hw = el("div", {class:"hw", style:"margin:12px auto"}); const info = el("p", {class:"muted", style:"min-height:24px;white-space:pre-line"}); const ori = el("div", {class:"origins", style:"text-align:left"});
  const list = el("div", {class:"learned"});
  atoms.forEach(x => { const b = el("button", {text:x.c, title:x.w}); b.onclick = () => {
    say(x.c + "，" + x.w + "的" + x.c); info.textContent = `${x.c}　${x.py}　${x.w}` + (pyLine(x) ? "\n" + pyLine(x) : ""); hw.innerHTML = ""; ori.innerHTML = ""; const ob = originBlock(x.c); if (ob) ori.append(ob);
    if (window.HanziWriter && !NOSTROKE.has(x.c)){ const w = HanziWriter.create(hw, x.c, { width:140, height:140, padding:8, strokeColor:css("--navy"), outlineColor:css("--line"), strokeAnimationSpeed:1.3, delayBetweenStrokes:160 }); w.animateCharacter(); }
    else hw.append(el("div", {class:"hz", style:"font-size:100px;text-align:center;line-height:140px", text:x.c}));
  }; list.append(b); });
  const close = el("button", {class:"btn", text:"關閉"}); close.onclick = closeOverlay;
  card.append(hw, info, ori, list, el("div", {class:"endbtns"}, [close]));
  $("#overlay").hidden = false;
}
// ================= 老師指派的作業 =================
const DNAME = { easy:"入門", normal:"進階", hard:"高手" };
function taskDone(t){ return (rec.stars[t.diff] && (rec.stars[t.diff][t.fam] || 0)) >= (Number(t.min_stars) || 1); }
function openTasks(){ return store.tasks.filter(t => !taskDone(t)); }
function taskFams(){ return [...new Set(openTasks().map(t => t.fam))]; }
function dueLabel(d){
  if (!d) return { t:"沒有截止日", c:"" };
  const t0 = new Date(); t0.setHours(0, 0, 0, 0); const dd = new Date(d + "T00:00:00"); const n = Math.round((dd - t0) / 864e5);
  return n < 0 ? { t:`逾期 ${-n} 天`, c:"late" } : n === 0 ? { t:"今天到期", c:"soon" } : { t:`還有 ${n} 天（${d}）`, c: n <= 3 ? "soon" : "" };
}
function renderTasks(){
  const box = $("#tasks"); if (!box) return;
  box.innerHTML = "";
  if (!store.tasks.length){ box.hidden = true; return; }
  box.hidden = false;
  box.append(el("h3", {text:"老師指派的作業"}));
  const list = el("div", {class:"tasklist"});
  store.tasks.slice().sort((a, b) => taskDone(a) - taskDone(b) || String(a.due_date || "9").localeCompare(String(b.due_date || "9"))).forEach(t => {
    const done = taskDone(t), dl = dueLabel(t.due_date), got = (rec.stars[t.diff] && rec.stars[t.diff][t.fam]) || 0;
    const row = el("div", {class:"task" + (done ? " done" : (dl.c === "late" ? " late" : ""))});
    const s = el("span", {}); s.innerHTML = starsHtml(got);
    row.append(el("div", {class:"tinfo"}, [el("b", {text: t.title || `${stageName(t.fam)}・${DNAME[t.diff] || ""}`}),
      el("small", {text:`${stageName(t.fam)}・${DNAME[t.diff] || ""}難度・至少 ${t.min_stars || 1} 顆星`})]), s.firstChild,
      el("span", {class:"tstate", text: done ? "完成" : dl.t}));
    const go = el("button", {class:"btn small" + (done ? "" : " primary"), text: done ? "再玩一次" : "開始"});
    go.onclick = () => { if (DIFF[t.diff]) setDiff(t.diff); if (STAGES[t.fam]) curLv = STAGES[t.fam].li; playStage(t.fam); };
    row.append(go); list.append(row);
  });
  box.append(list);
}

// ================= 關卡 =================
let curStage = null;
const stageShop = Shop($("#stageRoot"), {
  title: st => `${stageName(st.stage.id)}・${DIFF[st.diff].name}`,
  onQuit: () => showTab("map"),
  onEnd: res => endStage(res)
});
function playStage(id){ if (String(id).startsWith("L:")){ startRound(String(id).slice(2)); return; } if (!STAGES[id]) return; curStage = id; curLv = STAGES[id].li; showTab("stage"); stageShop.start({ stage:STAGES[id], diff }); window.scrollTo({top:0}); }
function endStage(r){
  const st = r.st, prev = rec.stars[st.diff][curStage] || 0;
  if (r.ok){ rec.stars[st.diff][curStage] = Math.max(prev, r.stars); addXp(r.total); sfx.win(); }
  else { addXp(Math.round(r.score / 2)); sfx.lose(); }
  rec.sessions = (rec.sessions || []).concat({ at:Date.now(), mode:"stage", fam:curStage, diff:st.diff, ok:r.ok, stars:r.stars, score:r.total }).slice(-30);
  const before = Object.keys(rec.badges).length; checkBadges(); save();
  const newB = Object.keys(rec.badges).filter(k => rec.badges[k] > Date.now() - 5000);
  // 結算畫面
  const card = $("#endcard"); card.innerHTML = "";
  card.append(el("h2", {text: r.ok ? "過關！" : "差一點！"}));
  card.append(el("p", {class:"muted", text: r.ok ? `${stageName(curStage)}・${DIFF[st.diff].name}` : `${r.reason}。再試一次吧！`}));
  const bs = el("div", {class:"bigstars"});
  [0, 1, 2].forEach(i => { const s = svgEl(STAR(r.ok && i < r.stars)); if (r.ok && i < r.stars){ s.classList.add("pop-in"); s.style.animationDelay = (300 + i * 350) + "ms"; setTimeout(() => sfx.star(i), 300 + i * 350); } bs.append(s); });
  card.append(bs);
  card.append(el("div", {class:"endstats"}, [
    el("div", {}, [el("b", {text:String(r.total)}), el("small", {text: r.timeBonus ? `分數（時間 +${r.timeBonus}）` : "分數"})]),
    el("div", {}, [el("b", {text:"×" + st.bestCombo}), el("small", {text:"最高連擊"})]),
    el("div", {}, [el("b", {text:String(st.mistakes)}), el("small", {text:"拼錯次數"})])]));
  const learned = el("div", {class:"learned"});
  [...st.found].forEach(c => { const b = el("button", {text:c, title:CH[c].w}); b.onclick = () => say(c + "，" + CH[c].w); learned.append(b); });
  if (learned.children.length){ card.append(el("p", {class:"muted", style:"font-size:13px", text:"這一關拼出的字（點一下聽讀音）"}), learned); }
  if (newB.length){ const nb = el("div", {class:"newbadges"}); newB.forEach(k => { const b = BADGES.find(x => x[0] === k); nb.append(el("span", {class:"chipbadge", text:"新徽章：" + b[2]})); }); card.append(nb); }
  if (r.ok && r.stars < 3) card.append(el("p", {class:"muted", style:"font-size:13px;margin-bottom:10px", text:"三顆星的條件：不拼錯。用提示不扣星。"}));
  const btns = el("div", {class:"endbtns"});
  const again = el("button", {class:"btn", text:"再玩一次"}); again.onclick = () => { closeOverlay(); playStage(curStage); };
  const map = el("button", {class:"btn", text:"回地圖"}); map.onclick = () => { closeOverlay(); showTab("map"); };
  const rc = el("button", {class:"btn", text:"用這些字玩回想關"}); rc.onclick = () => { closeOverlay(); showTab("recall"); startRecall([...st.found]); };
  btns.append(again, map); if (st.found.size) btns.append(rc);
  const cs = STAGES[curStage], nxt = cs && LEVELS[cs.li].stages[cs.i + 1];
  if (r.ok && nxt){ const nx = el("button", {class:"btn primary", text:"下一關"}); nx.onclick = () => { closeOverlay(); playStage(nxt.id); }; btns.append(nx); }
  card.append(btns);
  $("#overlay").hidden = false;
  if (r.ok){ setTimeout(() => burst(innerWidth / 2, innerHeight / 2 - 80, 70), 250); }
  setTimeout(() => (btns.querySelector(".primary") || again).focus(), 50);
}
function closeOverlay(){ $("#overlay").hidden = true; }
$("#overlay").addEventListener("keydown", e => { if (e.key === "Escape"){ closeOverlay(); showTab("map"); } });

// ================= 回想關 =================
const R = { list:[], i:0, results:[], writer:null, hint:false, active:false };
function pickRecall(only){
  const pool = []; const add = c => { if (CH[c] && CH[c].w && !NOSTROKE.has(c) && !pool.includes(c)) pool.push(c); };
  if (only && only.length){ shuffle(only).forEach(add); return pool.slice(0, 8); }
  shuffle(Object.keys(rec.hard)).slice(0, 4).forEach(add);
  const fams = taskFams();
  shuffle([...fams.flatMap(id => STAGES[id] ? STAGES[id].chars : []), ...Object.keys(rec.found)]).forEach(c => pool.length < 8 && add(c));
  shuffle(LEVELS[curLv].stages.flatMap(sg => sg.chars)).forEach(c => pool.length < 8 && add(c));
  return shuffle(pool);
}
function startRecall(only){
  R.list = pickRecall(only); R.i = 0; R.results = []; R.active = true; R.hadHard = Object.keys(rec.hard).length > 0;
  $("#rresult").hidden = true; ["#rsay", "#rhint", "#rskip"].forEach(s => $(s).disabled = false);
  $("#rstart").textContent = "重新開始";
  $("#rsrc").textContent = only ? "題目：你選的字" : "題目：難字本＋本週字族＋你拼過的字";
  nextQ();
}
function renderProg(){ const p = $("#rprog"); p.innerHTML = ""; R.list.forEach((c, i) => { const r = R.results[i]; p.append(el("i", {class: r === true ? "ok" : r === false ? "no" : i === R.i && R.active ? "cur" : ""})); }); }
function nextQ(){
  renderProg();
  if (R.i >= R.list.length) return endRecall();
  const c = R.list[R.i], x = CH[c]; R.hint = false;
  $("#rpy").textContent = `第 ${R.i + 1} 題　${x.py}`; $("#rword").textContent = blankWord(x);
  $("#rmsg").className = "benchmsg"; $("#rmsg").textContent = "在格子裡寫出□的字。";
  const box = $("#hwq"); box.innerHTML = "";
  const size = Math.round(box.getBoundingClientRect().width) || 260;
  if (!window.HanziWriter){ $("#rmsg").textContent = "筆順工具沒有載入，請重新整理頁面。"; return; }
  R.writer = HanziWriter.create(box, c, { width:size, height:size, padding:10, showCharacter:false, showOutline:false,
    strokeColor:css("--ink"), outlineColor:css("--line"), drawingColor:css("--navy"), highlightColor:css("--green"), drawingWidth:Math.max(14, size / 18), showHintAfterMisses:3 });
  R.writer.quiz({ onMistake: () => sfx.bad(), onCorrectStroke: () => sfx.pick(), onComplete: s => finishQ(s.totalMistakes <= 3 && !R.hint) });
  say(sayQ(x));
}
function finishQ(ok){
  const c = R.list[R.i]; R.results[R.i] = ok;
  rec.recall.done++; if (ok){ rec.recall.ok++; addXp(10); sfx.good(); } else sfx.bad();
  if (ok){ if (rec.hard[c]){ rec.hard[c].ok = (rec.hard[c].ok || 0) + 1; if (rec.hard[c].ok >= 2) delete rec.hard[c]; } }
  else rec.hard[c] = { miss:((rec.hard[c] && rec.hard[c].miss) || 0) + 1, ok:0, at:Date.now() };
  save();
  $("#rmsg").className = "benchmsg " + (ok ? "good" : "bad");
  $("#rmsg").textContent = ok ? `寫對了！「${c}」 +10 XP` : `「${c}」放進難字本了，多看幾次筆順。`;
  if (ok){ const [x, y] = centerOf($("#quizbox")); burst(x, y, 20); }
  R.i++; setTimeout(nextQ, ok ? 1100 : 2600);
}
function endRecall(){
  R.active = false; ["#rsay", "#rhint", "#rskip"].forEach(s => $(s).disabled = true);
  const n = R.results.filter(Boolean).length;
  $("#rpy").textContent = `寫對 ${n}／${R.list.length} 個字`; $("#rword").textContent = n === R.list.length ? "全部答對！" : "繼續加油！";
  const lst = $("#rlist"); lst.innerHTML = ""; R.list.forEach((c, i) => lst.append(el("div", {class:"rchip " + (R.results[i] ? "ok" : "no"), text:c, title:CH[c].w})));
  $("#rresult").hidden = false;
  if (n === R.list.length && R.list.length >= 8) unlock("recall8");
  if (R.hadHard && !Object.keys(rec.hard).length) unlock("clearhard");
  rec.sessions = (rec.sessions || []).concat({ at:Date.now(), mode:"recall", ok:n, total:R.list.length }).slice(-30);
  checkBadges(); save();
}
$("#rstart").onclick = () => startRecall();
$("#rsay").onclick = () => { const c = R.list[R.i]; if (c) say(sayQ(CH[c])); };
$("#rhint").onclick = () => { if (R.writer){ R.hint = true; R.writer.showOutline(); $("#rmsg").textContent = "用了提示，這題會放進難字本。"; } };
$("#rskip").onclick = () => { if (!R.writer || !R.active) return; R.writer.cancelQuiz(); R.writer.showCharacter(); R.writer.animateCharacter(); $("#rmsg").textContent = "看清楚筆順。"; const i = R.i; R.results[i] = false; setTimeout(() => { if (R.i === i) finishQ(false); }, 1800); };

// ================= 課本：平台上每一課的生詞 → 拼、寫、用 =================
/* 學生登入後，抓老師開給他的課（lessons 裡沒有 kind 的那些），把生詞裡的字變成這一課的漢字練習。
   每一輪最多 8 個字，三步：①拼（看懂部件；拆不開的字跳過）→②寫（不看提示默寫）→③用（句子挖空，從形近字、同音字裡選）。
   寫錯或選錯的字進「複習」：隔 1、3、7、15 天再出一次，連續過關四次就畢業。 */
const HAN = /[㐀-鿿豈-﫿]/;
const C = { lessons:[], byId:{}, loaded:false };
const DAY = 864e5;
const todayStr = (plus = 0) => { const d = new Date(Date.now() + plus * DAY); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const BOXDAYS = [1, 3, 7, 15];
function cvPluck(s){ let py = ""; const text = String(s || "").replace(/[\[【]([^\]】]*)[\]】]/g, (m, i) => { if (HAN.test(i)) return m; if (!py) py = i.trim(); return ""; }).replace(/\s{2,}/g, " ").trim(); return { text, py }; }
/* 跟學生頁的 parseVocab 同一套格式：「詞［拼音］（詞類）意思」或「詞｜詞類｜意思｜例句…」，「- 例句」接在上一個詞後面 */
function cvParse(text){
  const out = [];
  String(text || "").split("\n").forEach(raw => {
    const l0 = raw.trim(); if (!l0) return;
    const exm = l0.match(/^[-－・·→*]\s*(.+)$/) || l0.match(/^例[:：]\s*(.+)$/);
    if (exm){ if (out.length){ const pk = cvPluck(exm[1]); if (pk.text) out[out.length - 1].ex.push(pk.text); if (pk.py && !out[out.length - 1].py) out[out.length - 1].py = pk.py; } return; }
    if (/[｜|]/.test(l0)){ const cols = l0.split(/\s*[｜|]\s*/); if (cols.length >= 2){
      let f = (cols[0] || "").trim(), py = ""; const pm = f.match(/[\[【]([^\]】]*)[\]】]/); if (pm){ py = pm[1].trim(); f = f.replace(pm[0], "").trim(); }
      const bk = cvPluck(cols[2] || ""); if (bk.py && !py) py = bk.py; const ex = [];
      cols.slice(3).forEach(s => { const pk = cvPluck(s); if (pk.py && !py) py = pk.py; if (pk.text) ex.push(pk.text); });
      if (f){ out.push({ front:f, py, back:bk.text, ex }); return; } } }
    let l = l0, py = ""; const m = l.match(/[\[【]([^\]】]*)[\]】]/); if (m){ py = m[1].trim(); l = l.replace(m[0], "").trim(); }
    const pm = l.match(/[（(]\s*([^（）()]{1,10}?)\s*[）)]/); if (pm) l = (l.slice(0, pm.index) + " " + l.slice(pm.index + pm[0].length)).trim();
    let front, back;
    if (/[=＝]/.test(l)){ const p = l.split(/[=＝]/).map(s => s.trim()); front = p[0]; back = p.slice(1).filter(Boolean).join(" · "); }
    else { const si = l.search(/[：:\t\s]/); if (si < 0){ front = l; back = ""; } else { front = l.slice(0, si).trim(); back = l.slice(si + 1).replace(/^[：:·\s]+/, "").trim(); } }
    out.push({ front:(front || "").trim(), py, back, ex:[] });
  });
  return out;
}
const cvDialogs = l => (Array.isArray(l.dialogues) && l.dialogues.length) ? l.dialogues : [{ title:"課文", content:l.content || "", vocabulary:l.vocabulary || "" }];
const cvClean = s => String(s || "").replace(/<[^>]+>/g, "").replace(/[\[【]([^\]】]*)[\]】]/g, (m, i) => HAN.test(i) ? i : "").replace(/&nbsp;/g, " ");
function cvSentences(text){
  return cvClean(text).split(/\n|(?<=[。！？!?；])/).map(x => x.replace(/^\s*[^\s：:，。、]{1,8}[：:]\s*/, "").replace(/\s+/g, "").trim())
    .filter(x => HAN.test(x) && [...x].length >= 4 && [...x].length <= 42);
}
/* 拼音切成一個字一個音節：照每個字的字典讀音去對（不分聲調），對不上就退回字典讀音 */
const SYL = /(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?[aeiou]+(?:ng|n|r(?![aeiou]))?/y;
const PYCH = /[a-zA-Züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/;
const pyBase = p => toneless(p).replace(/v/g, "u").replace(/[^a-z]/g, "");
function pyReads(c){
  const r = new Set(pysOf(c).flatMap(p => String(p).split(/[\/,，、 ]/)).map(pyBase).filter(Boolean));
  if (c === "兒"){ r.add("r"); r.add("er"); }
  return [...r].sort((a, b) => b.length - a.length);
}
// 回傳每個字的音節（帶聲調）；exact＝拼音要剛好用完。對不上回傳 null
function pySplit(w, wpy, exact){
  const cs = [...w], T = [...String(wpy || "").replace(/[()（）]/g, "")].filter(ch => PYCH.test(ch.toLowerCase())), B = T.map(ch => pyBase(ch) || "u").join("");
  if (!cs.length || !B || B.length !== T.length) return null;
  const R = cs.map(pyReads), memo = {};
  const go = (i, k) => {
    const key = i + "," + k; if (key in memo) return memo[key];
    let res = null;
    if (k === cs.length) res = (!exact || i === B.length) ? [] : null;
    else {
      let cands = R[k].filter(r => B.startsWith(r, i));
      if (!R[k].length){ SYL.lastIndex = i; const m = SYL.exec(B); cands = m ? [m[0]] : []; }
      for (const r of cands){ const rest = go(i + r.length, k + 1); if (rest){ res = [T.slice(i, i + r.length).join("").toLowerCase()].concat(rest); break; } }
    }
    return (memo[key] = res);
  };
  return go(0, 0);
}
function charPy(c, w, wpy){
  const i = [...w].indexOf(c); if (i < 0) return pyOf(c);
  const sp = pySplit(w, wpy, true) || pySplit(w, wpy, false);
  return sp ? sp[i] : pyOf(c);
}
// 生詞欄位常把兩種寫法連在一起（做夢作夢、凶兇、箱子箱 xiāngzi/xiāng）：拆成兩個詞
function cvVariants(w, py){
  const n = [...w].length, vs = String(py || "").split(/[\/／]/).map(x => x.trim()).filter(Boolean);
  if (n < 2 || !vs.length) return [{ w, py }];
  const cut = (k, a, b) => { const x = [...w].slice(0, k).join(""), y = [...w].slice(k).join(""); return pySplit(x, a, true) && pySplit(y, b, true) ? [{ w:x, py:a }, { w:y, py:b }] : null; };
  if (vs.length >= 2){
    if (pySplit(w, vs[0], true)) return [{ w, py:vs[0] }];
    for (let k = 1; k < n; k++){ const r = cut(k, vs[0], vs[1]); if (r) return r; }
    return [{ w, py:vs[0] }];
  }
  if (pySplit(w, vs[0], true) || n % 2) return [{ w, py:vs[0] }];
  return cut(n / 2, vs[0], vs[0]) || [{ w, py:vs[0] }];
}
/* ══════ VAR_V1468 異體字：台／臺 這種「同一個詞的兩種寫法」 ══════
   Quinn：「不是已經出現過『臺灣』，然後選擇答案那邊『臺灣』跟『台灣』其實都是對的啊？」
   她的生詞表裡 台灣 和 臺灣 是兩筆，程式當成兩個不同的詞，所以一個可以拿來當另一個的誘答。
   更糟的是看拼音題的誘答評分還加分給「跟答案有同一個字」，等於主動把它挑出來。
   這裡只做一件事：把異體字正規化，讓遊戲判斷「是不是同一個詞」的時候兩種寫法算同一個。
   表只收台灣教學現場真的會兩種都寫的那幾組，不做全套繁簡轉換。 */
const VARCH = { "臺":"台","裏":"裡","着":"著","爲":"為","衆":"眾","綫":"線","羣":"群","峯":"峰","牀":"床","鷄":"雞","麪":"麵","却":"卻","祕":"秘","濕":"溼","搾":"榨","絃":"弦" };
const vnorm = w => [...String(w || "")].map(c => VARCH[c] || c).join("");
const sameWord = (a, b) => vnorm(a) === vnorm(b);
/* 誘答能不能用：不能是同一個詞（含異體字）、不能跟答案共用任何一個字
   （早安／午安共用「安」填進去都成立）、不能已經出現在題目句子裡。 */
function okDistract(ans, x, sent){
  if (!x || sameWord(ans, x)) return false;
  const a = new Set([...vnorm(ans)]);
  for (const c of vnorm(x)) if (a.has(c)) return false;
  if (sent && String(sent).indexOf(x) >= 0) return false;
  return true;
}
const cvLabel = l => { const tb = (l.textbook || "").trim(), ti = (l.title || "").trim(); const core = ti || (l.order_index ? "第" + l.order_index + "課" : "課"); return (tb ? tb + "・" : "") + core; };
function cvLesson(l){
  const words = [], texts = [];
  cvDialogs(l).forEach(d => {
    cvParse(d.vocabulary).forEach(v => { const w0 = cvClean(v.front).replace(/[^㐀-鿿豈-﫿]/g, ""); if (w0) cvVariants(w0, v.py || "").forEach((x, j) => { if (!words.some(W => W.w === x.w)) words.push({ w:x.w, py:x.py, mean:v.back || "", ex:v.ex || [], alt:j > 0 || undefined }); }); });
    if (d.content) texts.push(d.content);
  });
  const sents = cvSentences(texts.join("\n"));
  const chars = [], seen = new Set();
  words.forEach(W => [...W.w].forEach(c => { if (!HAN.test(c) || seen.has(c) || NOSTROKE.has(c)) return; seen.add(c);
    chars.push({ c, w:W.w, wpy:W.py, py:charPy(c, W.w, W.py), mean:W.mean, ex:W.ex.map(cvClean) }); }));
  // 沒有生詞的課：拿課文裡、華語八千詞有的字
  if (!chars.length) sents.join("").split("").forEach(c => { if (chars.length >= 30 || seen.has(c) || !CH[c] || NOSTROKE.has(c)) return; seen.add(c); chars.push({ c, w:CH[c].w, wpy:"", py:pyOf(c), mean:"", ex:[] }); });
  // 單字詞（例如「他、誰、很」）只給一個□，學生猜不出是哪個字：換成有上下文的提示
  chars.forEach(it => {
    it.word = it.w;
    if ([...it.w].length > 1) return;
    const other = words.find(W => W.w.length > 1 && W.w.includes(it.c));
    if (other){ it.w = other.w; it.wpy = other.py || ""; return; }
    // 用課文裡完整的一句（或用逗號分開的完整小句），絕不從中間切
    const ss = sents.concat(it.ex || []).filter(x => x.includes(it.c));
    const whole = ss.filter(x => [...x].length <= 20).sort((a, b) => a.length - b.length)[0];
    if (whole){ it.w = whole; it.wpy = ""; it.sent = true; return; }
    const parts = ss.flatMap(x => x.split(/[，、；：,;:]/)).map(x => x.trim()).filter(x => x.includes(it.c) && [...x].length >= 3 && [...x].length <= 20).sort((a, b) => a.length - b.length);
    if (parts.length){ it.w = parts[0]; it.wpy = ""; it.sent = true; return; }
    if (CH[it.c] && [...CH[it.c].w].length > 1){ it.w = CH[it.c].w; it.wpy = ""; }
  });
  return { id:l.id, label:cvLabel(l), tb:(l.textbook || "").trim(), order:l.order_index || 0, at:l.created_at || "", chars, sents };
}
let ALLW_ = null; const ALLW = () => ALLW_ || (ALLW_ = [...new Set(Object.values(CH).map(x => x.w).filter(Boolean))]);
async function loadCourse(uid){
  try {
    let rows = [];
    const fs = window.firebase && firebase.firestore ? firebase.firestore() : null;
    if (store.teacher && window.DB) rows = await DB.list("lessons");
    else if (fs && uid){ const sn = await fs.collection("lessons").where("read_uids", "array-contains", uid).get(); rows = sn.docs.map(d => Object.assign({ id:d.id }, d.data())); }
    else if (window.DB && DB.mode !== "firebase") rows = await DB.list("lessons");
    C.lessons = rows.filter(l => l && !l.kind && !l.deleted_at).map(cvLesson).filter(x => x.chars.length)
      .sort((a, b) => a.tb.localeCompare(b.tb) || a.order - b.order || String(a.at).localeCompare(String(b.at)));
    /* QZSRC_V1465 Quinn：「快問快答這邊我能不能設計題目」。
       她在後台「隨堂小考 → 自訂題目」出的題（一行一題，「題目＝答案」）也一起收下來，
       快問快答可以拿那一份當題庫。只收自訂題目而且真的有寫東西的；
       這些資料本來就在同一個 collection 裡，不用多跑一次網路。 */
    C.quizzes = rows.filter(l => l && l.kind === "quiz" && l.mode === "custom" && !l.deleted_at
      && String(l.quiz_items || "").trim())
      .map(l => ({ id:l.id, title:String(l.title || "自訂題目").trim(), items:String(l.quiz_items || "") }))
      .sort((a, b) => a.title.localeCompare(b.title));
  } catch(e){ C.lessons = []; C.quizzes = []; }
  C.byId = {}; C.lessons.forEach(x => C.byId[x.id] = x); C.loaded = true;
  const tb = document.querySelector('nav.tabs button[data-tab="course"]'); if (tb) tb.hidden = !C.lessons.length;
  ls.set("hz-hascourse", C.lessons.length ? "1" : "0");
  if (document.body.classList.contains("games-app") && window.HZMG && !window.HZMG.game && document.querySelector("#p-mg") && !document.querySelector("#p-mg").hidden) window.HZMG.home();
}
// ---- 紀錄 ----
const cRec = lid => (rec.course[lid] = rec.course[lid] || { m:{}, rounds:0 });
const mastered = (lid, c) => !!(rec.course[lid] && rec.course[lid].m[c]);
const dueReview = () => Object.entries(rec.review || {}).filter(([c, r]) => r && r.due <= todayStr()).map(([c]) => c);
function lessonStars(L){ const n = L.chars.length; if (!n) return 0; const k = L.chars.filter(x => mastered(L.id, x.c)).length / n; return k >= .9 ? 3 : k >= .6 ? 2 : k >= .3 ? 1 : 0; }
function setLessonStars(L){ const s = lessonStars(L); ["easy", "normal", "hard"].forEach(d => { rec.stars[d] = rec.stars[d] || {}; rec.stars[d]["L:" + L.id] = Math.max(rec.stars[d]["L:" + L.id] || 0, s); }); }
// ---- 形近字、同音字（選項）----
let CVI = null;
function cvIndex(){
  if (CVI) return CVI; CVI = { part:{}, py:{} };
  Object.values(CH).forEach(x => { (x.p || []).forEach(p => (CVI.part[p] = CVI.part[p] || []).push(x.c)); const k = toneless(x.py); if (k) (CVI.py[k] = CVI.py[k] || []).push(x.c); });
  return CVI;
}
// 干擾選項：長得像、同音的字。allow＝只能用學生學過的字（同一本課本、到這一課為止）
/* 換進去也成詞的字不能當錯的選項（例如 □們 的「人」：人們也是詞）
   詞表＝華語八千詞＋老師課本裡的生詞 */
let WSET = null;
function wordSet(){
  if (WSET) return WSET; WSET = new Set(String(window.HZWORDS || "").split("|").filter(Boolean));
  (C.lessons || []).forEach(L => (L.chars || []).forEach(x => { [x.w, x.word].forEach(w => { if (w && w.length >= 2 && w.length <= 6 && /^[\u3400-\u9fff]+$/.test(w)) WSET.add(w); }); }));
  return WSET;
}
function makesWord(w, c, x){
  const cs = [...String(w || "")]; if (cs.length < 2) return false; const W = wordSet();
  for (let i = 0; i < cs.length; i++){ if (cs[i] !== c) continue; const t = cs.slice(); t[i] = x;
    for (let a = Math.max(0, i - 3); a <= i; a++) for (let b = i + 1; b <= Math.min(t.length, a + 5); b++){ if (b - a >= 2 && W.has(t.slice(a, b).join(""))) return true; } }
  return false;
}
function distractors(item, n = 3, allow, minSc){
  const I = cvIndex(), c = item.c, sc = {};
  if (allow && allow.size < n + 4) allow = null;
  const bad = x => item.w && makesWord(item.w, c, x);
  const bump = (x, v) => { if (x && x !== c && HAN.test(x) && !NOSTROKE.has(x) && (!allow || allow.has(x)) && !bad(x)) sc[x] = (sc[x] || 0) + v; };
  (CH[c] && CH[c].p || []).forEach(p => (I.part[p] || []).forEach(x => bump(x, p in RAD ? 1.2 : 3)));
  (I.py[toneless(item.py)] || []).forEach(x => bump(x, 2.6));
  (I.part[c] || []).forEach(x => bump(x, 1.5));
  if (CH[c] && CH[c].p) CH[c].p.forEach(p => { if (CH[p] && !(p in RAD)) bump(p, 1.4); });
  let pool = Object.keys(sc).sort((a, b) => sc[b] - sc[a] + (Math.random() - .5) * .8);
  // minSc：只要「真的像」的字（同音或共用聲旁），不夠就少給，不亂補
  if (minSc) return pool.filter(x => sc[x] >= minSc).slice(0, n);
  // 不要選到放進去也是一個詞的字（例如「在／再」放進同一個句子都說得通的情況，盡量避開課本裡的其他詞）
  const out = pool.slice(0, n);
  const fill = shuffle(allow ? [...allow] : Object.keys(CH)).filter(x => x !== c && !out.includes(x) && (!CH[x] || toneless(CH[x].py) !== toneless(item.py)) && !bad(x));
  while (out.length < n && fill.length) out.push(fill.pop());
  return out;
}
// 學生學過的字：同一本課本、到這一課為止（複習時用全部的課）
function learned(L){
  const ls = L ? C.lessons.filter(x => x.tb === L.tb && (x.order || 0) <= (L.order || 0)) : C.lessons;
  const set = new Set(); ls.concat(L ? [L] : []).forEach(x => x.chars.forEach(it => set.add(it.c))); return set;
}
function pickSentence(item, L){
  const has = s => s.includes(item.w) && [...s].length > [...item.w].length;
  const exs = (item.ex || []).filter(has);
  if (exs.length) return exs[Math.floor(Math.random() * exs.length)];
  const ss = (L ? L.sents : []).filter(has);
  if (ss.length) return ss.sort((a, b) => a.length - b.length)[0];
  const sc = (L ? L.sents : []).filter(s => s.includes(item.c));
  if (sc.length) return null;
  return null;
}
// ---- 一輪 ----
const CR = { L:null, list:[], step:"", i:0, res:{}, review:false, writer:null, hint:false, patch:{} };
const courseShop = Shop($("#courseShop"), {
  title: st => `${CR.L ? CR.L.label : "複習"}・①拼`,
  onQuit: () => { unpatch(); showCourseHome(); },
  onEnd: r => { unpatch(); if (r.ok){ addXp(r.total); sfx.win(); } stepWrite(); }
});
function patch(items){ CR.patch = {}; items.forEach(it => { if (!CH[it.c]) return; CR.patch[it.c] = { w:CH[it.c].w, py:CH[it.c].py }; CH[it.c].w = it.w; CH[it.c].py = it.py || CH[it.c].py; }); }
function unpatch(){ Object.entries(CR.patch || {}).forEach(([c, v]) => { if (CH[c]) Object.assign(CH[c], v); }); CR.patch = {}; }
function courseView(name){ ["#cHome", "#cShopWrap", "#cWrite", "#cUse", "#cDone"].forEach(s => $(s).hidden = s !== name); window.scrollTo({ top:0 }); }
function stepBar(){
  const steps = CR.review ? [["write", "②寫"], ["use", "③用"]] : [["build", "①拼"], ["write", "②寫"], ["use", "③用"]];
  const order = steps.map(s => s[0]); const cur = order.indexOf(CR.step);
  return el("div", { class:"csteps" }, steps.map(([k, t], i) => el("span", { class: i < cur ? "done" : i === cur ? "cur" : "", text:t })));
}
function startRound(lid, opts = {}){
  const L = C.byId[lid]; if (!L) return;
  const todo = L.chars.filter(x => !mastered(lid, x.c)), doneOnes = L.chars.filter(x => mastered(lid, x.c));
  let list = (opts.all ? L.chars : todo).slice(0, 8);
  if (list.length < 8 && !opts.all) list = list.concat(shuffle(doneOnes).slice(0, Math.min(8 - list.length, todo.length ? 2 : 8)));
  Object.assign(CR, { L, list, step:"build", i:0, res:{}, review:false });
  list.forEach(x => CR.res[x.c] = { w:null, u:null });
  showTab("course");
  const comp = list.filter(x => CH[x.c] && CH[x.c].p);
  if (comp.length >= 1){
    /* PZ_V1470 這一段本來是：步驟列、一段說明、再一顆「跳過拼字」浮在最上面，
       跟下面遊戲自己的標題列對不齊，左邊還會被切掉。
       改成一列：左邊步驟列和說明，右邊跳過鈕靠右對齊（.chead2 已經是 flex）。
       說明也縮短——「每一格的□」那句在改成一次一題之後已經不對了。 */
    courseView("#cShopWrap"); $("#cShopHead").innerHTML = "";
    const skip = el("button", { class:"btn small", text:"跳過拼字，直接到②寫" });
    skip.onclick = () => { courseShop.stop(); unpatch(); stepWrite(); };
    $("#cShopHead").append(el("div", { class:"chead2-l" }, [stepBar(),
      el("p", { class:"muted", text:`這一輪 ${list.length} 個字，其中 ${comp.length} 個拆得開，一次拼一個。` })]), skip);
    patch(list); courseShop.start({ stage:{ id:"L:" + lid, name:L.label, chars:comp.map(x => x.c) }, diff, calm:true/* CALM_V1471 */ });
  } else stepWrite();
}
function startReview(){
  const cs = dueReview().slice(0, 10); if (!cs.length){ toast("今天沒有要複習的字"); return; }
  const list = cs.map(c => { const r = rec.review[c]; const L = C.byId[r.lid]; const it = L && L.chars.find(x => x.c === c);
    return it || { c, w:r.w || (CH[c] && CH[c].w) || c, wpy:"", py:r.py || pyOf(c), mean:r.mean || "", ex:[] }; });
  Object.assign(CR, { L:null, list:shuffle(list), step:"write", i:0, res:{}, review:true });
  CR.list.forEach(x => CR.res[x.c] = { w:null, u:null });
  showTab("course"); stepWrite();
}
// ②寫
function stepWrite(){
  CR.step = "write"; CR.i = 0; courseView("#cWrite");
  const h = $("#cWriteHead"); h.innerHTML = ""; h.append(stepBar(), el("p", { class:"muted", text:"不看答案，在格子裡寫出□的字。要照筆順寫，寫錯的筆畫會被擦掉。" }));
  nextWrite();
}
function nextWrite(){
  const pr = $("#cwProg"); pr.innerHTML = ""; CR.list.forEach((x, i) => pr.append(el("i", { class: CR.res[x.c].w === true ? "ok" : CR.res[x.c].w === false ? "no" : i === CR.i ? "cur" : "" })));
  if (CR.i >= CR.list.length) return stepUse();
  const it = CR.list[CR.i]; CR.hint = false;
  $("#cwPy").textContent = `第 ${CR.i + 1}／${CR.list.length} 題　${it.wpy || it.py}`;
  $("#cwWord").textContent = [...it.w].map(ch => ch === it.c ? "□" : ch).join("");
  $("#cwMean").textContent = it.mean || "";
  $("#cwMsg").className = "benchmsg"; $("#cwMsg").textContent = "";
  const box = $("#cwq"); box.innerHTML = "";
  const size = Math.round(box.getBoundingClientRect().width) || 260;
  if (!window.HanziWriter){ $("#cwMsg").textContent = "筆順工具沒有載入，請重新整理頁面。"; return; }
  CR.writer = HanziWriter.create(box, it.c, { width:size, height:size, padding:10, showCharacter:false, showOutline:false,
    strokeColor:css("--ink"), outlineColor:css("--line"), drawingColor:css("--navy"), highlightColor:css("--green"), drawingWidth:Math.max(14, size / 18), showHintAfterMisses:3,
    onLoadCharDataError: () => { if (CR.res[it.c].w !== null) return; CR.res[it.c].w = true; $("#cwMsg").textContent = "這個字暫時沒有筆順資料，先跳過。"; setTimeout(() => { CR.i++; nextWrite(); }, 1200); } });
  CR.writer.quiz({ onMistake: () => sfx.bad(), onCorrectStroke: () => sfx.pick(), onComplete: s => doneWrite(s.totalMistakes <= 3 && !CR.hint) });
  say(`${it.c}，${it.w}的${it.c}`);
}
function doneWrite(ok){
  const it = CR.list[CR.i]; if (CR.res[it.c].w !== null) return; CR.res[it.c].w = ok;
  if (ok){ addXp(10); sfx.good(); const [x, y] = centerOf($("#cwBox")); burst(x, y, 18); } else sfx.bad();
  $("#cwMsg").className = "benchmsg " + (ok ? "good" : "bad"); $("#cwMsg").textContent = ok ? `寫對了！「${it.c}」` : `「${it.c}」等一下會再複習。`;
  CR.i++; setTimeout(nextWrite, ok ? 1000 : 2400);
}
$("#cwSay").onclick = () => { const it = CR.list[CR.i]; if (it) say(`${it.c}，${it.w}的${it.c}`); };
$("#cwHint").onclick = () => { if (CR.writer){ CR.hint = true; CR.writer.showOutline(); $("#cwMsg").textContent = "用了提示，這個字等一下會再複習。"; } };
$("#cwSkip").onclick = () => { const it = CR.list[CR.i]; if (!it || !CR.writer || CR.res[it.c].w !== null) return; CR.writer.cancelQuiz(); CR.writer.showCharacter(); CR.writer.animateCharacter(); CR.res[it.c].w = false; sfx.bad();
  $("#cwMsg").className = "benchmsg bad"; $("#cwMsg").textContent = "看清楚筆順。這個字等一下會再複習。"; setTimeout(() => { CR.i++; nextWrite(); }, 3200); };
// ③用
function stepUse(){
  CR.step = "use"; CR.i = 0; courseView("#cUse");
  const h = $("#cUseHead"); h.innerHTML = ""; h.append(stepBar(), el("p", { class:"muted", text:"句子裡空著的地方，應該放哪一個字？選項裡有長得像的字、讀音一樣的字，要看清楚。" }));
  nextUse();
}
function nextUse(){
  const pr = $("#cuProg"); pr.innerHTML = ""; CR.list.forEach((x, i) => pr.append(el("i", { class: CR.res[x.c].u === true ? "ok" : CR.res[x.c].u === false ? "no" : i === CR.i ? "cur" : "" })));
  if (CR.i >= CR.list.length) return finishRound();
  const it = CR.list[CR.i], L = CR.L || (rec.review[it.c] && C.byId[rec.review[it.c].lid]);
  const sent = pickSentence(it, L);
  const q = $("#cuQ"); q.innerHTML = "";
  const blankW = [...it.w].map(ch => ch === it.c ? "\u0000" : ch).join("");
  const src = sent || it.w; const idx = src.indexOf(it.w);
  const show = idx >= 0 ? src.slice(0, idx) + blankW + src.slice(idx + it.w.length) : blankW;
  show.split("\u0000").forEach((part, k) => { if (k) q.append(el("span", { class:"cblank", text:"　" })); q.append(document.createTextNode(part)); });
  $("#cuNote").textContent = sent ? (it.mean ? `「${it.w}」：${it.mean}` : "") : `（${it.wpy || it.py}${it.mean ? "，" + it.mean : ""}）`;
  const opts = shuffle([it.c].concat(distractors(it, 3, learned(CR.L))));
  const ob = $("#cuOpts"); ob.innerHTML = "";
  opts.forEach(o => { const b = el("button", { class:"copt", text:o }); b.onclick = () => pickUse(o, b); ob.append(b); });
  $("#cuMsg").className = "benchmsg"; $("#cuMsg").textContent = "";
}
function pickUse(o, b){
  const it = CR.list[CR.i]; if (CR.res[it.c].u !== null) return;
  const ok = o === it.c; CR.res[it.c].u = ok;
  document.querySelectorAll("#cuOpts .copt").forEach(x => { x.disabled = true; if (x.textContent === it.c) x.classList.add("right"); });
  if (!ok) b.classList.add("wrong");
  const bl = document.querySelector("#cuQ .cblank"); if (bl){ bl.textContent = it.c; bl.classList.add(ok ? "ok" : "no"); }
  if (ok){ addXp(8); sfx.good(); } else sfx.bad();
  const diffNote = !ok && CH[o] ? `「${o}」是 ${CH[o].py}，${CH[o].w}的${o}。` : "";
  $("#cuMsg").className = "benchmsg " + (ok ? "good" : "bad"); $("#cuMsg").textContent = ok ? "對了！" : `應該是「${it.c}」（${it.w}）。${diffNote}`;
  say(it.w);
  CR.i++; setTimeout(nextUse, ok ? 1100 : 3200);
}
// 結算
function finishRound(){
  courseView("#cDone");
  const box = $("#cDoneBody"); box.innerHTML = "";
  let good = 0; const wrong = [];
  CR.list.forEach(it => {
    const r = CR.res[it.c], ok = r.w !== false && r.u !== false; if (ok) good++; else wrong.push(it);
    if (CR.review){
      const rv = rec.review[it.c]; if (!rv) return;
      if (ok){ rv.box = (rv.box || 0) + 1; if (rv.box >= BOXDAYS.length){ delete rec.review[it.c]; delete rec.hard[it.c]; } else rv.due = todayStr(BOXDAYS[rv.box]); }
      else { rv.box = 0; rv.due = todayStr(1); rec.wrong[it.c] = (rec.wrong[it.c] || 0) + 1; }
    } else {
      const lid = CR.L.id;
      if (ok) cRec(lid).m[it.c] = Date.now();
      else {
        rec.review[it.c] = { box:0, due:todayStr(1), lid, w:it.w, py:it.py, mean:it.mean };
        rec.wrong[it.c] = (rec.wrong[it.c] || 0) + 1;
        rec.hard[it.c] = { miss:((rec.hard[it.c] && rec.hard[it.c].miss) || 0) + 1, ok:0, at:Date.now() };
      }
    }
  });
  if (CR.L){ cRec(CR.L.id).rounds++; setLessonStars(CR.L); }
  rec.sessions = (rec.sessions || []).concat({ at:Date.now(), mode:CR.review ? "review" : "course", lid:CR.L ? CR.L.id : "", ok:good, total:CR.list.length }).slice(-30);
  checkBadges(); save();
  box.append(el("h2", { text: CR.review ? "複習完成" : (good === CR.list.length ? "這一輪全部過關！" : "這一輪完成了") }));
  box.append(el("p", { class:"muted", text: `${CR.list.length} 個字，寫對而且用對的有 ${good} 個。` + (wrong.length ? (CR.review ? "沒過的字明天再出一次。" : "沒過的字放進複習，明天會再出現。") : "") }));
  const tb = el("table", { class:"ctable" });
  tb.append(el("tr", {}, [el("th", { text:"字" }), el("th", { text:"課本裡的詞" }), el("th", { text:"②寫" }), el("th", { text:"③用" })]));
  CR.list.forEach(it => { const r = CR.res[it.c]; const mk = v => el("td", { class: v === false ? "no" : "ok", text: v === false ? "✗" : "✓" });
    const zi = el("td", { class:"cz" }, [el("button", { class:"czb", text:it.c, title:"聽讀音" })]); zi.firstChild.onclick = () => say(`${it.c}，${it.w}的${it.c}`);
    tb.append(el("tr", {}, [zi, el("td", { text: (it.word || it.w) + (it.mean ? "　" + it.mean : "") }), mk(r.w), mk(r.u)])); });
  box.append(tb);
  const btns = el("div", { class:"endbtns" });
  if (CR.L){
    const more = CR.L.chars.filter(x => !mastered(CR.L.id, x.c)).length;
    if (more){ const nx = el("button", { class:"btn primary", text:`下一輪（還有 ${more} 個字）` }); nx.onclick = () => startRound(CR.L.id); btns.append(nx); }
    const again = el("button", { class:"btn", text:"這一課全部再練一次" }); again.onclick = () => startRound(CR.L.id, { all:true }); btns.append(again);
  }
  if (dueReview().length){ const rv = el("button", { class:"btn" + (CR.L ? "" : " primary"), text:`今天的複習（${dueReview().length} 個字）` }); rv.onclick = startReview; btns.append(rv); }
  const home = el("button", { class:"btn", text:"回課本列表" }); home.onclick = showCourseHome; btns.append(home);
  box.append(btns);
  if (good === CR.list.length) setTimeout(() => burst(innerWidth / 2, 200, 60), 200);
}
// 課本列表
/* GAMES_V1414 生詞遊戲（games.html）跟字族工坊共用這支程式；那一頁沒有「課本」分頁，回到遊戲首頁 */
const GAMESAPP = document.body.classList.contains("games-app");
function showCourseHome(){
  if (GAMESAPP){ showTab("mg"); if (window.HZMG && !window.HZMG.game) window.HZMG.home(); return; }
  showTab("course"); courseView("#cHome");
  const box = $("#cHome"); box.innerHTML = "";
  if (!C.loaded){ box.append(el("p", { class:"muted", text:"正在讀取你的課本……" })); return; }
  if (!C.lessons.length){ box.append(el("div", { class:"notice", text: store.me || store.teacher ? "目前還沒有開給你的課（或課裡還沒有生詞）。老師開課以後，這裡會自動出現每一課的漢字練習。" : "登入學生帳號以後，這裡會出現你課本每一課的漢字練習。請先到學生頁登入。" })); return; }
  const due = dueReview();
  const head = el("div", { class:"chead" }, [el("div", {}, [el("h2", { text:"我的課本" }), el("p", { class:"muted", text:"每一課的生詞會變成這一課要練的字。每一輪 8 個字：①拼（看懂部件）→②寫（默寫）→③用（句子裡選對的字）。" })])]);
  const rv = el("button", { class:"btn" + (due.length ? " primary" : ""), text: due.length ? `今天的複習：${due.length} 個字` : "今天沒有要複習的字" });
  rv.disabled = !due.length; rv.onclick = startReview; head.append(rv);
  box.append(head);
  // 篩選：課本很多的時候，先選一本書，再用搜尋找課名或字
  const tbs = [...new Set(C.lessons.map(L => L.tb || "其他課"))];
  const F = C.f || (C.f = (() => { let f = {}; try { f = JSON.parse(ls.get("hz-cf") || "{}"); } catch(e){}
    if (!f.tb || (f.tb !== "*" && !tbs.includes(f.tb))){
      // 預設：老師指派的那本 → 最近練過的那本 → 第一本
      const tk = store.tasks.find(t => String(t.fam).startsWith("L:") && !taskDone(t) && C.byId[String(t.fam).slice(2)]);
      const last = Object.entries(rec.course || {}).filter(([id]) => C.byId[id]).sort((a, b) => Math.max(0, ...Object.values(b[1].m || {})) - Math.max(0, ...Object.values(a[1].m || {})))[0];
      f.tb = tk ? (C.byId[String(tk.fam).slice(2)].tb || "其他課") : last ? (C.byId[last[0]].tb || "其他課") : (tbs.length > 1 ? tbs[0] : "*");
    }
    f.q = f.q || ""; f.todo = !!f.todo; return f; })());
  const saveF = () => ls.set("hz-cf", JSON.stringify(F));
  const bar = el("div", { class:"cfilter" });
  const sel = el("select", { "aria-label":"課本" }); sel.append(el("option", { value:"*", text:`全部課本（${C.lessons.length} 課）` }));
  tbs.forEach(tb => { const n = C.lessons.filter(L => (L.tb || "其他課") === tb).length; const o = el("option", { value:tb, text:`${tb}（${n} 課）` }); if (tb === F.tb) o.selected = true; sel.append(o); });
  if (F.tb === "*") sel.value = "*";
  const q = el("input", { type:"search", placeholder:"搜尋課名，或打一個字找它在哪一課", value:F.q, "aria-label":"搜尋" });
  const todo = el("label", { class:"cchk" }, [el("input", { type:"checkbox" }), document.createTextNode(" 只看還沒學完的")]); todo.firstChild.checked = F.todo;
  bar.append(sel, q, todo); box.append(bar);
  const list = el("div"); box.append(list);
  const card = (L, tb) => { const n = L.chars.length, m = L.chars.filter(x => mastered(L.id, x.c)).length, s = lessonStars(L);
    const task = store.tasks.find(t => t.fam === "L:" + L.id && !taskDone(t));
    const cd = el("div", { class:"ccard" + (task ? " task" : "") }); const st = el("span", {}); st.innerHTML = starsHtml(s);
    cd.append(el("div", { class:"ct" }, [el("b", { text: tb ? L.label.replace(L.tb + "・", "") : L.label }), st.firstChild]),
      el("div", { class:"czs", text: L.chars.slice(0, 16).map(x => x.c).join("") + (n > 16 ? "…" : "") }),
      el("div", { class:"cbar" }, [el("i", { style:`width:${Math.round(m / n * 100)}%` })]),
      el("small", { class:"muted", text:`已學會 ${m}／${n} 個字` + (task ? `・老師指派${task.due_date ? "（" + dueLabel(task.due_date).t + "）" : ""}` : "") }));
    const go = el("button", { class:"btn small" + (m < n ? " primary" : ""), text: m === 0 ? "開始" : m < n ? "繼續" : "再練一次" });
    go.onclick = () => startRound(L.id, { all: m === n });
    if (store.teacher){ const pr = el("button", { class:"btn small", text:"印學習單" }); pr.onclick = () => printSheet(L);
      const pj = el("button", { class:"btn small", text:"上課投影" }); pj.onclick = () => startProject(L);
      cd.append(el("div", { class:"row" }, [go, pr, pj])); } else cd.append(go);
    return cd; };
  const draw = () => {
    list.innerHTML = "";
    const kw = F.q.trim();
    let Ls = C.lessons.filter(L => (F.tb === "*" || (L.tb || "其他課") === F.tb));
    if (kw) Ls = C.lessons.filter(L => L.label.includes(kw) || ([...kw].length <= 2 && [...kw].every(ch => L.chars.some(x => x.c === ch))));
    if (F.todo) Ls = Ls.filter(L => L.chars.some(x => !mastered(L.id, x.c)));
    // 老師指派的課排最前面
    Ls = Ls.slice().sort((a, b) => !!store.tasks.find(t => t.fam === "L:" + b.id && !taskDone(t)) - !!store.tasks.find(t => t.fam === "L:" + a.id && !taskDone(t)));
    if (!Ls.length){ list.append(el("p", { class:"muted", style:"padding:12px 2px", text: kw ? `找不到「${kw}」。可以打課名的一部分（例如「第三課」），或打一個字。` : "這裡沒有符合的課。" })); return; }
    if (kw) list.append(el("p", { class:"muted", style:"margin:4px 0 8px", text:`找到 ${Ls.length} 課（搜尋範圍是全部課本）` }));
    const groups = {}; Ls.forEach(L => (groups[L.tb || "其他課"] = groups[L.tb || "其他課"] || []).push(L));
    Object.entries(groups).forEach(([tb, G]) => {
      if (Object.keys(groups).length > 1 || F.tb === "*" || kw) list.append(el("h3", { class:"ctb", text: tb }));
      const g = el("div", { class:"cgrid" }); G.forEach(L => g.append(card(L, tb))); list.append(g);
    });
  };
  sel.onchange = () => { F.tb = sel.value; saveF(); draw(); };
  q.oninput = () => { F.q = q.value; saveF(); draw(); };
  todo.firstChild.onchange = () => { F.todo = todo.firstChild.checked; saveF(); draw(); };
  draw();
}

// ---- 老師：印學習單、上課投影 ----
function partsText(c){ const e = CH[c]; if (!e || !e.p) return ""; return e.p.map(p => { const n = p in RAD ? radName(p, c) : ""; return p + (n && n !== p ? "（" + n + "）" : ""); }).join(" ＋ "); }
function printSheet(L){
  const esc2 = s => String(s == null ? "" : s).replace(/[&<>"]/g, m => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[m]));
  const box = (ch, ghost) => `<span class="g${ghost ? " gh" : ""}">${ghost ? esc2(ch) : ""}</span>`;
  const rows = L.chars.map((it, i) => `<tr><td class="no">${i + 1}</td><td class="big">${esc2(it.c)}</td>
    <td><div class="w">${esc2(it.word || it.w)}　<span class="py">${esc2(it.word && it.word !== it.w ? it.py : (it.wpy || it.py))}</span>${it.word && it.word !== it.w ? '　<span class="py">例：' + esc2(it.w) + '</span>' : ''}</div><div class="m">${esc2(it.mean)}</div><div class="pt">${esc2(partsText(it.c))}</div></td>
    <td class="tr"><div class="trw">${box(it.c, 1)}${box(it.c, 1)}${box(it.c, 0)}${box(it.c, 0)}${box(it.c, 0)}</div></td></tr>`).join("");
  const uses = [], keys = [];
  shuffle(L.chars).slice(0, 12).forEach((it, i) => { const s = pickSentence(it, L) || it.w; const idx = s.indexOf(it.w);
    const bw = [...it.w].map(ch => ch === it.c ? "（　　）" : ch).join(""); const q = idx >= 0 ? s.slice(0, idx) + bw + s.slice(idx + it.w.length) : bw;
    const opts = shuffle([it.c].concat(distractors(it, 3, learned(L)))); uses.push(`<li><div>${esc2(q)}</div><div class="op">${opts.map((o, k) => "ABCD"[k] + "．" + esc2(o)).join("　　")}</div></li>`);
    keys.push((i + 1) + ". " + "ABCD"[opts.indexOf(it.c)] + "（" + it.c + "）"); });
  /* 跟平台其他匯出文件一樣：開站上的 print.html，上面一排「列印／存成 PDF」和字體選單（列印時不印），預設標楷體＋Times New Roman */
  const KT = '"Times New Roman",Times,"DFKai-SB","BiauKai","Kaiti TC","Kaiti","標楷體","TW-Kai",serif';
  const doc = `<!doctype html><html lang="zh-Hant-TW"><head><meta charset="utf-8"><title>${esc2(L.label)}・漢字學習單</title>
<meta name="qna-font" content="QNAFONT_FIXED">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ivanagyro/tw-kai@20260805.1.0/tw-kai.css">
<style id="fsx">html body{font-family:${KT}!important}</style>
<style>@page{size:A4;margin:12mm}body{color:#1B2533;background:#EEF2F8;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.bar{max-width:210mm;margin:10px auto;display:flex;gap:10px;justify-content:center;align-items:center;flex-wrap:wrap;font-family:"Noto Sans TC","Microsoft JhengHei",sans-serif!important;font-size:14px}
.bar button{background:#1E4C86;color:#fff;border:0;border-radius:9px;padding:10px 20px;font-size:15px;cursor:pointer}
.bar select{font-size:14px;padding:5px 8px;border-radius:8px;border:1px solid #c9d3e0}.bar .hint{color:#5B6878;font-size:12px}
.page{max-width:186mm;margin:0 auto 20px;background:#fff;padding:12mm;box-shadow:0 2px 12px rgba(22,40,70,.12)}
@media print{.bar{display:none!important}body{background:#fff}.page{margin:0;padding:0;box-shadow:none;max-width:none}}
body:not(.show-key) .key{display:none}
h1{font-size:20pt;color:#1E4C86;margin:0 0 2mm}.sub{font-family:"Noto Sans TC",sans-serif;font-size:9.5pt;color:#5B6878;margin-bottom:4mm}
h2{font-size:13pt;color:#fff;background:#1E4C86;padding:1mm 3mm;border-radius:1.5mm;margin:5mm 0 2mm}
table{border-collapse:collapse;width:100%}td{border-bottom:.2mm solid #D3DCE8;padding:1.6mm 1.5mm;vertical-align:middle}
td.no{font-family:sans-serif;font-size:8pt;color:#8a96a5;width:5mm}td.big{font-size:30pt;color:#1E4C86;width:14mm;text-align:center}
.w{font-size:13pt}.py{font-family:"Noto Sans TC",sans-serif;font-size:9pt;color:#5B6878}.m{font-family:"Noto Sans TC",sans-serif;font-size:8.5pt;color:#5B6878}.pt{font-size:10pt;color:#2E7D5B}
td.tr{white-space:nowrap;width:78mm}.trw{display:flex;gap:1mm;align-items:center}.g{display:block;flex:none;vertical-align:top;width:14mm;height:14mm;border:.3mm solid #9AA7B6;margin-left:1mm;position:relative;font-size:30pt;line-height:14mm;text-align:center;color:#D5DDE8;
background:linear-gradient(#E3E9F1,#E3E9F1) center/.2mm 100% no-repeat,linear-gradient(#E3E9F1,#E3E9F1) center/100% .2mm no-repeat}
ol{padding-left:6mm;margin:0}li{font-size:13pt;margin:2.5mm 0;break-inside:avoid}.op{font-size:13pt;color:#1E4C86;margin-top:1mm}
.key{font-family:"Noto Sans TC",sans-serif;font-size:8.5pt;color:#5B6878;margin-top:6mm;border-top:.2mm dashed #9AA7B6;padding-top:2mm}
.name{float:right;font-family:"Noto Sans TC",sans-serif;font-size:10pt}tr{break-inside:avoid}.g.gh{color:#CBD5E2}</style></head><body class="show-key">
<div class="bar"><button onclick="window.print()">🖨 列印 / 存成 PDF</button>
<span>字體</span><select id="fs"><option value="kt">標楷體 ＋ Times New Roman —— 標準</option><option value="tw">全字庫正楷體（台灣教育部標準字形）</option></select>
<label><input type="checkbox" id="ky" checked> 印答案</label><span class="hint">列印時這排按鈕不會印出來；要存 PDF，在列印視窗的「目的地」選「另存為 PDF」</span></div>
<div class="page"><div class="name">姓名：＿＿＿＿＿＿　日期：＿＿＿＿＿</div><h1>${esc2(L.label)}・漢字學習單</h1><div class="sub">①看部件：這個字是哪幾個部件拼成的　②寫：先描兩次，再自己寫三次　③用：選出句子裡應該放的字</div>
<h2>①拼 ②寫</h2><table>${rows}</table><h2>③用</h2><ol>${uses.join("")}</ol>
<div class="key">答案：${keys.join("　")}</div></div>
<script>(function(){var fs=document.getElementById("fs"),st=document.getElementById("fsx");
fs.addEventListener("change",function(){st.textContent=fs.value==="tw"?'html body{font-family:"TW-Kai","Times New Roman","標楷體",serif!important}':'html body{font-family:${KT.replace(/"/g, '\\"')}!important}';});
document.getElementById("ky").addEventListener("change",function(e){document.body.classList.toggle("show-key",e.target.checked);});})();<\/script></body></html>`;
  try {
    const k = "__qnaprint_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(k, doc);
    const w = window.open("/print.html#" + k, "_blank");
    if (w) return;
    try { localStorage.removeItem(k); } catch(_){}
    toast("請允許彈出視窗後再按一次"); return;
  } catch(e){}
  const w = window.open("", "_blank"); if (!w){ toast("請允許彈出視窗後再按一次"); return; }
  w.document.open(); w.document.write(doc); w.document.close();
}
const PJ = { L:null, list:[], i:0, step:0, writer:null };
function startProject(L){
  Object.assign(PJ, { L, list:L.chars.slice(), i:0, step:0 });
  let ov = $("#proj"); if (!ov){ ov = el("div", { id:"proj", class:"proj" }); document.body.append(ov); }
  ov.hidden = false; try { ov.requestFullscreen && ov.requestFullscreen(); } catch(e){}
  renderProject();
}
function closeProject(){ const ov = $("#proj"); if (ov) ov.hidden = true; try { document.fullscreenElement && document.exitFullscreen(); } catch(e){} }
function renderProject(){
  const ov = $("#proj"), it = PJ.list[PJ.i]; ov.innerHTML = "";
  const top = el("div", { class:"pjtop" }, [el("b", { text:PJ.L.label }), el("span", { text:`${PJ.i + 1}／${PJ.list.length}` })]);
  const close = el("button", { class:"btn small", text:"結束投影（Esc）" }); close.onclick = closeProject; top.append(close);
  ov.append(top);
  const stage = el("div", { class:"pjstage" }); ov.append(stage);
  const labels = ["猜猜看：是哪個字？", "部件", "寫寫看（看筆順）", "用用看"];
  stage.append(el("div", { class:"pjstep", text: labels[PJ.step] }));
  if (PJ.step === 0){
    stage.append(el("div", { class:"pjword", text:[...it.w].map(ch => ch === it.c ? "□" : ch).join("") }), el("div", { class:"pjpy", text:(it.wpy || it.py) + (it.mean ? "　" + it.mean : "") }));
  } else if (PJ.step === 1){
    const e = CH[it.c];
    if (e && e.p){ const row = el("div", { class:"pjparts" }); e.p.forEach((p, k) => { if (k) row.append(el("span", { class:"plus", text:"＋" }));
      row.append(el("div", { class:"pjcard" }, [el("div", { class:"pc", text:p }), el("small", { text: p in RAD ? (radName(p, it.c) || p) + "：" + (RAD[p].hint || "").replace(/\n/g, "；") : (pyOf(p) ? "讀 " + pyOf(p) : "部件") })])); });
      row.append(el("span", { class:"plus", text:"＝" }), el("div", { class:"pjcard big" }, [el("div", { class:"pc", text:it.c })])); stage.append(row);
      const o = originBlock(e.p.find(p => ORIGIN[p]) || ""); if (o) stage.append(o);
    } else stage.append(el("div", { class:"pjword", text:it.c }), el("p", { class:"muted", text:"這個字本身就是一個部件，拆不開。" }));
  } else if (PJ.step === 2){
    const hw = el("div", { class:"pjhw" }); stage.append(hw, el("div", { class:"pjpy", text:it.w + "　" + (it.wpy || it.py) }));
    if (window.HanziWriter){ const W = HanziWriter.create(hw, it.c, { width:340, height:340, padding:10, strokeColor:css("--navy"), outlineColor:css("--line"), strokeAnimationSpeed:1, delayBetweenStrokes:250 }); W.animateCharacter(); }
  } else {
    const s = pickSentence(it, PJ.L) || it.w, idx = s.indexOf(it.w);
    const bw = [...it.w].map(ch => ch === it.c ? "（　）" : ch).join("");
    stage.append(el("div", { class:"pjsent", text: idx >= 0 ? s.slice(0, idx) + bw + s.slice(idx + it.w.length) : bw }));
    const opts = shuffle([it.c].concat(distractors(it, 3, learned(PJ.L)))); const row = el("div", { class:"pjopts" });
    opts.forEach(o => { const b = el("button", { class:"copt", text:o }); b.onclick = () => { b.classList.add(o === it.c ? "right" : "wrong"); if (o === it.c) say(it.w); }; row.append(b); });
    stage.append(row);
  }
  const nav = el("div", { class:"pjnav" });
  const prev = el("button", { class:"btn", text:"← 上一步" }); prev.onclick = () => projMove(-1);
  const next = el("button", { class:"btn primary", text:"下一步 →" }); next.onclick = () => projMove(1);
  const sayB = el("button", { class:"btn", text:"🔊 讀音" }); sayB.onclick = () => say(`${it.c}，${it.w}的${it.c}`);
  nav.append(prev, sayB, next); ov.append(nav);
}
function projMove(d){ PJ.step += d; if (PJ.step > 3){ PJ.step = 0; PJ.i = Math.min(PJ.list.length - 1, PJ.i + 1); } if (PJ.step < 0){ PJ.step = 3; PJ.i = Math.max(0, PJ.i - 1); } renderProject(); }
document.addEventListener("keydown", e => { const ov = $("#proj"); if (!ov || ov.hidden) return; if (e.key === "ArrowRight" || e.key === " "){ e.preventDefault(); projMove(1); } else if (e.key === "ArrowLeft") projMove(-1); else if (e.key === "Escape") closeProject(); });

// ================= 我的紀錄 =================
function renderBadges(){
  const g = $("#badges"); if (!g) return; g.innerHTML = "";
  BADGES.forEach(([id, ic, name, desc]) => g.append(el("div", {class:"bdg" + (rec.badges[id] ? "" : " off")}, [el("span", {class:"ic", text:ic}), el("div", {}, [el("b", {text:name}), el("small", {text:desc})])])));
}
function renderHard(){
  const g = $("#hardgrid"); g.innerHTML = "";
  const hs = Object.entries(rec.hard).sort((a, b) => b[1].miss - a[1].miss);
  $("#hardPractice").disabled = !hs.length;
  if (!hs.length){ g.append(el("p", {class:"muted", text:"目前沒有難字。去「回想關」寫寫看吧！"})); return; }
  hs.forEach(([c, h]) => { const x = CH[c]; if (!x) return;
    const card = el("div", {class:"hardcard", title:"聽讀音"}, [el("span", {class:"hz", text:c}), el("div", {}, [el("div", {text:x.py + "　" + x.w}), el("div", {class:"muted", style:"font-size:12px", text:`寫錯 ${h.miss} 次・連對 ${h.ok || 0}`})])]);
    card.onclick = () => say(c + "，" + x.w); g.append(card); });
}
function sumStars(d){ return Object.values(rec.stars[d] || {}).reduce((a, b) => a + b, 0); }
function renderMe(){
  const s = $("#meSummary"); s.innerHTML = "";
  const rc = rec.recall.done ? Math.round(rec.recall.ok / rec.recall.done * 100) + "%" : "—";
  [["等級", `${levelOf(rec.xp) + 1}・${XPLV[levelOf(rec.xp)][1]}`], ["經驗值", rec.xp + " XP"], ["星星（入門／進階／高手）", `${sumStars("easy")}／${sumStars("normal")}／${sumStars("hard")}`], ["拼出的字", Object.keys(rec.found).length + "／" + Object.keys(CH).length], ["最高連擊", "×" + rec.bestCombo], ["回想關正確率", rc]]
    .forEach(([k, v]) => s.append(el("div", {}, [el("small", {text:k}), el("b", {text:v})])));
  renderBadges(); renderHard();
}
$("#hardPractice").onclick = () => { showTab("recall"); startRecall(Object.keys(rec.hard)); };

// ================= 字源圖鑑、開關 =================
(() => { const a = $("#atlas"); [...Object.keys(RAD), ...Object.keys(COMP)].forEach(s => { const b = originBlock(s); if (b) a.append(b); }); })();
(() => { const t = $("#gwToggle"); const on = ls.get("zzgf-gw") !== "0"; t.checked = on; document.body.classList.toggle("no-gw", !on);
  t.onchange = () => { document.body.classList.toggle("no-gw", !t.checked); ls.set("zzgf-gw", t.checked ? "1" : "0"); }; })();

(() => { const s = $("#fontSel"); const v = ls.get("zzgf-font") === "wk" ? "wk" : "kai"; s.value = v; document.body.classList.toggle("font-wk", v === "wk");
  s.onchange = () => { document.body.classList.toggle("font-wk", s.value === "wk"); ls.set("zzgf-font", s.value); }; })();
setDiff(diff); renderLevel(); renderBadges();

// 上一次有課本的人：一打開就先顯示「課本」，不要先閃一下闖關地圖
if (ls.get("hz-hascourse") === "1" && !new URLSearchParams(location.search).get("task")){ const tb = document.querySelector('nav.tabs button[data-tab="course"]'); if (tb) tb.hidden = false; showCourseHome(); }
// ================= 連線（QNA 學習平台的 Firebase 帳號） =================
(() => {
  const fb = window.firebase;
  if (!fb || !fb.auth || !window.DB || DB.mode !== "firebase"){ $("#loginNote").hidden = false; setWho("訪客（紀錄只存在這台電腦）"); renderMap(); C.loaded = true; loadCourse(null).then(() => { if (C.lessons.length) showCourseHome(); }); return; }
  fb.auth().onAuthStateChanged(async u => {
    if (!u){ store.me = null; store.uid = null; hzGate("guest"); return; }
    store.uid = u.uid;
    try {
      const em = String(u.email || "").toLowerCase();
      store.teacher = !!(window.TEACHER_EMAIL && em === String(window.TEACHER_EMAIL).toLowerCase());
      const ss = await DB.listWhere("students", "uid", u.uid);
      store.me = ss.find(x => x && !x.deleted_at) || null;
      if (!store.me && store.teacher) store.me = null;
      // 自己註冊的會員（members）：跟學生端一樣，id 用 mem_ 開頭
      if (!store.me && !store.teacher){ const ms = await DB.listWhere("members", "uid", u.uid); const m = (ms || []).find(x => x && !x.deleted_at);
        if (m) store.me = { id:"mem_" + m.id, name:m.name || "", uid:u.uid, member:true }; }
    } catch(e){}
    if (!store.me && !store.teacher){ hzGate("nomember"); return; }
    hzUngate();
    $("#loginNote").hidden = !!(store.me || store.teacher);
    // 每個帳號自己的本機備份
    LSKEY = "hz-rec-" + u.uid;
    const local = normRec(JSON.parse(ls.get(LSKEY) || "null"));
    let remote = null;
    try { const rs = await DB.listWhere("results", "uid", u.uid); const d = rs.find(x => x && x.kind === "hanzi" && x.lesson_id === "__hanzi__"); if (d && d.rec) remote = normRec(JSON.parse(JSON.stringify(d.rec))); } catch(e){}
    rec = remote && (remote.xp || 0) >= (local.xp || 0) ? remote : local;
    ls.set(LSKEY, JSON.stringify(rec));
    if (store.me && (!remote || (remote.xp || 0) < (rec.xp || 0))) save();
    // 老師指派的作業
    try {
      const snap = await fb.firestore().collection("lessons").where("read_uids", "array-contains", u.uid).get();
      store.tasks = snap.docs.map(d => Object.assign({ id:d.id }, d.data())).filter(t => t && t.kind === "hanzitask" && !t.deleted_at && (!!STAGES[t.fam] || String(t.fam).startsWith("L:")));
    } catch(e){ store.tasks = []; }
    setWho(store.me ? "紀錄會自動儲存" : (store.teacher ? "老師帳號（試玩，不存紀錄）" : "這個帳號還不是學生"));
    renderLevel(); renderBadges(); renderMap();
    await loadCourse(u.uid);
    const q = new URLSearchParams(location.search).get("task");
    const t = q && store.tasks.find(x => x.id === q);
    if (q === "review" && dueReview().length) startReview();
    else if (t){ if (DIFF[t.diff]) setDiff(t.diff); playStage(t.fam); }
    else if (C.lessons.length) showCourseHome();
  });
})();
// ================= 要註冊才能玩 =================
// 沒登入、或登入了但不是學生／會員／老師：整個遊戲蓋起來，只給「免費註冊」和「登入」
function hzGate(kind){
  document.body.classList.add("hz-gated"); try { setWho(kind === "nomember" ? "已登入，但還沒有會員資料" : "還沒登入"); } catch(e){}
  let g = $("#hzGate"); if (!g){ g = el("section", { id:"hzGate", class:"hzgate" }); const nav = document.querySelector("nav.tabs"); (nav ? nav.parentNode : document.body).insertBefore(g, nav ? nav.nextSibling : null); }
  const back = encodeURIComponent("hanzi");
  g.innerHTML = "";
  g.append(el("div", { class:"gbig", text:"字" }),
    el("h2", { text: kind === "nomember" ? "這個帳號還沒有會員資料" : "免費註冊，就能玩漢字遊戲" }),
    el("p", { class:"vi", text: kind === "nomember" ? "Tài khoản này chưa có hồ sơ hội viên." : "Đăng ký miễn phí để chơi trò chơi chữ Hán." }),
    el("p", { text:"只要名字和 Email，不用付款。註冊以後可以玩闖關、課本練習、漢字大富翁，紀錄會自動存起來，老師也看得到你的進度。" }),
    el("p", { class:"vi", text:"Chỉ cần tên và email, không cần thanh toán. Kết quả được lưu tự động và giáo viên xem được tiến độ của bạn." }),
    el("div", { class:"row gbtn" }, [
      el("a", { class:"btn primary big", href:"student.html?reg=1&next=" + back, text:"免費註冊 · Đăng ký miễn phí" }),
      kind === "nomember" ? null : el("a", { class:"btn big", href:"student.html?next=" + back, text:"已經有帳號，登入 · Đăng nhập" })]));
}
function hzUngate(){ document.body.classList.remove("hz-gated"); const g = $("#hzGate"); if (g) g.remove(); }

// ================= 給「漢字大富翁」（hanzi-fuweng.js）用的介面 =================
/* ══════ LDD_V1469 選課下拉（生詞遊戲和大富翁共用一份） ══════
   Quinn：「爲什麼不使用下拉方式？」十五課排成卡片格，一列塞不下右邊就被切掉，
   換行又長短不一。但選課是可以複選的，單純的 <select> 做不到，
   所以用 <details> 收成一行：平常只看到「已選 3 課」，點開才是一課一列的勾選清單
   （課號、課名、這一課有幾個詞）。沒有生詞的課標灰、勾不動——以前是點下去才發現玩不了。
   wordN 由呼叫的人提供，因為生詞遊戲和大富翁算「能玩幾個詞」的規則不一樣。 */
function lessonDropdown(o){
  const rows = (o.lessons || []).map((L, i) => {
    const full = String(L.label || "").split("・").pop();
    const m = /^\s*第?\s*([0-9０-９一二三四五六七八九十百]+)\s*課\s*[：:．.、]?\s*(.*)$/.exec(full);
    return { L, no: m ? m[1] : String(i + 1), ttl: (m && m[2]) ? m[2] : full, full, wn: o.wordN(L) };
  });
  const list = el("div", { class:"lddlist" });
  const sumT = el("span", { class:"t" });
  const sum = el("summary", { class:"lddsum" }, [sumT]);
  const dd = el("details", { class:"ldd" }, [sum, list]);
  const paint = () => {
    const sel = o.selected() || [];
    const n = rows.filter(r => sel.includes(r.L.id)).length;
    sumT.textContent = n ? `已選 ${n} 課` : "還沒選課——點開來勾";
    dd.classList.toggle("none", !n);
    [...list.querySelectorAll("input")].forEach(i => { i.checked = sel.includes(i.value); });
  };
  const mk = (txt, fn) => { const b = el("button", { type:"button", class:"btn small", text:txt });
    b.onclick = (e) => { e.preventDefault(); fn(); paint(); }; return b; };
  list.append(el("div", { class:"lddbar" }, [
    mk("全選", () => o.onAll(rows.filter(r => r.wn).map(r => r.L.id))),
    mk("清除", () => o.onNone(rows.map(r => r.L.id)))]));
  rows.forEach(r => {
    const cb = el("input", { type:"checkbox", value:r.L.id });
    if (!r.wn) cb.disabled = true;
    else cb.onchange = () => { o.onToggle(r.L.id, cb.checked); paint(); };
    list.append(el("label", { class:"lddrow" + (r.wn ? "" : " off"),
      title: r.wn ? r.full : (r.full + "（這一課還沒有生詞）") },
      [cb, el("span", { class:"n", text:r.no }), el("span", { class:"t", text:r.ttl }),
       el("span", { class:"w", text: r.wn ? (r.wn + " 詞") : "沒有生詞" })]));
  });
  paint();
  return { el:dd, paint };
}
window.HZAPI = { zili, makesWord, pySplit, charPy, cvVariants, pysOf, radName, vnorm, sameWord, okDistract/* VAR_V1468 */, lessonDropdown/* LDD_V1469 */, OV, loadOv, ovStyle, CH, RAD, LEVELS, FAM, C, NOSTROKE, el, shuffle, css, toneless, pyOf, say, sfx, burst, toast, centerOf, distractors, originBlock, glyphRow, showTab, todayStr, loadCourse,
  store, getRec: () => rec, save, addXp,
  addReview(c, w, py){ if (!store.me || !c || rec.review[c]) return false; rec.review[c] = { box:0, due:todayStr(1), lid:"", w:w || "", py:py || "", mean:"" }; return true; } };
document.dispatchEvent(new Event("hzapi"));
})();
