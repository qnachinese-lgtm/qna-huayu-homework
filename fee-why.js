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

  /* ══════════════════════════════════════════════════════════════════
     BOTHSPLIT_V1514　「兩種都有」的學生，兩邊各算各的
     Quinn：「潘氏蘭一對一欠 600 多、團班欠 200，你為什麼把全部錢都算到一對一了？」

     原因：stuBill() 一個學生只算一份帳，不分課別。畫面把那一份完整的帳
     印在學生出現的每一個區塊裡，所以「一對一」那一區顯示的是她兩種課
     加起來的 3,690.5 和欠 840.5，「團班」那一區又印一次同樣的數字，
     再用一行小字說「不重複算進小計」。錢沒有被加兩次，但每一區的數字
     都不等於它的標題——這就是她看到的「全部算到一對一」。

     怎麼拆：
     · 應收：逐堂拆，一堂屬於團班就記團班，屬於一對一就記一對一。這一段
       完全沒有假設，跟 lessonFee 同一套。
     · 已繳：繳費記錄上沒有註明是哪一種課，所以一定要有一條規則。
       這裡用「先抵最早的課」（先到先抵），也就是一般對帳的做法：
       錢從最舊的那一堂開始扣，扣完為止。規則會寫在「怎麼算的」裡面，
       逐堂明細也看得到每一堂抵掉多少，老師可以自己核。
     · 兩邊的欠款加起來，一定等於原本那一個總數。
     ══════════════════════════════════════════════════════════════════ */
  var COVER=(typeof WeakMap==='function')?new WeakMap():{get:function(){return null;},set:function(){}};
  function splitBill(s){
    var b=g('stuBill')(s);
    if(!b)return null;
    var pool=(Number(b.paid)||0)+(Number(b.waived)||0);
    var out={g:{charge:0,paid:0,qty:0,n:0},so:{charge:0,paid:0,qty:0,n:0},
             lastSide:'so',over:0,cur:g('billCur')(s)};
    (b.items||[]).forEach(function(it){
      var e=it.e, f=Number(it.f)||0;
      var side=g('eIsGrp')(s,e)?'g':'so';
      var cover=Math.min(pool,f);pool=Math.round((pool-cover)*100)/100;
      out[side].charge+=f;out[side].paid+=cover;out[side].n++;
      var h=g('logHours')(e);
      out[side].qty+=g('eHourly')(s,e)?((h!=null)?h:1):1;
      out.lastSide=side;
      try{COVER.set(e,Math.round(cover*100)/100);}catch(_){}   /* 給「怎麼算的」用 */
    });
    ['g','so'].forEach(function(k){
      out[k].charge=Math.round(out[k].charge*100)/100;
      out[k].paid=Math.round(out[k].paid*100)/100;
      out[k].qty=Math.round(out[k].qty*100)/100;
      out[k].due=Math.round((out[k].charge-out[k].paid)*100)/100;
    });
    out.over=Math.round(pool*100)/100;        /* 繳超過的，掛在最後一堂那一邊 */
    if(out.over>0)out[out.lastSide].due=Math.round((out[out.lastSide].due-out.over)*100)/100;
    out.gu=(s.fee_unit==='hour')?'小時':'堂';
    out.su=(s.fee_unit_solo==='hour')?'小時':'堂';
    return out;
  }

  function isBothStu(s){
    try{ return (typeof isBoth==='function')?isBoth(s):(s&&s.class_type==='兩種'); }
    catch(e){ return !!(s&&s.class_type==='兩種'); }
  }

  /* 這一區是「一對一」還是團班 */
  function sideOfGroup(grpEl){
    var h=grpEl.querySelector('.pay-gh');
    var t=(h&&h.textContent)||'';
    if(t.indexOf('合併帳戶')>=0)return null;      /* 家庭合併帳戶不動 */
    return (t.indexOf('一對一')>=0)?'so':'g';
  }

  function fixRow(row,side){
    var pay=row.querySelector('[data-act="payments"][data-id]');
    if(!pay)return null;
    var s=stuOf(pay.getAttribute('data-id'));
    if(!s||!isBothStu(s))return null;
    var sp=splitBill(s);
    if(!sp)return null;
    var part=sp[side==='g'?'g':'so'];
    var M=g('money'), Q=g('fmtQty'), cur=sp.cur;
    var set=function(sel,html){var el=row.querySelector(sel);if(el)el.innerHTML=html;};
    set('.pay-c[data-l="上課"]','<b>'+Q(part.qty)+'</b> '+(side==='g'?sp.gu:sp.su));
    set('.pay-c[data-l="應收"]','<b>'+(part.n?M(part.charge,cur):'—')+'</b>');
    set('.pay-c[data-l="已繳"]','<b>'+M(part.paid,cur)+'</b>');
    var st=row.querySelector('.pay-stw');
    if(st)st.innerHTML=(part.due>0.0001)
      ?('<span class="pay-st owe">欠 '+M(part.due,cur)+'</span>')
      :(part.due<-0.0001?('<span class="pay-st over">預繳 '+M(-part.due,cur)+'</span>')
                        :'<span class="pay-st ok">✅ 已結清</span>');
    row.classList.toggle('is-owe',part.due>0.0001);
    row.setAttribute('data-bs',side);
    return {cur:cur,due:part.due};
  }

  /* 區塊標題的「還沒收」要跟著重算 */
  function fixGroupSum(grpEl,extra){
    var gs=grpEl.querySelector('.pay-gs');
    if(!gs)return;
    var M=g('money');
    var d={};
    var rows=grpEl.querySelectorAll('.pay-row');
    for(var i=0;i<rows.length;i++){
      var pay=rows[i].querySelector('[data-act="payments"][data-id]');
      if(!pay)continue;
      var s=stuOf(pay.getAttribute('data-id'));
      if(!s)continue;
      var cur=g('billCur')(s), due;
      if(rows[i].getAttribute('data-bs')){
        var sp=splitBill(s);if(!sp)continue;
        due=sp[rows[i].getAttribute('data-bs')==='g'?'g':'so'].due;
      }else{
        var bb=g('stuBill')(s);if(!bb||!bb.items.length)continue;
        due=bb.due;
      }
      if(due>0.0001)d[cur]=Math.round(((d[cur]||0)+due)*100)/100;
    }
    var ks=Object.keys(d);
    if(ks.length){
      gs.className='pay-gs';
      gs.textContent='還沒收 '+ks.map(function(c){return M(d[c],c);}).join(' ＋ ');
    }else{
      gs.className='pay-gs ok';
      gs.textContent='✅ 都收齊了';
    }
  }

  /* 拆開之後，「兩種都有」的人在這一區就是正式的一員，
     標題不能再寫「0 位 ＋1 位兩種都有」。 */
  function fixGroupTag(grpEl){
    var tag=grpEl.querySelector('.pay-gh .tag');
    if(!tag)return;
    var n=0,k=0;
    var rows=grpEl.querySelectorAll('.pay-row');
    for(var i=0;i<rows.length;i++){
      var pay=rows[i].querySelector('[data-act="payments"][data-id]');
      if(!pay)continue;
      n++;
      var s=stuOf(pay.getAttribute('data-id'));
      if(s&&isBothStu(s))k++;
    }
    if(!n)return;
    tag.textContent=n+' 位'+(k?('　其中 '+k+' 位兩種都有'):'');
  }

  function splitScan(){
    try{
      if(!ready())return;
      var grps=document.querySelectorAll('.pay-grp');
      for(var i=0;i<grps.length;i++){
        var grp=grps[i];
        var side=sideOfGroup(grp);
        if(!side)continue;
        var touched=false;
        var rows=grp.querySelectorAll('.pay-row');
        for(var j=0;j<rows.length;j++){
          if(rows[j].getAttribute('data-bs'))continue;
          if(fixRow(rows[j],side))touched=true;
        }
        /* 拆開之後，「這裡不重複算進上面的小計」那一行就不再成立了 */
        var notes=grp.querySelectorAll('.pay-famnote');
        for(var k=0;k<notes.length;k++){
          if((notes[k].textContent||'').indexOf('不重複算進')>=0)notes[k].remove();
        }
        if(touched||grp.__bs!==1){grp.__bs=1;fixGroupSum(grp);fixGroupTag(grp);}
      }
    }catch(e){}
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
    var sp=splitBill(s);   /* 順便把每一堂抵掉多少算好（COVER） */
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
          /* 這一堂被繳的錢抵掉多少（先到先抵） */
          var cv=null;try{cv=COVER.get(e);}catch(_){}
          if(cv!=null){
            amt+=(cv>=f-0.0001)
              ? '<span class="fw-cv ok">已付清</span>'
              : (cv>0.0001 ? ('<span class="fw-cv">抵 '+M(cv,cur)+'，還欠 '+M(Math.round((f-cv)*100)/100,cur)+'</span>')
                           : '<span class="fw-cv">還沒付</span>');
          }
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
    var split='';
    if(both&&sp){
      var line=function(lab,o){
        return '<div class="fw-sr"><span class="fw-sl">'+lab+'</span>'
          +'<span>應收 <b>'+M(o.charge,cur)+'</b></span>'
          +'<span>已繳 <b>'+M(o.paid,cur)+'</b></span>'
          +'<span class="fw-sd">'+((o.due>0.0001)?('欠 <b>'+M(o.due,cur)+'</b>')
              :(o.due<-0.0001?('預繳 <b>'+M(-o.due,cur)+'</b>'):'<b>已結清</b>'))+'</span></div>';
      };
      split='<div class="fw-split"><b>這位學生兩種課都有，兩邊分開算：</b>'
        +line('👥 團班',sp.g)+line('🧑‍🏫 一對一',sp.so)
        +'<div class="fw-rule">應收是逐堂拆的，不用猜。<b>已繳沒辦法逐堂拆</b>——繳費記錄上沒有寫這筆是繳哪一種課，'
        +'所以規則是<b>「先抵最早的課」</b>：錢從最舊的那一堂開始扣，扣完為止。'
        +'上面每一堂右邊都有寫抵掉多少，可以自己核。兩邊的欠款加起來一定等於下面的總數。</div></div>';
    }

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
      splitScan();
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
