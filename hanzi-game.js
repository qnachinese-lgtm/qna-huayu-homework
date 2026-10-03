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
const pyOf = s => COMP[s] || (CH[s] && CH[s].py) || "";
const BON = {}; BONUS.forEach(b => BON[b.c] = b);
const NOSTROKE = new Set(DATA.nostroke || []);
// 關卡：第 0 組是精選字族，後面是華語八千詞的七個等級
const LEVELS = [{ name:"精選字族", short:"精選", stages: FAM.map(f => ({ id:f.name, name:f.name, key:f.key, chars:f.chars.map(x => x.c), curated:true })) }]
  .concat(HZ.levels.map(L => ({ name:L.name, short:L.name.replace("級", ""), stages:L.stages })));
const STAGES = {};
LEVELS.forEach((L, li) => L.stages.forEach((s, i) => { s.li = li; s.i = i; STAGES[s.id] = s; }));
const stageName = id => STAGES[id] ? (STAGES[id].li ? LEVELS[STAGES[id].li].short + "・" : "") + STAGES[id].name : id;
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
function emptyRec(){ return { v:2, xp:0, totalScore:0, found:{}, hard:{}, recall:{done:0, ok:0}, stars:{easy:{}, normal:{}, hard:{}}, badges:{}, bestCombo:0, bonus:{}, originViews:0, wins:0, lastAt:0, sessions:[] }; }
function normRec(r){ const e = emptyRec(); r = Object.assign(e, r || {}); r.stars = Object.assign({easy:{}, normal:{}, hard:{}}, r.stars || {}); if (!r.xp && r.totalScore) r.xp = r.totalScore; return r; }
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
  const name = sym in RAD ? RAD[sym].name : (pyOf(sym) ? "讀 " + pyOf(sym) : "部件");
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
  hard:  { name:"高手", hearts:3, clue:"audio", check:"submit", extra:10, perChar:20, info:"一題一題來，只聽讀音拼字；拼錯扣一顆心，還有倒數計時。剩下的時間會變成加分。" },
  battle:{ name:"對戰", hearts:0, clue:"full",  check:"auto",   extra:4,  perChar:0,  info:"" }
};

