/* 漢字大富翁 v7（hanzi-fuweng.js）── 照真正的大富翁玩
   Quinn（2026-10-07）：地用課本的生詞；買地的時候才答一題；機會卡、命運卡用中文寫，
   學生要看懂才知道要做什麼（練閱讀）；過路費、蓋房子、破產照原本的規則，不用答題。
   三種玩法：A 一台電腦輪流玩、B 每個人用自己的裝置連線（房間代碼，hz_rooms）、C 跟電腦對戰。 */
(() => {
"use strict";
function boot(){
const A = window.HZAPI; if (!A || window.__FW) return; window.__FW = true;
const { CH, LEVELS, FAM, C, NOSTROKE, shuffle, pyOf, sfx, burst, toast, centerOf, distractors } = A;
const $ = s => document.querySelector(s);
const el = (tag, attrs = {}, kids = []) => { const fn = {}, at = {}; for (const k in attrs){ if (typeof attrs[k] === "function") fn[k] = attrs[k]; else at[k] = attrs[k]; } const n = A.el(tag, at, kids); Object.assign(n, fn); return n; };
const HAN = /^[㐀-鿿]+$/;

// ---------- 棋盤 ----------
// 24 格排在 7×7 的外圈。四個角：起點、塞車、公園、生日派對；機會 3、15，命運 9、21；其他 16 格是生詞地（每一邊 4 塊同一組）
const N = 24, START = 1500, PASS = 200, PARTY = 50;
const LAYOUT = ["start","lot","lot","chance","lot","lot","jam","lot","lot","fate","lot","lot","park","lot","lot","chance","lot","lot","party","lot","lot","fate","lot","lot"];
const PRICE = [120, 160, 200, 240];              // 每一邊的地價
const RENT = [0.2, 0.6, 1.2, 2];                 // 過路費＝地價 ×（空地／1 棟／2 棟／3 棟）
const MAXH = 3;
const PCOL = ["--pc0", "--pc1", "--pc2", "--pc3"];
const BOTLV = { easy:{ name:"簡單", p:.55 }, normal:{ name:"普通", p:.75 }, hard:{ name:"厲害", p:.92 } };
const LIM = 25;

// ---------- 機會卡、命運卡（中文寫，學生要看懂才知道要做什麼）----------
// t：money 加減錢、move 往前、back 往後、goto 到某一格、skip 停一次、each 跟每個人收（n>0）或給每個人（n<0）、free 免過路費卡、repair 每棟房子付錢
const CHANCE = [
  { z:"今天是你的生日，每個人給你五十塊。", p:"Jīntiān shì nǐ de shēngrì, měi ge rén gěi nǐ wǔshí kuài.", t:"each", n:50 },
  { z:"你考試考得很好，媽媽給你一百塊。", p:"Nǐ kǎoshì kǎo de hěn hǎo, māma gěi nǐ yìbǎi kuài.", t:"money", n:100 },
  { z:"你去夜市吃臭豆腐，付六十塊。", p:"Nǐ qù yèshì chī chòudòufu, fù liùshí kuài.", t:"money", n:-60 },
  { z:"你的手機壞了，付一百五十塊修手機。", p:"Nǐ de shǒujī huài le, fù yìbǎi wǔshí kuài xiū shǒujī.", t:"money", n:-150 },
  { z:"你坐捷運去朋友家，往前走三格。", p:"Nǐ zuò jiéyùn qù péngyou jiā, wǎng qián zǒu sān gé.", t:"move", n:3 },
  { z:"下大雨了，你回家拿傘，往後走兩格。", p:"Xià dà yǔ le, nǐ huí jiā ná sǎn, wǎng hòu zǒu liǎng gé.", t:"back", n:2 },
  { z:"你坐計程車回到起點，拿兩百塊。", p:"Nǐ zuò jìchéngchē huídào qǐdiǎn, ná liǎngbǎi kuài.", t:"goto", to:0 },
  { z:"你忘了帶錢包，下一次不能擲骰子。", p:"Nǐ wàng le dài qiánbāo, xià yí cì bù néng zhí tóuzi.", t:"skip" },
  { z:"你請大家喝珍珠奶茶，給每個人三十塊。", p:"Nǐ qǐng dàjiā hē zhēnzhū nǎichá, gěi měi ge rén sānshí kuài.", t:"each", n:-30 },
  { z:"你在便利商店抽到大獎，拿兩百塊。", p:"Nǐ zài biànlì shāngdiàn chōu dào dàjiǎng, ná liǎngbǎi kuài.", t:"money", n:200 },
  { z:"老闆送你一張「免過路費卡」，下一次不用付過路費。", p:"Lǎobǎn sòng nǐ yì zhāng “miǎn guòlùfèi kǎ”, xià yí cì bú yòng fù guòlùfèi.", t:"free" },
  { z:"你的房子要打掃，每一棟房子付二十塊。", p:"Nǐ de fángzi yào dǎsǎo, měi yí dòng fángzi fù èrshí kuài.", t:"repair", n:20 }
];
const FATE = [
  { z:"你去銀行領錢，拿一百塊。", p:"Nǐ qù yínháng lǐng qián, ná yìbǎi kuài.", t:"money", n:100 },
  { z:"天氣很好，你去公園散步。走到公園那一格。", p:"Tiānqì hěn hǎo, nǐ qù gōngyuán sànbù. Zǒu dào gōngyuán nà yì gé.", t:"goto", to:12 },
  { z:"路上塞車了！走到塞車那一格，下一次不能擲骰子。", p:"Lù shang sāichē le! Zǒu dào sāichē nà yì gé, xià yí cì bù néng zhí tóuzi.", t:"goto", to:6, skip:true },
  { z:"你幫老師搬書，老師給你五十塊。", p:"Nǐ bāng lǎoshī bān shū, lǎoshī gěi nǐ wǔshí kuài.", t:"money", n:50 },
  { z:"你去百貨公司買新衣服，付一百二十塊。", p:"Nǐ qù bǎihuò gōngsī mǎi xīn yīfu, fù yìbǎi èrshí kuài.", t:"money", n:-120 },
  { z:"你中文學得很好，拿到獎學金三百塊。", p:"Nǐ Zhōngwén xué de hěn hǎo, ná dào jiǎngxuéjīn sānbǎi kuài.", t:"money", n:300 },
  { z:"你騎機車太快了，付罰款一百塊。", p:"Nǐ qí jīchē tài kuài le, fù fákuǎn yìbǎi kuài.", t:"money", n:-100 },
  { z:"你跟朋友去看電影，往前走五格。", p:"Nǐ gēn péngyou qù kàn diànyǐng, wǎng qián zǒu wǔ gé.", t:"move", n:5 },
  { z:"你走錯路了，往後走三格。", p:"Nǐ zǒu cuò lù le, wǎng hòu zǒu sān gé.", t:"back", n:3 },
  { z:"你感冒了，去看醫生，付八十塊。", p:"Nǐ gǎnmào le, qù kàn yīshēng, fù bāshí kuài.", t:"money", n:-80 },
  { z:"朋友來臺灣玩，你帶他去吃牛肉麵，付七十塊。", p:"Péngyou lái Táiwān wán, nǐ dài tā qù chī niúròumiàn, fù qīshí kuài.", t:"money", n:-70 },
  { z:"你在路上撿到錢包，還給主人，主人給你八十塊。", p:"Nǐ zài lù shang jiǎn dào qiánbāo, huán gěi zhǔrén, zhǔrén gěi nǐ bāshí kuài.", t:"money", n:80 }
];
const cardOf = (s, ref) => (ref[0] === "c" ? CHANCE : FATE)[ref[1]];

// ---------- 小工具 ----------
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const clone = o => JSON.parse(JSON.stringify(o));
const round10 = n => Math.round(n / 10) * 10;
const blank = (w, i) => [...w].map((x, k) => k === i ? "□" : x).join("");

// ---------- 題目範圍：生詞（2～4 個字）----------
function wordsFrom(src){
  const out = {}, real = new Set(), put = (w, py) => { if (!w || (out[w] && (real.has(w) || !py)) || !HAN.test(w) || w.length < 2 || w.length > 4 || [...w].some(c => NOSTROKE.has(c))) return; out[w] = py || [...w].map(c => pyOf(c)).join(""); if (py) real.add(w); };
  if (src.k === "course") src.ids.forEach(id => { const L = C.byId[id]; if (L) L.chars.forEach(x => { if (!x.sent && x.w) put(x.w, x.wpy); }); });
  else if (src.k === "fam") FAM.forEach(f => { if (src.v === "*" || f.name === src.v) f.chars.forEach(x => { const e = CH[x.c]; if (e) put(e.w); }); });
  else if (src.k === "lv"){ const L = LEVELS[src.v]; if (L) L.stages.forEach(st => st.chars.forEach(c => { const e = CH[c]; if (e) put(e.w); })); }
  return out;
}
// 每個字的拼音（詞的拼音切成一個字一個）
function sylOf(w, py){ const sp = A.pySplit ? (A.pySplit(w, py, true) || A.pySplit(w, py, false)) : null; return sp || [...w].map(c => pyOf(c)); }
function makeBoard(words){
  const ws = shuffle(Object.keys(words)).slice(0, 16); let k = 0;
  return LAYOUT.map((t, i) => { if (t !== "lot") return { t }; const g = Math.floor(i / 6), w = ws[k++ % ws.length]; return { t, w, py:sylOf(w, words[w]).join(""), g, price:PRICE[g], owner:-1, lv:0 }; });
}
function newGame(cfg){
  const words = wordsFrom(cfg.src); (cfg.excl || []).forEach(w => delete words[w]);
  return { v:7, tmul:cfg.tmul == null ? 1.5 : cfg.tmul, mode:cfg.mode, rounds:cfg.rounds, round:1, turn:0, seq:1, srcName:cfg.srcName || "", pyCard:!!cfg.pyCard,
    players:cfg.players.map(newPlayer), words, board:makeBoard(words), winner:-1,
    phase:cfg.mode === "B" ? "lobby" : "roll", dice:0, anim:null, q:null, card:null, note:null, fx:null, dl:null,
    log:["遊戲開始！每人 " + START + " 元。"], host:cfg.host || "" };
}
const startGame = s => { s.phase = "roll"; return s; };
const newPlayer = (p, i) => ({ name:p.name, uid:p.uid || "", bot:p.bot || "", av:p.av || "", seat:i || 0, coins:START, pos:0, out:false, skip:0, free:0, ok:0, n:0, got:[], wrong:[] });

// ---------- 規則 ----------
const cur = s => s.players[s.turn];
const log = (s, t) => { s.log.push(t); if (s.log.length > 8) s.log.shift(); };
const money = (s, i, n) => { if (!n) return; s.players[i].coins += n; s.dl = s.dl || { seq:0, d:{} }; s.dl.d[i] = (s.dl.d[i] || 0) + n; };
const banner = (s, k, text, c) => { s.fx = { seq:s.seq + 1, k, text, c:c || "" }; };
const sideOwned = (s, sq) => sq.owner >= 0 && s.board.filter(b => b.t === "lot" && b.g === sq.g).every(b => b.owner === sq.owner);
const rent = (s, sq) => round10(sq.price * RENT[sq.lv] * (sq.lv === 0 && sideOwned(s, sq) ? 2 : 1));
const houseCost = sq => round10(sq.price / 2);
const worth = (s, i) => s.players[i].coins + s.board.filter(b => b.owner === i).reduce((a, b) => a + b.price + b.lv * houseCost(b), 0);
const note = (s, text, k) => { s.note = { text, k:k || "" }; };

// 買地要答的題：一半「□ 是哪個字」，一半「看拼音選詞」
function mkQ(s, w){
  const py = (s.board.find(b => b.w === w) || {}).py || sylOf(w, s.words[w]).join(""), syl = sylOf(w, s.words[w]);
  const others = Object.keys(s.words).filter(x => x !== w);
  const tm = s.tmul == null ? 1.5 : s.tmul, lim = tm ? Math.round(LIM * tm) : 0;
  if (Math.random() < .5 && others.length >= 3){
    // 看拼音選詞：錯的選項優先挑字數一樣、有同一個字的詞
    const sc = x => (x.length === w.length ? 2 : 0) + ([...x].some(c => w.includes(c)) ? 1 : 0) + Math.random();
    const opts = shuffle([w].concat(others.sort((a, b) => sc(b) - sc(a)).slice(0, 3)));
    return { kind:"pyword", w, py, opts, ans:opts.indexOf(w), t0:Date.now(), lim, res:null };
  }
  const cs = [...w]; const allow = new Set(Object.keys(s.words).join(""));
  let best = null;
  cs.forEach((c, i) => { const ds = distractors({ c, py:syl[i], w }, 3, allow).filter(x => x !== c && !cs.includes(x)); if (!best || ds.length > best.ds.length || (ds.length === best.ds.length && Math.random() < .5)) best = { i, c, ds }; });
  const opts = shuffle([best.c].concat(best.ds.slice(0, 3)));
  return { kind:"blank", w, py, i:best.i, c:best.c, opts, ans:opts.indexOf(best.c), t0:Date.now(), lim, res:null };
}
const isRight = (q, v) => v === q.ans;

function land(s){
  const p = cur(s), sq = s.board[p.pos]; s.q = null; s.card = null; s.note = null;
  if (sq.t === "lot"){
    if (sq.owner < 0){
      if (p.coins < sq.price){ note(s, `${p.name} 的錢不夠買「${sq.w}」。`); s.phase = "end"; return; }
      s.phase = "buy"; return;
    }
    if (sq.owner === s.turn){
      if (sq.lv < MAXH && p.coins >= houseCost(sq)){ s.phase = "build"; return; }
      note(s, `回到自己的地「${sq.w}」。`); s.phase = "end"; return;
    }
    const o = s.players[sq.owner];
    if (o.out){ s.phase = "end"; return; }
    if (p.free > 0){ p.free--; note(s, `${p.name} 用了免過路費卡，不用付錢！`, "good"); log(s, `${p.name} 用免過路費卡`); s.phase = "end"; return; }
    const f = rent(s, sq); money(s, s.turn, -f); money(s, sq.owner, f);
    note(s, `「${sq.w}」是 ${o.name} 的地，付過路費 ${f} 元。`, "pay"); log(s, `${p.name} 付給 ${o.name} 過路費 ${f}`);
    bankrupt(s); if (s.phase !== "over") s.phase = "end"; return;
  }
  if (sq.t === "chance" || sq.t === "fate"){
    const deck = sq.t === "chance" ? CHANCE : FATE; s.card = [sq.t === "chance" ? "c" : "f", rnd(deck.length)];
    s.phase = "card"; return;
  }
  if (sq.t === "jam"){ p.skip = 1; note(s, "塞車了！下一次不能擲骰子。", "bad"); log(s, `${p.name} 遇到塞車`); s.phase = "end"; return; }
  if (sq.t === "park"){ note(s, "在公園休息一下。"); s.phase = "end"; return; }
  if (sq.t === "party"){ s.players.forEach((o, i) => { if (i !== s.turn && !o.out){ money(s, i, -PARTY); money(s, s.turn, PARTY); } }); note(s, `生日派對！每個人給 ${p.name} ${PARTY} 元。`, "good"); bankrupt(s); if (s.phase !== "over") s.phase = "end"; return; }
  if (sq.t === "start"){ note(s, "停在起點。"); s.phase = "end"; return; }
  s.phase = "end";
}
function walk(s, n){ const p = cur(s), from = p.pos; p.pos = (p.pos + n + N) % N; if (n > 0 && p.pos < from){ money(s, s.turn, PASS); log(s, `${p.name} 經過起點 +${PASS}`); } s.anim = { i:s.turn, from, n, seq:s.seq + 1, d:0 }; }
function bankrupt(s){
  s.players.forEach((p, i) => { if (!p.out && p.coins < 0){ p.out = true; s.board.forEach(b => { if (b.owner === i){ b.owner = -1; b.lv = 0; } }); log(s, `${p.name} 破產了。`); banner(s, "bust", `${p.name} 破產了！`); } });
  if (s.players.filter(p => !p.out).length <= 1) s.phase = "over";
}
const ACT = {
  roll(s){
    if (s.phase !== "roll") return false;
    const p = cur(s), d = 1 + rnd(6), from = p.pos; s.dice = d;
    p.pos = (p.pos + d) % N; if (p.pos < from){ money(s, s.turn, PASS); log(s, `${p.name} 經過起點 +${PASS}`); }
    s.anim = { i:s.turn, from, n:d, seq:s.seq + 1, d }; land(s); return true;
  },
  // 要買嗎？買 → 答一題
  buy(s, yes){
    if (s.phase !== "buy") return false; const sq = s.board[cur(s).pos];
    if (!yes){ note(s, `${cur(s).name} 沒有買「${sq.w}」。`); s.phase = "end"; return true; }
    s.q = mkQ(s, sq.w); s.phase = "q"; return true;
  },
  answer(s, v){
    if (s.phase !== "q" || !s.q || s.q.res) return false;
    const q = s.q, P = cur(s), sq = s.board[P.pos], ok = isRight(q, v);
    q.res = { ok, pick:v }; P.n++;
    if (ok){ P.ok++; if (!P.got.includes(q.w)) P.got.push(q.w); P.wrong = P.wrong.filter(x => x !== q.w);
      money(s, s.turn, -sq.price); sq.owner = s.turn; log(s, `${P.name} 買下「${sq.w}」`); banner(s, "buy", `${P.name} 買下「${sq.w}」`, sq.w);
      if (sideOwned(s, sq)) banner(s, "side", `${P.name} 買下一整排！過路費加倍`, sq.w); }
    else { if (!P.wrong.includes(q.w)) P.wrong.push(q.w); log(s, `${P.name} 答錯，沒買到「${sq.w}」`); }
    s.phase = "end"; return true;
  },
  build(s, yes){
    if (s.phase !== "build") return false; const P = cur(s), sq = s.board[P.pos];
    if (yes && sq.lv < MAXH && P.coins >= houseCost(sq)){ money(s, s.turn, -houseCost(sq)); sq.lv++; note(s, `在「${sq.w}」蓋了第 ${sq.lv} 棟房子，過路費變成 ${rent(s, sq)} 元。`, "good"); banner(s, "up", `「${sq.w}」蓋房子！`, sq.w); log(s, `${P.name} 在「${sq.w}」蓋房子`); }
    else note(s, "這次不蓋房子。");
    s.phase = "end"; return true;
  },
  // 看懂機會卡／命運卡以後，按「照做」
  card(s){
    if (s.phase !== "card" || !s.card) return false;
    const P = cur(s), c = cardOf(s, s.card), ref = s.card; let res = "";
    if (c.t === "money"){ money(s, s.turn, c.n); res = (c.n > 0 ? "+" : "−") + Math.abs(c.n) + " 元"; }
    if (c.t === "each"){ s.players.forEach((o, i) => { if (i !== s.turn && !o.out){ money(s, i, -c.n); money(s, s.turn, c.n); } }); res = c.n > 0 ? `每個人給你 ${c.n} 元` : `你給每個人 ${-c.n} 元`; }
    if (c.t === "free"){ P.free++; res = "拿到免過路費卡"; }
    if (c.t === "skip"){ P.skip = 1; res = "下一次不能擲骰子"; }
    if (c.t === "repair"){ const h = s.board.filter(b => b.owner === s.turn).reduce((a, b) => a + b.lv, 0); money(s, s.turn, -h * c.n); res = h ? `${h} 棟房子，付 ${h * c.n} 元` : "你還沒有房子，不用付"; }
    log(s, `${P.name}：${c.z}`);
    if (c.t === "move" || c.t === "back" || c.t === "goto"){
      let n = c.t === "move" ? c.n : c.t === "back" ? -c.n : (c.to - P.pos + N) % N;
      if (c.t === "goto" && c.to === 0){ n = (N - P.pos) % N || N; }
      if (c.skip) P.skip = 1;
      walk(s, n); land(s); s.prev = { ref, res: c.t === "goto" && c.to === 0 ? "回到起點 +" + PASS : "" }; bankrupt(s); return true;
    }
    s.card = null; s.prev = { ref, res }; bankrupt(s); if (s.phase !== "over") s.phase = "end"; return true;
  },
  next(s){
    if (s.phase === "over" || s.phase === "lobby") return false;
    const n = s.players.length; let t = s.turn;
    for (let k = 0; k < 2 * n; k++){
      t = (t + 1) % n; if (t === 0) s.round++;
      const p = s.players[t]; if (p.out) continue;
      if (p.skip > 0){ p.skip--; log(s, `${p.name} 這一次停一次`); continue; }
      break;
    }
    s.turn = t; s.q = null; s.card = null; s.note = null; s.prev = null; s.anim = null; s.dice = 0;
    s.phase = s.round > s.rounds ? "over" : "roll";
    return true;
  }
};

// ---------- 棋子：彩色圓形＋名字的第一個字（顏色每個人自己選）----------
const COLS = [["blue", "#1E4C86", "藍"], ["sky", "#2F86D1", "天藍"], ["teal", "#13918F", "青綠"], ["green", "#3A9A4A", "綠"], ["purple", "#7A52C7", "紫"], ["rose", "#D2457A", "玫瑰"], ["red", "#C93C3C", "紅"], ["ink", "#33415C", "墨灰"]];
const COLV = Object.fromEntries(COLS.map(([k, v]) => [k, v]));
const DEFC = ["blue", "rose", "green", "purple"];
function pcolors(ps){ const used = new Set(); return ps.map((p, i) => { let k = p.bot ? "ink" : (COLV[p.av] ? p.av : DEFC[i % 4]); if (used.has(k)) k = COLS.map(c => c[0]).find(c => !used.has(c)) || k; used.add(k); return COLV[k]; }); }
function initial(p){
  const n = String(p.name || "").trim();
  if (p.bot) return "電";
  const m = n.match(/^玩家\s*(\d+)$/); if (m) return m[1];
  const c = [...n][0] || "?"; return /[a-z]/i.test(c) ? c.toUpperCase() : c;
}
function avEl(p, i, cls){ const t = initial(p); return el("i", { class:"av " + (cls || "") + (/^[\x20-\x7e]+$/.test(t) ? " lat" : ""), style:`background:var(${PCOL[i]})`, title:p.name, text:t }); }

// ---------- 畫面 ----------
let S = null, ROOM = null, unsub = null, botT = null, autoT = null, tickT = null, animSeq = 0, fxSeq = 0, dlSeq = 0, animating = false, saved = false, showPy = false;
const myUid = () => (A.store && A.store.uid) || "";
const isHost = () => !S || S.mode !== "B" || S.host === myUid();
const mine = i => { if (!S || i == null || !S.players[i]) return false; const p = S.players[i]; if (p.bot) return false; return S.mode !== "B" || p.uid === myUid(); };
const myIdx = () => S && S.mode === "B" ? S.players.findIndex(p => p.uid === myUid()) : -1;
function act(name, v){
  if (!S || animating) return;
  if (S.mode === "B" && ROOM && firebase.firestore().runTransaction){
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
// 大富翁不翻譯成越南文（hanzi-vi.js 看到 data-novi 就跳過；瀏覽器翻譯看 translate="no"）
function panel(){ const P = $("#p-fw"); if (P && !P.hasAttribute("data-novi")){ P.setAttribute("data-novi", ""); P.setAttribute("translate", "no"); P.classList.add("notranslate"); const t = document.querySelector('nav.tabs button[data-tab="fw"]'); if (t){ t.setAttribute("data-novi", ""); t.setAttribute("translate", "no"); } } return P; }
function render(){
  const P = panel(); if (!P) return;
  clearTimeout(tickT);
  if (!S){ exitGameLook(); renderSetup(); return; }
  if (S.phase === "lobby"){ exitGameLook(); renderLobby(); return; }
  P.innerHTML = ""; document.body.classList.add("fw-ingame");
  pcolors(S.players).forEach((c, i) => P.style.setProperty("--pc" + i, c));
  P.append(hudEl());
  const wrap = el("div", { class:"fwwrap fw7" }), bw = el("div", { class:"fwbw" }), board = el("div", { class:"fwboard b7" });
  S.board.forEach((sq, i) => board.append(cellEl(sq, i)));
  board.append(centerEl()); bw.append(board); wrap.append(bw); P.append(wrap);
  const m = modalEl(); if (m) P.append(el("div", { class:"fwov" }, [m]));
  if (S.phase === "over"){ const ov = el("div", { class:"fwov over" }), ob = overEl();
    ob.append(el("div", { class:"overbtns" }, [el("button", { class:"btn primary big", type:"button", text:"再玩一次", onclick: leave }), el("button", { class:"btn big", type:"button", text:"看一下棋盤", onclick: () => ov.remove() })]));
    ov.append(ob); P.append(ov); }
  const a = S.anim;
  if (a && a.seq === S.seq && animSeq !== S.seq){ animSeq = S.seq; rollThenWalk(a); }
  else { placeTokens(); afterAnim(); }
  if (S.dl && S.dl.seq === S.seq && dlSeq !== S.seq){ dlSeq = S.seq; const d = S.dl.d; setTimeout(() => floats(d), animating ? 900 : 100); }
  if (S.fx && S.fx.seq === S.seq && fxSeq !== S.seq){ fxSeq = S.seq; const f = S.fx; setTimeout(() => showBanner(f), animating ? 1000 : 50); }
  if (S.q && !S.q.res && S.phase === "q") startTick();
}
function hudEl(){
  const ps = el("div", { class:"hps" });
  S.players.forEach((p, i) => {
    const tags = [p.free ? el("span", { class:"tag", text:`免過路費 ${p.free}` }) : null, p.skip ? el("span", { class:"tag hot", text:"停一次" }) : null].filter(Boolean);
    ps.append(el("div", { class:"fwp" + (i === S.turn && S.phase !== "over" ? " on" : "") + (p.out ? " out" : ""), "data-i":i, style:`--oc:var(${PCOL[i]})` }, [
      avEl(p, i, "big"), el("div", { class:"nm" }, [el("b", { text:p.name + (p.out ? "（破產）" : "") }), el("span", { class:"coin", text:"$" + p.coins.toLocaleString() }), tags.length ? el("span", { class:"tags" }, tags) : null])]));
  });
  return el("div", { class:"fwhud" }, [
    el("div", { class:"logo" }, [el("b", { class:"hz", text:"漢字大富翁" })]),
    el("span", { class:"round", text:`第 ${Math.min(S.round, S.rounds)}／${S.rounds} 輪` + (ROOM ? `・房間 ${ROOM.id}` : "") }),
    ps,
    el("button", { class:"btn small fsbtn", type:"button", text: isFs() ? "縮小" : "全螢幕", onclick: () => { isFs() ? fsOff() : fsOn(); setTimeout(render, 300); } }),
    el("button", { class:"btn small leave", type:"button", text: S.phase === "over" ? "再玩一次" : "離開", onclick: leave })]);
}
function afterAnim(){ hideModal(false); scheduleBot(); scheduleAuto(); }
const RC = i => { // 24 格排在 7×7 的外圈
  if (i <= 6) return [1, i + 1];
  if (i <= 12) return [i - 5, 7];
  if (i <= 18) return [7, 19 - i];
  return [25 - i, 1];
};
const SPN = { start:["起點", "+" + PASS, "→"], chance:["機會", "", "?"], fate:["命運", "", "!"], jam:["塞車", "停一次", "塞"], park:["公園", "休息", "❀"], party:["生日派對", `每人給你 ${PARTY}`, "♪"] };
function cellEl(sq, i){
  const [r, c] = RC(i);
  const d = el("div", { class:"tile t-" + sq.t + (sq.t === "lot" ? " lot g" + sq.g : " sp") + (i % 6 === 0 ? " corner" : ""), "data-i":i });
  d.style.gridArea = `${r} / ${c}`;
  if (sq.t === "lot"){
    d.append(el("span", { class:"band" }), el("b", { class:"wd hz l" + sq.w.length, text:sq.w }), el("small", { class:"wpy pyl", text:sq.py }));
    if (sq.owner >= 0){ d.classList.add("own"); d.style.setProperty("--oc", `var(${PCOL[sq.owner]})`);
      if (sq.lv){ const h = el("span", { class:"houses" }); for (let k = 0; k < sq.lv; k++) h.append(el("i", { class:"h" })); d.append(h); }
      d.append(el("span", { class:"price ow", text:"過路 " + rent(S, sq) })); d.title = `${S.players[sq.owner].name} 的地，過路費 ${rent(S, sq)}`; }
    else d.append(el("span", { class:"price", text:"$" + sq.price }));
  } else {
    const L = SPN[sq.t];
    d.append(el("span", { class:"ic" + (sq.t === "chance" || sq.t === "fate" ? " q" : ""), text:L[2] }), el("b", { class:"nm", text:L[0] })); if (L[1]) d.append(el("small", { class:"sub", text:L[1] }));
  }
  d.append(el("div", { class:"tok" }));
  return d;
}
function placeTokens(over){
  const P = panel(); P.querySelectorAll(".tile .tok").forEach(t => t.innerHTML = "");
  S.players.forEach((p, i) => { if (p.out) return; const pos = over && over[i] != null ? over[i] : p.pos;
    const t = P.querySelector(`.tile[data-i="${pos}"] .tok`); if (t) t.append(avEl(p, i, (i === S.turn ? "me" : "") + (over && over[i] != null ? " hop" : ""))); });
}
function dieSvg(n){
  const P = { 1:[[50,50]], 2:[[28,28],[72,72]], 3:[[28,28],[50,50],[72,72]], 4:[[28,28],[72,28],[28,72],[72,72]], 5:[[28,28],[72,28],[50,50],[28,72],[72,72]], 6:[[28,25],[72,25],[28,50],[72,50],[28,75],[72,75]] }[n] || [];
  return `<svg viewBox="0 0 100 100" class="die" aria-label="${n} 點"><rect x="4" y="4" width="92" height="92" rx="18"/>${P.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9"/>`).join("")}</svg>`;
}
function rollThenWalk(a){
  animating = true; hideModal(true);
  const dz = panel().querySelector(".fwcenter .dice");
  const walkA = () => {
    let k = 0; const over = {}; over[a.i] = a.from; placeTokens(over); const dir = a.n < 0 ? -1 : 1, n = Math.abs(a.n);
    if (!n){ animating = false; placeTokens(); afterAnim(); return; }
    const step = () => { k++; over[a.i] = (a.from + dir * k + N) % N; placeTokens(over); A.sfx.pick();
      if (k < n) setTimeout(step, n > 8 ? 130 : 230); else setTimeout(() => { animating = false; placeTokens(); const t = panel().querySelector(`.tile[data-i="${S.players[a.i].pos}"]`); if (t) t.classList.add("land"); afterAnim(); }, 280); };
    setTimeout(step, 180);
  };
  if (a.d && dz){ let f = 0; dz.classList.add("rolling");
    const spin = () => { f++; dz.innerHTML = dieSvg(f < 9 ? 1 + rnd(6) : a.d); if (f < 9){ tone(220 + rnd(200), .03); setTimeout(spin, 70); } else { dz.classList.remove("rolling"); tone(660, .08); setTimeout(walkA, 250); } };
    spin(); }
  else walkA();
}
function tone(f, d){ try { const ctx = tone.c || (tone.c = new (window.AudioContext || window.webkitAudioContext)()); const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "triangle"; o.frequency.value = f; g.gain.value = .05; g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + d + .05); o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + d + .06); } catch(e){} }
const coinSnd = () => { tone(988, .06); setTimeout(() => tone(1319, .12), 70); };
function hideModal(h){ const x = panel().querySelector(".fwov:not(.over)"); if (x) x.style.visibility = h ? "hidden" : ""; }
function exitGameLook(){ document.body.classList.remove("fw-ingame"); fsOff(); }
function fsOn(){ try { const d = document.documentElement; if (!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen({ navigationUI:"hide" }).catch(() => {}); else if (d.webkitRequestFullscreen && !document.webkitFullscreenElement) d.webkitRequestFullscreen(); } catch(e){} }
function fsOff(){ try { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); else if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen(); } catch(e){} }
const isFs = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
function floats(d){
  Object.entries(d).forEach(([i, n]) => { if (!n) return; const row = panel().querySelector(`.fwp[data-i="${i}"]`); if (!row) return; const r = row.getBoundingClientRect();
    const f = el("div", { class:"fwfloat " + (n > 0 ? "up" : "down"), text:(n > 0 ? "+" : "−") + Math.abs(n) }); f.style.left = (r.right - 70) + "px"; f.style.top = (r.top + 4) + "px"; document.body.append(f); setTimeout(() => f.remove(), 1500);
    row.classList.add(n > 0 ? "gain" : "loss"); setTimeout(() => row.classList.remove("gain", "loss"), 900); });
  if (Object.values(d).some(n => n > 0)) coinSnd();
}
function showBanner(f){
  const bw = panel().querySelector(".fwbw"); if (!bw) return;
  const b = el("div", { class:"fwban k-" + f.k }, [f.c ? el("b", { class:"hz", text:f.c }) : null, el("span", { text:f.text })]); bw.append(b); setTimeout(() => b.remove(), 2200);
  if (["buy", "up", "side"].includes(f.k)){ const [x, y] = centerOf(b); burst(x, y, f.k === "side" ? 60 : 24); }
  if (f.k === "bust"){ sfx.lose(); } else sfx.good();
}
function centerEl(){
  const p = cur(S), box = el("div", { class:"fwcenter" });
  box.append(el("div", { class:"title hz", text:"漢字大富翁" }));
  if (S.phase === "over"){ box.append(el("div", { class:"turn", text:"遊戲結束" })); return box; }
  box.append(el("div", { class:"turn" }, [avEl(p, S.turn), `輪到 ${p.name}`]));
  const d = el("button", { class:"dicebtn", type:"button", "aria-label":"擲骰子" }); const dz = el("span", { class:"dice" }); dz.innerHTML = dieSvg(S.dice || 5); d.append(dz, el("span", { text: S.phase === "roll" ? (mine(S.turn) ? "擲骰子" : p.bot ? "電腦擲骰子……" : `等 ${p.name}`) : "" }));
  if (S.phase === "roll" && mine(S.turn)){ d.classList.add("go"); d.onclick = () => act("roll"); } else d.disabled = true;
  box.append(d);
  const lg = S.log.slice(-2); if (lg.length) box.append(el("div", { class:"clog" }, lg.map(t => el("div", { text:t }))));
  return box;
}

// ---------- 跳出的視窗 ----------
function lotCard(sq){ return el("div", { class:"lotcard g" + sq.g }, [el("span", { class:"band" }), el("b", { class:"hz", text:sq.w }), el("div", { class:"pyl", text:sq.py }), el("small", { text:`地價 $${sq.price}・過路費 $${rent(S, sq)}` })]); }
function cardEl(ref, live, res){
  const c = cardOf(S, ref), kind = ref[0] === "c" ? "機會" : "命運";
  const box = el("div", { class:"fcard " + (ref[0] === "c" ? "ch" : "fa") }, [el("div", { class:"fk" }, [el("span", { text:kind })]), el("div", { class:"fz hz", text:c.z })]);
  const py = el("div", { class:"fp pyl", text:c.p }); if (!(S.pyCard || showPy)) py.hidden = true; box.append(py);
  if (!S.pyCard && !res){ const b = el("button", { class:"btn small pyb", type:"button", text: showPy ? "收起拼音" : "看拼音", onclick: () => { showPy = !showPy; py.hidden = !showPy; b.textContent = showPy ? "收起拼音" : "看拼音"; } }); box.append(b); }
  if (res) box.append(el("div", { class:"fres", text:res }));
  return box;
}
function nextRow(){
  const nx = el("button", { class:"btn nextb", type:"button", text:"下一位 →" });
  if (isHost() || mine(S.turn)) nx.onclick = () => { clearTimeout(autoT); act("next"); }; else nx.disabled = true;
  return el("div", { class:"autonext" }, [el("i"), nx]);
}
function modalEl(){
  const ph = S.phase, p = cur(S), me = mine(S.turn), sq = S.board[p.pos], box = el("div", { class:"fwmodal fwcard2 m7 fwq" });
  const who = el("div", { class:"mwho" }, [avEl(p, S.turn), el("b", { text:p.name })]);
  if (ph === "buy"){
    box.append(who, lotCard(sq), el("p", { class:"mq", text:`要買「${sq.w}」嗎？要先答對一題才買得到。` }));
    if (me) box.append(el("div", { class:"mbtns" }, [el("button", { class:"btn primary big", type:"button", text:`買（$${sq.price}）`, onclick: () => act("buy", true) }), el("button", { class:"btn big", type:"button", text:"不買", onclick: () => act("buy", false) })]));
    else box.append(el("p", { class:"muted", text:`${p.name} 正在決定……` }));
    return box;
  }
  if (ph === "build"){
    box.append(who, lotCard(sq), el("p", { class:"mq", text:`回到自己的地。要蓋房子嗎？蓋一棟 $${houseCost(sq)}，過路費會變成 $${round10(sq.price * RENT[sq.lv + 1])}。` }));
    if (me) box.append(el("div", { class:"mbtns" }, [el("button", { class:"btn primary big", type:"button", text:`蓋房子（$${houseCost(sq)}）`, onclick: () => act("build", true) }), el("button", { class:"btn big", type:"button", text:"不蓋", onclick: () => act("build", false) })]));
    else box.append(el("p", { class:"muted", text:`${p.name} 正在決定……` }));
    return box;
  }
  if (ph === "card"){
    box.append(who, cardEl(S.card, me));
    if (me) box.append(el("div", { class:"mbtns" }, [el("button", { class:"btn primary big", type:"button", text:"看懂了，照做", onclick: () => act("card") })]));
    else box.append(el("p", { class:"muted", text:`${p.name} 正在看卡片……` }));
    return box;
  }
  if (ph === "q" && S.q){
    const q = S.q, live = me && !q.res;
    box.append(el("div", { class:"qhead" }, [el("span", { class:"kind", text: q.kind === "blank" ? "選字" : "看拼音" }), el("b", { text:`買地「${q.w}」$${sq.price}` }), el("span", { class:"who", text:p.name + " 作答" })]));
    if (!q.res && q.lim) box.append(el("div", { class:"timer" }, [el("i")]));
    const pr = el("div", { class:"prompt" });
    if (q.kind === "blank"){ pr.append(el("div", { class:"w", text:blank(q.w, q.i) }), el("div", { class:"py pyl", text:q.py })); }
    else pr.append(el("div", { class:"py pyl big", text:q.py }));
    box.append(pr, el("p", { class:"ask", text: q.kind === "blank" ? "□ 是哪一個字？" : "這是哪一個詞？" }));
    const g = el("div", { class:"opts" + (q.kind === "pyword" ? " words" : "") });
    q.opts.forEach((o, i) => { const b = el("button", { class:"opt", type:"button", text:o });
      if (q.res){ b.disabled = true; if (i === q.ans) b.classList.add("right"); else if (i === q.res.pick) b.classList.add("wrong"); }
      else if (live) b.onclick = () => answered(i); else b.disabled = true;
      g.append(b); });
    box.append(g);
    return box;
  }
  if (ph === "end"){
    const kids = [];
    if (S.prev){ kids.push(cardEl(S.prev.ref, false, S.prev.res || "")); }
    if (S.q && S.q.res){ const q = S.q, ok = q.res.ok, tm = q.res.pick === "timeout";
      kids.push(el("div", { class:"fwfb " + (ok ? "ok" : "no") }, [el("b", { text: ok ? `答對了！買下「${q.w}」` : (tm ? "時間到！" : "答錯了！") + "沒買到" }), el("div", { class:"fbw" }, [el("span", { class:"hz", text:q.w }), "　", el("span", { class:"pyl", text:q.py })])])); }
    if (S.note) kids.push(el("div", { class:"mnote " + (S.note.k || ""), text:S.note.text }));
    if (!kids.length) return null;
    box.append(who, ...kids, nextRow());
    return box;
  }
  return null;
}
function answered(v){
  if (!S || !S.q || S.q.res || S.phase !== "q") return;
  if (isRight(S.q, v)){ sfx.good(); const r = panel().querySelector(".fwmodal"); if (r){ const [x, y] = centerOf(r); burst(x, y, 20); } } else sfx.bad();
  act("answer", v);
}
function startTick(){
  const tick = () => {
    if (!S) return;
    if (S.phase === "q" && S.q && !S.q.res && S.q.lim){
      const left = S.q.lim - (Date.now() - S.q.t0) / 1000, bar = panel().querySelector(".fwmodal .timer i");
      if (bar){ bar.style.width = Math.max(0, left / S.q.lim * 100) + "%"; bar.classList.toggle("hurry", left < 4); }
      if (left <= 0 && !animating && (mine(S.turn) || (isHost() && !cur(S).bot && left < -3))){ act("answer", "timeout"); return; }
    }
    tickT = setTimeout(tick, 250);
  };
  tickT = setTimeout(tick, 250);
}
// 結果看一下自動換下一位（有卡片要讀的時候多等一點）
function scheduleAuto(){
  clearTimeout(autoT);
  if (!S || S.phase !== "end" || animating) return;
  if (!(isHost() || mine(S.turn))) return;
  const wait = S.prev ? 6000 : S.q ? 3500 : S.note ? 2600 : 1200;
  const bar = panel().querySelector(".autonext i"); if (bar){ bar.style.transitionDuration = wait + "ms"; requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = "0%"; })); }
  const seq = S.seq; autoT = setTimeout(() => { if (S && S.seq === seq && S.phase === "end") act("next"); }, wait + (isHost() && !mine(S.turn) && S.mode === "B" ? 1500 : 0));
}
function overEl(){
  const box = el("div", { class:"fwover box" });
  const rank = S.players.map((p, i) => ({ p, i, w:worth(S, i) })).sort((a, b) => b.w - a.w);
  const W = rank[0];
  box.append(el("div", { class:"winner" }, [avEl(W.p, W.i, "big"), el("h3", { text:`${W.p.name} 贏了！` })]));
  rank.forEach((r, k) => {
    const p = r.p, lots = S.board.filter(b => b.owner === r.i).map(b => b.w);
    const card = el("div", { class:"rep", style:`--oc:var(${PCOL[r.i]})` }, [el("div", { class:"rh" }, [avEl(p, r.i), el("b", { text:`${k + 1}. ${p.name}` }), el("span", { class:"muted", text:`總資產 $${r.w}${p.n ? `・答對 ${p.ok}／${p.n}` : ""}` })])]);
    if (!p.bot){
      if (lots.length) card.append(el("div", { class:"fwwrong" }, [el("small", { class:"muted", text:"買到的地：" })].concat(lots.map(w => el("span", { class:"chip ok", text:w })))));
      if (p.wrong.length) card.append(el("div", { class:"fwwrong" }, [el("small", { class:"muted", text:"要再複習：" })].concat(p.wrong.map(w => el("span", { class:"chip", text:w })))));
    }
    box.append(card);
  });
  if (!saved){ saved = true; const mineP = S.players.filter(p => !p.bot && (S.mode === "C" || (S.mode === "B" && p.uid === myUid())));
    if (mineP.length === 1 && A.store.me){ const p = mineP[0]; let n = 0; p.wrong.forEach(w => { const c = [...w][0]; if (A.addReview(c, w, (S.board.find(b => b.w === w) || {}).py || "")) n++; }); if (p.ok) A.addXp(p.ok * 5); A.save(); if (n) toast(`答錯的 ${n} 個詞已經加到「今天的複習」`); }
    if (W.p && !W.p.bot){ sfx.win(); setTimeout(() => { const [x, y] = centerOf(box); burst(x, y, 70); }, 200); } }
  return box;
}

// ---------- 電腦玩家 ----------
function scheduleBot(){
  clearTimeout(botT); if (!S || animating || S.phase === "over" || S.phase === "lobby" || !isHost()) return;
  const p = cur(S); if (!p || !p.bot) return;
  const lv = BOTLV[p.bot] || BOTLV.normal, seq = S.seq, sq = S.board[p.pos];
  const go = (fn, ms) => { botT = setTimeout(() => { if (S && S.seq === seq && !animating) fn(); }, ms); };
  if (S.phase === "roll") go(() => act("roll"), 900);
  else if (S.phase === "buy") go(() => act("buy", p.coins - sq.price >= 150), 1300);
  else if (S.phase === "q" && S.q && !S.q.res){ const q = S.q, ok = Math.random() < lv.p; go(() => act("answer", ok ? q.ans : pick(q.opts.map((o, i) => i).filter(i => i !== q.ans))), 2000 + rnd(3000)); }
  else if (S.phase === "build") go(() => act("build", p.coins - houseCost(sq) >= 250), 1300);
  else if (S.phase === "card") go(() => act("card"), 3500);
}

// ---------- 開始畫面 ----------
const SET = { avs:["blue", "rose", "green", "purple"], mode:"A", src:"course", rounds:12, names:["", "", "", ""], np:2, bot:"normal", nbot:1, tb:"", lids:[], fam:"*", lv:1, hostOnly:false, pyCard:false };
try { Object.assign(SET, JSON.parse(localStorage.getItem("hz-fw7") || localStorage.getItem("hz-fw") || "{}")); } catch(e){}
if (!Array.isArray(SET.avs) || SET.avs.length < 4 || !SET.avs.every(k => COLV[k])) SET.avs = ["blue", "rose", "green", "purple"];
if (![12, 20, 30].includes(SET.rounds)) SET.rounds = 12;
const myName = () => (A.store.me && A.store.me.name) || (A.store.teacher ? "老師" : "我");
const nameOfSeat = i => SET.mode === "A" ? ((SET.names[i] || "").trim() || `玩家 ${i + 1}`) : ((SET.names[0] || "").trim() || myName());
function avPick(i){
  const col = COLV[SET.avs[i]] || COLV.blue;
  const pv = el("i", { class:"av pv", style:`background:${col}` });
  const upd = () => { const t = initial({ name:nameOfSeat(i) }); pv.textContent = t; pv.classList.toggle("lat", /^[\x20-\x7e]+$/.test(t)); };
  const dots = el("div", { class:"cdots" });
  COLS.filter(c => c[0] !== "ink").forEach(([k, v, n]) => { const on = SET.avs[i] === k; const b = el("button", { type:"button", class:"cdot" + (on ? " on" : ""), title:n, "aria-label":n, "aria-pressed":String(on), style:`--c:${v}` });
    b.onclick = () => { const j = SET.avs.indexOf(k); if (j >= 0 && j !== i) SET.avs[j] = SET.avs[i]; SET.avs[i] = k; keep(); renderSetup(); }; dots.append(b); });
  const row = el("div", { class:"avpick" }, [pv, dots]); row.upd = upd; upd();
  return row;
}
function nameRow(i, ph){
  const inp = el("input", { class:"fwin", placeholder:ph || `玩家 ${i + 1}`, value:SET.names[i] || (SET.mode === "A" ? "" : myName()) });
  const ap = avPick(i); inp.oninput = () => { SET.names[i] = inp.value; keep(); ap.upd(); };
  const pr = el("div", { class:"prow" }, [inp, ap]); pr.inp = inp; return pr;
}
const keep = () => { try { localStorage.setItem("hz-fw7", JSON.stringify(SET)); } catch(e){} };
function seg(opts, val, on){ const s = el("div", { class:"seg" }); opts.forEach(([v, t]) => { const b = el("button", { type:"button", text:t, "aria-pressed":String(v === val) }); b.onclick = () => on(v); s.append(b); }); return s; }
function srcInfo(){
  if (SET.src === "course"){ const ids = SET.lids.filter(id => C.byId[id]); return { src:{ k:"course", ids }, name: ids.length === 1 ? C.byId[ids[0]].label : `課本 ${ids.length} 課` }; }
  if (SET.src === "fam") return { src:{ k:"fam", v:SET.fam }, name: SET.fam === "*" ? "精選字族" : SET.fam };
  return { src:{ k:"lv", v:SET.lv }, name:(LEVELS[SET.lv] || {}).name || "" };
}
function renderSetup(){
  const P = panel(); P.innerHTML = "";
  if (SET.src === "course" && !C.lessons.length) SET.src = "lv";
  P.append(el("div", { class:"fwhead" }, [el("h2", { text:"漢字大富翁" })]));
  P.append(el("p", { class:"muted fwrule", text:"地是課本的生詞。答對一題才買得到地；別人走到你的地要付過路費；機會卡、命運卡要看懂中文才知道怎麼做。" }));
  const f = el("div", { class:"fwset box" }); P.append(f);
  const row = (label, node) => f.append(el("div", { class:"fwrow" }, [el("label", { text:label }), node]));
  row("玩法", seg([["A", "一台電腦輪流玩"], ["B", "各自用自己的裝置"], ["C", "跟電腦對戰"]], SET.mode, v => { SET.mode = v; keep(); renderSetup(); }));
  if (SET.mode === "B"){
    if (!myUid()){ f.append(el("div", { class:"notice", text:"連線玩要先登入（學生用自己的帳號登入，老師用老師帳號）。" })); return; }
    const code = el("input", { class:"fwin", inputmode:"numeric", maxlength:"5", placeholder:"房間代碼（5 位數）" });
    const me0 = nameRow(0, "你的名字"), nm = me0.inp;
    row("名字和棋子", me0);
    f.append(el("h3", { text:"加入同學開的房間" }), el("div", { class:"row" }, [code, el("button", { class:"btn primary", type:"button", text:"加入", onclick: () => join(code.value.trim(), nm.value.trim()) })]));
    f.append(el("h3", { class:"mt", text:"或是：自己開一個房間（老師開房，學生用代碼加入）" }));
  }
  if (SET.mode === "A"){
    row("人數", seg([[2, "2 人"], [3, "3 人"], [4, "4 人"]], SET.np, v => { SET.np = v; keep(); renderSetup(); }));
    const ns = el("div", { class:"fwcol" }); for (let i = 0; i < SET.np; i++) ns.append(nameRow(i)); row("玩家和棋子", ns);
  }
  if (SET.mode === "C"){
    row("名字和棋子", nameRow(0, "你的名字"));
    row("電腦", seg([[1, "1 個"], [2, "2 個"], [3, "3 個"]], SET.nbot, v => { SET.nbot = v; keep(); renderSetup(); }));
    row("電腦程度", seg(Object.entries(BOTLV).map(([k, v]) => [k, v.name]), SET.bot, v => { SET.bot = v; keep(); renderSetup(); }));
  }
  if (SET.mode === "B"){ const cb = el("input", { type:"checkbox" }); cb.checked = SET.hostOnly; cb.onchange = () => { SET.hostOnly = cb.checked; keep(); };
    row("主持人", el("label", { class:"chk" }, [cb, " 我只當主持人（投影棋盤，不下場玩）"])); }
  const srcs = [["fam", "精選字族"], ["lv", "華語八千詞"]]; if (C.lessons.length) srcs.unshift(["course", "我的課本"]);
  row("生詞", seg(srcs, SET.src, v => { SET.src = v; keep(); renderSetup(); }));
  const n = el("small", { class:"muted" }); const cnt = () => { const it = wordsFrom(srcInfo().src); (SET.excl || []).forEach(w => delete it[w]); const k = Object.keys(it).length; n.textContent = `這一局有 ${k} 個生詞` + (k < 16 ? "（至少要 16 個，請多選幾課）" : ""); };
  if (SET.src === "course"){
    const tbs = [...new Set(C.lessons.map(L => L.tb || "其他課"))];
    if (!tbs.includes(SET.tb)) SET.tb = tbs[0];
    const sel = el("select", { class:"fwsel" }); tbs.forEach(t => sel.append(el("option", { value:t, text:t }))); sel.value = SET.tb;
    sel.onchange = () => { SET.tb = sel.value; keep(); renderSetup(); };
    const list = el("div", { class:"fwlist" });
    C.lessons.filter(L => (L.tb || "其他課") === SET.tb).forEach(L => {
      const cb = el("input", { type:"checkbox" }); cb.checked = SET.lids.includes(L.id);
      cb.onchange = () => { SET.lids = cb.checked ? SET.lids.concat(L.id) : SET.lids.filter(x => x !== L.id); keep(); cnt(); };
      list.append(el("label", { class:"chk" }, [cb, ` ${L.label}`])); });
    row("課本", el("div", { class:"fwcol" }, [sel, list, n]));
  }
  if (SET.src === "fam"){ const sel = el("select", { class:"fwsel" }); sel.append(el("option", { value:"*", text:"全部精選字族" })); FAM.forEach(x => sel.append(el("option", { value:x.name, text:x.name }))); sel.value = SET.fam; sel.onchange = () => { SET.fam = sel.value; keep(); cnt(); }; row("字族", el("div", { class:"fwcol" }, [sel, n])); }
  if (SET.src === "lv"){ const sel = el("select", { class:"fwsel" }); LEVELS.forEach((L, i) => { if (i) sel.append(el("option", { value:i, text:L.name })); }); sel.value = SET.lv; sel.onchange = () => { SET.lv = Number(sel.value); keep(); cnt(); }; row("等級", el("div", { class:"fwcol" }, [sel, n])); }
  cnt();
  row("答題時間", seg([[1.5, "寬鬆（約 40 秒）"], [1, "標準（約 25 秒）"], [0, "不限時"]], SET.tmul == null ? 1.5 : SET.tmul, v => { SET.tmul = v; keep(); renderSetup(); }));
  row("卡片拼音", seg([[false, "不顯示（練閱讀，可以按「看拼音」）"], [true, "一直顯示"]], !!SET.pyCard, v => { SET.pyCard = v; keep(); renderSetup(); }));
  // 題庫：這一局的生詞，老師可以把不要的拿掉
  const ws = wordsFrom(srcInfo().src), ex = new Set(SET.excl || []);
  const tb = el("div", { class:"fwbank" });
  const tog = el("button", { class:"btn", type:"button", text:(SET.showBank ? "收起題庫" : "看題庫"), onclick: () => { SET.showBank = !SET.showBank; keep(); renderSetup(); } });
  tb.append(tog);
  if (SET.showBank){
    tb.append(el("div", { class:"bankhelp" }, [el("p", { text:"棋盤上的地從這些生詞裡隨機挑 16 個。買地要答一題：「□ 是哪一個字」或「看拼音選詞」。不想用的詞把勾勾拿掉。" })]));
    const g = el("div", { class:"bankgrid" });
    Object.entries(ws).forEach(([w, py]) => { const cb = el("input", { type:"checkbox" }); cb.checked = !ex.has(w);
      cb.onchange = () => { const e2 = new Set(SET.excl || []); if (cb.checked) e2.delete(w); else e2.add(w); SET.excl = [...e2]; keep(); cnt(); };
      g.append(el("label", { class:"bk" + (ex.has(w) ? " off" : "") }, [cb, el("b", { class:"hz", text:w }), el("small", { class:"pyl", text:sylOf(w, py).join("") })])); });
    tb.append(g);
  }
  row("題庫", tb);
  row("輪數", seg([[12, "12 輪（約 15 分鐘）"], [20, "20 輪"], [30, "30 輪"]], SET.rounds, v => { SET.rounds = v; keep(); renderSetup(); }));
  const go = el("button", { class:"btn primary big", type:"button", text: SET.mode === "B" ? "開房間" : "開始玩" }); go.onclick = start;
  f.append(el("div", { class:"row mt" }, [go]));
}
function start(){
  const si = srcInfo(); const ws = wordsFrom(si.src); (SET.excl || []).forEach(w => delete ws[w]);
  if (Object.keys(ws).length < 16){ toast(SET.src === "course" ? "生詞不夠：請多選幾課（至少 16 個詞）" : "這個範圍的詞太少了"); return; }
  const me = nameOfSeat(0);
  let players;
  if (SET.mode === "A") players = Array.from({ length:SET.np }, (_, i) => ({ name:(SET.names[i] || "").trim() || `玩家 ${i + 1}`, av:SET.avs[i] }));
  if (SET.mode === "C") players = [{ name:me, av:SET.avs[0] }].concat(Array.from({ length:SET.nbot }, (_, i) => ({ name:["電腦一號", "電腦二號", "電腦三號"][i], bot:SET.bot })));
  if (SET.mode === "B") players = SET.hostOnly ? [] : [{ name:me, uid:myUid(), av:SET.avs[0] }];
  saved = false; showPy = false;
  const s = newGame({ mode:SET.mode, rounds:SET.rounds, src:si.src, srcName:si.name, players, host:myUid(), excl:SET.excl || [], tmul:SET.tmul == null ? 1.5 : SET.tmul, pyCard:SET.pyCard });
  if (SET.mode === "B") return openRoom(s);
  startGame(s); S = s; fsOn(); render(); window.scrollTo({ top:0 });
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
      if (s.v !== 7) throw new Error("OLD");
      if (s.players.some(p => p.uid === uid)) return null;
      if (s.phase !== "lobby") throw new Error("STARTED"); if (s.players.length >= 4) throw new Error("FULL");
      s.players.push(newPlayer({ name, uid, av:SET.avs[0] }, s.players.length)); s.seq++; return s; };
    const fs = firebase.firestore();
    if (fs.runTransaction) await fs.runTransaction(async t => { const s = doJoin(await t.get(ref)); if (s) t.update(ref, { s:JSON.stringify(s), ver:s.seq }); });
    else { const s = doJoin(await ref.get()); if (s) await ref.update({ s:JSON.stringify(s), ver:s.seq }); }
    listen(code);
  } catch(e){ const m = { NOROOM:"找不到這個房間，請再確認代碼。", STARTED:"這個房間的遊戲已經開始了。", FULL:"這個房間已經 4 個人了。", OLD:"這個房間是舊版的大富翁，請老師重新開房。" }[e.message]; if (m) toast(m); else roomErr(e); }
}
function roomErr(e){
  const perm = /permission|insufficient/i.test(String(e && (e.code || e.message)));
  toast(perm ? "連線玩還沒開通：老師要先在 Firebase 加上 hz_rooms 的規則。" : "連線失敗：" + (e && (e.message || e.code) || e));
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
  const P = panel(); P.innerHTML = ""; pcolors(S.players).forEach((c, i) => P.style.setProperty("--pc" + i, c));
  P.append(el("div", { class:"fwhead" }, [el("h2", { text:"漢字大富翁・等大家進來" }), el("button", { class:"btn small", type:"button", text:"離開", onclick: leave })]));
  const b = el("div", { class:"box fwlobby" });
  b.append(el("p", { class:"muted", text:"請同學打開漢字遊戲 →「大富翁」→「各自用自己的裝置」，輸入房間代碼：" }), el("div", { class:"code", text:ROOM ? ROOM.id : "" }));
  b.append(el("p", { class:"muted", text:`生詞：${S.srcName}　${S.rounds} 輪　最多 4 人` }));
  const ul = el("div", { class:"fwplayers" }); S.players.forEach((p, i) => ul.append(el("div", { class:"fwp" }, [avEl(p, i), el("div", { class:"nm" }, [el("b", { text:p.name + (p.uid === S.host ? "（開房）" : "") })])])));
  if (!S.players.length) ul.append(el("p", { class:"muted", text:"還沒有人加入。" }));
  b.append(ul);
  if (isHost()){
    const go = el("button", { class:"btn primary big", type:"button", text:"開始！" }); go.disabled = S.players.length < 2;
    go.onclick = () => { fsOn(); const s = startGame(clone(S)); s.seq++; commit(s); };
    b.append(el("div", { class:"row mt" }, [go, el("small", { class:"muted", text: S.players.length < 2 ? "至少要 2 個人" : "" })]));
  } else b.append(el("p", { class:"mt", text:"等老師按「開始」……" }));
  P.append(b);
}
async function leave(){
  clearTimeout(botT); clearTimeout(autoT);
  if (S && S.phase !== "over" && S.phase !== "lobby" && !confirmLeave()) return;
  if (ROOM && isHost()){ try { await ROOM.delete(); } catch(e){} }
  stopRoom(); ROOM = null; S = null; fsOff(); render();
}
function confirmLeave(){ const b = panel().querySelector(".fwhud .leave, .fwhead .btn"); if (b && b.dataset.sure) return true; if (b){ b.dataset.sure = "1"; b.textContent = "確定離開？再按一次"; setTimeout(() => { if (b.isConnected){ delete b.dataset.sure; b.textContent = "離開"; } }, 3000); } return false; }

// ---------- 接到漢字遊戲的分頁 ----------
const tab = document.querySelector('nav.tabs button[data-tab="fw"]');
if (tab) tab.addEventListener("click", () => { A.showTab("fw"); if (!S) render(); });
if (new URLSearchParams(location.search).get("fw")){ A.showTab("fw"); const c = new URLSearchParams(location.search).get("fw"); render(); if (/^\d{5}$/.test(c)) setTimeout(() => { if (myUid()) join(c, (A.store.me && A.store.me.name) || ""); }, 2500); }
window.HZFW = { get state(){ return S; }, render, act, ACT, newGame, makeBoard, wordsFrom, mkQ, isRight, CHANCE, FATE };
}
if (window.HZAPI) boot(); else document.addEventListener("hzapi", boot);
})();
