/* PRACT_V1781 學生練習帳號（learn.html）
   Quinn：學生可以用班級代碼，或註冊「練習帳號」自己練習。
   - 註冊要 Email 驗證；資料存在 pstudents/{uid}，跟學習平台 students、線上課 members 分開。
   - 自己練習用華語八千詞（pinyin-words.js 的 PY8000，七個等級）。
   - 免費開放到 psettings/main.free_to（預設到準備二級）；再往上要填回饋申請，老師在後台開通（pstudents.lv_to）。
   - 每一次練習存在 pstudents/{uid}/sessions；錯的詞記在 pstudents.wrong（錯題本）。 */
(function(){
'use strict';
var VER='2026.11.27';
var $=function(id){return document.getElementById(id)};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
var tt=null;function toast(s,ms){var t=$('toast');t.textContent=s;t.hidden=false;clearTimeout(tt);tt=setTimeout(function(){t.hidden=true},ms||2400)}
var LVS=['準備一級','準備二級','入門級','基礎級','進階級','高階級','流利級'];
var COUNTRIES=['越南','台灣','泰國','印尼','菲律賓','日本','韓國','美國','其他'];
var FREE_DEFAULT=1;
function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function dayStr(off){var d=new Date();d.setDate(d.getDate()-off);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a}

/* ====== 拼音核心（跟 pinyin.html 同一套） ====== */
var TONES={a:'āáǎà',e:'ēéěè',i:'īíǐì',o:'ōóǒò',u:'ūúǔù','ü':'ǖǘǚǜ'};
var REV={};Object.keys(TONES).forEach(function(b){TONES[b].split('').forEach(function(c,i){REV[c]=[b,i+1]})});
var VOW='aeiouü';
function norm(s){return String(s).normalize('NFC').toLowerCase().replace(/u:/g,'ü').replace(/v/g,'ü')}
var SYL=/(zh|ch|sh|[bpmfdtnlgkhjqxzcsrwy])?([aeiouü]+)(ng|n|r)?(?![aeiouü])/y;
function segment(p){var out=[],i=0;while(i<p.length){SYL.lastIndex=i;var m=SYL.exec(p);if(m&&m[0].length){out.push([i,i+m[0].length,false]);i+=m[0].length}else{out.push([i,i+1,true]);i++}}return out}
function parsePinyin(str){var s=norm(str),syls=[],chunk=[];
  function flush(d){if(!chunk.length)return;var plain=chunk.map(function(c){return c.ch}).join('');var segs=segment(plain);
    segs.forEach(function(sg,k){var a=sg[0],b=sg[1],t=0;for(var j=a;j<b;j++)if(chunk[j].t)t=chunk[j].t;if(!t&&k===segs.length-1&&d!=null)t=d;
      var base=plain.slice(a,b).replace(/^([jqxy])ü/,'$1u');syls.push({base:base,tone:t||5,junk:sg[2]})});chunk=[]}
  for(var ci=0;ci<s.length;ci++){var c=s[ci];
    if(REV[c])chunk.push({ch:REV[c][0],t:REV[c][1]});else if(/[a-zü]/.test(c))chunk.push({ch:c,t:0});else if(/[0-5]/.test(c))flush(c==='0'?5:+c);else flush(null)}
  flush(null);return syls}
function markIndex(b){if(b.indexOf('a')>=0)return b.indexOf('a');if(b.indexOf('e')>=0)return b.indexOf('e');if(b.indexOf('ou')>=0)return b.indexOf('o');for(var i=b.length-1;i>=0;i--)if(VOW.indexOf(b[i])>=0)return i;return -1}
function markSyl(b,t){var bb=b.replace(/^([nl])u$/,'$1u');if(t===5)return bb;var i=markIndex(bb);if(i<0)return bb;return bb.slice(0,i)+TONES[bb[i]][t-1]+bb.slice(i+1)}
function makeItem(line){var sp=line.indexOf(' ');if(sp<0)return null;var h=line.slice(0,sp).trim(),p=line.slice(sp+1).trim();
  var pp=p.split('|');var words=pp[0].trim().split(/\s+/).map(function(w){return parsePinyin(w)}).filter(function(w){return w.length});
  var syls=[].concat.apply([],words);
  if(pp[1]){var A=parsePinyin(pp[1]);if(A.length===syls.length)A.forEach(function(a,i){if(a.base===syls[i].base&&a.tone!==syls[i].tone)syls[i].alt=a.tone})}
  var hz=Array.from(h).filter(function(c){return /[\u3400-\u9fff]/.test(c)});
  return {h:h,p:pp[0].trim(),syls:syls,ok:syls.length&&!syls.some(function(s){return s.junk})&&hz.length===syls.length&&hz.length===Array.from(h).length}}
var LEVEL_CACHE={};
function levelItems(j){if(LEVEL_CACHE[j])return LEVEL_CACHE[j];var raw=(window.PY8000||[])[j]||'';
  var arr=raw.split('\n').map(function(x){return makeItem(x)}).filter(function(x){return x&&x.ok});LEVEL_CACHE[j]=arr;return arr}
function isZY(){return S.prof&&S.prof.scr==='zy'}
function showSyls(syls){return isZY()?syls.map(function(s){return ZY.syl(s.base,s.tone)}).join(' '):syls.map(function(s){return markSyl(s.base,s.tone)}).join('')}
function sylAnswer(it){return showSyls(it.syls)}

/* ====== Firebase ====== */
var auth=null,db=null;
try{if(!firebase.apps.length)firebase.initializeApp(window.FIREBASE_CONFIG);auth=firebase.auth();db=firebase.firestore();}catch(e){}
var FV=firebase.firestore&&firebase.firestore.FieldValue;
var S={mode:(location.hash==='#reg'?'reg':location.hash==='#login'?'acc':'code'),rd:{},user:null,prof:null,set:{free_to:FREE_DEFAULT},lv:0,run:null,cls:{}};
function pref(){return db.collection('pstudents').doc(S.user.uid)}


/* ====== ① 入口：班級代碼／登入／註冊 ====== */
function entry(msg){var m=S.mode;
  var h='<div class="card narrow"><span class="chip">學生專區 · For students</span><h2>開始練習</h2><p class="sub">選一種方式進來</p>'
   +'<div class="seg"><button type="button" data-m="code" class="'+(m==='code'?'on':'')+'">用班級代碼</button><button type="button" data-m="acc" class="'+(m==='acc'?'on':'')+'">登入練習帳號</button><button type="button" data-m="reg" class="'+(m==='reg'?'on':'')+'">註冊</button></div>'
   +'<div class="f" id="f">';
  if(m==='code')h+='<label class="l">班級代碼 <span>老師給你的</span></label><input class="t cc" id="cc" maxlength="8" placeholder="輸入代碼" autocomplete="off">'
   +'<label class="l">你的名字 <span>老師會看到</span></label><input class="t" id="nm" maxlength="40" placeholder="寫你的名字">'
   +'<div class="rowx">不用帳號，輸入代碼就能做老師的題目</div><button class="btn" id="go" type="button">開始</button>';
  if(m==='acc')h+='<label class="l">Email</label><input class="t" id="le" type="email" autocomplete="email" placeholder="寫你註冊用的 Email">'
   +'<label class="l">密碼</label><input class="t" id="lp" type="password" autocomplete="current-password">'+window.QREM_HTML
   +'<button class="btn" id="go" type="button">登入</button><p class="foot"><button type="button" class="lnk" id="fg">忘記密碼？</button></p>';
  if(m==='reg')h+='<label class="l">你的名字 <span>老師會看到</span></label><input class="t" id="rn" maxlength="40" placeholder="寫你的名字">'
   +'<label class="l">Email <span>會寄驗證信</span></label><input class="t" id="re" type="email" autocomplete="email" placeholder="寫你收得到信的 Email">'
   +'<label class="l">密碼 <span>至少 6 個字</span></label><input class="t" id="rp" type="password" autocomplete="new-password">'
   +'<label class="l">國籍</label><div class="dd" id="dd"><button type="button" class="ddb" id="ddb"><span id="ddv">選你的國籍</span></button><div class="ddp" id="ddp" hidden>'
   +COUNTRIES.map(function(c){return '<button type="button" data-v="'+c+'">'+c+'</button>'}).join('')+'</div></div><input class="t" id="rco" maxlength="40" placeholder="寫你的國籍" style="display:none;margin-top:8px">'
   +'<label class="l">拼音或注音</label><div class="pz2" id="pz"><button type="button" data-z="py">拼音</button><button type="button" data-z="zy">注音</button></div>'
   +window.QREM_HTML+'<button class="btn" id="go" type="button">註冊，寄驗證信</button><p class="foot">註冊後要到信箱按驗證連結</p>';
  h+='<div class="msg" id="msg">'+(msg?esc(msg):'')+'</div></div></div>';
  $('stage').innerHTML=h;
  document.querySelectorAll('.seg button').forEach(function(b){b.onclick=function(){S.mode=b.dataset.m;entry()}});
  if(m==='code'){try{$('nm').value=localStorage.getItem('qna_guest_name')||''}catch(e){}
    $('cc').onkeydown=$('nm').onkeydown=function(e){if(e.key==='Enter')$('go').click()}}
  if(m==='acc'){$('lp').onkeydown=function(e){if(e.key==='Enter')$('go').click()};
    $('fg').onclick=async function(){var em=$('le').value.trim();if(!em){say('先填 Email，再按忘記密碼');return}
      try{await auth.sendPasswordResetEmail(em);say('已寄出重設密碼的信，請收信',1)}catch(e){say('寄不出去，請確認 Email')}}}
  if(m==='reg')regBind();
  $('go').onclick=function(){({code:goCode,acc:goLogin,reg:goReg})[m]()};}
function say(s,ok){var e=$('msg');if(!e)return toast(s);e.className='msg'+(ok?' ok':'');e.textContent=s}
async function goCode(){var c=$('cc').value.trim().toUpperCase().replace(/[^A-Z0-9]/g,''),n=$('nm').value.trim().slice(0,40);
  if(!c)return say('請輸入班級代碼');if(!n)return say('請寫你的名字');
  $('go').disabled=true;say('');
  var ok=false;try{ok=(await db.collection('tclasses').doc(c).get()).exists}catch(e){ok=true}
  $('go').disabled=false;if(!ok)return say('找不到這個班級，請再確認代碼');
  try{localStorage.setItem('qna_guest_name',n)}catch(e){}
  location.href='room.html?c='+encodeURIComponent(c)+'&join=1'}/* JOIN1_V1785 名字已經在這裡填過了，班級頁不要再問一次 */
async function goLogin(){var em=$('le').value.trim(),pw=$('lp').value;if(!em||!pw)return say('請填 Email 和密碼');
  $('go').disabled=true;say('登入中…',1);
  try{await auth.signInWithEmailAndPassword(em,pw)}
  catch(e){$('go').disabled=false;var c=String(e&&e.code||'');say(/wrong-password|invalid-credential|user-not-found|invalid-login/.test(c)?'Email 或密碼不對':/too-many/.test(c)?'試太多次了，請等一下再試':/invalid-email/.test(c)?'Email 格式不對':'登入失敗，請再試一次')}}
function regBind(){var R=S.rd;
  ['rn','re','rp','rco'].forEach(function(id){var k={rn:'n',re:'e',rp:'p',rco:'co'}[id];if(R[k]!=null)$(id).value=R[k];$(id).addEventListener('input',function(){R[k]=this.value})});
  function setC(v){R.c=v;$('ddv').textContent=v;$('ddb').classList.add('has');document.querySelectorAll('#ddp button').forEach(function(x){x.classList.toggle('on',x.dataset.v===v)});$('rco').style.display=v==='其他'?'block':'none'}
  if(R.c)setC(R.c);
  $('ddb').onclick=function(e){e.stopPropagation();var p=$('ddp');p.hidden=!p.hidden;$('dd').classList.toggle('open',!p.hidden)};
  document.querySelectorAll('#ddp button').forEach(function(b){b.onclick=function(){setC(b.dataset.v);$('ddp').hidden=true;$('dd').classList.remove('open');if(b.dataset.v==='其他')setTimeout(function(){$('rco').focus()},0)}});
  document.addEventListener('click',function(){var p=$('ddp');if(p){p.hidden=true;var d=$('dd');if(d)d.classList.remove('open')}});
  function setZ(z){R.z=z;document.querySelectorAll('#pz button').forEach(function(x){x.classList.toggle('on',x.dataset.z===z)})}
  if(R.z)setZ(R.z);document.querySelectorAll('#pz button').forEach(function(b){b.onclick=function(){setZ(b.dataset.z)}});
  var rb=document.querySelector('#f input.qrem');if(rb){rb.checked=!!R.rem;rb.onchange=function(){R.rem=this.checked}}
  if(S.focusEmail){S.focusEmail=0;setTimeout(function(){$('re').focus();$('re').select()},30)}}
async function goReg(){var R=S.rd,n=(R.n||'').trim(),em=(R.e||'').trim(),pw=R.p||'',c=R.c==='其他'?(R.co||'').trim():(R.c||'');
  if(!n)return say('請寫你的名字');if(!em)return say('請寫 Email');if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em))return say('Email 格式不對');
  if(pw.length<6)return say('密碼至少 6 個字');if(!c)return say('請選國籍');if(!R.z)return say('請選拼音或注音');
  $('go').disabled=true;say('註冊中…',1);S.registering=true;
  try{var cr=await auth.createUserWithEmailAndPassword(em,pw);
    await db.collection('pstudents').doc(cr.user.uid).set({uid:cr.user.uid,name:n.slice(0,40),email:em.toLowerCase(),country:c.slice(0,40),scr:R.z,
      created_at:new Date().toISOString(),last_at:new Date().toISOString(),email_verified:false,total:0,ok:0,days:{},wrong:{},classes:[],ua:String(navigator.userAgent||'').slice(0,160)});
    try{await cr.user.sendEmailVerification({url:location.origin+'/learn.html'})}catch(e){try{await cr.user.sendEmailVerification()}catch(e2){}}
    S.registering=false;await afterAuth(cr.user)}
  catch(e){S.registering=false;$('go').disabled=false;var code=String(e&&e.code||'');
    say(/email-already/.test(code)?'這個 Email 已經註冊過。如果是練習帳號，請按「登入練習帳號」；如果是上課用的學習平台帳號，請用另一個 Email 註冊練習帳號。':/weak-password/.test(code)?'密碼太短，至少 6 個字':/invalid-email/.test(code)?'Email 格式不對':('註冊失敗：'+(e&&e.message||e)))}}

