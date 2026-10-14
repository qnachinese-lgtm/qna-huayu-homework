/* ══════════════════════════════════════════════════════════════════════
   FEECHK_V1525　收費體檢——一次把全部學生的錢掃一遍（只讀，不改任何東西）
   2026-10-14

   為什麼要有這個：收費算錯幾乎都不是算錯，是「少了一個數字」，
   而少掉的地方在畫面上長得跟正常的一模一樣：
     · 單價沒填 → lessonFee() 回 null → 那幾堂整個不算進應收，
       帳面上看起來「這位學生沒欠錢」，其實是沒算。
     · 兩種都有、但一對一單價沒填 → 一對一那幾堂全部不算（潘氏蘭就是這樣）。
     · 繳費用了別的幣別又沒填換算金額 → stuBill 不敢假設匯率，
       那筆錢等於沒收到，學生會一直掛著欠款。
   這三件都會讓數字「安靜地錯」，所以要有一個地方可以一次看完。

   ⚠ 只讀。不呼叫任何 DB 寫入，不改畫面上的任何值，按鈕只開一個視窗。
   ⚠ S 是 const，不會變成 window 的屬性，一律用裸的識別字加 typeof 保護。
   ⚠ 算法完全沿用 teacher-app.js 的 stuBill()／lessonFee()／eIsGrp()，
     不自己另寫一套——自己寫一套的話，體檢說沒事、帳卻還是錯，更糟。
   ══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  function st(k){ try{ return (typeof S!=='undefined'&&S&&S[k])||[]; }catch(e){ return []; } }
  function esc(t){ return String(t==null?'':t).replace(/[&<>"]/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function m(v,c){ try{ return money(v,c); }catch(e){ return String(v); } }
  function has(v){ return v!=null&&v!==''; }

  function audit(){
    var all=st('students').filter(function(s){ return s&&!s.is_test&&!s.deleted_at; });
    var noPrice=[],badCur=[],soloBlank=[],noType=[],owes=[],over=[],fifo=[];
    var checked=0;

    all.forEach(function(s){
      var log=Array.isArray(s.class_log)?s.class_log:[];
      var pays=Array.isArray(s.payments)?s.payments:[];
      if(!log.length&&!pays.length)return;          /* 還沒上課也沒繳費，沒什麼好查的 */
      /* 免費試學：本來就不該收錢，所以「單價沒填」對他不是毛病，
         這兩項跳過。幣別和餘額還是照看——試學的人一樣可能繳過錢。 */
      var trial=false; try{ trial=(typeof isTrial==='function')&&isTrial(s); }catch(e){}
      checked++;
      var b=null; try{ b=stuBill(s); }catch(e){}
      if(!b)return;
      var cur=s.currency||'VND';
      var both=false; try{ both=isBoth(s); }catch(e){}

      /* ① 有上課、卻算不出費用的堂數 —— 那幾堂完全沒進應收 */
      if(b.unknown>0&&!trial){
        var why=[];
        if(!has(s.tuition))why.push('團班單價沒填');
        if(both&&!has(s.tuition_solo))why.push('一對一單價沒填');
        noPrice.push({s:s,n:b.unknown,why:why.join('、')||'有幾堂的時數或單價湊不出金額'});
      }

      /* ② 繳了別的幣別又沒填換算金額 —— 那筆錢等於沒收到 */
      var oth=b.other||{};
      var ks=Object.keys(oth);
      if(ks.length)badCur.push({s:s,list:ks.map(function(k){return m(oth[k],k);}).join('、'),cur:cur});

      /* ③ 兩種都有、一對一單價空著（就算現在還沒上過一對一，之後一定會踩） */
      if(both&&!trial&&!has(s.tuition_solo)&&b.unknown===0)soloBlank.push({s:s});

      /* ④ 兩種都有，但有上課記錄沒標是哪一種 —— 那幾堂一律當團班算 */
      if(both){
        var n=log.filter(function(e){ return e&&e.date&&!e.free&&!e.ctype; }).length;
        if(n)noType.push({s:s,n:n});
      }

      /* ⑤ 兩種都有、而且有「沒標是哪一種課」的繳費 —— 那幾筆只能用推算的。
         PAYTYPE_V1528 之後標過的就不算在這裡了。 */
      if(both){
        var untag=pays.filter(function(p){
          return p&&Number(p.amount)&&p.ctype!=='group'&&p.ctype!=='solo'; }).length;
        if(untag)fifo.push({s:s,n:untag,all:pays.length});
      }

      /* ⑥ 欠 / 溢繳 */
      if(b.due>0.5)owes.push({s:s,v:b.due,cur:cur});
      else if(b.due<-0.5)over.push({s:s,v:-b.due,cur:cur});
    });

    var byV=function(a,b2){return b2.v-a.v;};
    owes.sort(byV);over.sort(byV);
    return {checked:checked,total:all.length,noPrice:noPrice,badCur:badCur,
            soloBlank:soloBlank,noType:noType,fifo:fifo,owes:owes,over:over};
  }

  function nm(s){ return esc(s.name||s.real_name||s.id); }
  function row(inner){ return '<div style="padding:6px 0;border-top:1px solid var(--line)">'+inner+'</div>'; }

  function block(title, tone, lead, rows, how){
    if(!rows)return '';
    var col=(tone==='bad')?'#A33227':(tone==='warn'?'#8A6A1F':'#1F6A54');
    return '<div class="card" style="margin-bottom:10px">'
      +'<b style="color:'+col+'">'+title+'</b>'
      +'<div class="hint" style="margin:4px 0 2px">'+lead+'</div>'
      +rows
      +(how?('<div class="hint" style="margin-top:8px">怎麼修：'+how+'</div>'):'')
      +'</div>';
  }

  function show(){
    var r;
    try{ r=audit(); }
    catch(e){ try{toast('體檢失敗：'+((e&&e.message)||e));}catch(_){ } return; }

    var h='<div class="modal"><div class="modal-head"><h3>🩺 收費體檢</h3>'
      +'<button class="x" data-act="closeModal">×</button></div><div class="modal-body">';
    h+='<div class="hint" style="margin-bottom:10px">把 <b>'+r.checked+'</b> 位有上課或有繳費記錄的學生'
      +'（共 '+r.total+' 位，測試帳號不算）照目前的算法掃一遍，'
      +'找出<b>會讓錢安靜算錯</b>的地方。<br><b>這個檢查只讀資料，不會改到任何東西。</b></div>';

    var bad=r.noPrice.length+r.badCur.length;
    if(!bad){
      h+='<div class="card" style="margin-bottom:10px"><b style="color:#1F6A54">✅ 沒有會讓錢算錯的問題。</b>'
        +'<div class="hint">每一位有上課記錄的學生，每一堂都算得出費用；每一筆繳費也都抵得到帳上。</div></div>';
    }

    /* 🔴 會讓錢算錯的 */
    if(r.noPrice.length)h+=block('🔴 有 '+r.noPrice.length+' 位學生的課「算不出費用」','bad',
      '這幾堂<b>完全沒有算進應收</b>——帳面上看起來不欠，其實是沒算到。',
      r.noPrice.map(function(x){ return row('<b>'+nm(x.s)+'</b>　<span class="hint">'
        +x.n+' 堂算不出來（'+esc(x.why)+'）</span>'); }).join(''),
      '打開那位學生 →〔✏️ 編輯〕→ 收費設定，把空著的單價填進去。填完這裡再按一次就會不見。');

    if(r.badCur.length)h+=block('🔴 有 '+r.badCur.length+' 位學生的繳費「抵不到帳」','bad',
      '繳的幣別跟帳單幣別不一樣，又沒填「換算金額」。'
      +'系統不會自己猜匯率，所以那幾筆<b>等於沒收到</b>，學生會一直掛著欠款。',
      r.badCur.map(function(x){ return row('<b>'+nm(x.s)+'</b>　<span class="hint">帳單用 '+esc(x.cur)
        +'，但有 '+esc(x.list)+' 沒換算</span>'); }).join(''),
      '到那位學生的繳費記錄，點那一筆，把「實際收到多少（帳單幣別）」填上去。');

    /* 🟡 現在還沒錯，但遲早會 */
    if(r.soloBlank.length)h+=block('🟡 有 '+r.soloBlank.length+' 位「兩種都有」的學生沒填一對一單價','warn',
      '現在還沒上過一對一，所以還沒出事。一上就會變成「算不出費用」。',
      r.soloBlank.map(function(x){ return row('<b>'+nm(x.s)+'</b>'); }).join(''),
      '編輯那位學生，把「一對一單價」填起來。');

    if(r.noType.length)h+=block('🟡 有 '+r.noType.length+' 位學生的舊上課記錄沒標是哪一種課','warn',
      '「兩種都有」的學生，沒標的那幾堂<b>一律當成團班</b>算。如果其中有一對一的課，錢就算少了。',
      r.noType.map(function(x){ return row('<b>'+nm(x.s)+'</b>　<span class="hint">'+x.n+' 堂沒標</span>'); }).join(''),
      '打開那位學生的上課記錄，把實際是一對一的那幾堂改過來。');

    if(r.fifo.length)h+=block('🟡 有 '+r.fifo.length+' 位「兩種都有」的學生，有幾筆繳費還沒標是哪一種課','warn',
      '沒標的那幾筆，分到兩種課上的時候是用<b>先抵最早的課</b>去推的。'
      +'總額一定對，但「一對一欠多少、團班欠多少」可能不是實際情況。',
      r.fifo.map(function(x){ return row('<b>'+nm(x.s)+'</b>　<span class="hint">'
        +x.n+'／'+x.all+' 筆沒標</span>'); }).join(''),
      '點那一筆繳費的〔✏️ 編輯〕，最下面「這筆是哪一種課的錢」選一下就好。'
      +'之後新增繳費的時候也會問。標過的就直接抵那一種課，不再用推算的。');

    /* ⚪️ 參考 */
    if(r.owes.length){
      h+='<div class="card" style="margin-bottom:10px"><b>還沒收到的（由多到少，前 15 位）</b>'
        +r.owes.slice(0,15).map(function(x){ return row('<b>'+nm(x.s)+'</b>　'+m(x.v,x.cur)); }).join('')
        +(r.owes.length>15?('<div class="hint" style="padding-top:6px">還有 '+(r.owes.length-15)+' 位</div>'):'')
        +'</div>';
    }
    if(r.over.length){
      h+='<div class="card" style="margin-bottom:10px"><b>預繳（還沒上完的錢，隨時可以全額退）</b>'
        +r.over.slice(0,15).map(function(x){ return row('<b>'+nm(x.s)+'</b>　'+m(x.v,x.cur)); }).join('')
        +'</div>';
    }

    h+='</div><div class="modal-foot"><button class="btn btn-ghost" data-act="closeModal">關閉</button></div></div>';
    try{ openModal(h); }catch(e){ try{toast('畫不出來：'+((e&&e.message)||e));}catch(_){ } }
  }

  function mount(){
    try{
      var ref=document.querySelector('[data-act="monthBills"]');
      if(!ref||document.getElementById('fchk-btn'))return;
      var b=document.createElement('button');
      b.id='fchk-btn';b.type='button';b.className='btn btn-sm';
      b.textContent='🩺 收費體檢';
      b.title='一次掃過全部學生的收費設定和繳費記錄，只讀不改';
      b.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();show();});
      ref.parentNode.insertBefore(b,ref.nextSibling);
    }catch(e){}
  }

  /* RAF_V1518 背景分頁裡 rAF 完全不跑，要退回 setTimeout */
  function soon(fn){
    try{ if(document.hidden){setTimeout(fn,60);return;} }catch(e){}
    if(window.requestAnimationFrame)requestAnimationFrame(fn); else setTimeout(fn,16);
  }
  if(window.MutationObserver){
    var sched=false;
    new MutationObserver(function(){
      if(sched)return;sched=true;
      soon(function(){sched=false;mount();});
    }).observe(document.documentElement,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);
  else mount();
})();
