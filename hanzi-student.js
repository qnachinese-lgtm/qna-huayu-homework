/* ══════ 漢字遊戲・學生端外掛（hanzi-student.js）══════
   這支檔案自己把漢字遊戲接到學生端上：首頁和「上課內容」的漢字遊戲卡片、
   「待完成」清單、到期提醒、逾期數字。student.html 裡完全不用寫任何漢字遊戲的程式，
   所以不管 student.html 怎麼改、用哪一份舊檔案覆蓋，漢字遊戲都不會不見。
   由 db.js 最後面的 HANZI_LOADER 自動載入（只在 student.html）。 */
(function(){
'use strict';
if (window.__HZ_STUDENT__) return; window.__HZ_STUDENT__ = true;
const INLINE = typeof window.hzHomeCard === 'function';  /* 舊版 student.html 還留著漢字遊戲的程式：作業那部分讓舊的算，避免重複；其他用新版 */
const L4 = (zh, cn, en, vi) => LT({zh, cn, en, vi});
function hzMine(){ return (S.hanziTasks || []).filter(t => t && !t.deleted_at && assignedToMe(t)); }
function hzTaskDone(t){ const r = S.hanziDoc && S.hanziDoc.rec; const st = r && r.stars && r.stars[t.diff]; return ((st && Number(st[t.fam])) || 0) >= (Number(t.min_stars) || 1); }
function hzOpen(){ return hzMine().filter(t => !hzTaskDone(t)); }
/* 漢字複習：遊戲裡寫錯、選錯的字，照 1、3、7、15 天排好的複習 */
function hzToday(){ const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function hzReviewDue(){ const r = S.hanziDoc && S.hanziDoc.rec && S.hanziDoc.rec.review; if (!r) return 0; const t = hzToday(); return Object.values(r).filter(x => x && x.due && x.due <= t).length; }
function hzHomeCard(){
  const n = hzOpen().length;
  return '<div class="card hz-card" style="margin-top:14px;display:flex;align-items:center;gap:10px;cursor:pointer" data-act="openHanzi" data-id="">'
    + '<span style="font-size:28px">🀄</span><span style="flex:1"><b>' + esc(L4('漢字遊戲・字族工坊', '汉字游戏・字族工坊', 'Hanzi game', 'Trò chơi chữ Hán')) + '</b><br>'
    + '<small class="muted">' + (hzReviewDue() ? esc(L4('今天要複習 ' + hzReviewDue() + ' 個字', '今天要复习 ' + hzReviewDue() + ' 个字', hzReviewDue() + ' character(s) to review today', 'Hôm nay ôn ' + hzReviewDue() + ' chữ')) + '・' : '') + esc(n ? L4('老師指派了 ' + n + ' 關', '老师指派了 ' + n + ' 关', n + ' stage(s) assigned', 'Cô giao ' + n + ' màn') : L4('拼部件、學字源、練寫字', '拼部件、学字源、练写字', 'Build characters from parts', 'Ghép bộ thủ, học chữ')) + '</small></span>'
    + '<span class="btn btn-sm btn-accent">' + esc(L4('去玩', '去玩', 'Play', 'Chơi')) + '</span></div>';
}
H.openHanzi = (id) => { location.href = 'hanzi.html' + (id ? ('?task=' + encodeURIComponent(id)) : ''); };
/* 資料：漢字作業從課程清單分出來、遊戲紀錄從成績分出來 */
function splitHz(){
  const hz = (S.lessons || []).filter(x => x && x.kind === 'hanzitask');
  if (hz.length){ S.hanziTasks = hz.filter(x => !x.deleted_at); S.lessons = S.lessons.filter(x => !x || x.kind !== 'hanzitask'); }
  const doc = (S.results || []).find(x => x && x.kind === 'hanzi');
  if (doc){ S.hanziDoc = doc; S.results = S.results.filter(x => !x || x.kind !== 'hanzi'); }
}
const _split = window.splitResults;
if (typeof _split === 'function') window.splitResults = function(rAll){
  rAll = rAll || []; const doc = rAll.find(x => x && x.kind === 'hanzi');
  const r = _split.call(this, rAll.filter(x => !x || x.kind !== 'hanzi'));
  try{ if (doc) S.hanziDoc = doc; splitHz(); }catch(e){}
  return r;
};
const _rows = window.dueRows;
if (typeof _rows === 'function') window.dueRows = function(){
  const rows = _rows.apply(this, arguments);
  try{ splitHz(); if (!rows.some(x => x && x.k === 'hanzi')){
    hzOpen().forEach(t => { const di = dueInfo(t.due_date);
      rows.push({lid:t.id, k:'hanzi', act:'openHanzi', title:'🀄 ' + (t.title || t.fam || ''), due:t.due_date || '',
        cls:di ? di.cls : 'badge-pending', lab:di ? di.label : L4('未完成', '未完成', 'To do', 'Chưa làm'), sort:di ? di.sort : 9999}); });
    rows.sort((a, b) => a.sort - b.sort); }
    const rv = hzReviewDue();
    if (rv && !rows.some(x => x && x.k === 'hzrev')){
      rows.push({lid:'review', k:'hzrev', act:'openHanzi', title:'🀄 ' + L4('漢字複習：' + rv + ' 個字', '汉字复习：' + rv + ' 个字', 'Hanzi review: ' + rv, 'Ôn chữ Hán: ' + rv + ' chữ'), due:hzToday(),
        cls:'badge-soon', lab:L4('今天', '今天', 'Today', 'Hôm nay'), sort:0});
      rows.sort((a, b) => a.sort - b.sort); } }catch(e){}
  return rows;
};
const _counts = window.dueCounts;
if (typeof _counts === 'function') window.dueCounts = function(){
  const c = _counts.apply(this, arguments);
  try{ if (!INLINE) hzOpen().forEach(t => { const d = dueInfo(t.due_date); if (!d) return; if (d.cls === 'badge-overdue') c.overdue++; else if (d.cls === 'badge-soon') c.soon++; }); }catch(e){}
  return c;
};
const _banner = window.dueBanner;
if (typeof _banner === 'function') window.dueBanner = function(){
  let html = _banner.apply(this, arguments);
  try{
    const its = [];
    if (!INLINE) hzOpen().forEach(t => { const di = dueInfo(t.due_date); if (di && (di.cls === 'badge-overdue' || di.cls === 'badge-soon')) its.push({over:di.cls === 'badge-overdue', t:'🀄 ' + (t.title || t.fam || ''), due:t.due_date}); });
    if (!its.length) return html;
    const li = its.map(x => '<li>' + (x.over ? '<span class="db-o">' + esc(L4('逾期', '逾期', 'Overdue', 'Quá hạn')) + '</span>' : '<span class="db-s">' + esc(L4('快到期', '快到期', 'Due soon', 'Sắp hạn')) + '</span>') + ' ' + esc(x.t) + (x.due ? (' <span class="db-d">' + esc(x.due) + '</span>') : '') + '</li>').join('');
    const nOver = its.filter(x => x.over).length;
    if (!html){
      const head = nOver ? L4('有 ' + nOver + ' 份作業已經逾期了', '有 ' + nOver + ' 份作业已经逾期了', nOver + ' assignment(s) overdue', 'Có ' + nOver + ' bài đã quá hạn') : L4('有作業快到期了', '有作业快到期了', 'Assignments due soon', 'Sắp đến hạn nộp bài');
      return '<div class="due-banner' + (nOver ? ' over' : '') + '"><div class="db-h">' + (nOver ? '⚠️' : '⏰') + ' ' + esc(head) + '</div><ul class="db-l">' + li + '</ul></div>';
    }
    const box = document.createElement('div'); box.innerHTML = html;
    const ul = box.querySelector('.db-l'); if (ul) ul.insertAdjacentHTML('beforeend', li);
    if (nOver){ const b = box.querySelector('.due-banner'); if (b) b.classList.add('over'); }
    return box.innerHTML;
  }catch(e){ return html; }
};
function addCard(sel, where){
  const scr = document.getElementById('screen'); if (!scr || scr.querySelector('.hz-card')) return;
  const t = scr.querySelector(sel); if (t) t.insertAdjacentHTML(where, hzHomeCard());
}
const _home = window.renderHome;
if (typeof _home === 'function') window.renderHome = function(){
  try{ splitHz(); }catch(e){}
  const r = _home.apply(this, arguments);
  try{ addCard('.h-side', 'beforeend'); }catch(e){}
  return r;
};
const _content = window.renderContent;
if (typeof _content === 'function') window.renderContent = function(){
  const r = _content.apply(this, arguments);
  try{ const cw = document.querySelector('#screen .cwrap'); if (cw && !document.querySelector('#screen .hz-card')){ cw.insertAdjacentHTML('beforebegin', '<div style="margin:-6px 0 14px">' + hzHomeCard() + '</div>'); } }catch(e){}
  return r;
};
window.hzHomeCard = hzHomeCard;
/* 如果學生端已經先載好、畫好了，補畫一次 */
try{ if (S.me && (S.lessons || []).length){ splitHz(); if (typeof renderSection === 'function') renderSection(); } }catch(e){}
})();
