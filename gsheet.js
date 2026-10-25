/* ══════════════════════════════════════════════════════════════════════
   GSHEET_V1641　批改分頁：作業原樣＋紅筆＋直接在句子上改（Quinn 選的 A＋D）
   （取代 gcard.js 一題一張卡。她說「設計很錯、很醜」，看了四種模板選了 A＋D。）

   只在批改分頁（teacher.html?grade=…，html 有 gwin）啟動。
   原本的批改畫面照樣在背後產生、藏起來（存檔、備份那些全部沿用，資料格式沒變），
   前面畫一份「像學生寫的那樣」的作業：
     · 每題：A 的話（＋句型）、B：學生的回答、紅字評語、小灰字參考答案，右邊兩個圓章 ✓ ✗
     · 學生的句子點「✎ 改句子」（或按 ✗）就能直接改；改過的地方用紅筆顯示：刪掉的劃線、補上的底線
     · 每打一個字自動存，右上角「已存 ✓」
     · 最下面：整體評語＋〔批完了 →〕，按了跳下一位
   改過的句子存在同一筆作答的 fix 欄位（{題目代號: 改好的句子}），學生端作業簿會照樣畫出紅筆刪改。
   其他種類（造句、討論…）學生端還沒有畫刪改的地方，所以同時把「改成：…」寫進那一題的建議裡。
   ══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var FB='textarea.wbrev-fb,textarea.srev-fb,textarea.drev-fb,textarea.gprev-fb,textarea.shrev-fb,input.gd-fb';
  var OV='#wbrev-overall,#srev-overall,#drev-overall,#gprev-overall,#shrev-overall,textarea.gd-cmt,#hwv-cmt,#fhw-cmt';
  var LEAD=/^[\s　]*([✓✎✗○])[\s　]*/;
  var FIXL=/^改成：[^\n]*\n?/;
  var key='', root=null, saving=false, again=false, tmr=null, built=false, FIX={}, fixDirty=false, isWb=false;

  function on(){return document.documentElement.classList.contains('gwin');}
  function pane(){return document.getElementById('sg-pane');}
  function fields(){var p=pane();return p?[].slice.call(p.querySelectorAll(FB)):[];}
  function ovEl(){var p=pane();return p?p.querySelector(OV):null;}
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function lead(v){var m=String(v||'').match(LEAD);return m?m[1]:'';}
  function rest(v){return String(v||'').replace(LEAD,'');}
  function cmtOf(v){return rest(v).replace(FIXL,'');}
  function boxOf(f){return (f.closest&&f.closest('.srev-item,.gd-q'))||f.parentNode;}
  function kOf(f){return f.getAttribute('data-k')||f.getAttribute('data-w')||f.getAttribute('data-fb')||'';}
  function refOf(f){
    var b=boxOf(f);if(!b)return '';
    var hs=b.querySelectorAll('.hint,.gd-refline');
    for(var i=0;i<hs.length;i++){var t=String(hs[i].textContent||'');var p=t.indexOf('參考答案');
      if(p>=0)return t.slice(p+4).replace(/^[\s：:]+/,'').trim();}
    return '';
  }
  function origOf(f){var b=boxOf(f);var s=b&&b.querySelector('.srev-sent');
    if(!s||s.querySelector('.muted'))return null;return String(s.textContent||'').trim();}
  function bSay(f){var b=boxOf(f);var s=b&&b.querySelector('.srev-sent');return !!(s&&s.classList.contains('wb-bsay'));}
  function cleanClone(el,dropSent){
    var c=el.cloneNode(true);
    [].slice.call(c.querySelectorAll('textarea,input,button,.gm-bar,.gs-reft,.ged-bar,.ged-box,.canned-fold,.canned-bar,.gs-pop,.ai-bar,.hint,.gd-refline'+(dropSent?',.srev-sent':''))).forEach(function(x){x.remove();});
    c.classList.remove('gs-fold');c.removeAttribute('data-mark');
    return c.innerHTML;
  }
  function title(){var p=pane();var h=p&&p.querySelector('.sg-head h3');return h?h.textContent:'批改';}
  function saveAct(done){
    var p=pane();if(!p)return null;
    var b=done?p.querySelector('[data-act^="save"][data-done="1"]'):null;
    b=b||p.querySelector('[data-act^="save"][data-done="0"]')||p.querySelector('[data-act="saveReview"]')||p.querySelector('[data-act^="save"]');
    return b?{act:b.getAttribute('data-act'),id:b.getAttribute('data-id')}:null;
  }
  function docById(id){
    try{var ks=['wbdocs','sentences','discussions','gpracs','shadows','hwvs','fhws','results'];
      for(var i=0;i<ks.length;i++){var a=(S&&S[ks[i]])||[];for(var j=0;j<a.length;j++)if(a[j]&&a[j].id===id)return a[j];}}catch(e){}
    return null;
  }
  /* ── 紅筆刪改：逐字比對 ── */
  function diffHtml(a,b){
    a=Array.from(String(a||''));b=Array.from(String(b||''));
    var n=a.length,m=b.length;if(n*m>90000)return '<del>'+esc(a.join(''))+'</del><ins>'+esc(b.join(''))+'</ins>';
    var L=[],i,j;for(i=0;i<=n;i++){L.push(new Array(m+1).fill(0));}
    for(i=n-1;i>=0;i--)for(j=m-1;j>=0;j--)L[i][j]=a[i]===b[j]?L[i+1][j+1]+1:Math.max(L[i+1][j],L[i][j+1]);
    var out='',mode='',buf='';
    function flush(){if(!buf)return;var t=esc(buf);out+=mode==='d'?'<del>'+t+'</del>':(mode==='i'?'<ins>'+t+'</ins>':t);buf='';}
    function push(md,ch){if(md!==mode){flush();mode=md;}buf+=ch;}
    i=0;j=0;
    while(i<n&&j<m){if(a[i]===b[j]){push('s',a[i]);i++;j++;}else if(L[i+1][j]>=L[i][j+1]){push('d',a[i]);i++;}else{push('i',b[j]);j++;}}
    while(i<n){push('d',a[i]);i++;}while(j<m){push('i',b[j]);j++;}
    flush();return out;
  }
  function setState(s){
    var el=document.getElementById('gx-st');if(!el)return;
    el.className='gx-st2 '+(s==='ok'?'ok':(s==='bad'?'bad':''));
    el.textContent=s==='ok'?'已存 ✓':(s==='bad'?'沒存到，再按一次':(s==='busy'?'存檔中…':''));
  }
  async function save(done){
    var a=saveAct(done);if(!a||typeof H!=='object'||typeof H[a.act]!=='function')return false;
    if(saving){again=true;return false;}
    saving=true;setState('busy');
    var t0=window.toast,ok=true;
    window.toast=function(m){if(/失敗|沒改成功|錯/.test(String(m||''))){ok=false;try{t0(m);}catch(e){}}};
    try{
      if(fixDirty){fixDirty=false;var clean={};Object.keys(FIX).forEach(function(k){if(FIX[k]!=null)clean[k]=FIX[k];});
        await DB.update('results',a.id,{fix_text:clean});var d=docById(a.id);if(d)d.fix_text=clean;}/* BETTER_V1644 欄位改名 fix_text：fix 已經被「改成答對」（grade-fix.js）用掉了 */
      await H[a.act](a.id,{dataset:{done:done?'1':'0'},disabled:false,textContent:''});
    }catch(e){ok=false;}
    finally{window.toast=t0;saving=false;}
    setState(ok?'ok':'bad');
    if(again){again=false;return save(false);}
    return ok;
  }
  function soon(){clearTimeout(tmr);setState('busy');tmr=setTimeout(function(){save(false);},700);}

  /* 把一題的狀態（符號＋評語＋改成）寫回背後那一格 */
  function writeBack(i,sym,cmt){
    var f=fields()[i];if(!f)return;
    var k=kOf(f),fx=FIX[k];
    var txt=((!isWb&&fx!=null&&String(fx).trim()&&fx!==origOf(f))?('改成：'+fx+(cmt?'\n':'')):'')+(cmt||'');
    f.value=(sym?(sym+' '):'')+txt;
    try{f.dispatchEvent(new Event('input',{bubbles:true}));}catch(e){}
  }
  function rowState(i){var f=fields()[i];return f?{sym:lead(f.value),cmt:cmtOf(f.value)}:{sym:'',cmt:''};}

  /* BETTER_V1644 Quinn：「有更好的答案，我要怎麼寫給他？」
     ✗＝在學生的句子上直接紅筆刪改；✓＋改句子＝學生沒錯，下面另外列「👍 更好的說法」 */
  function hasFix(f){var fx=FIX[kOf(f)];return fx!=null&&String(fx).trim()&&fx!==origOf(f);}
  function sentInner(i){
    var f=fields()[i];var o=origOf(f);if(o==null)return '';var fx=FIX[kOf(f)];
    if(!hasFix(f))return esc(o);
    if(lead(f.value)==='✓')return esc(o)+'<div class="gx-better">👍 也可以這樣說：<span>'+esc(fx)+'</span></div>';
    return diffHtml(o,fx);
  }
  function updSent(i){var bt=document.getElementById('gx-bt-'+i);if(bt)bt.innerHTML=sentInner(i);}
  function sentHtml(i){
    var f=fields()[i];var o=origOf(f);if(o==null)return '';
    return '<div class="gx-b">'+(bSay(f)?'<span class="gx-num"></span><b class="gx-sp">B：</b>':'')+'<span class="gx-bt" id="gx-bt-'+i+'" data-gs="edit" data-i="'+i+'" title="點一下就可以改">'+sentInner(i)+'</span>'
      +'<button type="button" class="gx-ed" data-gs="edit" data-i="'+i+'">✎ 改字／另一種說法</button></div>'
      +'<div class="gx-fixbox" id="gx-fx-'+i+'" hidden><textarea class="gx-fxta" data-i="'+i+'" rows="2"></textarea>'
      +'<div class="gx-fxbar"><button type="button" class="gx-mini" data-gs="fxdone" data-i="'+i+'">好了</button><button type="button" class="gx-mini" data-gs="fxundo" data-i="'+i+'">還原成學生寫的</button></div></div>';
  }
  function rowHtml(f,i){
    var st=rowState(i),ref=refOf(f),o=origOf(f);
    return '<div class="gx-q" data-row="'+i+'"><div class="gx-body">'
      +'<div class="gx-ctx">'+cleanClone(boxOf(f),o!=null).replace(/(<div class="srev-word">)\s*(\d+)\.\s*A\s*[：:]\s*/,'$1<span class="gx-num">$2.</span><b class="gx-sp">A：</b>')+'</div>'/* ABEVEN_V1645 A、B 對齊 */
      +sentHtml(i)
      +'<textarea class="gx-red" data-i="'+i+'" rows="1" placeholder="在這裡寫評語（紅字，可以不寫）">'+esc(st.cmt)+'</textarea>'
      +(ref?('<div class="gx-ref">參考：'+esc(ref)+'</div>'):'')
      +'</div><div class="gx-stamp"><button type="button" class="gx-st ok'+(st.sym==='✓'?' on':'')+'" data-gs="mark" data-s="✓" data-i="'+i+'" title="對">✓</button>'
      +'<button type="button" class="gx-st no'+(st.sym==='✗'?' on':'')+'" data-gs="mark" data-s="✗" data-i="'+i+'" title="錯">✗</button></div></div>';
  }
  function secOf(f){
    var n=boxOf(f);
    while(n&&n!==pane()){var p=n.previousElementSibling;
      while(p){if(/^H[34]$/.test(p.tagName))return p;var h=p.querySelector&&p.querySelector('h4');if(h)return h;p=p.previousElementSibling;}
      n=n.parentNode;}
    return null;
  }
  function draw(){
    if(!root)return;
    var fs=fields(),p=pane(),ov=ovEl();
    var sub='';try{var hint=p.querySelector('.sg-body > .hint');if(hint)sub=hint.textContent;}catch(e){}
    var h='<div class="gx-sheet"><div class="gx-bar"><span class="gx-who">'+esc(title())+'</span><span class="gx-sub">'+esc(sub)+'</span><span class="gx-sp"></span>'
      +'<span class="gx-st2" id="gx-st"></span><button type="button" class="gx-done" data-gs="done">批完了 →</button></div>';
    var lastSec=null;
    if(fs.length){
      fs.forEach(function(f,i){var s=secOf(f);if(s&&s!==lastSec){lastSec=s;h+='<div class="gx-sec">'+esc(s.textContent||'')+'</div>';}
        h+=rowHtml(f,i);});
    }else if(p){var bd=p.querySelector('.sg-body');if(bd)h+='<div class="gx-whole">'+cleanClone(bd,false)+'</div>';}
    if(ov)h+='<div class="gx-cmt"><label>'+(fs.length?'整體評語':'給學生的評語')+'</label><textarea id="gx-ov" rows="3" placeholder="可以不寫">'+esc(ov.value||'')+'</textarea></div>';
    h+='<div class="gx-foot"><span id="gx-left"></span><button type="button" class="gx-done" data-gs="done">批完了 →</button></div></div>';
    root.innerHTML=h;
    [].slice.call(root.querySelectorAll('.gx-red')).forEach(function(t){grow(t);
      t.addEventListener('input',function(){grow(t);var i=+t.getAttribute('data-i');writeBack(i,rowState(i).sym,t.value);left();soon();});});
    [].slice.call(root.querySelectorAll('.gx-fxta')).forEach(function(t){
      t.addEventListener('input',function(){grow(t);var i=+t.getAttribute('data-i');var f=fields()[i];if(!f)return;
        FIX[kOf(f)]=t.value;fixDirty=true;updSent(i);
        var st=rowState(i);writeBack(i,st.sym,st.cmt);soon();});});
    var o2=document.getElementById('gx-ov');
    if(o2){grow(o2);o2.addEventListener('input',function(){grow(o2);var x=ovEl();if(x){x.value=o2.value;try{x.dispatchEvent(new Event('input',{bubbles:true}));}catch(e){}soon();}});}
    left();
  }
  function grow(t){try{t.style.height='auto';t.style.height=Math.max(t.scrollHeight+2,t.classList.contains('gx-red')?34:48)+'px';}catch(e){}}
  function left(){var el=document.getElementById('gx-left');if(!el)return;
    var n=fields().filter(function(f){return !lead(f.value)&&!cmtOf(f.value).trim();}).length;
    el.textContent=n?('還有 '+n+' 題沒批'):'';}
  function openFix(i,focus){
    var f=fields()[i];if(!f)return;var box=document.getElementById('gx-fx-'+i);if(!box)return;
    var t=box.querySelector('textarea');var k=kOf(f);
    t.value=(FIX[k]!=null)?FIX[k]:(origOf(f)||'');box.hidden=false;grow(t);
    if(focus){try{t.focus({preventScroll:true});t.setSelectionRange(t.value.length,t.value.length);}catch(e){}}
  }
  function mark(i,sym){
    var st=rowState(i);var ns=(st.sym===sym)?'':sym;
    writeBack(i,ns,st.cmt);
    var row=root.querySelector('[data-row="'+i+'"]');
    if(row){[].slice.call(row.querySelectorAll('.gx-st')).forEach(function(b){b.classList.toggle('on',b.getAttribute('data-s')===ns);});}
    if(ns==='✗')openFix(i,true);
    /* BETTER_V1644 ✓ 的時候學生的句子不劃線；有寫改過的就當成「更好的說法」 */
    updSent(i);
    left();clearTimeout(tmr);save(false);
  }
  async function finish(){
    clearTimeout(tmr);
    [].slice.call(root.querySelectorAll('[data-gs="done"]')).forEach(function(b){b.disabled=true;b.textContent='存檔中…';});
    var cur=key;var ok=await save(true);
    if(!ok){[].slice.call(root.querySelectorAll('[data-gs="done"]')).forEach(function(b){b.disabled=false;b.textContent='批完了 →';});return;}
    var nx=null;
    try{var list=gradeQueue(false).filter(function(x){return x.pend&&(x.kind+'::'+x.id)!==cur;});
      list.sort(function(a,c){return String(a.ts||'').localeCompare(String(c.ts||''));});nx=list[0]||null;}catch(e){}
    /* NORELOAD_V1647 Quinn：「每次送出去以後就要重新跑一次登入」——本來是整頁重新載入，
       改成在同一頁直接換下一份，不重新整理、不重新登入 */
    if(nx){var nk=nx.kind+'::'+nx.id;
      try{history.replaceState(null,'','teacher.html?grade='+encodeURIComponent(nk));}catch(e){}
      try{S.gwin=nk;S.sgSel=nk;S.sgSplit=true;built=false;key='';renderGrades();}catch(e){location.href='teacher.html?grade='+encodeURIComponent(nk);return;}
      try{window.scrollTo(0,0);}catch(e){}
      root.innerHTML='<div class="gx-sheet gx-fin"><b>下一位載入中…</b></div>';
      return;}
    root.innerHTML='<div class="gx-sheet gx-fin"><div style="font-size:44px">🎉</div><b>全部批完了</b><div class="gx-sub">可以關掉這個分頁</div></div>';
  }
  document.addEventListener('click',function(ev){
    var b=ev.target&&ev.target.closest&&ev.target.closest('[data-gs]');
    if(!b||!root||!root.contains(b))return;
    ev.preventDefault();
    var k=b.getAttribute('data-gs'),i=+b.getAttribute('data-i');
    if(k==='mark')mark(i,b.getAttribute('data-s'));
    else if(k==='edit'){var bx=document.getElementById('gx-fx-'+i);if(bx&&!bx.hidden)bx.hidden=true;else openFix(i,true);}
    else if(k==='fxdone'){var bx2=document.getElementById('gx-fx-'+i);if(bx2)bx2.hidden=true;}
    else if(k==='fxundo'){var f=fields()[i];if(!f)return;FIX[kOf(f)]=null;fixDirty=true;
      updSent(i);
      var bx3=document.getElementById('gx-fx-'+i);if(bx3)bx3.hidden=true;var st=rowState(i);writeBack(i,st.sym,st.cmt);soon();}
    else if(k==='done')finish();
  });

  function css(){
    if(document.getElementById('gx-css'))return;
    var s=document.createElement('style');s.id='gx-css';
    s.textContent=''
      +'html.gwin #sg-pane{position:absolute!important;left:-99999px!important;top:0!important;width:900px!important}'
      +'#gx-root{max-width:900px;margin:0 auto;padding:4px 0 50px}'
      +'.gx-sheet{background:#fff;border:1px solid #E3E9F1;border-radius:16px;box-shadow:0 6px 24px rgba(22,32,46,.06)}'
      +'.gx-bar{display:flex;align-items:center;gap:12px;padding:14px 22px;border-bottom:1px solid #E3E9F1;position:sticky;top:0;background:#fff;z-index:3;border-radius:16px 16px 0 0}'
      +'.gx-who{font-weight:700;font-size:16px;color:#16202E}.gx-sub{color:#66758A;font-size:13px}.gx-sp{flex:1}'
      +'.gx-st2{font-size:13px;color:#66758A}.gx-st2.ok{color:#1F6A54}.gx-st2.bad{color:#B3261E;font-weight:700}'
      +'.gx-done{border:0;background:#1E4C86;color:#fff;font:inherit;font-weight:700;font-size:14px;border-radius:10px;padding:8px 16px;cursor:pointer}'
      +'.gx-done:disabled{opacity:.6}'
      +'.gx-sec{padding:14px 22px 2px;font-weight:700;color:#1E4C86;font-size:14px}'
      +'.gx-q{display:grid;grid-template-columns:1fr 90px;gap:10px;padding:14px 22px;border-top:1px solid #F0F3F7}'
      +'.gx-n{font-weight:700;color:#66758A;padding-top:2px}'
      +'.gx-ctx{font-size:15px;line-height:1.8;color:#16202E}.gx-ctx .srev-item,.gx-ctx .gd-q{border:0!important;padding:0!important;margin:0!important;background:none!important}'
      +'.gx-ctx .srev-word{font-weight:400!important;font-size:15px!important;margin:0!important}.gx-ctx .tag{font-size:12px;margin-left:6px}'
      +'.gx-ctx img{max-width:100%;border-radius:8px}.gx-ctx audio{max-width:100%}'
      +'.gx-b{margin-top:4px;font-size:16px;line-height:1.9}'+'.gx-num{display:inline-block;width:26px;color:#66758A;font-weight:700}.gx-sp{font-weight:700;margin-right:2px}'+'.gx-ctx .srev-word{font-size:16px!important;line-height:1.9}'+'.gx-better{margin-left:26px}.gx-b:has(.gx-better) .gx-ed{margin-left:26px}'+'.gx-red,.gx-ref,.gx-fixbox,.gx-ctx .tag{margin-left:26px!important}.gx-red{width:calc(100% - 26px)!important}'
      +'.gx-b del{color:#C62828;text-decoration-thickness:2px}'
      +'.gx-b ins{color:#C62828;text-decoration:none;border-bottom:2px solid #C62828;font-family:"Kaiti TC","BiauKai","STKaiti","DFKai-SB",serif}'
      +'.gx-ed{margin-left:8px;border:0;background:none;color:#8A97A8;font:inherit;font-size:12.5px;cursor:pointer;padding:2px 6px;border-radius:6px}'
      +'.gx-ed:hover{color:#C62828;background:#FCEFEE}.gx-bt{cursor:text}.gx-bt:hover{background:#FFF6F5;border-radius:6px}'+'.gx-better{font-size:15.5px;color:#1F6A54;margin-top:2px}.gx-better span{font-family:"Kaiti TC","BiauKai","STKaiti","DFKai-SB",serif;font-size:17px}'
      +'.gx-fixbox{margin:4px 0 2px}.gx-fxta{width:100%;box-sizing:border-box;font:inherit;font-size:16px;line-height:1.7;border:1.5px solid #E8B4B0;border-radius:10px;padding:6px 10px;color:#16202E;resize:none}'
      +'.gx-fxta:focus{outline:none;border-color:#C62828}.gx-fxbar{display:flex;gap:6px;margin-top:4px}'
      +'.gx-mini{border:1px solid #E3E9F1;background:#fff;border-radius:999px;font:inherit;font-size:12.5px;padding:2px 12px;cursor:pointer;color:#3B4A5E}'
      +'.gx-red{min-height:0!important;box-shadow:none!important;border-radius:0!important;display:block;width:100%;box-sizing:border-box;border:0;border-bottom:1px dashed transparent;background:transparent;resize:none;overflow:hidden;'
      +'color:#C62828;font-family:"Kaiti TC","BiauKai","STKaiti","DFKai-SB",serif;font-size:17px;line-height:1.7;padding:2px 0;margin-top:2px}'
      +'.gx-red::placeholder{color:#E8B4B0}.gx-red:hover{border-bottom-color:#F0D0CD}.gx-red:focus{outline:none;border-bottom-color:#E3A4A0}'
      +'.gx-ref{font-size:13px;color:#7A8899;margin-top:2px}'
      +'.gx-stamp{display:flex;gap:6px;justify-content:flex-end;align-items:flex-start}'
      +'.gx-st{width:38px;height:38px;border-radius:50%;border:2px solid #E3E9F1;background:#fff;font-size:18px;cursor:pointer;color:#8A97A8}'
      +'.gx-st.ok.on{border-color:#1F6A54;color:#1F6A54;background:#E4F2EA}.gx-st.no.on{border-color:#C62828;color:#C62828;background:#FCE9E7}'
      +'.gx-whole{padding:14px 22px}'
      +'.gx-cmt{padding:14px 22px;border-top:1px solid #E3E9F1}.gx-cmt label{display:block;font-size:13px;color:#66758A;margin-bottom:4px}'
      +'.gx-cmt textarea{width:100%;box-sizing:border-box;border:1.5px solid #E3E9F1;border-radius:10px;padding:8px 10px;font:inherit;font-size:15px;resize:none;color:#C62828}'
      +'.gx-foot{display:flex;align-items:center;justify-content:flex-end;gap:12px;padding:14px 22px;border-top:1px solid #E3E9F1;background:#FAFBFD;border-radius:0 0 16px 16px}'
      +'#gx-left{color:#8A5A12;font-size:13px}'
      +'.gx-fin{text-align:center;padding:50px 20px;font-size:18px}.gx-fin .gx-sub{margin-top:6px}'
      +'@media (max-width:640px){.gx-q{grid-template-columns:1fr;padding:12px 14px}.gx-stamp{justify-content:flex-start}.gx-bar{padding:12px 14px;flex-wrap:wrap}.gx-sub{display:none}}';
    document.head.appendChild(s);
  }
  function mountRoot(){
    var p=pane();if(!p)return false;
    if(!root||!document.body.contains(root)){
      root=document.createElement('div');root.id='gx-root';
      var gl=document.getElementById('grades-list');
      if(gl&&gl.parentNode)gl.parentNode.insertBefore(root,gl);else p.parentNode.insertBefore(root,p);
      built=false;
    }
    return true;
  }
  function tick(){
    try{
      if(!on())return;css();
      var p=pane();if(!p)return;
      var a=saveAct(false);
      if(!a){var em=p.querySelector('.sg-empty');if(em&&mountRoot()&&!built){root.innerHTML='<div class="gx-sheet gx-fin">'+em.innerHTML+'</div>';}return;}
      if(!mountRoot())return;
      var k=(typeof S!=='undefined'&&S&&S.sgSel)||'';
      if(!built||k!==key){key=k;built=true;
        var d=docById(a.id);FIX=Object.assign({},(d&&d.fix_text)||{});fixDirty=false;
        isWb=!!p.querySelector('textarea.wbrev-fb');
        draw();}
    }catch(e){}
  }
  function boot(){
    if(!on()){if(document.readyState!=='complete')setTimeout(boot,300);return;}
    setInterval(tick,400);tick();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,300);});
  else setTimeout(boot,300);
})();
