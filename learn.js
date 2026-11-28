/* PRACT_V1781 學生練習帳號（learn.html）
   Quinn：學生可以用班級代碼，或註冊「練習帳號」自己練習。
   - 註冊要 Email 驗證；資料存在 pstudents/{uid}，跟學習平台 students、線上課 members 分開。
   - 自己練習用華語八千詞（pinyin-words.js 的 PY8000，七個等級）。
   - 免費開放到 psettings/main.free_to（預設到準備二級）；再往上要填回饋申請，老師在後台開通（pstudents.lv_to）。
   - 每一次練習存在 pstudents/{uid}/sessions；錯的詞記在 pstudents.wrong（錯題本）。 */
(function(){
'use strict';
var VER='2026.12.01';
var $=function(id){return document.getElementById(id)};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
var tt=null;function toast(s,ms){var t=$('toast');t.textContent=s;t.hidden=false;clearTimeout(tt);tt=setTimeout(function(){t.hidden=true},ms||2400)}
var LVS=['準備一級','準備二級','入門級','基礎級','進階級','高階級','流利級'];
var COUNTRIES=['越南','臺灣','泰國','印尼','菲律賓','日本','韓國','美國','其他'];
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
  /* BUNEU_V1798 Quinn：「對不起應該是 duì bù qǐ」——詞中間輕聲的「不」改成本調（照變調規則），輕聲的讀法當「也算對」 */
  if(hz.length===syls.length)hz.forEach(function(c,i){var s=syls[i];if(c==='不'&&s.tone===5&&s.base==='bu'){var nt=syls[i+1]&&syls[i+1].tone===4?2:4;s.alt=5;s.tone=nt;}});
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
      try{setMailLang();await auth.sendPasswordResetEmail(em);say('已寄出重設密碼的信，請收信',1)}catch(e){say('寄不出去，請確認 Email')}}}
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
  /* SAMEMAIL_V1806 Quinn：「這兩邊的帳號可以是同一個信箱」——老師帳號的 Email 也能開練習帳號（同一組密碼） */
  function mkP(uid,ver){return db.collection('pstudents').doc(uid).set({uid:uid,name:n.slice(0,40),email:em.toLowerCase(),country:c.slice(0,40),scr:R.z,
      created_at:new Date().toISOString(),last_at:new Date().toISOString(),email_verified:!!ver,total:0,ok:0,days:{},wrong:{},classes:[],ua:String(navigator.userAgent||'').slice(0,160)})}
  try{var cr=await auth.createUserWithEmailAndPassword(em,pw);
    await mkP(cr.user.uid,false);
    setMailLang();try{await cr.user.sendEmailVerification({url:location.origin+'/learn.html'})}catch(e){setMailLang();try{await cr.user.sendEmailVerification()}catch(e2){}}
    S.registering=false;await afterAuth(cr.user)}
  catch(e){var code=String(e&&e.code||'');
    if(/email-already/.test(code)){var si=null;try{si=await auth.signInWithEmailAndPassword(em,pw)}catch(e2){}
      if(si){try{var ex=await db.collection('pstudents').doc(si.user.uid).get();if(!ex.exists)await mkP(si.user.uid,si.user.emailVerified);
          if(!si.user.emailVerified){setMailLang();try{await si.user.sendEmailVerification({url:location.origin+'/learn.html'})}catch(e3){}}
          S.registering=false;await afterAuth(si.user);return}
        catch(e4){try{await auth.signOut()}catch(e5){}}}
      S.registering=false;$('go').disabled=false;
      return say(si?'開不了練習帳號，請再試一次':'這個 Email 已經有帳號了（例如老師帳號）。請用同一組密碼註冊，就會開通練習帳號；已經是練習帳號的話，請按「登入練習帳號」。')}
    S.registering=false;$('go').disabled=false;
    say(/email-already/.test(code)?'這個 Email 已經註冊過，請按「登入練習帳號」。':/weak-password/.test(code)?'密碼太短，至少 6 個字':/invalid-email/.test(code)?'Email 格式不對':('註冊失敗：'+(e&&e.message||e)))}}

