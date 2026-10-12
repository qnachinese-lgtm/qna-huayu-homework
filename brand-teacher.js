/* ══════════════════════════════════════════════════════════════════════
   BRANDBK_V1502　教師後台「品牌版」：右上角開關 ＋ 裝飾性表情符號隱藏
   2026-10-12

   為什麼用「畫面上藏起來」而不是「把程式碼裡的 emoji 直接刪掉」：
   後台會顯示出來的 emoji 有 2212 個，其中 434 個在按鈕上（要留），
   195 個在說明文字裡「按『🚀 發佈』」這種引用按鈕名稱的句子裡（也要留，
   不然說明跟按鈕長得不一樣，反而更難找）。
   直接改程式碼要動 500 多處、而且改了就回不去；這裡做成開關，
   Quinn 可以邊用邊比，不滿意按一下就全部回來，資料完全不碰。

   規則：只拿掉「句子開頭或結尾那一顆裝飾用的」，而且只在這些地方：
     標題、欄位標籤、下拉選項、說明文字、狀態標、小圖示、提示訊息。
   不碰：按鈕、連結、輸入框裡的字、程式碼、學生頭像、漢字遊戲（hz-）。
   ══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  var KEY='qna_skin';
  function on(){ return document.documentElement.classList.contains('brandv'); }

  /* ── 開關 ───────────────────────────────────────────────────────── */
  function setSkin(v){
    try{ v==='brand'?localStorage.setItem(KEY,'brand'):localStorage.removeItem(KEY); }catch(e){}
    /* 直接重新整理：切回「目前」的時候要把藏起來的字還原，
       重新整理是最乾淨的做法，不用在記憶體裡留一份還原用的備份。    */
    location.reload();
  }
  function mountBtn(){
    if(document.getElementById('skin-btn'))return;
    var ref=document.getElementById('settings-btn')||document.querySelector('[data-act="logout"]');
    if(!ref||!ref.parentNode)return;
    var b=document.createElement('button');
    b.id='skin-btn';
    b.className='btn btn-sm btn-ghost';
    b.title='切換後台外觀。只改外觀，不會動到任何資料；只影響這一台瀏覽器。';
    b.innerHTML=on()?'外觀：<span class="sk-on">品牌版</span>':'外觀：目前';
    b.addEventListener('click',function(){ setSkin(on()?'':'brand'); });
    ref.parentNode.insertBefore(b,ref);
  }

  /* ── 裝飾性表情符號 ─────────────────────────────────────────────── */

  /* 這些是「符號」不是表情符號，有功能意義，一律留著：
     ✕ 關閉、✓ 打勾、→ 流程、★ 星號、▾ 展開、◀▶ 上一個下一個。      */
  var KEEP='✕✖✓✔✗→←↑↓⇄↺'
          +'★☆⋯▾▴▸◂◀▶●○'
          +'■□·‧－—–…×';

  function isDeco(cp){
    if(cp===undefined)return false;
    if(KEEP.indexOf(String.fromCodePoint(cp))>=0)return false;
    return (cp>=0x1F000&&cp<=0x1FAFF)   /* 圖畫型表情符號、旗子 */
        || (cp>=0x2600&&cp<=0x27BF)     /* ☀ ✏ ✅ ⚠ ✨ 這一區 */
        || (cp>=0x2B00&&cp<=0x2BFF)
        || cp===0xFE0F || cp===0x200D;  /* 變體選擇器、ZWJ（👨‍👩‍👦 用） */
  }

  /* 整串都是符號的時候（例如空狀態那顆大圖示 <i>🎬</i>）就原封不動——
     切完變成空的等於把那個位置弄不見，比留著還糟。                   */
  function blank(s){ return s.replace(/[\s　]/g,'')===''; }

  /* 開頭 */
  function stripHead(s){
    var a=Array.from(s),i=0;
    while(i<a.length){
      var ch=a[i];
      if(ch===' '||ch==='　'||ch==='\t'||ch==='\n'){i++;continue;}
      if(isDeco(ch.codePointAt(0))){i++;continue;}
      break;
    }
    if(!i)return s;
    var out=a.slice(i).join('');
    return blank(out)?s:out;
  }
  /* 結尾（「目前沒有待批改的項目 🎉」這種放在句子後面的） */
  function stripTail(s){
    var a=Array.from(s),j=a.length;
    while(j>0){
      var ch=a[j-1];
      if(ch===' '||ch==='　'||ch==='\t'||ch==='\n'){j--;continue;}
      if(isDeco(ch.codePointAt(0))){j--;continue;}
      break;
    }
    if(j===a.length)return s;
    var out=a.slice(0,j).join('');
    return blank(out)?s:out;
  }

  /* 哪些地方算「UI 的字」：原本想列白名單，實際量下來只抓到兩成——
     後台 25 個分頁的版面長得都不一樣，標題有用 h3 的、有用 <b> 的、
     有用 <div class="xx-t"> 的，列不完。
     所以改成反過來：除了下面 SKIP 的，全部都掃，但只動「開頭第一顆」
     和「結尾最後一顆」。夾在句子中間的一律不動——那些大多是
     「按『🚀 發佈』」這種在講某顆按鈕，拿掉反而跟按鈕對不起來。     */
  var SKIP='button,a,input,textarea,select,code,pre,[data-keep-emo],.avatar';
  /* 這幾類即使符號不在開頭，也要掃（量到的：書本標題、系列標題、
     週摘要，都是圖示排在一個 <span> 後面）。                        */
  var CHROME='h2,h3,h4,h5,label,option,summary,.hint,.muted,.sec,.tag,.badge,'
            +'.toast,.help-lead,.help-step,.lcm-off,.dash-n,.sg-tt,.seg-h,'
            +'.empty-t,.ic,.wk-sum,.book-head,.series-head,.bh-tog';

  /* 把開頭所有符號切掉（不管會不會變空），用來判斷「整串是不是只有符號」 */
  function stripHeadAll(s){
    var a=Array.from(s),i=0;
    while(i<a.length){
      var ch=a[i];
      if(ch===' '||ch==='\u3000'||ch==='\t'||ch==='\n'){i++;continue;}
      if(isDeco(ch.codePointAt(0))){i++;continue;}
      break;
    }
    return a.slice(i).join('');
  }
  function headDeco(s){
    var f=s.replace(/^[\s\u3000]+/,'');
    return !!f && isDeco(f.codePointAt(0));
  }
  function tailDeco(s){
    var f=s.replace(/[\s\u3000]+$/,'');
    if(!f)return false;
    var a=Array.from(f);
    return isDeco(a[a.length-1].codePointAt(0));
  }
  /* 前面還有沒有別的東西？有的話這個文字節點就不是「開頭」 */
  function firstText(n){
    for(var p=n.previousSibling;p;p=p.previousSibling){
      if(p.nodeType===1)return false;
      if(p.nodeType===3&&!blank(p.nodeValue))return false;
    }
    return true;
  }
  function lastText(n){
    for(var p=n.nextSibling;p;p=p.nextSibling){
      if(p.nodeType===1)return false;
      if(p.nodeType===3&&!blank(p.nodeValue))return false;
    }
    return true;
  }

  function scrub(root){
    if(!root)return;
    try{
      var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null,false),n,ns=[];
      while((n=w.nextNode()))ns.push(n);
      for(var i=0;i<ns.length;i++){
        n=ns[i];
        var s=n.nodeValue;
        if(blank(s))continue;
        var h=headDeco(s),t2=tailDeco(s);
        if(!h&&!t2)continue;                     /* 先用便宜的檢查擋掉大部分 */
        var pe=n.parentElement;
        if(!pe)continue;
        if(pe.closest(SKIP))continue;
        if(String(pe.className||'').indexOf('hz-')>=0)continue;
        var chrome=pe.matches&&pe.matches(CHROME);
        var v=s;
        if(h&&(chrome||firstText(n)))v=stripHead(v);
        if(t2&&(chrome||lastText(n)))v=stripTail(v);
        if(v!==s){ n.nodeValue=v; continue; }
        /* 切不掉，表示整串就只有符號（使用說明的圖示欄、空狀態的大圖示、
           行事曆的 📅）。把字切掉會留下一個空位子，比留著還怪，
           所以改成整個元素藏起來，交給 CSS 的 .brand-emo-only。
           條件：這個元素裡面只有這一個文字節點，而且把符號切完就空了。 */
        if(h&&blank(stripHeadAll(s))){
          if(pe.childNodes.length===1)pe.classList.add('brand-emo-only');
          /* 旁邊還有別的東西（例如 <li>🚀<b>發佈</b>…</li>），那就只要
             把這顆符號拿掉，位子由旁邊的內容填，不會留空格。          */
          else n.nodeValue='';
        }
      }
    }catch(e){}
  }

  function watch(){
    if(!window.MutationObserver)return;
    var q=[],sched=false;
    new MutationObserver(function(ms){
      for(var i=0;i<ms.length;i++){
        var a=ms[i].addedNodes;
        for(var j=0;j<a.length;j++)if(a[j].nodeType===1)q.push(a[j]);
      }
      if(q.length&&!sched){
        sched=true;
        requestAnimationFrame(function(){
          sched=false;
          var batch=q;q=[];
          for(var k=0;k<batch.length;k++)scrub(batch[k]);
        });
      }
    }).observe(document.body,{childList:true,subtree:true});
  }

  function boot(){
    mountBtn();
    if(!on())return;
    scrub(document.body);
    watch();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
