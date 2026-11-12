/* RADICAL_V1 上課投影片老師選單裡的「部首投影片」按鈕。
   部首投影片放在 radical/ 資料夾；slides.html 只要保留一行 <script src="radical-btn.js"> 就會出現。 */
(function(){
  function add(){
    if(document.getElementById("radRow")) return true;
    var p = document.getElementById("tmPanel"); if(!p) return false;
    var row = document.createElement("div"); row.className = "row"; row.id = "radRow";
    var a = document.createElement("a"); a.href = "radical/"; a.target = "_blank"; a.rel = "noopener"; a.textContent = "部首投影片（60 個部首）";
    a.style.cssText = "display:block;text-align:center;padding:7px 10px;border-radius:10px;border:2px solid var(--line,#b9d2ee);color:inherit;text-decoration:none;font-size:14px;flex:1";
    row.appendChild(a);
    var lg = document.getElementById("loginRow"); p.insertBefore(row, lg || null); return true;
  }
  if(!add()){ var n = 0, t = setInterval(function(){ if(add() || ++n > 40) clearInterval(t); }, 250); }
})();
