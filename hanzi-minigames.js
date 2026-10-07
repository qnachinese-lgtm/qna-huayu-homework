/* 小遊戲（hanzi-minigames.js）── 生詞賓果、翻牌配對、快問快答、句子排序
   Quinn（2026-10-07）：「幫我製作一些生詞賓果、翻牌配對、快問快答搶分、句子排序這些遊戲，全部都幫我做」
   題目都從「我的課本」來（老師後台指派的課）；沒有課本的時候用華語八千詞。
   不翻成越南文（data-novi）。不用電腦語音（Quinn 不要 AI 聲音考聽力）。
   快問快答的「老師開房」用 Firestore 的 hz_rooms（跟大富翁連線同一個集合），學生用自己的帳號登入、輸入代碼加入。 */
(() => {
"use strict";
function boot(){
const A = window.HZAPI; if (!A || window.__MG) return; window.__MG = true;
const { CH, LEVELS, C, shuffle, pyOf, sfx, burst, toast, centerOf, distractors } = A;
const $ = s => document.querySelector(s);
const el = (tag, attrs = {}, kids = []) => { const fn = {}, at = {}; for (const k in attrs){ if (typeof attrs[k] === "function") fn[k] = attrs[k]; else if (attrs[k] != null && attrs[k] !== false) at[k] = attrs[k]; } const n = A.el(tag, at, kids); Object.assign(n, fn); return n; };
const HAN = /^[㐀-鿿]+$/;
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const btn = (text, onclick, cls) => el("button", { class:"btn " + (cls || ""), type:"button", text, onclick });

// ---------- 設定（記在這台裝置）----------
const SET = { src:"course", tb:"", lids:[], lv:1 };
try { Object.assign(SET, JSON.parse(localStorage.getItem("hz-mg") || "{}")); } catch(e){}
const keep = () => { try { localStorage.setItem("hz-mg", JSON.stringify(SET)); } catch(e){} };

// ---------- 題目來源：生詞＋句子 ----------
function pool(){
  const words = [], seen = new Set(), sents = [];
  const put = (w, py, mean) => { w = String(w || "").trim(); py = (py || "").trim(); if (!w || !HAN.test(w) || w.length > 4) return;
    if (seen.has(w)){ const o = words.find(x => x.w === w); if (o && py && o.fb){ o.py = py; o.fb = false; } if (o && !o.mean && mean) o.mean = mean.trim(); return; }
    seen.add(w); words.push({ w, py:py || [...w].map(c => pyOf(c)).join(""), fb:!py, mean:(mean || "").trim() }); };
  if (SET.src === "course" && C.lessons.length){
    SET.lids.filter(id => C.byId[id]).forEach(id => { const L = C.byId[id];
      L.chars.forEach(x => { const w = x.word || x.w; put(w, [...w].length > 1 ? (x.w === w ? x.wpy : "") : x.py, x.mean); (x.ex || []).forEach(s => sents.push(s)); });
      (L.sents || []).forEach(s => sents.push(s)); });
  } else {
    const L = LEVELS[SET.lv] || LEVELS[1]; (L ? L.stages : []).forEach(st => st.chars.forEach(c => { const e = CH[c]; if (e && e.w) put(e.w, e.w.length === 1 ? e.py : ""); }));
  }
  const S2 = [...new Set(sents.map(s => String(s).replace(/\s+/g, "")))].filter(s => { const n = [...s].length; return n >= 5 && n <= 24 && /[㐀-鿿]/.test(s) && !/[A-Za-z]/.test(s); });
  return { words, sents:S2 };
}
const srcName = () => SET.src === "course" && C.lessons.length ? (SET.lids.filter(id => C.byId[id]).map(id => C.byId[id].label.split("・").pop()).join("、") || "還沒選課") : ((LEVELS[SET.lv] || {}).name || "華語八千詞");

// ---------- 畫面骨架 ----------
let GAME = null; // 現在在玩哪一個：{ k, stop() }
function panel(){ const P = $("#p-mg"); if (P && !P.hasAttribute("data-novi")){ P.setAttribute("data-novi", ""); P.setAttribute("translate", "no"); P.classList.add("notranslate"); } return P; }
function fsOn(){ try { const d = document.documentElement; if (!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen({ navigationUI:"hide" }).catch(() => {}); } catch(e){} }
function fsOff(){ try { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); } catch(e){} }
const isFs = () => !!document.fullscreenElement;
function stopGame(){ if (GAME && GAME.stop) try { GAME.stop(); } catch(e){} GAME = null; document.body.classList.remove("mg-ingame"); }
function shell(title, sub){
  const P = panel(); P.innerHTML = ""; document.body.classList.add("mg-ingame");
  const fsb = btn(isFs() ? "縮小" : "全螢幕", () => { isFs() ? fsOff() : fsOn(); setTimeout(() => { fsb.textContent = isFs() ? "縮小" : "全螢幕"; }, 300); }, "small");
  P.append(el("div", { class:"mghead" }, [btn(GAPP ? "← 全部遊戲" : "← 小遊戲", () => { stopGame(); fsOff(); home(); }, "small"), el("b", { class:"hz", text:title }), sub ? el("span", { class:"muted", text:sub }) : null, el("span", { class:"sp" }), fsb]));
  const body = el("div", { class:"mgbody" }); P.append(body); return body;
}
const GAMES = [
  { k:"bingo", t:"生詞賓果", d:"老師叫詞，學生找詞，先連成一條線的人贏。可以跟電腦玩，也可以全班一起玩。", ic:"賓" },
  { k:"flip", t:"翻牌配對", d:"翻兩張牌，把「詞」和它的拼音（或意思）配成一對。", ic:"配" },
  { k:"quiz", t:"快問快答", d:"看拼音選詞、看詞選拼音、選字填空。全班用手機一起搶分，或自己練習。", ic:"答" },
  { k:"order", t:"句子排序", d:"把課文的句子打散，排回正確的順序。", ic:"排" }
];
const GAPP = document.body.classList.contains("games-app");
const FWCARD = { k:"fw", t:"大富翁", d:"擲骰子走棋盤，地是課本的生詞。答對才買得到地，機會卡、命運卡要看懂中文。", ic:"富" };
function selTab(k){ document.querySelectorAll("nav.tabs button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.tab === "mg" ? (b.dataset.game || "") === (k || "") : false))); }
function home(){
  stopGame(); try { Object.assign(SET, JSON.parse(localStorage.getItem("hz-mg") || "{}")); } catch(e){}
  if (GAPP) selTab("");
  const P = panel(); P.innerHTML = "";
  P.append(el("div", { class:"mgtop" }, [el("h2", { text: GAPP ? "生詞遊戲" : "小遊戲" }), el("p", { class:"muted", text:"先選要玩哪幾課的生詞，再選一個遊戲。" })]));
  P.append(srcPicker());
  const g = el("div", { class:"mggrid" });
  (GAPP ? [FWCARD].concat(GAMES) : GAMES).forEach(x => g.append(el("button", { class:"mgcard", type:"button", onclick: () => x.k === "fw" ? goFw() : openGame(x.k) }, [el("span", { class:"mgic hz", text:x.ic }), el("b", { text:x.t }), el("small", { text:x.d })])));
  P.append(g);
}
function srcPicker(){
  const box = el("div", { class:"mgsrc box" });
  const has = C.lessons.length > 0, src = has ? SET.src : "lv";
  const segEl = el("div", { class:"seg" });
  [["course", "我的課本"], ["lv", "華語八千詞"]].forEach(([v, t]) => { if (v === "course" && !has) return; const b = el("button", { type:"button", text:t, "aria-pressed":String(src === v), onclick: () => { SET.src = v; keep(); home(); } }); segEl.append(b); });
  box.append(el("div", { class:"row" }, [el("b", { text:"生詞" }), segEl]));
  const info = el("small", { class:"muted" }); const upd = () => { const p = pool(); info.textContent = `已選：${srcName()}（${p.words.length} 個詞、${p.sents.length} 個句子）`; };
  if (src === "course"){
    const tbs = [...new Set(C.lessons.map(L => L.tb || "其他課"))]; if (!tbs.includes(SET.tb)) SET.tb = tbs[0];
    const sel = el("select", { class:"fwsel" }); tbs.forEach(t => sel.append(el("option", { value:t, text:t }))); sel.value = SET.tb; sel.onchange = () => { SET.tb = sel.value; keep(); home(); };
    const list = el("div", { class:"mglessons" });
    C.lessons.filter(L => (L.tb || "其他課") === SET.tb).forEach(L => { const cb = el("input", { type:"checkbox" }); cb.checked = SET.lids.includes(L.id);
      cb.onchange = () => { SET.lids = cb.checked ? SET.lids.concat(L.id) : SET.lids.filter(x => x !== L.id); keep(); upd(); };
      list.append(el("label", { class:"chk" }, [cb, " " + L.label.split("・").pop()])); });
    box.append(sel, list);
  } else {
    const sel = el("select", { class:"fwsel" }); LEVELS.forEach((L, i) => { if (i) sel.append(el("option", { value:i, text:L.name })); }); sel.value = SET.lv; sel.onchange = () => { SET.lv = Number(sel.value); keep(); upd(); }; box.append(sel);
  }
  box.append(info); upd(); return box;
}
function goFw(){ const b = document.querySelector('nav.tabs button[data-tab="fw"]'); if (b) b.click(); }
function openGame(k){
  if (GAPP){ A.showTab("mg"); selTab(k); }
  const p = pool();
  const need = { bingo:9, flip:6, quiz:4, order:0 }[k];
  if (k === "order" && p.sents.length < 3){ toast(SET.src === "course" ? "選的課沒有課文句子，請換幾課" : "句子排序要用「我的課本」的課文"); return; }
  if (p.words.length < need){ toast(`生詞太少了（至少要 ${need} 個），請多選幾課`); return; }
  ({ bingo:bingoHome, flip:flipSetup, quiz:quizHome, order:orderStart })[k](p);
}

// ============ 1. 生詞賓果 ============
const LINES = n => { const L = []; for (let i = 0; i < n; i++){ L.push([...Array(n)].map((_, j) => i * n + j)); L.push([...Array(n)].map((_, j) => j * n + i)); } L.push([...Array(n)].map((_, j) => j * n + j)); L.push([...Array(n)].map((_, j) => j * n + n - 1 - j)); return L; };
const lineCount = (marks, n) => LINES(n).filter(l => l.every(i => marks[i])).length;
function bingoHome(p){
  const b = shell("生詞賓果", srcName());
  const size = p.words.length >= 25 ? 5 : p.words.length >= 16 ? 4 : 3;
  b.append(el("div", { class:"mgmenu" }, [
    el("button", { class:"mgcard", type:"button", onclick: () => bingoBot(p, Math.min(size, 4)) }, [el("b", { text:"跟電腦玩" }), el("small", { text:"畫面出拼音，在你的卡上找到那個詞點下去。先連成一條線的人贏。" })]),
    el("button", { class:"mgcard", type:"button", onclick: () => bingoCaller(p) }, [el("b", { text:"老師叫詞（投影用）" }), el("small", { text:"老師的螢幕一次出一個詞，老師唸給學生聽。學生用自己的手機「我的賓果卡」或印出來的卡。" })]),
    el("button", { class:"mgcard", type:"button", onclick: () => bingoCard(p, size) }, [el("b", { text:"我的賓果卡（學生手機）" }), el("small", { text:"每個人拿到不一樣的卡。聽老師唸，點一下做記號，連成一條線就喊「賓果」！" })]),
    el("button", { class:"mgcard", type:"button", onclick: () => bingoPrint(p, size) }, [el("b", { text:"印賓果卡" }), el("small", { text:"印出每張都不一樣的卡，上課發給學生。" })])
  ]));
}
function bingoGrid(words, n, marks, onTap, cls){
  const g = el("div", { class:"bgrid " + (cls || ""), style:`--n:${n}` });
  words.forEach((w, i) => { const c = el("button", { class:"bcell" + (marks[i] ? " on" : "") + (w === "★" ? " free" : ""), type:"button", "data-i":i, onclick: () => onTap && onTap(i, c) }, [el("span", { class:"hz l" + Math.min(4, [...w].length), text:w })]); g.append(c); });
  return g;
}
function bingoBot(p, n){
  const b = shell("生詞賓果・跟電腦玩", srcName());
  const N2 = n * n, words = shuffle(p.words.slice()).slice(0, Math.max(N2 + 6, Math.min(p.words.length, N2 * 2)));
  const mine = shuffle(words.slice()).slice(0, N2), bot = shuffle(words.slice()).slice(0, N2);
  const calls = shuffle([...new Set(mine.concat(bot).map(x => x.w))]).map(w => words.find(x => x.w === w));
  const mm = Array(N2).fill(false), bm = Array(N2).fill(false); let ci = -1, over = false, mode = "py";
  const clue = el("div", { class:"bclue" }), msg = el("div", { class:"bmsg" });
  const myG = el("div"), botG = el("div");
  const draw = () => {
    myG.innerHTML = ""; myG.append(el("div", { class:"blab" }, [el("b", { text:"我的卡" }), el("span", { class:"muted", text:` ${lineCount(mm, n)} 條線` })]), bingoGrid(mine.map(x => x.w), n, mm, tap));
    botG.innerHTML = ""; botG.append(el("div", { class:"blab" }, [el("b", { text:"電腦的卡" }), el("span", { class:"muted", text:` ${lineCount(bm, n)} 條線` })]), bingoGrid(bot.map(x => x.w), n, bm, null, "small"));
  };
  const showClue = () => { const x = calls[ci]; clue.innerHTML = ""; if (!x) return; clue.append(el("small", { text:`第 ${ci + 1} 個` }), el("div", { class:"pyl big", text: mode === "py" ? x.py : x.mean || x.py })); };
  const finish = who => { over = true; msg.textContent = who === "me" ? "賓果！你贏了！" : who === "bot" ? "電腦先連成一條線了，再試一次！" : "平手！"; msg.className = "bmsg " + (who === "me" ? "win" : "lose"); if (who === "me"){ sfx.win(); const [x, y] = centerOf(msg); burst(x, y, 60); } else sfx.lose(); nextB.disabled = true; };
  const next = () => {
    if (over) return; ci++;
    if (ci >= calls.length){ finish("tie"); return; }
    // 電腦晚一點才自己做記號
    const x = calls[ci], bi = bot.findIndex(y => y.w === x.w);
    setTimeout(() => { if (over || bi < 0) return; bm[bi] = true; draw(); if (lineCount(bm, n) && !lineCount(mm, n)) finish("bot"); else if (lineCount(bm, n)) finish("tie"); }, 2500 + rnd(2500));
    showClue(); msg.textContent = "在你的卡上找到這個詞，點下去。沒有的話按「下一個」。"; msg.className = "bmsg";
  };
  function tap(i, c){
    if (over || ci < 0) return; const x = calls[ci];
    if (mm[i]) return;
    if (mine[i].w === x.w){ mm[i] = true; sfx.good(); draw(); if (lineCount(mm, n)) finish("me"); else next(); }
    else { sfx.bad(); c.classList.add("shake"); setTimeout(() => c.classList.remove("shake"), 400); msg.textContent = "不是這個喔，再找找看。"; }
  }
  const nextB = btn("下一個 →", () => { const x = calls[ci], k = mine.findIndex(y => y.w === x.w); if (k >= 0 && !mm[k]){ msg.textContent = "其實你的卡上有喔！"; const c = myG.querySelector(`.bcell[data-i="${k}"]`); if (c){ c.classList.add("hint"); setTimeout(() => c.classList.remove("hint"), 1200); } setTimeout(next, 1300); return; } next(); }, "primary big");
  const hasMean = words.some(x => x.mean);
  const modeSeg = el("div", { class:"seg" }); [["py", "出拼音"], ["mean", "出意思"]].forEach(([v, t]) => { if (v === "mean" && !hasMean) return; const bb = el("button", { type:"button", text:t, "aria-pressed":String(mode === v), onclick: () => { mode = v; [...modeSeg.children].forEach(z => z.setAttribute("aria-pressed", String(z === bb))); showClue(); } }); modeSeg.append(bb); });
  b.append(el("div", { class:"bwrap" }, [el("div", { class:"bside" }, [clue, nextB, msg, modeSeg]), myG, botG]));
  draw(); next();
  GAME = { k:"bingo" };
}
function bingoCaller(p){
  const b = shell("生詞賓果・老師叫詞", srcName());
  const calls = shuffle(p.words.slice()); let i = 0, showPy = true;
  const big = el("div", { class:"callbig" }), hist = el("div", { class:"callhist" });
  const draw = () => { const x = calls[i]; big.innerHTML = ""; big.append(el("small", { text:`第 ${i + 1}／${calls.length} 個` }), el("div", { class:"hz w", text:x.w }), showPy ? el("div", { class:"pyl", text:x.py }) : null);
    hist.innerHTML = ""; calls.slice(0, i).reverse().forEach(y => hist.append(el("span", { class:"chip", text:y.w }))); };
  b.append(big, el("div", { class:"row center" }, [btn("← 上一個", () => { if (i > 0){ i--; draw(); } }), btn("下一個 →", () => { if (i < calls.length - 1){ i++; draw(); sfx.pick(); } }, "primary big"), btn("拼音：顯示／隱藏", () => { showPy = !showPy; draw(); })]), el("p", { class:"muted", text:"已經叫過的詞：" }), hist);
  draw(); GAME = { k:"bingo" };
}
function bingoCard(p, n){
  const b = shell("生詞賓果・我的賓果卡", srcName());
  const make = () => { const ws = shuffle(p.words.slice()).slice(0, n * n).map(x => x.w); if (n === 5) ws[12] = "★"; return ws; };
  let ws = make(), marks = ws.map(w => w === "★");
  const box = el("div"), msg = el("div", { class:"bmsg" });
  const draw = () => { box.innerHTML = ""; box.append(bingoGrid(ws, n, marks, (i) => { if (ws[i] === "★") return; marks[i] = !marks[i]; sfx.pick(); const before = lineCount(marks, n); draw(); if (marks[i] && before){ msg.textContent = `賓果！${before} 條線`; msg.className = "bmsg win"; const [x, y] = centerOf(msg); burst(x, y, 50); sfx.win(); } }, "card")); };
  b.append(el("p", { class:"muted", text:"聽老師唸，找到就點一下（再點一次可以取消）。" }), box, msg, el("div", { class:"row center" }, [btn("換一張新的卡", () => { ws = make(); marks = ws.map(w => w === "★"); msg.textContent = ""; draw(); })]));
  draw(); GAME = { k:"bingo" };
}
function bingoPrint(p, n0){
  const b = shell("生詞賓果・印賓果卡", srcName());
  const num = el("input", { class:"fwin", type:"number", min:"1", max:"40", value:"10" });
  const sz = el("select", { class:"fwsel" }); [[3, "3×3"], [4, "4×4"], [5, "5×5（中間一格送你）"]].forEach(([v, t]) => { if (p.words.length >= v * v - (v === 5 ? 1 : 0)) sz.append(el("option", { value:v, text:t })); }); sz.value = String(Math.min(n0, 4));
  const go = () => {
    const k = Math.max(1, Math.min(40, Number(num.value) || 10)), n = Number(sz.value);
    const cards = [...Array(k)].map(() => { const ws = shuffle(p.words.slice()).slice(0, n * n).map(x => x.w); if (n === 5) ws[12] = "★"; return ws; });
    const css = `@page{size:A4;margin:12mm}body{font-family:"BiauKai","DFKai-SB","Kaiti TC","TW-Kai",serif;margin:0}.c{page-break-inside:avoid;margin:0 auto 10mm;width:170mm}h3{font-family:sans-serif;text-align:center;margin:0 0 4mm;color:#1E4C86}table{border-collapse:collapse;width:100%}td{border:2px solid #1E4C86;height:${n === 5 ? 28 : n === 4 ? 34 : 44}mm;text-align:center;font-size:${n === 5 ? 20 : 26}pt;width:${100 / n}%}td.f{color:#C9A227;font-size:30pt}.no{font-family:sans-serif;font-size:10pt;color:#888;text-align:right}`;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>生詞賓果</title><style>${css}</style></head><body>` + cards.map((ws, ci) => `<div class="c"><h3>生詞賓果　BINGO</h3><table>${[...Array(n)].map((_, r) => "<tr>" + ws.slice(r * n, r * n + n).map(w => `<td class="${w === "★" ? "f" : ""}">${w}</td>`).join("") + "</tr>").join("")}</table><div class="no">No. ${ci + 1}</div></div>`).join("") + `<script>setTimeout(()=>print(),400)<\/script></body></html>`;
    const wn = window.open("", "_blank"); if (!wn){ toast("瀏覽器擋住了新視窗，請允許彈出視窗"); return; } wn.document.write(html); wn.document.close();
  };
  b.append(el("div", { class:"mgform box" }, [el("label", {}, ["張數 ", num]), el("label", {}, ["大小 ", sz]), btn("產生並列印", go, "primary big")]), el("p", { class:"muted", text:"每一張的詞和位置都不一樣。老師用「老師叫詞」投影，學生在紙上畫圈。" }));
  GAME = { k:"bingo" };
}

// ============ 2. 翻牌配對 ============
function flipSetup(p){
  const b = shell("翻牌配對", srcName());
  const hasMean = p.words.filter(x => x.mean).length >= 6;
  const st = { pairs:Math.min(8, p.words.length), kind:"py", np:1 };
  const f = el("div", { class:"mgform box" });
  const seg = (opts, k) => { const s = el("div", { class:"seg" }); opts.forEach(([v, t]) => { const bb = el("button", { type:"button", text:t, "aria-pressed":String(st[k] === v), onclick: () => { st[k] = v; [...s.children].forEach(z => z.setAttribute("aria-pressed", String(z === bb))); } }); s.append(bb); }); return s; };
  f.append(el("div", { class:"row" }, [el("b", { text:"配什麼" }), seg([["py", "詞 ↔ 拼音"]].concat(hasMean ? [["mean", "詞 ↔ 意思"]] : []), "kind")]));
  f.append(el("div", { class:"row" }, [el("b", { text:"幾對" }), seg([[6, "6 對"], [8, "8 對"], [10, "10 對"]].filter(([v]) => v <= p.words.length), "pairs")]));
  f.append(el("div", { class:"row" }, [el("b", { text:"人數" }), seg([[1, "1 個人"], [2, "2 個人輪流"]], "np")]));
  f.append(btn("開始", () => flipPlay(p, st), "primary big"));
  b.append(f); GAME = { k:"flip" };
}
function flipPlay(p, st){
  const b = shell("翻牌配對", srcName());
  const ws = shuffle(p.words.filter(x => st.kind === "py" || x.mean)).slice(0, st.pairs);
  const cards = shuffle(ws.flatMap((x, i) => [{ id:i, t:x.w, hz:true }, { id:i, t: st.kind === "py" ? x.py : x.mean, hz:false }]));
  const cols = cards.length % 5 === 0 ? 5 : 4, rows = Math.ceil(cards.length / cols);
  let open = [], done = 0, moves = 0, turn = 0, lock = false; const score = [0, 0]; const t0 = Date.now();
  const bar = el("div", { class:"fbar" }), grid = el("div", { class:"fgrid", style:`--c:${cols};--r:${rows}` });
  const drawBar = () => { bar.innerHTML = ""; if (st.np === 2) [0, 1].forEach(i => bar.append(el("span", { class:"fp" + (turn === i ? " on" : ""), text:`玩家 ${i + 1}：${score[i]} 對` }))); else bar.append(el("span", { class:"fp on", text:`翻了 ${moves} 次・配好 ${done}／${ws.length} 對` })); };
  cards.forEach((c, i) => { const d = el("button", { class:"fcd", type:"button", onclick: () => flip(i, d) }, [el("span", { class:"back", text:"?" }), el("span", { class:"front" + (c.hz ? " hz" : " txt") + (c.t.length > 12 ? " long" : ""), text:c.t })]); grid.append(d); });
  function flip(i, d){
    if (lock || d.classList.contains("up") || d.classList.contains("ok")) return;
    d.classList.add("up"); sfx.pick(); open.push([i, d]);
    if (open.length < 2) return;
    moves++; lock = true; const [[i1, d1], [i2, d2]] = open; open = [];
    if (cards[i1].id === cards[i2].id){
      setTimeout(() => { d1.classList.add("ok"); d2.classList.add("ok"); if (st.np === 2){ d1.classList.add("p" + turn); d2.classList.add("p" + turn); } sfx.good(); done++; score[turn]++; lock = false; drawBar();
        if (done === ws.length) end(); }, 400);
    } else setTimeout(() => { d1.classList.remove("up"); d2.classList.remove("up"); sfx.bad(); if (st.np === 2) turn = 1 - turn; lock = false; drawBar(); }, 1100);
    drawBar();
  }
  function end(){
    const sec = Math.round((Date.now() - t0) / 1000);
    const text = st.np === 2 ? (score[0] === score[1] ? "平手！" : `玩家 ${score[0] > score[1] ? 1 : 2} 贏了！`) : `全部配好了！翻了 ${moves} 次，用了 ${sec} 秒。`;
    const m = el("div", { class:"mgdone" }, [el("b", { text }), el("div", { class:"row center" }, [btn("再玩一次", () => flipPlay(p, st), "primary big"), btn("換設定", () => flipSetup(p))])]);
    b.append(m); sfx.win(); const [x, y] = centerOf(m); burst(x, y, 60);
    if (A.store.me) A.addXp(ws.length * 2);
  }
  b.append(bar, grid); drawBar(); GAME = { k:"flip" };
}

// ============ 3. 快問快答 ============
// 題型：看拼音選詞、看詞選拼音、選字填空
function makeQs(p, n){
  const ws = p.words, out = [];
  const others = (x, k) => shuffle(ws.filter(y => y.w !== x.w)).sort((a, b) => (b.w.length === x.w.length) - (a.w.length === x.w.length)).slice(0, k);
  shuffle(ws.slice()).slice(0, n).forEach((x, k) => {
    const t = ["pyword", "wordpy", "blank"][k % 3];
    if (t === "pyword" && ws.length >= 4){ const o = shuffle([x.w].concat(others(x, 3).map(y => y.w))); out.push({ t, ask:"這是哪一個詞？", show:x.py, sl:"py", opts:o, ans:o.indexOf(x.w), w:x.w, py:x.py }); return; }
    if (t === "wordpy" && ws.length >= 4){ const o = shuffle([x.py].concat(others(x, 3).map(y => y.py))); if (new Set(o).size === 4){ out.push({ t, ask:"這個詞怎麼唸？", show:x.w, sl:"hz", opts:o, ans:o.indexOf(x.py), opy:true, w:x.w, py:x.py }); return; } }
    const cs = [...x.w]; if (cs.length >= 2){ const i = rnd(cs.length), c = cs[i]; const allow = new Set(ws.map(y => y.w).join("")); const ds = distractors({ c, py:pyOf(c), w:x.w }, 3, allow).filter(d => d !== c && !cs.includes(d)).slice(0, 3);
      if (ds.length === 3){ const o = shuffle([c].concat(ds)); out.push({ t:"blank", ask:"□ 是哪一個字？", show:cs.map((z, j) => j === i ? "□" : z).join(""), sub:x.py, sl:"hz", opts:o, ans:o.indexOf(c), w:x.w, py:x.py }); return; } }
    const o = shuffle([x.w].concat(others(x, 3).map(y => y.w))); out.push({ t:"pyword", ask:"這是哪一個詞？", show:x.py, sl:"py", opts:o, ans:o.indexOf(x.w), w:x.w, py:x.py });
  });
  return out;
}
const OCOL = ["#1E4C86", "#D2457A", "#13918F", "#7A52C7"];
const OSYM = ["▲", "◆", "●", "■"];
function quizHome(p){
  const b = shell("快問快答", srcName());
  const uid = A.store && A.store.uid;
  b.append(el("div", { class:"mgmenu" }, [
    el("button", { class:"mgcard", type:"button", onclick: () => quizSolo(p) }, [el("b", { text:"自己練習" }), el("small", { text:"10 題，答得越快分數越高。" })]),
    el("button", { class:"mgcard", type:"button", onclick: () => uid ? quizHostSetup(p) : toast("要先登入才能開房") }, [el("b", { text:"老師開房（投影用）" }), el("small", { text:"老師的螢幕投影題目，學生用手機輸入代碼一起搶答，最後看排行榜。" })]),
    el("div", { class:"mgcard join" }, [el("b", { text:"學生加入" }), el("small", { text:"輸入老師螢幕上的 5 位數代碼：" }), (() => { const inp = el("input", { class:"fwin big", inputmode:"numeric", maxlength:"5", placeholder:"代碼" }); const nm = el("input", { class:"fwin", placeholder:"你的名字", value:(A.store.me && A.store.me.name) || "" }); return el("div", { class:"row" }, [inp, nm, btn("加入", () => uid ? quizJoin(inp.value.trim(), nm.value.trim()) : toast("要先登入才能加入"), "primary")]); })()])
  ]));
  GAME = { k:"quiz" };
}
function qView(q, live, onPick, res){
  const box = el("div", { class:"qv" });
  box.append(el("div", { class:"qask", text:q.ask }), el("div", { class:"qshow " + q.sl, text:q.show }));
  if (q.sub) box.append(el("div", { class:"qsub pyl", text:q.sub }));
  const g = el("div", { class:"qopts" });
  q.opts.forEach((o, i) => { const bb = el("button", { class:"qopt" + (q.opy ? " pyl" : " hz") + (res ? (i === q.ans ? " right" : res.pick === i ? " wrong" : " dim") : ""), type:"button", style:`--oc:${OCOL[i]}`, onclick: () => live && onPick(i) }, [el("span", { class:"sym", text:OSYM[i] }), el("span", { class:"ot", text:o })]); if (!live) bb.disabled = true; g.append(bb); });
  box.append(g); return box;
}
function quizSolo(p){
  const qs = makeQs(p, 10), LIM = 15; let i = 0, score = 0, ok = 0, t0 = 0, tm = null, res = null;
  const b = shell("快問快答・自己練習", srcName());
  const top = el("div", { class:"qtop" }), area = el("div"), timer = el("div", { class:"qtimer" }, [el("i")]);
  b.append(top, timer, area);
  const draw = () => {
    top.innerHTML = ""; top.append(el("span", { text:`第 ${i + 1}／${qs.length} 題` }), el("b", { text:`${score} 分` }));
    area.innerHTML = ""; area.append(qView(qs[i], !res, pickIt, res));
    if (res){ area.append(el("div", { class:"qfb " + (res.ok ? "ok" : "no") }, [el("b", { text: res.ok ? `答對了！+${res.pts}` : res.pick === -1 ? "時間到！" : "答錯了" }), `　${qs[i].w}　`, el("span", { class:"pyl", text:qs[i].py })]), el("div", { class:"row center" }, [btn(i < qs.length - 1 ? "下一題 →" : "看結果", nextQ, "primary big")])); }
  };
  const tick = () => { const left = LIM - (Date.now() - t0) / 1000; const bar = timer.querySelector("i"); bar.style.width = Math.max(0, left / LIM * 100) + "%"; if (left <= 0){ pickIt(-1); return; } tm = setTimeout(tick, 100); };
  function pickIt(k){ if (res) return; clearTimeout(tm); const q = qs[i], good = k === q.ans, pts = good ? 500 + Math.round(500 * Math.max(0, 1 - (Date.now() - t0) / 1000 / LIM)) : 0; score += pts; if (good){ ok++; sfx.good(); } else sfx.bad(); res = { ok:good, pick:k, pts }; draw(); }
  function nextQ(){ if (i >= qs.length - 1){ end(); return; } i++; res = null; t0 = Date.now(); draw(); tick(); }
  function end(){ clearTimeout(tm); area.innerHTML = ""; timer.hidden = true; const m = el("div", { class:"mgdone" }, [el("b", { text:`答對 ${ok}／${qs.length} 題，${score} 分` }), el("div", { class:"row center" }, [btn("再玩一次", () => quizSolo(p), "primary big"), btn("回快問快答", () => quizHome(p))])]); area.append(m); sfx.win(); const [x, y] = centerOf(m); burst(x, y, 50); if (A.store.me) A.addXp(ok * 3); }
  t0 = Date.now(); draw(); tick();
  GAME = { k:"quiz", stop: () => clearTimeout(tm) };
}
// ----- 連線：老師開房、學生加入 -----
const rooms = () => firebase.firestore().collection("hz_rooms");
let RQ = null, unsubQ = null, qTimer = null;
const stopQ = () => { if (unsubQ){ try { unsubQ(); } catch(e){} } unsubQ = null; clearTimeout(qTimer); };
function roomErr(e){ const perm = /permission|insufficient/i.test(String(e && (e.code || e.message))); toast(perm ? "連線還沒開通：Firebase 要有 hz_rooms 的規則。" : "連線失敗：" + (e && (e.message || e.code) || e)); }
function quizHostSetup(p){
  const b = shell("快問快答・老師開房", srcName());
  const st = { n:10, lim:20 };
  const seg = (opts, k) => { const s = el("div", { class:"seg" }); opts.forEach(([v, t]) => { const bb = el("button", { type:"button", text:t, "aria-pressed":String(st[k] === v), onclick: () => { st[k] = v; [...s.children].forEach(z => z.setAttribute("aria-pressed", String(z === bb))); } }); s.append(bb); }); return s; };
  b.append(el("div", { class:"mgform box" }, [el("div", { class:"row" }, [el("b", { text:"題數" }), seg([[10, "10 題"], [15, "15 題"], [20, "20 題"]], "n")]), el("div", { class:"row" }, [el("b", { text:"每題時間" }), seg([[10, "10 秒"], [20, "20 秒"], [30, "30 秒"]], "lim")]), btn("開房間", () => quizOpen(p, st), "primary big")]));
}
async function quizOpen(p, st){
  try {
    const qs = makeQs(p, Math.min(st.n, p.words.length));
    let code = "", tries = 0; do { code = String(10000 + rnd(90000)); tries++; } while (tries < 5 && (await rooms().doc(code).get()).exists);
    const s = { v:"quiz", phase:"lobby", qs, i:-1, lim:st.lim, scores:{}, src:srcName() };
    await rooms().doc(code).set({ host:A.store.uid, kind:"quiz", s:JSON.stringify(s), a:{}, at:new Date().toISOString() });
    hostListen(code);
  } catch(e){ roomErr(e); }
}
function hostListen(code){
  stopQ(); RQ = rooms().doc(code); let last = null;
  unsubQ = RQ.onSnapshot(d => { if (!d.exists) return; const data = d.data(); last = { s:JSON.parse(data.s), a:data.a || {} }; hostDraw(code, last); }, roomErr);
  GAME = { k:"quiz", stop: () => { stopQ(); RQ && RQ.delete().catch(() => {}); RQ = null; } };
}
function players(a){ return Object.entries(a || {}).map(([uid, x]) => ({ uid, n:x.n || "同學", q:x.q, c:x.c, t:x.t })); }
let hostState = null, revealed = -1;
function hostDraw(code, R){
  hostState = R; const s = R.s, ps = players(R.a);
  const b = shell("快問快答", `房間 ${code}・${s.src}`);
  const save = s2 => RQ.update({ s:JSON.stringify(s2) }).catch(roomErr);
  if (s.phase === "lobby"){
    b.append(el("div", { class:"lobbyq" }, [el("p", { text:"學生打開「生詞遊戲 → 快問快答 → 學生加入」，輸入代碼：" }), el("div", { class:"code", text:code }), el("p", { class:"muted", text:`已經有 ${ps.length} 個人加入` }), el("div", { class:"plist" }, ps.map(x => el("span", { class:"chip", text:x.n })))]),
      el("div", { class:"row center" }, [btn("開始！", () => { const s2 = Object.assign({}, s, { phase:"q", i:0, t0:Date.now() }); save(s2); }, "primary big")]));
    return;
  }
  if (s.phase === "q" || s.phase === "reveal"){
    const q = s.qs[s.i], ans = ps.filter(x => x.q === s.i);
    b.append(el("div", { class:"qtop" }, [el("span", { text:`第 ${s.i + 1}／${s.qs.length} 題` }), el("b", { text:`${ans.length}／${ps.length} 人答了` })]));
    if (s.phase === "q"){
      const timer = el("div", { class:"qtimer" }, [el("i")]); b.append(timer, qView(q, false));
      const reveal = () => { if (revealed === s.i) return; revealed = s.i; clearTimeout(qTimer); const sc = Object.assign({}, s.scores); ps.forEach(x => { const r = sc[x.uid] || { n:x.n, score:0, ok:0 }; r.n = x.n; r.last = 0; if (x.q === s.i && x.c === q.ans){ const pts = 500 + Math.round(500 * Math.max(0, 1 - (x.t || 0) / 1000 / s.lim)); r.score += pts; r.ok++; r.last = pts; } sc[x.uid] = r; });
        const cnt = [0, 0, 0, 0]; ans.forEach(x => { if (x.c >= 0 && x.c < 4) cnt[x.c]++; });
        save(Object.assign({}, s, { phase:"reveal", scores:sc, cnt })); };
      const tick = () => { const left = s.lim - (Date.now() - s.t0) / 1000, bar = timer.querySelector("i"); if (bar) bar.style.width = Math.max(0, left / s.lim * 100) + "%"; if (left <= 0 || (ps.length && ans.length >= ps.length)){ reveal(); return; } qTimer = setTimeout(tick, 200); };
      clearTimeout(qTimer); tick();
      b.append(el("div", { class:"row center" }, [btn("公布答案", reveal)]));
    } else {
      b.append(qView(q, false, null, { pick:-9 }));
      const cnt = s.cnt || [0, 0, 0, 0], mx = Math.max(1, ...cnt);
      b.append(el("div", { class:"qbars" }, cnt.map((n, i) => el("div", { class:"qbar" + (i === q.ans ? " right" : ""), style:`--oc:${OCOL[i]};--h:${n / mx}` }, [el("i"), el("b", { text:`${OSYM[i]} ${n}` })]))));
      b.append(rankEl(s.scores, 5));
      b.append(el("div", { class:"row center" }, [btn(s.i < s.qs.length - 1 ? "下一題 →" : "看最後排名", () => { const last = s.i >= s.qs.length - 1; save(Object.assign({}, s, last ? { phase:"over" } : { phase:"q", i:s.i + 1, t0:Date.now() })); }, "primary big")]));
    }
    return;
  }
  if (s.phase === "over"){ b.append(el("h2", { class:"center", text:"最後排名" }), rankEl(s.scores, 30, true), el("div", { class:"row center" }, [btn("結束", () => { stopGame(); home(); }, "primary big")])); const [x, y] = centerOf(b); burst(x, y, 80); sfx.win(); }
}
function rankEl(scores, k, podium){
  const rs = Object.entries(scores || {}).map(([uid, r]) => Object.assign({ uid }, r)).sort((a, b) => b.score - a.score).slice(0, k);
  const box = el("div", { class:"rank" + (podium ? " pod" : "") });
  rs.forEach((r, i) => box.append(el("div", { class:"rrow" + (i < 3 ? " top" + (i + 1) : "") }, [el("span", { class:"rn", text:String(i + 1) }), el("b", { text:r.n }), el("span", { class:"rs", text:r.score + " 分" }), r.last ? el("small", { class:"rl", text:"+" + r.last }) : null])));
  if (!rs.length) box.append(el("p", { class:"muted", text:"還沒有人得分。" }));
  return box;
}
async function quizJoin(code, name){
  if (!/^\d{5}$/.test(code)){ toast("代碼是 5 位數字"); return; }
  try {
    const ref = rooms().doc(code), d = await ref.get();
    if (!d.exists || d.data().kind !== "quiz"){ toast("找不到這個房間，請再確認代碼。"); return; }
    const uid = A.store.uid; name = name || "同學";
    await ref.update({ ["a." + uid]:{ n:name, q:-1, c:-1, t:0 } });
    stopQ(); RQ = ref; let seen = -2, localT0 = 0, mine = null;
    unsubQ = ref.onSnapshot(d2 => {
      if (!d2.exists){ toast("老師已經關閉房間"); stopGame(); home(); return; }
      const s = JSON.parse(d2.data().s);
      if (s.phase === "q" && s.i !== seen){ seen = s.i; localT0 = Date.now(); mine = null; }
      studentDraw(s, name, () => localT0, k => { if (mine != null) return; mine = k; sfx.pick(); ref.update({ ["a." + uid]:{ n:name, q:s.i, c:k, t:Date.now() - localT0 } }).catch(roomErr); studentDraw(s, name, () => localT0, null, mine); }, mine);
    }, roomErr);
    GAME = { k:"quiz", stop: () => stopQ() };
  } catch(e){ roomErr(e); }
}
function studentDraw(s, name, t0f, onPick, mine){
  const b = shell("快問快答", name);
  if (s.phase === "lobby"){ b.append(el("div", { class:"lobbyq" }, [el("b", { text:"加入成功！" }), el("p", { class:"muted", text:"等老師開始……" })])); return; }
  const me = (s.scores || {})[A.store.uid];
  if (s.phase === "q"){
    const q = s.qs[s.i];
    b.append(el("div", { class:"qtop" }, [el("span", { text:`第 ${s.i + 1}／${s.qs.length} 題` }), el("b", { text:`${me ? me.score : 0} 分` })]));
    if (mine != null) b.append(el("div", { class:"waitq" }, [el("b", { text:"已經作答！" }), el("p", { class:"muted", text:"等老師公布答案……" })]));
    else b.append(qView(q, true, onPick));
    return;
  }
  if (s.phase === "reveal"){
    const q = s.qs[s.i], good = mine === q.ans;
    const rs = Object.entries(s.scores || {}).sort((a, b) => b[1].score - a[1].score), rk = rs.findIndex(([u]) => u === A.store.uid) + 1;
    b.append(el("div", { class:"qfb big " + (good ? "ok" : "no") }, [el("b", { text: good ? `答對了！+${me && me.last || 0}` : mine == null ? "沒有作答" : "答錯了" }), el("div", {}, [q.w + "　", el("span", { class:"pyl", text:q.py })]), el("div", { class:"muted", text:`${me ? me.score : 0} 分・第 ${rk || "-"} 名` })]));
    return;
  }
  if (s.phase === "over"){ const rs = Object.entries(s.scores || {}).sort((a, b) => b[1].score - a[1].score), rk = rs.findIndex(([u]) => u === A.store.uid) + 1;
    b.append(el("div", { class:"mgdone" }, [el("b", { text:`遊戲結束！你是第 ${rk || "-"} 名（${me ? me.score : 0} 分）` }), btn("回到遊戲首頁", () => { stopGame(); home(); }, "primary big")])); if (rk && rk <= 3){ sfx.win(); } }
}

// ============ 4. 句子排序 ============
let WS = null;
// 詞表：華語八千詞＋這幾課的生詞。人名也要算一個詞：「王開文」的「開文」、「田中誠一」的「田中」「誠一」
const SURN = "王李陳張林黃馬白田何方錢康吳劉楊趙周徐孫胡朱高郭羅梁宋鄭謝韓唐馮于董蕭程曹袁鄧許傅沈曾彭呂蘇盧蔣蔡賈丁魏薛葉余潘杜戴夏鍾汪任姜范石姚譚廖鄒熊金陸郝孔崔邱秦江史顧侯邵孟龍萬段雷錢湯尹黎易常武喬賀賴龔文";
let WSK = "";
function wordSet(p){ const key = p.words.map(x => x.w).join("|"); if (WS && WSK === key) return WS; WSK = key;
  WS = new Set(String(window.HZWORDS || "").split("|").filter(Boolean));
  p.words.forEach(x => { const w = x.w; WS.add(w); if (w.length === 3 && SURN.includes(w[0])) WS.add(w.slice(1)); if (w.length === 4 && /^[A-Z]/.test(x.py || "")){ WS.add(w.slice(0, 2)); WS.add(w.slice(2)); } });
  return WS; }
// 把句子切成一塊一塊：用詞表找最長的詞；標點、語氣詞（了嗎呢吧啊的）跟著前一塊；「一部、那部、兩個」黏在一起
// 切出來超過 8 塊的句子太難，不出
function chunks(s, p){
  const W = wordSet(p), LW = new Set(p.words.map(x => x.w)), cs = [...s], n = cs.length;
  const MEAS = "個本杯塊支張件種家位次天年歲點分隻條雙碗瓶間棟部輛場頓趟句篇課";
  // 每一段可能的切法打分數：長的詞分數高；課本生詞、數字＋量詞、「要不要」再加分。用動態規劃找總分最高的切法
  const cand = i => { const out = [[1, 1]]; if (!/[㐀-鿿]/.test(cs[i])) return out;
    for (let k = 2; k <= 5 && i + k <= n; k++){ const w = cs.slice(i, i + k).join(""); let sc = -1;
      if (W.has(w)) sc = k * k + (LW.has(w) ? 3 : 0);
      if (k === 2 && /[一兩三四五六七八九十幾這那每哪半]/.test(cs[i]) && MEAS.includes(cs[i + 1])) sc = Math.max(sc, 6);
      if ((k === 3 || k === 4) && (cs[i + 1] === "不" || cs[i + 1] === "沒") && cs[i + 2] === cs[i] && (k === 3 || W.has(cs[i] + cs[i + 3]))) sc = Math.max(sc, k * k + 6);
      if (sc > 0) out.push([k, sc]); }
    return out; };
  const best = Array(n + 1).fill(null); best[n] = [0, []];
  for (let i = n - 1; i >= 0; i--){ let bb = null; cand(i).forEach(([k, sc]) => { const r = best[i + k]; if (r && (!bb || sc + r[0] > bb[0])) bb = [sc + r[0], [k].concat(r[1])]; }); best[i] = bb; }
  const out = []; let i = 0; best[0][1].forEach(k => { out.push(cs.slice(i, i + k).join("")); i += k; });
  const res = [];
  out.forEach(t => { const prev = res[res.length - 1];
    if (prev != null && (/^[^㐀-鿿]+$/.test(t) || /^[了嗎呢吧啊的喔嘛呀兒]$/.test(t))) res[res.length - 1] = prev + t; else res.push(t); });
  return res;
}
function orderStart(p){
  const sents = shuffle(p.sents.slice()).map(s => ({ s, c:chunks(s, p) })).filter(x => x.c.length >= 3 && x.c.length <= 8).slice(0, 10);
  if (sents.length < 3){ toast("可以用的句子太少了，請多選幾課"); return; }
  let i = 0, score = 0, tries = 0;
  const b = shell("句子排序", srcName());
  const top = el("div", { class:"qtop" }), area = el("div", { class:"ordarea" }); b.append(top, area);
  const draw = () => {
    const x = sents[i]; let tiles = shuffle(x.c.map((t, k) => ({ t, k }))); if (tiles.every((y, k) => y.k === k)) tiles.reverse();
    const ans = []; tries = 0;
    top.innerHTML = ""; top.append(el("span", { text:`第 ${i + 1}／${sents.length} 句` }), el("b", { text:`${score} 分` }));
    area.innerHTML = "";
    const line = el("div", { class:"oline" }), pool2 = el("div", { class:"opool" }), msg = el("div", { class:"omsg" });
    const redraw = () => {
      line.innerHTML = ""; pool2.innerHTML = "";
      if (!ans.length) line.append(el("span", { class:"muted ph", text:"點下面的詞，排成一句話" }));
      ans.forEach((y, k) => line.append(el("button", { class:"otile hz on", type:"button", text:y.t, onclick: () => { ans.splice(k, 1); tiles.push(y); redraw(); } })));
      tiles.forEach((y, k) => pool2.append(el("button", { class:"otile hz", type:"button", text:y.t, onclick: () => { tiles.splice(k, 1); ans.push(y); sfx.pick(); redraw(); if (!tiles.length) check(); } })));
    };
    const check = () => {
      const got = ans.map(y => y.t).join(""), okk = got === x.s;
      if (okk){ const pts = tries === 0 ? 100 : tries === 1 ? 60 : 30; score += pts; sfx.good(); msg.className = "omsg ok"; msg.textContent = `答對了！+${pts}`; line.classList.add("done"); const [px, py] = centerOf(line); burst(px, py, 30);
        area.append(el("div", { class:"row center" }, [btn(i < sents.length - 1 ? "下一句 →" : "看結果", () => { if (i < sents.length - 1){ i++; draw(); } else end(); }, "primary big")])); top.querySelector("b").textContent = `${score} 分`; }
      else { tries++; sfx.bad(); const k = ans.findIndex((y, j) => y.t !== x.c[j]); msg.className = "omsg no"; msg.textContent = `還不對，從第 ${k + 1} 塊開始要再想想。`; [...line.children].forEach((c, j) => { if (j >= k) c.classList.add("bad"); }); }
    };
    const hint = btn("提示：第一塊", () => { const want = x.c[0]; while (ans.length) tiles.push(ans.pop()); const k = tiles.findIndex(y => y.t === want); if (k >= 0){ ans.push(tiles.splice(k, 1)[0]); } tries = Math.max(tries, 1); redraw(); }, "small");
    area.append(line, pool2, msg, el("div", { class:"row center" }, [hint, btn("全部拿回來", () => { while (ans.length) tiles.push(ans.pop()); redraw(); }, "small")]));
    redraw();
  };
  const end = () => { area.innerHTML = ""; const m = el("div", { class:"mgdone" }, [el("b", { text:`全部完成！${score} 分（滿分 ${sents.length * 100}）` }), el("div", { class:"row center" }, [btn("再玩一次", () => orderStart(p), "primary big"), btn("回到遊戲首頁", () => { stopGame(); home(); })])]); area.append(m); sfx.win(); const [x, y] = centerOf(m); burst(x, y, 60); if (A.store.me) A.addXp(Math.round(score / 20)); };
  draw(); GAME = { k:"order" };
}

// ---------- 接到漢字遊戲的分頁 ----------
// 字族工坊：一個「小遊戲」分頁；生詞遊戲（games.html）：每個遊戲各一個分頁
document.querySelectorAll('nav.tabs button[data-tab="mg"]').forEach(tab => { tab.setAttribute("data-novi", ""); tab.setAttribute("translate", "no");
  tab.addEventListener("click", () => { A.showTab("mg"); const k = tab.dataset.game || ""; if (GAPP){ stopGame(); fsOff(); if (k){ home(); const p = pool(); const need = { bingo:9, flip:6, quiz:4, order:0 }[k]; if ((k === "order" && p.sents.length < 3) || p.words.length < need){ toast("請先在這一頁勾選要玩哪幾課"); selTab(""); return; } openGame(k); } else home(); } else if (!GAME) home(); }); });
if (GAPP){ document.querySelectorAll("nav.tabs button").forEach(b => { b.setAttribute("data-novi", ""); b.setAttribute("translate", "no"); }); A.showTab("mg"); home(); }
window.HZMG = { home, pool, chunks, makeQs, open:openGame, get game(){ return GAME; } };
}
if (window.HZAPI) boot(); else document.addEventListener("hzapi", boot);
})();
