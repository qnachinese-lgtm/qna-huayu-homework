/* RADICAL_V2 換課選單裡加「常用部首」：選單元、點部首就打開部首投影片（radical/ 資料夾）。
   slides.html 只要保留一行 <script src="radical-btn.js"> 就會出現。 */
(function(){
  var U = [["第一單元　人與身體",[["1-1","亻","người"],["1-2","口","miệng"],["1-3","目","mắt"],["1-4","女","phụ nữ"],["1-5","手／扌","tay"],["1-6","耳","tai"],["1-7","月","thịt"],["1-8","心／忄","tim"],["1-9","足","chân"],["1-10","士","kẻ sĩ"]]],["第二單元　尺寸",[["2-1","大","to, lớn"],["2-2","小","nhỏ"],["2-3","寸","tấc"]]],["第三單元　天空／時間",[["3-1","日","mặt trời, ngày"],["3-2","月","mặt trăng, tháng"]]],["第四單元　動物",[["4-1","虫","côn trùng"],["4-2","馬","con ngựa"],["4-3","犬／犭","con chó"],["4-4","鳥","con chim"],["4-5","隹","chim đuôi ngắn"]]],["第五單元　自然",[["5-1","土","đất"],["5-2","木","cây, gỗ"],["5-3","山","núi"],["5-4","艹","cỏ"],["5-5","竹／⺮","tre trúc"],["5-6","田","ruộng"]]],["第六單元　天氣／氣溫",[["6-1","水／氵","nước"],["6-2","冫","băng, lạnh"],["6-3","火／灬","lửa"],["6-4","雨","mưa"],["6-5","風","gió"]]],["第七單元　結構",[["7-1","門","cửa"],["7-2","囗","bao quanh"],["7-3","宀","mái nhà"],["7-4","广","mái hiên"],["7-5","戶","cửa một cánh"],["7-6","左阝","đồi, đất"],["7-7","右阝","thành, làng"]]],["第八單元　材料",[["8-1","糸","sợi tơ"],["8-2","刀／刂","con dao"],["8-3","戈","cây giáo"],["8-4","金","kim loại"],["8-5","衣／衤","áo"],["8-6","貝","vỏ sò"],["8-7","玉／王","ngọc"],["8-8","巾","khăn"],["8-9","石","đá"],["8-10","皿","đồ đựng"]]],["第九單元　食物",[["9-1","米","gạo"],["9-2","食／飠","ăn"],["9-3","酉","bình rượu"]]],["第十單元　動作",[["10-1","言","lời nói"],["10-2","走","đi, chạy"],["10-3","辵／辶","bước đi"],["10-4","彳","bước đi"],["10-5","示／礻","thần, cúng"],["10-6","力","sức lực"],["10-7","工","công việc"],["10-8","攴／攵","đánh nhẹ"],["10-9","欠","há miệng"]]]];
  var on = false, ui = 0;
  var st = document.createElement("style");
  st.textContent = ".lpPanel .lpi.rad b{font-family:'DFKai-SB','BiauKai','標楷體',serif;font-size:17px;width:30px;height:30px}";
  document.head.appendChild(st);
  function grid(p){
    var g = p.querySelector(".lpgrid"); if(!g) return;
    g.innerHTML = U[ui][1].map(function(r){ return '<button type="button" class="lpi rad" data-rad="' + r[0] + '"><b>' + r[1].split("／").pop().replace(/[左右]/, "") + '</b><span>' + r[1] + '<small>' + r[0] + '　' + r[2] + '</small></span></button>'; }).join("");
  }
  function show(p){
    on = true;
    var rows = p.querySelector(".lprows"); if(!rows) return;
    rows.querySelectorAll(".lpbooks:first-child button").forEach(function(b){ b.classList.toggle("on", !!b.dataset.radtab); });
    var v = rows.querySelector(".lpvols"); if(v) v.remove();
    var u = document.createElement("div"); u.className = "lpbooks lpvols"; u.dataset.radunits = "1";
    u.innerHTML = U.map(function(x, i){ return '<button type="button" data-radu="' + i + '" class="' + (i === ui ? "on" : "") + '">' + x[0].split("　")[0].replace("單元", "") + '</button>'; }).join("");
    rows.appendChild(u); grid(p);
  }
  function inject(){
    var p = document.getElementById("lpPanel"); if(!p) return;
    var row = p.querySelector(".lprows .lpbooks"); if(!row || row.querySelector("[data-radtab]")) return;
    var b = document.createElement("button"); b.type = "button"; b.dataset.radtab = "1"; b.textContent = "常用部首";
    row.appendChild(b);
    if(on && !(p.querySelector(".lpq") || {}).value) show(p); else on = false;
  }
  function boot(){
    var p = document.getElementById("lpPanel"); if(!p) return false;
    new MutationObserver(inject).observe(p, {childList: true, subtree: true});
    p.addEventListener("click", function(e){
      var t = e.target;
      if(t.closest("[data-radtab]")){ e.stopPropagation(); show(p); return; }
      var u = t.closest("[data-radu]"); if(u){ e.stopPropagation(); ui = +u.dataset.radu; p.querySelectorAll("[data-radu]").forEach(function(x){ x.classList.toggle("on", x === u); }); grid(p); return; }
      var r = t.closest("[data-rad]"); if(r){ e.stopPropagation(); location.href = "radical/#r" + r.dataset.rad; return; }
      if(t.closest("[data-lps],[data-lpb]")) on = false;
    }, true);
    p.addEventListener("input", function(){ on = false; }, true);
    inject(); return true;
  }
  if(!boot()){ var n = 0, tm = setInterval(function(){ if(boot() || ++n > 40) clearInterval(tm); }, 250); }
})();