/* ====== 登入之後 ====== */
async function afterAuth(u){S.user=u;var d=null;
  try{d=await pref().get()}catch(e){$('stage').innerHTML='<div class="card narrow"><h2>暫時讀不到資料</h2><p class="sub">可能是網路不穩，請重新整理再試一次。</p><button class="btn" onclick="location.reload()">重新整理</button></div>';return}
  if(!d.exists){S.user=null;S.mode='reg';S.rd=S.rd||{};S.rd.e=u.email;S.pendMsg='這個 Email 還沒開練習帳號（可能是老師帳號）。填好下面的資料，密碼用同一組，就能開通。';await auth.signOut();return}/* SAMEMAIL_V1806 */
  S.prof=d.data();
  if(!u.emailVerified&&!S.prof.t_ok)return verify();/* TOK_V1797 老師直接開通的，不用等驗證信 */
  var up={last_at:new Date().toISOString()};if(!S.prof.email_verified&&u.emailVerified)up.email_verified=true;pref().update(up).catch(function(){});
  try{var st=await db.collection('psettings').doc('main').get();if(st.exists&&st.data().free_to!=null)S.set.free_to=+st.data().free_to}catch(e){}
  S.lv=Math.min(S.lv,maxOpen());
  /* ACCT_V1795 從「這個班要登入」過來的：登入後加入班級、回到班級頁 */
  try{var rc=String(new URLSearchParams(location.search).get('cls')||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(rc){var cs0=(S.prof.classes||[]).slice();if(cs0.indexOf(rc)<0){cs0.push(rc);try{await pref().update({classes:cs0})}catch(e){}}location.replace('room.html?c='+encodeURIComponent(rc));return}}catch(e){}
  home()}
if(auth)auth.onAuthStateChanged(function(u){if(S.registering)return;if(!u){S.user=null;S.prof=null;var pm=S.pendMsg;S.pendMsg=null;entry(pm);return}afterAuth(u)});
else $('stage').innerHTML='<div class="card narrow"><h2>連不上</h2><p class="sub">請重新整理再試一次。</p></div>';

/* ====== Email 驗證 ====== */
var vt=null,lastSend=Date.now();
/* MAILLANG_V1798 Quinn：驗證信照學生的語言寄。介面選了英文／越南文就用那個；沒選的話越南用越南文、台灣用中文、其他國家用英文 */
function mailLang(){var ui='';try{ui=localStorage.getItem('qna_ui_lang')||''}catch(e){}if(ui==='en'||ui==='vi')return ui;
  var c=(S.prof&&S.prof.country)||(S.rd&&(S.rd.c==='其他'?S.rd.co:S.rd.c))||'';if(c==='越南')return 'vi';if(c==='臺灣'||c==='台灣'||ui==='zh')return 'zh-TW';return c?'en':'zh-TW';}
function setMailLang(){try{auth.languageCode=mailLang()}catch(e){}}
function verify(){var u=S.user;clearInterval(vt);
  $('stage').innerHTML='<div class="card narrow"><div style="font-size:44px">✉️</div><h2>請到信箱驗證</h2><p class="sub">驗證信已經寄到<br><b style="color:var(--ink)">'+esc(u.email)+'</b><br>打開信，按裡面的連結，帳號就會開通。<br>信可能要幾分鐘才會到。沒收到的話，看看垃圾郵件、促銷內容，或在信箱搜尋 <b>firebaseapp</b>。<br>一直收不到，可以請老師直接幫你開通。</p>'
   +'<button class="btn" id="vd" type="button">我已經驗證好了</button><button class="btn ghost" id="vr" type="button">重寄驗證信</button>'
   +'<p class="foot"><button class="lnk" id="vb" type="button">Email 寫錯了？回去改</button>　·　<button class="lnk" id="vo" type="button">登出</button></p><div class="msg" id="msg"></div></div>';
  async function check(manual){try{await u.reload()}catch(e){}var cu=auth.currentUser;
    if(cu&&cu.emailVerified){clearInterval(vt);try{await cu.getIdToken(true)}catch(e){}
      $('stage').innerHTML='<div class="card narrow"><div class="okc">✓</div><h2>Email 已驗證</h2><p class="sub">帳號開通了，歡迎！</p></div>';
      setTimeout(function(){afterAuth(cu)},1200);return}
    try{var dd=await pref().get();if(dd.exists&&dd.data().t_ok){clearInterval(vt);S.prof=dd.data();$('stage').innerHTML='<div class="card narrow"><div class="okc">✓</div><h2>老師幫你開通了</h2><p class="sub">歡迎！</p></div>';setTimeout(function(){afterAuth(u)},1200);return}}catch(e){}
    if(manual)say('還沒驗證喔，請先按信裡的連結。收不到信的話，可以請老師幫你開通')}
  vt=setInterval(function(){check(false)},4000);
  $('vd').onclick=function(){check(true)};
  /* TOK_V1797 重寄按鈕倒數；被 Firebase 擋下來的時候講清楚是「剛剛寄過了」 */
  function vtick(){var b=$('vr');if(!b)return;var w=Math.ceil((60000-(Date.now()-lastSend))/1000);if(w>0){b.disabled=true;b.textContent=w+' 秒後可以重寄';setTimeout(vtick,1000)}else{b.disabled=false;b.textContent='重寄驗證信'}}
  vtick();
  $('vr').onclick=async function(){var w=Math.ceil((60000-(Date.now()-lastSend))/1000);if(w>0)return vtick();
    var ok=false,err=null;setMailLang();try{await u.sendEmailVerification({url:location.origin+'/learn.html'});ok=true}catch(e){err=e;if(!/too-many/.test(String(e&&e.code))){try{await u.sendEmailVerification();ok=true}catch(e2){err=e2}}}
    lastSend=Date.now();vtick();
    if(ok)say('已重寄到 '+u.email+'，請等幾分鐘再看信箱',1);
    else say(/too-many/.test(String(err&&err.code))?'剛剛已經寄過了，信可能還在路上。請先去信箱找（包含垃圾郵件），10 分鐘後還沒收到再按一次':'寄不出去，請稍後再試，或請老師直接幫你開通')};
  $('vo').onclick=function(){clearInterval(vt);auth.signOut()};
  $('vb').onclick=async function(){if(!confirm('要回去改 Email 嗎？剛剛這個帳號會刪掉，重新註冊一次。'))return;clearInterval(vt);
    var p=Object.assign({},S.prof||{});if(p.country==='台灣')p.country='臺灣';/* TW_V1809 */S.rd={n:p.name,c:COUNTRIES.indexOf(p.country)>=0?p.country:'其他',co:COUNTRIES.indexOf(p.country)>=0?'':p.country,z:p.scr,e:u.email};
    try{await pref().delete()}catch(e){}try{await u.delete()}catch(e){await auth.signOut()}
    S.mode='reg';S.focusEmail=1;S.user=null;S.prof=null;S.pendMsg='請改好 Email，再按一次註冊';if(!auth.currentUser){var pm=S.pendMsg;S.pendMsg=null;entry(pm)}}}

/* ====== 等級開通 ====== */
function maxOpen(){var a=S.set.free_to==null?FREE_DEFAULT:S.set.free_to,b=S.prof&&S.prof.lv_to!=null?+S.prof.lv_to:-1;return Math.max(a,b)}
function lvOpen(j){return j<=maxOpen()}
/* ASKOPEN_V1812 Quinn：「這裡資訊不夠」——申請開通：先說這個等級有什麼、你目前的進度、開通後會怎樣；再問學多久、為什麼學、想加強什麼、想不想上課 */
(function(){var st=document.createElement('style');st.textContent=
 '.ao{max-width:520px!important;text-align:left!important}.ao h2{text-align:center;margin:4px 0 6px}.ao .lead{text-align:center;color:var(--mut);font-size:14px;margin:0 0 14px;line-height:1.6}'
+'.ao-info{background:#F4F7FB;border-radius:14px;padding:12px 14px;margin-bottom:10px;font-size:14px;line-height:1.7}.ao-info b{color:var(--p)}.ao-info .ex{font-size:17px;letter-spacing:1px}'
+'.ao-pr{display:flex;flex-direction:column;gap:6px;margin-top:4px}.ao-pr div{display:flex;align-items:center;gap:8px;font-size:13.5px}.ao-pr span{flex:none;width:5.5em;color:#4A5B75}.ao-pr i{flex:1;height:7px;border-radius:9px;background:#DCE4EF;overflow:hidden;display:block}.ao-pr i u{display:block;height:100%;background:var(--ok)}.ao-pr em{font-style:normal;color:var(--mut);font-size:12.5px;flex:none;min-width:4.5em;text-align:right}'
+'.ao .l{display:block;font-weight:700;font-size:14.5px;margin:16px 0 8px}.ao .l span{font-weight:400;color:var(--mut);font-size:12.5px}'
+'.ao-ch{display:flex;flex-wrap:wrap;gap:6px}.ao-ch button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 13px;font-size:14px;cursor:pointer;font-family:inherit;color:var(--ink)}.ao-ch button.on{background:var(--ps);border-color:var(--p);color:var(--p);font-weight:700}'
+'.ao textarea.t{min-height:70px}.ao .btn{margin-top:18px;width:100%}';document.head.appendChild(st)})();
function askOpen(j){var r=S.prof.req;if(r&&r.status==='pending')return toast('已經送出申請了，請等老師開通');
  var mo=maxOpen(),its=levelItems(j),nL=lsnCount(j),ex=shuffle(its.filter(function(x){return x.h.length<=2})).slice(0,6).map(function(x){return x.h});
  var prog=[];for(var i=0;i<=mo&&i<LVS.length;i++){var n=lsnCount(i),d=0;for(var k=0;k<n;k++)if(lsnDone(i,k))d++;prog.push({lv:LVS[i],d:d,n:n})}
  var acc=S.prof.total?Math.round((S.prof.ok||0)/S.prof.total*100):null;
  var progTxt=prog.map(function(x){return x.lv+' '+x.d+'/'+x.n+' 課'}).join('、')+(acc!=null?'；答對率 '+acc+'%（'+S.prof.total+' 題）':'');
  var CH=function(id,arr,multi){return '<div class="ao-ch" id="'+id+'" data-multi="'+(multi?1:0)+'">'+arr.map(function(x){return '<button type="button">'+x+'</button>'}).join('')+'</div>'};
  var m=document.createElement('div');m.className='mdl';
  m.innerHTML='<div class="mbox ao"><button class="mx" type="button">×</button><div style="font-size:34px;text-align:center">🔒</div><h2>「'+LVS[j]+'」要老師開通</h2>'
   +'<p class="lead">前面的等級可以免費練習。想繼續往上學，填一下下面的問題，美娟老師看過後會幫你打開。</p>'
   +'<div class="ao-info"><div>「'+LVS[j]+'」有 <b>'+its.length+'</b> 個詞，分成 <b>'+nL+'</b> 課，例如：</div><div class="ex">'+esc(ex.join('、'))+'…</div></div>'
   +'<div class="ao-info"><div style="margin-bottom:4px">你目前的進度'+(acc!=null?'・答對率 <b>'+acc+'%</b>':'')+'</div><div class="ao-pr">'+prog.map(function(x){return '<div><span>'+x.lv+'</span><i><u style="width:'+(x.n?Math.round(x.d/x.n*100):0)+'%"></u></i><em>'+x.d+' / '+x.n+' 課</em></div>'}).join('')+'</div></div>'
   +'<div class="ao-info">開通以後，「免費課程」和「自己練習」都能選「'+LVS[j]+'」。不用重新註冊，回到這頁就看得到。</div>'
   +'<label class="l">學華語多久了？</label>'+CH('ao-y',['剛開始','不到半年','半年到一年','一到三年','三年以上'])
   +'<label class="l">為什麼學華語？ <span>可以選好幾個</span></label>'+CH('ao-w',['工作','考 TOCFL','在臺灣生活','上學','興趣','其他'],1)
   +'<label class="l">接下來想加強什麼？ <span>可以選好幾個，也可以自己寫</span></label>'+CH('ao-s',['聲調','生詞','聽力','會話','漢字','閱讀'],1)
   +'<textarea class="t" id="fb2" maxlength="500" placeholder="還想加強的，寫在這裡（選填）" style="margin-top:8px"></textarea>'
   +'<label class="l">目前練習下來，覺得怎麼樣？</label><textarea class="t" id="fb1" maxlength="500" placeholder="例如哪裡好用、哪裡不好用、太難還是太簡單"></textarea>'
   +'<label class="l">想跟美娟老師上課嗎？</label>'+CH('ao-c',['想了解上課','先自己練習就好'])
   +'<label class="l">怎麼聯絡你比較方便？ <span>選填</span></label><input class="t" id="fb3" maxlength="100" placeholder="寫 LINE、Zalo、電話都可以">'
   +'<button class="btn" id="fbgo" type="button">送出申請</button><div class="msg" id="fbm"></div></div>';
  document.body.appendChild(m);function close(){m.remove()}
  m.querySelector('.mx').onclick=close;m.onclick=function(e){if(e.target===m)close()};
  m.querySelectorAll('.ao-ch').forEach(function(g){var multi=g.dataset.multi==='1';g.querySelectorAll('button').forEach(function(b){b.onclick=function(){if(!multi)g.querySelectorAll('button').forEach(function(x){if(x!==b)x.classList.remove('on')});b.classList.toggle('on')}})});
  var pick=function(id){return [].map.call(m.querySelectorAll('#'+id+' button.on'),function(b){return b.textContent})};
  m.querySelector('#fbgo').onclick=async function(){var y=pick('ao-y')[0]||'',w=pick('ao-w'),sk=pick('ao-s'),t2=$('fb2').value.trim(),a1=$('fb1').value.trim(),c=pick('ao-c')[0]||'';
    var miss=!y?'學華語多久了':!w.length?'為什麼學華語':(!sk.length&&!t2)?'想加強什麼':!a1?'練習下來覺得怎麼樣':'';
    if(miss){$('fbm').textContent='請填「'+miss+'」';return}
    var req={lv:j,lv_name:LVS[j],a1:a1,a2:sk.join('、')+(t2?(sk.length?'；':'')+t2:''),a3:$('fb3').value.trim(),yrs:y,why:w.join('、'),cls:c,prog:progTxt,at:new Date().toISOString(),status:'pending'};
    this.disabled=true;try{await pref().update({req:req});S.prof.req=req;close();toast('已送出，老師開通後就能練了');home()}catch(e){this.disabled=false;$('fbm').textContent='送不出去，請稍後再試'}}}

/* ====== ③④ 首頁 ====== */
function stats(){var p=S.prof,days=p.days||{},week=0,streak=0;for(var i=0;i<7;i++)week+=+days[dayStr(i)]||0;
  var s=days[dayStr(0)]?0:1;for(var k=s;k<400;k++){if(days[dayStr(k)])streak++;else break}
  return {week:week,streak:streak,acc:p.total?Math.round((p.ok||0)/p.total*100):null}}
function wrongList(){var w=S.prof.wrong||{};return Object.keys(w).map(function(h){return {h:h,p:w[h].p,n:w[h].n||1,r:w[h].r||0}}).sort(function(a,b){return b.n-a.n})}
async function loadClasses(){var cs=S.prof.classes||[];for(var i=0;i<cs.length;i++){var c=cs[i];if(S.cls[c])continue;
  try{var d=await db.collection('tclasses').doc(c).get();S.cls[c]=d.exists?d.data():{name:'（找不到這個班級）',gone:1}}catch(e){S.cls[c]={name:c}}}}
/* HOME_V1811 Quinn：「學生可以選擇他要學習什麼」「畫面有點醜，重新排版」——先選要學什麼（免費課程／主題生詞／自己練習／老師的班級），下面只顯示那一塊 */
(function(){var st=document.createElement('style');st.textContent=
 '.hm-me{display:flex;align-items:center;gap:14px;margin-bottom:20px;flex-wrap:wrap}.hm-me .av{width:54px;height:54px;font-size:23px}.hm-me h2{margin:0;font-size:23px;line-height:1.3}.hm-me small{color:var(--mut);font-size:13.5px}.hm-me .grow{flex:1}'
+'.hm-st{display:flex;gap:10px}.hm-st div{background:#fff;border:1px solid var(--line);border-radius:14px;padding:7px 14px;text-align:center;min-width:84px}.hm-st b{display:block;font-size:20px;color:var(--p)}.hm-st span{font-size:12px;color:var(--mut)}'
+'.hm-me .out{border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px 16px;cursor:pointer;font-family:inherit;font-size:15px}'
+'.hm-q{font-size:18px;font-weight:700;margin:0 0 12px}'
+'.hm-pk{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}'
+'.hm-pk button{border:2px solid transparent;background:#fff;border-radius:16px;padding:12px 14px;text-align:left;cursor:pointer;display:grid;grid-template-columns:40px 1fr;column-gap:12px;row-gap:2px;align-items:center;position:relative;font-family:inherit;color:var(--ink);box-shadow:0 2px 10px rgba(30,60,110,.06)}.hm-pk button i{grid-row:1/3}'
+'.hm-pk button:hover{border-color:#D6E3F4}.hm-pk i{font-style:normal;width:40px;height:40px;border-radius:12px;background:var(--ps);display:grid;place-items:center;font-size:20px}'
+'.hm-pk b{font-size:16px;align-self:end}.hm-pk small{color:var(--mut);font-size:12.5px;line-height:1.4;align-self:start;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.hm-pk button.on{border-color:var(--p);background:var(--p);color:#fff;box-shadow:0 8px 22px rgba(30,76,134,.22)}.hm-pk button.on small{color:#CFDCEE}.hm-pk button.on i{background:rgba(255,255,255,.16)}'
+'.hm-pk em{position:absolute;top:8px;right:10px;font-style:normal;font-size:11px;background:#FFF3CF;color:#8A5A00;border-radius:999px;padding:2px 8px}'
+'.hm-pn{background:#fff;border-radius:22px;box-shadow:0 10px 30px rgba(30,60,110,.07);padding:24px;margin-bottom:18px}'
+'.hm-ph{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:16px}.hm-ph h3{margin:0;font-size:20px}.hm-ph small{color:var(--mut);font-size:13.5px}'
+'.hm-nx{display:flex;align-items:center;gap:16px;background:linear-gradient(135deg,#EEF4FC,#F7FAFE);border:1px solid #D6E3F4;border-radius:18px;padding:18px 20px;margin:4px 0 18px}'
+'.hm-nx .bg{width:64px;height:64px;border-radius:16px;background:var(--p);color:#fff;display:grid;place-items:center;flex:none;font-size:13px;line-height:1.2;text-align:center}.hm-nx .bg b{display:block;font-size:24px}'
+'.hm-nx .t{flex:1;min-width:0}.hm-nx .t b{font-size:17px;display:block}.hm-nx .t small{color:var(--mut);font-size:13.5px}'
+'.hm-bar{height:8px;border-radius:9px;background:var(--line);overflow:hidden;margin-top:8px}.hm-bar i{display:block;height:100%;background:var(--ok);border-radius:9px}'
+'.hm-go{border:0;background:var(--p);color:#fff;border-radius:14px;padding:12px 22px;font-size:16px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:inherit;text-decoration:none}'
+'.cl-lv{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px}.cl-lv .lv{margin:0}'
+'.cl-lk{border:0;background:none;color:var(--mut);font-size:13.5px;font-family:inherit;cursor:pointer;padding:6px 4px}button.cl-lk:hover{color:var(--p);text-decoration:underline}'
+'.cl-pg{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px}.cl-pg button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:5px 12px;font-size:13px;cursor:pointer;font-family:inherit;color:#4A5B75}.cl-pg button.on{background:var(--ps);border-color:var(--p);color:var(--p);font-weight:700}'
+'.cl-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}'
+'.cl-c{border:1px solid var(--line);background:#fff;border-radius:14px;padding:12px 12px 10px;text-align:left;cursor:pointer;font-family:inherit;color:var(--ink);display:flex;flex-direction:column;gap:4px;min-width:0;transition:.12s}.cl-c:hover{border-color:#B9CBE4;box-shadow:0 4px 14px rgba(30,60,110,.08)}'
+'.cl-n{font-size:13px;color:var(--mut);display:flex;align-items:center;gap:6px}.cl-n em{font-style:normal;margin-left:auto;font-size:12px;color:var(--ok);font-weight:700}.cl-n em.nx{color:#fff;background:var(--p);border-radius:999px;padding:1px 8px;font-weight:400}'
+'.cl-w{font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cl-s{font-size:12px;color:var(--mut)}'
+'.cl-c.dn{background:#F3FAF6;border-color:#CBE8D6}.cl-c.dn .cl-s{color:var(--ok)}.cl-c.nx{border:2px solid var(--p);padding:11px 11px 9px}'
+'.hm-pn .lsn{grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:8px;max-height:none}.hm-pn .lsn button{height:52px;font-size:16px;border-radius:12px}'
+'.hm-tp{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}.hm-tp button{border:1px solid var(--line);background:#fff;border-radius:16px;padding:14px 10px;text-align:center;cursor:pointer;font-family:inherit;color:var(--ink)}.hm-tp button:hover{border-color:#B9CBE4;box-shadow:0 4px 14px rgba(30,60,110,.08)}'
+'.hm-tp i{font-style:normal;font-size:32px;display:block}.hm-tp b{display:block;font-size:16px;margin-top:6px}.hm-tp small{color:var(--mut);font-size:12.5px}'
+'.tp-back{border:0;background:none;color:var(--p);font-family:inherit;font-size:14px;cursor:pointer;padding:0;margin-bottom:10px}.tp-ws{display:flex;flex-wrap:wrap;gap:8px}.tp-ws span{border:1px solid var(--line);border-radius:12px;padding:8px 12px;display:flex;flex-direction:column;align-items:center;min-width:72px}.tp-ws b{font-size:20px;font-weight:400}.tp-ws i{font-style:normal;color:var(--p);font-size:13.5px;font-family:"Times New Roman",serif}'
+'.cls-empty{display:flex;gap:26px;align-items:center;padding:8px 4px}.ce-ic{width:120px;height:120px;border-radius:50%;background:var(--ps);display:grid;place-items:center;font-size:60px;flex:none}.ce-t{flex:1;min-width:0}.ce-t h3{margin:0 0 4px;font-size:20px}.ce-t p{margin:0 0 14px;color:#4A5B75;font-size:14.5px;line-height:1.7}'
+'.ce-join{max-width:440px}.ce-join input{font-size:18px;letter-spacing:3px;text-align:center}.ce-st{display:flex;gap:18px;margin:14px 0 0;padding:0;list-style:none;counter-reset:s;flex-wrap:wrap}.ce-st li{counter-increment:s;font-size:13px;color:var(--mut);display:flex;align-items:center;gap:6px}.ce-st li:before{content:counter(s);width:20px;height:20px;border-radius:50%;background:var(--ps);color:var(--p);display:grid;place-items:center;font-size:12px;font-weight:700}'
+'.hm-ft{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin:6px 0 4px;font-size:13.5px;color:var(--mut)}.hm-ft button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 14px;font-family:inherit;font-size:13.5px;color:#1E4C86;cursor:pointer}.hm-ft button:hover{background:#F3F6FB}'
+'.ft-em{background:#F4F7FB;border-radius:12px;padding:12px;font-size:16px;margin:8px 0 4px;word-break:break-all;font-family:Georgia,serif}'
+'.hm-sub{color:var(--mut);font-size:13.5px;margin:0 0 8px}'
+'.hm-cl{display:flex;flex-direction:column;gap:10px;max-width:560px}.hm-cl .row{margin:0}'
+'.hm-cl .join{display:flex;gap:8px;margin-top:6px}.hm-cl .join input{flex:1}'
+'@media(max-width:760px){.hm-me .av{width:46px;height:46px;font-size:20px}.hm-me h2{font-size:20px}.hm-me>div:nth-child(2){flex:1;min-width:0}.hm-me .grow{display:none}.hm-me .out{order:2}.hm-st{order:3;width:100%}.hm-st div{flex:1;min-width:0}'
+'.hm-pk{grid-template-columns:1fr 1fr;gap:8px}.hm-pk button{padding:10px 11px;grid-template-columns:34px 1fr;column-gap:9px}.hm-pk i{width:34px;height:34px;font-size:17px}.hm-pk b{font-size:15px}.hm-pk small{font-size:11.5px}.hm-tp{grid-template-columns:repeat(3,1fr);gap:8px}.cls-empty{flex-direction:column;text-align:center;gap:14px}.ce-ic{width:90px;height:90px;font-size:44px}.ce-join{margin:0 auto}.ce-st{justify-content:center;gap:10px}.hm-pn{padding:18px 16px}.hm-nx{flex-wrap:wrap}.hm-nx .hm-go{width:100%}.hm-pn .lsn{grid-template-columns:repeat(5,1fr)}.cl-grid{grid-template-columns:1fr 1fr;gap:8px}.cl-w{font-size:16px}}';document.head.appendChild(st)})();
/* TOPICPY_V1814 Quinn：「主題生詞那邊，是否也可以變成拼音練習？」——詞都從華語八千詞挑，拼音照八千詞；圖片遊戲等圖片做好再開 */
var TOPICS=[['👨‍👩‍👧','家庭','爸爸 媽媽 哥哥 姊姊 弟弟 妹妹 爺爺 奶奶 寶寶 家人'],['🍜','食物','飯 麵 麵包 餃子 包子 蛋 蛋糕 漢堡 湯 冰淇淋'],['🍎','水果','蘋果 香蕉 西瓜 葡萄 橘子 芒果 梨 桃子 櫻桃'],
 ['🧋','飲料','水 茶 咖啡 牛奶 果汁 可樂 奶茶 汽水 豆漿'],['🐼','動物','狗 貓 魚 鳥 牛 馬 豬 羊 雞 兔子 老虎 熊貓'],['🎨','顏色','紅色 藍色 黃色 綠色 白色 黑色 灰色'],
 ['👂','身體','頭 眼睛 耳朵 鼻 嘴巴 臉 頭髮 手 腳 肚子 牙齒'],['👕','衣服','衣服 褲子 裙子 鞋子 襪子 帽子 外套 毛衣 襯衫 眼鏡'],['🎒','學校和文具','書 筆 鉛筆 尺 書包 本子 書桌 椅子 黑板 剪刀 電腦'],['🚌','交通','汽車 公共汽車 火車 捷運 飛機 船 腳踏車 摩托車 計程車']];
var TOPIC_CACHE={};
function topicItems(name){if(TOPIC_CACHE[name])return TOPIC_CACHE[name];var t=TOPICS.filter(function(x){return x[1]===name})[0];if(!t)return [];var map={};
  for(var j=0;j<LVS.length;j++)levelItems(j).forEach(function(it){if(!(it.h in map))map[it.h]=it});
  return TOPIC_CACHE[name]=t[2].split(' ').map(function(h){return map[h]}).filter(Boolean)}
function hmTab(){var t=S.tab;if(!t){try{t=localStorage.getItem('qna_learn_tab')||''}catch(e){}}if(['course','topic','self','class'].indexOf(t)<0)t=(S.prof.classes||[]).length?'class':'course';return t}
/* COURSEUI_V1812 Quinn：「這裡太醜了」——課程改成卡片（看得到這課有哪些詞、做過幾分），鎖住的等級收成一行 */
function hmCourse(){var mo=maxOpen(),j=S.clv||0,n=lsnCount(j),nx=lsnNext(j),dn=0,r=S.prof.req;for(var k=0;k<n;k++)if(lsnDone(j,k))dn++;
  var per=15,pg=Math.floor(nx/per);if(S.cpg!=null&&S.cpgLv===j)pg=S.cpg;var pages=Math.ceil(n/per);if(pg>=pages)pg=0;
  var ws=lsnWords(j,nx).map(function(w){return w.h});
  var h='<div class="hm-ph"><h3>免費課程</h3><small>華語八千詞・每課 10 個詞・看詞 → 翻牌 → 快問快答 → 打地鼠</small></div>'
   +'<div class="cl-lv">'+LVS.map(function(x,i){return i<=mo?'<button type="button" class="lv clv'+(i===j?' on':'')+'" data-j="'+i+'">'+x+'</button>':''}).join('')
   +(mo<LVS.length-1?(r&&r.status==='pending'?'<span class="cl-lk">🔒 已申請「'+esc(r.lv_name||'')+'」，等老師開通</span>':'<button type="button" class="cl-lk" id="cl-ask">🔒 '+LVS[mo+1]+(mo+2<LVS.length?'以上':'')+'要老師開通 · 申請</button>'):'')+'</div>';
  if(!n)return h+'<p class="sub">這個等級讀不到詞</p>';
  h+='<div class="hm-nx"><div class="bg">第<b>'+(nx+1)+'</b>課</div><div class="t"><b>'+(dn?'下一課：':'第一課：')+esc(ws.slice(0,4).join('・'))+(ws.length>4?'…':'')+'</b><small>'+LVS[j]+'・做完 '+dn+' / '+n+' 課</small><div class="hm-bar"><i style="width:'+Math.round(dn/n*100)+'%"></i></div></div><button type="button" class="hm-go" id="cgo">'+(dn?'繼續學 →':'開始 →')+'</button></div>';
  if(pages>1)h+='<div class="cl-pg">'+Array.apply(null,Array(pages)).map(function(_,i){var a=i*per+1,z=Math.min(n,(i+1)*per);return '<button type="button" data-pg="'+i+'" class="'+(i===pg?'on':'')+'">第 '+a+'–'+z+' 課</button>'}).join('')+'</div>';
  h+='<div class="cl-grid">';for(var k=pg*per;k<Math.min(n,(pg+1)*per);k++){var d=lsnDone(j,k),w=lsnWords(j,k).map(function(x){return x.h});
    h+='<button type="button" data-k="'+k+'" class="cl-c'+(d?' dn':k===nx?' nx':'')+'"><span class="cl-n">第 '+(k+1)+' 課'+(d?'<em>✓</em>':k===nx?'<em class="nx">下一課</em>':'')+'</span><span class="cl-w">'+esc(w.slice(0,3).join('、'))+(w.length>3?'…':'')+'</span><span class="cl-s">'+(d?'答對 '+(d.ok!=null?d.ok:'')+'/'+(d.n||10)+(d.times>1?'・練 '+d.times+' 次':''):w.length+' 個詞')+'</span></button>'}
  return h+'</div>'}
function hmSelf(zy,mo,r,wl){return '<div class="hm-ph"><h3>自己練習</h3><small>題目來自華語八千詞（TOCFL 官方詞表）・每次 10 題</small></div>'
   +'<div class="lvrow"><div class="lvs">'+LVS.map(function(x,j){var o=j<=mo;return '<button type="button" class="lv'+(j===S.lv?' on':'')+(o?'':' lock')+'" data-j="'+j+'">'+(o?'':'🔒 ')+x+'</button>'}).join('')+'</div></div>'
   +(r&&r.status==='pending'?'<div class="reqst">已送出「'+esc(r.lv_name||'')+'」的開通申請，美娟老師看過後會幫你打開。</div>':'')
   +'<div class="grid" style="grid-template-columns:repeat(3,1fr)">'
   +'<button type="button" class="gm" data-mode="choose"><i>'+(zy?'ㄅ':'ā')+'</i><b>'+(zy?'選注音':'選拼音')+'</b><small>看字選讀音</small></button>'
   +'<button type="button" class="gm" data-mode="tone"><i>ˇ</i><b>聲調練習</b><small>選出正確的聲調</small></button>'
   +'<button type="button" class="gm" data-mode="type"><i>⌨</i><b>'+(zy?'打注音':'打拼音')+'</b><small>看字自己打出來</small></button>'
   +'</div>'/* NOHZ_V1813 Quinn：「練習拼音只要選拼音、聲調練習、打拼音」——漢字闖關先拿掉 */
   +(wl.length?'<div style="margin-top:22px"><div class="hm-ph" style="margin-bottom:10px"><h3 style="font-size:17px">錯題本</h3><small>答對 2 次就會自動移出</small><button type="button" class="hm-go" id="wr" style="margin-left:auto;padding:8px 16px;font-size:14px">再練一次</button></div><div class="wrong">'
     +wl.slice(0,24).map(function(w){return '<div class="wd"><b>'+esc(w.h)+'</b><small>錯 '+w.n+' 次</small></div>'}).join('')+(wl.length>24?'<div class="wd"><b>…</b><small>還有 '+(wl.length-24)+' 個</small></div>':'')+'</div></div>':'')}
function hmTopic(zy){var t=S.topic&&TOPICS.filter(function(x){return x[1]===S.topic})[0];
  if(!t)return '<div class="hm-ph"><h3>主題生詞</h3><small>選一個主題，練這些詞的'+(zy?'注音':'拼音')+'和聲調；圖片遊戲之後開放</small></div><div class="hm-tp">'
    +TOPICS.map(function(x){return '<button type="button" data-tp="'+x[1]+'"><i>'+x[0]+'</i><b>'+x[1]+'</b><small>'+topicItems(x[1]).length+' 個詞</small></button>'}).join('')+'</div>';
  var its=topicItems(t[1]);
  return '<button type="button" class="tp-back" id="tp-back">← 全部主題</button><div class="hm-ph"><h3>'+t[0]+' '+t[1]+'</h3><small>'+its.length+' 個詞</small></div>'
   +'<div class="tp-ws">'+its.map(function(it){return '<span><b>'+esc(it.h)+'</b><i>'+esc(sylAnswer(it))+'</i></span>'}).join('')+'</div>'
   +'<p class="hm-sub" style="margin-top:18px">用這些詞練習：</p><div class="grid" style="grid-template-columns:repeat(3,1fr)">'
   +'<button type="button" class="gm" data-tmode="choose"><i>'+(zy?'ㄅ':'ā')+'</i><b>'+(zy?'選注音':'選拼音')+'</b><small>看字選讀音</small></button>'
   +'<button type="button" class="gm" data-tmode="tone"><i>ˇ</i><b>聲調練習</b><small>選出正確的聲調</small></button>'
   +'<button type="button" class="gm" data-tmode="type"><i>⌨</i><b>'+(zy?'打注音':'打拼音')+'</b><small>看字自己打出來</small></button></div>'
   +'<p class="hm-sub" style="margin-top:14px">🖼 看圖選詞、圖片翻牌：圖片做好後開放</p>'}
function hmClass(cs){
  if(!cs.length)return '<div class="cls-empty"><div class="ce-ic">👩‍🏫</div><div class="ce-t"><h3>還沒有加入班級</h3><p>跟老師拿「班級代碼」，輸入以後就看得到老師出的作業。</p>'
    +'<div class="join ce-join"><input class="t cc" id="jc" maxlength="8" placeholder="班級代碼" autocomplete="off"><button id="jb" type="button">加入班級</button></div>'
    +'<ol class="ce-st"><li>跟老師拿代碼</li><li>輸入代碼，按加入</li><li>按「去做」寫作業</li></ol></div></div>';
  return '<div class="hm-ph"><h3>老師的班級</h3><small>已加入 '+cs.length+' 個班</small></div><div class="hm-cl">'
   +cs.map(function(c){var x=S.cls[c]||{};return '<div class="row"><div class="ic">班</div><div><b>'+esc(x.name||c)+'</b><small>代碼 '+esc(c)+'</small></div>'+(x.gone?'':'<a class="go" href="room.html?c='+encodeURIComponent(c)+'">去做</a>')+'</div>'}).join('')
   +'<div class="join"><input class="t cc" id="jc" maxlength="8" placeholder="輸入代碼加入新班級"><button id="jb" type="button">加入</button></div></div>'}
/* CONTACT_V1814 Quinn：「沒有聯繫我的地方？」 */
function hmFoot(){return '<div class="hm-ft"><span>有問題嗎？</span><button type="button" id="ft-mail">✉️ 寫信給老師</button><button type="button" id="ft-bug">⚠️ 回報問題</button></div>'}
function ftBind(){var em=String(window.TEACHER_EMAIL||'').trim();
  if($('ft-mail'))$('ft-mail').onclick=function(){var m=document.createElement('div');m.className='mdl';m.innerHTML='<div class="mbox"><button class="mx" type="button">×</button><div style="font-size:34px">✉️</div><h2>寫信給美娟老師</h2><p class="sub">把下面的 Email 複製起來，用你的信箱寄信。</p><div class="ft-em">'+esc(em)+'</div><button class="btn" id="ft-cp" type="button">複製 Email</button></div>';
    document.body.appendChild(m);var c=function(){m.remove()};m.querySelector('.mx').onclick=c;m.onclick=function(e){if(e.target===m)c()};
    $('ft-cp').onclick=function(){var b=this;(navigator.clipboard?navigator.clipboard.writeText(em):Promise.reject()).then(function(){b.textContent='已複製 ✓'},function(){b.textContent='請長按上面的 Email 複製'})}};
  if($('ft-bug'))$('ft-bug').onclick=function(){var m=document.createElement('div');m.className='mdl';m.innerHTML='<div class="mbox" style="text-align:left"><button class="mx" type="button">×</button><h2 style="text-align:center">回報問題</h2><p class="sub" style="text-align:center">哪裡不能用、看不懂，都可以寫，老師會看到。</p><div class="f"><textarea class="t" id="ft-msg" maxlength="2000" placeholder="例如：按「檢查」沒有反應" style="min-height:110px"></textarea><button class="btn" id="ft-go" type="button">送出</button><div class="msg" id="ft-m"></div></div></div>';
    document.body.appendChild(m);var c=function(){m.remove()};m.querySelector('.mx').onclick=c;m.onclick=function(e){if(e.target===m)c()};
    $('ft-go').onclick=async function(){var t=$('ft-msg').value.trim();if(!t){$('ft-m').textContent='請寫一下問題';return}this.disabled=true;
      try{await db.collection('feedback').add({kind:'bug',msg:t.slice(0,2000),name:String((S.prof&&S.prof.name)||'').slice(0,60),email:String((S.user&&S.user.email)||'').slice(0,100),page:(location.pathname+location.search).slice(0,200),at:new Date().toISOString(),ua:String(navigator.userAgent||'').slice(0,200)});c();toast('已送出，謝謝你！')}
      catch(e){this.disabled=false;$('ft-m').textContent='送不出去，請改用「寫信給老師」'}}}}
async function home(){clearInterval(vt);S.run=null;var p=S.prof;await loadClasses();var st=stats(),wl=wrongList(),cs=p.classes||[],zy=isZY(),r=p.req,mo=maxOpen();
  var tab=S.tab=hmTab();var nd=Object.keys(p.lessons||{}).length;
  var h='<div class="hm-me"><div class="av">'+esc((p.name||'?').slice(0,1))+'</div><div><h2>'+esc(p.name)+'，今天想學什麼？</h2><small>練習帳號・'+(zy?'注音':'拼音')+'</small></div><span class="grow"></span>'
   +'<div class="hm-st"><div><b>'+st.streak+'</b><span>連續天數</span></div><div><b>'+st.week+'</b><span>這週做的題</span></div><div><b>'+nd+'</b><span>完成的課</span></div></div>'
   +'<button class="out" id="out" type="button">登出</button></div>'
   +'<p class="hm-q">選一個開始</p><div class="hm-pk">'
   +'<button type="button" data-tab="course"'+(tab==='course'?' class="on"':'')+'><i>📘</i><b>免費課程</b><small>照等級一課一課學，每課 10 個詞</small></button>'
   +'<button type="button" data-tab="topic"'+(tab==='topic'?' class="on"':'')+'><em>新</em><i>🍎</i><b>主題生詞</b><small>家庭、食物、動物…</small></button>'
   +'<button type="button" data-tab="self"'+(tab==='self'?' class="on"':'')+'><i>'+(zy?'ㄅ':'ā')+'</i><b>自己練習</b><small>'+(zy?'注音':'拼音')+'、聲調、打字'+(wl.length?'、錯題本':'')+'</small></button>'
   +'<button type="button" data-tab="class"'+(tab==='class'?' class="on"':'')+'><i>👩‍🏫</i><b>老師的班級</b><small>'+(cs.length?'已加入 '+cs.length+' 個班':'輸入代碼，做老師出的作業')+'</small></button></div>'
   +'<section class="hm-pn">'
   +(tab==='course'?hmCourse():tab==='topic'?hmTopic(zy)
     :tab==='self'?hmSelf(zy,mo,r,wl):hmClass(cs))
   +'</section>'+hmFoot();
  $('stage').innerHTML=h;ftBind();
  $('out').onclick=function(){auth.signOut()};
  document.querySelectorAll('.hm-pk button').forEach(function(b){b.onclick=function(){S.tab=b.dataset.tab;try{localStorage.setItem('qna_learn_tab',S.tab)}catch(e){}home()}});
  if(tab==='course')courseBind();
  document.querySelectorAll('[data-tp]').forEach(function(b){b.onclick=function(){S.topic=b.dataset.tp;home()}});
  if($('tp-back'))$('tp-back').onclick=function(){S.topic='';home()};
  document.querySelectorAll('[data-tmode]').forEach(function(b){b.onclick=function(){startRun(b.dataset.tmode,null,null,S.topic)}});
  if($('jb'))$('jb').onclick=joinClass;if($('jc'))$('jc').onkeydown=function(e){if(e.key==='Enter')joinClass()};
  if($('wr'))$('wr').onclick=function(){startRun('choose',null,wrongList().slice(0,10))};
  document.querySelectorAll('.lv:not(.clv)').forEach(function(b){b.onclick=function(){var j=+b.dataset.j;if(!lvOpen(j))return askOpen(j);S.lv=j;home()}});
  document.querySelectorAll('button.gm[data-mode]').forEach(function(b){b.onclick=function(){startRun(b.dataset.mode,S.lv)}});}
async function joinClass(){var c=$('jc').value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'');if(!c)return toast('請輸入代碼');
  var d=null;try{d=await db.collection('tclasses').doc(c).get()}catch(e){}if(!d||!d.exists)return toast('找不到這個班級，請再確認代碼');
  var cs=(S.prof.classes||[]).slice();if(cs.indexOf(c)<0)cs.push(c);
  try{await pref().update({classes:cs});S.prof.classes=cs;S.cls[c]=d.data();try{localStorage.setItem('qna_guest_name',S.prof.name)}catch(e){}toast('已加入「'+(d.data().name||c)+'」');home()}catch(e){toast('加入失敗，請稍後再試')}}

