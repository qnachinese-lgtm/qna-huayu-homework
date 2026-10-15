/* ══════════════════════════════════════════════════════════════════════
   GEDIT_V1512　批改：學生寫的字可以直接在批改頁上改
   2026-10-12

   Quinn 選的第②件：「改學生寫的內容」。
   現在的批改頁，學生寫的那一行是純文字（.srev-sent），只能看不能動；
   老師唯一能打字的地方是下面那個「建議」框。

   這一支把那一行變成按一下就能改。改完按原本的〔儲存建議〕／〔標記完成〕
   一起寫進去，不另外多一顆按鈕。

   ⚠ 原文一定要留：第一次改之前，把整份 answers（造句是 items）
     備份到 answers_orig／items_orig，而且只備份一次——
     不然改第二次就會把「上一次改過的」當成原文，原文就永遠找不回來了。
     畫面上每一格也都有一顆〔↩ 還原〕。

   能改的：
     · 作業簿　語法完成對話、完成對話／語法練習的每一個空格、寫作
     · 造句　　每一句
     · 問題與討論　每一題
     · 語法練習　答案本來就是一段文字的那種（問答、單一填空）
   不能改的（這一版刻意不做）：
     · 手寫的題目——存的是圖片，不是文字
     · 選擇、排序、配合這類結構化的答案——改字沒有意義，
       要改對錯請用〔改成答對〕（GFIX_V1511）
     · 跟讀——存的是錄音

   ⚠ teacher-app.js 的 S 是 const，const 不會變成 window 的屬性，
     這裡一律用裸的 S 加 typeof 保護（GFIX_V1511 踩過這個坑）。
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


  var SCREENS=[
    {fb:'wbrev-fb', act:'saveWbReview',    coll:'wbdocs',      field:'answers'},
    {fb:'srev-fb',  act:'saveSentReview',  coll:'sentences',   field:'items'},
    {fb:'drev-fb',  act:'saveDiscReview',  coll:'discussions', field:'answers'},
    {fb:'gprev-fb', act:'saveGpracReview', coll:'gpracs',      field:'answers'},
    /* GEDIT2_V1545 Quinn：「批改時可以改更多字」。
       課文練習（作業）本來完全不能改——它的批改畫面長得跟其他四個不一樣：
       一題是 .gd-q，建議欄是 <input class="gd-fb">，學生寫的在 .gd-ans。
       所以前一版的覆蓋程式根本掛不上去。這裡補上第五個畫面。
       只有「答案本來就是一段文字」的題型能改（問答、填空）；
       選擇、排序、配合改字沒有意義，手寫和錄音存的不是文字。 */
    {fb:'gd-fb', act:'saveReview', coll:'results', field:'answers',
     fbTag:'input', item:'.gd-q', disp:'.gd-ans', exercise:true}
  ];

  function coll(name){
    try{ return (typeof S!=='undefined'&&S&&S[name])||[]; }catch(e){ return []; }
  }
  function docOf(scr){
    var btn=document.querySelector('[data-act="'+scr.act+'"][data-id]');
    if(!btn)return null;
    var id=btn.getAttribute('data-id');
    var sd=coll(scr.coll).filter(function(x){return x&&x.id===id;})[0];
    return sd?{id:id,sd:sd}:null;
  }
  function curScreen(){
    for(var i=0;i<SCREENS.length;i++){
      if(document.querySelector((SCREENS[i].fbTag||'textarea')+'.'+SCREENS[i].fb)){
        var d=docOf(SCREENS[i]);
        if(d)return {scr:SCREENS[i],id:d.id,sd:d.sd};
      }
    }
    return null;
  }

  /* 往前找最近的一個 <h4>，用來分辨「四 完成對話」跟「六 語法練習」。
     兩段的 data-k 是 d<i> 跟 d2<i>，光看字串會把 d20（完成對話第 20 行）
     誤判成 d2 的第 0 行，所以要靠標題。 */
  function nearestH4(el){
    var n=el;
    while(n&&n!==document.body){
      var p=n.previousElementSibling;
      while(p){
        if(p.tagName==='H4')return (p.textContent||'');
        var inner=p.querySelectorAll?p.querySelectorAll('h4'):null;
        if(inner&&inner.length)return (inner[inner.length-1].textContent||'');
        p=p.previousElementSibling;
      }
      n=n.parentNode;
    }
    return '';
  }

  /* 一個 .srev-item 對應到資料裡的哪些格子。回傳 null＝這一題不給改。 */
  function fieldsFor(scr,sd,item,ta,shown){
    var k=ta.getAttribute('data-k'), w=ta.getAttribute('data-w');

    /* ── GEDIT2_V1545 課文練習 ── */
    if(scr.exercise){
      var fb=String(ta.getAttribute('data-fb')||'');
      var qid=fb.split('::')[1]||'';
      if(!qid)return null;
      var q=null;
      try{ q=(typeof S!=='undefined'&&S.questions||[]).filter(function(x){return x&&x.id===qid;})[0]||null; }catch(e){}
      if(!q)return null;
      /* 手寫和錄音存的是圖片／音檔網址，不是文字 */
      if(q.type==='write'||q.type==='speak')return null;
      if(q.type==='fill'&&q.input_mode==='write')return null;
      /* 結構化的答案（選項編號、排列順序）改字沒有意義 */
      if(q.type==='choice'||q.type==='order'||q.type==='match'||q.type==='opt')return null;
      var ea=sd.answers=sd.answers||{};
      var v=ea[qid];
      if(Array.isArray(v)){
        /* 多個空格的填空：一格一個框 */
        var outs=[];
        for(var bi=0;bi<v.length;bi++)(function(bi){
          outs.push({label:'第'+(bi+1)+'格',
            get:function(){var arr=ea[qid];return (arr&&arr[bi]!=null)?String(arr[bi]):'';},
            set:function(val){var arr=ea[qid]=Array.isArray(ea[qid])?ea[qid]:[];arr[bi]=val;}});
        })(bi);
        return outs.length?outs:null;
      }
      if(v==null||typeof v==='string')
        return [{get:function(){return ea[qid]==null?'':String(ea[qid]);},
                 set:function(val){ea[qid]=val;}}];
      return null;
    }

    if(scr.coll==='sentences'){
      var its=(sd.items||[]), it=null;
      for(var i=0;i<its.length;i++)if(its[i]&&String(its[i].word)===String(w)){it=its[i];break;}
      if(!it)return null;
      return [{get:function(){return it.sentence||'';},set:function(v){it.sentence=v;}}];
    }

    var a=sd.answers=sd.answers||{};

    if(scr.coll==='discussions')
      return [{get:function(){return a[k]==null?'':String(a[k]);},set:function(v){a[k]=v;}}];

    if(scr.coll==='gpracs'){
      /* 只有「本來就存成一段文字」的才給改；陣列、物件那種改字沒有意義 */
      if(typeof a[k]!=='string')return null;
      return [{get:function(){return a[k];},set:function(v){a[k]=v;}}];
    }

    /* ── 作業簿 ── */
    if(k==='write')return [{get:function(){return a.write||'';},set:function(v){a.write=v;}}];

    var m=/^g(\d+)$/.exec(k||'');
    if(m){
      var n=m[1];a.gram=a.gram||{};
      return [{get:function(){return a.gram[n]||'';},set:function(v){a.gram[n]=v;}}];
    }

    if(/^d\d/.test(k||'')){
      var h=nearestH4(item), sec, idx;
      if(h.indexOf('語法練習')>=0 && /^d2\d/.test(k)){ sec='dlg2'; idx=k.slice(2); }
      else { sec='dlg'; idx=k.slice(1); }
      a[sec]=a[sec]||{};
      /* 畫面上每一個空格都印成【…】，數幾個就是幾格，順序就是 0、1、2… */
      var nb=(String(shown||'').match(/【[^】]*】/g)||[]).length;
      if(!nb)return null;
      var out=[];
      for(var j=0;j<nb;j++)(function(j){
        var key=idx+'-'+j;
        out.push({label:'第'+(j+1)+'格',
          get:function(){return a[sec][key]==null?'':String(a[sec][key]);},
          set:function(v){a[sec][key]=v;}});
      })(j);
      return out;
    }

    /* py- hz- ord- pic- g7- 是手寫圖片，不在這一輪 */
    return null;
  }

  /* 待存的修改：按〔儲存〕才真的套用，中途關掉視窗等於沒改過。 */
  var EDITS=[];
  function find(id,f){
    for(var i=0;i<EDITS.length;i++)if(EDITS[i].id===id&&EDITS[i].f===f)return EDITS[i];
    return null;
  }
  function put(id,f,val,set){
    var e=find(id,f);
    if(e){e.val=val;e.set=set;return;}
    EDITS.push({id:id,f:f,val:val,set:set});
  }
  function drop(id,f){
    for(var i=EDITS.length-1;i>=0;i--)if(EDITS[i].id===id&&EDITS[i].f===f)EDITS.splice(i,1);
  }
  function pending(id){return EDITS.filter(function(e){return e.id===id;});}

  function paintPill(id){
    var old=document.getElementById('ged-pill');
    var n=pending(id).length;
    if(!n){if(old)old.remove();return;}
    if(!old){
      var host=document.querySelector('.sg-navbar')||document.querySelector('.modal-head');
      if(!host)return;
      old=document.createElement('span');
      old.id='ged-pill';old.className='tag ged-pill';
      host.appendChild(old);
    }
    old.textContent='改了學生 '+n+' 處，按儲存才生效';
  }

  function fidOf(ta,j){
    return (ta.getAttribute('data-k')||ta.getAttribute('data-w')||ta.getAttribute('data-fb')||'')+'#'+j;
  }

  function mountItem(ctx,item){
    if(item.__ged)return;
    var ta=item.querySelector((ctx.scr.fbTag||'textarea')+'.'+ctx.scr.fb);
    if(!ta)return;
    var disp=item.querySelector(ctx.scr.disp||'.srev-sent');
    if(!disp)return;
    item.__ged=1;
    var fs=fieldsFor(ctx.scr,ctx.sd,item,ta,disp.textContent||'');
    if(!fs||!fs.length)return;

    var bar=document.createElement('div');
    bar.className='ged-bar';
    var btn=document.createElement('button');
    btn.type='button';btn.className='ged-b';btn.textContent='✎ 改學生寫的';
    bar.appendChild(btn);
    disp.parentNode.insertBefore(bar,disp.nextSibling);

    function mark(){
      var any=false;
      fs.forEach(function(f,j){ if(find(ctx.id,fidOf(ta,j)))any=true; });
      item.classList.toggle('ged-on',any);
      btn.classList.toggle('on',any);
    }

    var box=null;
    function close(){ if(box){box.remove();box=null;} btn.textContent='✎ 改學生寫的'; }
    function open(){
      if(box){close();return;}
      box=document.createElement('div');
      box.className='ged-box';
      fs.forEach(function(f,j){
        var fid=fidOf(ta,j), orig=f.get(), rec=find(ctx.id,fid);
        var row=document.createElement('div');
        row.className='ged-row';
        if(f.label){
          var lb=document.createElement('span');
          lb.className='ged-lb';lb.textContent=f.label;
          row.appendChild(lb);
        }
        var inp=document.createElement('textarea');
        inp.className='ged-ta';
        inp.rows=f.label?1:2;
        inp.value=rec?rec.val:orig;
        var grow=function(){
          inp.style.height='auto';
          inp.style.height=Math.min(inp.scrollHeight+2,420)+'px';
        };
        inp.addEventListener('input',function(){
          grow();
          if(inp.value===orig)drop(ctx.id,fid);
          else put(ctx.id,fid,inp.value,f.set);
          mark();paintPill(ctx.id);
        });
        row.appendChild(inp);
        var und=document.createElement('button');
        und.type='button';und.className='ged-undo';und.textContent='↩ 還原';
        und.addEventListener('click',function(ev){
          ev.preventDefault();ev.stopPropagation();
          inp.value=orig;drop(ctx.id,fid);grow();mark();paintPill(ctx.id);
        });
        row.appendChild(und);
        box.appendChild(row);
        setTimeout(grow,0);
      });
      var tip=document.createElement('div');
      tip.className='ged-tip';
      tip.textContent='改完按下面的〔儲存建議〕或〔標記完成〕才會寫進去。學生原本寫的會留一份備份。';
      box.appendChild(tip);
      bar.parentNode.insertBefore(box,bar.nextSibling);
      btn.textContent='收起來';
      mark();
    }

    btn.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();open();});
    /* GEDIT2_V1545 課文練習那一格裡面可能有錄音播放器、圖片，
       整格做成「點一下就開始改」會打架，所以只留按鈕。 */
    if(ctx.scr.exercise){mark();return;}
    /* 直接點學生寫的那一行也可以開始改 */
    disp.classList.add('ged-click');
    disp.title='點一下可以改';
    disp.addEventListener('click',function(ev){
      if(window.getSelection&&String(window.getSelection()))return;  /* 正在選字就不要搶 */
      ev.preventDefault();open();
    });
    mark();
  }

  function scan(){
    try{
      var ctx=curScreen();
      if(!ctx)return;
      var items=document.querySelectorAll(ctx.scr.item||'.srev-item');
      for(var i=0;i<items.length;i++)mountItem(ctx,items[i]);
      paintPill(ctx.id);
    }catch(e){}
  }

  /* ── 存檔：套用修改，原文備份一次 ───────────────────────────────── */
  /* ORIG_V1519 在真的後台跑出來的：原文備份會被「改過的內容」蓋掉。
     備份的旗標 sd.answers_orig 本來要等 DB.update 回來才寫進記憶體，
     但 e.set() 是馬上就把 sd.answers 改掉了。網路一慢、或手滑按了兩次存檔，
     第二次進來時 sd.answers_orig 還是空的，它就把「已經改過的答案」當成原文備份——
     學生真正寫的那一版就永遠找不回來了。
     兩個修法：一、備份先寫進記憶體再去 await；二、同一份正在存的時候不接第二次。 */
  var BUSY={};
  function hookOne(scr){
    var orig=H[scr.act];
    if(typeof orig!=='function')return false;
    if(orig.__ged)return true;
    var wrapped=async function(id,b){
      if(BUSY[id]){try{toast('上一次存檔還在進行中，等它跑完再按一次');}catch(_){}return;}
      BUSY[id]=1;
      try{
        var ps=pending(id);
        if(ps.length){
          var sd=coll(scr.coll).filter(function(x){return x&&x.id===id;})[0];
          if(sd){
            var patch={};
            if(scr.field==='items'){
              if(!sd.items_orig){patch.items_orig=JSON.parse(JSON.stringify(sd.items||[]));
                sd.items_orig=patch.items_orig;/* 先占住，不能等 await 回來才寫 */}
            }else{
              if(!sd.answers_orig){patch.answers_orig=JSON.parse(JSON.stringify(sd.answers||{}));
                sd.answers_orig=patch.answers_orig;/* 先占住，不能等 await 回來才寫 */}
            }
            ps.forEach(function(e){try{if(typeof e.set==='function')e.set(e.val);}catch(_){}});
            patch[scr.field]=(scr.field==='items')?(sd.items||[]):(sd.answers||{});
            patch.stu_edited_at=new Date().toISOString();   /* 老師最後一次改學生答案的時間 */
            await DB.update('results',id,patch);
            Object.assign(sd,patch);
            EDITS=EDITS.filter(function(e){return e.id!==id;});
          }
        }
      }catch(e){
        try{toast('學生答案沒改成功：'+((e&&e.message)||e));}catch(_){}
      }
      try{ return await orig.call(H,id,b); }
      finally{ delete BUSY[id]; }
    };
    wrapped.__ged=1;
    H[scr.act]=wrapped;
    return true;
  }

  function boot(){
    var ok=0;
    try{
      if(typeof H==='object'&&H)SCREENS.forEach(function(s){if(hookOne(s))ok++;});
    }catch(e){ok=0;}
    if(!ok){setTimeout(boot,400);return;}
    if(window.MutationObserver){
      var sched=false;
      new MutationObserver(function(){
        if(sched)return;sched=true;
        soon(function(){sched=false;scan();});
      }).observe(document.body,{childList:true,subtree:true});
    }
    scan();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
