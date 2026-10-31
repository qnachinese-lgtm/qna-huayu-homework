/* ══════════════════════════════════════════════════════════════════════
   GUIDE_V1523　「從這裡開始」——新管理員第一天的三步引導
   2026-10-14

   Quinn：「目前使用方法太複雜了」「新手很難上手」。
   量出來的（firstday.js）：
     · 新管理員第一次登入 → 7 個分頁、第一屏 26 個可以點的東西
     · 主管理員（Quinn）  → 10 個分頁、第一屏 46 個可以點的東西、725 個字
     · 兩邊搜「第一次／新手／從這裡開始／快速上手」——**一個字都沒有**
   也就是說，整個後台沒有任何地方告訴新來的人「先做什麼」。

   這一支在「今日總覽」最上面加一張卡，只講三件事，而且每一步都帶真實數字。

   ⚠ 刻意只給「不是主管理員」的人看。
     Quinn 自己的今日總覽已經列了待批改、待收款、今天的課，
     再加一張「你的三件事」只是把本來就擠的畫面再擠一次——那跟她的抱怨
     是同一個方向的錯誤。她要看的話，設定頁有一顆鈕可以叫出來預覽，
     因為她要發帳號給別人，得先知道對方會看到什麼。

   ⚠ 「我知道了」記在 localStorage，而且 key 帶 email，
     換一個人登入同一台電腦還是會重新出現。
   ══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  function S_(k){ try{ return (typeof S!=='undefined'&&S&&S[k])||[]; }catch(e){ return []; } }
  function owner(){ try{ return (typeof IS_OWNER!=='undefined')?!!IS_OWNER:false; }catch(e){ return false; } }
  function email(){
    try{ return ((firebase.auth().currentUser||{}).email||'').toLowerCase(); }catch(e){ return ''; }
  }
  function key(){ return 'qna_guide_done_'+(email()||'x'); }
  function dismissed(){ try{ return localStorage.getItem(key())==='1'; }catch(e){ return false; } }
  function dismiss(){ try{ localStorage.setItem(key(),'1'); }catch(e){} }

  var PREVIEW=false;   /* 主管理員按「看新管理員的引導」時暫時打開 */

  function counts(){
    var stu=S_('students').filter(function(s){return s&&!s.is_test&&!s.deleted_at;});
    var q=0;
    try{ if(typeof gradeQueue==='function')q=(gradeQueue()||[]).length; }catch(e){}
    var assigned=0;
    try{
      S_('lessons').concat(S_('workbooks')).forEach(function(L){
        if(!L)return;
        var a=(L.assigned_ids||[]).length,g=(L.assigned_groups||[]).length;
        if(a||g)assigned++;
      });
    }catch(e){}
    return {stu:stu.length,queue:q,assigned:assigned};
  }

  function steps(){
    var c=counts();
    return [
      {ic:'1',t:'先看看你帶的學生',
       d:c.stu?('目前有 <b>'+c.stu+' 位</b>。點進去可以看他的程度、上課記錄和作業狀況。')
              :'現在還沒有學生分給你。主管理員指派之後就會出現在這裡。',
       go:'students',btn:'去看學生'},
      {ic:'2',t:'把課指派給他們',
       d:'課和作業簿都在「教材與課程」。打開那一課，按〈指派給學生〉選人並存檔——<b>沒有指派，學生那邊就看不到這一課</b>。',
       go:'lessons',btn:'去指派課程'},
      {ic:'3',t:'批改他交來的作業',
       d:c.queue?('現在有 <b>'+c.queue+' 份</b>等你批。')
                :'學生交了作業會自動出現在這裡，目前沒有待批的。',
       d2:'批完按〈儲存建議〉，分數和建議學生當天就看得到。',
       go:'grades',btn:'去批改'}
    ];
  }

  function build(){
    var ss=steps();
    var h='<div class="gd-card" id="gd-card">'
      +'<div class="gd-h"><b>👋 從這裡開始</b>'
      +'<span class="gd-sub">第一次用這個後台，先會這三件事就夠了</span>'
      +'<span class="gd-sp"></span>'
      +'<button type="button" class="gd-x" id="gd-x">我知道了，不用再顯示</button></div>';
    ss.forEach(function(s){
      /* 刻意不做「打勾／已完成」：程式無從知道對方到底看過沒有，
         硬打勾只會讓人以為都做完了。就是單純的 1、2、3。 */
      h+='<div class="gd-row">'
        +'<span class="gd-n">'+s.ic+'</span>'
        +'<span class="gd-tx"><b>'+s.t+'</b><br><span class="gd-d">'+s.d
        +(s.d2?('<br>'+s.d2):'')+'</span></span>'
        +'<button type="button" class="btn btn-sm gd-go" data-go="'+s.go+'">'+s.btn+'</button>'
        +'</div>';
    });
    h+='<div class="gd-foot">卡住的時候：左邊「設定 → 使用說明」有完整的操作說明。'
      +(PREVIEW?'<br><b>（這是預覽，一般管理員才會看到這張卡）</b>':'')+'</div></div>';
    return h;
  }

  function mount(){
    try{
      var body=document.getElementById('dashboard-body');
      if(!body)return;
      var pane=document.getElementById('panel-dashboard');
      if(pane&&pane.classList.contains('hide'))return;     /* 不在今日總覽就不畫 */
      /* GUIDE_V1680 Quinn：「爲什麼這個會出現？」——登入過期時抓不到是誰，被當成「不是主管理員」，
         於是給她看了新人引導卡。抓不到 email（沒登入／過期）就不顯示；email 是她的也不顯示。 */
      var em=email(),boss=false;try{boss=!!(em&&typeof TEACHER_EMAIL!=='undefined'&&em===String(TEACHER_EMAIL).toLowerCase());}catch(e){}
      var want=PREVIEW||(!!em&&!boss&&!owner()&&!dismissed());
      var old=document.getElementById('gd-card');
      if(!want){ if(old)old.remove(); return; }
      if(old)return;                                        /* 已經在了就不重畫 */
      var d=document.createElement('div');
      d.innerHTML=build();
      var card=d.firstChild;
      body.insertBefore(card,body.firstChild);
      card.addEventListener('click',function(ev){
        var go=ev.target&&ev.target.closest?ev.target.closest('.gd-go'):null;
        if(go){ ev.preventDefault();ev.stopPropagation();
          try{ S.tab=go.getAttribute('data-go'); render(); }catch(e){}
          return; }
        if(ev.target&&ev.target.id==='gd-x'){
          ev.preventDefault();ev.stopPropagation();
          if(PREVIEW){PREVIEW=false;}else{dismiss();}
          card.remove();
          try{toast(PREVIEW?'':'好，之後不再顯示。要再看可以到「設定」。');}catch(e){}
        }
      });
    }catch(e){}
  }

  /* 主管理員：設定頁加一顆「看新管理員會看到什麼」 */
  function mountPreviewBtn(){
    try{
      if(!owner())return;
      var ref=document.querySelector('[data-act="dataShape"]');
      if(!ref||document.getElementById('gd-prev'))return;
      var b=document.createElement('button');
      b.id='gd-prev';b.type='button';b.className='btn btn-sm';
      b.textContent='👀 看新管理員的引導';
      b.addEventListener('click',function(ev){
        ev.preventDefault();ev.stopPropagation();
        PREVIEW=true;
        try{ closeModal(); S.tab='dashboard'; render(); }catch(e){}
        setTimeout(mount,120);
      });
      ref.parentNode.insertBefore(b,ref.nextSibling);
    }catch(e){}
  }

  function soon(fn){
    try{ if(document.hidden){setTimeout(fn,60);return;} }catch(e){}
    if(window.requestAnimationFrame)requestAnimationFrame(fn); else setTimeout(fn,16);
  }
  function scan(){ mount(); mountPreviewBtn(); }
  if(window.MutationObserver){
    var sched=false;
    new MutationObserver(function(){
      if(sched)return;sched=true;
      soon(function(){sched=false;scan();});
    }).observe(document.documentElement,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan);
  else scan();
})();