/* ====== FREECOURSE_V1796 免費課程 ======
   Quinn：練習帳號首頁的「免費課程」。華語八千詞照順序每 10 個詞一課；
   每課四步：看詞 → 翻牌 → 快問快答 → 打地鼠。等級開放照 free_to / lv_to。
   進度存在 pstudents.lessons["等級_課"] = {at, ok, n, best, times}。老師錄過的詞（tvoice）會播老師的聲音。 */
(function(){var st=document.createElement('style');st.textContent=
 '.lsn{display:grid;grid-template-columns:repeat(auto-fill,minmax(52px,1fr));gap:6px;max-height:232px;overflow:auto;padding:2px}'
+'.lsn button{height:44px;border:1px solid var(--line);background:#fff;border-radius:10px;font-size:14px;color:#4A5B75;cursor:pointer;font-family:inherit}'
+'.lsn button.dn{background:#EAF6EF;border-color:#BFE3CC;color:var(--ok);font-weight:700}.lsn button.nx{border:2px solid var(--p);color:var(--p);font-weight:700}'
+'.cbar{display:flex;align-items:center;gap:10px;margin:0 0 12px;flex-wrap:wrap}.cbar .go{margin-left:auto}'
+'.steps{display:flex;gap:4px;margin:0 0 14px}.steps span{flex:1;text-align:center;font-size:12.5px;padding:6px 2px;border-radius:8px;background:#EEF3FA;color:#7A8BA3}.steps span.on{background:var(--p);color:#fff;font-weight:700}.steps span.ok{background:#EAF6EF;color:var(--ok)}'
+'.wl{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:6px 0 4px;text-align:left}.wl div{border:1px solid var(--line);border-radius:12px;padding:10px 12px;display:flex;align-items:center;gap:10px}'
+'.wl b{font-family:"BiauKai","DFKai-SB","標楷體","Kaiti TC",serif;font-size:26px;font-weight:400}.wl .py{font-size:16px}.wl .sv{margin-left:auto;border:0;background:var(--ps);color:var(--p);border-radius:8px;padding:6px 9px;cursor:pointer}'
+'.fg{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:6px}.fg button{height:76px;border:1px solid var(--line);border-radius:12px;background:#EEF3FA;font-size:20px;cursor:pointer;color:var(--ink);font-family:inherit;padding:2px}'
+'.fg button.up{background:#fff;border-color:var(--p)}.fg button.pp{font-family:"Times New Roman",serif;font-size:15px}.fg button.dn{background:#EAF6EF;border-color:#BFE3CC;color:var(--ok)}'
+'.ml{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:16px}.ml button{height:96px;border:0;border-radius:50% 50% 16px 16px;background:#8A5A3C;color:#fff;font-size:26px;cursor:pointer;font-family:"BiauKai","DFKai-SB","標楷體","Kaiti TC",serif;box-shadow:inset 0 -10px 0 rgba(0,0,0,.18)}'
+'.ml button.r{background:var(--ok)}.ml button.w{background:var(--bad)}.fbk{margin-top:14px;padding:10px 12px;border-radius:12px;font-size:14.5px}.fbk.y{background:#EAF6EF;color:var(--ok)}.fbk.n{background:#FDECEC;color:var(--bad)}'
+'@media(max-width:560px){.wl{grid-template-columns:1fr}.fg button{height:64px;font-size:17px}.fg button.pp{font-size:12.5px}}';document.head.appendChild(st)})();
function lsnCount(j){return Math.ceil(levelItems(j).length/10)}
function lsnWords(j,k){return levelItems(j).slice(k*10,k*10+10)}
function lsnDone(j,k){var L=(S.prof&&S.prof.lessons)||{};return L[j+'_'+k]}
function lsnNext(j){var n=lsnCount(j);for(var k=0;k<n;k++)if(!lsnDone(j,k))return k;return 0}
function courseHTML(){var mo=maxOpen(),j=S.clv||0,n=lsnCount(j),nx=lsnNext(j),dn=0;for(var k=0;k<n;k++)if(lsnDone(j,k))dn++;
  return '<div class="sec" id="course"><h3>免費課程 <small>華語八千詞・每課 10 個詞・看詞 → 翻牌 → 快問快答 → 打地鼠</small></h3>'
   +'<div class="lvrow"><span>等級</span><div class="lvs">'+LVS.map(function(x,i){var o=i<=mo;return '<button type="button" class="lv clv'+(i===j?' on':'')+(o?'':' lock')+'" data-j="'+i+'">'+(o?'':'🔒 ')+x+'</button>'}).join('')+'</div></div>'
   +(n?'<div class="cbar"><span class="sub" style="margin:0">'+LVS[j]+'：一共 '+n+' 課，做完 '+dn+' 課</span><button type="button" class="go" id="cgo">'+(dn?'繼續：第 '+(nx+1)+' 課':'開始第 1 課')+'</button></div>'
     +'<div class="lsn">'+Array.apply(null,Array(n)).map(function(_,k){return '<button type="button" data-k="'+k+'" class="'+(lsnDone(j,k)?'dn':k===nx?'nx':'')+'">'+(lsnDone(j,k)?'✓':'')+(k+1)+'</button>'}).join('')+'</div>':'<p class="sub">這個等級讀不到詞</p>')+'</div>'}
