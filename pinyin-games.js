/* ══════ PINYIN_GAMES_V1 拼音練習的遊戲（pinyin-games.js）══════
   Quinn：「遊戲給我多樣一點」，選了四種：聲調打地鼠、拼音配對翻牌、拼音選擇搶答、拼音拼字拼圖。
   原本的「漢字往下掉」保留。按「遊戲」先出現選遊戲的畫面，五種都用上面選的題目（我的課本、等級、作業、複習…）。
   這支檔案只給 pinyin.html 用，靠 pinyin.html 開出來的 window.PYAPI 拿題目和存成績。
   成績存在學生那一筆拼音紀錄（results，kind:'pinyin'）的 rec.gbest[遊戲]；
   打錯、沒接到的詞一樣進「複習錯題」。 */
(function(){
'use strict';
var A = null;
var T = { iv:0, to:[], key:null };
function api(){ A = window.PYAPI; return !!A; }
function $(s){ return document.querySelector(s); }
function stage(){ return A.stage(); }
function e(s){ return A.esc(s); }
function later(f, ms){ var id = setTimeout(f, ms); T.to.push(id); return id; }
function stop(){
  clearInterval(T.iv); T.iv = 0;
  T.to.forEach(clearTimeout); T.to = [];
  if (T.key){ document.removeEventListener('keydown', T.key); T.key = null; }
}
function word(syls){
  return syls.map(function(s, j){ var t = A.markSyl(s.base, s.tone); return (j > 0 && /^[aoe]/.test(s.base)) ? "'" + t : t; }).join('');
}
var TB = ['ˉ', 'ˊ', 'ˇ', 'ˋ', '輕'];
var TN = ['第一聲', '第二聲', '第三聲', '第四聲', '輕聲'];

/* ---------- 樣式 ---------- */
function css(){
  if (document.getElementById('pyg-css')) return;
  var s = document.createElement('style'); s.id = 'pyg-css';
  s.textContent = ''
  + '.gpick{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px}'
  + '.gcard{border:2px solid var(--line);background:var(--surface-2);border-radius:18px;padding:14px 16px;text-align:left;display:flex;flex-direction:column;gap:4px;cursor:pointer;font:inherit;color:inherit;transition:transform .15s,border-color .15s}'
  + '.gcard:hover{transform:translateY(-2px);border-color:var(--primary)}'
  + '.gcard .gi{font-size:28px;line-height:1.2;font-family:var(--latin)}'
  + '.gcard b{font-size:18px}.gcard span{font-size:14px;color:var(--muted)}.gcard em{font-style:normal;font-size:13px;color:var(--primary);font-weight:700}'
  + '.gbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:15px;color:var(--muted)}'
  + '.gbar .sp{flex:1}.gbar b{font-family:var(--latin);font-size:22px;color:var(--ink)}'
  + '.gback{padding:4px 12px!important;font-size:14px!important}'
  + '.gmid{display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center}'
  + '.gmid .big{font-family:var(--latin);font-size:56px;line-height:1;color:var(--primary)}'
  + '.gmid .big small{font-size:22px;color:var(--muted)}'
  + '.tbar{height:6px;border-radius:6px;background:var(--surface-2);overflow:hidden}.tbar i{display:block;height:100%;background:var(--primary);transition:width .1s linear}'
  /* 打地鼠 */
  + '.holes{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-width:460px;width:100%;margin:0 auto}'
  + '.hole{aspect-ratio:1.25;border-radius:50% 50% 18px 18px;background:var(--surface-2);border:2px solid var(--line);position:relative;overflow:hidden}'
  + '.mole{position:absolute;left:10%;right:10%;bottom:-100%;height:86%;border-radius:46% 46% 12px 12px;background:var(--primary);color:var(--on-primary);display:flex;flex-direction:column;align-items:center;justify-content:center;transition:bottom .18s ease-out}'
  + '.hole.up .mole{bottom:4%}'
  + '.mole b{font-family:var(--kai);font-size:clamp(28px,7vw,40px);line-height:1;font-weight:400}.mole small{font-family:var(--latin);font-size:16px;opacity:.9}'
  + '.hole.ok .mole{background:var(--good)}.hole.no .mole{background:var(--bad)}'
  + '.tones{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}'
  + '.tones button{width:min(64px,16vw);height:56px;border:2px solid var(--line);border-radius:14px;background:var(--surface);font-family:var(--latin);font-size:28px;line-height:1;cursor:pointer;color:var(--ink)}'
  + '.tones button small{display:block;font-family:var(--ui);font-size:11px;color:var(--muted);margin-top:2px}'
  + '.tones button.q{font-family:var(--ui);font-size:18px}'
  + '.tones button:active{transform:scale(.95)}'
  + '.gfb{min-height:1.6em;font-size:16px}.gfb .py{font-family:var(--latin);font-size:20px}'
  /* 翻牌 */
  + '.flip{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}'
  + '@media (max-width:560px){.flip{grid-template-columns:repeat(3,1fr)}}'
  + '.fc{aspect-ratio:1.15;border:2px solid var(--line);border-radius:14px;background:var(--primary);color:var(--on-primary);display:flex;align-items:center;justify-content:center;text-align:center;padding:6px;cursor:pointer;font:inherit;font-size:22px;user-select:none}'
  + '.fc.open,.fc.done{background:var(--surface);color:var(--ink)}'
  + '.fc.done{border-color:var(--good);opacity:.65;cursor:default}'
  + '.fc .h{font-family:var(--kai);font-size:clamp(22px,5vw,30px)}.fc .p{font-family:var(--latin);font-size:clamp(17px,4vw,22px);overflow-wrap:anywhere}'
  /* 搶答 */
  + '.qopts{display:grid;grid-template-columns:1fr 1fr;gap:10px}'
  + '.qopts button{border:2px solid var(--line);border-radius:16px;background:var(--surface-2);font-family:var(--latin);font-size:clamp(22px,5vw,30px);padding:14px 8px;cursor:pointer;color:var(--ink)}'
  + '.qopts button:hover{border-color:var(--primary)}'
  + '.qopts button.right{border-color:var(--good);background:var(--primary-soft)}.qopts button.wrong{border-color:var(--bad);border-style:dashed}'
  /* 拼圖 */
  + '.slots{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;min-height:56px}'
  + '.slot,.tile{width:46px;height:52px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-family:var(--latin);font-size:28px;cursor:pointer;user-select:none}'
  + '.slot{border:2px dashed var(--line);background:var(--surface)}.slot.f{border-style:solid;border-color:var(--primary)}.slot.bad{border-color:var(--bad);color:var(--bad)}'
  + '.slot.gap{width:14px;border:none;background:none;cursor:default}'
  + '.tiles{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}'
  + '.tile{border:2px solid var(--line);background:var(--surface-2);color:var(--ink)}.tile.used{visibility:hidden}'
  + '.sylsel{display:flex;flex-wrap:wrap;gap:16px;justify-content:center}'
  + '.sylbox{display:flex;flex-direction:column;align-items:center;gap:6px;border:2px solid var(--line);border-radius:14px;padding:8px 10px;background:var(--surface-2)}'
  + '.sylbox.bad{border-color:var(--bad)}.sylbox .w{font-family:var(--latin);font-size:30px;line-height:1.2}'
  + '.sylbox .tb{display:flex;gap:3px}.sylbox .tb button{width:32px;height:32px;border:1.5px solid var(--line);border-radius:9px;background:var(--surface);font-family:var(--latin);font-size:20px;cursor:pointer;color:var(--ink);padding:0}'
  + '.sylbox .tb button.q{font-family:var(--ui);font-size:13px}'
  + '.sylbox .tb button[aria-pressed="true"]{background:var(--primary);border-color:var(--primary);color:var(--on-primary)}';
  document.head.appendChild(s);
}

/* ---------- 共用 ---------- */
var GAMES = [
  {k:'fall',   ic:'↓',  n:'漢字往下掉',   d:'漢字掉到底之前，打出拼音和聲調'},
  {k:'mole',   ic:'ˇ',  n:'聲調打地鼠',   d:'地鼠冒出來，按對聲調把它打下去'},
  {k:'flip',   ic:'?',  n:'拼音配對翻牌', d:'翻兩張牌，把漢字和它的拼音配成一對'},
  {k:'quiz',   ic:'⚡', n:'拼音選擇搶答', d:'四個很像的拼音，越快選對分數越高'},
  {k:'puzzle', ic:'ü',  n:'拼音拼字拼圖', d:'把打亂的字母排回去，再選聲調'}
];
function best(k){ var r = A.me.rec; if (!r) return 0; if (k === 'fall') return r.game_best || 0; return (r.gbest && r.gbest[k]) || 0; }
function words(max){
  var seen = {}, out = [];
  A.pool().forEach(function(it){ if (!it || it.sent || seen[it.h] || it.syls.length > (max || 4)) return; seen[it.h] = 1; out.push(it); });
  return out;
}
function bar(title, right){
  return '<div class="gbar"><button class="btn gback" type="button" data-g="home">← 換遊戲</button><b style="font-family:var(--ui);font-size:17px">' + e(title) + '</b><span class="sp"></span>' + (right || '') + '</div>';
}
function empty(msg){ stage().innerHTML = bar('') + '<p class="tip center" style="margin:auto">' + e(msg || '這裡的題目不夠玩這個遊戲，換一個題目再試試。') + '</p>'; wire(); }
function wire(){ var b = stage().querySelector('[data-g="home"]'); if (b) b.onclick = function(){ stop(); try { A.stopFall(); } catch(x){} home(); }; }
function note(t){ var n = $('#saveNote'); if (n) n.textContent = t; }
async function save(key, score, miss, hit){
  var me = A.me;
  if (!me.student || !me.uid || !window.DB || DB.mode !== 'firebase'){ note(me.teacher ? '老師帳號試玩，不存成績' : ''); return; }
  var rec = me.rec || A.emptyRec(); rec.wrong = rec.wrong || {}; rec.gbest = rec.gbest || {};
  rec.gbest[key] = Math.max(rec.gbest[key] || 0, score); rec.game_n = (rec.game_n || 0) + 1;
  miss.forEach(function(i){ rec.wrong[i.h] = (rec.wrong[i.h] || 0) + 1; });
  A.reviewUpdate(rec, miss.map(function(it){ return {it:it, ok:false}; }).concat(hit.map(function(it){ return {it:it, ok:true}; })), A.st.level === 'review');
  me.rec = rec;
  note('正在儲存成績…');
  try {
    var gb = Math.max.apply(null, [rec.game_best || 0].concat(Object.keys(rec.gbest).map(function(k){ return rec.gbest[k] || 0; })));
    await DB.upsertResult('__pinyin__', me.student.id, {uid:me.uid, kind:'pinyin', student_name:me.student.name || '', rec:JSON.parse(JSON.stringify(rec)), game_best:gb, game_n:rec.game_n, last_at:new Date().toISOString()});
    note('成績已儲存，老師看得到');
  } catch(x){ note('成績沒存進去，請檢查網路'); }
}
function over(key, title, score, line, miss, hit){
  stop();
  var old = best(key);
  var ms = []; var seen = {}; miss.forEach(function(i){ if (!seen[i.h]){ seen[i.h] = 1; ms.push(i); } });
  stage().innerHTML = bar(title) + '<div class="gmid"><b style="font-size:22px">遊戲結束</b><div class="big">' + score + '<small> 分</small></div>'
    + '<p class="tip">' + e(line) + (score > old && score > 0 ? '，新的最高分！' : (old ? '，最高分 ' + old : '')) + '</p>'
    + (ms.length ? '<p class="tip">這幾個再看一次：</p><div class="wronglist">' + ms.map(function(i){ return '<div><b>' + e(i.h) + '</b><span>' + A.answerHTML(i) + '</span></div>'; }).join('') + '</div>' : '')
    + '<p class="save" id="saveNote"></p><button class="btn primary" type="button" id="gagain2">再玩一次</button></div>';
  wire();
  $('#gagain2').onclick = function(){ render(); };
  save(key, score, miss, hit);
}
function intro(title, text, go){
  stage().innerHTML = bar(title, best(curKey()) ? '<span>最高分 <b>' + best(curKey()) + '</b></span>' : '')
    + '<div class="gmid" style="margin:auto"><p style="margin:0;max-width:30em">' + e(text) + '</p><button class="btn primary" type="button" id="gstart2">開始</button></div>';
  wire(); $('#gstart2').onclick = go;
}
function curKey(){ return A.st.game || ''; }

/* ---------- 選遊戲 ---------- */
function home(){
  stop(); css(); A.st.game = '';
  $('#cheat').hidden = true;
  stage().innerHTML = '<p class="tip" style="margin:0">選一個遊戲。題目用上面選的那一組。</p><div class="gpick">'
    + GAMES.map(function(g){ var b = best(g.k); return '<button type="button" class="gcard" data-k="' + g.k + '"><span class="gi">' + e(g.ic) + '</span><b>' + e(g.n) + '</b><span>' + e(g.d) + '</span>' + (b ? '<em>最高分 ' + b + '</em>' : '') + '</button>'; }).join('')
    + '</div>';
  stage().querySelectorAll('.gcard').forEach(function(c){ c.onclick = function(){ A.st.game = c.getAttribute('data-k'); render(); }; });
}
function render(){
  if (!api()) return;
  stop(); css();
  var k = A.st.game;
  if (!k) return home();
  if (k === 'fall'){ A.renderFall(); return; }
  $('#cheat').hidden = true;
  if (k === 'mole') return mole();
  if (k === 'flip') return flip();
  if (k === 'quiz') return quiz();
  if (k === 'puzzle') return puzzle();
  home();
}

/* ---------- 1. 聲調打地鼠 ---------- */
function moleItems(){
  var out = [], seen = {};
  A.pool().forEach(function(it){
    var cs = Array.from(it.h); if (cs.length !== it.syls.length) return;
    cs.forEach(function(c, i){ if (!/[㐀-鿿]/.test(c)) return; var s = it.syls[i], key = c + s.base + s.tone; if (seen[key]) return; seen[key] = 1; out.push({c:c, base:s.base, tone:s.tone, it:it}); });
  });
  return out;
}
function mole(){
  var items = moleItems();
  if (items.length < 3) return empty();
  intro('聲調打地鼠', '地鼠頭上有一個字和它的拼音（沒有聲調）。在地鼠躲回去之前，按下正確的聲調。也可以用鍵盤的 1、2、3、4、5（5 是輕聲）。一共 60 秒。', function(){ moleRun(items); });
}
function moleRun(items){
  var G = {score:0, combo:0, hits:0, miss:[], hit:[], left:60, act:null, next:Date.now() + 600, bag:[]};
  stage().innerHTML = bar('聲調打地鼠', '<span>時間 <b id="mt">60</b></span><span>分數 <b id="ms">0</b></span>')
    + '<div class="holes">' + [0,1,2,3,4,5,6,7,8].map(function(i){ return '<div class="hole" data-i="' + i + '"><div class="mole"><b></b><small></small></div></div>'; }).join('') + '</div>'
    + '<div class="gfb center" id="mf"></div>'
    + '<div class="tones">' + TB.map(function(t, i){ return '<button type="button" data-t="' + (i + 1) + '" class="' + (i === 4 ? 'q' : '') + '" aria-label="' + TN[i] + '">' + t + '<small>' + (i + 1) + '</small></button>'; }).join('') + '</div>';
  wire();
  var holes = stage().querySelectorAll('.hole'), t0 = Date.now();
  function pick(){ if (!G.bag.length) G.bag = A.shuffle(items); return G.bag.pop(); }
  function clear(h){ later(function(){ h.classList.remove('up', 'ok', 'no'); }, 380); }
  function fb(html){ var f = $('#mf'); if (f) f.innerHTML = html; }
  function spawn(){
    var free = Array.prototype.filter.call(holes, function(h){ return !h.classList.contains('up'); });
    var h = free[Math.floor(Math.random() * free.length)], it = pick();
    h.querySelector('b').textContent = it.c; h.querySelector('small').textContent = it.base;
    h.classList.remove('ok', 'no'); h.classList.add('up');
    G.act = {h:h, it:it, until:Date.now() + Math.max(1300, 2900 - G.hits * 70)};
  }
  function answer(t){
    var a = G.act; if (!a) return; G.act = null; G.next = Date.now() + 450;
    if (t === a.it.tone){
      G.hits++; G.combo++; G.score += 10 + (G.combo >= 3 ? 5 : 0); G.hit.push(a.it.it);
      a.h.classList.add('ok'); fb('<span class="py">' + e(a.it.c) + ' ' + A.markSyl(a.it.base, a.it.tone) + '</span>' + (G.combo >= 3 ? '　連續 ' + G.combo + ' 個！' : ''));
    } else {
      G.combo = 0; G.miss.push(a.it.it); a.h.classList.add('no');
      fb('<span style="color:var(--bad)">' + e(a.it.c) + ' 是 <span class="py">' + A.markSyl(a.it.base, a.it.tone) + '</span>（' + TN[a.it.tone - 1] + '）</span>');
    }
    $('#ms').textContent = G.score; clear(a.h);
  }
  stage().querySelectorAll('.tones button').forEach(function(b){ b.onclick = function(){ answer(+b.getAttribute('data-t')); }; });
  T.key = function(ev){ if (/^[1-5]$/.test(ev.key)){ ev.preventDefault(); answer(+ev.key); } };
  document.addEventListener('keydown', T.key);
  T.iv = setInterval(function(){
    if (!document.body.contains(holes[0])){ stop(); return; }
    var now = Date.now(), left = Math.max(0, 60 - Math.floor((now - t0) / 1000));
    if (left !== G.left){ G.left = left; $('#mt').textContent = left; }
    if (left <= 0){ over('mole', '聲調打地鼠', G.score, '打中 ' + G.hits + ' 隻', G.miss, G.hit); return; }
    if (G.act && now > G.act.until){ var a = G.act; G.act = null; G.combo = 0; G.miss.push(a.it.it); a.h.classList.add('no'); fb('<span style="color:var(--bad)">跑掉了：' + e(a.it.c) + ' <span class="py">' + A.markSyl(a.it.base, a.it.tone) + '</span></span>'); clear(a.h); G.next = now + 450; }
    if (!G.act && now >= G.next) spawn();
  }, 100);
}

/* ---------- 2. 拼音配對翻牌 ---------- */
function flip(){
  var ws = words(4);
  if (ws.length < 3) return empty();
  intro('拼音配對翻牌', '牌的一半是漢字，一半是拼音。一次翻兩張，漢字和它的拼音就配成一對。翻的次數越少，分數越高。', function(){ flipRun(A.shuffle(ws).slice(0, 6)); });
}
function flipRun(ws){
  var cards = [];
  ws.forEach(function(it, i){ cards.push({i:i, t:'h', s:it.h}); cards.push({i:i, t:'p', s:A.answerHTML(it)}); });
  cards = A.shuffle(cards);
  var open = [], done = 0, moves = 0, lock = false, t0 = Date.now();
  stage().innerHTML = bar('拼音配對翻牌', '<span>翻了 <b id="fm">0</b> 次</span>')
    + '<div class="flip">' + cards.map(function(c, k){ return '<button type="button" class="fc" data-k="' + k + '" aria-label="翻牌"><span hidden class="' + c.t + '">' + (c.t === 'h' ? e(c.s) : c.s) + '</span></button>'; }).join('') + '</div>';
  wire();
  var els = stage().querySelectorAll('.fc');
  function show(el, on){ el.classList.toggle('open', on); el.firstChild.hidden = !on; }
  els.forEach(function(el){ el.onclick = function(){
    if (lock || el.classList.contains('open') || el.classList.contains('done')) return;
    show(el, true); open.push(el);
    if (open.length < 2) return;
    moves++; $('#fm').textContent = moves;
    var a = cards[+open[0].getAttribute('data-k')], b = cards[+open[1].getAttribute('data-k')];
    if (a.i === b.i && a.t !== b.t){
      open.forEach(function(x){ x.classList.add('done'); }); open = []; done++;
      if (done === ws.length){
        var secs = Math.round((Date.now() - t0) / 1000), score = Math.max(10, 100 - (moves - ws.length) * 6);
        later(function(){ over('flip', '拼音配對翻牌', score, ws.length + ' 對全部配好，翻了 ' + moves + ' 次、花了 ' + secs + ' 秒', [], ws); }, 600);
      }
    } else {
      lock = true;
      later(function(){ open.forEach(function(x){ show(x, false); }); open = []; lock = false; }, 900);
    }
  }; });
}

/* ---------- 3. 拼音選擇搶答 ---------- */
var SW = [['zh','z'],['ch','c'],['sh','s'],['b','p'],['d','t'],['g','k'],['j','q'],['n','l']];
function swapInit(b){
  for (var i = 0; i < SW.length; i++){
    var x = SW[i][0], y = SW[i][1];
    if (b.indexOf(x) === 0 && !(x.length === 1 && /^[zcs]h/.test(b))) return y + b.slice(x.length);
    if (b.indexOf(y) === 0 && !(y.length === 1 && /^[zcs]h/.test(b))) return x + b.slice(y.length);
  }
  return null;
}
function variants(s){
  var out = [];
  [1,2,3,4,5].forEach(function(t){ if (t !== s.tone) out.push({base:s.base, tone:t}); });
  var b = swapInit(s.base); if (b) out.push({base:b, tone:s.tone});
  if (/ng$/.test(s.base)) out.push({base:s.base.slice(0, -1), tone:s.tone}); else if (/n$/.test(s.base)) out.push({base:s.base + 'g', tone:s.tone});
  return out;
}
function options(it){
  var right = word(it.syls), pool = {};
  it.syls.forEach(function(s, i){ variants(s).forEach(function(v){ var c = it.syls.slice(); c[i] = v; var w = word(c); if (w !== right) pool[w] = 1; }); });
  var ds = A.shuffle(Object.keys(pool)).slice(0, 3);
  return A.shuffle(ds.concat([right]));
}
function quiz(){
  var ws = words(4);
  if (ws.length < 4) return empty();
  intro('拼音選擇搶答', '看漢字，從四個很像的拼音裡選出對的那一個。每題 8 秒，越快答對分數越高。一共 10 題。', function(){ quizRun(A.shuffle(ws).slice(0, 10)); });
}
function quizRun(qs){
  var G = {i:0, score:0, right:0, miss:[], hit:[]};
  function q(){
    if (G.i >= qs.length){ over('quiz', '拼音選擇搶答', G.score, '答對 ' + G.right + ' / ' + qs.length + ' 題', G.miss, G.hit); return; }
    var it = qs[G.i], right = word(it.syls), opts = options(it), t0 = Date.now(), done = false;
    stage().innerHTML = bar('拼音選擇搶答', '<span>第 <b>' + (G.i + 1) + '</b> / ' + qs.length + ' 題</span><span>分數 <b>' + G.score + '</b></span>')
      + '<div class="tbar"><i id="qt" style="width:100%"></i></div>'
      + '<div class="hanzi' + (it.h.length > 4 ? ' long' : '') + '">' + e(it.h) + '</div>'
      + '<div class="qopts">' + opts.map(function(o){ return '<button type="button">' + e(o) + '</button>'; }).join('') + '</div>';
    wire();
    var bs = stage().querySelectorAll('.qopts button');
    function finish(pick){
      if (done) return; done = true; clearInterval(T.iv);
      var ok = pick === right;
      bs.forEach(function(b){ if (b.textContent === right) b.classList.add('right'); else if (b.textContent === pick) b.classList.add('wrong'); b.disabled = true; });
      if (ok){ G.right++; G.hit.push(it); G.score += 10 + Math.max(0, Math.round(8 - (Date.now() - t0) / 1000)); } else G.miss.push(it);
      G.i++; later(q, ok ? 700 : 1500);
    }
    bs.forEach(function(b){ b.onclick = function(){ finish(b.textContent); }; });
    T.iv = setInterval(function(){
      var el = $('#qt'); if (!el){ stop(); return; }
      var r = 1 - (Date.now() - t0) / 8000; el.style.width = Math.max(0, r * 100) + '%';
      if (r <= 0) finish(null);
    }, 100);
  }
  q();
}

/* ---------- 4. 拼音拼字拼圖 ---------- */
function puzzle(){
  var ws = words(3).filter(function(it){ return it.syls.reduce(function(n, s){ return n + s.base.length; }, 0) <= 14; });
  if (ws.length < 2) return empty();
  intro('拼音拼字拼圖', '看漢字，把下面打亂的字母照順序點上去；字母都對了，再幫每個音節選聲調。一共 8 題，錯越少分數越高。', function(){ puzzleRun(A.shuffle(ws).slice(0, 8)); });
}
function puzzleRun(qs){
  var G = {i:0, score:0, miss:[], hit:[]};
  function q(){
    if (G.i >= qs.length){ over('puzzle', '拼音拼字拼圖', G.score, '拼完 ' + qs.length + ' 題', G.miss, G.hit); return; }
    var it = qs[G.i], letters = [], mist = 0;
    it.syls.forEach(function(s, si){ Array.from(s.base).forEach(function(ch){ letters.push({ch:ch, si:si}); }); });
    var tiles = letters.map(function(l, k){ return {ch:l.ch, k:k}; });
    var tries = 0; do { tiles = A.shuffle(tiles); tries++; } while (tries < 8 && tiles.length > 1 && tiles.map(function(t){ return t.ch; }).join('') === letters.map(function(l){ return l.ch; }).join(''));
    var slots = letters.map(function(){ return null; });
    function draw(){
      var html = '', idx = 0;
      it.syls.forEach(function(s, si){
        if (si) html += '<span class="slot gap"></span>';
        Array.from(s.base).forEach(function(){ var t = slots[idx]; html += '<span class="slot' + (t ? ' f' : '') + '" data-s="' + idx + '">' + (t ? e(t.ch) : '') + '</span>'; idx++; });
      });
      stage().innerHTML = bar('拼音拼字拼圖', '<span>第 <b>' + (G.i + 1) + '</b> / ' + qs.length + ' 題</span><span>分數 <b>' + G.score + '</b></span>')
        + '<div class="hanzi' + (it.h.length > 4 ? ' long' : '') + '">' + e(it.h) + '</div>'
        + '<div class="slots">' + html + '</div>'
        + '<div class="tiles">' + tiles.map(function(t, k){ var used = slots.some(function(x){ return x && x.k === t.k; }); return '<button type="button" class="tile' + (used ? ' used' : '') + '" data-t="' + k + '">' + e(t.ch) + '</button>'; }).join('') + '</div>'
        + '<p class="tip center">點字母放上去，點上面的格子可以拿回來</p>';
      wire();
      stage().querySelectorAll('.tile').forEach(function(b){ b.onclick = function(){ var t = tiles[+b.getAttribute('data-t')]; var at = slots.indexOf(null); if (at < 0) return; slots[at] = t; draw(); check(); }; });
      stage().querySelectorAll('.slot[data-s]').forEach(function(b){ b.onclick = function(){ var k = +b.getAttribute('data-s'); if (slots[k]){ slots[k] = null; draw(); } }; });
    }
    function check(){
      if (slots.indexOf(null) >= 0) return;
      var bad = slots.map(function(t, k){ return t.ch !== letters[k].ch; });
      if (!bad.some(Boolean)){ tones(); return; }
      mist++;
      stage().querySelectorAll('.slot[data-s]').forEach(function(el){ if (bad[+el.getAttribute('data-s')]) el.classList.add('bad'); });
      later(function(){ slots = slots.map(function(t, k){ return bad[k] ? null : t; }); draw(); }, 800);
    }
    function tones(){
      var pick = it.syls.map(function(){ return 0; });
      function d2(badMark){
        stage().innerHTML = bar('拼音拼字拼圖', '<span>第 <b>' + (G.i + 1) + '</b> / ' + qs.length + ' 題</span><span>分數 <b>' + G.score + '</b></span>')
          + '<div class="hanzi' + (it.h.length > 4 ? ' long' : '') + '">' + e(it.h) + '</div>'
          + '<p class="tip center" style="margin:0">字母對了！現在選每個音節的聲調</p>'
          + '<div class="sylsel">' + it.syls.map(function(s, si){ return '<div class="sylbox' + (badMark && badMark[si] ? ' bad' : '') + '"><span class="w">' + (pick[si] ? A.markSyl(s.base, pick[si]) : e(s.base)) + '</span><div class="tb">'
            + TB.map(function(t, ti){ return '<button type="button" data-si="' + si + '" data-t="' + (ti + 1) + '" class="' + (ti === 4 ? 'q' : '') + '" aria-label="' + TN[ti] + '" aria-pressed="' + (pick[si] === ti + 1) + '">' + t + '</button>'; }).join('') + '</div></div>'; }).join('') + '</div>'
          + '<div class="acts" style="justify-content:center"><button class="btn primary" type="button" id="pzok">確定</button></div>';
        wire();
        stage().querySelectorAll('.sylbox .tb button').forEach(function(b){ b.onclick = function(){ pick[+b.getAttribute('data-si')] = +b.getAttribute('data-t'); d2(); }; });
        $('#pzok').onclick = function(){
          if (pick.indexOf(0) >= 0) return;
          var bad = it.syls.map(function(s, si){ return pick[si] !== s.tone && pick[si] !== s.alt; });
          if (bad.some(Boolean)){ mist++; d2(bad); return; }
          G.score += Math.max(2, 10 - mist * 2);
          if (mist) G.miss.push(it); else G.hit.push(it);
          stage().querySelector('.sylsel').insertAdjacentHTML('afterend', '<p class="center" style="color:var(--good);font-weight:700;margin:0">' + A.answerHTML(it) + '</p>');
          G.i++; later(q, 800);
        };
      }
      d2();
    }
    draw();
  }
  q();
}

window.PYGAMES = { render:render, home:home, stop:stop };
})();
