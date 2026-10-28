/* ══════ PINYIN_V1 拼音練習・外掛（pinyin-plug.js）══════
   由 db.js 最後面的 PINYIN_LOADER 自動載入，teacher.html／student.html 不用寫任何東西。
   · 學生端：首頁右側多一張「拼音練習」卡片，點了到 pinyin.html。
   · 老師後台：右上角多一個「拼音練習」圖示（開新分頁），裡面可以改詞表、看學生成績。
   · 拼音練習的成績存在 results（kind:'pinyin'，lesson_id:'__pinyin__'，一位學生一筆），
     這裡先把它從一般作業成績裡分出來，不會混進作業列表。 */
(function(){
'use strict';
if (window.__PINYIN_PLUG__) return; window.__PINYIN_PLUG__ = true;
var isTeacher = /\/teacher(\.html)?$/.test(location.pathname);

/* 成績分開：kind 是 pinyin 的那一筆不要算進一般作業 */
var _split = window.splitResults;
if (typeof _split === 'function') window.splitResults = function(rows){
  rows = (rows || []).filter(function(x){ return !x || x.kind !== 'pinyin'; });
  return _split.call(this, rows);
};

if (isTeacher){
  var add = function(){
    if (document.getElementById('pinyin-btn')) return true;
    var box = document.querySelector('.tb-ic'); if (!box) return false;
    var a = document.createElement('a');
    a.id = 'pinyin-btn'; a.href = 'pinyin.html'; a.target = '_blank'; a.rel = 'noopener';
    a.className = 'btn btn-sm btn-ghost'; a.title = '拼音練習：詞表與學生成績（開新分頁）'; a.setAttribute('aria-label', '拼音練習');
    a.innerHTML = '<span style="font-family:\'Times New Roman\',Times,serif;font-size:17px;line-height:1">ā</span>';
    box.insertBefore(a, box.firstChild); return true;
  };
  if (!add()){ var n = 0, t = setInterval(function(){ if (add() || ++n > 40) clearInterval(t); }, 250); }
  try { new MutationObserver(function(){ if (!document.getElementById('pinyin-btn')) add(); }).observe(document.body, {childList:true, subtree:true}); } catch(e){}
  return;
}

/* 學生端 */
function L(o){ try { return (typeof LT === 'function') ? LT(o) : o.zh; } catch(e){ return o.zh; } }
function e(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function card(){
  return '<a class="card py-card" href="pinyin.html" style="margin-top:10px;display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit">'
    + '<span style="font-family:\'Times New Roman\',Times,serif;font-size:30px;width:32px;text-align:center">ā</span><span style="flex:1"><b>'
    + e(L({zh:'拼音練習', cn:'拼音练习', en:'Pinyin practice', vi:'Luyện pinyin'})) + '</b><br><small class="muted">'
    + e(L({zh:'看漢字，打出拼音和聲調', cn:'看汉字，打出拼音和声调', en:'See the character, type the pinyin with tones', vi:'Nhìn chữ Hán, gõ pinyin có thanh điệu'}))
    + '</small></span><span class="btn btn-sm btn-accent">' + e(L({zh:'去練習', cn:'去练习', en:'Practice', vi:'Luyện'})) + '</span></a>';
}
function addCard(){
  try{
    var me = (typeof S !== 'undefined' && S) ? S.me : null;
    if (!me || me.id === '__preview') return;
    var scr = document.getElementById('screen'); if (!scr || scr.querySelector('.py-card')) return;
    var side = scr.querySelector('.h-side'); if (side) side.insertAdjacentHTML('beforeend', card());
  }catch(x){}
}
var _home = window.renderHome;
if (typeof _home === 'function') window.renderHome = function(){
  var r = _home.apply(this, arguments);
  addCard();
  return r;
};
addCard();
})();
