/* REMEMBER_V1779 Quinn：「每個地方都要有『記住我』，沒勾的話請不要自己登入帳號」
   V1778 用「刪掉瀏覽器裡的登入資料庫」的做法，在同時開著別的分頁時會卡住，頁面一直停在「讀取中」。
   改成：
   1. 登入／註冊時看畫面上的「記住我」(input.qrem)：
      勾了 → 關掉瀏覽器再開也還登入著；沒勾 → 只在這次瀏覽有效。
   2. 頁面打開時，如果瀏覽器自己帶進來一個登入，但沒有人勾過「記住我」、這次瀏覽也沒有登入過，
      就先登出，不讓頁面自動用那個帳號進去。
   3. 登出時把「記住我」一起清掉。
   這支放在 firebase 前面；firebase-auth 載入後要馬上呼叫 QREM_PATCH()。 */
(function(){
  var K='qna_rem',KS='qna_ses';
  function allowed(){try{return localStorage.getItem(K)==='1'||sessionStorage.getItem(KS)==='1';}catch(e){return true;}}
  function want(){var b=document.querySelector('input.qrem');return !!(b&&b.checked);}
  function patch(){
    if(!(window.firebase&&firebase.auth&&firebase.auth.Auth&&firebase.auth.Auth.prototype))return false;
    var P=firebase.auth.Auth.prototype;if(P.__qrem)return true;P.__qrem=1;
    ['signInWithEmailAndPassword','createUserWithEmailAndPassword'].forEach(function(m){var o=P[m];if(!o)return;
      P[m]=function(){var self=this,args=arguments,r=want();
        try{if(r)localStorage.setItem(K,'1');else localStorage.removeItem(K);sessionStorage.setItem(KS,'1');}catch(e){}
        var ps;try{ps=self.setPersistence(r?firebase.auth.Auth.Persistence.LOCAL:firebase.auth.Auth.Persistence.SESSION);}catch(e){ps=null;}
        return Promise.resolve(ps).catch(function(){}).then(function(){return o.apply(self,args);});};});
    var so=P.signOut;if(so)P.signOut=function(){try{localStorage.removeItem(K);sessionStorage.removeItem(KS);}catch(e){}return so.apply(this,arguments);};
    var oa=P.onAuthStateChanged;
    if(oa)P.onAuthStateChanged=function(cb){var self=this,args=[].slice.call(arguments);
      if(typeof cb==='function')args[0]=function(u){
        if(u&&!allowed()){try{so.call(self);}catch(e){}return;}/* 沒勾記住我、這次也沒登入過：登出，等下一次（null）再通知頁面 */
        return cb.apply(this,arguments);};
      return oa.apply(self,args);};
    return true;}
  window.QREM_PATCH=patch;
  if(!patch()){var iv=setInterval(function(){if(patch())clearInterval(iv);},30);setTimeout(function(){clearInterval(iv);},20000);}
  window.QREM_HTML='<label class="qrem-l"><input type="checkbox" class="qrem"> 記住我 <span>（公用電腦請不要勾）</span></label>';
  try{var st=document.createElement('style');st.textContent='.qrem-l{display:flex!important;align-items:center;gap:8px;margin:12px 0 4px!important;font-size:14px!important;font-weight:400!important;color:#1F2D40!important;cursor:pointer;text-align:left}.qrem-l input{width:18px!important;height:18px!important;margin:0!important;accent-color:#1E4C86;flex:none}.qrem-l span{font-size:12.5px;color:#7A8BA3}';(document.head||document.documentElement).appendChild(st);}catch(e){}
})();
