/* SLIDESBTN_V3 教師後台「上課投影片」圖示鈕。
   放在獨立檔案裡，teacher.html 只要保留一行 <script src="slides-btn.js"> 就會出現，
   改 teacher.html 時請不要拿掉那一行。 */
(function(){
  function add(){
    if(document.getElementById("slides-btn")) return true;
    var box = document.querySelector(".tb-ic"); if(!box) return false;
    var a = document.createElement("a");
    a.id = "slides-btn"; a.href = "slides.html"; a.target = "_blank"; a.rel = "noopener";
    a.className = "btn btn-sm btn-ghost"; a.title = "上課投影片（開新分頁）"; a.setAttribute("aria-label", "上課投影片");
    a.innerHTML = '<svg class="tb-svg" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/><path d="m10 8 4 2-4 2z"/></svg>';
    box.insertBefore(a, box.firstChild); return true;
  }
  if(!add()){ var n = 0, t = setInterval(function(){ if(add() || ++n > 40) clearInterval(t); }, 250); }
  function watch(){ add(); try { new MutationObserver(function(){ if(!document.getElementById("slides-btn")) add(); }).observe(document.body, {childList: true, subtree: true}); } catch(e){} }
  if(document.body) watch(); else document.addEventListener("DOMContentLoaded", watch);
})();