function courseBind(){document.querySelectorAll('.clv').forEach(function(b){b.onclick=function(){var j=+b.dataset.j;if(!lvOpen(j))return askOpen(j);S.clv=j;home()}});
  if($('cgo'))$('cgo').onclick=function(){lesson(S.clv||0,lsnNext(S.clv||0))};
  document.querySelectorAll('.lsn button,.cl-c').forEach(function(b){b.onclick=function(){lesson(S.clv||0,+b.dataset.k)}});
  document.querySelectorAll('.cl-pg button').forEach(function(b){b.onclick=function(){S.cpg=+b.dataset.pg;S.cpgLv=S.clv||0;home()}});
  if($('cl-ask'))$('cl-ask').onclick=function(){askOpen(maxOpen()+1)}}
var LV=null;/* 這一課的狀態 */
var VCACHE={};
async function lsnVoices(ws){await Promise.all(ws.map(async function(w){if(w.h in VCACHE)return;VCACHE[w.h]='';
  try{var sn=await db.collection('tvoice').where('text','==',w.h).get();var best=null;sn.docs.forEach(function(d){var v=d.data();if(v&&v.url&&(!best||String(v.at||'')>String(best.at||'')))best=v});if(best)VCACHE[w.h]=best.url}catch(e){}}))}
