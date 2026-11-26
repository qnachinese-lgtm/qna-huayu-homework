/* PYUTIL_V1794 拼音小工具（學生頁共用）：數字聲調轉符號、拆音節、轉注音。注音要先載入 zhuyin.js。 */
(function(){
  var MK={a:'āáǎà',e:'ēéěè',i:'īíǐì',o:'ōóǒò',u:'ūúǔù','ü':'ǖǘǚǜ'};
  function markSyl(s,t){s=s.replace(/v/g,'ü').replace(/u:/g,'ü');if(!(t>=1&&t<=4))return s;var i=-1,l=s.toLowerCase();
    if(l.indexOf('a')>=0)i=l.indexOf('a');else if(l.indexOf('e')>=0)i=l.indexOf('e');else if(l.indexOf('ou')>=0)i=l.indexOf('o');else{for(var k=l.length-1;k>=0;k--){if('aeiouü'.indexOf(l[k])>=0){i=k;break}}}
    if(i<0)return s;return s.slice(0,i)+MK[l[i]][t-1]+s.slice(i+1);}
  function normPy(p){return String(p||'').trim().replace(/([a-zA-Züv:]+)([1-5])/g,function(m,b,t){return markSyl(b,+t)});}
  var INI=['zh','ch','sh','b','p','m','f','d','t','n','l','g','k','h','j','q','x','r','z','c','s','y','w',''];
  var FIN=['iang','iong','uang','ueng','ang','eng','ing','ong','ian','iao','uai','uan','üan','ai','ei','ao','ou','an','en','er','ia','ie','io','iu','in','ua','uo','ui','un','üe','ue','ün','a','o','e','i','u','ü','ê'];
  function sylls(p){var n=String(p||'').toLowerCase().normalize('NFD').replace(/[’'·\-\s]/g,''),base='',tones=[];
    for(var x=0;x<n.length;x++){var ch=n[x];if(ch==='\u0304'){tones[base.length-1]=1;continue}if(ch==='\u0301'){tones[base.length-1]=2;continue}if(ch==='\u030c'){tones[base.length-1]=3;continue}if(ch==='\u0300'){tones[base.length-1]=4;continue}if(ch==='\u0308'){base=base.slice(0,-1)+'ü';continue}if(/[a-zü]/.test(ch))base+=ch;}
    var memo={};function go(i){if(i===base.length)return [];if(i in memo)return memo[i];var best=null;
      for(var a=0;a<INI.length&&!best;a++){var A=INI[a];if(base.substr(i,A.length)!==A)continue;for(var f=0;f<FIN.length;f++){var F=FIN[f],j=i+A.length;if(base.substr(j,F.length)!==F)continue;var r=go(j+F.length);if(r){best=[[i,j+F.length]].concat(r);break}}}
      memo[i]=best;return best;}
    var segs=go(0);if(!segs)return null;return segs.map(function(s){var t=5;for(var k=s[0];k<s[1];k++)if(tones[k])t=tones[k];return {b:base.slice(s[0],s[1]),t:t};});}
  function toZy(p){var s=sylls(p);if(!s||!window.ZY)return p;return s.map(function(x){return window.ZY.syl(x.b,x.t)}).join(' ');}
  window.PYU={markSyl:markSyl,normPy:normPy,sylls:sylls,toZy:toZy};
})();
