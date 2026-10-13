/* ══════════════════════════════════════════════════════════════════════
   GFIX_V1511　批改：可以推翻自動批改的對錯
   2026-10-12

   Quinn：「改對錯、改分數」——自動批改判錯的題目，她想改成對。
   查出來的現況：作業簿的分數是學生按「交卷」時在他那邊算完
   （student-app.js 的 wbGrade），存成 results 文件上的一個 score 物件；
   後台只負責顯示。整個系統沒有任何覆寫的地方。

   做法：
   · 每一列「錯的題目」右邊加一顆「改成答對」。
   · 按下去記在 fix 這個欄位（用那一列的標籤當 key，例如「一、聽力 1」）。
   · 存檔時重算分數寫回 score，原本的自動分數備份到 score_auto。
     這樣學生端完全不用改——他讀的就是 score，會直接看到改過的分數。
   · 只「加分」不「扣分」：這一版只列得出答錯的題目，所以只做
     錯→對。要把對的改成錯，要先把全部題目列出來，那是下一輪。

   ⚠ score_auto 只在第一次寫，之後不再覆蓋——不然按第二次就會把
     「上一次調整過的分數」當成自動分數，越調越高。
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


  /* 標籤 → 分數物件裡的欄位。對不到就只加總分，不動分項。 */
  var SEC=[['聽力','listen'],['詞彙選擇','vocab'],['選詞填空','cloze'],
           ['配合題','match'],['閱讀','read'],['聲調','tone'],['發音','pron'],
           ['是非','tf'],['漢字','hz'],['排序','ord']];
  function secOf(label){
    for(var i=0;i<SEC.length;i++)if(label.indexOf(SEC[i][0])>=0)return SEC[i][1];
    return '';
  }

  /* ⚠ teacher-app.js 的 S 是用 const 宣告的——const 不會變成 window 的屬性，
     只有 var 會。所以這裡不能寫 window.S，要直接用 S 這個名字去拿。
     （我第一版寫成 window.S，結果永遠讀到空陣列，按鈕一顆都長不出來。） */
  function wbDocs(){
    try{ return (typeof S!=='undefined'&&S&&S.wbdocs)||[]; }catch(e){ return []; }
  }
  function paneDoc(){
    var btn=document.querySelector('[data-act="saveWbReview"][data-id]');
    if(!btn)return null;
    var id=btn.getAttribute('data-id');
    var sd=wbDocs().filter(function(x){return x&&x.id===id;})[0];
    return sd||null;
  }

  function baseScore(sd){
    /* 原始的自動分數：第一次調整之前就是 score 本身 */
    var b=(sd&&sd.score_auto)||(sd&&sd.score)||{};
    return b;
  }

  function adjusted(sd){
    var base=baseScore(sd), fix=(sd&&sd.fix)||{};
    var out=JSON.parse(JSON.stringify(base||{}));
    var n=0;
    Object.keys(fix).forEach(function(k){
      if(!fix[k])return;
      n++;
      var s=secOf(k);
      if(s&&out[s]&&typeof out[s].ok==='number')out[s].ok++;
    });
    out.ok=(typeof base.ok==='number'?base.ok:0)+n;
    out.total=(typeof base.total==='number'?base.total:0);
    return {score:out,改了幾題:n};
  }

  function paintPill(sd){
    var wrap=document.querySelector('.wb-bad');
    var host=wrap?wrap.parentNode:null;
    /* 「自動批改 X/Y」那顆標籤旁邊 */
    var tags=document.querySelectorAll('.tag.tpub-y');
    var auto=null;
    for(var i=0;i<tags.length;i++)
      if(/自動批改/.test(tags[i].textContent||'')){auto=tags[i];break;}
    if(!auto)return;
    var old=document.getElementById('gfix-pill');
    var a=adjusted(sd);
    if(!a.改了幾題){ if(old)old.remove(); return; }
    if(!old){
      old=document.createElement('span');
      old.id='gfix-pill';old.className='tag gfix-pill';
      auto.parentNode.insertBefore(old,auto.nextSibling);
    }
    old.textContent='老師調整後 '+a.score.ok+'/'+a.score.total+'（+'+a.改了幾題+'）';
  }

  function mount(){
    try{
      var sd=paneDoc();
      if(!sd)return;
      var rows=document.querySelectorAll('.wb-bad .wb-b');
      if(!rows.length)return;
      sd.fix=sd.fix||{};
      for(var i=0;i<rows.length;i++)(function(row){
        if(row.__gfix)return;
        var lb=row.querySelector('.wb-bl');
        var key=lb?(lb.textContent||'').replace(/\s+/g,' ').trim():'';
        if(!key)return;
        var b=document.createElement('button');
        b.type='button';b.className='gfix-b';
        var paint=function(){
          var on=!!sd.fix[key];
          b.className='gfix-b'+(on?' on':'');
          b.textContent=on?'✓ 已改成答對':'改成答對';
          row.className='wb-b'+(on?' gfix-on':'');
        };
        b.addEventListener('click',function(ev){
          ev.preventDefault();ev.stopPropagation();
          if(sd.fix[key])delete sd.fix[key];else sd.fix[key]=true;
          paint();paintPill(sd);
        });
        var bar=document.createElement('div');
        bar.className='gfix-bar';bar.appendChild(b);
        row.appendChild(bar);
        row.__gfix=1;
        paint();
      })(rows[i]);
      paintPill(sd);
    }catch(e){}
  }

  /* 存檔的時候把調整寫進資料 */
  function hookSave(){
    if(typeof H!=='object'||!H)return false;
    var orig=H.saveWbReview;
    if(typeof orig!=='function'||orig.__gfix)return !!(orig&&orig.__gfix);
    var wrapped=async function(id,b){
      try{
        var sd=wbDocs().filter(function(x){return x&&x.id===id;})[0];
        if(sd&&sd.fix&&Object.keys(sd.fix).length){
          var base=baseScore(sd);
          var a=adjusted(sd);
          var patch={fix:sd.fix,score:a.score};
          /* 只在還沒備份過的時候寫 score_auto，不然會越調越高 */
          if(!sd.score_auto)patch.score_auto=JSON.parse(JSON.stringify(base));
          await DB.update('results',id,patch);
          Object.assign(sd,patch);
        }
      }catch(e){
        try{toast('分數調整沒存成功：'+((e&&e.message)||e));}catch(_){}
      }
      return orig.call(H,id,b);
    };
    wrapped.__gfix=1;
    H.saveWbReview=wrapped;
    return true;
  }

  function boot(){
    if(!hookSave()){setTimeout(boot,400);return;}
    if(window.MutationObserver){
      var sched=false;
      new MutationObserver(function(){
        if(sched)return;sched=true;
        soon(function(){sched=false;mount();});
      }).observe(document.body,{childList:true,subtree:true});
    }
    mount();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