function vbtn(h){return VCACHE[h]?'<button type="button" class="sv" data-v="'+esc(h)+'">🔈</button>':''}
function vplay(h){if(!VCACHE[h])return;var a=new Audio(VCACHE[h]);a.onerror=function(){toast('這台裝置播不了老師的這段錄音')};a.play().catch(function(){})}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-v]');if(b)vplay(b.dataset.v)});
async function lesson(j,k){if(!lvOpen(j))return askOpen(j);var ws=lsnWords(j,k);if(!ws.length)return toast('這一課讀不到詞');
  $('stage').innerHTML='<div class="card narrow"><p class="sub">讀取中…</p></div>';await lsnVoices(ws);
  LV={j:j,k:k,ws:ws,step:0,ok:0,n:0,miss:{},t0:Date.now()};lsnLook()}
function lsnHead(){var nm=['看詞','翻牌','快問快答','打地鼠'];return '<div class="qhead"><span>免費課程・'+LVS[LV.j]+'・第 '+(LV.k+1)+' 課</span><button type="button" class="lnk" id="lq">← 回首頁</button></div>'
  +'<div class="steps">'+nm.map(function(x,i){return '<span class="'+(i===LV.step?'on':i<LV.step?'ok':'')+'">'+(i+1)+' '+x+'</span>'}).join('')+'</div>'}
