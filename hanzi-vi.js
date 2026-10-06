/* ══════ HZVI_V1393 字族工坊的介面語言：繁體中文 ／ Tiếng Việt ══════
   Quinn：「字族工坊整頁沒有越南文」。這一頁本來完全沒有語言機制——
   學生端、兩個登入頁、教師後台都有越南文，只有這一頁是全中文。

   做法跟教師後台同一套（UILANG_V962）：字典在 vi.js，選了越南文才載，
   翻不到的句子維持中文，不會空白。這裡是獨立的一份，不動 teacher-app.js，
   也不動漢字遊戲本身的任何程式——只在外面換字。

   語言從哪裡來：
     ① 學生端選的語言（localStorage 的 hyc_lang）——學生在學生頁選了越南文，
        點進遊戲就直接是越南文，不用再選一次。
     ② 沒有 ① 就看教師後台的（qna_ui_lang）——老師從後台按「開啟遊戲試玩」
        進來，會跟著後台的語言。
     ③ 右上角那一顆可以自己切，切了寫回 hyc_lang（這一頁是給學生用的，
        所以寫學生端那個 key，切完回學生頁也會是同一種語言）。

   為什麼不怕翻錯字卡：字典是「整句完全一樣才換」，單個漢字（青、艮、門…）、
   《說文解字》原文、拼音這些都不在字典裡，所以碰不到。 */
