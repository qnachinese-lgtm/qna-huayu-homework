/* ══════ HWHUB_V1 派作業：一個入口、一個名稱 ══════
   Quinn：「太亂了，請統一一種就好」，選了「一個入口、一個名稱」。
   老師後台「教學」選單最上面多一個「📝 派作業」：九種作業都從這裡出。
   選了種類以後，還是走那一種原本的指派視窗（選學生、截止日），程式不重寫，
   已經派出去的作業、學生的作答和成績都不動。
   同一個視窗下面列出「還沒交的作業」（跟今日總覽同一份），再加上拼音作業。
   由 db.js 最後面的 HWHUB_LOADER 自動載入，teacher.html／teacher-app.js 不用改。 */
(function(){
'use strict';
if (window.__HWHUB__) return; window.__HWHUB__ = true;
if (!/\/teacher(\.html)?$/.test(location.pathname)) return;

/* HWHUB_V2 Quinn：「請你統一一個按鈕就好，不用的請先收起來」。
   各頁原本各自的出作業按鈕先藏起來（不刪，要恢復把 HIDE_OLD 改成 false）。
   只藏畫面上的按鈕；「派作業」打開的那幾個視窗（在 #modal-root 裡）照常可以按。 */
var HIDE_OLD = true;
if (HIDE_OLD && !document.getElementById('hwh-hide')){
  var OLD = ['assign','assignWb','newQuiz','lqpNew','fhNew','hzNew','hzPickKind','gtNew','wtNew'];
  var hs = document.createElement('style'); hs.id = 'hwh-hide';
  hs.textContent = OLD.map(function(k){ return '[data-act="' + k + '"]:not(#modal-root [data-act])'; }).join(',')
    + ',' + OLD.map(function(k){ return '[data-act="lcmGo"][data-id^="' + k + '::"]'; }).join(',') + '{display:none!important}';
  (document.head || document.documentElement).appendChild(hs);
}

function e(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function st(){ try { return (typeof S !== 'undefined' && S) ? S : {}; } catch(x){ return {}; } }
function hasH(){ try { return typeof H !== 'undefined' && H; } catch(x){ return false; } }
function call(n, a){
  try { if (hasH() && typeof H[n] === 'function'){ H[n](a); return true; } } catch(x){ try { toast('打不開：' + ((x && x.message) || x)); } catch(y){} return false; }
  try { toast('這個功能找不到，請從原本的位置進去'); } catch(y){}
  return false;
}
function lesName(l){ var tb = String(l.textbook || '').trim(), ti = String(l.title || '').trim(); return (tb ? tb + '・' : '') + (ti || (l.order_index ? '第' + l.order_index + '課' : '課')); }
function lessons(){
  return (st().lessons || []).filter(function(l){ return l && !l.kind && !l.deleted_at; }).slice()
    .sort(function(a, b){ return String(a.textbook || '').localeCompare(String(b.textbook || '')) || (Number(a.order_index) || 0) - (Number(b.order_index) || 0); })
    .map(function(l){ return [l.id, lesName(l)]; });
}
var TYPES = [
  {k:'les',  ic:'📖', t:'課文',     d:'選一課，學生寫那一課的練習題。交了要你批改。', pick:lessons, go:'assign'},
  {k:'wb',   ic:'📒', t:'作業簿',   d:'選一份作業簿。交了要你批改。', pick:function(){ return (st().workbooks || []).filter(function(w){ return w && !w.deleted_at; }).map(function(w){ return [w.id, w.title || '作業簿']; }); }, go:'assignWb'},
  {k:'quiz', ic:'🎧', t:'聽寫',     d:'選一課的生詞做聽寫。交了要你批改。', go:'newQuiz'},
  {k:'lqp',  ic:'☑️', t:'選擇題',   d:'從題庫出選擇題，系統自己對答案。', pick:function(){ return (st().livequizzes || []).filter(function(q){ return q && !q.deleted_at; }).map(function(q){ return [q.id, q.title || '題庫']; }); }, go:'lqpNew'},
  {k:'fh',   ic:'✍️', t:'自由回答', d:'你寫題目，學生打字、拍照或錄音回答。交了要你批改。', go:'fhNew'},
  {k:'hz',   ic:'🀄', t:'漢字闖關', d:'指定關卡和星星數，達到就自動完成。', go:'hzNew'},
  {k:'wt',   ic:'🖊️', t:'寫字',     d:'指定字和要寫幾次，寫滿就自動完成。', go:'wtNew'},
  {k:'gt',   ic:'🃏', t:'翻牌配對', d:'用課本生詞玩翻牌，玩完一輪就完成。', go:'gtNew'},
  {k:'py',   ic:'ā',  t:'拼音',     d:'看漢字打拼音，寫完一輪就完成。', url:'pinyin.html#tasks'}
];
function css(){
  if (document.getElementById('hwh-css')) return;
  var s = document.createElement('style'); s.id = 'hwh-css';
  s.textContent = '.hwh-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px}'
    + '.hwh-t{display:flex;gap:10px;align-items:flex-start;text-align:left;border:1px solid var(--line-strong,#C0CEE0);background:var(--surface,#fff);border-radius:12px;padding:10px 12px;cursor:pointer;font:inherit;color:inherit}'
    + '.hwh-t:hover,.hwh-t.on{border-color:var(--primary,#1E4C86);background:var(--primary-soft,#E4EDF9)}'
    + '.hwh-ic{font-size:22px;width:28px;text-align:center;flex:none;line-height:1.2;font-family:"Times New Roman",Times,serif}'
    + '.hwh-t small{display:block;color:var(--muted,#5B6B80);font-size:12.5px;line-height:1.45;margin-top:2px}'
    + '.hwh-pk{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:12px;padding:10px 12px;background:var(--primary-soft,#E4EDF9);border-radius:12px}'
    + '.hwh-pk select{flex:1;min-width:200px;max-width:100%;font:inherit;padding:6px 8px;border-radius:8px;border:1px solid var(--line-strong,#C0CEE0);background:var(--surface,#fff);color:inherit}'
    + '.hwh-sum{font-size:13.5px;color:var(--muted,#5B6B80);margin:0 0 6px}.hwh-sum .ov{color:#A33227}'
    + '.hwh-stu{border-top:1px solid var(--line,#DCE5F0);padding:10px 0}'
    + '.hwh-sh{display:flex;gap:10px;align-items:baseline;margin-bottom:6px}.hwh-sh span{font-size:12.5px;color:var(--muted,#5B6B80)}'
    + '.hwh-row{display:grid;grid-template-columns:92px 78px minmax(0,1fr);gap:10px;align-items:center;font-size:14px;line-height:1.5;padding:3px 0}'
    + '.hwh-d{font-size:12.5px;color:var(--muted,#5B6B80);white-space:nowrap}.hwh-d.over{color:#A33227;font-weight:700}.hwh-d.soon{color:var(--primary,#1E4C86);font-weight:700}'
    + '.hwh-k{font-size:12px;line-height:1.6;text-align:center;border-radius:999px;background:var(--surface-2,#E8EFF7);color:var(--primary,#1E4C86);padding:0 8px;white-space:nowrap}'
    + '.hwh-w{min-width:0;overflow-wrap:anywhere}.hwh-w small{color:var(--muted,#5B6B80);margin-left:4px}'
    + '.hwh-names{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 4px}'
    + '.hwh-nm{font:inherit;font-size:14px;border:1px solid var(--line-strong,#C0CEE0);background:var(--surface,#fff);color:inherit;border-radius:999px;padding:3px 10px;cursor:pointer}'
    + '.hwh-nm span{font-size:12px;color:var(--muted,#5B6B80);margin-left:4px}.hwh-nm.ov span{color:#A33227;font-weight:700}'
    + '.hwh-nm.on{border-color:var(--primary,#1E4C86);background:var(--primary,#1E4C86);color:#fff}.hwh-nm.on span{color:#fff}';
  document.head.appendChild(s);
}
/* 還沒交的作業：平台原本那份（hwPending）＋拼音作業，用同一種排法列出來，種類用「派作業」的名字 */
var KN = {'課文練習':'課文','隨堂小考':'聽寫','漢字遊戲':'漢字闖關','寫字作業':'寫字','翻牌配對':'翻牌配對','作業簿':'作業簿'};
function daysTo(d){ try { if (typeof hwDaysTo === 'function') return hwDaysTo(d); } catch(x){} if (!d) return null; var a = new Date(); a.setHours(0,0,0,0); var b = new Date(d); b.setHours(0,0,0,0); return isNaN(b) ? null : Math.round((b - a) / 864e5); }
function dueLab(n){ if (n == null) return ['未設截止日', '']; if (n < 0) return ['逾期 ' + (-n) + ' 天', 'over']; if (n === 0) return ['今天到期', 'soon']; return ['還有 ' + n + ' 天', n <= 7 ? 'soon' : '']; }
function renderDue(){
  var box = document.getElementById('hwh-due'); if (!box) return;
  var list = []; try { list = (typeof hwPending === 'function') ? hwPending() : []; } catch(x){}
  list = list.map(function(x){ return {sid:x.sid, name:x.name || '', kind:KN[x.kind] || x.kind, what:x.what || '', days:x.days, draft:!!x.draft}; });
  var sel = '';
  box.addEventListener('click', function(ev){ var b = ev.target.closest && ev.target.closest('[data-hwh-sid]'); if (!b) return; var v = b.getAttribute('data-hwh-sid'); sel = (sel === v) ? '' : v; draw(); });
  function draw(){
    if (!document.getElementById('hwh-due')) return;
    if (!list.length){ box.innerHTML = '<div class="hint">每一位學生的作業都交齊了。</div>'; return; }
    var over = list.filter(function(x){ return x.days != null && x.days < 0; }).length;
    var soon = list.filter(function(x){ return x.days != null && x.days >= 0 && x.days <= 7; }).length;
    var by = {}, order = [];
    list.forEach(function(x){ if (!by[x.sid]){ by[x.sid] = []; order.push(x.sid); } by[x.sid].push(x); });
    var rank = function(x){ return x.days == null ? 1e6 : x.days; };
    order.sort(function(a, b){ var ma = Math.min.apply(null, by[a].map(rank)), mb = Math.min.apply(null, by[b].map(rank)); return ma - mb || String(by[a][0].name).localeCompare(String(by[b][0].name)); });
    box.innerHTML = '<div class="hwh-sum">全部未交 <b>' + list.length + '</b> 份　・　逾期 <b class="ov">' + over + '</b>　・　七天內到期 <b class="ov">' + soon + '</b></div>'
      + '<div class="hwh-names">' + order.map(function(sid){ var its = by[sid], ov = its.some(function(x){ return x.days != null && x.days < 0; });
          return '<button type="button" class="hwh-nm' + (ov ? ' ov' : '') + (sid === sel ? ' on' : '') + '" data-hwh-sid="' + e(sid) + '">' + e(its[0].name) + '<span>' + its.length + '</span></button>'; }).join('') + '</div>'
      + (sel && by[sel] ? '' : '<div class="hint" style="margin-top:6px">點學生的名字，看他還沒交哪些。</div>')
      + order.filter(function(sid){ return sid === sel; }).map(function(sid){
        var its = by[sid].slice().sort(function(a, b){ return rank(a) - rank(b); });
        return '<div class="hwh-stu"><div class="hwh-sh"><b>' + e(its[0].name) + '</b><span>' + its.length + ' 份未交</span></div>'
          + its.map(function(x){ var d = dueLab(x.days); return '<div class="hwh-row"><span class="hwh-d ' + d[1] + '">' + d[0] + '</span><span class="hwh-k">' + e(x.kind) + '</span><span class="hwh-w">' + e(x.what) + (x.draft ? '<small>寫到一半</small>' : '') + '</span></div>'; }).join('')
          + '</div>';
      }).join('');
  }
  draw();
  /* 拼音作業存在 site/pinyin 的 tasks，學生的紀錄是 results 裡 kind:pinyin 那一筆 */
  try {
    firebase.firestore().collection('site').doc('pinyin').get().then(function(d){
      var tasks = ((d.exists && d.data().tasks) || []).filter(function(t){ return t && !t.deleted_at; });
      var docs = window.__PY_DOCS || [];
      var stu = (st().students || []).filter(function(s){ return s && !s.deleted_at && !s.is_test; });
      tasks.forEach(function(t){
        var g = t.assigned_groups || [];
        stu.forEach(function(s){
          if (!((t.assigned_ids || []).indexOf(s.id) >= 0 || (Array.isArray(s.groups) && s.groups.some(function(x){ return g.indexOf(x) >= 0; })))) return;
          var r = docs.filter(function(x){ return x && x.student_id === s.id; })[0];
          if (r && r.rec && r.rec.tasks && r.rec.tasks[t.id]) return;
          list.push({sid:s.id, name:s.name || '', kind:'拼音', what:t.title || '拼音作業', days:daysTo(t.due), draft:false});
        });
      });
      draw();
    }).catch(function(){});
  } catch(x){}
}
function open(){
  css();
  var types = TYPES.map(function(x){ return '<button type="button" class="hwh-t" data-act="hwhubType" data-id="' + x.k + '"><span class="hwh-ic">' + e(x.ic) + '</span><span><b>' + e(x.t) + '</b><small>' + e(x.d) + '</small></span></button>'; }).join('');
  openModal('<div class="modal modal-tall"><div class="modal-head"><h3>📝 派作業</h3><button class="x" data-act="closeModal">×</button></div><div class="modal-body">'
    + '<p class="hint" style="margin:0 0 10px">先選一種，再選學生和截止日。不管哪一種，學生那邊都出現在「待完成」清單。</p>'
    + '<div class="hwh-grid">' + types + '</div><div id="hwh-pick"></div>'
    + '<div style="margin-top:16px;text-align:right"><button type="button" class="btn btn-sm" data-act="hwhubDue">📋 看還沒交的作業</button></div></div></div>');
}
/* HWHUB_V4 Quinn：「這邊可以變成一個獨立的視窗」——還沒交的作業自己一個視窗，選學生名字才列出他的作業 */
function openDue(){
  css();
  openModal('<div class="modal modal-tall"><div class="modal-head"><h3>📋 還沒交的作業</h3><button class="x" data-act="closeModal">×</button></div><div class="modal-body"><div id="hwh-due"></div></div></div>');
  renderDue();
}
if (hasH()){
  H.hwhubOpen = open;
  H.hwhubDue = openDue;
  H.hwhubType = function(k){
    var x = TYPES.filter(function(t){ return t.k === k; })[0]; if (!x) return;
    document.querySelectorAll('.hwh-t').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-id') === k); });
    if (x.url){ closeModal(); window.open(x.url, '_blank', 'noopener'); return; }
    if (x.pick){
      var box = document.getElementById('hwh-pick'); if (!box) return;
      var opts = x.pick();
      if (!opts.length){ box.innerHTML = '<div class="hint" style="margin-top:10px">還沒有可以選的' + e(x.t) + '。</div>'; return; }
      box.innerHTML = '<div class="hwh-pk"><b>' + e(x.t) + '：選哪一個？</b><select id="hwh-sel">' + opts.map(function(o){ return '<option value="' + e(o[0]) + '">' + e(o[1]) + '</option>'; }).join('') + '</select>'
        + '<button class="btn btn-primary btn-sm" data-act="hwhubNext" data-id="' + x.k + '">下一步：選學生</button></div>';
      try { box.scrollIntoView({block:'nearest'}); } catch(y){}
      return;
    }
    closeModal(); call(x.go);
  };
  H.hwhubNext = function(k){
    var x = TYPES.filter(function(t){ return t.k === k; })[0], s = document.getElementById('hwh-sel'); if (!x || !s) return;
    var v = s.value; closeModal(); call(x.go, v);
  };
}
/* 「教學」選單最上面放「📝 派作業」 */
function addMenu(){
  try {
    document.querySelectorAll('#tnav .tn-p').forEach(function(p){
      if (p.querySelector('[data-hwhub]') || !p.querySelector('button[data-id="lessons"]')) return;
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-hwhub', '1');
      b.innerHTML = '📝 <b>派作業</b>';
      b.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); try { document.querySelectorAll('#tnav .tn-i.open').forEach(function(i){ i.classList.remove('open'); }); } catch(y){} open(); });
      p.insertBefore(b, p.firstChild);
      var d = document.createElement('button'); d.type = 'button'; d.setAttribute('data-hwhub-due', '1');
      d.innerHTML = '📋 還沒交的作業';
      d.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); try { document.querySelectorAll('#tnav .tn-i.open').forEach(function(i){ i.classList.remove('open'); }); } catch(y){} openDue(); });
      b.insertAdjacentElement('afterend', d);
    });
  } catch(x){}
}
addMenu();
try { new MutationObserver(function(){ addMenu(); }).observe(document.body, {childList:true, subtree:true}); } catch(x){}
})();