function lsnBind(){$('lq').onclick=function(){if(LV.step>0&&!confirm('現在離開，這一課要從頭開始。確定嗎？'))return;LV=null;home()}}
function lsnLook(){LV.step=0;var zy=isZY();
  $('stage').innerHTML='<div class="card" style="max-width:640px;margin:0 auto">'+lsnHead()+'<p class="sub" style="margin:0 0 6px">先看一看這 10 個詞'+(Object.keys(VCACHE).some(function(h){return VCACHE[h]&&LV.ws.some(function(w){return w.h===h})})?'，有 🔈 的可以聽老師念':'')+'。看熟了再按「下一步」。</p>'
   +'<div class="wl">'+LV.ws.map(function(w){return '<div><b>'+esc(w.h)+'</b><span class="py">'+esc(sylAnswer(w))+'</span>'+vbtn(w.h)+'</div>'}).join('')+'</div>'
   +'<button class="btn" id="ln" type="button">下一步：翻牌 →</button></div>';lsnBind();$('ln').onclick=lsnFlip}
function lsnFlip(){LV.step=1;var ws=shuffle(LV.ws).slice(0,6);var cards=shuffle([].concat.apply([],ws.map(function(w){return [{k:w.h,t:w.h,p:0},{k:w.h,t:sylAnswer(w),p:1}]})));
  var open=[],dn={},lock=false,tries=0,wrong={};
  function draw(msg){$('stage').innerHTML='<div class="card" style="max-width:640px;margin:0 auto">'+lsnHead()+'<p class="sub" style="margin:0 0 6px">把漢字和它的'+(isZY()?'注音':'拼音')+'配成一對。翻了 '+tries+' 次，配好 '+Object.keys(dn).length+' / '+ws.length+' 對。</p>'
    +'<div class="fg">'+cards.map(function(c,i){var up=open.indexOf(i)>=0||dn[c.k];return '<button type="button" data-i="'+i+'" class="'+(up?'up ':'')+(c.p?'pp ':'')+(dn[c.k]?'dn':'')+'">'+(up?esc(c.t):'？')+'</button>'}).join('')+'</div>'
    +(msg||'')+(Object.keys(dn).length===ws.length?'<button class="btn" id="ln" type="button">下一步：快問快答 →</button>':'')+'</div>';lsnBind();
    document.querySelectorAll('.fg button').forEach(function(b){b.onclick=function(){tap(+b.dataset.i)}});if($('ln'))$('ln').onclick=lsnQuiz}
  function tap(i){if(lock||open.indexOf(i)>=0||dn[cards[i].k])return;open.push(i);if(open.length<2)return draw();tries++;var a=cards[open[0]],b=cards[open[1]];
    if(a.k===b.k&&a.p!==b.p){dn[a.k]=1;open=[];vplay(a.k);draw('<div class="fbk y">配對了！'+esc(a.k)+'　'+esc(sylAnswer(LV.ws.filter(function(w){return w.h===a.k})[0]))+'</div>')}
    else{lock=true;draw('<div class="fbk n">不是一對，再找找看。</div>');setTimeout(function(){open=[];lock=false;draw()},1200)}}
  draw()}