/* ====== 登入之後 ====== */
async function afterAuth(u){S.user=u;var d=null;
  try{d=await pref().get()}catch(e){$('stage').innerHTML='<div class="card narrow"><h2>暫時讀不到資料</h2><p class="sub">可能是網路不穩，請重新整理再試一次。</p><button class="btn" onclick="location.reload()">重新整理</button></div>';return}
  if(!d.exists){S.user=null;S.mode='acc';S.pendMsg='這個帳號不是練習帳號（可能是上課用的學習平台帳號）。練習帳號請按「註冊」另外建立。';await auth.signOut();return}
  S.prof=d.data();
  if(!u.emailVerified)return verify();
  var up={last_at:new Date().toISOString()};if(!S.prof.email_verified)up.email_verified=true;pref().update(up).catch(function(){});
  try{var st=await db.collection('psettings').doc('main').get();if(st.exists&&st.data().free_to!=null)S.set.free_to=+st.data().free_to}catch(e){}
  S.lv=Math.min(S.lv,maxOpen());
  /* ACCT_V1795 從「這個班要登入」過來的：登入後加入班級、回到班級頁 */
  try{var rc=String(new URLSearchParams(location.search).get('cls')||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(rc){var cs0=(S.prof.classes||[]).slice();if(cs0.indexOf(rc)<0){cs0.push(rc);try{await pref().update({classes:cs0})}catch(e){}}location.replace('room.html?c='+encodeURIComponent(rc));return}}catch(e){}
  home()}
if(auth)auth.onAuthStateChanged(function(u){if(S.registering)return;if(!u){S.user=null;S.prof=null;var pm=S.pendMsg;S.pendMsg=null;entry(pm);return}afterAuth(u)});
else $('stage').innerHTML='<div class="card narrow"><h2>連不上</h2><p class="sub">請重新整理再試一次。</p></div>';

/* ====== Email 驗證 ====== */
var vt=null,lastSend=Date.now();
function verify(){var u=S.user;clearInterval(vt);
  $('stage').innerHTML='<div class="card narrow"><div style="font-size:44px">✉️</div><h2>請到信箱驗證</h2><p class="sub">驗證信已經寄到<br><b style="color:var(--ink)">'+esc(u.email)+'</b><br>打開信，按裡面的連結，帳號就會開通。<br>沒收到？看看垃圾郵件匣。</p>'
   +'<button class="btn" id="vd" type="button">我已經驗證好了</button><button class="btn ghost" id="vr" type="button">重寄驗證信</button>'
   +'<p class="foot"><button class="lnk" id="vb" type="button">Email 寫錯了？回去改</button>　·　<button class="lnk" id="vo" type="button">登出</button></p><div class="msg" id="msg"></div></div>';
  async function check(manual){try{await u.reload()}catch(e){}var cu=auth.currentUser;
    if(cu&&cu.emailVerified){clearInterval(vt);try{await cu.getIdToken(true)}catch(e){}
      $('stage').innerHTML='<div class="card narrow"><div class="okc">✓</div><h2>Email 已驗證</h2><p class="sub">帳號開通了，歡迎！</p></div>';
      setTimeout(function(){afterAuth(cu)},1200);return}
    if(manual)say('還沒驗證喔，請先按信裡的連結')}
  vt=setInterval(function(){check(false)},4000);
  $('vd').onclick=function(){check(true)};
  $('vr').onclick=async function(){var w=Math.ceil((60000-(Date.now()-lastSend))/1000);if(w>0)return say('請等 '+w+' 秒再重寄');
    try{await u.sendEmailVerification({url:location.origin+'/learn.html'});lastSend=Date.now();say('已重寄到 '+u.email,1)}catch(e){say(/too-many/.test(String(e&&e.code))?'寄太多次了，請過幾分鐘再試':'寄不出去，請稍後再試')}};
  $('vo').onclick=function(){clearInterval(vt);auth.signOut()};
  $('vb').onclick=async function(){if(!confirm('要回去改 Email 嗎？剛剛這個帳號會刪掉，重新註冊一次。'))return;clearInterval(vt);
    var p=S.prof||{};S.rd={n:p.name,c:COUNTRIES.indexOf(p.country)>=0?p.country:'其他',co:COUNTRIES.indexOf(p.country)>=0?'':p.country,z:p.scr,e:u.email};
    try{await pref().delete()}catch(e){}try{await u.delete()}catch(e){await auth.signOut()}
    S.mode='reg';S.focusEmail=1;S.user=null;S.prof=null;S.pendMsg='請改好 Email，再按一次註冊';if(!auth.currentUser){var pm=S.pendMsg;S.pendMsg=null;entry(pm)}}}

/* ====== 等級開通 ====== */
function maxOpen(){var a=S.set.free_to==null?FREE_DEFAULT:S.set.free_to,b=S.prof&&S.prof.lv_to!=null?+S.prof.lv_to:-1;return Math.max(a,b)}
function lvOpen(j){return j<=maxOpen()}
function askOpen(j){var r=S.prof.req;if(r&&r.status==='pending')return toast('已經送出申請了，請等老師開通');
  var m=document.createElement('div');m.className='mdl';
  m.innerHTML='<div class="mbox"><button class="mx" type="button">×</button><div style="font-size:36px">🔒</div><h2>「'+LVS[j]+'」要老師開通</h2>'
   +'<p class="sub">前面的等級可以免費練習。想繼續往上學，請填一下回饋，美娟老師看過後會幫你打開。</p><div class="f">'
   +'<label class="l">目前練習下來，覺得怎麼樣？</label><textarea class="t" id="fb1" maxlength="500" placeholder="寫你的感想，例如哪裡好用、哪裡不好用"></textarea>'
   +'<label class="l">接下來想加強什麼？</label><textarea class="t" id="fb2" maxlength="500" placeholder="寫你想學的，例如聲調、生詞、會話"></textarea>'
   +'<label class="l">怎麼聯絡你比較方便？ <span>選填</span></label><input class="t" id="fb3" maxlength="100" placeholder="寫 LINE、Zalo、電話都可以">'
   +'<button class="btn" id="fbgo" type="button">送出申請</button><div class="msg" id="fbm"></div></div></div>';
  document.body.appendChild(m);function close(){m.remove()}
  m.querySelector('.mx').onclick=close;m.onclick=function(e){if(e.target===m)close()};
  m.querySelector('#fbgo').onclick=async function(){var a1=$('fb1').value.trim(),a2=$('fb2').value.trim();if(!a1||!a2){$('fbm').textContent='請填前兩題';return}
    var req={lv:j,lv_name:LVS[j],a1:a1,a2:a2,a3:$('fb3').value.trim(),at:new Date().toISOString(),status:'pending'};
    this.disabled=true;try{await pref().update({req:req});S.prof.req=req;close();toast('已送出，老師開通後就能練了');home()}catch(e){this.disabled=false;$('fbm').textContent='送不出去，請稍後再試'}}}

/* ====== ③④ 首頁 ====== */
function stats(){var p=S.prof,days=p.days||{},week=0,streak=0;for(var i=0;i<7;i++)week+=+days[dayStr(i)]||0;
  var s=days[dayStr(0)]?0:1;for(var k=s;k<400;k++){if(days[dayStr(k)])streak++;else break}
  return {week:week,streak:streak,acc:p.total?Math.round((p.ok||0)/p.total*100):null}}
function wrongList(){var w=S.prof.wrong||{};return Object.keys(w).map(function(h){return {h:h,p:w[h].p,n:w[h].n||1,r:w[h].r||0}}).sort(function(a,b){return b.n-a.n})}
async function loadClasses(){var cs=S.prof.classes||[];for(var i=0;i<cs.length;i++){var c=cs[i];if(S.cls[c])continue;
  try{var d=await db.collection('tclasses').doc(c).get();S.cls[c]=d.exists?d.data():{name:'（找不到這個班級）',gone:1}}catch(e){S.cls[c]={name:c}}}}
async function home(){clearInterval(vt);S.run=null;var p=S.prof;await loadClasses();var st=stats(),wl=wrongList(),cs=p.classes||[],zy=isZY();
  var h='<div class="hi"><div class="av">'+esc((p.name||'?').slice(0,1))+'</div><div><b>'+esc(p.name)+'</b><small>練習帳號・'+(zy?'注音':'拼音')+'</small></div><button class="out" id="out" type="button">登出</button></div>';
  if(cs.length){h+='<div class="sec"><h3>我的班級 <small>老師出的題目</small></h3>'+cs.map(function(c){var x=S.cls[c]||{};
      return '<div class="row"><div class="ic">班</div><div><b>'+esc(x.name||c)+'</b><small>代碼 '+esc(c)+'</small></div>'+(x.gone?'':'<a class="go" href="room.html?c='+encodeURIComponent(c)+'">去做</a>')+'</div>'}).join('')
    +'<div class="join"><input class="t cc" id="jc" maxlength="8" placeholder="輸入代碼加入新班級"><button id="jb" type="button">加入</button></div></div>'}
  var r=p.req,mo=maxOpen();
  h+='<div class="sec" id="self"><h3>自己練習 <small>題目來自華語八千詞（TOCFL 官方詞表）</small></h3>'
   +'<div class="lvrow"><span>等級</span><div class="lvs">'+LVS.map(function(x,j){var o=j<=mo;return '<button type="button" class="lv'+(j===S.lv?' on':'')+(o?'':' lock')+'" data-j="'+j+'">'+(o?'':'🔒 ')+x+'</button>'}).join('')+'</div></div>'
   +(r&&r.status==='pending'?'<div class="reqst">已送出「'+esc(r.lv_name||'')+'」的開通申請，美娟老師看過後會幫你打開。</div>':'')
   +'<div class="grid">'
   +'<button type="button" class="gm" data-mode="choose"><i>'+(zy?'ㄅ':'ā')+'</i><b>'+(zy?'選注音':'選拼音')+'</b><small>看字選讀音</small></button>'
   +'<button type="button" class="gm" data-mode="tone"><i>ˇ</i><b>聲調練習</b><small>選出正確的聲調</small></button>'
   +'<button type="button" class="gm" data-mode="type"><i>⌨</i><b>'+(zy?'打注音':'打拼音')+'</b><small>看字自己打出來</small></button>'
   +'<a class="gm" href="hanzi.html?guest=1"><i>字</i><b>漢字闖關</b><small>認字、寫字</small></a>'
   +'</div><p class="sub" style="margin:10px 0 0">目前：'+LVS[S.lv]+'・每次 10 題</p></div>';
  if(p.total)h+='<div class="stats"><div class="st"><small>連續練習</small><b>'+st.streak+'<em>天</em></b></div><div class="st"><small>這週做了</small><b>'+st.week+'<em>題</em></b></div><div class="st"><small>答對率</small><b>'+(st.acc==null?'—':st.acc+'<em>%</em>')+'</b></div></div>';
  if(wl.length)h+='<div class="sec"><h3>錯題本 <small>答對 2 次就會自動移出</small><button type="button" class="go r" id="wr">再練一次</button></h3><div class="wrong">'
   +wl.slice(0,24).map(function(w){return '<div class="wd"><b>'+esc(w.h)+'</b><small>錯 '+w.n+' 次</small></div>'}).join('')+(wl.length>24?'<div class="wd"><b>…</b><small>還有 '+(wl.length-24)+' 個</small></div>':'')+'</div></div>';
  if(!cs.length)h+='<div class="joinlink"><button type="button" id="jopen">有老師給的班級代碼？</button><div class="join" id="jbox" hidden><input class="t cc" id="jc" maxlength="8" placeholder="輸入代碼"><button id="jb" type="button">加入班級</button></div></div>';
  $('stage').innerHTML=h;
  $('out').onclick=function(){auth.signOut()};
  if($('jopen'))$('jopen').onclick=function(){$('jbox').hidden=false;this.hidden=true;$('jc').focus()};
  if($('jb'))$('jb').onclick=joinClass;if($('jc'))$('jc').onkeydown=function(e){if(e.key==='Enter')joinClass()};
  if($('wr'))$('wr').onclick=function(){startRun('choose',null,wrongList().slice(0,10))};
  document.querySelectorAll('.lv').forEach(function(b){b.onclick=function(){var j=+b.dataset.j;if(!lvOpen(j))return askOpen(j);S.lv=j;home()}});
  document.querySelectorAll('button.gm').forEach(function(b){b.onclick=function(){startRun(b.dataset.mode,S.lv)}});}
async function joinClass(){var c=$('jc').value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'');if(!c)return toast('請輸入代碼');
  var d=null;try{d=await db.collection('tclasses').doc(c).get()}catch(e){}if(!d||!d.exists)return toast('找不到這個班級，請再確認代碼');
  var cs=(S.prof.classes||[]).slice();if(cs.indexOf(c)<0)cs.push(c);
  try{await pref().update({classes:cs});S.prof.classes=cs;S.cls[c]=d.data();try{localStorage.setItem('qna_guest_name',S.prof.name)}catch(e){}toast('已加入「'+(d.data().name||c)+'」');home()}catch(e){toast('加入失敗，請稍後再試')}}

