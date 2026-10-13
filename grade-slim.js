/* ══════════════════════════════════════════════════════════════════════
   GSLIM_V1516　批改：③ 直接跳去改題目　④ 版面收短
   2026-10-13

   Quinn 那天勾的四件，這是最後兩件。
     ③「改題目本身」——批改的時候發現題目打錯、參考答案寫錯，
        現在要自己退出去、找到那一課、再找到那一題。
     ④「畫面本身還是太長太亂」——量過：一份作業簿 23 題、6550px，
        要捲七個螢幕；每一題長得一模一樣，批過的跟沒批的也分不出來。

   ③ 怎麼做
     每一題右邊加〔✎ 改題目〕。語法練習可以直接開到那一題
     （H.editQuestion('課id::題id')）；作業簿、造句、問題與討論
     沒有單題編輯器，就開到那一份的編輯畫面。
     ⚠ 去改題目之前一定先把批改存起來——不然打了半天的建議會不見。
       有沒存的就先問，按確定＝先存再去。

   ④ 怎麼做
     一個原則：**只用 CSS 收起來，絕對不從 DOM 拿掉任何東西。**
     存檔是 document.querySelectorAll('.wbrev-fb') 一次收走全部的值，
     真的把節點刪掉或重建，收到的就是空的，學生那邊的建議會整批消失。
     display:none 的 textarea 一樣抓得到、value 一樣在，所以安全。

     · 批過的題目（建議框有字，含 ✓／✎／✗ 標記）自動收成一行。
     · 上面一條列：還沒批 X／共 Y、〔收合已批的〕〔全部展開〕。
     · 參考答案收進一個小小的〔參考答案〕，要看再點。
     · 建議框沒東西的時候只有一行高，點進去才長開。
   ══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  /* 五種批改畫面：建議框的 class ＋ 存檔的 data-act ＋ 來源課程的欄位 */
  var SCREENS=[
    {fb:'wbrev-fb', act:'saveWbReview',    coll:'wbdocs',      les:'wb_lesson',     open:'wb'},
    {fb:'srev-fb',  act:'saveSentReview',  coll:'sentences',   les:'sent_lesson',   open:'lesson'},
    {fb:'drev-fb',  act:'saveDiscReview',  coll:'discussions', les:'disc_lesson',   open:'lesson'},
    {fb:'gprev-fb', act:'saveGpracReview', coll:'gpracs',      les:'gprac_lesson',  open:'question'},
    {fb:'shrev-fb', act:'saveShadowReview',coll:'shadows',     les:'shadow_lesson', open:'lesson'}
  ];

  function coll(name){
    try{ return (typeof S!=='undefined'&&S&&S[name])||[]; }catch(e){ return []; }
  }
  function cur(){
    for(var i=0;i<SCREENS.length;i++){
      var scr=SCREENS[i];
      if(!document.querySelector('textarea.'+scr.fb))continue;
      var btn=document.querySelector('[data-act="'+scr.act+'"][data-id]');
      if(!btn)continue;
      var id=btn.getAttribute('data-id');
      var sd=coll(scr.coll).filter(function(x){return x&&x.id===id;})[0];
      if(sd)return {scr:scr,id:id,sd:sd,btn:btn};
    }
    return null;
  }

  /* ── ③ 跳去改題目 ───────────────────────────────────────────────── */

  function dirty(ctx){
    /* 有沒有還沒存的批改：建議框有字、整體評語有字、或 GEDIT 改過學生的字 */
    var tas=document.querySelectorAll('textarea.'+ctx.scr.fb);
    for(var i=0;i<tas.length;i++)if(String(tas[i].value||'').trim())return true;
    var ov=document.querySelector('#wbrev-overall,#srev-overall,#drev-overall,#gprev-overall,#shrev-overall');
    if(ov&&String(ov.value||'').trim())return true;
    if(document.getElementById('ged-pill'))return true;
    return false;
  }

  async function goEdit(ctx,qid){
    var lid=ctx.sd[ctx.scr.les];
    if(!lid){try{toast('找不到這一份是從哪一課來的');}catch(e){}return;}
    if(dirty(ctx)){
      if(!confirm('要先把目前的批改存起來，再去改題目嗎？\n\n確定＝先存再去（建議）\n取消＝留在這裡，先自己存'))return;
      try{ await H[ctx.scr.act](ctx.id,null); }
      catch(e){ try{toast('存檔沒成功，先不要離開');}catch(_){ } return; }
    }
    try{
      if(ctx.scr.open==='question'&&qid)H.editQuestion(lid+'::'+qid);
      else if(ctx.scr.open==='wb')H.editWb(lid);
      else H.editLesson(lid);
    }catch(e){ try{toast('打不開編輯器：'+((e&&e.message)||e));}catch(_){ } }
  }

  function mountEdit(ctx,item){
    if(item.__gsE)return;
    var ta=item.querySelector('textarea.'+ctx.scr.fb);
    if(!ta)return;
    item.__gsE=1;
    var qid=(ctx.scr.open==='question')?ta.getAttribute('data-k'):'';
    var b=document.createElement('button');
    b.type='button';b.className='gs-edit';
    b.textContent='✎ 改題目';
    b.title=(ctx.scr.open==='question')?'直接開到這一題':'開啟這一份的編輯畫面';
    b.addEventListener('click',function(ev){
      ev.preventDefault();ev.stopPropagation();
      goEdit(ctx,qid);
    });
    var head=item.querySelector('.srev-word')||item.firstElementChild;
    if(head)head.appendChild(b); else item.insertBefore(b,item.firstChild);
  }

  /* ── ④ 版面收短 ─────────────────────────────────────────────────── */

  function done(item,fb){
    var ta=item.querySelector('textarea.'+fb);
    return !!(ta&&String(ta.value||'').trim());
  }

  function fold(item,on){
    if(item.contains(document.activeElement))return;   /* 正在打字的那一題不要動 */
    item.classList.toggle('gs-fold',!!on);
  }

  function counts(ctx){
    var items=document.querySelectorAll('.srev-item');
    var d=0;
    for(var i=0;i<items.length;i++)if(done(items[i],ctx.scr.fb))d++;
    return {all:items.length,done:d,left:items.length-d};
  }

  function paintBar(ctx){
    var pane=document.getElementById('sg-pane')||document.querySelector('.modal-body');
    if(!pane)return;
    var c=counts(ctx);
    var bar=document.getElementById('gs-bar');
    if(!c.all){ if(bar)bar.remove(); return; }
    if(!bar){
      bar=document.createElement('div');
      bar.id='gs-bar';bar.className='gs-bar';
      bar.innerHTML='<span class="gs-n"></span><span class="gs-sp"></span>'
        +'<button type="button" class="gs-b" data-k="fold">收合已批的</button>'
        +'<button type="button" class="gs-b" data-k="open">全部展開</button>';
      var jump=pane.querySelector('.gp-jump');
      if(jump&&jump.parentNode)jump.parentNode.insertBefore(bar,jump.nextSibling);
      else pane.insertBefore(bar,pane.firstChild);
      bar.addEventListener('click',function(ev){
        var t=ev.target&&ev.target.closest?ev.target.closest('.gs-b'):null;
        if(!t)return;
        ev.preventDefault();ev.stopPropagation();
        var k=t.getAttribute('data-k');
        var items=document.querySelectorAll('.srev-item');
        for(var i=0;i<items.length;i++){
          if(k==='open')fold(items[i],false);
          else fold(items[i],done(items[i],ctx.scr.fb));
        }
        AUTO=(k!=='open');
        paintBar(ctx);
      });
    }
    bar.querySelector('.gs-n').innerHTML='還沒批 <b>'+c.left+'</b> ／ 共 '+c.all+' 題'
      +(c.done?('　<span class="gs-done">已批 '+c.done+'</span>'):'');
  }

  var AUTO=true;   /* 批完一題就自動收起來 */

  function mountSlim(ctx,item){
    if(item.__gsS)return;
    item.__gsS=1;
    /* 參考答案收起來，要看再點 */
    var hints=item.querySelectorAll('.hint');
    for(var i=0;i<hints.length;i++){
      var h=hints[i];
      if((h.textContent||'').indexOf('參考答案')<0)continue;
      if(h.__gs)continue;
      h.__gs=1;
      h.classList.add('gs-ref');
      var t=document.createElement('button');
      t.type='button';t.className='gs-reft';t.textContent='參考答案';
      t.addEventListener('click',function(el){return function(ev){
        ev.preventDefault();ev.stopPropagation();
        el.classList.toggle('on');
      };}(h));
      h.parentNode.insertBefore(t,h);
    }
    /* 批完一題就收起來；點標題可以再打開 */
    var ta=item.querySelector('textarea.'+ctx.scr.fb);
    if(ta){
      ta.addEventListener('blur',function(){
        if(AUTO&&String(ta.value||'').trim())fold(item,true);
        paintBar(ctx);
      });
      ta.addEventListener('input',function(){paintBar(ctx);});
    }
    item.addEventListener('click',function(ev){
      if(!item.classList.contains('gs-fold'))return;
      if(ev.target&&ev.target.closest&&ev.target.closest('button'))return;
      item.classList.remove('gs-fold');
    });
    if(AUTO&&done(item,ctx.scr.fb))fold(item,true);
  }

  function scan(){
    try{
      var ctx=cur();
      if(!ctx)return;
      var items=document.querySelectorAll('.srev-item');
      for(var i=0;i<items.length;i++){mountEdit(ctx,items[i]);mountSlim(ctx,items[i]);}
      paintBar(ctx);
    }catch(e){}
  }

  function boot(){
    try{ if(typeof H!=='object'||!H){setTimeout(boot,400);return;} }
    catch(e){ setTimeout(boot,400); return; }
    if(window.MutationObserver){
      var sched=false;
      new MutationObserver(function(){
        if(sched)return;sched=true;
        requestAnimationFrame(function(){sched=false;scan();});
      }).observe(document.body,{childList:true,subtree:true});
    }
    scan();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
