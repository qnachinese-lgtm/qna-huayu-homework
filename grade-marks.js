/* ══════════════════════════════════════════════════════════════════════
   MARK_V1509　批改：每一題加「✓ 對 ／ ✎ 要改 ／ ✗ 錯」一鍵標記
   2026-10-12

   Quinn：「我感覺你現在讓我很難去修改學生作業，太多資訊，太亂了」。
   量出來的問題：一份作業 23 題、每題 285px、整份要捲 6550px，
   而且每一題底下都是一個空白的建議框——要嘛打字，要嘛什麼都不留，
   沒有「只想說這題對了」這種中間地帶。

   做法刻意「不新增資料欄位」：
   後台本來就有一套符號約定（批改草稿的圖例：✓ 沒問題／✎ 建議修改／
   ✗ 答錯了／○ 還沒作答），而且是寫在建議文字的開頭。
   這裡就沿用同一套——按鈕只是把符號加到那一題建議框的最前面。
   好處是：存檔走原本的路（feedback），學生端本來就看得到建議文字，
   符號會自動跟著出現，不用改資料庫、不用改安全規則、不用搬資料。

   涵蓋全部五種批改畫面（作業簿、造句、討論、語法練習、跟讀），
   是在畫面出現之後才掛上去的，所以不用去改那 1.7MB 的產生程式。
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


  var KINDS=['wbrev-fb','srev-fb','drev-fb','gprev-fb','shrev-fb'];
  var SEL=KINDS.map(function(c){return 'textarea.'+c;}).join(',');

  /* 跟後台圖例同一套符號。○（還沒作答）不做成按鈕——那是狀態，不是評分。 */
  var MARKS=[['✓','對','ok'],['✎','要改','fix'],['✗','錯','no']];
  var SYMS='✓✎✗○';
  var RE=new RegExp('^[\\s\\u3000]*(['+SYMS+'])[\\s\\u3000]*');

  function leading(v){ var m=String(v||'').match(RE); return m?m[1]:''; }
  function strip(v){ return String(v||'').replace(RE,''); }

  function paint(ta){
    var bar=ta.__gmBar; if(!bar)return;
    var cur=leading(ta.value);
    var bs=bar.querySelectorAll('button');
    for(var i=0;i<bs.length;i++)
      bs[i].className='gm-b gm-'+bs[i].getAttribute('data-k')+(bs[i].getAttribute('data-sym')===cur?' on':'');
  }

  function apply(ta,sym){
    var cur=leading(ta.value), rest=strip(ta.value);
    /* 再按一次同一顆＝取消標記 */
    ta.value=(cur===sym)?rest:(sym+' '+rest);
    paint(ta);
    /* 讓原本的程式知道內容變了（草稿、未存提示那些都是聽 input 的） */
    try{ta.dispatchEvent(new Event('input',{bubbles:true}));}catch(e){}
    if(cur!==sym){
      /* 標完游標停在符號後面，想補一句就直接打，不用再點一次 */
      try{ta.focus();ta.setSelectionRange(ta.value.length,ta.value.length);}catch(e){}
    }
  }

  function mount(ta){
    if(ta.__gmBar||!ta.parentNode)return;
    var bar=document.createElement('div');
    bar.className='gm-bar';
    MARKS.forEach(function(m){
      var b=document.createElement('button');
      b.type='button';
      b.setAttribute('data-sym',m[0]);
      b.setAttribute('data-k',m[2]);
      b.className='gm-b gm-'+m[2];
      /* MARKICON_V1592 Quinn：「符號已經夠用了，不需要寫對、錯、要改」。字放進提示，滑鼠移上去／報讀器還看得到 */
      b.textContent=m[0];b.title=m[1];b.setAttribute('aria-label',m[1]);
      b.addEventListener('click',function(ev){
        ev.preventDefault();ev.stopPropagation();
        apply(ta,m[0]);
      });
      bar.appendChild(b);
    });
    ta.parentNode.insertBefore(bar,ta);
    ta.__gmBar=bar;
    ta.addEventListener('input',function(){paint(ta);});
    paint(ta);
  }

  function scan(){
    try{
      var ls=document.querySelectorAll(SEL);
      for(var i=0;i<ls.length;i++){
        if(ls[i].__gmBar)paint(ls[i]);   /* 「帶入草稿」是直接塞 value，不會發 input */
        else mount(ls[i]);
      }
    }catch(e){}
  }

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
