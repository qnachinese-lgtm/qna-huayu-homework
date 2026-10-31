/* ══════ SUPP_V1 補充教材・外掛（supp-plug.js）══════
   由 db.js 最後面的 SUPP_LOADER 自動載入，teacher.html／student.html 不用寫任何東西。
   · 學生端：首頁右側多一張「補充教材」卡片（點了到 supp.html）；
     老師派的補充教材作業，還沒做完的會出現在「待完成」清單。
   · 老師後台：「教學」選單多一個「補充教材」（開新分頁）；「派作業」裡也多一種「補充教材」（在 hw-hub.js）。
   · 補充教材的紀錄存在 results（kind:'supp'，lesson_id:'__supp__'，一位學生一筆），
     這裡先把它從一般作業成績裡分出來，不會混進作業列表。 */
(function(){
'use strict';
if (window.__SUPP_PLUG__) return; window.__SUPP_PLUG__ = true;
var isTeacher = /\/teacher(\.html)?$/.test(location.pathname);

/* 成績分開：kind 是 supp 的那幾筆不要算進一般作業 */
var _split = window.splitResults;
if (typeof _split === 'function') window.splitResults = function(rows){
  rows = rows || [];
  window.__SUPP_DOCS = rows.filter(function(x){ return x && x.kind === 'supp'; });
  window.__SUPP_DOC = window.__SUPP_DOCS[0] || null;
  rows = rows.filter(function(x){ return !x || x.kind !== 'supp'; });
  return _split.call(this, rows);
};

if (isTeacher){
  /* 「教學」下拉選單：拼音練習下面多一個「補充教材」，點了開新分頁 */
  var addMenu = function(){
    try{
      document.querySelectorAll('#tnav .tn-p').forEach(function(p){
        if (p.querySelector('[data-supp-menu]')) return;
        var ref = p.querySelector('[data-py-menu]') || p.querySelector('button[data-id="hanzi"]') || p.querySelector('button[data-id="lessons"]'); if (!ref) return;
        var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-supp-menu', '1');
        b.innerHTML = '<span style="display:inline-block;width:1.25em;text-align:center">📚</span> 補充教材';
        b.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); window.open('supp.html#tasks', '_blank', 'noopener'); });
        ref.insertAdjacentElement('afterend', b);
      });
    }catch(x){}
  };
  addMenu();
  try { new MutationObserver(function(){ addMenu(); }).observe(document.body, {childList:true, subtree:true}); } catch(e){}
  return;
}

/* 學生端 */
function L(o){ try { return (typeof LT === 'function') ? LT(o) : o.zh; } catch(e){ return o.zh; } }
function e(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
var TASKS = [];
function myTasks(){ try { return TASKS.filter(function(t){ return t && !t.deleted_at && typeof assignedToMe === 'function' && assignedToMe(t); }); } catch(x){ return []; } }
function done(t){ var d = window.__SUPP_DOC; return !!(d && d.rec && d.rec.tasks && d.rec.tasks[t.id]); }
function openList(){ return myTasks().filter(function(t){ return !done(t); }); }
function card(){
  var n = openList().length;
  return '<a class="card supp-card" href="supp.html" style="margin-top:10px;display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit">'
    + '<span style="font-size:28px;width:32px;text-align:center">📚</span><span style="flex:1"><b>'
    + e(L({zh:'補充教材', cn:'补充教材', en:'Extra practice', vi:'Tài liệu bổ sung'})) + '</b><br><small class="muted">'
    + e(n ? L({zh:'老師派了 ' + n + ' 份，還沒做完', cn:'老师派了 ' + n + ' 份，还没做完', en:n + ' assigned, not done yet', vi:'Còn ' + n + ' bài chưa làm'})
          : L({zh:'課本以外的練習和遊戲', cn:'课本以外的练习和游戏', en:'Games and practice beyond the textbook', vi:'Trò chơi và bài luyện ngoài sách'}))
    + '</small></span><span class="btn btn-sm btn-accent">' + e(L({zh:'去練習', cn:'去练习', en:'Open', vi:'Mở'})) + '</span></a>';
}
function addCard(){
  try{
    var me = (typeof S !== 'undefined' && S) ? S.me : null;
    if (!me || me.id === '__preview') return;
    var scr = document.getElementById('screen'); if (!scr) return;
    var old = scr.querySelector('.supp-card'); if (old) old.remove();
    var side = scr.querySelector('.h-side'); if (side) side.insertAdjacentHTML('beforeend', card());
  }catch(x){}
}
try { firebase.firestore().collection('site').doc('supp').get().then(function(d){
  TASKS = (d.exists && Array.isArray(d.data().tasks)) ? d.data().tasks : [];
  addCard(); try { if (openList().length && typeof renderSection === 'function' && S && S.me) renderSection(); } catch(y){}
}).catch(function(){}); } catch(x){}
try { H.openSupp = function(id){ location.href = 'supp.html' + (id ? ('?task=' + encodeURIComponent(id)) : ''); }; } catch(x){}
var _rows = window.dueRows;
if (typeof _rows === 'function') window.dueRows = function(){
  var rows = _rows.apply(this, arguments);
  try{ if (!rows.some(function(x){ return x && x.k === 'supp'; })){
    openList().forEach(function(t){ var di = (typeof dueInfo === 'function') ? dueInfo(t.due) : null;
      rows.push({lid:t.id, k:'supp', act:'openSupp', title:'補充教材・' + (t.title || '補充教材'), due:t.due || '', cls:di ? di.cls : 'badge-pending', lab:di ? di.label : L({zh:'未完成', cn:'未完成', en:'To do', vi:'Chưa làm'}), sort:di ? di.sort : 9999}); });
    rows.sort(function(a, b){ return a.sort - b.sort; }); } }catch(x){}
  return rows;
};
var _cnt = window.dueCounts;
if (typeof _cnt === 'function') window.dueCounts = function(){
  var c = _cnt.apply(this, arguments);
  try{ openList().forEach(function(t){ var d = (typeof dueInfo === 'function') ? dueInfo(t.due) : null; if (!d) return; if (d.cls === 'badge-overdue') c.overdue++; else if (d.cls === 'badge-soon') c.soon++; }); }catch(x){}
  return c;
};
var _home = window.renderHome;
if (typeof _home === 'function') window.renderHome = function(){
  var r = _home.apply(this, arguments);
  addCard();
  return r;
};
addCard();
})();
