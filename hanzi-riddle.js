/* ══════ 字謎猜猜看（hanzi-riddle.js）══════
   Quinn（2026-10-07）：「你還推薦做什麼遊戲嗎？我覺得可以更有趣一點的那種」→「這幾個我都要」。
   玩法：只給部件的線索，猜是哪一個字。「左邊三點水，右邊是『青』」→ 清。
   題目直接吃字族工坊原本就有的資料（HZAPI.FAM 的 119 族、HZAPI.RAD 的部首名稱），
   沒有新資料要維護；選項故意從同一族裡挑（清／請／情／晴／睛／精），
   因為會搞混的本來就是這幾個字，猜對才算真的分得出來。
   兩種玩法：
     自己玩 —— 10 題、有計時和分數，答錯的字會排進複習。
     投影帶全班 —— 一題一張大卡，老師先念線索，按一下才翻答案。不用連線、不用代碼，
                   線上課直接分享螢幕就能帶（Quinn 的課都在 Meet 上）。
   不用電腦語音（Quinn：AI 聲音不要拿來考聽力），不翻越南文（data-novi）。 */
(() => {
"use strict";
function boot(){
const A = window.HZAPI; if (!A || window.__RIDDLE) return; window.__RIDDLE = true;
const { FAM, RAD, el, shuffle, sfx, burst, toast, centerOf } = A;
const $ = s => document.querySelector(s);
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const mk = (tag, attrs = {}, kids = []) => { const fn = {}, at = {}; for (const k in attrs){ if (typeof attrs[k] === "function") fn[k] = attrs[k]; else if (attrs[k] != null && attrs[k] !== false) at[k] = attrs[k]; } const n = el(tag, at, kids); Object.assign(n, fn); return n; };
const btn = (text, onclick, cls) => mk("button", { class: "btn " + (cls || ""), type: "button", text, onclick });

/* ---------- 樣式（自己注入，不去動 games.html 的樣式表） ---------- */
if (!document.getElementById("rd-css")){
  const st = document.createElement("style"); st.id = "rd-css";
  st.textContent = `
.rd-wrap{max-width:860px;margin:0 auto}
.rd-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px}
.rd-top .sp{flex:1}
.rd-menu{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));margin-top:4px}
.rd-card{display:flex;flex-direction:column;gap:4px;align-items:flex-start;text-align:left;background:var(--paper,#fff);
  border:1px solid var(--line,#D3DCE8);border-radius:14px;padding:14px 16px;cursor:pointer;font:inherit}
.rd-card:hover{border-color:var(--navy,#1E4C86);box-shadow:0 2px 10px rgba(22,40,70,.10)}
.rd-card b{font-size:16px}
.rd-card small{color:var(--muted,#5B6878);line-height:1.6}
.rd-clue{background:var(--paper,#fff);border:1px solid var(--line,#D3DCE8);border-radius:16px;padding:20px 18px;text-align:center}
.rd-q{font-size:15px;color:var(--muted,#5B6878);margin-bottom:10px}
.rd-parts{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:6px}
.rd-part{background:var(--navy-soft,#E4ECF7);color:var(--navy,#1E4C86);border-radius:12px;padding:10px 14px;
  font-size:19px;font-weight:700;line-height:1.5}
.rd-part i{display:block;font-style:normal;font-size:12.5px;font-weight:500;color:var(--muted,#5B6878);margin-top:2px}
.rd-hint{color:var(--muted,#5B6878);font-size:13.5px;margin-top:8px;line-height:1.7}
.rd-opts{display:grid;gap:10px;grid-template-columns:repeat(4,1fr);margin-top:14px}
@media(max-width:560px){.rd-opts{grid-template-columns:repeat(2,1fr)}}
.rd-opt{font-family:var(--f-hz,serif);font-size:40px;line-height:1.25;padding:10px 4px;background:var(--paper,#fff);
  border:2px solid var(--line,#D3DCE8);border-radius:14px;cursor:pointer}
.rd-opt:hover{border-color:var(--navy,#1E4C86)}
.rd-opt.right{border-color:#2E7D5B;background:#E1F0E8}
.rd-opt.wrong{border-color:#B4364A;background:#F8E4E8}
.rd-opt.dim{opacity:.45}
.rd-fb{margin-top:12px;text-align:center;font-size:15px;line-height:1.8}
.rd-fb b{font-size:17px}
.rd-fb .py{color:var(--muted,#5B6878)}
.rd-bar{height:6px;border-radius:999px;background:var(--mat,#DCE5F1);overflow:hidden;margin:10px 0 2px}
.rd-bar i{display:block;height:100%;background:var(--navy,#1E4C86);width:100%}
.rd-big{font-family:var(--f-hz,serif);font-size:140px;line-height:1.1;text-align:center;margin:8px 0}
@media(max-width:560px){.rd-big{font-size:96px}}
.rd-proj .rd-clue{padding:30px 18px}
.rd-proj .rd-part{font-size:26px;padding:14px 18px}
.rd-proj .rd-q{font-size:18px}
.rd-done{text-align:center;display:grid;gap:12px;justify-items:center;padding:18px 0}
`;
  document.head.appendChild(st);
}

/* ---------- 出題：把一個字拆成「線索」 ---------- */
// FAM: [{name:"青", chars:[{c:"清", p:["氵","青"], py:"qīng", w:"清楚", tip:"水很乾淨，看得清楚"}]}]
/* 位置一定要講對。RAD[sym].pos 是「這個部首通常在哪」，對 車 這種本身就是字的部首會出錯
   （輩 的車在下面，不是左邊）。hanzi-game.js 的 radName(sym, 字) 會照這個字實際的
   組成重算成「車字底」，所以位置一律從 radName 的結果反推，推不出來就不講位置——
   寧可少講一句，也不要講錯。 */
const POS_OTHER = { "左邊":"右邊", "右邊":"左邊", "上面":"下面", "下面":"上面", "外面":"裡面", "裡面":"外面" };
function posFromName(nm, sym){
  if (!nm) return "";
  if (/字旁$/.test(nm) || nm === "在左邊") return "左邊";
  if (/字頭$/.test(nm)) return "上面";
  if (/字底$/.test(nm)) return "下面";
  if (nm === "在右邊") return "右邊";
  if (nm === "在裡面") return "裡面";
  if (nm === "在外面") return "外面";
  return "";
}
function partText(sym, c){
  const r = RAD && RAD[sym];
  if (r && r.name){
    let nm = r.name;
    try { nm = (A.radName && A.radName(sym, c)) || r.name; } catch(e){ nm = r.name; }
    let pos = posFromName(nm, sym);
    // 形體固定的部首（氵忄扌亻言…）名字沒被重算，它的位置就是固定的，可以信 RAD.pos
    if (!pos && nm === r.name && POS_OTHER[r.pos]) pos = r.pos;
    /* 有些部首的說明本身就是一段話（阝 是「左邊：山坡／右邊：地方、城市」），
       硬套成「跟…有關」會變成不通的句子，這種就原樣印出來。 */
    const hint = r.hint ? String(r.hint).replace(/\s+/g, " ").trim() : "";
    const sub = !hint ? "" : ((hint.length <= 10 && !/[：:，,]/.test(hint)) ? ("跟" + hint + "有關") : hint);
    return { pos, main: nm, sub };
  }
  return { pos:"", main: "「" + sym + "」", sub:"" };
}
function clueOf(ch){
  const ps = Array.isArray(ch.p) ? ch.p.slice(0, 2) : [];
  if (ps.length < 2) return null;
  const a = partText(ps[0], ch.c), b = partText(ps[1], ch.c);
  // 只有一邊講得出位置的時候，另一邊才用相對位置補；兩邊都講不出來就都不講
  if (!a.pos && b.pos) a.pos = POS_OTHER[b.pos] || "";
  if (!b.pos && a.pos) b.pos = POS_OTHER[a.pos] || "";
  // 兩邊都有位置卻互相矛盾（資料怪）：乾脆都不講
  if (a.pos && b.pos && POS_OTHER[a.pos] !== b.pos){ a.pos = ""; b.pos = ""; }
  // 照「上→下、左→右」的順序排，線索才跟字長得一樣
  const ORD = { "上面":0, "左邊":1, "外面":1, "裡面":2, "右邊":3, "下面":4 };
  const two = [a, b];
  if (a.pos && b.pos && ORD[a.pos] > ORD[b.pos]) two.reverse();
  return two;
}
function allItems(){
  const out = [];
  (FAM || []).forEach(f => (f.chars || []).forEach(ch => {
    const cl = clueOf(ch);
    if (cl && ch.c) out.push({ c:ch.c, py:ch.py || "", w:ch.w || "", tip:ch.tip || "", fam:f.name, clue:cl, p:ch.p });
  }));
  return out;
}
let POOL = null;
const pool = () => POOL || (POOL = allItems());

function optionsFor(it){
  const same = pool().filter(x => x.fam === it.fam && x.c !== it.c);
  const sameRad = pool().filter(x => x.c !== it.c && x.p && it.p && x.p[0] === it.p[0]);
  const bag = shuffle(same.slice()).slice(0, 3);
  shuffle(sameRad.slice()).forEach(x => { if (bag.length < 3 && !bag.some(y => y.c === x.c)) bag.push(x); });
  shuffle(pool().slice()).forEach(x => { if (bag.length < 3 && x.c !== it.c && !bag.some(y => y.c === x.c)) bag.push(x); });
  const opts = shuffle(bag.concat([it]));
  return { opts, ans: opts.findIndex(x => x.c === it.c) };
}
function makeSet(n){
  const all = shuffle(pool().slice());
  const seen = {}, out = [];
  for (const it of all){ if (out.length >= n) break; if (seen[it.c]) continue; seen[it.c] = 1; out.push(Object.assign({}, it, optionsFor(it))); }
  return out;
}

/* ---------- 畫面 ---------- */
let GAME = null;
function panel(){
  let p = document.getElementById("p-riddle");
  if (p && !p.hasAttribute("data-novi")){ p.setAttribute("data-novi", ""); p.setAttribute("translate", "no"); p.classList.add("notranslate"); }
  return p;
}
function stop(){ if (GAME && GAME.stop) try { GAME.stop(); } catch(e){} GAME = null; }
function shell(title, sub){
  const p = panel(); if (!p) return null;
  p.innerHTML = "";
  const wrap = mk("div", { class:"rd-wrap" });
  wrap.append(mk("div", { class:"rd-top" }, [
    btn("← 字謎猜猜看", () => { stop(); home(); }, "small"),
    mk("b", { class:"hz", text:title }),
    sub ? mk("span", { class:"muted", text:sub }) : null,
    mk("span", { class:"sp" })
  ]));
  const body = mk("div"); wrap.append(body); p.append(wrap);
  return body;
}
function clueBox(it, big){
  const box = mk("div", { class:"rd-clue" });
  box.append(mk("div", { class:"rd-q", text:"這是哪一個字？" }));
  const row = mk("div", { class:"rd-parts" });
  it.clue.forEach(part => {
    row.append(mk("div", { class:"rd-part" }, [
      (part.pos ? part.pos + "　" : "") + part.main,
      part.sub ? mk("i", { text:part.sub }) : null
    ]));
  });
  box.append(row);
  if (big) box.append(mk("div", { class:"rd-hint", text:"（想一想，再按「翻答案」）" }));
  return box;
}

function home(){
  stop();
  const p = panel(); if (!p) return;
  p.innerHTML = "";
  const wrap = mk("div", { class:"rd-wrap" });
  wrap.append(mk("div", { class:"mgtop" }, [
    mk("h2", { text:"字謎猜猜看" }),
    mk("p", { class:"muted", text:"只給部件的線索，猜是哪一個字。題目出自漢字闖關的 " + (FAM || []).length + " 個字族，選項都是同一族裡長得像的字。" })
  ]));
  const g = mk("div", { class:"rd-menu" });
  g.append(mk("button", { class:"rd-card", type:"button", onclick: () => solo(10) }, [
    mk("b", { text:"自己玩（10 題）" }), mk("small", { text:"有計時和分數，答錯的字會記下來。" })]));
  g.append(mk("button", { class:"rd-card", type:"button", onclick: () => solo(20) }, [
    mk("b", { text:"自己玩（20 題）" }), mk("small", { text:"想多練一點的時候。" })]));
  g.append(mk("button", { class:"rd-card", type:"button", onclick: () => proj() }, [
    mk("b", { text:"投影帶全班" }), mk("small", { text:"一題一張大卡：先給線索，老師按一下才翻答案。不用連線、不用代碼，分享螢幕就能帶。" })]));
  wrap.append(g);
  p.append(wrap);
  GAME = { k:"riddle" };
}

function solo(n){
  const qs = makeSet(n), LIM = 20;
  let i = 0, score = 0, ok = 0, t0 = 0, tm = null, res = null;
  const body = shell("字謎猜猜看・自己玩"); if (!body) return;
  const top = mk("div", { class:"rd-top" }), bar = mk("div", { class:"rd-bar" }, [mk("i")]), area = mk("div");
  body.append(top, bar, area);
  const draw = () => {
    top.innerHTML = "";
    top.append(mk("span", { class:"muted", text:`第 ${i + 1}／${qs.length} 題` }), mk("span", { class:"sp" }), mk("b", { text:`${score} 分` }));
    const it = qs[i];
    area.innerHTML = "";
    area.append(clueBox(it));
    const g = mk("div", { class:"rd-opts" });
    it.opts.forEach((o, k) => g.append(mk("button", {
      class:"rd-opt" + (res ? (k === it.ans ? " right" : (res.pick === k ? " wrong" : " dim")) : ""),
      type:"button", text:o.c, onclick: () => { if (!res) answer(k); } })));
    area.append(g);
    if (res){
      area.append(mk("div", { class:"rd-fb" }, [
        mk("b", { text: res.ok ? "答對了！" : (res.pick < 0 ? "時間到" : "答錯了") }),
        mk("div", {}, [it.c + "　", mk("span", { class:"py", text:it.py }), "　" + it.w]),
        it.tip ? mk("div", { class:"rd-hint", text:it.tip }) : null
      ]));
      area.append(mk("div", { class:"row center", style:"margin-top:12px" }, [btn(i >= qs.length - 1 ? "看結果" : "下一題", next, "primary big")]));
    }
  };
  const tick = () => { const left = LIM - (Date.now() - t0) / 1000;
    const b2 = bar.querySelector("i"); if (b2) b2.style.width = Math.max(0, left / LIM * 100) + "%";
    if (left <= 0){ answer(-1); return; } tm = setTimeout(tick, 100); };
  function answer(k){
    if (res) return; clearTimeout(tm);
    const it = qs[i], good = k === it.ans;
    const pts = good ? 100 + Math.round(100 * Math.max(0, 1 - (Date.now() - t0) / 1000 / LIM)) : 0;
    score += pts; if (good){ ok++; try { sfx.good && sfx.good(); } catch(e){} }
    else { try { sfx.bad && sfx.bad(); } catch(e){} try { A.addReview && A.addReview(it.c, it.w, it.py); } catch(e){} }
    res = { ok:good, pick:k }; draw();
  }
  function next(){ if (i >= qs.length - 1){ end(); return; } i++; res = null; t0 = Date.now(); draw(); tick(); }
  function end(){
    clearTimeout(tm); bar.hidden = true; top.innerHTML = ""; area.innerHTML = "";
    const m = mk("div", { class:"rd-done" }, [
      mk("b", { text:`答對 ${ok}／${qs.length} 題，${score} 分` }),
      mk("div", { class:"row center" }, [btn("再玩一次", () => solo(n), "primary big"), btn("回字謎首頁", () => { stop(); home(); })])
    ]);
    area.append(m);
    try { if (ok === qs.length){ const [x, y] = centerOf(m); burst(x, y, 60); } } catch(e){}
    try { if (A.store && A.store.me && A.addXp) A.addXp(Math.round(score / 50)); } catch(e){}
  }
  t0 = Date.now(); draw(); tick();
  GAME = { k:"riddle", stop: () => clearTimeout(tm) };
}

function proj(){
  const qs = makeSet(30);
  let i = 0, shown = false;
  const body = shell("字謎猜猜看・投影帶全班"); if (!body) return;
  body.parentNode.classList.add("rd-proj");
  const area = mk("div"); body.append(area);
  const draw = () => {
    const it = qs[i];
    area.innerHTML = "";
    area.append(mk("div", { class:"muted", style:"text-align:center;margin-bottom:8px", text:`第 ${i + 1} 題` }));
    if (!shown){
      area.append(clueBox(it, true));
      area.append(mk("div", { class:"row center", style:"margin-top:14px" }, [
        btn("翻答案", () => { shown = true; draw(); }, "primary big"),
        btn("跳過", () => { i = (i + 1) % qs.length; shown = false; draw(); })
      ]));
    } else {
      const big = mk("div", { class:"rd-big hz", text:it.c });
      area.append(big);
      area.append(mk("div", { class:"rd-fb" }, [
        mk("div", {}, [mk("span", { class:"py", text:it.py }), "　" + it.w]),
        it.tip ? mk("div", { class:"rd-hint", text:it.tip }) : null
      ]));
      area.append(mk("div", { class:"row center", style:"margin-top:14px" }, [
        btn("下一題", () => { i = (i + 1) % qs.length; shown = false; draw(); }, "primary big"),
        btn("再看一次線索", () => { shown = false; draw(); })
      ]));
      try { const [x, y] = centerOf(big); burst(x, y, 24); } catch(e){}
    }
  };
  const key = (e) => { if (e.key === " " || e.key === "Enter"){ e.preventDefault(); if (!shown){ shown = true; } else { i = (i + 1) % qs.length; shown = false; } draw(); } };
  document.addEventListener("keydown", key);
  draw();
  GAME = { k:"riddle", stop: () => { document.removeEventListener("keydown", key); const w = document.querySelector(".rd-proj"); if (w) w.classList.remove("rd-proj"); } };
}

/* ---------- 接到分頁 ---------- */
document.querySelectorAll('nav.tabs button[data-tab="riddle"]').forEach(tab => {
  tab.setAttribute("data-novi", ""); tab.setAttribute("translate", "no");
  tab.addEventListener("click", () => { A.showTab("riddle"); if (!GAME) home(); });
});
window.HZRD = { home, pool, makeSet, clueOf, get game(){ return GAME; } };
}
if (window.HZAPI) boot(); else document.addEventListener("hzapi", boot);
})();