/* ====== 做題 ====== */
function pickItems(j,n){var all=levelItems(j).filter(function(x){return x.syls.length<=4});return shuffle(all).slice(0,n)}
function distractors(it){var out={},key=sylAnswer(it);out[key]=1;var tries=0,res=[];
  while(res.length<3&&tries<60){tries++;var s=it.syls.map(function(x){return {base:x.base,tone:x.tone}});
    var k=Math.floor(Math.random()*s.length),t=s[k].tone;var nt=[1,2,3,4,5].filter(function(v){return v!==t});s[k].tone=nt[Math.floor(Math.random()*nt.length)];
    if(tries>20&&s.length>1){var k2=(k+1)%s.length;s[k2].tone=[1,2,3,4][Math.floor(Math.random()*4)]}
    var str=showSyls(s);if(!out[str]){out[str]=1;res.push(str)}}
  return shuffle(res.concat([key]))}
function startRun(mode,lv,fromWrong){var items;
  if(fromWrong){items=fromWrong.map(function(w){var it=makeItem(w.h+' '+w.p);return it&&it.ok?it:null}).filter(Boolean);if(!items.length)return toast('錯題本是空的')}
  else{items=pickItems(lv,10);if(!items.length)return toast('這個等級的題目讀不到')}
  var qs=items.map(function(it){var q={it:it};if(mode==='choose')q.opts=distractors(it);if(mode==='tone'){q.k=Math.floor(Math.random()*it.syls.length)}return q});
  S.run={mode:mode,lv:fromWrong?null:lv,wrongMode:!!fromWrong,qs:qs,i:0,ans:[],t0:Date.now()};quiz()}