function lsnQuiz(){LV.step=2;var ws=shuffle(LV.ws),i=0,res=null,ok=0;
  var Q=ws.map(function(w,x){var others=shuffle(LV.ws.filter(function(y){return y!==w&&sylAnswer(y)!==sylAnswer(w)})).slice(0,3);
    var kind=VCACHE[w.h]&&x%3===2?'listen':x%2?'pyw':'wpy';
    if(kind==='wpy'){var o=distractors(w);return {w:w,ask:'這個詞怎麼念？',show:'<div class="hz">'+esc(w.h)+'</div>',opts:o,ans:o.indexOf(sylAnswer(w)),py:1}}
    var o2=shuffle([w].concat(others));return {w:w,ask:kind==='listen'?'聽老師念，選出你聽到的詞':'這是哪一個詞？',show:kind==='listen'?'<button type="button" class="sv" data-v="'+esc(w.h)+'" style="font-size:30px;padding:10px 24px;margin:8px 0">🔈</button>':'<div class="py" style="font-size:30px;margin:10px 0">'+esc(sylAnswer(w))+'</div>',opts:o2.map(function(y){return y.h}),ans:o2.indexOf(w),auto:kind==='listen'}});
  function draw(){var q=Q[i];$('stage').innerHTML='<div class="card narrow">'+lsnHead()+'<div class="qhead"><span>第 '+(i+1)+' / '+Q.length+' 題</span><span>答對 '+ok+'</span></div><p class="sub" style="margin:0">'+esc(q.ask)+'</p>'+q.show
    +'<div class="opts">'+q.opts.map(function(o,k){return '<button type="button" data-o="'+k+'" class="'+(res?(k===q.ans?'ok':k===res?'sel':''):'')+'"'+(q.py?' style="font-family:\'Times New Roman\',serif;font-size:18px"':' style="font-size:22px"')+(res!=null?' disabled':'')+'>'+esc(o)+'</button>'}).join('')+'</div>'
    +(res!=null?'<div class="fbk '+(res===q.ans?'y':'n')+'">'+(res===q.ans?'答對了！':'答錯了。')+' '+esc(q.w.h)+'　'+esc(sylAnswer(q.w))+' '+vbtn(q.w.h)+'</div><button class="btn" id="qn" type="button">'+(i+1<Q.length?'下一題 →':'下一步：打地鼠 →')+'</button>':'')+'</div>';lsnBind();
    document.querySelectorAll('.opts button').forEach(function(b){b.onclick=function(){if(res!=null)return;res=+b.dataset.o;LV.n++;if(res===q.ans){ok++;LV.ok++}else LV.miss[q.w.h]=q.w;draw()}});
    if($('qn'))$('qn').onclick=function(){i++;res=null;if(i<Q.length){draw();if(Q[i].auto)vplay(Q[i].w.h)}else lsnMole()}}
  draw();if(Q[0].auto)vplay(Q[0].w.h)}
