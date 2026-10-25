/* ══════════════════════════════════════════════════════════════════════
   GCARD_V1639　批改分頁：一題一張卡
   Quinn：「教師那邊的批改我還是覺得很難用」。她選了「一題一頁（像翻卡片）」，
   卡住的地方：畫面一直跳、東西太多看不懂、不確定有沒有存到、要捲很長才找到題目。

   只在批改分頁（teacher.html?grade=…，html 有 gwin）啟動。
   做法：原本的批改畫面照樣在背後產生（存檔、備份原文、草稿那些全部沿用，資料格式一點都沒變），
   只是藏起來；前面蓋一張卡，一次只放一題：
     題目、學生的回答、參考答案、〔✓ 對〕〔✗ 錯〕、一個建議框。
   · 按 ✓ → 自動存、跳下一題
   · 按 ✗ → 參考答案自動帶進建議框，可以改，改完按「下一題」
   · 每改一個字就自動存，右上角寫「已存 ✓」，不用記得按存檔
   · 最後一張：整體評語＋〔✅ 批完了〕，按了就跳到下一位學生
   ══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var FB='textarea.wbrev-fb,textarea.srev-fb,textarea.drev-fb,textarea.gprev-fb,textarea.shrev-fb,input.gd-fb';
  var OV='#wbrev-overall,#srev-overall,#drev-overall,#gprev-overall,#shrev-overall,textarea.gd-cmt,#hwv-cmt,#fhw-cmt';
  var LEAD=/^[\s　]*([✓✎✗○])[\s　]*/;
  var idx=0, key='', root=null, saving=false, again=false, tmr=null, state='', built=false;

  function on(){return document.documentElement.classList.contains('gwin');}
  function pane(){return document.getElementById('sg-pane');}
  function fields(){var p=pane();return p?[].slice.call(p.querySelectorAll(FB)):[];}
  function ovEl(){var p=pane();return p?p.querySelector(OV):null;}
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function lead(v){var m=String(v||'').match(LEAD);return m?m[1]:'';}
  function rest(v){return String(v||'').replace(LEAD,'');}
  function boxOf(f){return (f.closest&&f.closest('.srev-item,.gd-q'))||f.parentNode;}
  function refOf(f){
    var b=boxOf(f);if(!b)return '';
    var hs=b.querySelectorAll('.hint,.gd-refline');
    for(var i=0;i<hs.length;i++){var t=String(hs[i].textContent||'');var p=t.indexOf('參考答案');
      if(p>=0)return t.slice(p+4).replace(/^[\s：:]+/,'').trim();}
    return '';
  }
  function secOf(f){/* 這一題屬於哪一大題（例如「請用語法完成下面的對話」） */
    var n=boxOf(f);
    while(n&&n!==pane()){
      var p=n.previousElementSibling;
      while(p){if(/^H[34]$/.test(p.tagName))return p.textContent||'';
        var h=p.querySelector&&p.querySelector('h4');if(h)return h.textContent||'';
        p=p.previousElementSibling;}
      n=n.parentNode;}
    return '';
  }
  function cleanClone(el){
    var c=el.cloneNode(true);
    [].slice.call(c.querySelectorAll('textarea,input,button,.gm-bar,.gs-reft,.ged-bar,.ged-box,.canned-fold,.canned-bar,.gs-pop,.ai-bar,.gm-hide,.wbrev-fb')).forEach(function(x){x.remove();});
    [].slice.call(c.querySelectorAll('.gs-ref')).forEach(function(x){x.classList.add('on');x.style.display='block';});
    c.classList.remove('gs-fold');c.removeAttribute('data-mark');
    return c.innerHTML;
  }
  function title(){
    var p=pane();var h=p&&p.querySelector('.sg-head h3');return h?h.textContent:'批改';
  }
  function saveAct(done){
    var p=pane();if(!p)return null;
    var b=done?p.querySelector('[data-act^="save"][data-done="1"]'):null;
    b=b||p.querySelector('[data-act^="save"][data-done="0"]')||p.querySelector('[data-act="saveReview"]')||p.querySelector('[data-act^="save"]');
    return b?{act:b.getAttribute('data-act'),id:b.getAttribute('data-id')}:null;
  }
  function setState(s){
    state=s;var el=document.getElementById('gc-st');if(!el)return;
    el.className='gc-st '+(s==='ok'?'ok':(s==='bad'?'bad':''));
    el.textContent=s==='ok'?'已存 ✓':(s==='bad'?'沒存到，再按一次':(s==='busy'?'存檔中…':''));
  }
  async function save(done){
    var a=saveAct(done);if(!a||typeof H!=='object'||typeof H[a.act]!=='function')return false;
    if(saving){again=true;return false;}
    saving=true;setState('busy');
    var t0=window.toast,ok=true;
    window.toast=function(m){if(/失敗|沒改成功|錯/.test(String(m||''))){ok=false;try{t0(m);}catch(e){}}};
    try{await H[a.act](a.id,{dataset:{done:done?'1':'0'},disabled:false,textContent:''});}
    catch(e){ok=false;}
    finally{window.toast=t0;saving=false;}
    setState(ok?'ok':'bad');
    if(again){again=false;return save(false);}
    return ok;
  }
  function soon(){clearTimeout(tmr);setState('busy');tmr=setTimeout(function(){save(false);},700);}

  function cards(){return fields();}
  function total(){return cards().length+1;}/* 最後一張是整體評語 */

  function dots(){
    var fs=cards(),h='';
    fs.forEach(function(f,i){var s=lead(f.value);
      h+='<button type="button" class="gc-dot'+(i===idx?' cur':'')+(s==='✓'?' ok':(s==='✗'?' no':(s?' fx':'')))+'" data-gc="go" data-i="'+i+'">'+(i+1)+'</button>';});
    h+='<button type="button" class="gc-dot end'+(idx===fs.length?' cur':'')+'" data-gc="go" data-i="'+fs.length+'">✔</button>';
    return h;
  }
  function draw(){
    if(!root)return;
    var fs=cards();
    if(idx>fs.length)idx=fs.length;
    var head='<div class="gc-top"><b class="gc-ttl">'+esc(title())+'</b><span class="gc-st" id="gc-st"></span></div>'
      +'<div class="gc-dots">'+dots()+'</div>';
    var body='';
    if(idx<fs.length){
      var f=fs[idx],v=f.value||'',s=lead(v),sec=secOf(f);
      body='<div class="gc-n">第 '+(idx+1)+' 題，共 '+fs.length+' 題'+(sec?('<span class="gc-sec">'+esc(sec)+'</span>'):'')+'</div>'
        +'<div class="gc-q">'+cleanClone(boxOf(f))+'</div>'
        +'<div class="gc-btns"><button type="button" class="gc-b ok'+(s==='✓'?' on':'')+'" data-gc="mark" data-s="✓">✓ 對</button>'
        +'<button type="button" class="gc-b no'+(s==='✗'?' on':'')+'" data-gc="mark" data-s="✗">✗ 錯</button></div>'
        +'<label class="gc-lb">建議（學生看得到）</label>'
        +'<textarea id="gc-ta" class="gc-ta" rows="3" placeholder="想跟學生說的話，可以不寫">'+esc(rest(v))+'</textarea>'
        +'<div class="gc-nav"><button type="button" class="gc-nb" data-gc="prev"'+(idx?'':' disabled')+'>← 上一題</button>'
        +'<button type="button" class="gc-nb pri" data-gc="next">下一題 →</button></div>';
    }else{
      var ov=ovEl(),p=pane();
      var whole='';
      if(!fs.length&&p){var bd=p.querySelector('.sg-body');if(bd)whole='<div class="gc-q">'+cleanClone(bd)+'</div>';}
      var left=fs.filter(function(x){return !lead(x.value)&&!rest(x.value).trim();}).length;
      body=whole
        +(ov?('<label class="gc-lb">'+(fs.length?'整體評語':'給學生的評語')+'（可以不寫）</label><textarea id="gc-ov" class="gc-ta" rows="4">'+esc(ov.value||'')+'</textarea>'):'')
        +(left?('<div class="gc-warn">還有 '+left+' 題沒批，點上面的號碼可以回去</div>'):'')
        +'<div class="gc-nav">'+(fs.length?'<button type="button" class="gc-nb" data-gc="prev">← 上一題</button>':'<span></span>')
        +'<button type="button" class="gc-nb pri big" data-gc="done">✅ 批完了，下一位</button></div>';
    }
    root.innerHTML='<div class="gc-card">'+head+body+'</div>'
      +'<div class="gc-foot"><button type="button" class="gc-link" data-gc="full">看原本的完整畫面</button></div>';
    setState(state==='busy'?'busy':state);
    var ta=document.getElementById('gc-ta');
    if(ta)ta.addEventListener('input',function(){
      var f2=cards()[idx];if(!f2)return;var s2=lead(f2.value);
      f2.value=(s2?(s2+' '):'')+ta.value;
      try{f2.dispatchEvent(new Event('input',{bubbles:true}));}catch(e){}
      soon();
    });
    var o=document.getElementById('gc-ov');
    if(o)o.addEventListener('input',function(){var x=ovEl();if(x){x.value=o.value;soon();}});
    try{window.scrollTo(0,0);}catch(e){}
  }
  function go(i){
    var n=total();idx=Math.max(0,Math.min(n-1,i));draw();
  }
  async function mark(sym){
    var f=cards()[idx];if(!f)return;
    var cur=lead(f.value),r=rest(f.value),ref=refOf(f);
    if(cur==='✗'&&ref&&r.trim()===ref)r='';
    if(cur===sym){f.value=r;}
    else{if(sym==='✗'&&!r.trim()&&ref)r=ref;f.value=sym+' '+r;}
    try{f.dispatchEvent(new Event('input',{bubbles:true}));}catch(e){}
    clearTimeout(tmr);
    var now=lead(f.value);
    draw();
    var p=save(false);
    if(now==='✓'){setTimeout(function(){go(idx+1);},250);}
    else if(now==='✗'){var ta=document.getElementById('gc-ta');if(ta){try{ta.focus({preventScroll:true});ta.setSelectionRange(ta.value.length,ta.value.length);}catch(e){}}}
    await p;
  }
  async function finish(){
    clearTimeout(tmr);
    var b=root.querySelector('[data-gc="done"]');if(b){b.disabled=true;b.textContent='存檔中…';}
    var cur=key;
    var ok=await save(true);
    if(!ok){if(b){b.disabled=false;b.textContent='✅ 批完了，下一位';}return;}
    /* 下一位：待批改清單裡、不是剛剛這一份的第一個 */
    var nx=null;
    try{var list=gradeQueue(false).filter(function(x){return x.pend&&(x.kind+'::'+x.id)!==cur;});
      list.sort(function(a,c){return String(a.ts||'').localeCompare(String(c.ts||''));});
      nx=list[0]||null;}catch(e){}
    if(nx){location.href='teacher.html?grade='+encodeURIComponent(nx.kind+'::'+nx.id);return;}
    root.innerHTML='<div class="gc-card gc-fin"><div style="font-size:44px">🎉</div><b>全部批完了</b><div class="gc-sub">可以關掉這個分頁</div></div>';
  }

  document.addEventListener('click',function(ev){
    var b=ev.target&&ev.target.closest&&ev.target.closest('[data-gc]');
    if(!b||!root||!root.contains(b))return;
    ev.preventDefault();
    var k=b.getAttribute('data-gc');
    if(k==='go')go(Number(b.getAttribute('data-i'))||0);
    else if(k==='prev')go(idx-1);
    else if(k==='next')go(idx+1);
    else if(k==='mark')mark(b.getAttribute('data-s'));
    else if(k==='done')finish();
    else if(k==='full'){document.documentElement.classList.toggle('gc-full');b.textContent=document.documentElement.classList.contains('gc-full')?'回到一題一張':'看原本的完整畫面';}
  });
  document.addEventListener('keydown',function(ev){
    if(!root||document.documentElement.classList.contains('gc-full'))return;
    var t=ev.target;if(t&&/^(TEXTAREA|INPUT|SELECT)$/.test(t.tagName))return;
    if(ev.key==='ArrowRight'){go(idx+1);ev.preventDefault();}
    else if(ev.key==='ArrowLeft'){go(idx-1);ev.preventDefault();}
  });

  function css(){
    if(document.getElementById('gc-css'))return;
    var s=document.createElement('style');s.id='gc-css';
    s.textContent=''
      +'html.gwin:not(.gc-full) #sg-pane{position:absolute!important;left:-99999px!important;top:0!important;width:900px!important}'
      +'html.gwin.gc-full #gc-root .gc-card{display:none}'
      +'#gc-root{max-width:820px;margin:0 auto;padding:8px 0 40px}'
      +'.gc-card{background:#fff;border:1px solid #DCE5F0;border-radius:18px;box-shadow:0 8px 28px rgba(22,32,46,.07);padding:20px 24px 22px}'
      +'.gc-top{display:flex;align-items:center;gap:10px;margin-bottom:10px}'
      +'.gc-ttl{flex:1;font-size:18px;color:#16202E}'
      +'.gc-st{font-size:13px;color:#5B6B80;min-width:80px;text-align:right}.gc-st.ok{color:#1F6A54}.gc-st.bad{color:#B3261E;font-weight:700}'
      +'.gc-dots{display:flex;flex-wrap:wrap;gap:6px;padding-bottom:14px;border-bottom:1px solid #EEF2F7;margin-bottom:16px}'
      +'.gc-dot{min-width:32px;height:32px;border-radius:9px;border:1.5px solid #DCE5F0;background:#fff;color:#5B6B80;font:inherit;font-size:13px;cursor:pointer;padding:0 6px}'
      +'.gc-dot.ok{background:#E1F0E8;border-color:#BFE0CD;color:#1F6A54}.gc-dot.no{background:#FBE4E2;border-color:#F2C4BF;color:#B3261E}.gc-dot.fx{background:#FFF4D6;border-color:#F0DCA0;color:#8A5A12}'
      +'.gc-dot.cur{outline:2.5px solid #1E4C86;outline-offset:1px}.gc-dot.end{font-weight:700}'
      +'.gc-n{font-size:13px;color:#5B6B80;margin-bottom:10px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}'
      +'.gc-sec{background:#EEF3F9;color:#1E4C86;border-radius:999px;padding:2px 10px}'
      +'.gc-q{font-size:17px;line-height:1.9}.gc-q .srev-item,.gc-q .gd-q{border:0!important;padding:0!important;margin:0!important;background:none!important}'
      +'.gc-q .srev-word{font-size:18px;font-weight:600;margin-bottom:8px}'
      +'.gc-q .srev-sent{font-size:17px;background:#EEF3F9;border-radius:12px;padding:10px 14px;margin:6px 0 10px}'
      +'.gc-q .hint,.gc-q .gd-refline{font-size:15px!important;color:#1F5A45!important;background:#EEF7F1;border-left:4px solid #2E7D5B;border-radius:10px;padding:9px 13px;margin:6px 0!important;display:block!important}'
      +'.gc-q img{max-width:100%;border-radius:10px}.gc-q audio{max-width:100%}'
      +'.gc-btns{display:flex;gap:12px;margin:18px 0 12px}'
      +'.gc-b{flex:1;height:56px;border-radius:14px;border:2px solid #DCE5F0;background:#fff;font:inherit;font-size:19px;font-weight:700;cursor:pointer}'
      +'.gc-b.ok{color:#1F6A54}.gc-b.no{color:#B3261E}'
      +'.gc-b.ok.on{background:#1F6A54;border-color:#1F6A54;color:#fff}.gc-b.no.on{background:#B3261E;border-color:#B3261E;color:#fff}'
      +'.gc-lb{display:block;font-size:13px;color:#5B6B80;margin:4px 0 6px}'
      +'.gc-ta{width:100%;box-sizing:border-box;font:inherit;font-size:16px;line-height:1.8;border:1.5px solid #C9D6E6;border-radius:12px;padding:10px 12px;min-height:92px;resize:vertical}'
      +'.gc-ta:focus{outline:none;border-color:#1E4C86;box-shadow:0 0 0 3px rgba(30,76,134,.15)}'
      +'.gc-nav{display:flex;justify-content:space-between;gap:10px;margin-top:18px}'
      +'.gc-nb{height:46px;padding:0 20px;border-radius:12px;border:1.5px solid #DCE5F0;background:#fff;font:inherit;font-size:15px;cursor:pointer}'
      +'.gc-nb:disabled{opacity:.4;cursor:default}.gc-nb.pri{background:#1E4C86;border-color:#1E4C86;color:#fff;font-weight:700}.gc-nb.big{padding:0 26px}'
      +'.gc-warn{margin-top:12px;color:#8A5A12;background:#FFF4D6;border-radius:10px;padding:8px 12px;font-size:14px}'
      +'.gc-foot{text-align:center;margin-top:12px}.gc-link{border:0;background:none;color:#5B6B80;font:inherit;font-size:13px;text-decoration:underline;cursor:pointer}'
      +'.gc-fin{text-align:center;padding:50px 20px;font-size:18px}.gc-sub{color:#5B6B80;font-size:14px;margin-top:6px}'
      +'@media (max-width:600px){.gc-card{padding:16px 14px;border-radius:14px}.gc-b{height:52px}}';
    document.head.appendChild(s);
  }
  function mountRoot(){
    var p=pane();if(!p)return false;
    if(!root||!document.body.contains(root)){
      root=document.createElement('div');root.id='gc-root';
      /* 放在 #grades-list 外面：存檔後那一區會整個重畫，卡片不能跟著被洗掉 */
      var gl=document.getElementById('grades-list');
      if(gl&&gl.parentNode)gl.parentNode.insertBefore(root,gl);else p.parentNode.insertBefore(root,p);
      built=false;
    }
    return true;
  }
  /* 背後那一份換了（剛打開、或存檔後重畫），只換參照，不重畫卡片（不然打字打到一半會被洗掉） */
  function tick(){
    try{
      if(!on())return;
      css();
      var p=pane();if(!p)return;
      if(!saveAct(false)){/* 還沒載好，或全部批完 */
        var em=p.querySelector('.sg-empty');
        if(em&&mountRoot()&&!built){root.innerHTML='<div class="gc-card gc-fin">'+em.innerHTML+'</div>';}
        return;}
      if(!mountRoot())return;
      var k=(typeof S!=='undefined'&&S&&S.sgSel)||'';
      if(!built||k!==key){key=k;idx=0;built=true;draw();}
      else{var d=root.querySelector('.gc-dots');if(d&&!saving)d.innerHTML=dots();}
    }catch(e){}
  }
  function boot(){
    if(!on()){if(document.readyState!=='complete'){setTimeout(boot,300);}return;}
    setInterval(tick,400);tick();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,300);});
  else setTimeout(boot,300);
})();
