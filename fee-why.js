/* ══════════════════════════════════════════════════════════════════════
   FEEWHY_V1513　收費・財務：每一列都可以問「這筆錢怎麼算出來的」
   2026-10-12

   Quinn：「這裡錢爲什麼感覺怪怪的？」
   畫面上只有一個「應收 NT$3,690.5」，沒有任何地方看得到它是怎麼加出來的，
   所以覺得怪也查不下去。對帳單裡其實有逐堂明細，但它在「⋯」裡面、
   而且是另開一個列印視窗，不是拿來「順手看一下」的。

   這一支在每一列加一顆〔？ 怎麼算的〕，按下去就在那一列底下展開：
     · 每一堂課：日期、團班還是一對一、幾小時、用哪個單價、這一堂多少錢
     · 不算錢的那幾堂也要列出來，並寫清楚為什麼不算
       （免收／一對一請假／單價沒填）
     · 最後是 應收 − 已繳 − 已處理 ＝ 目前
   算法完全沿用後台原本那一套（lessonFee／stuBill），所以數字一定跟上面一致——
   這支只是把同一筆帳攤開給人看，不自己算第二套。

   ⚠ 「兩種都有」的學生（團班＋一對一）在兩個區塊都會出現，
     而且兩邊顯示的都是「全部加起來」的總額，不是那一區自己的部分。
     這裡會把團班、一對一分開小計，先讓妳看得到差在哪。

   ⚠ S 是 const，不會變成 window 的屬性，一律用裸的識別字加 typeof 保護。
   ══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  function g(name){
    try{ return (typeof window[name]==='function')?window[name]:null; }catch(e){ return null; }
  }
  function students(){
    try{ return (typeof S!=='undefined'&&S&&S.students)||[]; }catch(e){ return []; }
  }
  function stuOf(id){
    var a=students();
    for(var i=0;i<a.length;i++)if(a[i]&&a[i].id===id)return a[i];
    return null;
  }
  function esc(t){
    return String(t==null?'':t).replace(/[&<>"]/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});
  }

  /* 後台原本的函式。少了哪一個就整個不掛，不要自己湊一套算法出來。 */
  var NEED=['stuBill','lessonFee','logHours','eIsGrp','eTuition','eHourly','tierInfoOf','billCur','money','fmtQty'];
  function ready(){
    for(var i=0;i<NEED.length;i++)if(!g(NEED[i]))return false;
    return true;
  }

  /* 這一堂為什麼是這個錢。跟 lessonFee 同一套判斷，順序也一樣。 */
  function why(s,e){
    var grp=g('eIsGrp')(s,e);
    var h=g('logHours')(e);
    var cur=g('billCur')(s);
    var M=g('money');
    /* 1. 團班級距：剛好對上某一個時數就用那個固定金額 */
    if(grp){
      var ti=g('tierInfoOf')(s);
      if(ti&&h!=null){
        for(var i=0;i<ti.tiers.length;i++){
          var t=ti.tiers[i];
          if(Math.abs(Number(t.h)-h)<0.01)
            return '團班「'+esc(ti.cls)+'」級距：'+(Math.round(Number(t.h)*100)/100)+' 小時 → '+M(Number(t.amt),cur);
        }
      }
    }
    /* 2. 單價 × 時數，或每堂一個價 */
    var tu=g('eTuition')(s,e);
    if(tu==null||tu==='')return '⚠️ 這一堂沒有單價可以用'+(grp?'（團班單價沒填）':'（一對一單價沒填）');
    if(!g('eHourly')(s,e))return M(Number(tu),cur)+' ／堂';
    if(h==null)return M(Number(tu),cur)+' ／小時，但這一堂沒填起訖時間，所以當 1 小時算';
    return M(Number(tu),cur)+' ／小時 × '+(Math.round(h*100)/100)+' 小時';
  }

  function build(s){
    var b=g('stuBill')(s);
    if(!b)return '<div class="fw-box">算不出來</div>';
    var cur=g('billCur')(s), M=g('money');
    var log=(Array.isArray(s.class_log)?s.class_log:[]).filter(function(e){return e&&e.date;})
      .slice().sort(function(a,c){return String(a.date).localeCompare(String(c.date));});

    var rows='', nG=0,nS=0, sumG=0,sumS=0, skipped=0;
    log.forEach(function(e){
      var grp=g('eIsGrp')(s,e);
      var kind=grp?'團班':'一對一';
      var h=g('logHours')(e);
      var hTx=(h==null?'—':(Math.round(h*100)/100)+' 小時');
      var cls='', note='', amt='';
      if(e.free){ cls='fw-skip'; note='🎁 免收，不算錢'; skipped++; }
      else if(!grp&&e.status==='leave'){ cls='fw-skip'; note='🌙 一對一請假，不算錢（改成補課）'; skipped++; }
      else{
        var f=g('lessonFee')(s,e);
        note=why(s,e);
        if(f==null){ cls='fw-bad'; amt='算不出來'; }
        else{
          amt=M(f,cur);
          if(grp){nG++;sumG+=f;}else{nS++;sumS+=f;}
          if(e.status==='leave')note='🌙 團班請假，照算　·　'+note;
        }
      }
      rows+='<div class="fw-r '+cls+'">'
        +'<span class="fw-d">'+esc(String(e.date).slice(0,10))+'</span>'
        +'<span class="fw-k '+(grp?'g':'s')+'">'+kind+'</span>'
        +'<span class="fw-h">'+hTx+'</span>'
        +'<span class="fw-w">'+note+'</span>'
        +'<span class="fw-a">'+amt+'</span></div>';
    });
    if(!rows)rows='<div class="fw-r fw-skip"><span class="fw-w">還沒有任何上課記錄</span></div>';

    sumG=Math.round(sumG*100)/100;sumS=Math.round(sumS*100)/100;
    var both=(nG>0&&nS>0);
    var split=both?('<div class="fw-split">這位學生兩種課都有：'
        +'團班 '+nG+' 堂 '+M(sumG,cur)+'　·　一對一 '+nS+' 堂 '+M(sumS,cur)
        +'<br>上面「一對一」和「團班」兩個區塊顯示的都是這兩段加起來的總額，不是各自的部分。</div>'):'';

    var other='';
    try{
      var o=b.other||{};var ks=Object.keys(o);
      if(ks.length)other='<div class="fw-t"><span>其他幣別的繳費（還沒換算，所以沒抵掉）</span><b>'
        +ks.map(function(k){return M(o[k],k);}).join('、')+'</b></div>';
    }catch(_){}

    return '<div class="fw-box">'
      +'<div class="fw-hd">這筆錢怎麼算出來的　<span class="fw-sub">跟上面同一套算法，只是攤開給妳看</span></div>'
      +'<div class="fw-r fw-head"><span class="fw-d">日期</span><span class="fw-k">類型</span>'
        +'<span class="fw-h">時數</span><span class="fw-w">怎麼算</span><span class="fw-a">這一堂</span></div>'
      +rows
      +split
      +'<div class="fw-t"><span>應收（上面這些加起來'+(skipped?('，另外 '+skipped+' 堂不算錢'):'')+'）</span><b>'+M(b.charge,cur)+'</b></div>'
      +'<div class="fw-t"><span>已繳</span><b>－'+M(b.paid,cur)+'</b></div>'
      +(b.waived?('<div class="fw-t"><span>已處理（不追這筆了'+(s.fee_waived_note?('：'+esc(s.fee_waived_note)):'')+'）</span><b>－'+M(b.waived,cur)+'</b></div>'):'')
      +other
      +'<div class="fw-t fw-tot"><span>目前</span><b>'+((b.due>0)?('欠 '+M(b.due,cur)):(b.due<0?('預繳 '+M(-b.due,cur)):'已結清'))+'</b></div>'
      +(b.unknown?('<div class="fw-warn">有 '+b.unknown+' 堂算不出費用（單價沒填），所以沒被算進應收。</div>'):'')
      +'</div>';
  }

  function toggle(row,id){
    var next=row.nextElementSibling;
    if(next&&next.classList&&next.classList.contains('fw-wrap')){next.remove();return false;}
    var s=stuOf(id);
    if(!s)return false;
    var w=document.createElement('div');
    w.className='fw-wrap';
    w.innerHTML=build(s);
    row.parentNode.insertBefore(w,row.nextSibling);
    return true;
  }

  function mount(row){
    if(row.__fw)return;
    var pay=row.querySelector('[data-act="payments"][data-id]');
    if(!pay)return;
    row.__fw=1;
    var id=pay.getAttribute('data-id');
    var b=document.createElement('button');
    b.type='button';b.className='btn btn-sm fw-b';b.textContent='？ 怎麼算的';
    b.addEventListener('click',function(ev){
      ev.preventDefault();ev.stopPropagation();
      var open=toggle(row,id);
      b.classList.toggle('on',open);
      b.textContent=open?'收起來':'？ 怎麼算的';
    });
    pay.parentNode.insertBefore(b,pay);
  }

  function scan(){
    try{
      if(!ready())return;
      var rows=document.querySelectorAll('.pay-row');
      for(var i=0;i<rows.length;i++)mount(rows[i]);
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
