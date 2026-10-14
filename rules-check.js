/* ══════════════════════════════════════════════════════════════════════
   RCHK_V1522　「學生看不看得到他的課」自己檢查
   2026-10-14

   2026-10-14 發布的新安全規則，把課文從「只要登入就讀得到」改成
   「要在那一課的可讀名單（read_uids）裡」。好處是學生再也拿不到
   妳還沒指派給他的課；風險是——**萬一哪一課指派了學生、名單卻沒同步，
   那位學生就會突然看不到他本來該有的課**，而且後台這邊完全看不出來
   （主管理員讀得到全部，不受規則影響）。

   所以要有一個地方可以隨時自己驗。這一支加一顆按鈕，按下去會把
   每一課掃一遍，列出「被指派了、但名單裡少了人」的課。
   · 純讀取，不改任何資料。
   · 判斷條件跟線上規則同一套：pubKinds 那幾種本來就公開，不用名單；
     其他（課文、文言文…）一定要名單。

   ⚠ 這兩張清單要跟 Firestore 規則裡的一模一樣，改一邊就要改另一邊。
   ⚠ S 是 const，不會變成 window 的屬性，一律用裸的識別字加 typeof 保護。
   ══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  /* 跟規則裡的 pubKinds() 一模一樣：這幾種學生不用被指派就讀得到 */
  var PUB=['announcement','classmeta','livesession','livequiz',
           'lqassign','quiz','pron','workbook','oc'];

  function st(k){ try{ return (typeof S!=='undefined'&&S&&S[k])||[]; }catch(e){ return []; } }
  function esc(t){ return String(t==null?'':t).replace(/[&<>"]/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  function audit(){
    var stu=st('students').filter(function(s){return s&&!s.deleted_at;});
    var byId={};stu.forEach(function(s){byId[s.id]=s;});
    var all=st('lessons').concat(st('workbooks'));
    var seen={},rows=[],need=0,noUid=[];
    all.forEach(function(L){
      if(!L||seen[L.id])return;seen[L.id]=1;
      var k=L.kind||'';
      if(PUB.indexOf(k)>=0)return;              /* 本來就公開，不靠名單 */
      var ids=Array.isArray(L.assigned_ids)?L.assigned_ids:[];
      var grp=Array.isArray(L.assigned_groups)?L.assigned_groups:[];
      if(!ids.length&&!grp.length)return;       /* 沒指派給任何人 */
      need++;
      var want={},names={};
      var add=function(s){
        if(!s)return;
        if(!s.uid){noUid.push(s.name||s.id);return;}  /* 還沒開通登入，本來就讀不到 */
        want[s.uid]=1;names[s.uid]=s.name||s.id;
      };
      ids.forEach(function(id){add(byId[id]);});
      grp.forEach(function(g){stu.forEach(function(s){
        if((Array.isArray(s.groups)?s.groups:[]).indexOf(g)>=0)add(s);});});
      var have=Array.isArray(L.read_uids)?L.read_uids:[];
      var miss=Object.keys(want).filter(function(u){return have.indexOf(u)<0;});
      if(miss.length)rows.push({t:L.title||L.id,k:k||'課文',
        miss:miss.map(function(u){return names[u];}),all:Object.keys(want).length});
    });
    var uniq=[];noUid.forEach(function(n){if(uniq.indexOf(n)<0)uniq.push(n);});
    return {need:need,rows:rows,noUid:uniq};
  }

  function show(){
    var r;
    try{ r=audit(); }catch(e){ try{toast('檢查失敗：'+((e&&e.message)||e));}catch(_){ } return; }
    var h='<div class="modal"><div class="modal-head"><h3>🔐 學生看不看得到他的課</h3>'
      +'<button class="x" data-act="closeModal">×</button></div><div class="modal-body">';
    h+='<div class="hint" style="margin-bottom:10px">新的安全規則是靠「每一課的可讀名單」判斷的。'
      +'這裡把<b>有指派給學生、而且一定要靠名單</b>的課掃一遍，看名單有沒有漏人。'
      +'公告、作業簿、小考、發音、線上課那幾種本來就公開，不在檢查範圍。'
      +'<br><b>這個檢查只讀資料，不會改到任何東西。</b></div>';
    h+='<div class="card" style="margin-bottom:10px"><b>要靠名單的已指派課程：'+r.need+' 課</b><br>'
      +(r.rows.length
        ? '<span style="color:#A33227;font-weight:700">其中 '+r.rows.length+' 課名單不齊，下面這些學生會看不到：</span>'
        : '<span style="color:#1F6A54;font-weight:700">✅ 全部齊全，不會有人看不到自己的課。</span>')
      +'</div>';
    if(r.rows.length){
      h+='<div class="card">'+r.rows.slice(0,40).map(function(x){
        return '<div style="padding:5px 0;border-top:1px solid var(--line)"><b>'+esc(x.t)+'</b> '
          +'<span class="muted">('+esc(x.k)+')</span><br><span class="hint">漏掉 '+x.miss.length+'／'+x.all+' 位：'
          +esc(x.miss.slice(0,8).join('、'))+(x.miss.length>8?' …':'')+'</span></div>';}).join('')
        +(r.rows.length>40?'<div class="hint" style="padding-top:6px">（還有 '+(r.rows.length-40)+' 課，先處理上面這些）</div>':'')
        +'</div>';
      h+='<div class="hint" style="margin-top:10px">怎麼補：把那一課打開，重新按一次<b>〔指派給學生〕→〔儲存〕</b>，'
        +'名單就會重新同步。或者先把規則還原（Firebase → 規則 → 版本記錄 → 還原到 10月6日那一版），'
        +'處理完再發布一次。</div>';
    }
    if(r.noUid.length)h+='<div class="hint" style="margin-top:10px">另外有 '+r.noUid.length
      +' 位學生還沒開通登入（沒有帳號），本來就讀不到任何東西，不算在上面：'
      +esc(r.noUid.slice(0,10).join('、'))+(r.noUid.length>10?' …':'')+'</div>';
    h+='</div><div class="modal-foot"><button class="btn btn-ghost" data-act="closeModal">關閉</button></div></div>';
    try{ openModal(h); }catch(e){ try{toast('畫不出來：'+((e&&e.message)||e));}catch(_){ } }
  }

  function mount(){
    try{
      var ref=document.querySelector('[data-act="dataShape"]');
      if(!ref||document.getElementById('rchk-btn'))return;
      var b=document.createElement('button');
      b.id='rchk-btn';b.type='button';b.className='btn btn-sm';
      b.textContent='🔐 檢查學生看不看得到課';
      b.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();show();});
      ref.parentNode.insertBefore(b,ref.nextSibling);
    }catch(e){}
  }

  function soon(fn){
    try{ if(document.hidden){setTimeout(fn,60);return;} }catch(e){}
    if(window.requestAnimationFrame)requestAnimationFrame(fn); else setTimeout(fn,16);
  }
  if(window.MutationObserver){
    var sched=false;
    new MutationObserver(function(){
      if(sched)return;sched=true;
      soon(function(){sched=false;mount();});
    }).observe(document.documentElement,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);
  else mount();
})();
