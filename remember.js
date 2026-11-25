/* REMEMBER_V1778 Quinn：「每個地方都要有『記住我』，沒勾的話請不要自己登入帳號」
   1. 頁面一打開、Firebase 還沒啟動之前：如果沒有人勾過「記住我」，就把瀏覽器裡留著的登入清掉
      （只清「長期記住」那一份；這個分頁剛登入的不受影響）。
   2. 登入／註冊時看畫面上的「記住我」(input.qrem)：
      勾了 → 關掉瀏覽器再開也還登入著；沒勾 → 只在這次瀏覽有效，關掉就登出。
   3. 登出時把「記住我」一起清掉。
   這支要放在 firebase 的 script 前面（<head> 裡）。 */
(function(){
  var K='qna_rem';
  try{
    if(localStorage.getItem(K)!=='1'){
      try{indexedDB.deleteDatabase('firebaseLocalStorageDb');}catch(e){}
      for(var i=localStorage.length-1;i>=0;i--){var k=localStorage.key(i);if(k&&k.indexOf('firebase:authUser:')===0)localStorage.removeItem(k);}
    }
  }catch(e){}
  function want(){var b=document.querySelector('input.qrem');return !!(b&&b.checked);}
  function patch(){
    if(!(window.firebase&&firebase.auth&&firebase.auth.Auth&&firebase.auth.Auth.prototype))return false;
    var P=firebase.auth.Auth.prototype;if(P.__qrem)return true;P.__qrem=1;
    ['signInWithEmailAndPassword','createUserWithEmailAndPassword'].forEach(function(m){var o=P[m];if(!o)return;
      P[m]=function(){var self=this,args=arguments,r=want();
        try{if(r)localStorage.setItem(K,'1');else localStorage.removeItem(K);}catch(e){}
        var ps;try{ps=self.setPersistence(r?firebase.auth.Auth.Persistence.LOCAL:firebase.auth.Auth.Persistence.SESSION);}catch(e){ps=null;}
        return Promise.resolve(ps).catch(function(){}).then(function(){return o.apply(self,args);});};});
    var so=P.signOut;if(so)P.signOut=function(){try{localStorage.removeItem(K);}catch(e){}return so.apply(this,arguments);};
    return true;}
  if(!patch()){var iv=setInterval(function(){if(patch())clearInterval(iv);},30);setTimeout(function(){clearInterval(iv);},20000);}
  window.QREM_HTML='<label class="qrem-l"><input type="checkbox" class="qrem"> 記住我 <span>（公用電腦請不要勾）</span></label>';
  try{var st=document.createElement('style');st.textContent='.qrem-l{display:flex!important;align-items:center;gap:8px;margin:12px 0 4px!important;font-size:14px!important;font-weight:400!important;color:#1F2D40!important;cursor:pointer;text-align:left}.qrem-l input{width:18px!important;height:18px!important;margin:0!important;accent-color:#1E4C86;flex:none}.qrem-l span{font-size:12.5px;color:#7A8BA3}';(document.head||document.documentElement).appendChild(st);}catch(e){}
})();