(function () {
  'use strict';
  var LS_STU = 'hyc_lang';      /* 學生端 */
  var LS_TCH = 'qna_ui_lang';   /* 教師後台 */
  var VI_VER = '1406';          /* ⚠ 字典改了就要跟著改，不然瀏覽器會用快取裡的舊字典 */
  var DICT = null, LOADING = false, OB = null, T = null;

  function readLS(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function cur() {
    var a = readLS(LS_STU); if (a) return a === 'vi' ? 'vi' : 'zh';
    var b = readLS(LS_TCH); if (b) return b === 'vi' ? 'vi' : 'zh';
    return 'zh';
  }
  function setCur(v) { try { localStorage.setItem(LS_STU, v); } catch (e) {} }

  /* 空白全部壓成一個、前後去掉，才對得上字典 */
  function key(s) { return String(s).replace(/[\s　]+/g, ' ').trim(); }

  function look1(k) {
    if (Object.prototype.hasOwnProperty.call(DICT.M, k)) return DICT.M[k];
    for (var i = 0; i < DICT.R.length; i++) {
      var r = DICT.R[i];
      if (r[0].test(k)) return k.replace(r[0], r[1]);
    }
    return null;
  }
  /* 前面掛一個表情符號的（「🀄 漢字遊戲」）、後面掛括號的，拆開再查 */
  var PRE = /^([^一-鿿A-Za-z0-9]{1,4})[ 　]([\s\S]+)$/;
  function look(raw) {
    var k = key(raw); if (!k) return null;
    var hit = look1(k); if (hit != null) return hit;
    var m = k.match(PRE);
    if (m) { var h2 = look1(m[2]); if (h2 != null) return m[1] + ' ' + h2; }
    return null;
  }

  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, TITLE: 1, CANVAS: 1, SVG: 1, OPTION: 0 };
  function doText(root, on) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false), n, a = [];
    while ((n = w.nextNode())) a.push(n);
    for (var i = 0; i < a.length; i++) {
      n = a[i];
      var p = n.parentNode; if (!p) continue;
      if (SKIP[p.nodeName]) continue;
      if (p.closest && p.closest('[data-novi]')) continue;
      if (n.__vi_zh === undefined) n.__vi_zh = n.nodeValue;
      if (!on) { if (n.nodeValue !== n.__vi_zh) n.nodeValue = n.__vi_zh; continue; }
      var t = look(n.__vi_zh);
      if (t != null) { if (n.nodeValue !== t) n.nodeValue = t; }
      else if (n.nodeValue !== n.__vi_zh) n.nodeValue = n.__vi_zh;
    }
  }
  var ATTRS = ['placeholder', 'title', 'aria-label'];
  function doAttr(root, on) {
    var sel = '[placeholder],[title],[aria-label]';
    var els = [].slice.call(root.querySelectorAll ? root.querySelectorAll(sel) : []);
    if (root.matches && root.matches(sel)) els.push(root);
    els.forEach(function (el) {
      if (el.closest && el.closest('[data-novi]')) return;
      ATTRS.forEach(function (a) {
        var v = el.getAttribute(a); if (v == null) return;
        var st = '__vi_' + a;
        if (el[st] === undefined) el[st] = v;
        if (!on) { if (v !== el[st]) el.setAttribute(a, el[st]); return; }
        var t = look(el[st]);
        if (t != null) { if (v !== t) el.setAttribute(a, t); }
        else if (v !== el[st]) el.setAttribute(a, el[st]);
      });
    });
  }
  function apply(on) {
    var root = document.body; if (!root) return;
    if (OB) OB.disconnect();
    try { doText(root, on); doAttr(root, on); } catch (e) {}
    if (on && OB) OB.observe(root, { childList: true, subtree: true, characterData: true });
  }
  function schedule() { if (T) clearTimeout(T); T = setTimeout(function () { T = null; apply(true); }, 120); }
  function startOb() { if (OB || !window.MutationObserver) return; OB = new MutationObserver(function () { schedule(); }); }

  function load(cb) {
    if (DICT) return cb();
    if (LOADING) return;
    LOADING = true;
    var s = document.createElement('script');
    s.src = 'vi.js?v=' + VI_VER;
    s.onload = function () {
      LOADING = false;
      var d = window.QNA_VI;
      if (!d || !d.M) return;
      d.R = (d.R || []).map(function (r) { try { return [new RegExp(r[0]), r[1]]; } catch (e) { return null; } }).filter(Boolean);
      DICT = d; cb();
    };
    s.onerror = function () { LOADING = false; };  /* 載不到就維持中文，不要擋住遊戲 */
    document.head.appendChild(s);
  }

  function setLang(v) {
    setCur(v);
    try { if (v === 'vi') document.body.classList.add('ui-vi'); else document.body.classList.remove('ui-vi'); } catch (e) {}
    if (v === 'vi') { startOb(); load(function () { apply(true); }); }
    else { if (OB) OB.disconnect(); apply(false); }
  }
  window.qnaSetUiLang = setLang;

  /* ── 右上角那一顆（長相照學生端和教師後台的 .lang-btn）── */
  var LANGS = [{ v: 'zh', n: '繁體中文' }, { v: 'vi', n: 'Tiếng Việt' }];
  function mount() {
    if (document.getElementById('hz-langwrap')) return true;
    var tools = document.querySelector('.top .tools'); if (!tools) return false;
    var wrap = document.createElement('div');
    wrap.id = 'hz-langwrap';
    wrap.setAttribute('data-novi', '1');   /* 語言選單本身不翻 */
    var b = document.createElement('button');
    b.type = 'button'; b.id = 'hz-lang';
    var menu = document.createElement('div');
    menu.id = 'hz-lang-menu'; menu.hidden = true; menu.setAttribute('role', 'listbox');
    function nameOf(v) { for (var i = 0; i < LANGS.length; i++) if (LANGS[i].v === v) return LANGS[i].n; return LANGS[0].n; }
    function close() { if (!menu.hidden) { menu.hidden = true; b.setAttribute('aria-expanded', 'false'); } }
    function paint() {
      var c = cur();
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/>'
        + '<path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/></svg>'
        + '<span class="lgn">' + nameOf(c) + '</span>';
      b.title = (c === 'vi' ? ('Ngôn ngữ giao diện: ' + nameOf(c)) : ('介面語言：' + nameOf(c)));
      b.setAttribute('aria-label', b.title);
      menu.innerHTML = '';
      LANGS.forEach(function (L) {
        var r = document.createElement('button');
        r.type = 'button'; r.textContent = L.n;
        r.setAttribute('role', 'option');
        r.setAttribute('aria-selected', (L.v === c) ? 'true' : 'false');
        if (L.v === c) r.className = 'on';
        r.addEventListener('click', function (ev) {
          ev.stopPropagation(); close();
          if (L.v !== cur()) setLang(L.v);
          paint();
        });
        menu.appendChild(r);
      });
    }
    b.addEventListener('click', function (ev) {
      ev.stopPropagation();
      if (menu.hidden) { menu.hidden = false; b.setAttribute('aria-expanded', 'true'); } else close();
    });
    document.addEventListener('click', function (ev) { if (!wrap.contains(ev.target)) close(); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') close(); });
    paint();
    wrap.appendChild(b); wrap.appendChild(menu);
    var back = tools.querySelector('a.btn');
    if (back) tools.insertBefore(wrap, back); else tools.appendChild(wrap);
    if (cur() === 'vi') setLang('vi');
    return true;
  }

  function boot() {
    if (mount()) return;
    /* 工具列還沒畫出來就再等一下（最多 30 秒） */
    var n = 0, iv = setInterval(function () { n++; if (mount() || n > 60) clearInterval(iv); }, 500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
