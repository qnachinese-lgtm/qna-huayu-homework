/* ══════════════════════════════════════════════════════════════════════
   QTCUR_V1513　報價單：先選到「真的有價錢」的那個幣別
   2026-10-12

   Quinn：「這裡也怪怪」——開報價單，八個項目裡六個是灰的，
   每一個都寫「這個幣別沒設價」，看起來像壞掉。

   查出來的原因：價目表一個項目可以填兩個價（台灣收臺幣、越南收越南盾，
   而且不是換算的，是各自談好的數字）。開單的時候預設幣別是
   prAllCurs() 排序後的第一個，不是「有價錢的項目最多的那個」。
   所以只要排在前面的那個幣別剛好只設了兩項，整張單就六個灰的。

   這一支做三件事，都只動畫面，不改價目表、不改金額：
   1. 下拉選單每一個幣別後面標「幾／幾 項有價」。
   2. 一打開就自動選「有價錢的項目最多」的那個幣別。
   3. 灰掉的那幾列，直接寫出它在別的幣別是多少錢
      （「只有設 越南盾 350,000／堂」），這樣就知道是「沒設」還是「設錯幣別」。
   ══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  function fn(n){try{return (typeof window[n]==='function')?window[n]:null;}catch(e){return null;}}
  function ready(){return !!(fn('prSorted')&&fn('prAmt')&&fn('prCurs')&&fn('money')&&fn('prUnitStr'));}

  var CURN={VND:'越南盾 VND',TWD:'臺幣 NT$',USD:'美元 US$'};

  function coverage(){
    var list=fn('prSorted')(), amt=fn('prAmt');
    var tot=list.length, n={};
    list.forEach(function(p){
      (fn('prCurs')(p)||[]).forEach(function(c){
        if(amt(p,c)!=null)n[c]=(n[c]||0)+1;
      });
    });
    return {tot:tot,n:n};
  }

  function paintSelect(sel){
    if(sel.__qtc)return;
    sel.__qtc=1;
    var cov=coverage();
    var best=null,bestN=-1;
    for(var i=0;i<sel.options.length;i++){
      var o=sel.options[i], c=o.value, k=cov.n[c]||0;
      o.textContent=(CURN[c]||c)+'（'+k+'／'+cov.tot+' 項有價）';
      if(k>bestN){bestN=k;best=c;}
    }
    /* 一打開就選「有價錢的項目最多」的那一個 */
    if(best&&sel.value!==best){
      sel.value=best;
      try{sel.onchange&&sel.onchange();}catch(e){}
      try{sel.dispatchEvent(new Event('change',{bubbles:true}));}catch(e){}
    }
  }

  function paintNote(sel){
    var cov=coverage();
    var cur=sel.value, k=cov.n[cur]||0;
    var box=document.getElementById('qt-list');
    if(!box||!box.parentNode)return;
    var old=document.getElementById('qtc-note');
    if(k>=cov.tot){ if(old)old.remove(); return; }
    if(!old){
      old=document.createElement('div');
      old.id='qtc-note';old.className='qtc-note';
      box.parentNode.insertBefore(old,box);
    }
    /* 哪一個幣別最齊，順便講出來 */
    var alt='',altN=-1;
    Object.keys(cov.n).forEach(function(c){if(c!==cur&&cov.n[c]>altN){altN=cov.n[c];alt=c;}});
    old.innerHTML='這張單用 <b>'+(CURN[cur]||cur)+'</b>：'+cov.tot+' 項裡只有 <b>'+k+' 項</b>設了這個幣別的價錢，其他是灰的、勾不起來。'
      +(alt&&altN>k?('　改選 <b>'+(CURN[alt]||alt)+'</b> 的話有 <b>'+altN+' 項</b>。'):'')
      +'<br>要讓灰掉的項目也能報，去「💵 價目表」把那幾項的第二個價格填成 '+(CURN[cur]||cur)+'。';
  }

  /* 灰掉的那一列：寫出它在別的幣別是多少 */
  function paintRows(){
    var list=fn('prSorted')(), amt=fn('prAmt'), M=fn('money'), U=fn('prUnitStr');
    var by={};list.forEach(function(p){by[p.id]=p;});
    var rows=document.querySelectorAll('.qt-pick.qt-off');
    for(var i=0;i<rows.length;i++){
      var row=rows[i];
      if(row.__qtc)continue;
      row.__qtc=1;
      var ck=row.querySelector('.qt-ck[data-id]');
      if(!ck)continue;
      var p=by[ck.getAttribute('data-id')];
      if(!p)continue;
      /* money() 本身就會帶幣別（NT$10,000／3,000,000 VND），不要再前綴一次幣別名 */
      var other=(fn('prCurs')(p)||[]).filter(function(c){return amt(p,c)!=null;})
        .map(function(c){return M(amt(p,c),c)+U(p);});
      var pz=row.querySelector('.qt-pz');
      if(!pz)continue;
      pz.innerHTML=other.length
        ? '<span class="muted">這個幣別沒設價</span><span class="qtc-alt">只有設 '+other.join('、')+'</span>'
        : '<span class="muted">這一項完全沒設價</span>';
    }
  }

  function scan(){
    try{
      if(!ready())return;
      var sel=document.getElementById('qt-cur');
      if(!sel)return;
      paintSelect(sel);
      paintNote(sel);
      paintRows();
      if(!sel.__qtcL){
        sel.__qtcL=1;
        sel.addEventListener('change',function(){
          /* 原本的 onchange 會整塊重畫，等它畫完再補 */
          setTimeout(function(){paintNote(sel);paintRows();},0);
        });
      }
    }catch(e){}
  }

  function boot(){
    if(!ready()){setTimeout(boot,500);return;}
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
