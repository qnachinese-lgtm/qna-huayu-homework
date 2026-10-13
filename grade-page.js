/* ══════════════════════════════════════════════════════════════════════
   GPAGE_V1510　批改不要再跳視窗，統一在「批改・成績」那一頁
   2026-10-12

   Quinn：「批改這邊最好是給我出新的頁面不要跳視窗了，因為這樣很難修改，
           而且我也不知道要怎麼修改」。

   查出來的原因：批改畫面有兩條路，長得不一樣。
     · 從「批改・成績」點學生 → 進左右分割的頁面（有上一位／下一位、
       改完自動跳下一份）
     · 從「今日總覽」的待批改按「批改」→ 沒有那個面板，退回去開彈出視窗
   她看到的是第二條。所以不是「把視窗做大」，是把第二條路導到第一條。

   這一支做兩件事：
   1. 攔下 reviewWb／reviewGprac／reviewSent／reviewDisc／reviewShadow，
      如果現在不在批改頁，先切過去再開，不開視窗。
   2. 在批改面板上方加一條「章節」快速跳。一份作業簿量過 6550px，
      要捲七個螢幕才找得到「整體評語」。

   都是在外面包，teacher-app.js 一個字都沒有改。
   ══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  /* ══════ RAF_V1518 分頁在背景的時候，這些東西通通長不出來 ══════
     本來排程是用 requestAnimationFrame，而 Chrome 對「看不見的分頁」會把 rAF
     完全停掉（不是變慢，是不跑）。這裡又有一個 sched 旗標防重複，
     結果：在背景分頁裡，MutationObserver 第一次觸發就把 sched 設成 true、
     排了一個永遠不會執行的 rAF，之後所有變動都被那個旗標擋掉，
     等於整支覆蓋程式死在那裡（切回前景才會補跑）。
     改成：看不見的時候退回 setTimeout，看得見才用 rAF。 */
  function soon(fn){
    try{ if(document.hidden){setTimeout(fn,60);return;} }catch(e){}
    if(window.requestAnimationFrame)requestAnimationFrame(fn); else setTimeout(fn,16);
  }


  /* ── 1. 不要跳視窗 ─────────────────────────────────────────────── */
  var MAP={reviewWb:'wb',reviewGprac:'gprac',reviewSent:'sent',
           reviewDisc:'disc',reviewShadow:'shadow'};

  function onGradePage(){ return !!document.getElementById('sg-pane'); }

  function findItem(kind,id){
    try{
      if(typeof gradeQueue!=='function')return null;
      var q=gradeQueue(true)||[];
      for(var i=0;i<q.length;i++)
        if(q[i]&&q[i].kind===kind&&q[i].id===id)return q[i];
    }catch(e){}
    return null;
  }

  function hook(){
    if(typeof H!=='object'||!H)return false;
    var done=0;
    Object.keys(MAP).forEach(function(fn){
      var orig=H[fn];
      if(typeof orig!=='function'||orig.__gp)return;
      var wrapped=function(id){
        /* 已經在批改頁上＝原本就走分割面板，不用動 */
        if(onGradePage())return orig.apply(this,arguments);
        var kind=MAP[fn];
        try{
          S.tab='grades';
          render();
          /* render 之後面板才存在，所以等一個畫面再開 */
          setTimeout(function(){
            var it=findItem(kind,id);
            if(it&&typeof sgOpen==='function'){ sgOpen(it); }
            else { try{orig.call(H,id);}catch(e){} }   /* 真的找不到就照舊 */
            scan();
          },80);
        }catch(e){ try{orig.call(H,id);}catch(e2){} }
      };
      wrapped.__gp=1;
      H[fn]=wrapped;
      done++;
    });
    return done>0;
  }

  /* ── 2. 章節快速跳 ─────────────────────────────────────────────── */
  /* 一份作業簿 6550px。把裡面的小標題抓出來做成一排，點了捲過去。
     不隱藏任何東西——批改的輸入框必須全部留在畫面上，
     存檔是用 querySelectorAll 一次收走的，藏起來會收到空值。 */
  function sections(pane){
    var out=[];
    var bad=pane.querySelector('.wb-bad');
    if(bad)out.push({el:bad,t:'錯的題目'});
    var hs=pane.querySelectorAll('h4');
    for(var i=0;i<hs.length;i++){
      var s=(hs[i].textContent||'').replace(/\s+/g,' ').trim();
      if(s)out.push({el:hs[i],t:s.slice(0,12)});
    }
    var ov=pane.querySelector('#wbrev-overall,#gprev-overall,#srev-overall,#drev-overall,#shrev-overall');
    if(ov){
      var box=ov.closest('.field')||ov;
      out.push({el:box,t:'整體評語'});
    }
    return out;
  }

  function scan(){
    try{
      var pane=document.getElementById('sg-pane');
      if(!pane)return;
      var body=pane.querySelector('.sg-body')||pane;
      var secs=sections(pane);
      var old=pane.querySelector('.gp-jump');
      if(secs.length<2){ if(old)old.remove(); return; }
      var sig=secs.map(function(s){return s.t;}).join('|');
      if(old&&old.getAttribute('data-sig')===sig)return;   /* 沒變就不要重畫 */
      if(old)old.remove();

      var bar=document.createElement('div');
      bar.className='gp-jump';
      bar.setAttribute('data-sig',sig);
      secs.forEach(function(s){
        var b=document.createElement('button');
        b.type='button';b.className='gp-j';b.textContent=s.t;
        b.addEventListener('click',function(ev){
          ev.preventDefault();ev.stopPropagation();
          try{s.el.scrollIntoView({block:'start',behavior:'smooth'});}catch(e){
            try{s.el.scrollIntoView();}catch(e2){}
          }
        });
        bar.appendChild(b);
      });
      /* 放在導覽列（上一位／下一位）底下，標題上面 */
      var nav=pane.querySelector('.sg-navbar');
      if(nav&&nav.parentNode)nav.parentNode.insertBefore(bar,nav.nextSibling);
      else body.insertBefore(bar,body.firstChild);
    }catch(e){}
  }

  /* ── 掛上去 ────────────────────────────────────────────────────── */
  function boot(){
    if(!hook()){ setTimeout(boot,400); return; }   /* teacher-app.js 還沒載完 */
    if(window.MutationObserver){
      var sched=false;
      new MutationObserver(function(){
        if(sched)return;sched=true;
        soon(function(){sched=false;scan();});
      }).observe(document.body,{childList:true,subtree:true});
    }
    scan();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
