/* STUSHELL_V1788 學生端（班級作業）共用的外框
   Quinn：「請你統一一下一些內容」「有問題以及聯絡我，也要放在下方」「我的 logo 那些品牌直接不見了」
         「我是希望可以使用老師的真實聲音錄音，而不是使用 AI 聲音」
   只在網址有班級代碼（?class= 或 room.html?c=）的頁面作用：
   1. 上面一條固定的品牌條：美娟華語工作室｜QNA CHINESE，右邊是學生名字和「← 回班級」。
      各頁原本自己的頂條收起來，畫面裡重複的「回班級」也收起來；「回學生頁」改成回班級。
   2. 最下面一條頁尾：老師的 Email（config.js 的 TEACHER_EMAIL，可以複製）、回報問題。
   3. 聲音：網頁要念的時候，播老師自己錄的聲音（tvoice）；老師沒錄的，不用電腦的聲音，跳一個小提示。
   4. 結果頁：遊戲結束時 QSH.result() 跳出這一次的成績、錯了哪些詞（可以點來聽老師念）。 */
(function(){
  if (window.QSH) return;
  var qs = new URLSearchParams(location.search);
  var IS_ROOM = /\/room\.html$/.test(location.pathname);
  var CODE = String(qs.get('class') || (IS_ROOM ? qs.get('c') : '') || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  var TASK = String(qs.get('task') || '').trim();
  var Q = window.QSH = { code: CODE, task: TASK, voices: {}, owner: '', words: {}, ready: Promise.resolve(), has: function(){ return false; }, play: function(){ return false; }, result: function(){} };
  if (!CODE) return;
  var MAIL = function(){ return String(window.TEACHER_EMAIL || '').trim(); };
  var $ = function(s, r){ return (r || document).querySelector(s); };
  var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); };
  var ls = function(k){ try { return localStorage.getItem(k) || ''; } catch(e){ return ''; } };
  var norm = Q.norm = function(t){ return String(t || '').replace(/[\s，。！？、；：,.!?;:「」『』（）()／\/…—\-·]/g, '').replace(/臺/g, '台'); };
  document.documentElement.classList.add('qsh');
  var F = '"Noto Serif","Noto Serif TC","Songti TC",serif';
  var css = ''
   + '.qsh body>header,.qsh header.bar,.qsh header.top,.qsh header.gbar,.qsh #gbar{display:none!important}'
   + '.qsh-bar{position:fixed;top:0;left:0;right:0;z-index:60;background:#fff;border-bottom:1px solid #DCE4EF;font-family:' + F + '}'
   + '.qsh-in{max-width:1100px;margin:0 auto;padding:10px 20px;display:flex;align-items:center;gap:12px}'
   + '.qsh-brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:#1B2533;min-width:0}'
   + '.qsh-l{width:34px;height:34px;border-radius:9px;background:#1E4C86;color:#fff;display:grid;place-items:center;font-size:19px;font-weight:700;flex:none}'
   + '.qsh-brand b{font-size:17px;letter-spacing:1px;white-space:nowrap}'
   + '.qsh-e{font-size:12.5px;color:#7A8BA3;letter-spacing:2px;border-left:1px solid #DCE4EF;padding-left:10px;white-space:nowrap}'
   + '.qsh-sp{flex:1}.qsh-t{font-size:15px;font-weight:700;color:#1E4C86;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;padding-left:12px;border-left:1px solid #DCE4EF}.qsh-t:empty{display:none}'
   + '.qsh-me{font-size:13.5px;color:#5B6B82;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:36vw}'
   + '.qsh-back{border:1px solid #DCE4EF;background:#fff;color:#1E4C86;border-radius:999px;padding:7px 15px;font-size:14px;text-decoration:none;white-space:nowrap;font-family:inherit}'
   + '.qsh-back:hover{background:#F3F6FB}'
   + '@media(max-width:600px){.qsh-in{padding:8px 14px;gap:8px}.qsh-e{display:none}.qsh-t{font-size:13.5px;padding-left:8px}.qsh-brand b{font-size:15.5px}.qsh-me{display:none}}'
   + '.qsh-foot{margin-top:28px;background:#fff;border-top:1px solid #DCE4EF;color:#7A8BA3;font-family:' + F + ';position:relative;z-index:5}'
   + '.qsh-fi{max-width:1100px;margin:0 auto;padding:16px 20px 12px;display:flex;align-items:center;gap:10px 22px;flex-wrap:wrap}'
   + '.qsh-mail{display:flex;align-items:center;gap:7px;color:#4A5B75;font-size:14px}.qsh-mail a{color:#4A5B75}'
   + '.qsh-mail button{border:0;background:#EEF3FA;color:#1E4C86;border-radius:6px;padding:2px 8px;font-size:12px;cursor:pointer;font-family:inherit}'
   + '.qsh-rp{border:0;background:none;color:#1E4C86;font:inherit;font-size:14px;cursor:pointer;padding:0}.qsh-rp:hover{text-decoration:underline}'
   + '.qsh-c{width:100%;text-align:center;font-size:12px;color:#9AA9BD;letter-spacing:.5px;border-top:1px solid #EEF2F8;padding-top:10px}'
   + '.qsh-m{position:fixed;inset:0;z-index:9000;background:rgba(16,28,48,.45);display:flex;align-items:center;justify-content:center;padding:16px;font-family:' + F + '}'
   + '.qsh-box{position:relative;width:100%;max-width:520px;max-height:calc(100vh - 32px);overflow:auto;background:#fff;border-radius:22px;padding:24px 24px 20px;box-shadow:0 20px 60px rgba(16,28,48,.25);color:#1B2533;text-align:left}'
   + '.qsh-box h3{margin:0 0 4px;font-size:21px}.qsh-box .sub{color:#7A8BA3;font-size:14px;margin:0 0 12px}'
   + '.qsh-x{position:absolute;right:14px;top:12px;border:0;background:none;font-size:24px;color:#7A8BA3;cursor:pointer}'
   + '.qsh-box label{display:block;font-size:13px;font-weight:700;margin:12px 0 6px}'
   + '.qsh-box textarea,.qsh-box input{width:100%;box-sizing:border-box;border:1px solid #DCE4EF;border-radius:12px;padding:10px 12px;font:inherit;font-size:15px}'
   + '.qsh-box textarea{min-height:110px;resize:vertical}'
   + '.qsh-k{display:flex;gap:6px;flex-wrap:wrap}.qsh-k button{border:1px solid #DCE4EF;background:#fff;border-radius:999px;padding:6px 12px;font:inherit;font-size:13.5px;cursor:pointer;color:#4A5B75}.qsh-k button.on{background:#1E4C86;color:#fff;border-color:#1E4C86}'
   + '.qsh-go{width:100%;margin-top:14px;height:46px;border:0;border-radius:12px;background:#1E4C86;color:#fff;font:inherit;font-size:16px;font-weight:700;cursor:pointer}'
   + '.qsh-note{font-size:13.5px;margin-top:8px;color:#A33227;min-height:18px}.qsh-note.ok{color:#1F6B43}'
   + '.qsh-score{display:flex;align-items:baseline;justify-content:center;gap:8px;margin:6px 0 4px}.qsh-score b{font-size:44px;color:#1E4C86}.qsh-score span{color:#5B6B82}'
   + '.qsh-wl{display:flex;flex-direction:column;gap:6px;margin:10px 0 0}'
   + '.qsh-w{display:flex;align-items:center;gap:12px;border:1px solid #DCE4EF;border-radius:12px;padding:8px 12px}.qsh-w b{font-size:22px;letter-spacing:2px}.qsh-w span{color:#5B6B82;font-size:15px;flex:1}'
   + '.qsh-w button{border:1px solid #DCE4EF;background:#fff;border-radius:999px;padding:5px 12px;font:inherit;font-size:13px;color:#1E4C86;cursor:pointer}'
   + '.qsh-good{text-align:center;background:#E3F4EA;color:#1F6B43;border-radius:12px;padding:12px;font-weight:700;margin-top:8px}'
   + '.qsh-btns{display:flex;gap:8px;margin-top:16px;flex-wrap:wrap}.qsh-btns>*{flex:1;min-width:120px;height:46px;border-radius:12px;font:inherit;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;text-decoration:none;border:1px solid #DCE4EF;background:#fff;color:#1E4C86;box-sizing:border-box}'
   + '.qsh-btns .pri{background:#1E4C86;color:#fff;border-color:#1E4C86;font-weight:700}'
   + '.qsh-reopen{position:fixed;right:16px;bottom:16px;z-index:8000;border:0;background:#1E4C86;color:#fff;border-radius:999px;padding:12px 18px;font-size:15px;font-weight:700;box-shadow:0 6px 20px rgba(30,76,134,.3);cursor:pointer;font-family:' + F + '}'
   + '.qsh-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9500;background:#1B2533;color:#fff;border-radius:12px;padding:10px 16px;font-size:14px;font-family:' + F + ';max-width:90vw;text-align:center}'
   + '.qsh .qsh-hide{display:none!important}'
   + (/\/hanzi\.html$/.test(location.pathname) ? '.qsh nav.tabs [data-tab=recall],.qsh nav.tabs [data-tab=atlas],.qsh nav.tabs [data-tab=me]{display:none!important}' : '');/* 作業只做老師指定的關卡 */
  try { var st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st); } catch(e){}
  function toast(t){ var o = $('.qsh-toast'); if (o) o.remove(); var d = document.createElement('div'); d.className = 'qsh-toast'; d.textContent = t; document.body.appendChild(d); setTimeout(function(){ d.remove(); }, 2600); }
  Q.toast = toast;

  /* ---------- 品牌條、頁尾 ---------- */
  function meText(){ var n = ls('qna_cls_name_' + CODE) || ls('qna_guest_name'); var c = ls('qna_cls_title_' + CODE); return n ? (n + (c ? '・' + c : '')) : ''; }
  function mount(){
    if ($('.qsh-bar')) return;
    var bar = document.createElement('div'); bar.className = 'qsh-bar';
    bar.innerHTML = '<div class="qsh-in"><a class="qsh-brand" href="room.html?c=' + encodeURIComponent(CODE) + '"><span class="qsh-l">美</span><b>美娟華語工作室</b><span class="qsh-e">QNA CHINESE</span></a><span class="qsh-t" id="qsh-t"></span><span class="qsh-sp"></span>'
      + '<span class="qsh-me" id="qsh-me">' + esc(meText()) + '</span>'
      + (IS_ROOM ? '' : '<a class="qsh-back" href="room.html?c=' + encodeURIComponent(CODE) + '">← 回班級</a>') + '</div>';
    document.body.insertBefore(bar, document.body.firstChild);
    var ft = document.createElement('footer'); ft.className = 'qsh-foot';
    ft.innerHTML = '<div class="qsh-fi"><span class="qsh-mail" id="qsh-mailw" hidden>✉ <a id="qsh-mail"></a><button type="button" id="qsh-cp">複製</button></span>'
      + '<button type="button" class="qsh-rp" id="qsh-rp">⚠ 回報問題 · Report a problem</button><span class="qsh-c">© 美娟華語工作室 QNA CHINESE</span></div>';
    document.body.appendChild(ft);
    /* 頂條是固定在最上面的：頁面本來沒留位置就補一塊；頁尾貼齊左右和最下面 */
    var fit = function(){ try { var cs = getComputedStyle(document.body), pt = parseFloat(cs.paddingTop) || 0, h = bar.offsetHeight || 56;
      var sp = $('.qsh-space'); if (pt < h + 8){ if (!sp){ sp = document.createElement('div'); sp.className = 'qsh-space'; document.body.insertBefore(sp, bar.nextSibling); } sp.style.height = (h + 8 - pt) + 'px'; } else if (sp) sp.remove();
      ft.style.marginLeft = -(parseFloat(cs.paddingLeft) || 0) + 'px'; ft.style.marginRight = -(parseFloat(cs.paddingRight) || 0) + 'px'; ft.style.marginBottom = -(parseFloat(cs.paddingBottom) || 0) + 'px'; } catch(e){} };
    fit(); addEventListener('resize', fit); setTimeout(fit, 500);
    var setMail = function(){ var m = MAIL(); if (!m) return false; var a = $('#qsh-mail'); a.textContent = m; a.href = 'mailto:' + m; $('#qsh-mailw').hidden = false; return true; };
    if (!setMail()){ var n = 0, iv = setInterval(function(){ if (setMail() || ++n > 40) clearInterval(iv); }, 150); }
    $('#qsh-cp').onclick = function(){ var b = this, m = MAIL(); var ok = function(){ b.textContent = '已複製 ✓'; setTimeout(function(){ b.textContent = '複製'; }, 1600); }; try { navigator.clipboard.writeText(m).then(ok, function(){ prompt('Email', m); }); } catch(e){ prompt('Email', m); } };
    $('#qsh-rp').onclick = report;
    tidy(); new MutationObserver(tidy).observe(document.body, { childList: true, subtree: true });
  }
  var tidyT = 0;
  function tidy(){ clearTimeout(tidyT); tidyT = setTimeout(function(){
    var me = $('#qsh-me'); if (me && !me.textContent) me.textContent = meText();
    document.querySelectorAll('a,button').forEach(function(b){
      if (b.closest('.qsh-bar,.qsh-foot,.qsh-m,.qsh-keep')) return;
      var t = (b.textContent || '').trim(), h = b.tagName === 'A' ? (b.getAttribute('href') || '') : '';
      if (/^←\s*回班級/.test(t)) b.classList.add('qsh-hide');
      if (/(^|\/)student\.html/.test(h)){ b.setAttribute('href', 'room.html?c=' + encodeURIComponent(CODE)); if (/學生頁/.test(t)) b.textContent = '回班級'; }
      if (/(^|\/)play\.html$/.test(h) && /練習入口/.test(t)) b.setAttribute('href', 'room.html?c=' + encodeURIComponent(CODE));
      if (/官網/.test(t) && h) b.classList.add('qsh-hide');
      if (b.id === 'qf-open' || /^聯絡我/.test(t)) b.classList.add('qsh-hide');
    });
  }, 60); }
  function report(){
    var m = document.createElement('div'); m.className = 'qsh-m';
    m.innerHTML = '<div class="qsh-box" role="dialog" aria-modal="true"><button class="qsh-x" type="button" aria-label="關閉">×</button><h3>回報問題</h3><p class="sub">網站壞掉、看不懂、有建議，都可以寫給老師。 · Report a problem</p>'
      + '<div class="qsh-k"><button type="button" data-k="bug" class="on">網站壞掉 · Bug</button><button type="button" data-k="question">問題 · Question</button><button type="button" data-k="idea">建議 · Idea</button></div>'
      + '<label>內容</label><textarea id="qsh-msg" maxlength="2000" placeholder="請寫下遇到的問題（在哪一頁、按了什麼）"></textarea>'
      + '<label>你的名字</label><input id="qsh-nm" maxlength="60" value="' + esc(ls('qna_cls_name_' + CODE) || ls('qna_guest_name')) + '">'
      + '<label>Email <span style="font-weight:400;color:#7A8BA3">（想收到回覆再填）</span></label><input id="qsh-em" type="email" maxlength="100">'
      + '<div class="qsh-note" id="qsh-note"></div><button type="button" class="qsh-go" id="qsh-go">送出 · Send</button></div>';
    document.body.appendChild(m); var kind = 'bug';
    var close = function(){ m.remove(); };
    m.addEventListener('click', function(e){ if (e.target === m) close(); }); $('.qsh-x', m).onclick = close;
    m.querySelectorAll('[data-k]').forEach(function(b){ b.onclick = function(){ kind = b.dataset.k; m.querySelectorAll('[data-k]').forEach(function(x){ x.classList.toggle('on', x === b); }); }; });
    setTimeout(function(){ $('#qsh-msg').focus(); }, 30);
    $('#qsh-go').onclick = function(){ var msg = $('#qsh-msg').value.trim(), note = $('#qsh-note'), b = this; note.className = 'qsh-note';
      if (!msg){ note.textContent = '請先寫內容 · Please write a message'; return; }
      b.disabled = true; note.textContent = '送出中…';
      var fail = function(){ note.textContent = '送不出去，請直接寫信給老師' + (MAIL() ? '：' + MAIL() : ''); b.disabled = false; };
      try { firebase.firestore().collection('feedback').add({ kind: kind, msg: msg.slice(0, 2000), name: $('#qsh-nm').value.trim().slice(0, 60), email: $('#qsh-em').value.trim().slice(0, 100), page: (location.pathname + location.search).slice(0, 200), at: new Date().toISOString(), ua: String(navigator.userAgent || '').slice(0, 200) })
          .then(function(){ note.className = 'qsh-note ok'; note.textContent = '已送出，謝謝！ · Sent, thank you!'; setTimeout(close, 1400); }, fail); } catch(e){ fail(); }
    };
  }

  /* ---------- 老師的聲音 ---------- */
  var audio = null, lastTip = 0;
  Q.has = function(t){ return !!Q.voices[norm(t)]; };
  Q.play = function(t){ var u = Q.voices[norm(t)];
    if (u){ try { if (audio) audio.pause(); } catch(e){} audio = new Audio(u); var p = audio.play(); if (p && p.catch) p.catch(function(){}); return true; }
    var n = Date.now(); if (t && n - lastTip > 4000){ lastTip = n; toast('老師還沒錄「' + String(t).slice(0, 12) + '」的聲音'); } return false; };
  try { if (window.speechSynthesis){ var ss = window.speechSynthesis; ss.speak = function(u){ try { Q.play(u && u.text); } catch(e){} }; ss.cancel = function(){ try { if (audio) audio.pause(); } catch(e){} }; } } catch(e){}
  Q.ready = new Promise(function(res){
    var tries = 0;
    (function wait(){
      if (!(window.firebase && firebase.firestore && (firebase.apps || []).length)){ if (++tries > 150) return res(); return setTimeout(wait, 100); }
      var db = firebase.firestore();
      db.collection('tclasses').doc(CODE).get().then(function(d){
        var c = d.exists ? d.data() : null; if (!c) return res();
        Q.owner = c.owner_uid || ''; try { if (c.name) localStorage.setItem('qna_cls_title_' + CODE, c.name); } catch(e){}
        var me = $('#qsh-me'); if (me) me.textContent = meText();
        var jobs = [db.collection('tvoice').where('owner_uid', '==', Q.owner).get().then(function(sn){ sn.docs.forEach(function(x){ var v = x.data(); if (v && v.text && v.url) Q.voices[norm(v.text)] = v.url; }); }).catch(function(){})];
        if (TASK) jobs.push(db.collection('ttasks').doc(TASK).get().then(function(t){ if (!t.exists) return;  Q.taskDoc = t.data(); var tt = $('#qsh-t'); if (tt) tt.textContent = Q.taskDoc.title || ''; String(Q.taskDoc.items || '').split('\n').forEach(function(l){ var m = l.trim().match(/^([㐀-鿿]+)\s+([^=＝]+)/); if (m) Q.words[m[1]] = m[2].trim(); }); }).catch(function(){}));
        Promise.all(jobs).then(function(){ res(); });
      }).catch(function(){ res(); });
    })();
  });

  /* ---------- 結果頁 ---------- */
  var lastR = null;
  Q.result = function(r){
    r = r || {}; lastR = r;
    var old = $('.qsh-reopen'); if (old) old.remove();
    var miss = []; (r.miss || []).forEach(function(x){ var w = typeof x === 'string' ? x : (x && (x.h || x.w)) || ''; w = String(w).trim(); if (w && miss.indexOf(w) < 0) miss.push(w); });
    var hasN = r.ok != null && r.n;
    var score = hasN ? (r.ok + ' / ' + r.n) : (r.score != null ? String(r.score) : '');
    var unit = hasN ? '題答對' : String(r.unit || '').replace(/^\s+/, '');
    var m = document.createElement('div'); m.className = 'qsh-m';
    m.innerHTML = '<div class="qsh-box" role="dialog" aria-modal="true"><h3>' + esc(r.title || '這一次的結果') + '</h3>'
      + (score ? '<div class="qsh-score"><b>' + esc(score) + '</b><span>' + esc(unit) + '</span></div>' : '')
      + (miss.length ? '<p class="sub" style="margin-top:8px">這幾個詞再練習一下：</p><div class="qsh-wl">' + miss.slice(0, 20).map(function(w){ return '<div class="qsh-w"><b>' + esc(w) + '</b><span>' + esc(Q.words[w] || '') + '</span>' + (Q.has(w) ? '<button type="button" data-say="' + esc(w) + '">🔈 聽老師念</button>' : '') + '</div>'; }).join('') + '</div>'
        : '<div class="qsh-good">' + (Array.isArray(r.miss) && (!hasN || r.ok === r.n) ? '全部都對了，很棒！' : '做完了！') + '</div>')
      + '<p class="sub" style="margin:12px 0 0;font-size:13px">老師看得到這一次的紀錄。</p>'
      + '<div class="qsh-btns"><button type="button" id="qsh-look">看剛剛的畫面</button><button type="button" id="qsh-again">再玩一次</button><a class="pri" href="room.html?c=' + encodeURIComponent(CODE) + '">回班級</a></div></div>';
    document.body.appendChild(m);
    m.querySelectorAll('[data-say]').forEach(function(b){ b.onclick = function(){ Q.play(b.dataset.say); }; });
    $('#qsh-again').onclick = function(){ location.reload(); };
    $('#qsh-look').onclick = function(){ m.remove(); var b = document.createElement('button'); b.type = 'button'; b.className = 'qsh-reopen'; b.textContent = '看結果'; b.onclick = function(){ b.remove(); Q.result(lastR); }; document.body.appendChild(b); };
  };
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
