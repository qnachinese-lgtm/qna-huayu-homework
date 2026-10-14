/* ══════════════════════════════════════════════════════════════════════
   FEEFLD_V1522　學生的「收費設定」只顯示真的會用到的那一組
   2026-10-14

   Quinn 看到那四格的時候說「這樣有衝突」，勾了三件事：
     · 畫面看不出哪一個在用
     · 「每小時」和「每堂」不該並存
     · 一對一的學生應該用右邊那組

   查出來的實際規則（teacher-app.js 的 eTuition／eHourly）：
     班別＝兩種都有 → 左邊那組算團班的課，右邊那組算一對一的課
     班別＝其他     → **右邊那組程式完全不看**，一律用左邊那組
   所以一位「一對一」的學生，她吃的是標著「學費單價」的左邊那一組，
   而標著「一對一單價」的右邊那一組一點作用都沒有——難怪看起來在打架。

   這一支只動畫面，不動任何計費邏輯、不改任何金額：
     1. 左邊那組依班別改名：一對一的學生寫「一對一單價／一對一計費方式」，
        團班寫「團班單價／團班計費方式」，兩種都有寫「團班…」。
     2. 班別不是「兩種都有」的時候，右邊那組整組收起來（只是 display:none，
        欄位還在、值也還在，存檔照舊，不會把資料洗掉）。
     3. 下面補一行白話：「這位學生現在算：一對一 350／每小時」。
     4. 收起來的那一組如果填了跟現在不一樣的值，會講出來，並給一顆
        〔改用那一組〕把值填進看得到的欄位——只填表單，要按儲存才生效。

   ⚠ 不可以用 disabled：saveStudent 是直接讀 #f-fee2.value，
     欄位被移除或清空會把學生的資料洗掉。所以一律只用 CSS 藏。
   ══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  function $(id){return document.getElementById(id);}
  function fieldOf(el){return el&&el.closest?el.closest('.field'):null;}
  function money(v,cur){
    try{ return (typeof window.money==='function')?window.money(v,cur):String(v); }
    catch(e){ return String(v); }
  }
  function unitTx(u){return (u==='hour')?'每小時':'每堂';}

  function setLabel(el,txt){
    var f=fieldOf(el);if(!f)return;
    var lb=f.querySelector('label');if(!lb)return;
    var hint=lb.querySelector('.hint');
    lb.textContent=txt;
    if(hint)lb.appendChild(hint);
  }

  function apply(){
    var type=$('f-type'),fee=$('f-fee'),fee2=$('f-fee2'),u1=$('f-feeunit'),u2=$('f-feeunit2');
    if(!type||!fee||!fee2||!u1||!u2)return;
    var both=(type.value==='兩種');
    var grp=(type.value==='團班');
    var cur=($('f-cur')&&$('f-cur').value)||'VND';

    /* 1. 左邊那組依班別改名 */
    setLabel(fee, both?'團班單價 ':(grp?'團班單價 ':'一對一單價 '));
    setLabel(u1,  both?'團班計費方式 ':(grp?'團班計費方式 ':'一對一計費方式 '));

    /* 2. 不是「兩種都有」就把右邊那組收起來（只藏，不清值） */
    var f2=fieldOf(fee2),fu2=fieldOf(u2);
    if(f2)f2.classList.toggle('ff-hide',!both);
    if(fu2)fu2.classList.toggle('ff-hide',!both);

    /* 3. 一行白話 */
    var box=$('ff-now');
    if(!box){
      box=document.createElement('div');box.id='ff-now';box.className='ff-now field full';
      var host=fieldOf($('f-cur'));
      if(host&&host.parentNode)host.parentNode.insertBefore(box,host.nextSibling);
      else return;
    }
    var v1=(fee.value===''?null:fee.value), v2=(fee2.value===''?null:fee2.value);
    var line;
    if(both){
      line='這位學生兩種課都有，<b>兩組都會用到</b>：團班用上面那組（'
        +(v1==null?'<span class="ff-warn">單價沒填</span>':(money(Number(v1),cur)+'／'+unitTx(u1.value)))
        +'），一對一用下面那組（'
        +(v2==null?'<span class="ff-warn">單價沒填，那幾堂會算成「不知道費用」</span>'
                  :(money(Number(v2),cur)+'／'+unitTx(u2.value)))+'）。';
    }else{
      line='這位學生現在算：<b>'+(grp?'團班':'一對一')+' '
        +(v1==null?'<span class="ff-warn">單價沒填</span>':(money(Number(v1),cur)+'／'+unitTx(u1.value)))
        +'</b>。';
      /* 4. 收起來那一組如果有不一樣的值，講出來 */
      if(v2!=null&&(v2!==v1||u2.value!==u1.value)){
        line+='<br><span class="ff-warn">另外填過一組 '+money(Number(v2),cur)+'／'+unitTx(u2.value)
          +'，但班別不是「兩種都有」，系統不會用到它。</span>'
          +' <button type="button" class="btn btn-sm" id="ff-use">改用那一組</button>';
      }
    }
    box.innerHTML=line;
    var use=$('ff-use');
    if(use&&!use.__ff){
      use.__ff=1;
      use.addEventListener('click',function(ev){
        ev.preventDefault();ev.stopPropagation();
        fee.value=fee2.value;u1.value=u2.value;
        try{fee.dispatchEvent(new Event('input',{bubbles:true}));}catch(e){}
        apply();
        try{toast('已填進上面那一組，記得按「儲存」才算數');}catch(e){}
      });
    }
  }

  function bind(){
    ['f-type','f-fee','f-fee2','f-feeunit','f-feeunit2','f-cur'].forEach(function(id){
      var el=$(id);if(!el||el.__ff)return;el.__ff=1;
      el.addEventListener('change',apply);
      el.addEventListener('input',apply);
    });
  }

  function scan(){ try{ if($('f-fee')&&$('f-fee2')){bind();apply();} }catch(e){} }

  function soon(fn){
    try{ if(document.hidden){setTimeout(fn,60);return;} }catch(e){}
    if(window.requestAnimationFrame)requestAnimationFrame(fn); else setTimeout(fn,16);
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
