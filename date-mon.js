/* MONCAL_V1612 日期格子的小日曆改成從禮拜一開始
   Quinn：「這個日曆，請從禮拜一」。瀏覽器內建的日曆從哪一天開始是跟著電腦語系，
   網頁改不了，所以在電腦上（滑鼠）點日期格子時，改開這個自己畫的小日曆：
   一 二 三 四 五 六 日。手機照舊用手機自己的選日期（那是滾輪，沒有這個問題）。
   選好日期一樣寫回原本的 <input type="date">，並發出 input／change，
   所以原本所有存檔、檢查的程式都不用改。直接打字輸入日期也照樣可以。 */
(function(){
  'use strict';
  if(!window.matchMedia||!matchMedia('(pointer:fine)').matches)return;
  var css=''
   +'.mc-pop{position:fixed;z-index:100000;background:#fff;border:1px solid #DCE5F0;border-radius:12px;'
   +'box-shadow:0 12px 32px rgba(22,32,46,.18);padding:10px 12px 8px;width:268px;font-size:14px;color:#16202E;user-select:none}'
   +'.mc-hd{display:flex;align-items:center;gap:6px;margin-bottom:6px}'
   +'.mc-hd b{flex:1;font-size:15px}'
   +'.mc-nav{border:0;background:transparent;font-size:18px;line-height:1;padding:4px 9px;border-radius:8px;cursor:pointer;color:#1E4C86}'
   +'.mc-nav:hover{background:#EEF3F9}'
   +'.mc-g{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center}'
   +'.mc-w{font-size:12px;color:#5B6B80;padding:4px 0}'
   +'.mc-w.we{color:#B3261E}'
   +'.mc-d{border:0;background:transparent;padding:7px 0;border-radius:8px;cursor:pointer;font:inherit;color:inherit}'
   +'.mc-d:hover{background:#EEF3F9}'
   +'.mc-d.o{color:#B6C0CC}'
   +'.mc-d.t{box-shadow:inset 0 0 0 1px #1E4C86}'
   +'.mc-d.s{background:#1E4C86;color:#fff;font-weight:700}'
   +'.mc-d:disabled{color:#D5DCE4;cursor:default;background:transparent}'
   +'.mc-ft{display:flex;justify-content:space-between;margin-top:6px}'
   +'.mc-ft button{border:0;background:transparent;color:#1E4C86;cursor:pointer;font:inherit;padding:4px 6px;border-radius:6px}'
   +'.mc-ft button:hover{background:#EEF3F9}';
  var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

  var pop=null,inp=null,view=null;
  function pad(n){return (n<10?'0':'')+n;}
  function ymd(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
  function parse(s){var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s||''));return m?new Date(+m[1],+m[2]-1,+m[3]):null;}
  function close(){if(pop){pop.remove();pop=null;inp=null;}}
  function setVal(v){
    if(!inp)return;var el=inp;
    el.value=v;
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
    close();try{el.focus();}catch(e){}}
  function draw(){
    var cur=parse(inp.value),today=ymd(new Date());
    var mn=inp.min||'',mx=inp.max||'';
    var y=view.getFullYear(),m=view.getMonth();
    var first=new Date(y,m,1);var off=(first.getDay()+6)%7;   /* 禮拜一＝0 */
    var start=new Date(y,m,1-off);
    var h='<div class="mc-hd"><b>'+y+' 年 '+(m+1)+' 月</b>'
      +'<button type="button" class="mc-nav" data-k="p" aria-label="上個月">‹</button>'
      +'<button type="button" class="mc-nav" data-k="n" aria-label="下個月">›</button></div><div class="mc-g">';
    ['一','二','三','四','五','六','日'].forEach(function(w,i){h+='<span class="mc-w'+(i>4?' we':'')+'">'+w+'</span>';});
    for(var i=0;i<42;i++){
      var d=new Date(start.getFullYear(),start.getMonth(),start.getDate()+i);var v=ymd(d);
      var cls='mc-d'+(d.getMonth()!==m?' o':'')+(v===today?' t':'')+(cur&&v===ymd(cur)?' s':'');
      var dis=(mn&&v<mn)||(mx&&v>mx);
      h+='<button type="button" class="'+cls+'" data-v="'+v+'"'+(dis?' disabled':'')+'>'+d.getDate()+'</button>';}
    h+='</div><div class="mc-ft"><button type="button" data-k="c">清除</button><button type="button" data-k="t">今天</button></div>';
    pop.innerHTML=h;}
  function place(){
    var r=inp.getBoundingClientRect();var W=pop.offsetWidth,H=pop.offsetHeight;
    var x=Math.min(Math.max(8,r.left),innerWidth-W-8);
    var y=r.bottom+4;if(y+H>innerHeight-8)y=Math.max(8,r.top-H-4);
    pop.style.left=x+'px';pop.style.top=y+'px';}
  function open(el){
    close();inp=el;view=parse(el.value)||new Date();view=new Date(view.getFullYear(),view.getMonth(),1);
    pop=document.createElement('div');pop.className='mc-pop';
    pop.addEventListener('mousedown',function(e){e.preventDefault();});
    pop.addEventListener('click',function(e){
      var b=e.target.closest&&e.target.closest('button');if(!b)return;
      e.preventDefault();e.stopPropagation();
      var k=b.getAttribute('data-k'),v=b.getAttribute('data-v');
      if(v){setVal(v);return;}
      if(k==='p'){view=new Date(view.getFullYear(),view.getMonth()-1,1);draw();return;}
      if(k==='n'){view=new Date(view.getFullYear(),view.getMonth()+1,1);draw();return;}
      if(k==='c'){setVal('');return;}
      if(k==='t'){setVal(ymd(new Date()));return;}});
    document.body.appendChild(pop);draw();place();}
  /* 點日期格子：不開瀏覽器內建的，開這個 */
  document.addEventListener('click',function(e){
    var t=e.target;
    if(t&&t.tagName==='INPUT'&&t.type==='date'&&!t.disabled&&!t.readOnly){
      e.preventDefault();
      if(pop&&inp===t){close();return;}
      open(t);return;}
    if(pop&&!(t&&t.closest&&t.closest('.mc-pop')))close();
  },true);
  /* 鍵盤叫出內建日曆（空白鍵、Alt+↓）也換成這個 */
  document.addEventListener('keydown',function(e){
    var t=e.target;
    if(e.key==='Escape'&&pop){close();return;}
    if(t&&t.tagName==='INPUT'&&t.type==='date'&&((e.key===' ')||(e.altKey&&e.key==='ArrowDown'))){
      e.preventDefault();open(t);}
  },true);
  window.addEventListener('resize',close);
  document.addEventListener('scroll',function(e){if(pop&&!(e.target&&e.target.closest&&e.target.closest('.mc-pop')))close();},true);
})();