// ================= 工坊（關卡核心） =================
function Shop(root, cfg){
  let st = null;
  const api = {};
  function build(){
    root.innerHTML = "";
    const D = DIFF[st.diff];
    // 狀態列
    const bar = el("div", {class:"stagebar"});
    const scoreB = el("b", {text:"0"}), comboB = el("b", {class:"combo", text:"—"}), progB = el("b", {text:"0／0"});
    const hearts = el("div", {class:"hearts"}); const timerB = el("b", {class:"timer", text:""});
    bar.append(el("span", {class:"ttl", text: cfg.title ? cfg.title(st) : st.fams.join("、")}));
    bar.append(el("div", {class:"stat"}, [el("small", {text:"分數"}), scoreB]));
    bar.append(el("div", {class:"stat"}, [el("small", {text:"進度"}), progB]));
    bar.append(el("div", {class:"stat"}, [el("small", {text:"連擊"}), comboB]));
    if (D.hearts) bar.append(el("div", {class:"stat"}, [el("small", {text:"生命"}), hearts]));
    if (D.perChar) bar.append(el("div", {class:"stat"}, [el("small", {text:"時間"}), timerB]));
    const right = el("div", {class:"right"});
    const hintB = el("button", {class:"btn small", text:"提示"}); hintB.onclick = hint;
    right.append(hintB);
    if (cfg.onQuit){ const q = el("button", {class:"btn small", text:"回地圖"}); q.onclick = () => { stopTimer(); cfg.onQuit(); }; right.append(q); }
    bar.append(right);
    root.append(bar);
    // 主體
    const left = el("div", {class:"box"}), rightBox = el("div", {class:"box"});
    const shop = el("div", {class:"shop"}, [left, rightBox]); root.append(shop);
    const qcard = el("div", {class:"qcard"}); const clues = el("div", {class:"clues"});
    if (D.clue === "audio"){
      const sb = el("button", {class:"say big", "aria-label":"聽題目"}); sb.innerHTML = SPEAK; sb.onclick = () => sayCurrent();
      qcard.append(sb, el("div", {}, [el("div", {class:"qt"}), el("div", {class:"qh"})]));
      left.append(qcard, el("p", {class:"muted", style:"font-size:13px;margin-bottom:8px", text:"每一題只要拼「一個字」。讀音會說「忘，忘記的忘」，拼出那一個字就好。拼錯兩次以後會出現拼音提示。"}));
    } else {
      left.append(el("p", {class:"muted", style:"font-size:13px;margin-bottom:8px", text: D.clue === "full" ? "看拼音和詞，猜猜□是哪個字，然後在右邊拼出來。" : "看詞猜猜□是哪個字。可以按喇叭聽這個詞。"}));
    }
    left.append(clues);
    const mat = el("div", {class:"mat"});
    const bench = el("div", {class:"bench", "aria-label":"工作檯"});
    const msg = el("div", {class:"benchmsg"});
    const clearB = el("button", {class:"btn small", text:"清空"});
    const okB = el("button", {class:"btn primary", text:"確定"});
    const acts = el("div", {class:"row"}, [clearB]); if (D.check === "submit") acts.append(okB);
    mat.append(el("h3", {text:"工作檯"}), bench, el("div", {class:"benchact"}, [msg, acts]));
    const result = el("div", {class:"result", hidden:""});
    const trayBuilt = el("div", {class:"tray"}), trayRad = el("div", {class:"tray"}), trayComp = el("div", {class:"tray"});
    const lblBuilt = el("div", {class:"traylabel", text:"已拼出的字（可以拿來升級成更大的字）"});
    rightBox.append(mat, result, lblBuilt, trayBuilt, el("div", {class:"traylabel", text:"部首卡：表示意思"}), trayRad, el("div", {class:"traylabel", text:"部件卡：常常表示聲音"}), trayComp);
    Object.assign(st.ui, { bar, scoreB, comboB, progB, hearts, timerB, qcard, clues, bench, msg, okB, result, trayBuilt, trayRad, trayComp, lblBuilt, shop, hintB });
    clearB.onclick = () => { st.bench = []; renderBench(); setMsg(""); };
    okB.onclick = submit;
  }
  function setMsg(t, cls = ""){ st.ui.msg.className = "benchmsg " + cls; st.ui.msg.textContent = t; }
  function kindOf(sym){ return sym in RAD ? "rad" : (SCOPE.has(sym) && st.found.has(sym)) ? "built" : "comp"; }
  function cardEl(sym, kind, i){
    const b = el("button", {class:"card " + kind + " deal", type:"button", "aria-label":sym, "data-sym":sym});
    b.style.animationDelay = (i * 22) + "ms";
    const label = kind === "rad" ? RAD[sym].name : kind === "comp" ? (DIFF[st.diff].clue === "full" ? pyOf(sym) : "") : (CH[sym] ? CH[sym].py : "");
    b.append(el("span", {class:"s", text:sym}), el("span", {class:"l", text:label}));
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
  function renderBench(){
    const bench = st.ui.bench; bench.innerHTML = ""; bench.classList.remove("wrong", "right");
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
    if (DIFF[st.diff].check === "auto") autoCheck(); else setMsg("");
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
    const D = DIFF[st.diff];
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
    st.bench = []; renderBench(); st.ui.bench.classList.add("right");
    setMsg(isBonus ? `加分字！「${c}」` : `拼出來了！「${c}」`, "good");
    if (!isBonus && n >= 4) unlock("big4");
    checkBadges();
    showResult(x, isBonus); say(x.c + "，" + x.w);
    renderClues(); buildTray(false); renderStatus();
    save(); cfg.onScore && cfg.onScore(st);
    if (st.targets.every(t => st.found.has(t))) setTimeout(() => finish(true), 1300);
    else if (st.seq) setTimeout(sayCurrent, 1500);
  }
  let WHYPY = "";
  function why(parts){
    const r = parts.find(s => s in RAD), cp = parts.find(s => !(s in RAD)); const bits = [];
    if (r && RAD[r].hint) bits.push(`${r}（${RAD[r].name}）表示「${RAD[r].hint.replace(/\n/g, "；")}」`);
    else if (r) bits.push(`${r}（${RAD[r].name}）`);
    if (cp && pyOf(cp)) bits.push(`${cp} 讀 ${pyOf(cp)}` + (WHYPY && toneless(pyOf(cp)) === toneless(WHYPY) ? "，和這個字的讀音一樣，是聲音線索" : ""));
    return bits.join("；");
  }
  function showResult(x, isBonus){
    const result = st.ui.result; result.hidden = false; result.innerHTML = "";
    const parts = isBonus ? x.p : (CH[x.c].p || []);
    const hw = el("div", {class:"hw"});
    const info = el("div", {}, [el("div", {class:"big"}, [el("b", {text:x.c}), "　" + x.py + "　" + x.w]),
      el("div", {class:"why", text: isBonus ? "加分字" : "記憶提示：" + x.tip}), el("div", {class:"why", text:(WHYPY = x.py, "字理：" + why(parts))})]);
    const sayB = el("button", {class:"btn small", text:"聽讀音"}); sayB.onclick = () => say(x.c + "，" + x.w);
    const againB = el("button", {class:"btn small", text:"再看一次筆順"});
    info.append(el("div", {class:"acts"}, [sayB, againB]));
    result.append(hw, info);
    const og = el("div", {class:"origins"}); [...new Set(parts.flatMap(x => expand(x)))].forEach(b => { const ob = originBlock(b); if (ob) og.append(ob); });
    if (og.children.length) result.append(og);
    if (window.HanziWriter){
      const w = HanziWriter.create(hw, x.c, { width:140, height:140, padding:8, strokeColor:css("--navy"), outlineColor:css("--line"), strokeAnimationSpeed:1.3, delayBetweenStrokes:160 });
      w.animateCharacter(); againB.onclick = () => w.animateCharacter();
    } else { hw.append(el("div", {class:"hz", style:"font-size:100px;text-align:center;line-height:140px", text:x.c})); againB.hidden = true; }
  }
  function renderClues(){
    const D = DIFF[st.diff], clues = st.ui.clues; clues.innerHTML = "";
    const cur = current();
    st.targets.forEach((c, i) => {
      const x = CH[c], done = st.found.has(c);
      if (D.clue === "audio"){
        const isCur = c === cur;
        clues.append(el("div", {class:"clue" + (done ? " done" : "") + (isCur ? " cur" : "")}, [
          el("div", {class:"py", text: done ? x.py : ""}), (done ? wordMark(x) : el("div", {class:"w", text: isCur ? "□" : "・"})), el("div", {class:"n", text: done ? "完成" : `第 ${i + 1} 題`})]));
        return;
      }
      const card = el("div", {class:"clue" + (done ? " done" : "")});
      card.append(el("div", {class:"py", text: D.clue === "full" || done ? x.py : ""}));
      card.append(done ? wordMark(x) : el("div", {class:"w", text: blankWord(x)}));
      if (D.clue === "full" || done) card.append(el("div", {class:"n", text: done ? "完成" : expand(c).length + " 張卡"}));
      else { const sb = el("button", {class:"say", "aria-label":"聽這個詞"}); sb.innerHTML = SPEAK; sb.onclick = () => say(sayQ(x)); card.append(sb); }
      clues.append(card);
    });
    if (D.clue === "audio" && cur){
      const x = CH[cur];
      st.ui.qcard.querySelector(".qt").textContent = `第 ${st.targets.indexOf(cur) + 1}／${st.targets.length} 題`;
      st.ui.qcard.querySelector(".qh").textContent = st.curMiss >= 2 || st.hintLevel ? `${x.py}　${blankWord(x)}` : "聽讀音拼字";
    }
  }
  function sayCurrent(){ const c = current(); if (c) say(sayQ(CH[c])); }
  function renderStatus(){
    const u = st.ui, D = DIFF[st.diff];
    u.scoreB.textContent = st.score; u.comboB.textContent = st.combo > 1 ? "×" + st.combo : "—";
    u.progB.textContent = `${st.targets.filter(c => st.found.has(c)).length}／${st.targets.length}`;
    if (D.hearts) u.hearts.innerHTML = Array.from({length:D.hearts}, (_, i) => HEART(i < st.hearts)).join("");
  }
  function buildTray(deal = true){
    const D = DIFF[st.diff];
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
    if (deal){ u.trayRad.innerHTML = ""; u.trayComp.innerHTML = ""; rads.forEach((s, i) => u.trayRad.append(cardEl(s, "rad", i))); comps.forEach((s, i) => u.trayComp.append(cardEl(s, "comp", i + rads.length))); }
    u.trayBuilt.innerHTML = "";
    const built = [...st.found].filter(c => canGrow([c]));
    built.forEach((c, i) => u.trayBuilt.append(cardEl(c, "built", 0)));
    u.lblBuilt.hidden = u.trayBuilt.hidden = !built.length;
    if (!deal) [u.trayRad, u.trayComp].forEach(t => t.querySelectorAll(".card").forEach(c => c.classList.remove("deal", "glow")));
  }
  function hint(){
    if (st.over) return;
    const target = current() || st.targets.find(c => !st.found.has(c)); if (!target) return;
    st.hints++; st.hintLevel = 1;
    const parts = expand(target);
    const show = st.hints >= 2 ? parts : (parts.filter(s => s in RAD).slice(0, 1).length ? parts.filter(s => s in RAD).slice(0, 1) : parts.slice(0, 1));
    document.querySelectorAll("#" + root.id + " .tray .card").forEach(c => c.classList.toggle("glow", show.includes(c.dataset.sym)));
    setMsg(st.hints >= 2 ? "發光的卡片可以拼出一個字。（用了提示，最多兩顆星）" : "先試試發光的部首卡。（用了提示，最多兩顆星）");
    renderClues();
  }
  // 計時
  function startTimer(){
    const D = DIFF[st.diff]; if (!D.perChar) return;
    st.deadline = Date.now() + (D.perChar * st.targets.length + 20) * 1000;
    st.tick = setInterval(() => { const left = Math.max(0, st.deadline - Date.now()); const s = Math.ceil(left / 1000);
      st.ui.timerB.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); st.ui.timerB.classList.toggle("low", s <= 15);
      if (left <= 0) finish(false, "時間到了"); }, 250);
  }
  function stopTimer(){ if (st && st.tick){ clearInterval(st.tick); st.tick = null; } }
  function finish(ok, reason){
    if (st.over) return; st.over = true; stopTimer(); st.locked = true; root.classList.add("locked");
    let stars = 0, timeBonus = 0;
    if (ok){
      stars = st.mistakes === 0 && st.hints === 0 ? 3 : (st.mistakes <= 2 && st.hints <= 1 ? 2 : 1);
      if (st.deadline) timeBonus = Math.round(Math.max(0, st.deadline - Date.now()) / 1000) * 2;
    }
    const total = st.score + timeBonus;
    if (cfg.onEnd) cfg.onEnd({ ok, reason, stars, score:st.score, timeBonus, total, st });
  }
  api.start = (opt) => {
    stopTimer();
    const stage = opt.stage;
    st = { stage, fams:[stage.id], diff:opt.diff, seq: DIFF[opt.diff].clue === "audio", seed: opt.seed || Math.floor(Math.random() * 1e9), ui:{}, bench:[], found:new Set(), bonus:new Set(),
      score:0, combo:0, bestCombo:0, mistakes:0, hints:0, hintLevel:0, curMiss:0, hearts:DIFF[opt.diff].hearts, locked:false, over:false, extras:null };
    st.rnd = seeded(st.seed);
    let targets = stage.chars.filter(c => CH[c] && CH[c].p);
    setScope(targets, !!stage.curated);
    // 多層字要在基礎字後面出現（高手一題一題時，也照順序出）
    targets = st.seq ? shuffle(targets, st.rnd).sort((a, b) => expand(a).length - expand(b).length) : targets;
    st.targets = targets;
    root.classList.remove("locked");
    build(); renderClues(); renderBench(); buildTray(true); renderStatus(); startTimer();
    if (st.seq) setTimeout(sayCurrent, 700);
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
document.querySelectorAll("nav.tabs button").forEach(b => b.onclick = () => { if (b.dataset.tab === "map" && stageShop.state() && !stageShop.state().over && !$("#p-stage").hidden) return; showTab(b.dataset.tab); });

// ================= 關卡地圖 =================
let diff = ls.get("zzgf-diff") || "easy"; if (!DIFF[diff] || diff === "battle") diff = "easy";
function setDiff(d){ diff = d; ls.set("zzgf-diff", d); document.querySelectorAll("#diffSeg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.d === d)); $("#diffInfo").textContent = DIFF[d].info; renderMap(); }
document.querySelectorAll("#diffSeg button").forEach(b => b.onclick = () => setDiff(b.dataset.d));
let curLv = Math.min(LEVELS.length - 1, Math.max(0, Number(ls.get("hz-lv") || 0) || 0));
function setLv(i){ curLv = i; ls.set("hz-lv", String(i)); renderMap(); }
function unlocked(stage){
  if (stage.i === 0 || store.teacher) return true;
  if (taskFams().includes(stage.id)) return true;
  const prev = LEVELS[stage.li].stages[stage.i - 1];
  return (rec.stars[diff][prev.id] || 0) > 0;
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
  const hw = el("div", {class:"hw", style:"margin:12px auto"}); const info = el("p", {class:"muted", style:"min-height:24px"});
  const list = el("div", {class:"learned"});
  atoms.forEach(x => { const b = el("button", {text:x.c, title:x.w}); b.onclick = () => {
    say(x.c + "，" + x.w + "的" + x.c); info.textContent = `${x.c}　${x.py}　${x.w}`; hw.innerHTML = "";
    if (window.HanziWriter && !NOSTROKE.has(x.c)){ const w = HanziWriter.create(hw, x.c, { width:140, height:140, padding:8, strokeColor:css("--navy"), outlineColor:css("--line"), strokeAnimationSpeed:1.3, delayBetweenStrokes:160 }); w.animateCharacter(); }
    else hw.append(el("div", {class:"hz", style:"font-size:100px;text-align:center;line-height:140px", text:x.c}));
  }; list.append(b); });
  const close = el("button", {class:"btn", text:"關閉"}); close.onclick = closeOverlay;
  card.append(hw, info, list, el("div", {class:"endbtns"}, [close]));
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
function playStage(id){ if (!STAGES[id]) return; curStage = id; curLv = STAGES[id].li; showTab("stage"); stageShop.start({ stage:STAGES[id], diff }); window.scrollTo({top:0}); }
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
  if (r.ok && r.stars < 3) card.append(el("p", {class:"muted", style:"font-size:13px;margin-bottom:10px", text:"三顆星的條件：不拼錯、不用提示。"}));
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

// ================= 連線（QNA 學習平台的 Firebase 帳號） =================
(() => {
  const fb = window.firebase;
  if (!fb || !fb.auth || !window.DB || DB.mode !== "firebase"){ $("#loginNote").hidden = false; setWho("訪客（紀錄只存在這台電腦）"); renderMap(); return; }
  fb.auth().onAuthStateChanged(async u => {
    if (!u){ store.me = null; store.uid = null; $("#loginNote").hidden = false; setWho("訪客（紀錄只存在這台電腦）"); renderMap(); return; }
    store.uid = u.uid;
    try {
      const em = String(u.email || "").toLowerCase();
      store.teacher = !!(window.TEACHER_EMAIL && em === String(window.TEACHER_EMAIL).toLowerCase());
      const ss = await DB.listWhere("students", "uid", u.uid);
      store.me = ss.find(x => x && !x.deleted_at) || null;
      if (!store.me && store.teacher) store.me = null;
    } catch(e){}
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
      store.tasks = snap.docs.map(d => Object.assign({ id:d.id }, d.data())).filter(t => t && t.kind === "hanzitask" && !t.deleted_at && !!STAGES[t.fam]);
    } catch(e){ store.tasks = []; }
    setWho(store.me ? "紀錄會自動儲存" : (store.teacher ? "老師帳號（試玩，不存紀錄）" : "這個帳號還不是學生"));
    renderLevel(); renderBadges(); renderMap();
    const q = new URLSearchParams(location.search).get("task");
    const t = q && store.tasks.find(x => x.id === q);
    if (t){ if (DIFF[t.diff]) setDiff(t.diff); playStage(t.fam); }
  });
})();
})();