var TONE_LABEL_PY=['一聲 ˉ','二聲 ˊ','三聲 ˇ','四聲 ˋ','輕聲'],TONE_LABEL_ZY=['ˉ 一聲','ˊ 二聲','ˇ 三聲','ˋ 四聲','˙ 輕聲'];
function quiz(){var r=S.run,q=r.qs[r.i],it=q.it,n=r.qs.length,last=r.i===n-1,done=r.ans.filter(function(x){return x!=null}).length,zy=isZY();
  var title=r.wrongMode?'錯題本':LVS[r.lv],mname={choose:zy?'選注音':'選拼音',tone:'聲調練習',type:zy?'打注音':'打拼音'}[r.mode];
  var h='<div class="card narrow"'+(r.mode==='type'&&zy?' style="max-width:620px"':'')+'><div class="qhead"><span>'+mname+'・'+title+'</span><span>'+(r.i+1)+' / '+n+'</span></div><div class="prog"><i style="width:'+(done/n*100)+'%"></i></div>'
   +(r.mode==='type'?'':'<div class="dots">'+r.qs.map(function(x,j){return '<button type="button" class="'+(j===r.i?'cur ':'')+(r.ans[j]!=null?'done':'')+'" data-j="'+j+'">'+(j+1)+'</button>'}).join('')+'</div>');
  if(r.mode==='choose'){h+='<p class="sub" style="margin:0">選出正確的'+(zy?'注音':'拼音')+'</p><div class="hz">'+esc(it.h)+'</div><div class="opts">'+q.opts.map(function(o,j){return '<button type="button" data-o="'+j+'" class="'+(r.ans[r.i]===o?'sel':'')+'">'+esc(o)+'</button>'}).join('')+'</div>'}
  if(r.mode==='tone'){var chars=Array.from(it.h);
    h+='<p class="sub" style="margin:0">畫線的字是第幾聲？</p><div class="hz">'+chars.map(function(c,j){return j===q.k?'<span class="k">'+esc(c)+'</span>':esc(c)}).join('')+'</div>'
     +'<div class="py">'+it.syls.map(function(s,j){var t=j===q.k?(zy?ZY.body(s.base):s.base.replace(/^([nl])u$/,'$1u')):(zy?ZY.syl(s.base,s.tone):markSyl(s.base,s.tone));return j===q.k?'<span class="k">'+esc(t)+'</span>':esc(t)}).join(zy?' ':' ')+'</div>'
     +'<div class="opts t5">'+[1,2,3,4,5].map(function(t){return '<button type="button" data-t="'+t+'" class="'+(r.ans[r.i]===t?'sel':'')+'" style="font-size:15px">'+(zy?TONE_LABEL_ZY:TONE_LABEL_PY)[t-1]+'</button>'}).join('')+'</div>'}
  if(r.mode==='type'){var a=r.ans[r.i];
    h+='<p class="sub" style="margin:0">'+(zy?'用下面的注音鍵盤打出讀音':'打出拼音（可以用數字標聲調，例如 ni3hao3）')+'</p><div class="hz">'+esc(it.h)+'</div>'
     +(zy?'<div id="zyb"><div class="zyout"></div>'+ZY.kbHTML()+'</div>':'<input class="t tin" id="tin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="打拼音">')
     +'<div id="tres" class="msg" style="text-align:center"></div>'}
  h+='<div class="nav">'+(r.mode==='type'?'<button type="button" class="pv" id="quit">結束</button><button type="button" class="nx" id="chk">確定</button>'
     :'<button type="button" class="pv" id="pv" '+(r.i?'':'disabled')+'>← 上一題</button>'+(last?'<button type="button" class="nx" id="sb">交卷</button>':'<button type="button" class="nx" id="nx">下一題 →</button>'))+'</div>'
   +'<p class="foot"><button type="button" class="lnk" id="back">← 回首頁（這次不算）</button></p></div>';
  $('stage').innerHTML=h;$('back').onclick=function(){if(r.ans.some(function(x){return x!=null})&&!confirm('現在離開，這次的作答不會存起來。確定嗎？'))return;home()};
  if(r.mode==='choose')document.querySelectorAll('.opts button').forEach(function(b){b.onclick=function(){r.ans[r.i]=q.opts[+b.dataset.o];if(!last)r.i++;quiz()}});
  if(r.mode==='tone')document.querySelectorAll('.opts button').forEach(function(b){b.onclick=function(){r.ans[r.i]=+b.dataset.t;if(!last)r.i++;quiz()}});
  document.querySelectorAll('.dots button').forEach(function(b){b.onclick=function(){r.i=+b.dataset.j;quiz()}});
  if($('pv'))$('pv').onclick=function(){if(r.i){r.i--;quiz()}};
  if($('nx'))$('nx').onclick=function(){r.i++;quiz()};
  if($('sb'))$('sb').onclick=function(){var miss=r.qs.filter(function(x,j){return r.ans[j]==null}).length;if(miss)return toast('還有 '+miss+' 題沒做，可以點上面的數字回去');finish()};
  if(r.mode==='type'){var zk=null,checked=false;
    if(zy)zk=ZY.attach($('zyb'),{onEnter:function(){$('chk').click()}});else{$('tin').focus();$('tin').onkeydown=function(e){if(e.key==='Enter')$('chk').click()}}
    $('quit').onclick=function(){if(r.ans.filter(function(x){return x!=null}).length)finish();else home()};
    $('chk').onclick=function(){if(checked){r.i++;if(r.i>=n)return finish();return quiz()}
      var good,shown;
      if(zy){var res=ZY.check(zk.keys(),it.syls);if(!res)return toast('請先打注音');good=res.ok;r.ans[r.i]={v:zk.text(),ok:good};zk.lock(true)}
      else{var v=$('tin').value.trim();if(!v)return toast('請先打拼音');var A=parsePinyin(v);
        good=A.length===it.syls.length&&A.every(function(a,j){var s=it.syls[j];return a.base===s.base&&(a.tone===s.tone||a.tone===s.alt)});r.ans[r.i]={v:v,ok:good};$('tin').disabled=true}
      checked=true;$('tres').className='msg'+(good?' ok':'');$('tres').innerHTML=good?'✓ 答對了':'✗ 正確答案：'+esc(sylAnswer(it));
      $('chk').textContent=last?'看成績':'下一題 →';$('quit').textContent='結束'}}}