function lsnMole(){LV.step=3;var ws=shuffle(LV.ws).slice(0,8),i=0,res=null,ok=0,opts=[];
  function q(){var w=ws[i];opts=shuffle([w].concat(shuffle(LV.ws.filter(function(y){return y!==w&&sylAnswer(y)!==sylAnswer(w)})).slice(0,2)));res=null;draw();vplay(w.h)}
  function draw(){var w=ws[i];$('stage').innerHTML='<div class="card narrow">'+lsnHead()+'<div class="qhead"><span>第 '+(i+1)+' / '+ws.length+' 隻</span><span>打中 '+ok+'</span></div><p class="sub" style="margin:0">打拿著這個詞的地鼠</p>'
    +'<div class="py" style="font-size:30px;margin:10px 0 0">'+esc(sylAnswer(w))+'</div>'+vbtn(w.h)
    +'<div class="ml">'+opts.map(function(o,k){return '<button type="button" data-m="'+k+'" class="'+(res!=null?(o===w?'r':k===res?'w':''):'')+'"'+(res!=null?' disabled':'')+'>'+esc(o.h)+'</button>'}).join('')+'</div>'
    +(res!=null?'<div class="fbk '+(opts[res]===w?'y':'n')+'">'+(opts[res]===w?'打中了！':'不是這一隻。')+' '+esc(w.h)+'　'+esc(sylAnswer(w))+'</div><button class="btn" id="mn" type="button">'+(i+1<ws.length?'下一隻 →':'看這一課的成績')+'</button>':'')+'</div>';lsnBind();
    document.querySelectorAll('.ml button').forEach(function(b){b.onclick=function(){if(res!=null)return;res=+b.dataset.m;LV.n++;if(opts[res]===w){ok++;LV.ok++}else LV.miss[w.h]=w;draw()}});
    if($('mn'))$('mn').onclick=function(){i++;if(i<ws.length)q();else lsnEnd()}}
  q()}
async function lsnEnd(){var L=LV,key=L.j+'_'+L.k,old=lsnDone(L.j,L.k)||{},miss=Object.keys(L.miss).map(function(h){return L.miss[h]});
  var rec={at:new Date().toISOString(),ok:L.ok,n:L.n,best:Math.max(old.best||0,L.n?Math.round(L.ok/L.n*100):0),times:(old.times||0)+1};
  try{var ref=pref(),FP=firebase.firestore.FieldPath,inc=FV.increment;var args=[new FP('lessons',key),rec,'total',inc(L.n),'ok',inc(L.ok),'last_at',rec.at,new FP('days',today()),inc(L.n)];
    miss.forEach(function(w){args.push(new FP('wrong',w.h,'n'),inc(1),new FP('wrong',w.h,'p'),w.p,new FP('wrong',w.h,'r'),0)});
    await ref.update.apply(ref,args);
    await ref.collection('sessions').add({at:rec.at,mode:'lesson',lv:L.j,lv_name:LVS[L.j]+' 第 '+(L.k+1)+' 課',n:L.n,ok:L.ok,dur:Math.round((Date.now()-L.t0)/1000),items:miss.map(function(w){return {h:w.h,p:w.p,a:'',ok:false}})});
    var d=await ref.get();if(d.exists)S.prof=d.data();}catch(e){toast('紀錄沒存成功（網路不穩？），成績還是看得到',3500)}
  var more=L.k+1<lsnCount(L.j);LV=null;
  $('stage').innerHTML='<div class="card narrow"><span class="chip">第 '+(L.k+1)+' 課做完了！</span><div class="big">'+L.ok+' / '+L.n+'</div><p class="sub" style="margin:0">'+(miss.length?'這幾個詞再看一下，已經收進錯題本：':'全部答對，好厲害！')+'</p>'
   +(miss.length?'<div class="res">'+miss.map(function(w){return '<div><b>'+esc(w.h)+'</b><span class="c">'+esc(sylAnswer(w))+'</span></div>'}).join('')+'</div>':'')
   +(more?'<button class="btn" id="lnx" type="button">下一課：第 '+(L.k+2)+' 課 →</button>':'')+'<button class="btn ghost" id="lag" type="button">這一課再做一次</button><button class="btn ghost" id="hm" type="button">回首頁</button></div>';
  if($('lnx'))$('lnx').onclick=function(){lesson(L.j,L.k+1)};$('lag').onclick=function(){lesson(L.j,L.k)};$('hm').onclick=home}

/* ====== 做題 ====== */
function pickItems(j,n){var all=levelItems(j).filter(function(x){return x.syls.length<=4});return shuffle(all).slice(0,n)}
function distractors(it){var out={},key=sylAnswer(it);out[key]=1;var tries=0,res=[];
  while(res.length<3&&tries<60){tries++;var s=it.syls.map(function(x){return {base:x.base,tone:x.tone}});
    var k=Math.floor(Math.random()*s.length),t=s[k].tone;var nt=[1,2,3,4,5].filter(function(v){return v!==t});s[k].tone=nt[Math.floor(Math.random()*nt.length)];
    if(tries>20&&s.length>1){var k2=(k+1)%s.length;s[k2].tone=[1,2,3,4][Math.floor(Math.random()*4)]}
    var str=showSyls(s);if(!out[str]){out[str]=1;res.push(str)}}
  return shuffle(res.concat([key]))}
function startRun(mode,lv,fromWrong,topic){var items;
  if(topic){items=shuffle(topicItems(topic));if(!items.length)return toast('這個主題讀不到詞')}
  else if(fromWrong){items=fromWrong.map(function(w){var it=makeItem(w.h+' '+w.p);return it&&it.ok?it:null}).filter(Boolean);if(!items.length)return toast('錯題本是空的')}
  else{items=pickItems(lv,10);if(!items.length)return toast('這個等級的題目讀不到')}
  var qs=items.map(function(it){var q={it:it};if(mode==='choose')q.opts=distractors(it);if(mode==='tone'){q.k=Math.floor(Math.random()*it.syls.length)}return q});
  S.run={mode:mode,lv:(fromWrong||topic)?null:lv,wrongMode:!!fromWrong&&!topic,topic:topic||'',qs:qs,i:0,ans:[],t0:Date.now()};quiz()}
var TONE_LABEL_PY=['一聲 ˉ','二聲 ˊ','三聲 ˇ','四聲 ˋ','輕聲'],TONE_LABEL_ZY=['ˉ 一聲','ˊ 二聲','ˇ 三聲','ˋ 四聲','˙ 輕聲'];
function quiz(){var r=S.run,q=r.qs[r.i],it=q.it,n=r.qs.length,last=r.i===n-1,done=r.ans.filter(function(x){return x!=null}).length,zy=isZY();
  var title=r.topic?'主題・'+r.topic:r.wrongMode?'錯題本':LVS[r.lv],mname={choose:zy?'選注音':'選拼音',tone:'聲調練習',type:zy?'打注音':'打拼音'}[r.mode];
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
    await ref.collection('sessions').add({at:new Date().toISOString(),mode:mode,lv:r.lv,lv_name:r.topic?'主題・'+r.topic:r.lv==null?'錯題本':LVS[r.lv],n:n,ok:ok,dur:dur,
      items:r.qs.map(function(q,j){var a=r.ans[j];return a==null?null:{h:q.it.h,p:q.it.p,a:mode==='type'?a.v:mode==='tone'?('第'+q.k+'字 '+a+'聲'):a,ok:isRight(q,a,mode)}}).filter(Boolean)});
    var d=await ref.get();if(d.exists)S.prof=d.data();}
  catch(e){toast('紀錄沒存成功（網路不穩？），成績還是看得到',3500)}
  S.run=null;
  $('stage').innerHTML='<div class="card narrow"><span class="chip">做完了！</span><div class="big">'+ok+' / '+n+'</div><p class="sub" style="margin:0">'+(wrong.length?'錯了 '+wrong.length+' 個，已經收進錯題本':'全部答對，好厲害！')+'</p>'
   +(wrong.length?'<div class="res">'+wrong.map(function(q){return '<div><b>'+esc(q.it.h)+'</b><span class="c">'+esc(sylAnswer(q.it))+'</span></div>'}).join('')+'</div>':'')
   +'<button class="btn" id="again" type="button">再做一次</button><button class="btn ghost" id="hm" type="button">回首頁</button></div>';
  $('again').onclick=function(){if(r.topic)startRun(mode,null,null,r.topic);else if(r.wrongMode)startRun('choose',null,wrongList().slice(0,10));else startRun(mode,r.lv)};$('hm').onclick=home}

/* ====== 版本 ====== */
$('vnum').textContent=VER;
async function chkVer(manual){try{var t=await (await fetch('learn.js?check='+Date.now(),{cache:'no-store'})).text();var m=/var VER='([^']+)'/.exec(t);
  if(m&&m[1]!==VER){$('upd').hidden=false;$('vnum').textContent=VER+'（有新版本）'}else if(manual)toast('已經是最新版本 ✓')}catch(e){if(manual)toast('現在檢查不到，請稍後再試')}}
$('vchk').onclick=function(){chkVer(true)};setInterval(function(){chkVer(false)},10*60*1000);
})();
