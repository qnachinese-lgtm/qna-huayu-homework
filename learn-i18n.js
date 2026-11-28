/* LEARNI18N_V1817 Quinn：「這種網頁，也建議跟官網一樣，有三種語言可以切換」「框子固定，翻譯的文字儘量濃縮，精簡」
   練習帳號頁（learn.html）的介面翻譯：中文／EN／VI。只翻說明和按鈕；要學的中文（詞、拼音、題目）不翻。
   跟班級頁（stu-shell.js）用同一個設定 qna_ui_lang。 */
(function(){
  var LANG='zh';try{LANG=localStorage.getItem('qna_ui_lang')||'zh'}catch(e){}
  if(['zh','en','vi'].indexOf(LANG)<0)LANG='zh';
  /* ---- 切換按鈕（放在上面品牌條右邊） ---- */
  var st=document.createElement('style');st.textContent=
    '.lg-sw{display:inline-flex;background:#E6EDF6;border-radius:999px;padding:3px;gap:2px;margin-left:auto;margin-right:10px;flex:none}'
   +'.lg-sw button{border:0;background:none;border-radius:999px;width:44px;height:28px;padding:0;font-size:12.5px;color:#5B6B82;cursor:pointer;font-family:inherit}'
   +'.lg-sw button.on{background:#fff;color:#1E4C86;font-weight:700;box-shadow:0 1px 3px rgba(30,60,110,.15)}'
   +'header.bar .home2{margin-left:0!important}'
   /* 框子固定：文字太長就省略，不撐大框子 */
   +'.hm-pk b,.hm-pk small,.gm b,.gm small,.hm-tp small,.cl-n,.cl-s,.hm-nx .t b,.hm-nx .t small,.qt b,.qt small,.hm-ft button,.ce-st li{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}'
   +'.gm{min-width:0}.gm b,.gm small{display:block}'
   +'@media(max-width:600px){.lg-sw button{width:34px;font-size:11.5px}.lg-sw{margin-right:6px}}';
  document.head.appendChild(st);
  function addSwitch(){var bar=document.querySelector('header.bar');if(!bar||bar.querySelector('.lg-sw'))return;
    var s=document.createElement('span');s.className='lg-sw';
    s.innerHTML=[['zh','中文'],['en','EN'],['vi','VI']].map(function(x){return '<button type="button" data-l="'+x[0]+'" class="'+(LANG===x[0]?'on':'')+'">'+x[1]+'</button>'}).join('');
    var h=bar.querySelector('.home2');bar.insertBefore(s,h||null);
    s.querySelectorAll('button').forEach(function(b){b.onclick=function(){try{localStorage.setItem('qna_ui_lang',b.dataset.l)}catch(e){}location.reload()}})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addSwitch);else addSwitch();
  if(LANG==='zh')return;
  var K=LANG==='en'?1:2;
  /* [中文, English, Tiếng Việt] —— 越短越好 */
  var TR=[
  ['，今天想學什麼？',', what to learn today?',', hôm nay học gì?'],
  ['練習帳號・拼音','Practice · Pinyin','Luyện tập · Pinyin'],['練習帳號・注音','Practice · Zhuyin','Luyện tập · Zhuyin'],
  ['連續天數','Streak','Chuỗi ngày'],['這週做的題','This week','Tuần này'],['完成的課','Lessons','Bài đã xong'],
  ['登出','Log out','Đăng xuất'],['選一個開始','Pick one','Chọn một'],
  ['免費課程','Free course','Khóa miễn phí'],['照等級一課一課學，每課 10 個詞','10 words per lesson','10 từ mỗi bài'],
  ['主題生詞','Topics','Chủ đề'],['家庭、食物、動物…','Family, food, animals…','Gia đình, đồ ăn…'],['新','New','Mới'],
  ['自己練習','Self practice','Tự luyện'],['拼音、聲調、打字、錯題本','Pinyin, tones, review','Pinyin, thanh, ôn lỗi'],['拼音、聲調、打字','Pinyin, tones, typing','Pinyin, thanh, gõ'],['注音、聲調、打字、錯題本','Zhuyin, tones, review','Zhuyin, thanh, ôn lỗi'],['注音、聲調、打字','Zhuyin, tones, typing','Zhuyin, thanh, gõ'],
  ['老師的班級','My classes','Lớp học'],['輸入代碼，做老師出的作業','Enter code for homework','Nhập mã làm bài'],
  ['華語八千詞・每課 10 個詞・看詞 → 翻牌 → 快問快答 → 打地鼠','TOCFL 8000 · Look → Flip → Quiz → Whack','TOCFL 8000 · Xem → Lật → Hỏi → Đập'],
  ['準備一級','Novice 1','Dự bị 1'],['準備二級','Novice 2','Dự bị 2'],['入門級','Level 1','Cấp 1'],['基礎級','Level 2','Cấp 2'],['進階級','Level 3','Cấp 3'],['高階級','Level 4','Cấp 4'],['流利級','Level 5','Cấp 5'],
  ['下一課：','Next: ','Tiếp: '],['第一課：','Lesson 1: ','Bài 1: '],['繼續學 →','Continue →','Tiếp tục →'],['開始 →','Start →','Bắt đầu →'],['或選一課：','Or pick a lesson:','Hoặc chọn bài:'],['下一課','Next','Tiếp'],
  ['選一個主題，練這些詞的拼音和聲調；圖片遊戲之後開放','Pick a topic to practice','Chọn chủ đề để luyện'],['選一個主題，練這些詞的注音和聲調；圖片遊戲之後開放','Pick a topic to practice','Chọn chủ đề để luyện'],
  ['← 全部主題','← All topics','← Tất cả'],['用這些詞練習：','Practice with:','Luyện với:'],['看圖選詞','Picture quiz','Nhìn hình'],['看圖片，選出對的詞','Pick the word','Chọn từ đúng'],['🖼 看圖選詞：圖片做好後開放','🖼 Pictures coming soon','🖼 Hình sắp có'],
  ['題目來自華語八千詞（TOCFL 官方詞表）・每次 10 題','TOCFL 8000 words · 10 per round','Từ TOCFL 8000 · 10 câu'],['老師幫你挑的詞・每次 10 題',"Teacher's words · 10 per round",'Từ giáo viên chọn · 10 câu'],
  ['選拼音','Pick pinyin','Chọn pinyin'],['選注音','Pick zhuyin','Chọn zhuyin'],['看字選讀音','Choose the sound','Chọn cách đọc'],['聲調練習','Tones','Thanh điệu'],['選出正確的聲調','Pick the tone','Chọn thanh'],
  ['打拼音','Type pinyin','Gõ pinyin'],['打注音','Type zhuyin','Gõ zhuyin'],['看字自己打出來','Type it yourself','Tự gõ ra'],
  ['錯題本','Mistakes','Sổ lỗi'],['答對 2 次就會自動移出','Cleared after 2 right','Đúng 2 lần sẽ xóa'],['再練一次','Practice','Luyện lại'],
  ['還沒有加入班級','No class yet','Chưa vào lớp'],['跟老師拿「班級代碼」，輸入以後就看得到老師出的作業。','Get a class code from your teacher to see homework.','Xin mã lớp từ giáo viên để xem bài tập.'],
  ['加入班級','Join','Vào lớp'],['加入','Join','Vào'],['跟老師拿代碼','Get a code','Lấy mã'],['輸入代碼，按加入','Enter & join','Nhập mã'],['按「去做」寫作業','Tap Go','Bấm Làm'],['去做','Go','Làm'],
  ['班級代碼','Class code','Mã lớp'],['輸入代碼加入新班級','Code for a new class','Mã lớp mới'],
  ['有問題嗎？','Need help?','Cần giúp?'],['✉️ 寫信給老師','✉️ Email','✉️ Email'],['⚠️ 回報問題','⚠️ Report','⚠️ Báo lỗi'],
  ['寫信給美娟老師','Email the teacher','Email giáo viên'],['把下面的 Email 複製起來，用你的信箱寄信。','Copy the address and send an email.','Sao chép địa chỉ để gửi email.'],['複製 Email','Copy email','Sao chép'],['已複製 ✓','Copied ✓','Đã chép ✓'],
  ['回報問題','Report a problem','Báo lỗi'],['哪裡不能用、看不懂，都可以寫，老師會看到。','Tell us what went wrong.','Hãy cho biết lỗi gì.'],['送出','Send','Gửi'],['已送出，謝謝你！','Sent, thank you!','Đã gửi, cảm ơn!'],
  ['選出正確的拼音','Pick the pinyin','Chọn pinyin đúng'],['選出正確的注音','Pick the zhuyin','Chọn zhuyin đúng'],['畫線的字是第幾聲？','Tone of the underlined?','Chữ gạch dưới thanh mấy?'],['這是什麼？選出正確的詞','What is it?','Đây là gì?'],
  ['← 上一題','← Back','← Trước'],['下一題 →','Next →','Tiếp →'],['交卷','Submit','Nộp bài'],['結束','End','Xong'],['確定','Check','Kiểm tra'],['先選一個答案','Pick an answer first','Hãy chọn đáp án'],
  ['一聲 ˉ','1st ˉ','Thanh 1 ˉ'],['二聲 ˊ','2nd ˊ','Thanh 2 ˊ'],['三聲 ˇ','3rd ˇ','Thanh 3 ˇ'],['四聲 ˋ','4th ˋ','Thanh 4 ˋ'],['輕聲','Neutral','Thanh nhẹ'],
  ['要離開嗎？','Leave?','Rời đi?'],['現在離開，這次的作答不會存起來。',"Your answers won't be saved.",'Bài làm sẽ không lưu.'],['離開','Leave','Rời'],['繼續作答','Keep going','Tiếp tục'],
  ['打出拼音（可以用數字標聲調，例如 ni3hao3）','Type pinyin (e.g. ni3hao3)','Gõ pinyin (vd ni3hao3)'],['用下面的注音鍵盤打出讀音','Use the zhuyin keyboard','Dùng bàn phím zhuyin'],
  ['請先打拼音','Type pinyin first','Hãy gõ pinyin'],['老師給你的詞',"Teacher's words",'Từ của giáo viên'],
  ['版本','Version','Phiên bản'],['檢查更新','Update','Cập nhật'],['讀取中…','Loading…','Đang tải…'],
  ['開始練習','Start practicing','Bắt đầu luyện'],['選一種方式進來','Choose a way in','Chọn cách vào'],['用班級代碼','Class code','Mã lớp'],['登入練習帳號','Log in','Đăng nhập'],['註冊','Sign up','Đăng ký'],
  ['你的名字','Your name','Tên bạn'],['老師會看到','teacher sees it','GV sẽ thấy'],['寫你的名字','Your name','Tên bạn'],['老師給你的','from teacher','GV cho'],['輸入代碼','Enter code','Nhập mã'],
  ['不用帳號，輸入代碼就能做老師的題目','No account needed with a class code','Không cần tài khoản'],['開始','Start','Bắt đầu'],['密碼','Password','Mật khẩu'],['至少 6 個字','6+ characters','Ít nhất 6 ký tự'],
  ['登入','Log in','Đăng nhập'],['忘記密碼？','Forgot password?','Quên mật khẩu?'],['會寄驗證信','we send a link','sẽ gửi email'],['寫你收得到信的 Email','Your email','Email của bạn'],['寫你註冊用的 Email','Your email','Email của bạn'],
  ['國籍','Country','Quốc tịch'],['選你的國籍','Choose','Chọn'],['寫你的國籍','Your country','Quốc tịch'],['拼音或注音','Pinyin or Zhuyin','Pinyin hay Zhuyin'],['拼音','Pinyin','Pinyin'],['注音','Zhuyin','Zhuyin'],
  ['註冊，寄驗證信','Sign up','Đăng ký'],['註冊後要到信箱按驗證連結','Then click the link in your email','Sau đó bấm link trong email'],
  ['越南','Vietnam','Việt Nam'],['臺灣','Taiwan','Đài Loan'],['泰國','Thailand','Thái Lan'],['印尼','Indonesia','Indonesia'],['菲律賓','Philippines','Philippines'],['日本','Japan','Nhật Bản'],['韓國','Korea','Hàn Quốc'],['美國','USA','Mỹ'],['其他','Other','Khác'],
  ['請到信箱驗證','Check your email','Kiểm tra email'],['我已經驗證好了','I have verified','Tôi đã xác minh'],['重寄驗證信','Resend','Gửi lại'],['Email 寫錯了？回去改','Wrong email?','Sai email?'],
  ['記住我','Remember me','Ghi nhớ'],
  ['拼音表','Pinyin chart','Bảng pinyin'],['拼音、注音、書寫規則','Pinyin, zhuyin, rules','Pinyin, zhuyin, quy tắc'],['拼音、注音對照和書寫規則','Pinyin–zhuyin & rules','Pinyin–zhuyin & quy tắc'],
  ['聲母','Initials','Phụ âm đầu'],['韻母','Finals','Vần'],['聲調','Tones','Thanh điệu'],['書寫規則','Rules','Quy tắc'],['自成音節','Alone','Đứng riêng'],['例字','Example','Ví dụ'],
  ['一共 21 個聲母','21 initials','21 phụ âm đầu'],['一聲','Tone 1','Thanh 1'],['二聲','Tone 2','Thanh 2'],['三聲','Tone 3','Thanh 3'],['四聲','Tone 4','Thanh 4'],
  ['今天的目標',"Today's goal",'Mục tiêu hôm nay'],['今天還沒練習，來做幾題吧！','Not yet today — try a few!','Hôm nay chưa luyện!'],['今天的目標達成了！🎉','Goal reached! 🎉','Đạt mục tiêu! 🎉'],['今日一詞','Word of the day','Từ hôm nay'],
  ['線是聲音的高低：上面高、下面低','Line = pitch (high to low)','Đường = cao độ'],['唸唸看：','Say it:','Đọc thử:'],['綠色是對的寫法，紅色是常見的錯','Green = right, red = common mistake','Xanh = đúng, đỏ = lỗi thường gặp'],
  ['一共 21 個聲母，照發音的位置分成六組','21 initials in 6 groups','21 phụ âm, 6 nhóm'],
  ['做完了！','Done!','Xong rồi!'],['全部答對，好厲害！','All correct, great!','Đúng hết, giỏi quá!'],['再做一次','Again','Làm lại'],['回首頁','Home','Trang chủ'],
  ['已經收進錯題本','added to Mistakes','đã vào Sổ lỗi'],['錯了','Wrong','Sai'],['已經是最新版本 ✓','Up to date ✓','Đã mới nhất ✓'],
  ['紀錄沒存成功（網路不穩？），成績還是看得到',"Couldn't save (network?)",'Chưa lưu được (mạng?)'],['（公用電腦請不要勾）','(not on shared PCs)','(không dùng máy chung)']
  ];
  var TRX=[
   [/^已加入 (\d+) 個班$/,'Joined $1','Đã vào $1 lớp'],[/^(\d+) 個詞・有圖$/,'$1 words · pics','$1 từ · hình'],[/^(\d+) 個詞$/,'$1 words','$1 từ'],
   [/^第 (\d+)–(\d+) 課$/,'L$1–$2','Bài $1–$2'],[/^第 (\d+) 課$/,'Lesson $1','Bài $1'],[/^代碼 (\S+)$/,'Code $1','Mã $1'],
   [/^答對 (\d+)\/(\d+)・練 (\d+) 次$/,'$1/$2 · $3×','$1/$2 · $3 lần'],[/^答對 (\d+)\/(\d+)$/,'$1/$2 right','Đúng $1/$2'],[/^錯 (\d+) 次$/,'$1× wrong','Sai $1 lần'],[/^再 (\d+) 題就達成今天的目標$/,'$1 more to reach the goal','Còn $1 câu nữa'],[/^這週 (\d+) 題$/,'$1 this week','$1 câu tuần này'],
   [/^📝 老師給你的詞（(\d+)）$/,"📝 Teacher's ($1)",'📝 Của GV ($1)'],[/^主題・(.+)$/,'Topic · $1','Chủ đề · $1'],[/^還有 (\d+) 個$/,'+$1 more','+$1 nữa']
  ];
  var TRS=TR.slice().sort(function(a,b){return b[0].length-a[0].length});
  function tr(t){var tt=t.trim();if(!tt)return t;
    for(var i=0;i<TRX.length;i++)if(TRX[i][0].test(tt)){var o=tt.replace(TRX[i][0],TRX[i][K]);return t.replace(tt,sub(o))}
    return t.replace(tt,sub(tt))}
  function sub(tt){for(var j=0;j<TRS.length;j++){var k=TRS[j][0];if(k.length<=3){if(tt===k)return TRS[j][K];continue}if(tt.indexOf(k)>=0)tt=tt.split(k).join(TRS[j][K])}
    tt=tt.replace(/^🔒 (\S+)$/,function(_,a){return '🔒 '+lvName(a)});
    /* 等級名稱夾在句子裡（例如「🔒 入門級以上要老師開通 · 申請」） */
    tt=tt.replace(/🔒 (\S+?)(以上)?要老師開通 · 申請/,function(_,a,b){return '🔒 '+(lvName(a))+(b?'+':'')+(K===1?' · Apply':' · Xin mở')});
    tt=tt.replace(/^(\S+)・做完 (\d+) \/ (\d+) 課$/,function(_,a,b,c){return lvName(a)+' · '+b+'/'+c+(K===1?' done':' xong')});
    return tt}
  function lvName(a){for(var i=0;i<TR.length;i++)if(TR[i][0]===a)return TR[i][K];return a}
  /* 要學的中文不翻 */
  var SKIP='script,style,textarea,.lg-sw,.zhk,.hz,.opts,.py,.tp-ws,.cl-w,.wrong,.wl,.fg,.ml,.ex,.hm-tp b,.hm-ph h3 .zhk,.mail,.ft-em';
  var busy=false,tm=0;
  function all(){if(busy)return;busy=true;try{
    var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),ns=[];while(w.nextNode())ns.push(w.currentNode);
    ns.forEach(function(n){var p=n.parentElement;if(!p||p.closest(SKIP))return;if(n.__o==null||n.__t!==n.nodeValue)n.__o=n.nodeValue;var v=tr(n.__o);if(v!==n.nodeValue)n.nodeValue=v;n.__t=n.nodeValue});
    document.querySelectorAll('input[placeholder],textarea[placeholder]').forEach(function(x){if(x.__p==null)x.__p=x.getAttribute('placeholder');x.setAttribute('placeholder',tr(x.__p))});
  }finally{busy=false}}
  function start(){all();new MutationObserver(function(){if(busy)return;clearTimeout(tm);tm=setTimeout(all,20)}).observe(document.body,{childList:true,subtree:true,characterData:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  /* toast 的字也翻 */
  window.LTR=function(s){return tr(String(s))};
})();