function isRight(q,a,mode){if(a==null)return false;if(mode==='choose')return a===sylAnswer(q.it);if(mode==='tone'){var s=q.it.syls[q.k];return a===s.tone||a===s.alt}return !!a.ok}
async function finish(){var r=S.run,mode=r.mode,dur=Math.round((Date.now()-r.t0)/1000),zy=isZY();
  var qs=r.qs.filter(function(q,j){return r.ans[j]!=null}),ok=0,wrong=[],right=[];
  r.qs.forEach(function(q,j){if(r.ans[j]==null)return;var g=isRight(q,r.ans[j],mode);if(g){ok++;right.push(q)}else wrong.push(q)});
  var n=qs.length;
  /* 存紀錄 */
  try{var ref=pref(),inc=FV.increment,args=[];var FP=firebase.firestore.FieldPath;
    args.push('total',inc(n),'ok',inc(ok),'last_at',new Date().toISOString(),new FP('days',today()),inc(n));
    wrong.forEach(function(q){args.push(new FP('wrong',q.it.h,'n'),inc(1),new FP('wrong',q.it.h,'p'),q.it.p,new FP('wrong',q.it.h,'r'),0)});
    var W=S.prof.wrong||{};right.forEach(function(q){var w=W[q.it.h];if(!w)return;if((w.r||0)+1>=2)args.push(new FP('wrong',q.it.h),FV.delete());else args.push(new FP('wrong',q.it.h,'r'),inc(1))});
    await ref.update.apply(ref,args);
    await ref.collection('sessions').add({at:new Date().toISOString(),mode:mode,lv:r.lv,lv_name:r.lv==null?'錯題本':LVS[r.lv],n:n,ok:ok,dur:dur,
      items:r.qs.map(function(q,j){var a=r.ans[j];return a==null?null:{h:q.it.h,p:q.it.p,a:mode==='type'?a.v:mode==='tone'?('第'+q.k+'字 '+a+'聲'):a,ok:isRight(q,a,mode)}}).filter(Boolean)});
    var d=await ref.get();if(d.exists)S.prof=d.data();}
  catch(e){toast('紀錄沒存成功（網路不穩？），成績還是看得到',3500)}
  S.run=null;
  $('stage').innerHTML='<div class="card narrow"><span class="chip">做完了！</span><div class="big">'+ok+' / '+n+'</div><p class="sub" style="margin:0">'+(wrong.length?'錯了 '+wrong.length+' 個，已經收進錯題本':'全部答對，好厲害！')+'</p>'
   +(wrong.length?'<div class="res">'+wrong.map(function(q){return '<div><b>'+esc(q.it.h)+'</b><span class="c">'+esc(sylAnswer(q.it))+'</span></div>'}).join('')+'</div>':'')
   +'<button class="btn" id="again" type="button">再做一次</button><button class="btn ghost" id="hm" type="button">回首頁</button></div>';
  $('again').onclick=function(){if(r.wrongMode)startRun('choose',null,wrongList().slice(0,10));else startRun(mode,r.lv)};$('hm').onclick=home}

/* ====== 版本 ====== */
$('vnum').textContent=VER;
async function chkVer(manual){try{var t=await (await fetch('learn.js?check='+Date.now(),{cache:'no-store'})).text();var m=/var VER='([^']+)'/.exec(t);
  if(m&&m[1]!==VER){$('upd').hidden=false;$('vnum').textContent=VER+'（有新版本）'}else if(manual)toast('已經是最新版本 ✓')}catch(e){if(manual)toast('現在檢查不到，請稍後再試')}}
$('vchk').onclick=function(){chkVer(true)};setInterval(function(){chkVer(false)},10*60*1000);
})();
