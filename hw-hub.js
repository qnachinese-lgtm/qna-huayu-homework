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
    + '.hwh-py{font-size:13px;margin:4px 0}';
  document.head.appendChild(s);
}
/* 拼音作業還沒交的（拼音作業存在 site/pinyin 的 tasks，學生的紀錄是 results 裡 kind:pinyin 那一筆） */
function pyPending(){
  var box = document.getElementById('hwh-py'); if (!box) return;
  try {
    firebase.firestore().collection('site').doc('pinyin').get().then(function(d){
      var tasks = ((d.exists && d.data().tasks) || []).filter(function(t){ return t && !t.deleted_at; });
      var docs = window.__PY_DOCS || [];
      var stu = (st().students || []).filter(function(s){ return s && !s.deleted_at && !s.is_test; });
      var lines = tasks.map(function(t){
        var g = t.assigned_groups || [];
        var who = stu.filter(function(s){ return (t.assigned_ids || []).indexOf(s.id) >= 0 || (Array.isArray(s.groups) && s.groups.some(function(x){ return g.indexOf(x) >= 0; })); });
        var left = who.filter(function(s){ var r = docs.filter(function(x){ return x && x.student_id === s.id; })[0]; return !(r && r.rec && r.rec.tasks && r.rec.tasks[t.id]); });
        if (!left.length) return '';
        return '<div class="hwh-py"><span class="tag">拼音</span>' + e(t.title || '拼音作業') + (t.due ? ' <span class="muted">截止 ' + e(t.due) + '</span>' : '') + '　還沒交：' + left.map(function(s){ return e(s.name || ''); }).join('、') + '</div>';
      }).filter(Boolean);
      box.innerHTML = lines.join('');
    }).catch(function(){});
  } catch(x){}
}
function open(){
  css();
  var types = TYPES.map(function(x){ return '<button type="button" class="hwh-t" data-act="hwhubType" data-id="' + x.k + '"><span class="hwh-ic">' + e(x.ic) + '</span><span><b>' + e(x.t) + '</b><small>' + e(x.d) + '</small></span></button>'; }).join('');
  var due = ''; try { due = (typeof hwDueHtml === 'function') ? hwDueHtml() : ''; } catch(x){}
  openModal('<div class="modal modal-tall"><div class="modal-head"><h3>📝 派作業</h3><button class="x" data-act="closeModal">×</button></div><div class="modal-body">'
    + '<p class="hint" style="margin:0 0 10px">先選一種，再選學生和截止日。不管哪一種，學生那邊都出現在「待完成」清單。</p>'
    + '<div class="hwh-grid">' + types + '</div><div id="hwh-pick"></div>'
    + '<h4 style="margin:18px 0 8px">還沒交的作業</h4>' + due + '<div id="hwh-py"></div></div></div>');
  pyPending();
}
if (hasH()){
  H.hwhubOpen = open;
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
    });
  } catch(x){}
}
addMenu();
try { new MutationObserver(function(){ addMenu(); }).observe(document.body, {childList:true, subtree:true}); } catch(x){}
})();
