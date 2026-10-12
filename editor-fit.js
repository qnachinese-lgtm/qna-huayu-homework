/* ══════════════════════════════════════════════════════════════════════
   EDFIT_V1503　課文編輯器：框子跟著內容長高
   2026-10-12

   Quinn：「框子都好小」「為甚麼那麼小」。
   原因有兩個，一個在 CSS（min-height:100px、欄寬 max-width:860px），
   另一個是不管貼進去幾行，框子都是固定高度，長課文只能在小框裡捲。
   這一支負責第二個：貼完或打完，框子自己長到剛好，最高到畫面的 60%，
   超過才出現捲軸——那是為了避免一課 80 行把整頁拉到幾千像素長。

   只對「整頁課文編輯器」（.ed2-on）裡的 textarea 作用，
   其他地方的輸入框完全不碰。
   ══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  function cap(){ return Math.round((window.innerHeight||800)*0.6); }

  function fit(t){
    if(!t||t.tagName!=='TEXTAREA')return;
    try{
      /* 先把高度放掉才量得到內容真正需要多高；量完馬上設回去，
         中間不會畫面，所以不會閃。                                   */
      var keep=t.style.height;
      t.style.height='auto';
      var need=t.scrollHeight+2;
      var min=parseFloat(getComputedStyle(t).minHeight)||0;
      var h=Math.min(Math.max(need,min),cap());
      t.style.height=h+'px';
      /* 內容比上限還高的時候才留捲軸 */
      t.style.overflowY=(need>cap())?'auto':'hidden';
      if(keep&&keep===t.style.height)return;
    }catch(e){}
  }

  function fitAll(){
    var root=document.querySelector('.ed2-on');
    if(!root)return;
    var ts=root.querySelectorAll('textarea');
    for(var i=0;i<ts.length;i++){
      /* 藏起來的那幾頁量不到高度（scrollHeight 會是 0），跳過；
         等 edApply 把它顯示出來，MutationObserver 會再叫一次。      */
      if(!ts[i].offsetHeight&&!ts[i].value)continue;
      fit(ts[i]);
    }
  }

  /* 打字、貼上 */
  document.addEventListener('input',function(e){
    var t=e.target;
    if(t&&t.tagName==='TEXTAREA'&&t.closest&&t.closest('.ed2-on'))fit(t);
  },true);
  document.addEventListener('paste',function(e){
    var t=e.target;
    if(t&&t.tagName==='TEXTAREA'&&t.closest&&t.closest('.ed2-on'))setTimeout(function(){fit(t);},0);
  },true);

  /* 編輯器重畫（換段落、換語法點、自動加拼音）之後再對一次。
     只盯 #modal-root——整頁編輯器是開在那裡面的，盯整個 document
     會把後台每一次 render 都跑一遍，太浪費。
     只看 childList 不看 attributes：fit() 自己會改 style.height，
     看 attributes 會變成自己觸發自己的無窮迴圈。                    */
  if(window.MutationObserver){
    var host=document.getElementById('modal-root')||document.body;
    var sched=false;
    new MutationObserver(function(){
      if(sched)return;
      sched=true;
      requestAnimationFrame(function(){ sched=false; fitAll(); });
    }).observe(host,{childList:true,subtree:true});
  }
  window.addEventListener('resize',function(){ fitAll(); });

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fitAll);
  else fitAll();
})();
