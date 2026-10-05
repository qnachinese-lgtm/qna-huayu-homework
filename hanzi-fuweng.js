/* 漢字大富翁（hanzi-fuweng.js）
   三種玩法：A 一台電腦輪流玩、B 每個人用自己的裝置連線（房間代碼）、C 跟電腦對戰。
   棋盤上的「地」是部件（例如「氵」「門」），踩到要答題才能買地、蓋房子；別人踩到你的地要付過路費（答對打五折）。
   ⚠️ 線上連線（B）需要 Firestore 規則有 hz_rooms 這個集合，見 README 的「漢字大富翁」。 */
(() => {
"use strict";
function boot(){
const A = window.HZAPI; if (!A || window.__FW) return; window.__FW = true;
const { CH, RAD, LEVELS, FAM, C, NOSTROKE, shuffle, css, pyOf, say, sfx, burst, toast, centerOf, distractors, originBlock } = A;
const $ = s => document.querySelector(s);
// 跟遊戲本體的 el 一樣，另外支援 onclick 這類函式
const el = (tag, attrs = {}, kids = []) => { const fn = {}, at = {}; for (const k in attrs){ if (typeof attrs[k] === "function") fn[k] = attrs[k]; else at[k] = attrs[k]; } const n = A.el(tag, at, kids); Object.assign(n, fn); return n; };
const ORI = window.ORIGIN || {}, GLY = window.GLYPHS || {};
const N = 20, START = 1000, PASS = 150;
const PRICE = [100, 140, 180, 220];
// 棋盤：0 起點、5 字源館、10 休息站、15 複習站；2、8、12、17 機會；其他 12 格是部件地
const LAYOUT = ["start","lot","chance","lot","lot","origin","lot","lot","chance","lot","rest","lot","chance","lot","lot","review","lot","chance","lot","lot"];
const PCOL = ["--navy", "--green", "--plum", "--gold"];
const BOTLV = { easy:{ name:"簡單", p:.55 }, normal:{ name:"普通", p:.75 }, hard:{ name:"厲害", p:.92 } };
const CHANCE = [
  { t:"q", kind:"listen", win:120, lose:40, text:"聽音選字：答對 +120，答錯 −40" },
  { t:"q", kind:"build", win:100, lose:0, text:"部件合字：答對 +100" },
  { t:"q", kind:"write", win:150, lose:0, text:"寫字挑戰：寫對 +150" },
  { t:"q", kind:"py", win:100, lose:30, text:"讀音挑戰：答對 +100，答錯 −30" },
  { t:"move", n:3, text:"順風：往前走 3 格" },
  { t:"gift", n:100, text:"老師的獎勵：+100" },
  { t:"treat", n:30, text:"請客：給每位玩家 30" }
];

// ---------- 小工具 ----------
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const clone = o => JSON.parse(JSON.stringify(o));
const round10 = n => Math.round(n / 10) * 10;
const blank = (w, c) => [...w].map(x => x === c ? "□" : x).join("");
const MARK = { a:"āáǎà", e:"ēéěè", i:"īíǐì", o:"ōóǒò", u:"ūúǔù", "ü":"ǖǘǚǜ" };
const bare = p => String(p || "").normalize("NFD").replace(/[̀́̄̌]/g, "").normalize("NFC").toLowerCase();
function retone(p, t){
  const b = bare(p); if (!t) return b;
  let i = b.indexOf("a"); if (i < 0) i = b.indexOf("e"); if (i < 0 && b.includes("ou")) i = b.indexOf("o");
  if (i < 0){ for (let k = b.length - 1; k >= 0; k--) if ("iouü".includes(b[k])){ i = k; break; } }
  if (i < 0) return b;
  return b.slice(0, i) + MARK[b[i]][t - 1] + b.slice(i + 1);
}
const partsOf = c => (CH[c] && CH[c].p) || [];
const nameOf = p => p in RAD && RAD[p].name && RAD[p].name !== p ? RAD[p].name : (pyOf(p) || "");
const hasGlyph = k => ["oracle", "bronze", "seal"].some(s => GLY[k + "-" + s]);

// ---------- 題目範圍 ----------
function itemsFrom(src){
  const out = {};
  const put = (c, w, py) => { if (!c || out[c] || !(CH[c] || w)) return; out[c] = [w || (CH[c] && CH[c].w) || c, py || pyOf(c)]; };
  if (src.k === "course") src.ids.forEach(id => { const L = C.byId[id]; if (L) L.chars.forEach(x => put(x.c, x.w, x.py)); });
  else if (src.k === "fam") FAM.forEach(f => { if (src.v === "*" || f.name === src.v) f.chars.forEach(x => put(x.c)); });
  else if (src.k === "lv"){ const L = LEVELS[src.v]; if (L) L.stages.forEach(s => s.chars.forEach(c => put(c))); }
  // 等級的字很多：隨機挑 60 個
  const ks = Object.keys(out); if (ks.length > 60){ const keep = new Set(shuffle(ks).slice(0, 60)); ks.forEach(k => { if (!keep.has(k)) delete out[k]; }); }
  return out;
}
function makeBoard(items){
  const cs = Object.keys(items), m = {};
  cs.forEach(c => new Set(partsOf(c)).forEach(p => (m[p] = m[p] || []).push(c)));
  const comps = Object.keys(m).filter(p => p !== "").sort((a, b) => m[b].length - m[a].length || (b in RAD) - (a in RAD));
  const lots = comps.filter(p => m[p].length >= 2).slice(0, 12).map(p => ({ comp:p, chars:m[p] }));
  // 不夠 12 塊：用只出現一次的部件，再不夠就用字本身
  comps.filter(p => m[p].length < 2).forEach(p => { if (lots.length < 12 && !lots.some(l => l.comp === p)) lots.push({ comp:p, chars:m[p] }); });
  shuffle(cs).forEach(c => { if (lots.length < 12 && !lots.some(l => l.comp === c)) lots.push({ comp:c, chars:[c] }); });
  let li = 0;
  return LAYOUT.map(t => {
    if (t !== "lot") return { t };
    const L = lots[li % Math.max(1, lots.length)] || { comp:"字", chars:cs.slice(0, 3) }; const g = Math.floor(li / 3); li++;
    return { t, comp:L.comp, name:nameOf(L.comp), chars:L.chars.slice(0, 12), g, price:PRICE[g], owner:-1, lv:0 };
  });
}
function newGame(cfg){
  const items = itemsFrom(cfg.src);
  return { v:1, mode:cfg.mode, rounds:cfg.rounds, round:1, turn:0, seq:1, srcName:cfg.srcName || "",
    players:cfg.players.map(p => ({ name:p.name, uid:p.uid || "", bot:p.bot || "", coins:START, pos:0, out:false, wrong:[], ok:0, n:0 })),
    items, board:makeBoard(items), phase:cfg.mode === "B" ? "lobby" : "roll", dice:0, anim:null, q:null, card:null, log:["遊戲開始！每人 " + START + " 金幣。"], host:cfg.host || "" };
}

// ---------- 規則 ----------
const cur = s => s.players[s.turn];
const log = (s, t) => { s.log.push(t); if (s.log.length > 8) s.log.shift(); };
const groupOwned = (s, sq) => sq.owner >= 0 && s.board.filter(b => b.t === "lot" && b.g === sq.g).every(b => b.owner === sq.owner);
const toll = (s, sq) => round10(sq.price * [0.25, 0.6, 1][sq.lv] * (groupOwned(s, sq) ? 2 : 1));
const upCost = sq => round10(sq.price / 2);
const worth = (s, i) => s.players[i].coins + s.board.filter(b => b.owner === i).reduce((a, b) => a + b.price + b.lv * upCost(b), 0);
function mkQ(s, kind, c, extra){
  const it = s.items[c] || [CH[c] ? CH[c].w : c, pyOf(c)], w = it[0], py = it[1];
  if (kind === "build" && partsOf(c).length < 2) kind = "pick";
  if (kind === "write" && (NOSTROKE.has(c) || !window.HanziWriter)) kind = "pick";
  if (kind === "py" && !bare(py)) kind = "pick";
  const q = Object.assign({ kind, c, w, py, opts:null, ans:0, res:null }, extra || {});
  if (kind === "pick" || kind === "listen" || kind === "build"){
    const pool = Object.keys(s.items).filter(x => x !== c);
    const ds = distractors({ c, py }, 3).filter(x => x !== c);
    // 盡量用這一局裡出現過的字當干擾
    const mix = shuffle(ds.filter(x => s.items[x]).concat(shuffle(pool).slice(0, 2), ds)).filter((x, i, a) => a.indexOf(x) === i && x !== c).slice(0, 3);
    q.opts = shuffle([c].concat(mix)); q.ans = q.opts.indexOf(c);
    if (kind === "build") q.parts = partsOf(c);
  } else if (kind === "py"){
    const t = [0, 1, 2, 3, 4].map(k => retone(py, k)).filter(x => x !== py);
    const other = shuffle(Object.keys(s.items).map(x => s.items[x][1]).filter(p => bare(p) !== bare(py)))[0];
    const opts = shuffle(t).slice(0, other ? 2 : 3).concat(other ? [other] : []);
    q.opts = shuffle([py].concat(opts)); q.ans = q.opts.indexOf(py);
  } else if (kind === "origin"){
    const near = Object.keys(s.items).flatMap(partsOf).filter(k => ORI[k] && hasGlyph(k));
    const all = Object.keys(ORI).filter(hasGlyph);
    const k = near.length ? pick(near) : pick(all);
    const sc = ["oracle", "bronze", "seal"].filter(x => GLY[k + "-" + x]);
    q.c = k; q.w = k; q.py = pyOf(k); q.script = pick(sc);
    q.opts = shuffle([k].concat(shuffle(all.filter(x => x !== k)).slice(0, 3))); q.ans = q.opts.indexOf(k);
  }
  return q;
}
function land(s){
  const p = cur(s), sq = s.board[p.pos]; s.q = null; s.card = null;
  const anyChar = () => pick(Object.keys(s.items));
  if (sq.t === "start"){ log(s, `${p.name} 停在起點。`); s.phase = "end"; return; }
  if (sq.t === "lot"){
    const c = pick(sq.chars);
    if (sq.owner < 0){
      if (p.coins < sq.price){ log(s, `${p.name} 的金幣不夠買「${sq.comp}」。`); s.phase = "end"; return; }
      s.q = mkQ(s, pick(["pick", "build", "py", "listen"]), c, { why:"buy", title:`買地：「${sq.comp}」${sq.name ? "（" + sq.name + "）" : ""}，價錢 ${sq.price}`, sub:"答對才可以買。" });
    } else if (sq.owner === s.turn){
      if (sq.lv >= 2){ log(s, `${p.name} 的「${sq.comp}」已經蓋到最高了。`); s.phase = "end"; return; }
      if (p.coins < upCost(sq)){ log(s, `${p.name} 的金幣不夠蓋房子。`); s.phase = "end"; return; }
      s.q = mkQ(s, sq.lv ? "write" : "build", c, { why:"up", title:`蓋房子：「${sq.comp}」升級要 ${upCost(sq)}`, sub: sq.lv ? "寫對這個字就能蓋第二間。" : "答對就能蓋房子，過路費會變高。" });
    } else {
      const o = s.players[sq.owner];
      s.q = mkQ(s, pick(["pick", "py", "build"]), c, { why:"toll", title:`這是 ${o.name} 的地「${sq.comp}」，過路費 ${toll(s, sq)}`, sub:"答對只付一半。" });
    }
    s.phase = "q"; return;
  }
  if (sq.t === "chance"){
    const cd = pick(CHANCE); s.card = cd.text; log(s, `${p.name} 抽到機會卡：${cd.text}`);
    if (cd.t === "q"){ s.q = mkQ(s, cd.kind, anyChar(), { why:"reward", win:cd.win, lose:cd.lose, title:"機會卡：" + cd.text }); s.phase = "q"; return; }
    if (cd.t === "gift"){ p.coins += cd.n; s.phase = "end"; return; }
    if (cd.t === "treat"){ s.players.forEach((o, i) => { if (i !== s.turn && !o.out){ o.coins += cd.n; p.coins -= cd.n; } }); bankrupt(s); s.phase = s.phase === "over" ? "over" : "end"; return; }
    if (cd.t === "move"){ const from = p.pos; p.pos = (p.pos + cd.n) % N; if (p.pos < from){ p.coins += PASS; log(s, `${p.name} 經過起點 +${PASS}`); } s.anim = { i:s.turn, from, n:cd.n, seq:s.seq + 1 }; return land(s); }
  }
  if (sq.t === "origin"){ s.q = mkQ(s, "origin", anyChar(), { why:"reward", win:150, lose:0, title:"字源館：這是哪一個字？", sub:"答對 +150" }); s.phase = "q"; return; }
  if (sq.t === "review"){
    const c = p.wrong.length ? pick(p.wrong) : anyChar();
    s.q = mkQ(s, "pick", c, { why:"review", win:100, lose:0, title:"複習站", sub: p.wrong.length ? "這是你這局答錯過的字，答對 +100" : "答對 +100" }); s.phase = "q"; return;
  }
  if (sq.t === "rest"){
    const near = Object.keys(s.items).flatMap(partsOf).filter(k => ORI[k]);
    s.rest = near.length ? pick(near) : ""; p.coins += 50; log(s, `${p.name} 在休息站看字源 +50`); s.phase = "end"; return;
  }
  s.phase = "end";
}
function bankrupt(s){
  s.players.forEach((p, i) => { if (!p.out && p.coins < 0){ p.out = true; s.board.forEach(b => { if (b.owner === i){ b.owner = -1; b.lv = 0; } }); log(s, `${p.name} 破產了，地都還回去。`); } });
  if (s.players.filter(p => !p.out).length <= 1) s.phase = "over";
}
const ACT = {
  roll(s){
    if (s.phase !== "roll") return false;
    const p = cur(s), d = 1 + rnd(6), from = p.pos; s.dice = d; s.rest = "";
    p.pos = (p.pos + d) % N; if (p.pos < from){ p.coins += PASS; log(s, `${p.name} 經過起點 +${PASS}`); }
    s.anim = { i:s.turn, from, n:d, seq:s.seq + 1 }; land(s); return true;
  },
  answer(s, v){
    if (s.phase !== "q" || !s.q || s.q.res) return false;
    const q = s.q, p = cur(s), ok = typeof v === "boolean" ? v : v === q.ans; q.res = { ok, pick:v };
    p.n++; if (ok) p.ok++; else if (q.kind !== "origin" && !p.wrong.includes(q.c)) p.wrong.push(q.c);
    if (ok && q.why === "review" && p.wrong.includes(q.c)) p.wrong = p.wrong.filter(x => x !== q.c);
    const sq = s.board[p.pos];
    if (q.why === "buy"){ s.phase = ok ? "buy" : "end"; log(s, ok ? `${p.name} 答對了，可以買「${sq.comp}」。` : `${p.name} 答錯，這次不能買。`); return true; }
    if (q.why === "up"){ if (ok){ p.coins -= upCost(sq); sq.lv++; log(s, `${p.name} 在「${sq.comp}」蓋了房子！`); } else log(s, `${p.name} 沒答對，房子沒蓋成。`); }
    if (q.why === "toll"){ const f = ok ? round10(toll(s, sq) / 2) : toll(s, sq); p.coins -= f; s.players[sq.owner].coins += f; log(s, `${p.name} 付給 ${s.players[sq.owner].name} 過路費 ${f}${ok ? "（答對打五折）" : ""}`); }
    if (q.why === "reward" || q.why === "review"){ const n = ok ? q.win : -(q.lose || 0); p.coins += n; if (n) log(s, `${p.name} ${n > 0 ? "+" : "−"}${Math.abs(n)}`); }
    s.phase = "end"; bankrupt(s); return true;
  },
  buy(s, yes){
    if (s.phase !== "buy") return false;
    const p = cur(s), sq = s.board[p.pos];
    if (yes && p.coins >= sq.price){ p.coins -= sq.price; sq.owner = s.turn; log(s, `${p.name} 買下「${sq.comp}」！`); }
    s.phase = "end"; return true;
  },
  next(s){
    if (s.phase === "over" || s.phase === "lobby") return false;
    const n = s.players.length; let t = s.turn;
    for (let k = 0; k < n; k++){ t = (t + 1) % n; if (t === 0) s.round++; if (!s.players[t].out) break; }
    s.turn = t; s.q = null; s.card = null; s.rest = ""; s.anim = null; s.dice = 0;
    if (s.round > s.rounds) s.phase = "over"; else s.phase = "roll";
    return true;
  }
};

// ---------- 畫面 ----------
let S = null, ROOM = null, unsub = null, botT = null, animSeq = 0, animating = false, writer = null, saved = false;
const myUid = () => (A.store && A.store.uid) || "";
const isHost = () => !S || S.mode !== "B" || S.host === myUid();
const canAct = () => {
  if (!S) return false; const p = cur(S);
  if (p.bot) return false;
  if (S.mode !== "B") return true;
  return p.uid === myUid();
};
function act(name, v){
  if (!S || animating) return;
  const s = clone(S); if (!ACT[name](s, v)) return; s.seq = (S.seq || 0) + 1; commit(s);
}
function commit(s){
  S = s;
  if (S.mode === "B" && ROOM){ ROOM.update({ s:JSON.stringify(S), ver:S.seq, at:new Date().toISOString() }).catch(e => toast("連線有問題：" + (e.code || e.message || e))); }
  render();
}

function panel(){ return $("#p-fw"); }
function render(){
  const P = panel(); if (!P) return;
  if (!S){ renderSetup(); return; }
  if (S.phase === "lobby"){ renderLobby(); return; }
  P.innerHTML = "";
  const head = el("div", { class:"fwhead" }, [
    el("h2", { text:"漢字大富翁" }),
    el("span", { class:"muted", text:`第 ${Math.min(S.round, S.rounds)}／${S.rounds} 輪　${S.srcName ? "・" + S.srcName : ""}${ROOM ? "　房間 " + ROOM.id : ""}` }),
    el("button", { class:"btn small", type:"button", text: S.phase === "over" ? "再玩一次" : "離開", onclick: leave })
  ]);
  P.append(head);
  const wrap = el("div", { class:"fwwrap" });
  const board = el("div", { class:"fwboard" });
  S.board.forEach((sq, i) => board.append(cellEl(sq, i)));
  board.append(centerEl());
  const side = el("div", { class:"fwside" }, [playersEl(), actionEl()]);
  wrap.append(board, side); P.append(wrap);
  // 動畫：棋子一格一格走
  const a = S.anim;
  if (a && a.seq === S.seq && animSeq !== S.seq){ animSeq = S.seq; walk(a); }
  else placeTokens();
  scheduleBot();
}
const RC = i => { // 20 格排在 6×6 的外圈：上排左→右、右邊上→下、下排右→左、左邊下→上
  if (i <= 5) return [1, i + 1];
  if (i <= 10) return [i - 4, 6];
  if (i <= 15) return [6, 16 - i];
  return [21 - i, 1];
};
function cellEl(sq, i){
  const [r, c] = RC(i);
  const d = el("div", { class:"fwc t-" + sq.t + (sq.t === "lot" ? " g" + sq.g : ""), "data-i":i });
  d.style.gridArea = `${r} / ${c}`;
  if (sq.t === "lot"){
    d.append(el("b", { class:"hz", text:sq.comp }), el("small", { class:"nm", text:sq.name || "" }), el("small", { text: sq.owner >= 0 ? "▲".repeat(sq.lv + 1) : "$" + sq.price }));
    if (sq.owner >= 0){ d.classList.add("own"); d.style.setProperty("--oc", `var(${PCOL[sq.owner]})`); d.title = `${S.players[sq.owner].name} 的地，過路費 ${toll(S, sq)}`; }
    else d.title = `「${sq.comp}」${sq.name ? sq.name + "，" : ""}可以組成：${sq.chars.join("、")}`;
  } else {
    const L = { start:["起點", "經過 +" + PASS], chance:["機會", "抽一張卡"], origin:["字源館", "猜古字"], rest:["休息站", "看字源 +50"], review:["複習站", "複習答錯的字"] }[sq.t];
    d.append(el("b", { text:L[0] }), el("small", { text:L[1] }));
  }
  d.append(el("div", { class:"tok" }));
  return d;
}
function placeTokens(over){
  const P = panel(); P.querySelectorAll(".fwc .tok").forEach(t => t.innerHTML = "");
  S.players.forEach((p, i) => { if (p.out) return; const pos = over && over[i] != null ? over[i] : p.pos;
    const t = P.querySelector(`.fwc[data-i="${pos}"] .tok`); if (t) t.append(el("i", { class: i === S.turn ? "me" : "", style:`background:var(${PCOL[i]})`, title:p.name, text:p.name.slice(0, 1) })); });
}
function walk(a){
  animating = true; let k = 0; const over = {}; over[a.i] = a.from; placeTokens(over); hideAction(true);
  const step = () => { k++; over[a.i] = (a.from + k) % N; placeTokens(over); sfx.pick();
    if (k < a.n) setTimeout(step, 230); else setTimeout(() => { animating = false; placeTokens(); hideAction(false); const t = panel().querySelector(`.fwc[data-i="${S.players[a.i].pos}"]`); if (t){ t.classList.add("land"); } scheduleBot(); focusMe(); }, 250); };
  setTimeout(step, 450);
}
function hideAction(h){ const x = panel().querySelector(".fwact"); if (x) x.style.visibility = h ? "hidden" : ""; }
function focusMe(){ if (S.mode === "B" && canAct()){ const x = panel().querySelector(".fwact"); if (x && x.getBoundingClientRect().top > innerHeight - 80) x.scrollIntoView({ behavior:"smooth", block:"center" }); } }
function dieSvg(n){
  const P = { 1:[[50,50]], 2:[[28,28],[72,72]], 3:[[28,28],[50,50],[72,72]], 4:[[28,28],[72,28],[28,72],[72,72]], 5:[[28,28],[72,28],[50,50],[28,72],[72,72]], 6:[[28,25],[72,25],[28,50],[72,50],[28,75],[72,75]] }[n] || [];
  return `<svg viewBox="0 0 100 100" class="die" aria-label="${n} 點"><rect x="4" y="4" width="92" height="92" rx="18"/>${P.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9"/>`).join("")}</svg>`;
}
function centerEl(){
  const p = cur(S);
  const box = el("div", { class:"fwcenter" });
  if (S.phase === "over"){ box.append(el("div", { class:"big", text:"遊戲結束" })); }
  else {
    const who = el("div", { class:"who" }, [el("i", { style:`background:var(${PCOL[S.turn]})` }), `輪到 ${p.name}`]);
    const d = el("div", { class:"dice" }); d.innerHTML = S.dice ? dieSvg(S.dice) : "";
    box.append(who, d);
  }
  const lg = el("div", { class:"fwlog" }); S.log.slice(-4).forEach(t => lg.append(el("div", { text:t }))); box.append(lg);
  return box;
}
function playersEl(){
  const box = el("div", { class:"fwplayers" });
  S.players.forEach((p, i) => {
    const lots = S.board.filter(b => b.owner === i).map(b => b.comp).join(" ");
    box.append(el("div", { class:"fwp" + (i === S.turn && S.phase !== "over" ? " on" : "") + (p.out ? " out" : "") }, [
      el("i", { style:`background:var(${PCOL[i]})`, text:p.name.slice(0, 1) }),
      el("div", { class:"nm" }, [el("b", { text:p.name + (p.bot ? `（${BOTLV[p.bot].name}）` : "") + (p.out ? "　破產" : "") }), el("small", { text: lots ? "地：" + lots : "還沒有地" })]),
      el("div", { class:"coin", text:p.coins })
    ]));
  });
  return box;
}
function actionEl(){
  const box = el("div", { class:"fwact box" }); const p = cur(S), me = canAct();
  if (S.phase === "over") return overEl();
  if (S.card) box.append(el("div", { class:"fwcard", text:"機會卡：" + S.card }));
  const wait = t => box.append(el("p", { class:"muted", text:t }));
  if (S.phase === "roll"){
    if (me){ const b = el("button", { class:"btn primary big", type:"button", text:`${p.name}，擲骰子` }); b.onclick = () => { sfx.pick(); act("roll"); }; box.append(b); }
    else wait(p.bot ? "電腦正在擲骰子……" : `等 ${p.name} 擲骰子……`);
  }
  if ((S.phase === "q" || S.phase === "buy" || S.phase === "end") && S.q) box.append(qEl(S.q, me && S.phase === "q"));
  if (S.phase === "buy"){
    const sq = S.board[p.pos];
    if (me){ box.append(el("div", { class:"row" }, [
      el("button", { class:"btn primary", type:"button", text:`買下「${sq.comp}」（${sq.price}）`, onclick: () => { sfx.good(); act("buy", true); } }),
      el("button", { class:"btn", type:"button", text:"不買", onclick: () => act("buy", false) }) ])); }
    else wait(`等 ${p.name} 決定要不要買……`);
  }
  if (S.phase === "end"){
    if (S.rest && ORI[S.rest]){ const o = originBlock(S.rest); if (o){ box.append(el("p", { class:"muted", text:"休息站：看一個部件的字源" }), o); } }
    if (!S.q && !S.rest) box.append(el("p", { text:S.log[S.log.length - 1] || "" }));
    if (me || (S.mode === "B" && isHost() && cur(S).bot)){ const b = el("button", { class:"btn primary big", type:"button", text: nextName() }); b.onclick = () => act("next"); box.append(b); }
    else if (!p.bot) wait(`等 ${p.name} 按「下一位」……`);
  }
  // 主持人可以幫卡住的人跳過
  if (S.mode === "B" && isHost() && !me && !p.bot && S.phase !== "over"){
    box.append(el("button", { class:"btn small skip", type:"button", text:`${p.name} 卡住了？幫他跳過`, onclick: () => { const s = clone(S); if (s.phase === "q" && s.q && !s.q.res){ s.q.res = { ok:false, pick:-1 }; } s.phase = "end"; ACT.next(s); s.seq = S.seq + 1; commit(s); } }));
  }
  return box;
}
function nextName(){ const n = S.players.length; let t = S.turn; for (let k = 0; k < n; k++){ t = (t + 1) % n; if (!S.players[t].out) break; } return `換下一位：${S.players[t].name} →`; }
function qEl(q, live){
  const box = el("div", { class:"fwq" });
  box.append(el("h3", { text:q.title || "" })); if (q.sub) box.append(el("p", { class:"muted", text:q.sub }));
  const prompt = el("div", { class:"prompt" }); let ask = "";
  const spk = () => say(`${q.c}，${q.w}的${q.c}`);
  if (q.kind === "pick"){ prompt.append(el("div", { class:"w", text:blank(q.w, q.c) }), el("div", { class:"py", text:q.py })); ask = "□ 是哪一個字？"; }
  if (q.kind === "listen"){ const b = el("button", { class:"btn", type:"button", text:"🔊 再聽一次" }); b.onclick = spk; prompt.append(b); ask = "聽讀音，選出對的字。"; if (live) setTimeout(spk, 200); }
  if (q.kind === "build"){ prompt.append(el("div", { class:"w", text:q.parts.join(" ＋ ") + " ＝ ？" })); ask = `提示：${blank(q.w, q.c)}`; }
  if (q.kind === "py"){ prompt.append(el("div", { class:"w", text:q.w })); ask = `「${q.c}」怎麼讀？`; }
  if (q.kind === "origin"){ const g = el("span", { class:"gw big" }); g.style.setProperty("--m", `url("data:image/webp;base64,${GLY[q.c + "-" + q.script]}")`); prompt.append(g, el("div", { class:"muted", text:{ oracle:"甲骨文", bronze:"金文", seal:"小篆" }[q.script] })); ask = "這個古字是今天的哪一個字？"; }
  if (q.kind === "write"){ prompt.append(el("div", { class:"w", text:blank(q.w, q.c) }), el("div", { class:"py", text:q.py })); ask = "把 □ 寫出來（照筆順寫）。"; }
  box.append(prompt); if (ask) box.append(el("p", { class:"ask", text:ask }));
  if (q.kind === "write" && !q.res){
    const pad = el("div", { class:"fwpad" }); box.append(pad);
    if (live){
      setTimeout(() => { try { pad.innerHTML = ""; const sz = Math.min(220, pad.clientWidth || 220);
        writer = HanziWriter.create(pad, q.c, { width:sz, height:sz, padding:10, showCharacter:false, showOutline:false, strokeColor:css("--navy"), drawingColor:css("--ink"), highlightColor:css("--green") });
        writer.quiz({ onMistake: () => sfx.bad(), onCorrectStroke: () => sfx.pick(), onComplete: r => setTimeout(() => answered(r.totalMistakes <= 3), 500) }); } catch(e){ answered(false); } }, 30);
      box.append(el("button", { class:"btn small", type:"button", text:"我不會寫", onclick: () => answered(false) }));
    } else pad.append(el("p", { class:"muted", text:`${cur(S).name} 正在寫……` }));
  } else if (q.opts){
    const g = el("div", { class:"opts" + (q.kind === "py" ? " pyo" : "") });
    q.opts.forEach((o, i) => {
      const b = el("button", { class:"opt", type:"button", text:o });
      if (q.res){ b.disabled = true; if (i === q.ans) b.classList.add("right"); else if (i === q.res.pick) b.classList.add("wrong"); }
      else if (live) b.onclick = () => answered(i); else b.disabled = true;
      g.append(b);
    });
    box.append(g);
  }
  if (q.res){
    const ok = q.res.ok, e = CH[q.c] || {};
    const fb = el("div", { class:"fwfb " + (ok ? "ok" : "no") }, [el("b", { text: ok ? "答對了！" : "答錯了" }), `　${q.c}　${q.py || ""}　${q.kind === "origin" ? (nameOf(q.c) !== q.py ? nameOf(q.c) : "") : q.w}`]);
    if (e.tip && q.kind !== "origin") fb.append(el("div", { class:"muted", text:"記憶提示：" + e.tip }));
    const b = el("button", { class:"btn small", type:"button", text:"🔊" }); b.onclick = spk; fb.append(" ", b);
    box.append(fb);
    if (q.kind === "origin" && ORI[q.c]){ const o = originBlock(q.c); if (o) box.append(o); }
  }
  return box;
}
function answered(v){
  if (!S || !S.q || S.q.res) return;
  const ok = typeof v === "boolean" ? v : v === S.q.ans;
  if (ok){ sfx.good(); const r = panel().querySelector(".fwq"); if (r){ const [x, y] = centerOf(r); burst(x, y, 20); } } else sfx.bad();
  act("answer", v);
}
function overEl(){
  const box = el("div", { class:"fwact box" });
  const rank = S.players.map((p, i) => ({ p, i, w:worth(S, i) })).sort((a, b) => b.w - a.w);
  box.append(el("h3", { text:`第一名：${rank[0].p.name}！` }));
  rank.forEach((r, k) => {
    const row = el("div", { class:"fwrank" }, [el("b", { text:`${k + 1}. ${r.p.name}` }), el("span", { text:`總資產 ${r.w}（金幣 ${r.p.coins}）・答對 ${r.p.ok}／${r.p.n}` })]);
    box.append(row);
    if (r.p.wrong.length && !r.p.bot){ const w = el("div", { class:"fwwrong" }, [el("small", { class:"muted", text:"要再複習的字：" })]);
      r.p.wrong.forEach(c => { const it = S.items[c] || [CH[c] ? CH[c].w : c, pyOf(c)]; w.append(el("span", { class:"chip", title:it[1], text:`${c}（${it[0]}）` })); }); box.append(w); }
  });
  // 自己的裝置：答錯的字加到「今天的複習」、答對的題目換成經驗值
  if (!saved){ saved = true; const mine = S.players.filter(p => !p.bot && (S.mode === "C" || (S.mode === "B" && p.uid === myUid())));
    if (mine.length === 1 && A.store.me){ const p = mine[0]; let n = 0; p.wrong.forEach(c => { const it = S.items[c] || []; if (A.addReview(c, it[0], it[1])) n++; }); if (p.ok) A.addXp(p.ok * 5); A.save(); if (n) toast(`答錯的 ${n} 個字已經加到「今天的複習」`); }
    if (rank[0].p && !rank[0].p.bot) sfx.win(); }
  return box;
}

// ---------- 電腦玩家 ----------
function scheduleBot(){
  clearTimeout(botT); if (!S || animating || S.phase === "over" || S.phase === "lobby") return;
  const p = cur(S); if (!p.bot || !isHost()) return;
  botT = setTimeout(() => {
    if (!S || animating) return; const s = S, lv = BOTLV[p.bot] || BOTLV.normal;
    if (s.phase === "roll") act("roll");
    else if (s.phase === "q" && s.q && !s.q.res){ const ok = Math.random() < lv.p; act("answer", s.q.opts ? (ok ? s.q.ans : (s.q.ans + 1 + rnd(s.q.opts.length - 1)) % s.q.opts.length) : ok); }
    else if (s.phase === "buy"){ const sq = s.board[p.pos]; act("buy", p.coins >= sq.price + 80); }
    else if (s.phase === "end") act("next");
  }, S.phase === "end" ? 1800 : 1100);
}

// ---------- 開始畫面 ----------
const SET = { mode:"A", src:"course", rounds:8, names:["", "", "", ""], np:2, bot:"normal", nbot:1, tb:"", lids:[], fam:"*", lv:1, hostOnly:false };
try { Object.assign(SET, JSON.parse(localStorage.getItem("hz-fw") || "{}")); } catch(e){}
const keep = () => { try { localStorage.setItem("hz-fw", JSON.stringify(SET)); } catch(e){} };
function seg(opts, val, on){ const s = el("div", { class:"seg" }); opts.forEach(([v, t]) => { const b = el("button", { type:"button", text:t, "aria-pressed":String(v === val) }); b.onclick = () => on(v); s.append(b); }); return s; }
function srcInfo(){
  if (SET.src === "course"){ const ids = SET.lids.filter(id => C.byId[id]); return { src:{ k:"course", ids }, name: ids.length === 1 ? C.byId[ids[0]].label : `課本 ${ids.length} 課` }; }
  if (SET.src === "fam") return { src:{ k:"fam", v:SET.fam }, name: SET.fam === "*" ? "精選字族" : SET.fam };
  return { src:{ k:"lv", v:SET.lv }, name:(LEVELS[SET.lv] || {}).name || "" };
}
function renderSetup(){
  const P = panel(); P.innerHTML = "";
  if (SET.src === "course" && !C.lessons.length) SET.src = "fam";
  P.append(el("div", { class:"fwhead" }, [el("h2", { text:"漢字大富翁" })]));
  P.append(el("p", { class:"muted fwrule", text:"擲骰子走棋盤。棋盤上的地是「部件」，踩到沒人的地，答對題目就能買下來；踩到自己的地可以答題蓋房子；踩到別人的地要付過路費，答對打五折。機會卡、字源館、複習站都是答題賺金幣。幾輪結束後，總資產最多的人贏，每個人答錯的字會列出來複習。" }));
  const f = el("div", { class:"fwset box" }); P.append(f);
  const row = (label, node) => f.append(el("div", { class:"fwrow" }, [el("label", { text:label }), node]));
  row("玩法", seg([["A", "一台電腦輪流玩"], ["B", "各自用自己的裝置"], ["C", "跟電腦對戰"]], SET.mode, v => { SET.mode = v; keep(); renderSetup(); }));
  if (SET.mode === "B"){
    if (!myUid()){ f.append(el("div", { class:"notice", text:"連線玩要先登入（學生用自己的帳號登入，老師用老師帳號）。" })); return; }
    const code = el("input", { class:"fwin", inputmode:"numeric", maxlength:"5", placeholder:"房間代碼（5 位數）" });
    const nm = el("input", { class:"fwin", placeholder:"你的名字", value:(A.store.me && A.store.me.name) || SET.names[0] || "" });
    f.append(el("h3", { text:"加入同學開的房間" }), el("div", { class:"row" }, [code, nm, el("button", { class:"btn primary", type:"button", text:"加入", onclick: () => join(code.value.trim(), nm.value.trim()) })]));
    f.append(el("h3", { class:"mt", text:"或是：自己開一個房間（老師開房，學生用代碼加入）" }));
  }
  if (SET.mode === "A"){
    row("人數", seg([[2, "2 人"], [3, "3 人"], [4, "4 人"]], SET.np, v => { SET.np = v; keep(); renderSetup(); }));
    const ns = el("div", { class:"row" }); for (let i = 0; i < SET.np; i++){ const inp = el("input", { class:"fwin", placeholder:`玩家 ${i + 1}`, value:SET.names[i] || "" }); inp.oninput = () => { SET.names[i] = inp.value; keep(); }; ns.append(inp); } row("名字", ns);
  }
  if (SET.mode === "C"){
    row("電腦", seg([[1, "1 個"], [2, "2 個"], [3, "3 個"]], SET.nbot, v => { SET.nbot = v; keep(); renderSetup(); }));
    row("電腦程度", seg(Object.entries(BOTLV).map(([k, v]) => [k, v.name]), SET.bot, v => { SET.bot = v; keep(); renderSetup(); }));
  }
  if (SET.mode === "B"){ const cb = el("input", { type:"checkbox" }); cb.checked = SET.hostOnly; cb.onchange = () => { SET.hostOnly = cb.checked; keep(); };
    row("主持人", el("label", { class:"chk" }, [cb, " 我只當主持人（投影棋盤，不下場玩）"])); }
  // 題目範圍
  const srcs = [["fam", "精選字族"], ["lv", "華語八千詞"]]; if (C.lessons.length) srcs.unshift(["course", "我的課本"]);
  row("題目", seg(srcs, SET.src, v => { SET.src = v; keep(); renderSetup(); }));
  if (SET.src === "course"){
    const tbs = [...new Set(C.lessons.map(L => L.tb || "其他課"))];
    if (!tbs.includes(SET.tb)) SET.tb = tbs[0];
    const sel = el("select", { class:"fwsel" }); tbs.forEach(t => sel.append(el("option", { value:t, text:t }))); sel.value = SET.tb;
    sel.onchange = () => { SET.tb = sel.value; keep(); renderSetup(); };
    const q = el("input", { class:"fwin", placeholder:"搜尋課名或字" });
    const list = el("div", { class:"fwlist" });
    const ls = C.lessons.filter(L => (L.tb || "其他課") === SET.tb);
    const draw = () => { list.innerHTML = ""; const k = q.value.trim();
      ls.filter(L => !k || L.label.includes(k) || L.chars.some(x => k.includes(x.c))).forEach(L => {
        const cb = el("input", { type:"checkbox" }); cb.checked = SET.lids.includes(L.id);
        cb.onchange = () => { SET.lids = cb.checked ? SET.lids.concat(L.id) : SET.lids.filter(x => x !== L.id); keep(); cnt(); };
        list.append(el("label", { class:"chk" }, [cb, ` ${L.label}`, el("small", { class:"muted", text:`　${L.chars.length} 字` })])); }); };
    q.oninput = draw; draw();
    const n = el("small", { class:"muted" }); const cnt = () => { const it = itemsFrom(srcInfo().src); n.textContent = `已選 ${SET.lids.filter(id => C.byId[id]).length} 課，共 ${Object.keys(it).length} 個字`; }; cnt();
    row("課本", el("div", { class:"fwcol" }, [el("div", { class:"row" }, [sel, q]), list, n]));
  }
  if (SET.src === "fam"){ const sel = el("select", { class:"fwsel" }); sel.append(el("option", { value:"*", text:"全部精選字族" })); FAM.forEach(x => sel.append(el("option", { value:x.name, text:x.name }))); sel.value = SET.fam; sel.onchange = () => { SET.fam = sel.value; keep(); }; row("字族", sel); }
  if (SET.src === "lv"){ const sel = el("select", { class:"fwsel" }); LEVELS.forEach((L, i) => { if (i) sel.append(el("option", { value:i, text:L.name })); }); sel.value = SET.lv; sel.onchange = () => { SET.lv = Number(sel.value); keep(); }; row("等級", sel); }
  row("輪數", seg([[6, "6 輪（約 15 分鐘）"], [8, "8 輪"], [12, "12 輪"]], SET.rounds, v => { SET.rounds = v; keep(); renderSetup(); }));
  const go = el("button", { class:"btn primary big", type:"button", text: SET.mode === "B" ? "開房間" : "開始玩" }); go.onclick = start;
  f.append(el("div", { class:"row mt" }, [go]));
}
function start(){
  const si = srcInfo(); const items = itemsFrom(si.src);
  if (Object.keys(items).length < 6){ toast(SET.src === "course" ? "請至少選一課（合起來要有 6 個字以上）" : "這個範圍的字太少了"); return; }
  const me = (A.store.me && A.store.me.name) || "我";
  let players;
  if (SET.mode === "A") players = Array.from({ length:SET.np }, (_, i) => ({ name:(SET.names[i] || "").trim() || `玩家 ${i + 1}` }));
  if (SET.mode === "C") players = [{ name:me }].concat(Array.from({ length:SET.nbot }, (_, i) => ({ name:["電腦一號", "電腦二號", "電腦三號"][i], bot:SET.bot })));
  if (SET.mode === "B") players = SET.hostOnly ? [] : [{ name:me, uid:myUid() }];
  saved = false;
  const s = newGame({ mode:SET.mode, rounds:SET.rounds, src:si.src, srcName:si.name, players, host:myUid() });
  if (SET.mode === "B") return openRoom(s);
  S = s; render(); window.scrollTo({ top:0 });
}

// ---------- 連線（房間）----------
const rooms = () => firebase.firestore().collection("hz_rooms");
async function openRoom(s){
  try {
    let code = "", tries = 0;
    do { code = String(10000 + rnd(90000)); tries++; } while (tries < 5 && (await rooms().doc(code).get()).exists);
    await rooms().doc(code).set({ host:myUid(), s:JSON.stringify(s), ver:1, at:new Date().toISOString() });
    listen(code);
  } catch(e){ roomErr(e); }
}
async function join(code, name){
  if (!/^\d{5}$/.test(code)){ toast("房間代碼是 5 位數字"); return; }
  try {
    const ref = rooms().doc(code), uid = myUid(); name = name || "同學";
    const doJoin = d => { if (!d.exists) throw new Error("NOROOM"); const s = JSON.parse(d.data().s);
      if (s.players.some(p => p.uid === uid)) return null;
      if (s.phase !== "lobby") throw new Error("STARTED"); if (s.players.length >= 4) throw new Error("FULL");
      s.players.push({ name, uid, bot:"", coins:START, pos:0, out:false, wrong:[], ok:0, n:0 }); s.seq++; return s; };
    const fs = firebase.firestore();
    if (fs.runTransaction) await fs.runTransaction(async t => { const s = doJoin(await t.get(ref)); if (s) t.update(ref, { s:JSON.stringify(s), ver:s.seq }); });
    else { const s = doJoin(await ref.get()); if (s) await ref.update({ s:JSON.stringify(s), ver:s.seq }); }
    listen(code);
  } catch(e){ const m = { NOROOM:"找不到這個房間，請再確認代碼。", STARTED:"這個房間的遊戲已經開始了。", FULL:"這個房間已經 4 個人了。" }[e.message]; if (m) toast(m); else roomErr(e); }
}
function roomErr(e){
  const perm = /permission|insufficient/i.test(String(e && (e.code || e.message)));
  toast(perm ? "連線玩還沒開通：老師要先在 Firebase 加上 hz_rooms 的規則（見 README「漢字大富翁」）。" : "連線失敗：" + (e && (e.message || e.code) || e));
}
function listen(code){
  stopRoom(); ROOM = rooms().doc(code); saved = false;
  unsub = ROOM.onSnapshot(d => {
    if (!d.exists){ toast("房間已經關閉了"); ROOM = null; S = null; render(); return; }
    const s = JSON.parse(d.data().s); if (S && s.seq < S.seq && S.mode === "B") return; S = s; render();
  }, e => roomErr(e));
}
function stopRoom(){ if (unsub){ try { unsub(); } catch(e){} } unsub = null; }
function renderLobby(){
  const P = panel(); P.innerHTML = "";
  P.append(el("div", { class:"fwhead" }, [el("h2", { text:"漢字大富翁・等大家進來" }), el("button", { class:"btn small", type:"button", text:"離開", onclick: leave })]));
  const b = el("div", { class:"box fwlobby" });
  b.append(el("p", { class:"muted", text:"請同學打開漢字遊戲 →「大富翁」→「各自用自己的裝置」，輸入房間代碼：" }), el("div", { class:"code", text:ROOM ? ROOM.id : "" }));
  b.append(el("p", { class:"muted", text:`題目：${S.srcName}　${S.rounds} 輪　最多 4 人` }));
  const ul = el("div", { class:"fwplayers" }); S.players.forEach((p, i) => ul.append(el("div", { class:"fwp" }, [el("i", { style:`background:var(${PCOL[i]})`, text:p.name.slice(0, 1) }), el("div", { class:"nm" }, [el("b", { text:p.name + (p.uid === S.host ? "（開房）" : "") })])])));
  if (!S.players.length) ul.append(el("p", { class:"muted", text:"還沒有人加入。" }));
  b.append(ul);
  if (isHost()){
    const go = el("button", { class:"btn primary big", type:"button", text:"開始！" }); go.disabled = S.players.length < 2;
    go.onclick = () => { const s = clone(S); s.phase = "roll"; s.seq++; s.log = ["遊戲開始！每人 " + START + " 金幣。"]; commit(s); };
    b.append(el("div", { class:"row mt" }, [go, el("small", { class:"muted", text: S.players.length < 2 ? "至少要 2 個人" : "" })]));
  } else b.append(el("p", { class:"mt", text:"等老師按「開始」……" }));
  P.append(b);
}
async function leave(){
  clearTimeout(botT);
  if (S && S.phase !== "over" && S.phase !== "lobby" && !confirmLeave()) return;
  if (ROOM && isHost()){ try { await ROOM.delete(); } catch(e){} }
  stopRoom(); ROOM = null; S = null; render();
}
function confirmLeave(){ const P = panel(); const b = P.querySelector(".fwhead .btn"); if (b && b.dataset.sure) return true; if (b){ b.dataset.sure = "1"; b.textContent = "確定要離開？再按一次"; setTimeout(() => { if (b.isConnected){ delete b.dataset.sure; b.textContent = "離開"; } }, 3000); } return false; }

// ---------- 接到漢字遊戲的分頁 ----------
const tab = document.querySelector('nav.tabs button[data-tab="fw"]');
if (tab) tab.addEventListener("click", () => { A.showTab("fw"); if (!S) render(); });
if (new URLSearchParams(location.search).get("fw")){ A.showTab("fw"); const c = new URLSearchParams(location.search).get("fw"); render(); if (/^\d{5}$/.test(c)) setTimeout(() => { if (myUid()) join(c, (A.store.me && A.store.me.name) || ""); }, 2500); }
window.HZFW = { get state(){ return S; }, act, ACT, newGame, makeBoard, itemsFrom, mkQ, retone };
}
if (window.HZAPI) boot(); else document.addEventListener("hzapi", boot);
})();
