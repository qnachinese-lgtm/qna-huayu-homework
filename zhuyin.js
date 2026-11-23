/* ZHUYIN_V1741 注音符號：拼音轉注音、注音鍵盤、比對答案。給 pinyin.html（練習和遊戲）用。
   Quinn：「除了拼音練習，我也希望有注音符號練習」——學生點畫面上的注音鍵盤作答；老師出題還是打拼音，這裡自動轉成注音。 */
(function(){
'use strict';
var INI = {b:'ㄅ',p:'ㄆ',m:'ㄇ',f:'ㄈ',d:'ㄉ',t:'ㄊ',n:'ㄋ',l:'ㄌ',g:'ㄍ',k:'ㄎ',h:'ㄏ',j:'ㄐ',q:'ㄑ',x:'ㄒ',zh:'ㄓ',ch:'ㄔ',sh:'ㄕ',r:'ㄖ',z:'ㄗ',c:'ㄘ',s:'ㄙ'};
var FIN = {a:'ㄚ',o:'ㄛ',e:'ㄜ','ê':'ㄝ',ai:'ㄞ',ei:'ㄟ',ao:'ㄠ',ou:'ㄡ',an:'ㄢ',en:'ㄣ',ang:'ㄤ',eng:'ㄥ',er:'ㄦ',
  i:'ㄧ',ia:'ㄧㄚ',io:'ㄧㄛ',ie:'ㄧㄝ',iai:'ㄧㄞ',iao:'ㄧㄠ',iu:'ㄧㄡ',iou:'ㄧㄡ',ian:'ㄧㄢ',in:'ㄧㄣ',iang:'ㄧㄤ',ing:'ㄧㄥ',iong:'ㄩㄥ',
  u:'ㄨ',ua:'ㄨㄚ',uo:'ㄨㄛ',uai:'ㄨㄞ',ui:'ㄨㄟ',uei:'ㄨㄟ',uan:'ㄨㄢ',un:'ㄨㄣ',uen:'ㄨㄣ',uang:'ㄨㄤ',ueng:'ㄨㄥ',ong:'ㄨㄥ',
  'ü':'ㄩ','üe':'ㄩㄝ','üan':'ㄩㄢ','ün':'ㄩㄣ',m:'ㄇ',n:'ㄋ',ng:'ㄫ'};
var Y = {yi:'i',ya:'ia',yo:'io',ye:'ie',yai:'iai',yao:'iao',you:'iou',yan:'ian',yin:'in',yang:'iang',ying:'ing',yong:'iong',
  yu:'ü','yü':'ü',yue:'üe','yüe':'üe',yuan:'üan','yüan':'üan',yun:'ün','yün':'ün',
  wu:'u',wa:'ua',wo:'uo',wai:'uai',wei:'uei',wan:'uan',wen:'uen',wang:'uang',weng:'ueng'};
var TMARK = ['', 'ˊ', 'ˇ', 'ˋ'];
function body(base){
  var b = String(base || '').toLowerCase().replace(/v/g, 'ü').replace(/u:/g, 'ü');
  if (!b) return '';
  var er = '';
  if (b !== 'er' && b.length > 1 && /r$/.test(b) && !/^(e|er)$/.test(b)){ b = b.slice(0, -1); er = 'ㄦ'; }
  if (Y[b]) return (FIN[Y[b]] || b) + er;
  var m = /^(zh|ch|sh|[bpmfdtnlgkhjqxrzcs])(.*)$/.exec(b), ini = '', fin = b;
  if (m){ ini = INI[m[1]]; fin = m[2]; }
  if (ini && /^[zcsr]h?$|^[zcs]$/.test(m[1]) && fin === 'i') return ini + er;          /* 知吃詩日資雌思：只寫聲母 */
  if (/^[jqx]$/.test(m ? m[1] : '') && /^u/.test(fin)) fin = 'ü' + fin.slice(1);        /* ju＝jü */
  if (fin === '' ) return ini + er;
  var f = FIN[fin];
  if (f == null){ /* 不認得的韻母：一個字母一個字母轉，至少不會整個壞掉 */
    f = Array.from(fin).map(function(c){ return FIN[c] || c; }).join(''); }
  return ini + f + er;
}
function syl(base, tone){
  var b = body(base); if (!b) return '';
  tone = +tone || 5;
  if (tone === 5) return '˙' + b;
  return b + (TMARK[tone - 1] || '');
}
/* 打字用的形式：每個音節最後一定有一個聲調鍵（一聲是 ˉ，輕聲 ˙ 打在後面，跟注音輸入法一樣） */
function keyForm(base, tone){ tone = +tone || 5; return body(base) + ['ˉ', 'ˊ', 'ˇ', 'ˋ', '˙'][tone - 1]; }
var TKEYS = {'ˉ':1, 'ˊ':2, 'ˇ':3, 'ˋ':4, '˙':5};
/* 學生按的鍵（陣列）→ 一個個音節 {b:注音本體, t:聲調} */
function groups(keys){
  var out = [], cur = '';
  keys.forEach(function(k){ if (TKEYS[k]){ out.push({b:cur, t:TKEYS[k]}); cur = ''; } else cur += k; });
  if (cur) out.push({b:cur, t:1, open:true});
  return out;
}
function render(keys){
  return groups(keys).map(function(g){ var s = g.open ? g.b : (g.t === 5 ? '˙' + g.b : g.b + (TMARK[g.t - 1] || '')); return '<span class="zys' + (g.open ? ' open' : '') + '">' + s.replace(/[&<>]/g, '') + '</span>'; }).join('');
}
/* 比對：syls 是題目的 [{base,tone,alt}] */
function check(keys, syls){
  var g = groups(keys); if (!g.length) return null;
  var T = syls.map(function(s){ return {b:body(s.base), t:s.tone, alt:s.alt}; });
  if (g.length === T.length && g.every(function(x, i){ return x.b === T[i].b; })){
    var wrong = T.map(function(t, i){ return g[i].t !== t.t && g[i].t !== t.alt; });
    return {ok:!wrong.some(Boolean), kind:'tone', wrong:wrong};
  }
  var w2 = g.length === T.length ? T.map(function(t, i){ return g[i].b !== t.b || (g[i].t !== t.t && g[i].t !== t.alt); }) : null;
  return {ok:false, kind:'spell', wrong:w2};
}
var ROWS = [
  ['ㄅ','ㄆ','ㄇ','ㄈ','ㄉ','ㄊ','ㄋ','ㄌ','ㄍ','ㄎ','ㄏ'],
  ['ㄐ','ㄑ','ㄒ','ㄓ','ㄔ','ㄕ','ㄖ','ㄗ','ㄘ','ㄙ'],
  ['ㄧ','ㄨ','ㄩ','ㄚ','ㄛ','ㄜ','ㄝ','ㄞ','ㄟ','ㄠ','ㄡ'],
  ['ㄢ','ㄣ','ㄤ','ㄥ','ㄦ']
];
/* 電腦鍵盤：標準（大千）注音鍵位，空白鍵＝一聲 */
var KB = {'1':'ㄅ',q:'ㄆ',a:'ㄇ',z:'ㄈ','2':'ㄉ',w:'ㄊ',s:'ㄋ',x:'ㄌ',e:'ㄍ',d:'ㄎ',c:'ㄏ',r:'ㄐ',f:'ㄑ',v:'ㄒ','5':'ㄓ',t:'ㄔ',g:'ㄕ',b:'ㄖ',y:'ㄗ',h:'ㄘ',n:'ㄙ',
  u:'ㄧ',j:'ㄨ',m:'ㄩ','8':'ㄚ',i:'ㄛ',k:'ㄜ',',':'ㄝ','9':'ㄞ',o:'ㄟ',l:'ㄠ','.':'ㄡ','0':'ㄢ',p:'ㄣ',';':'ㄤ','/':'ㄥ','-':'ㄦ',
  ' ':'ˉ','6':'ˊ','3':'ˇ','4':'ˋ','7':'˙'};
function kbHTML(){
  return '<div class="zykb" id="zykb">' + ROWS.map(function(r){ return '<div class="zyr">' + r.map(function(k){ return '<button type="button" data-k="' + k + '">' + k + '</button>'; }).join('') + '</div>'; }).join('')
    + '<div class="zyr zyt"><button type="button" data-k="ˉ" class="t">ˉ<small>一聲</small></button><button type="button" data-k="ˊ" class="t">ˊ<small>二聲</small></button><button type="button" data-k="ˇ" class="t">ˇ<small>三聲</small></button><button type="button" data-k="ˋ" class="t">ˋ<small>四聲</small></button><button type="button" data-k="˙" class="t">˙<small>輕聲</small></button><button type="button" data-k="BS" class="f">⌫</button></div></div>';
}
var CSS = '.zyout{min-height:64px;border:2px solid var(--line,#DCE4EF);border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:4px 14px;padding:8px 12px;font-size:34px;line-height:1.2;font-family:"Noto Serif TC","Songti TC",PMingLiU,serif;color:var(--ink,#1F2D40)}'
  + '.zyout:empty::before{content:"點下面的注音";font-size:15px;color:#A3B0C2}.zyout .zys.open{color:#7A8BA3;border-bottom:2px dashed #C9D4E3}.zyout.bad{border-color:var(--bad,#C03A3A)}.zyout.ok{border-color:var(--good,#2E9B5F)}'
  + '.zykb{display:flex;flex-direction:column;gap:6px;margin-top:10px;user-select:none;-webkit-user-select:none}.zyr{display:flex;gap:5px;justify-content:center;flex-wrap:wrap}'
  + '.zykb button{min-width:40px;height:44px;padding:0 4px;border:1.5px solid var(--line,#DCE4EF);border-radius:10px;background:#fff;font-size:21px;line-height:1;cursor:pointer;color:#1F2D40;font-family:"Noto Serif TC","Songti TC",PMingLiU,serif;touch-action:manipulation}'
  + '.zykb button:active{transform:scale(.94);background:#EEF3FA}.zykb button.t{min-width:56px;background:#F5F8FD;font-size:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px}.zykb button.t small{font-size:10.5px;color:#7A8BA3;font-family:inherit}'
  + '.zykb button.f{min-width:56px;background:#FFF5EE;font-size:19px}.zykb[aria-disabled="true"]{opacity:.45;pointer-events:none}'
  + '.zyans span{margin:0 .18em}'
  + '@media(max-width:560px){.zyr{flex-wrap:nowrap;gap:3px}.zykb button,.zykb button.t,.zykb button.f{flex:1 1 0;min-width:0;padding:0;height:44px;font-size:18px;border-radius:8px}.zykb button.t{font-size:20px}.zyout{font-size:28px}}';
var cssOn = false;
function css(){ if (cssOn) return; cssOn = true; var s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); }
/* 把鍵盤接到某個畫面：onChange(keys)、onEnter() */
function attach(root, opt){
  css();
  var keys = [];
  var out = root.querySelector('.zyout'), kb = root.querySelector('.zykb');
  function paint(){ out.innerHTML = render(keys); if (opt.onChange) opt.onChange(keys); }
  function press(k){ if (kb.getAttribute('aria-disabled') === 'true') return; if (k === 'BS'){ keys.pop(); } else keys.push(k); paint(); }
  kb.querySelectorAll('button').forEach(function(b){ b.addEventListener('click', function(){ press(b.getAttribute('data-k')); }); });
  function onKey(ev){
    if (!document.body.contains(kb)){ document.removeEventListener('keydown', onKey); return; }
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (ev.key === 'Enter'){ ev.preventDefault(); if (opt.onEnter) opt.onEnter(); return; }
    if (ev.key === 'Backspace'){ ev.preventDefault(); press('BS'); return; }
    var k = KB[String(ev.key).toLowerCase()]; if (k){ ev.preventDefault(); press(k); }
  }
  document.addEventListener('keydown', onKey);
  paint();
  return {keys:function(){ return keys.slice(); }, lock:function(on){ kb.setAttribute('aria-disabled', on ? 'true' : 'false'); }, text:function(){ return out.textContent; }};
}
window.ZY = {body:body, syl:syl, keyForm:keyForm, check:check, render:render, kbHTML:kbHTML, attach:attach, css:css};
})();
