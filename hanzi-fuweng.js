/* 漢字大富翁（hanzi-fuweng.js）
   三種玩法：A 一台電腦輪流玩、B 每個人用自己的裝置連線（房間代碼）、C 跟電腦對戰。
   棋盤上的「地」是部件（例如「言」「射」），答對題目就買下來；同一個人擁有能組成一個字的兩塊地（言＋射＝謝），就蓋成「字城」，過路費翻倍。
   題目限時，答越快賺越多；答錯了別人可以「搶答」；機會卡有搶地、免過路費、交換位置……
   ⚠️ 線上連線（B）需要 Firestore 規則有 hz_rooms 這個集合，見 README 的「漢字大富翁」。 */
(() => {
"use strict";
function boot(){
const A = window.HZAPI; if (!A || window.__FW) return; window.__FW = true;
const { CH, RAD, LEVELS, FAM, C, NOSTROKE, shuffle, css, pyOf, say, sfx, burst, toast, centerOf, distractors, originBlock } = A;
const OV = A.OV || {}, loadOv = A.loadOv || (() => Promise.resolve()), ovStyle = A.ovStyle || (img => `--m:url("data:image/webp;base64,${img}")`);
const $ = s => document.querySelector(s);
// 跟遊戲本體的 el 一樣，另外支援 onclick 這類函式
const el = (tag, attrs = {}, kids = []) => { const fn = {}, at = {}; for (const k in attrs){ if (typeof attrs[k] === "function") fn[k] = attrs[k]; else at[k] = attrs[k]; } const n = A.el(tag, at, kids); Object.assign(n, fn); return n; };
const ORI = window.ORIGIN || {}, GLY = window.GLYPHS || {};
const N = 20, START = 1000, PASS = 150, CITY_BONUS = 100;
const PRICE = [100, 140, 180, 220];
// 棋盤：0 起點、5 字源館、10 休息站、15 複習站；2、8、12、17 機會；其他 12 格是部件地
const LAYOUT = ["start","lot","chance","lot","lot","origin","lot","lot","chance","lot","rest","lot","chance","lot","lot","review","lot","chance","lot","lot"];
const PCOL = ["--navy", "--green", "--plum", "--gold"];
const BOTLV = { easy:{ name:"簡單", p:.55 }, normal:{ name:"普通", p:.75 }, hard:{ name:"厲害", p:.92 } };
const LIM = { stack:15, pick:10, listen:10, tone:10, typo:12, origin:12, write:45 };
const KNAME = { stack:"疊字", pick:"選字", listen:"聽音", tone:"聲調", typo:"找錯字", origin:"字源", write:"寫字" };
const CHANCE = [
  { t:"rain", text:"金幣雨：連答三題，每題 +60" },
  { t:"grab", text:"搶地卡：答對就搶走別人一塊地" },
  { t:"free", text:"免過路費卡：收起來，下次踩到別人的地自動用" },
  { t:"swap", text:"乾坤大挪移：跟第一名交換位置" },
  { t:"back", n:3, text:"踩到香蕉皮：後退 3 格" },
  { t:"move", n:3, text:"順風：前進 3 格" },
  { t:"tax", n:40, text:"生日快樂：大家各給你 40" },
  { t:"q", kind:"listen", win:120, lose:40, text:"聽音挑戰：答對 +120，答錯 −40" },
  { t:"q", kind:"typo", win:120, lose:40, text:"找錯字：答對 +120，答錯 −40" }
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
const nameOf = p => A.radName ? (A.radName(p) || pyOf(p) || "") : (p in RAD && RAD[p].name && RAD[p].name !== p ? RAD[p].name : (pyOf(p) || ""));
const hasGlyph = k => ["oracle", "bronze", "seal"].some(s => GLY[k + "-" + s]);
const itemOf = (s, c) => s.items[c] || [CH[c] ? CH[c].w : c, pyOf(c)];

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
// 棋盤的地：盡量讓「兩塊地合起來是一個字」，才組得出字城
function makeBoard(items){
  const cs = Object.keys(items), lots = [], has = p => lots.includes(p);
  shuffle(cs.filter(c => partsOf(c).length === 2 && partsOf(c)[0] !== partsOf(c)[1])).forEach(c => { const [a, b] = partsOf(c); const need = (has(a) ? 0 : 1) + (has(b) ? 0 : 1); if (lots.length + need <= 12){ if (!has(a)) lots.push(a); if (!has(b)) lots.push(b); } });
  const m = {}; cs.forEach(c => partsOf(c).forEach(p => m[p] = (m[p] || 0) + 1));
  Object.keys(m).sort((a, b) => m[b] - m[a]).forEach(p => { if (lots.length < 12 && !has(p)) lots.push(p); });
  shuffle(cs).forEach(c => { if (lots.length < 12 && !has(c)) lots.push(c); });
  const order = shuffle(lots); let li = 0;
  const board = LAYOUT.map(t => {
    if (t !== "lot") return { t };
    const comp = order[li % Math.max(1, order.length)] || "字", g = Math.floor(li / 3); li++;
    const chars = cs.filter(c => partsOf(c).includes(comp));
    return { t, comp, name:nameOf(comp), chars:(chars.length ? chars : cs.slice(0, 4)).slice(0, 12), g, price:PRICE[g], owner:-1, lv:0 };
  });
  return board;
}
// 這個棋盤上可以蓋的字城（兩塊地合起來是一個字）
function makeCombos(board, items){
  const comps = new Set(board.filter(b => b.t === "lot").map(b => b.comp)), out = [], seen = new Set();
  const tryC = c => { const p = partsOf(c); if (p.length !== 2 || p[0] === p[1] || seen.has(c) || !comps.has(p[0]) || !comps.has(p[1])) return; seen.add(c); out.push({ c, a:p[0], b:p[1], w:itemOf({ items }, c)[0] }); };
  Object.keys(items).forEach(tryC);
  if (out.length < 8) Object.keys(CH).forEach(c => { if (out.length < 12 && CH[c].w) tryC(c); });
  return out;
}
function newGame(cfg){
  const items = itemsFrom(cfg.src), board = makeBoard(items);
  return { v:2, mode:cfg.mode, rounds:cfg.rounds, round:1, turn:0, seq:1, srcName:cfg.srcName || "",
    players:cfg.players.map(newPlayer), items, board, combos:makeCombos(board, items), cities:[],
    phase:cfg.mode === "B" ? "lobby" : "roll", dice:0, anim:null, q:null, card:"", steal:null, fx:null, dl:null,
    log:["遊戲開始！每人 " + START + " 金幣。"], host:cfg.host || "" };
}
const newPlayer = p => ({ name:p.name, uid:p.uid || "", bot:p.bot || "", coins:START, pos:0, out:false, wrong:[], ok:0, n:0, streak:0, free:0 });

// ---------- 規則 ----------
const cur = s => s.players[s.turn];
const log = (s, t) => { s.log.push(t); if (s.log.length > 10) s.log.shift(); };
const money = (s, i, n) => { if (!n) return; s.players[i].coins += n; s.dl = s.dl || { seq:0, d:{} }; s.dl.d[i] = (s.dl.d[i] || 0) + n; };
const banner = (s, k, text, c) => { s.fx = { seq:s.seq + 1, k, text, c:c || "" }; };
const lotOf = (s, comp) => s.board.find(b => b.t === "lot" && b.comp === comp);
const inCity = (s, sq) => s.cities.some(x => x.owner === sq.owner && (x.a === sq.comp || x.b === sq.comp));
const groupOwned = (s, sq) => sq.owner >= 0 && s.board.filter(b => b.t === "lot" && b.g === sq.g).every(b => b.owner === sq.owner);
const toll = (s, sq) => round10(sq.price * [0.3, 0.7, 1.2][sq.lv] * (groupOwned(s, sq) ? 2 : 1) * (inCity(s, sq) ? 2 : 1));
const upCost = sq => round10(sq.price / 2);
const worth = (s, i) => s.players[i].coins + s.board.filter(b => b.owner === i).reduce((a, b) => a + b.price + b.lv * upCost(b), 0);
function updateCities(s){
  const before = new Set(s.cities.map(x => x.c + x.owner));
  s.cities = s.combos.filter(x => { const A1 = lotOf(s, x.a), B1 = lotOf(s, x.b); return A1 && B1 && A1.owner >= 0 && A1.owner === B1.owner; }).map(x => Object.assign({}, x, { owner:lotOf(s, x.a).owner }));
  s.cities.forEach(x => { if (!before.has(x.c + x.owner)){ money(s, x.owner, CITY_BONUS); banner(s, "city", `${s.players[x.owner].name} 蓋了字城「${x.c}」！`, x.c); log(s, `${s.players[x.owner].name}：${x.a}＋${x.b}＝${x.c}，蓋成字城 +${CITY_BONUS}，這兩塊地過路費翻倍`); } });
}
function mkQ(s, kind, c, extra){
  const it = itemOf(s, c), w = it[0], py = it[1];
  if (kind === "stack" && (partsOf(c).length !== 2 || !OV[c])) kind = "pick";
  if (kind === "write" && (NOSTROKE.has(c) || !window.HanziWriter)) kind = "stack";
  if (kind === "stack" && (partsOf(c).length !== 2 || !OV[c])) kind = "pick";
  if (kind === "typo" && [...w].length < 2) kind = "pick";
  if (kind === "tone" && !bare(py)) kind = "pick";
  const q = Object.assign({ kind, c, w, py, opts:null, ans:0, res:null, tried:[], t0:Date.now(), lim:LIM[kind] || 10 }, extra || {});
  const pool = Object.keys(s.items).filter(x => x !== c);
  const near = () => { const ds = distractors({ c, py }, 4).filter(x => x !== c && [...w].indexOf(x) < 0); return shuffle(ds.filter(x => s.items[x]).concat(ds, shuffle(pool).slice(0, 2))).filter((x, i, a) => a.indexOf(x) === i && x !== c); };
  if (kind === "pick" || kind === "listen"){ q.opts = shuffle([c].concat(near().slice(0, 3))); q.ans = q.opts.indexOf(c); }
  else if (kind === "typo"){
    // 把詞裡的這個字換成長得像或同音的字，請學生找出寫錯的那一個
    const d = near()[0] || pool[0]; const chars = [...w]; const k = chars.indexOf(c); chars[k] = d;
    q.opts = chars; q.ans = k; q.d = d;
  } else if (kind === "tone"){
    const t = [1, 2, 3, 4, 0].map(k => retone(py, k)).filter(x => x !== py);
    q.opts = shuffle([py].concat(shuffle(t).slice(0, 3))); q.ans = q.opts.indexOf(py);
  } else if (kind === "stack"){
    // 透明卡：這個字的兩張＋別的字的四張，選兩張疊出來
    const own = [{ s:OV[c][0][0], k:c, i:1 }, { s:OV[c][0][1], k:c, i:2 }];
    const others = []; shuffle(Object.keys(OV)).some(k => { const v = OV[k]; if (!v || k === c) return false; [0, 1].forEach(j => { const sym = v[0][j]; if (sym && !own.some(o => o.s === sym) && !others.some(o => o.s === sym)) others.push({ s:sym, k, i:j + 1 }); }); return others.length >= 8; });
    // 干擾卡優先挑這一局出現過的部件
    const lots = new Set(s.board.map(b => b.comp)); others.sort((a, b) => lots.has(b.s) - lots.has(a.s));
    q.opts = shuffle(own.concat(shuffle(others.slice(0, 6)).slice(0, 4))); q.ans = own.map(o => q.opts.indexOf(o));
  } else if (kind === "origin"){
    // 字源題要猜得出來：答案和選項都用這一局的字裡看得到的部件（最好是象形、常見的），再給「在哪些字裡」的提示
    const EASY = "人女子大日月木口山水火門馬魚目耳手心土田刀力牛羊鳥車雨石竹米貝衣言足走子王犬虫舟弓矢魚".split("");
    const used = {}; Object.keys(s.items).forEach(x => partsOf(x).concat([x]).forEach(k => { if (ORI[k] && hasGlyph(k)) (used[k] = used[k] || []).push(x); }));
    const cand = Object.keys(used).sort((x, y) => (EASY.indexOf(y) >= 0) - (EASY.indexOf(x) >= 0) || used[y].length - used[x].length);
    const top = cand.slice(0, Math.max(4, Math.ceil(cand.length / 2)));
    const k = top.length ? pick(top) : pick(EASY.filter(x => ORI[x] && hasGlyph(x)));
    const sc = ["oracle", "bronze", "seal"].filter(x => GLY[k + "-" + x]);
    q.c = k; q.w = k; q.py = pyOf(k); q.script = sc.includes("oracle") ? "oracle" : sc[0];
    const fill = cand.filter(x => x !== k).concat(shuffle(EASY.filter(x => x !== k && ORI[x] && hasGlyph(x))));
    q.opts = shuffle([k].concat([...new Set(fill)].slice(0, 3))); q.ans = q.opts.indexOf(k);
    q.hint = (used[k] || []).filter(x => x !== k).slice(0, 3);
  }
  return q;
}
const isRight = (q, v) => {
  if (v === "timeout" || v === false || v == null) return false; if (v === true) return true;
  if (q.kind === "stack"){ if (!Array.isArray(v) || v.length !== 2) return false; const want = q.ans.map(i => q.opts[i].s).sort().join(), got = v.map(i => q.opts[i] && q.opts[i].s).sort().join(); return want === got; }
  return v === q.ans;
};
// 字要選「這一局疊得出來」的：疊字題的目標字一定要有透明卡
const charFor = (list, kind) => { const ok = kind === "stack" ? list.filter(c => OV[c] && partsOf(c).length === 2) : list; return pick(ok.length ? ok : list); };
const kindFor = () => pick(["stack", "stack", "pick", "typo", "listen", "tone"]);
function land(s){
  const p = cur(s), sq = s.board[p.pos]; s.q = null; s.card = ""; s.steal = null; s.rest = "";
  const anyChar = k => charFor(Object.keys(s.items), k);
  if (sq.t === "start"){ log(s, `${p.name} 停在起點。`); s.phase = "end"; return; }
  if (sq.t === "lot"){
    if (sq.owner < 0){
      if (p.coins < sq.price){ log(s, `${p.name} 的金幣不夠買「${sq.comp}」。`); s.phase = "end"; return; }
      const k = kindFor(); s.q = mkQ(s, k, charFor(sq.chars, k), { why:"buy", by:s.turn, tag:`買地「${sq.comp}」$${sq.price}` });
    } else if (sq.owner === s.turn){
      if (sq.lv >= 2 || p.coins < upCost(sq)){ log(s, `${p.name} 回到自己的地「${sq.comp}」。`); s.phase = "end"; return; }
      const k = sq.lv ? "write" : "stack"; s.q = mkQ(s, k, charFor(sq.chars, k), { why:"up", by:s.turn, tag:`蓋房子「${sq.comp}」$${upCost(sq)}` });
    } else if (s.players[sq.owner].out){ s.phase = "end"; return; }
    else {
      const f = toll(s, sq), o = s.players[sq.owner];
      if (p.free > 0){ p.free--; log(s, `${p.name} 用了免過路費卡，${o.name} 的「${sq.comp}」不用付錢！`); banner(s, "free", "免過路費卡！"); s.phase = "end"; return; }
      const k = kindFor(); s.q = mkQ(s, k, charFor(sq.chars, k), { why:"toll", by:s.turn, tag:`${o.name} 的地「${sq.comp}」過路費 ${f}`, sub:"答對只付一半" });
    }
    s.phase = "q"; return;
  }
  if (sq.t === "chance"){
    let cd = pick(CHANCE);
    const others = s.board.filter(b => b.t === "lot" && b.owner >= 0 && b.owner !== s.turn && !s.players[b.owner].out);
    if (cd.t === "grab" && !others.length) cd = CHANCE[0];
    s.card = cd.text; log(s, `${p.name} 抽到機會卡：${cd.text}`);
    if (cd.t === "q"){ const k = cd.kind; s.q = mkQ(s, k, anyChar(k), { why:"reward", by:s.turn, win:cd.win, lose:cd.lose, tag:"機會卡" }); s.phase = "q"; return; }
    if (cd.t === "rain"){ s.rain = 3; const k = kindFor(); s.q = mkQ(s, k, anyChar(k), { why:"rain", by:s.turn, win:60, lose:0, tag:"金幣雨 1／3" }); s.phase = "q"; return; }
    if (cd.t === "grab"){ const k = kindFor(); s.q = mkQ(s, k, anyChar(k), { why:"grab", by:s.turn, tag:"搶地卡" }); s.phase = "q"; return; }
    if (cd.t === "free"){ p.free++; s.phase = "end"; return; }
    if (cd.t === "tax"){ s.players.forEach((o, i) => { if (i !== s.turn && !o.out){ money(s, i, -cd.n); money(s, s.turn, cd.n); } }); bankrupt(s); if (s.phase !== "over") s.phase = "end"; return; }
    if (cd.t === "swap"){
      const rich = s.players.map((o, i) => ({ i, w:worth(s, i) })).filter(x => x.i !== s.turn && !s.players[x.i].out).sort((a, b) => b.w - a.w)[0];
      if (rich){ const o = s.players[rich.i]; [p.pos, o.pos] = [o.pos, p.pos]; log(s, `${p.name} 和 ${o.name} 交換位置！`); banner(s, "swap", "乾坤大挪移！"); }
      s.phase = "end"; return;
    }
    if (cd.t === "move" || cd.t === "back"){
      const from = p.pos, n = cd.t === "back" ? -cd.n : cd.n; p.pos = (p.pos + n + N) % N;
      if (n > 0 && p.pos < from){ money(s, s.turn, PASS); log(s, `${p.name} 經過起點 +${PASS}`); }
      s.anim = { i:s.turn, from, n, seq:s.seq + 1, d:0 }; const card = s.card; land(s); s.card = s.card || card; return;
    }
  }
  if (sq.t === "origin"){ s.q = mkQ(s, "origin", anyChar("origin"), { why:"reward", by:s.turn, win:150, lose:0, tag:"字源館：猜古字 +150" }); s.phase = "q"; return; }
  if (sq.t === "review"){
    const c = p.wrong.length ? pick(p.wrong) : anyChar("pick"); const k = pick(["pick", "typo", "stack"]);
    s.q = mkQ(s, k, c, { why:"review", by:s.turn, win:100, lose:0, tag: p.wrong.length ? "複習站：你這局答錯過的字 +100" : "複習站 +100" }); s.phase = "q"; return;
  }
  if (sq.t === "rest"){
    const near = Object.keys(s.items).flatMap(partsOf).filter(k => ORI[k]);
    s.rest = near.length ? pick(near) : ""; money(s, s.turn, 50); log(s, `${p.name} 在休息站看字源 +50`); s.phase = "end"; return;
  }
  s.phase = "end";
}
function bankrupt(s){
  s.players.forEach((p, i) => { if (!p.out && p.coins < 0){ p.out = true; s.board.forEach(b => { if (b.owner === i){ b.owner = -1; b.lv = 0; } }); updateCities(s); log(s, `${p.name} 破產了，地都還回去。`); banner(s, "bust", `${p.name} 破產了！`); } });
  if (s.players.filter(p => !p.out).length <= 1) s.phase = "over";
}
// 搶答：本人答錯以後，其他人 6 秒內可以按「搶答」
function openSteal(s){
  const q = s.q, p = cur(s), sq = s.board[p.pos];
  if (q.stolen || !["buy", "reward"].includes(q.why) || q.kind === "write") return false;
  const can = s.players.map((o, i) => i).filter(i => i !== s.turn && !s.players[i].out && (q.why !== "buy" || s.players[i].coins >= sq.price));
  if (!can.length) return false;
  s.steal = { until:Date.now() + 6000, can }; s.phase = "steal"; return true;
}
const ACT = {
  roll(s){
    if (s.phase !== "roll") return false;
    const p = cur(s), d = 1 + rnd(6), from = p.pos; s.dice = d;
    p.pos = (p.pos + d) % N; if (p.pos < from){ money(s, s.turn, PASS); log(s, `${p.name} 經過起點 +${PASS}`); }
    s.anim = { i:s.turn, from, n:d, seq:s.seq + 1, d }; land(s); return true;
  },
  answer(s, v){
    if (s.phase !== "q" || !s.q || s.q.res) return false;
    const q = s.q, by = q.by == null ? s.turn : q.by, P = s.players[by], ok = isRight(q, v);
    const speed = Math.max(0, 1 - (Date.now() - q.t0) / 1000 / q.lim);
    q.res = { ok, pick:v, by, speed };
    P.n++;
    if (ok){ P.ok++; P.streak = (P.streak || 0) + 1; if (P.streak >= 3 && P.streak % 2 === 1){ money(s, by, 50); banner(s, "streak", `${P.name} 連對 ${P.streak} 題！+50`); } }
    else { P.streak = 0; if (q.kind !== "origin" && !P.wrong.includes(q.c)) P.wrong.push(q.c); }
    if (ok && q.why === "review") P.wrong = P.wrong.filter(x => x !== q.c);
    const sq = s.board[cur(s).pos]; s.phase = "end";
    if (q.why === "buy"){
      if (ok){ const fast = speed >= .6, price = fast ? round10(sq.price * .8) : sq.price;
        if (P.coins >= price){ money(s, by, -price); sq.owner = by; log(s, `${P.name} ${q.stolen ? "搶答成功，" : ""}買下「${sq.comp}」${fast ? "（秒答打八折）" : ""}！`); banner(s, "buy", `${P.name} 買下「${sq.comp}」`, sq.comp); updateCities(s); } }
      else if (!q.stolen){ log(s, `${P.name} 答錯，不能買。`); openSteal(s); }
      else log(s, `${P.name} 搶答失敗。`);
    }
    if (q.why === "up"){ if (ok){ money(s, by, -upCost(sq)); sq.lv++; log(s, `${P.name} 在「${sq.comp}」蓋了房子！`); banner(s, "up", `「${sq.comp}」蓋房子！`, sq.comp); } else log(s, `${P.name} 沒答對，房子沒蓋成。`); }
    if (q.why === "toll"){ const f = ok ? round10(toll(s, sq) / 2) : toll(s, sq); money(s, by, -f); money(s, sq.owner, f); log(s, `${P.name} 付給 ${s.players[sq.owner].name} 過路費 ${f}${ok ? "（答對打五折）" : ""}`); }
    if (q.why === "reward" || q.why === "review"){
      const n = ok ? round10(q.win * (1 + .5 * speed)) : -(q.lose || 0); money(s, by, n);
      if (n) log(s, `${P.name} ${n > 0 ? "+" : "−"}${Math.abs(n)}${ok && speed > .5 ? "（答得快有加成）" : ""}`);
      if (!ok && !q.stolen && q.why === "reward") openSteal(s);
    }
    if (q.why === "rain"){
      if (ok){ money(s, by, 60); s.rain--; if (s.rain > 0){ const k = kindFor(); const nq = mkQ(s, k, charFor(Object.keys(s.items), k), { why:"rain", by, win:60, tag:`金幣雨 ${4 - s.rain}／3` }); nq.prev = q; s.q = nq; s.phase = "q"; return true; } }
      log(s, ok ? `${P.name} 金幣雨三題全對！` : `${P.name} 金幣雨停了。`);
    }
    if (q.why === "grab"){ if (ok){ s.phase = "pick"; log(s, `${P.name} 答對了，選一塊別人的地搶過來！`); return true; } log(s, `${P.name} 答錯，沒搶到地。`); }
    bankrupt(s); return true;
  },
  claim(s, i){
    if (s.phase !== "steal" || !s.steal || !s.steal.can.includes(i) || Date.now() > s.steal.until + 800) return false;
    const q = s.q; q.tried = (q.tried || []).concat([q.res && q.res.pick]); q.res = null; q.by = i; q.stolen = true; q.t0 = Date.now(); q.lim = Math.min(q.lim, 8);
    s.steal = null; s.phase = "q"; log(s, `${s.players[i].name} 搶答！`); banner(s, "steal", `${s.players[i].name} 搶答！`); return true;
  },
  closeSteal(s){ if (s.phase !== "steal") return false; s.steal = null; s.phase = "end"; return true; },
  grab(s, idx){
    if (s.phase !== "pick") return false; const sq = s.board[idx];
    if (!sq || sq.t !== "lot" || sq.owner < 0 || sq.owner === s.turn) return false;
    const from = s.players[sq.owner]; sq.owner = s.turn; log(s, `${cur(s).name} 搶走了 ${from.name} 的「${sq.comp}」！`); banner(s, "grab", `搶走「${sq.comp}」！`, sq.comp);
    updateCities(s); s.phase = "end"; return true;
  },
  next(s){
    if (s.phase === "over" || s.phase === "lobby") return false;
    const n = s.players.length; let t = s.turn;
    for (let k = 0; k < n; k++){ t = (t + 1) % n; if (t === 0) s.round++; if (!s.players[t].out) break; }
    s.turn = t; s.q = null; s.card = ""; s.rest = ""; s.anim = null; s.steal = null; s.dice = 0;
    s.phase = s.round > s.rounds ? "over" : "roll";
    return true;
  }
};

// ---------- 畫面 ----------
let wPad = null, S = null, ROOM = null, unsub = null, botT = null, autoT = null, tickT = null, animSeq = 0, fxSeq = 0, dlSeq = 0, animating = false, writer = null, saved = false, sel = [];
const myUid = () => (A.store && A.store.uid) || "";
const isHost = () => !S || S.mode !== "B" || S.host === myUid();
// 這台裝置能不能幫第 i 個玩家操作
const mine = i => { if (!S || i == null || !S.players[i]) return false; const p = S.players[i]; if (p.bot) return false; return S.mode !== "B" || p.uid === myUid(); };
const myIdx = () => S && S.mode === "B" ? S.players.findIndex(p => p.uid === myUid()) : -1;
const answerer = () => S && S.q ? (S.q.by == null ? S.turn : S.q.by) : S.turn;
function act(name, v){
  if (!S || (animating && name !== "claim")) return;
  if (S.mode === "B" && ROOM && firebase.firestore().runTransaction){
    // 連線：從資料庫拿最新的狀態再改，兩個人同時按（例如搶答）只會算第一個
    const ref = ROOM;
    firebase.firestore().runTransaction(async t => { const d = await t.get(ref); if (!d.exists) return; const s = JSON.parse(d.data().s); const seq = s.seq; s.dl = { seq:seq + 1, d:{} };
      if (!ACT[name](s, v)) return; s.seq = seq + 1; t.update(ref, { s:JSON.stringify(s), ver:s.seq, at:new Date().toISOString() }); }).catch(e => toast("連線有問題：" + (e.code || e.message || e)));
    return;
  }
  const s = clone(S); s.dl = { seq:(S.seq || 0) + 1, d:{} }; if (!ACT[name](s, v)) return; s.seq = (S.seq || 0) + 1; commit(s);
}
function commit(s){
  S = s;
  if (S.mode === "B" && ROOM){ ROOM.update({ s:JSON.stringify(S), ver:S.seq, at:new Date().toISOString() }).catch(e => toast("連線有問題：" + (e.code || e.message || e))); }
  render();
}

function panel(){ return $("#p-fw"); }
function render(){
  const P = panel(); if (!P) return;
  clearTimeout(tickT);
  if (!S){ renderSetup(); return; }
  if (S.phase === "lobby"){ renderLobby(); return; }
  preload();
  if (!(S.q && S.q.kind === "write" && !S.q.res)){ writer = null; wPad = null; }
  // 題目要用的透明卡圖還沒下載：先下載再畫
  if (S.q && S.q.kind === "stack"){ const ks = [...new Set(S.q.opts.map(o => o.k))].filter(k => !OV[k]); if (ks.length){ loadOv(ks).then(() => render()); } }
  const keepScroll = P.querySelector(".fwmodal .fwq");
  P.innerHTML = "";
  P.append(el("div", { class:"fwhead" }, [
    el("h2", { text:"漢字大富翁" }),
    el("span", { class:"muted", text:`第 ${Math.min(S.round, S.rounds)}／${S.rounds} 輪${S.srcName ? "・" + S.srcName : ""}${ROOM ? "　房間 " + ROOM.id : ""}` }),
    el("button", { class:"btn small", type:"button", text: S.phase === "over" ? "再玩一次" : "離開", onclick: leave })
  ]));
  const wrap = el("div", { class:"fwwrap" });
  const bw = el("div", { class:"fwbw" });
  const board = el("div", { class:"fwboard" });
  S.board.forEach((sq, i) => board.append(cellEl(sq, i)));
  board.append(centerEl());
  bw.append(board);
  const m = modalEl(); if (m) bw.append(m);
  const side = el("div", { class:"fwside" }, [playersEl(), combosEl(), logEl()]);
  wrap.append(bw, side); P.append(wrap);
  if (S.phase === "over") P.append(overEl());
  // 動畫：骰子滾、棋子一格一格走、金幣飛、大字標語
  const a = S.anim;
  if (a && a.seq === S.seq && animSeq !== S.seq){ animSeq = S.seq; rollThenWalk(a); }
  else { placeTokens(); afterAnim(); }
  if (S.dl && S.dl.seq === S.seq && dlSeq !== S.seq){ dlSeq = S.seq; const d = S.dl.d; setTimeout(() => floats(d), animating ? 900 : 100); }
  if (S.fx && S.fx.seq === S.seq && fxSeq !== S.seq){ fxSeq = S.seq; const f = S.fx; setTimeout(() => showBanner(f), animating ? 1000 : 50); }
  if (S.q && !S.q.res && S.phase === "q") startTick();
  if (S.phase === "steal") startTick();
}
function afterAnim(){ hideModal(false); scheduleBot(); scheduleAuto(); focusMe(); }
const RC = i => { // 20 格排在 6×6 的外圈
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
    d.append(el("b", { class:"hz", text:sq.comp }), el("small", { class:"nm", text:sq.name || "" }));
    const city = S.cities.find(x => x.owner === sq.owner && (x.a === sq.comp || x.b === sq.comp));
    if (sq.owner >= 0){ d.classList.add("own"); d.style.setProperty("--oc", `var(${PCOL[sq.owner]})`);
      d.append(el("small", { class:"ow", text:(city ? city.c + "城 " : "") + "▲".repeat(sq.lv + 1) })); d.title = `${S.players[sq.owner].name} 的地，過路費 ${toll(S, sq)}`;
      if (city) d.classList.add("city"); }
    else { d.append(el("small", { text:"$" + sq.price })); d.title = `「${sq.comp}」可以組成：${sq.chars.join("、")}`; }
    if (S.phase === "pick" && mine(S.turn) && sq.owner >= 0 && sq.owner !== S.turn){ d.classList.add("grabme"); d.onclick = () => act("grab", i); }
  } else {
    const L = { start:["起點", "+" + PASS], chance:["機會", "抽卡"], origin:["字源館", "猜古字"], rest:["休息站", "+50"], review:["複習站", "答錯的字"] }[sq.t];
    d.append(el("b", { text:L[0] }), el("small", { text:L[1] }));
  }
  d.append(el("div", { class:"tok" }));
  return d;
}
function placeTokens(over){
  const P = panel(); P.querySelectorAll(".fwc .tok").forEach(t => t.innerHTML = "");
  S.players.forEach((p, i) => { if (p.out) return; const pos = over && over[i] != null ? over[i] : p.pos;
    const t = P.querySelector(`.fwc[data-i="${pos}"] .tok`); if (t) t.append(el("i", { class: (i === S.turn ? "me" : "") + (over && over[i] != null ? " hop" : ""), style:`background:var(${PCOL[i]})`, title:p.name, text:p.name.slice(0, 1) })); });
}
function dieSvg(n){
  const P = { 1:[[50,50]], 2:[[28,28],[72,72]], 3:[[28,28],[50,50],[72,72]], 4:[[28,28],[72,28],[28,72],[72,72]], 5:[[28,28],[72,28],[50,50],[28,72],[72,72]], 6:[[28,25],[72,25],[28,50],[72,50],[28,75],[72,75]] }[n] || [];
  return `<svg viewBox="0 0 100 100" class="die" aria-label="${n} 點"><rect x="4" y="4" width="92" height="92" rx="18"/>${P.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9"/>`).join("")}</svg>`;
}
function rollThenWalk(a){
  animating = true; hideModal(true);
  const dz = panel().querySelector(".fwcenter .dice");
  const walk = () => {
    let k = 0; const over = {}; over[a.i] = a.from; placeTokens(over); const dir = a.n < 0 ? -1 : 1, n = Math.abs(a.n);
    const step = () => { k++; over[a.i] = (a.from + dir * k + N) % N; placeTokens(over); A.sfx.pick();
      if (k < n) setTimeout(step, 260); else setTimeout(() => { animating = false; placeTokens(); const t = panel().querySelector(`.fwc[data-i="${S.players[a.i].pos}"]`); if (t) t.classList.add("land"); afterAnim(); }, 300); };
    setTimeout(step, 200);
  };
  if (a.d && dz){ let f = 0; dz.classList.add("rolling");
    const spin = () => { f++; dz.innerHTML = dieSvg(f < 9 ? 1 + rnd(6) : a.d); if (f < 9){ tone(220 + rnd(200), .03); setTimeout(spin, 70); } else { dz.classList.remove("rolling"); tone(660, .08); setTimeout(walk, 250); } };
    spin(); }
  else walk();
}
function tone(f, d){ try { const ctx = tone.c || (tone.c = new (window.AudioContext || window.webkitAudioContext)()); const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "triangle"; o.frequency.value = f; g.gain.value = .05; g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + d + .05); o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + d + .06); } catch(e){} }
const coinSnd = () => { tone(988, .06); setTimeout(() => tone(1319, .12), 70); };
function hideModal(h){ const x = panel().querySelector(".fwmodal"); if (x) x.style.visibility = h ? "hidden" : ""; }
function focusMe(){ const x = panel().querySelector(".fwmodal"); if (x && (S.mode === "B" || innerWidth < 700) && (mine(answerer()) || S.phase === "steal")){ const r = x.getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) x.scrollIntoView({ behavior:"smooth", block:"center" }); } }
function floats(d){
  Object.entries(d).forEach(([i, n]) => { if (!n) return; const row = panel().querySelector(`.fwp[data-i="${i}"]`); if (!row) return; const r = row.getBoundingClientRect();
    const f = el("div", { class:"fwfloat " + (n > 0 ? "up" : "down"), text:(n > 0 ? "+" : "−") + Math.abs(n) }); f.style.left = (r.right - 70) + "px"; f.style.top = (r.top + 4) + "px"; document.body.append(f); setTimeout(() => f.remove(), 1500);
    row.classList.add(n > 0 ? "gain" : "loss"); setTimeout(() => row.classList.remove("gain", "loss"), 900); });
  if (Object.values(d).some(n => n > 0)) coinSnd();
}
function showBanner(f){
  const bw = panel().querySelector(".fwbw"); if (!bw) return;
  const b = el("div", { class:"fwban k-" + f.k }, [f.c ? el("b", { class:"hz", text:f.c }) : null, el("span", { text:f.text })]); bw.append(b); setTimeout(() => b.remove(), 2200);
  if (["city", "buy", "grab", "up", "streak"].includes(f.k)){ const [x, y] = centerOf(b); burst(x, y, f.k === "city" ? 60 : 24); }
  if (f.k === "city") sfx.win(); else if (f.k === "bust"){ sfx.lose(); panel().querySelector(".fwboard").classList.add("shake"); } else if (f.k === "steal") { tone(880, .1); setTimeout(() => tone(1175, .15), 90); } else sfx.good();
}
function centerEl(){
  const p = cur(S), box = el("div", { class:"fwcenter" });
  if (S.phase === "over"){ box.append(el("div", { class:"big", text:"遊戲結束" })); return box; }
  box.append(el("div", { class:"who" }, [el("i", { style:`background:var(${PCOL[S.turn]})` }), `輪到 ${p.name}`]));
  const d = el("button", { class:"dice", type:"button", "aria-label":"擲骰子" }); d.innerHTML = dieSvg(S.dice || 6);
  if (S.phase === "roll" && mine(S.turn)){ d.classList.add("go"); d.onclick = () => act("roll"); box.append(d, el("div", { class:"hint", text:"點骰子" })); }
  else { d.disabled = true; box.append(d); if (S.phase === "roll") box.append(el("div", { class:"hint", text: p.bot ? "電腦在擲骰子……" : `等 ${p.name} 擲骰子` })); }
  return box;
}
function playersEl(){
  const box = el("div", { class:"fwplayers" });
  S.players.forEach((p, i) => {
    const lots = S.board.filter(b => b.owner === i).map(b => b.comp).join(" "), cities = S.cities.filter(x => x.owner === i).map(x => x.c).join("");
    box.append(el("div", { class:"fwp" + (i === S.turn && S.phase !== "over" ? " on" : "") + (p.out ? " out" : ""), "data-i":i }, [
      el("i", { style:`background:var(${PCOL[i]})`, text:p.name.slice(0, 1) }),
      el("div", { class:"nm" }, [el("b", { text:p.name + (p.bot ? `（${BOTLV[p.bot].name}）` : "") + (p.out ? "　破產" : "") }),
        el("small", { text:(lots ? "地 " + lots : "還沒有地") + (cities ? "　字城 " + cities : "") }),
        (p.streak >= 2 || p.free) ? el("small", { class:"tags" }, [p.streak >= 2 ? el("span", { class:"tag hot", text:`連對 ${p.streak}` }) : null, p.free ? el("span", { class:"tag", text:`免過路費 ×${p.free}` }) : null]) : null]),
      el("div", { class:"coin", text:p.coins })
    ]));
  });
  return box;
}
function combosEl(){
  if (!S.combos || !S.combos.length) return null;
  const box = el("div", { class:"fwcombo box" }, [el("h3", { text:"字城：買下兩塊地就能蓋" })]);
  const row = el("div", { class:"row" });
  S.combos.slice(0, 10).forEach(x => { const c = S.cities.find(y => y.c === x.c); const ch = el("span", { class:"cchip" + (c ? " built" : ""), title:`${x.a}＋${x.b}＝${x.c}（${x.w}）`, text:`${x.a}＋${x.b}＝${c ? x.c : "？"}` }); if (c) ch.style.setProperty("--oc", `var(${PCOL[c.owner]})`); row.append(ch); });
  box.append(row); return box;
}
function logEl(){ const lg = el("div", { class:"fwlog box" }); S.log.slice(-5).forEach(t => lg.append(el("div", { text:t }))); return lg; }

// 題目卡：蓋在棋盤上面
function modalEl(){
  const ph = S.phase, q = S.q;
  if (!["q", "steal", "pick", "end"].includes(ph)) return null;
  if (ph === "end" && !q && !S.card && !S.rest) return null;
  const box = el("div", { class:"fwmodal" }), inner = el("div", { class:"fwq" }); box.append(inner);
  if (S.card) inner.append(el("div", { class:"fwcard", text:"機會卡：" + S.card }));
  if (q){
    const P = S.players[answerer()];
    inner.append(el("div", { class:"qhead" }, [el("span", { class:"kind", text:KNAME[q.kind] || "" }), el("b", { text:q.tag || "" }), el("span", { class:"who", style:`--oc:var(${PCOL[answerer()]})`, text:P.name + (q.stolen ? " 搶答" : " 作答") })]));
    if (q.sub && !q.res) inner.append(el("div", { class:"muted sub", text:q.sub }));
    if (!q.res && ph === "q" && q.kind !== "write") inner.append(el("div", { class:"timer" }, [el("i")]));
    inner.append(qBody(q, ph === "q" && !q.res && mine(answerer())));
    if (q.res && ph !== "steal") inner.append(feedback(q));
  }
  if (ph === "steal"){
    const left = Math.max(0, Math.ceil((S.steal.until - Date.now()) / 1000));
    const st = el("div", { class:"stealbox" }, [el("b", { text:`${cur(S).name} 答錯了！誰要搶答？` }), el("span", { class:"muted cnt", text:` ${left} 秒` })]);
    const bt = el("div", { class:"row" });
    S.steal.can.forEach(i => { if (mine(i)) bt.append(el("button", { class:"btn primary big steal", type:"button", style:`--oc:var(${PCOL[i]})`, text:(S.mode === "B" ? "" : S.players[i].name + " ") + "搶答！", onclick: () => act("claim", i) })); });
    if (!bt.children.length) bt.append(el("span", { class:"muted", text:"等別人搶答……" }));
    st.append(bt); inner.append(st);
  }
  if (ph === "pick"){
    const opts = S.board.map((b, i) => [b, i]).filter(([b]) => b.t === "lot" && b.owner >= 0 && b.owner !== S.turn && !S.players[b.owner].out);
    const pk = el("div", { class:"stealbox" }, [el("b", { text: mine(S.turn) ? "選一塊要搶的地（也可以直接點棋盤上的地）：" : `${cur(S).name} 正在選要搶哪一塊地……` })]);
    if (mine(S.turn)){ const r = el("div", { class:"row" }); opts.forEach(([b, i]) => r.append(el("button", { class:"btn", type:"button", style:`--oc:var(${PCOL[b.owner]})`, text:`「${b.comp}」（${S.players[b.owner].name}，過路費 ${toll(S, b)}）`, onclick: () => act("grab", i) }))); pk.append(r); }
    inner.append(pk);
  }
  if (ph === "end" && S.rest && ORI[S.rest]){ const o = originBlock(S.rest); if (o){ inner.append(el("p", { class:"muted", text:"休息站：看一個部件的字源 +50" }), o); } }
  if (ph === "end"){
    const nx = el("button", { class:"btn small nextb", type:"button", text:"下一位 →" });
    if (isHost() || mine(S.turn)) nx.onclick = () => { clearTimeout(autoT); act("next"); }; else nx.disabled = true;
    inner.append(el("div", { class:"autonext" }, [el("i"), nx]));
  }
  return box;
}
function qBody(q, live){
  const box = el("div", { class:"qbody" }), prompt = el("div", { class:"prompt" });
  const spk = () => say(`${q.c}，${q.w}的${q.c}`);
  let ask = "";
  if (q.kind === "pick"){ prompt.append(el("div", { class:"w", text:blank(q.w, q.c) }), el("div", { class:"py", text:q.py })); ask = "□ 是哪一個字？"; }
  if (q.kind === "listen"){ prompt.append(el("button", { class:"btn big", type:"button", text:"🔊 再聽一次", onclick: spk })); ask = "聽讀音，選出對的字"; if (live && !q.said){ q.said = 1; setTimeout(spk, 250); } }
  if (q.kind === "tone"){ prompt.append(el("div", { class:"w", text:q.w }), el("div", { class:"muted", text:`「${q.c}」的聲調是？` })); }
  if (q.kind === "typo"){ ask = "這個詞有一個字寫錯了，點出來！"; }
  if (q.kind === "stack"){ prompt.append(el("div", { class:"w", text:blank(q.w, q.c) }), el("div", { class:"py", text:q.py })); ask = "選兩張透明卡，疊出 □"; }
  if (q.kind === "origin"){ const g = el("span", { class:"gw big" }); g.style.setProperty("--m", `url("data:image/webp;base64,${GLY[q.c + "-" + q.script]}")`); prompt.append(g, el("div", { class:"muted", text:{ oracle:"甲骨文", bronze:"金文", seal:"小篆" }[q.script] })); ask = "這個古字是今天的哪一個字？" + (q.hint && q.hint.length ? `（提示：在「${q.hint.join("、")}」裡面）` : ""); }
  if (q.kind === "write"){ prompt.append(el("div", { class:"w", text:blank(q.w, q.c) }), el("div", { class:"py", text:q.py })); ask = "照筆順把 □ 寫出來"; }
  if (prompt.children.length) box.append(prompt);
  if (ask) box.append(el("p", { class:"ask", text:ask }));
  const tried = q.tried || [];
  if (q.kind === "write"){
    if (!q.res){ const key = q.c + q.t0; if (live && wPad && wPad.__k === key){ box.append(wPad); box.append(el("button", { class:"btn small", type:"button", text:"我不會寫", onclick: () => answered(false) })); return box; }
      const pad = el("div", { class:"fwpad" }); box.append(pad);
      if (live){ wPad = pad; pad.__k = key; setTimeout(() => { try { pad.innerHTML = ""; const sz = Math.min(220, pad.clientWidth || 220);
          writer = HanziWriter.create(pad, q.c, { width:sz, height:sz, padding:10, showCharacter:false, showOutline:false, strokeColor:css("--navy"), drawingColor:css("--ink"), highlightColor:css("--green") });
          writer.quiz({ onMistake: () => sfx.bad(), onCorrectStroke: () => sfx.pick(), onComplete: r => setTimeout(() => answered(r.totalMistakes <= 3), 500) }); } catch(e){ answered(false); } }, 30);
        box.append(el("button", { class:"btn small", type:"button", text:"我不會寫", onclick: () => answered(false) })); }
      else pad.append(el("p", { class:"muted", text:`${S.players[answerer()].name} 正在寫……` })); }
    return box;
  }
  if (q.kind === "stack"){
    const bd = el("div", { class:"ovboard mini" });
    const chosen = q.res ? (Array.isArray(q.res.pick) ? q.res.pick : []) : (live ? sel : []);
    const okNow = q.res && q.res.ok;
    const layers = okNow ? [OV[q.c] && OV[q.c][1], OV[q.c] && OV[q.c][2]] : chosen.map(i => { const o = q.opts[i]; return o && OV[o.k] && OV[o.k][o.i]; });
    layers.forEach(img => { if (img){ const L = el("i", { class:"ovl" }); L.setAttribute("style", ovStyle(img)); bd.append(L); } });
    if (!layers.length) bd.append(el("div", { class:"empty", text:"疊到這裡" }));
    if (okNow) bd.classList.add("done");
    const g = el("div", { class:"ovpick" });
    q.opts.forEach((o, i) => {
      const img = OV[o.k] && OV[o.k][o.i];
      const b = el("button", { class:"ovopt" + (chosen.includes(i) ? " on" : ""), type:"button", "aria-label":o.s });
      const m = el("span", { class:"ovm" }); if (img){ const ii = el("i"); ii.setAttribute("style", ovStyle(img)); m.append(ii); } else m.append(el("b", { text:o.s }));
      b.append(m);
      if (q.res && S.phase === "steal"){ b.disabled = true; if (chosen.includes(i)) b.classList.add("wrong"); }
      else if (q.res){ b.disabled = true; if (q.ans.includes(i)) b.classList.add("right"); else if (chosen.includes(i)) b.classList.add("wrong"); }
      else if (live) b.onclick = () => { const k = sel.indexOf(i); if (k >= 0) sel.splice(k, 1); else { sel.push(i); A.sfx.pick(); } if (sel.length > 2) sel.shift(); if (sel.length === 2){ const v = sel.slice(); sel = []; answered(v); } else render(); };
      else b.disabled = true;
      g.append(b);
    });
    box.append(el("div", { class:"stackwrap" }, [bd, g]));
    return box;
  }
  const g = el("div", { class:"opts" + (q.kind === "tone" ? " pyo" : "") + (q.kind === "typo" ? " typo" : "") });
  q.opts.forEach((o, i) => {
    const b = el("button", { class:"opt", type:"button", text:o });
    if (q.res && S.phase !== "steal"){ b.disabled = true; if (i === q.ans) b.classList.add("right"); else if (i === q.res.pick) b.classList.add("wrong"); }
    else if (tried.includes(i) || (S.phase === "steal" && q.res && q.res.pick === i)){ b.disabled = true; b.classList.add("wrong"); }
    else if (live) b.onclick = () => answered(i); else b.disabled = true;
    g.append(b);
  });
  box.append(g);
  return box;
}
function feedback(q){
  const ok = q.res.ok, e = CH[q.c] || {};
  const tm = q.res.pick === "timeout";
  const fb = el("div", { class:"fwfb " + (ok ? "ok" : "no") }, [el("b", { text: ok ? (q.res.speed > .6 ? "秒答！" : "答對了！") : tm ? "時間到！" : "答錯了" }), `　${q.c}　${q.py || ""}　${q.kind === "origin" ? (nameOf(q.c) !== q.py ? nameOf(q.c) : "") : q.w}`]);
  if (q.kind === "typo" && !ok) fb.append(el("div", { class:"muted", text:`「${q.d}」應該是「${q.c}」` }));
  if (e.tip && q.kind !== "origin") fb.append(el("div", { class:"muted", text:"記憶提示：" + e.tip }));
  fb.append(" ", el("button", { class:"btn small", type:"button", text:"🔊", onclick: () => say(`${q.c}，${q.w}的${q.c}`) }));
  return fb;
}
function answered(v){
  if (!S || !S.q || S.q.res || S.phase !== "q") return;
  if (isRight(S.q, v)){ sfx.good(); const r = panel().querySelector(".fwmodal"); if (r){ const [x, y] = centerOf(r); burst(x, y, 20); } } else sfx.bad();
  writer = null; act("answer", v);
}
// 倒數：計時條、時間到自動算錯、搶答時間到自動結束
function startTick(){
  const tick = () => {
    if (!S) return;
    if (S.phase === "q" && S.q && !S.q.res && S.q.kind !== "write"){
      const left = S.q.lim - (Date.now() - S.q.t0) / 1000, bar = panel().querySelector(".fwmodal .timer i");
      if (bar){ bar.style.width = Math.max(0, left / S.q.lim * 100) + "%"; bar.classList.toggle("hurry", left < 3.5); }
      if (left < 3.2 && left > 0 && Math.floor(left * 4) % 4 === 0) tone(440, .03);
      if (left <= 0 && !animating && (mine(answerer()) || (isHost() && !S.players[answerer()].bot && left < -3))){ act("answer", "timeout"); return; }
    }
    if (S.phase === "steal" && S.steal){
      const left = (S.steal.until - Date.now()) / 1000, c = panel().querySelector(".stealbox .cnt"); if (c) c.textContent = ` ${Math.max(0, Math.ceil(left))} 秒`;
      if (left <= 0 && isHost()){ act("closeSteal"); return; }
    }
    tickT = setTimeout(tick, 250);
  };
  tickT = setTimeout(tick, 250);
}
// 結果看 2 秒後自動換下一位（主持人或本人的裝置負責）
function scheduleAuto(){
  clearTimeout(autoT);
  if (!S || S.phase !== "end" || animating) return;
  if (!(isHost() || mine(S.turn))) return;
  const wait = S.rest ? 4500 : S.q && S.q.kind === "origin" ? 3500 : S.q ? 2600 : 2000;
  const bar = panel().querySelector(".autonext i"); if (bar){ bar.style.transitionDuration = wait + "ms"; requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = "0%"; })); }
  const seq = S.seq; autoT = setTimeout(() => { if (S && S.seq === seq && S.phase === "end") act("next"); }, wait + (isHost() && !mine(S.turn) && S.mode === "B" ? 1500 : 0));
}
function overEl(){
  const box = el("div", { class:"fwover box" });
  const rank = S.players.map((p, i) => ({ p, i, w:worth(S, i) })).sort((a, b) => b.w - a.w);
  box.append(el("h3", { text:`第一名：${rank[0].p.name}！` }));
  rank.forEach((r, k) => {
    const cities = S.cities.filter(x => x.owner === r.i).map(x => x.c).join("、");
    box.append(el("div", { class:"fwrank" }, [el("b", { text:`${k + 1}. ${r.p.name}` }), el("span", { text:`總資產 ${r.w}（金幣 ${r.p.coins}）・答對 ${r.p.ok}／${r.p.n}${cities ? "・字城 " + cities : ""}` })]));
    if (r.p.wrong.length && !r.p.bot){ const w = el("div", { class:"fwwrong" }, [el("small", { class:"muted", text:"要再複習的字：" })]);
      r.p.wrong.forEach(c => { const it = itemOf(S, c); w.append(el("span", { class:"chip", title:it[1], text:`${c}（${it[0]}）` })); }); box.append(w); }
  });
  // 自己的裝置：答錯的字加到「今天的複習」、答對的題目換成經驗值
  if (!saved){ saved = true; const mineP = S.players.filter(p => !p.bot && (S.mode === "C" || (S.mode === "B" && p.uid === myUid())));
    if (mineP.length === 1 && A.store.me){ const p = mineP[0]; let n = 0; p.wrong.forEach(c => { const it = itemOf(S, c); if (A.addReview(c, it[0], it[1])) n++; }); if (p.ok) A.addXp(p.ok * 5); A.save(); if (n) toast(`答錯的 ${n} 個字已經加到「今天的複習」`); }
    if (rank[0].p && !rank[0].p.bot){ sfx.win(); setTimeout(() => { const [x, y] = centerOf(box); burst(x, y, 70); }, 200); } }
  return box;
}

// ---------- 電腦玩家 ----------
function scheduleBot(){
  clearTimeout(botT); if (!S || animating || S.phase === "over" || S.phase === "lobby" || !isHost()) return;
  const ai = S.phase === "steal" ? -1 : S.phase === "q" ? answerer() : S.turn, p = S.players[ai];
  const lvOf = q => BOTLV[q.bot] || BOTLV.normal;
  if (S.phase === "steal"){
    const bots = S.steal.can.filter(i => S.players[i].bot); if (!bots.length) return;
    const b = pick(bots), lv = lvOf(S.players[b]); if (Math.random() > lv.p * .8) return;
    botT = setTimeout(() => { if (S && S.phase === "steal") act("claim", b); }, 1500 + rnd(2500)); return;
  }
  if (!p || !p.bot) return;
  const lv = lvOf(p), seq = S.seq;
  const go = (fn, ms) => { botT = setTimeout(() => { if (S && S.seq === seq && !animating) fn(); }, ms); };
  if (S.phase === "roll") go(() => act("roll"), 900);
  else if (S.phase === "q" && S.q && !S.q.res){
    const q = S.q, ok = Math.random() < lv.p;
    let v = ok;
    if (q.kind === "stack") v = ok ? q.ans.slice() : shuffle(q.opts.map((o, i) => i)).slice(0, 2);
    else if (q.opts) v = ok ? q.ans : pick(q.opts.map((o, i) => i).filter(i => i !== q.ans && !(q.tried || []).includes(i)));
    go(() => act("answer", v), 1600 + rnd(q.lim * 350));
  }
  else if (S.phase === "pick"){ const best = S.board.map((b, i) => [b, i]).filter(([b]) => b.t === "lot" && b.owner >= 0 && b.owner !== S.turn).sort((x, y) => toll(S, y[0]) - toll(S, x[0]))[0]; if (best) go(() => act("grab", best[1]), 1500); }
}

// 透明卡圖：先下載一部分，其他慢慢在背景下載（題目只出已經下載好的字）
let preKey = "", preT = null;
function preload(){
  if (!S || !S.items) return; const key = Object.keys(S.items).join(""); if (preKey === key) return; preKey = key; clearTimeout(preT);
  const rest = shuffle(Object.keys(S.items).filter(c => partsOf(c).length === 2));
  loadOv(rest.splice(0, 10));
  const more = () => { if (preKey !== key || !rest.length) return; loadOv(rest.splice(0, 3)).then(() => { preT = setTimeout(more, 5000); }); };
  preT = setTimeout(more, 4000);
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
  P.append(el("p", { class:"muted fwrule", text:"擲骰子走棋盤，地都是「部件」。答對就買地；同一個人買到能合成一個字的兩塊地（例如 言＋射＝謝），就蓋成「字城」，過路費翻倍。每題都有時間限制，答越快賺越多；答錯了別人可以搶答。機會卡有搶地、免過路費、交換位置、金幣雨……幾輪後總資產最多的人贏，答錯的字會列出來複習。" }));
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
  S = s; preload(); render(); window.scrollTo({ top:0 });
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
      s.players.push(newPlayer({ name, uid })); s.seq++; return s; };
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
window.HZFW = { get state(){ return S; }, render, act, ACT, newGame, makeBoard, itemsFrom, mkQ, retone, isRight };
}
if (window.HZAPI) boot(); else document.addEventListener("hzapi", boot);
})();
