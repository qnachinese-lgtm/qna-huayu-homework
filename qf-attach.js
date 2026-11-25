/* QFATT_V1770 Quinn：「如果壞掉，能不能有個地方讓對方可以提供照片或是影片，還有文字敘述？」
   回報問題視窗多一格「照片或影片」：最多 3 個；照片自動縮到 1600px，影片 50MB 以內。
   檔案存在 Firebase Storage 的 feedback/年月/ 底下，回報的 files 欄位記路徑，後台「問題回報」看得到。
   這支要放在頁面原本的回報程式後面：它會接手「送出」鍵。 */
(function(){
  var $=function(i){return document.getElementById(i)};
  var go=$('qf-go'),note=$('qf-note');if(!go||!note)return;
  var css=document.createElement('style');css.textContent=
   '.qfa{margin-top:12px}.qfa-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;height:46px;border:1.5px dashed #C9D6E8;border-radius:12px;background:#F7FAFE;color:#1E4C86;font:inherit;font-size:14px;cursor:pointer}'
  +'.qfa-btn:hover{background:#EEF3FA}.qfa-btn svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}'
  +'.qfa-list{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}.qfa-it{position:relative;width:76px;height:76px;border-radius:10px;overflow:hidden;background:#EEF3FA;border:1px solid #DCE4EF}'
  +'.qfa-it img,.qfa-it video{width:100%;height:100%;object-fit:cover;display:block}.qfa-it .v{position:absolute;left:4px;bottom:4px;background:rgba(0,0,0,.55);color:#fff;font-size:10px;border-radius:4px;padding:1px 5px}'
  +'.qfa-it button{position:absolute;top:3px;right:3px;width:22px;height:22px;border:0;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;font-size:14px;line-height:22px;padding:0;cursor:pointer}'
  +'.qfa-hint{font-size:12px;color:#8796AB;margin-top:6px}';
  document.head.appendChild(css);
  var box=document.createElement('div');box.className='qfa';
  box.innerHTML='<label>照片或影片 <span>Photo / video（可不放 · optional）</span></label>'
   +'<button type="button" class="qfa-btn" id="qfa-btn"><svg viewBox="0 0 24 24"><path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="3.5"/></svg>加上照片或影片 · Add photo / video</button>'
   +'<input type="file" id="qfa-in" accept="image/*,video/*" multiple hidden>'
   +'<div class="qfa-list" id="qfa-list"></div><div class="qfa-hint">最多 3 個，影片 50MB 以內 · Up to 3 files, video under 50MB</div>';
  note.parentNode.insertBefore(box,note);
  var files=[];var MAX=3,VMAX=50*1024*1024;
  function paint(){var l=$('qfa-list');l.innerHTML='';files.forEach(function(f,i){var d=document.createElement('div');d.className='qfa-it';var u=URL.createObjectURL(f);
    d.innerHTML=(/^video/.test(f.type)?'<video src="'+u+'" muted></video><span class="v">影片</span>':'<img src="'+u+'" alt="">')+'<button type="button" aria-label="移除">×</button>';
    d.querySelector('button').onclick=function(){files.splice(i,1);paint()};l.appendChild(d)});
    $('qfa-btn').style.display=files.length>=MAX?'none':''}
  $('qfa-btn').onclick=function(){$('qfa-in').click()};
  $('qfa-in').onchange=function(){var bad='';[].slice.call(this.files||[]).forEach(function(f){if(files.length>=MAX)return;
      if(!/^(image|video)\//.test(f.type)){bad='只能放照片或影片 · Photos or videos only';return}
      if(/^video/.test(f.type)&&f.size>VMAX){bad='影片太大（50MB 以內） · Video too large';return}files.push(f)});
    this.value='';note.className='qf-msg';note.textContent=bad;paint()};
  function shrink(f){return new Promise(function(res){if(!/^image\//.test(f.type)||/gif$/.test(f.type)){res(f);return}
    var im=new Image();im.onload=function(){var s=Math.min(1,1600/Math.max(im.width,im.height));var c=document.createElement('canvas');c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);
      c.getContext('2d').drawImage(im,0,0,c.width,c.height);c.toBlob(function(b){res(b&&b.size<f.size?new File([b],f.name.replace(/\.\w+$/,'')+'.jpg',{type:'image/jpeg'}):f)},'image/jpeg',.85)};
    im.onerror=function(){res(f)};im.src=URL.createObjectURL(f)})}
  function loadStorage(){return new Promise(function(res,rej){if(firebase.storage){res();return}var s=document.createElement('script');s.src='https://www.gstatic.com/firebasejs/10.12.5/firebase-storage-compat.js';s.onload=function(){res()};s.onerror=rej;document.head.appendChild(s)})}
  go.onclick=async function(){var msg=$('qf-msg').value.trim();note.className='qf-msg';
    if(!msg){note.textContent='請先寫內容 · Please write a message';return}
    var kb=document.querySelector('#qf-k button.on');var kind=(kb&&kb.dataset.k)||'bug';
    go.disabled=true;note.textContent='送出中…';
    try{if(!window.firebase||!firebase.firestore)throw new Error('offline');if(!firebase.apps.length)firebase.initializeApp(window.FIREBASE_CONFIG);
      var up=[];
      if(files.length){await loadStorage();var d=new Date(),ym=d.getFullYear()+String(d.getMonth()+1).padStart(2,'0'),id=Date.now().toString(36)+Math.random().toString(36).slice(2,7);
        for(var i=0;i<files.length;i++){var f=await shrink(files[i]);var ext=(String(f.name).match(/\.(\w{1,5})$/)||[,/^video/.test(f.type)?'mp4':'jpg'])[1].toLowerCase();
          var path='feedback/'+ym+'/'+id+'-'+i+'.'+ext;note.textContent='上傳中 '+(i+1)+'/'+files.length+'… · Uploading';
          await firebase.storage().ref(path).put(f,{contentType:f.type});up.push({path:path,type:f.type,size:f.size})}}
      var doc={kind:kind,msg:msg.slice(0,2000),name:$('qf-nm').value.trim().slice(0,60),email:$('qf-em').value.trim().slice(0,100),page:(location.pathname+location.search).slice(0,200),at:new Date().toISOString(),ua:String(navigator.userAgent||'').slice(0,200)};
      if(up.length)doc.files=up;
      await firebase.firestore().collection('feedback').add(doc);
      note.className='qf-msg ok';note.textContent='已送出，謝謝！ · Sent, thank you!';$('qf-msg').value='';files=[];paint();
      setTimeout(function(){var m=$('qf-m');if(m)m.hidden=true},1400);}
    catch(e){note.textContent='送不出去，請直接寫信給我 · Failed, please email me.'+(e&&e.code?' ('+e.code+')':'')}
    go.disabled=false};
})();
