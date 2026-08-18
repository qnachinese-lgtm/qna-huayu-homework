/* 臺灣生活溝通華語 · 內容資料檔
   內容來源：Quinn 提供的 Word 稿（第1課 便利商店 三版本）。
   逐字照抄，未增刪。原稿沒有越南文的段落就留空，不自行補譯。 */
var TC2=[{
id:"store", course:"臺灣生活溝通華語", no:1,
title:"去便利商店買東西",
compare:[
 {v:"生存版",lv:"A0",ability:"說需求、回答兩個問題",real:"加熱、袋子"},
 {v:"生活版",lv:"A0後期～A1",ability:"完成一般結帳",real:"發票、會員、集點、付款"},
 {v:"挑戰版",lv:"A1～A2",ability:"處理完整結帳與突發狀況",real:"載具、優惠、刷卡失敗、缺貨"}],
versions:[
{
name:"生存版", lv:"A0", time:"60分鐘",
goal:"買一至兩樣商品，回答「加熱、袋子」兩個問題。",
sections:[
{t:"商品生詞",kind:"wordcard",rows:[
 {w:"水",py:"shuǐ",vi:"nước"},{w:"咖啡",py:"kāfēi",vi:"cà phê"},{w:"奶茶",py:"nǎichá",vi:"trà sữa"},
 {w:"飯糰",py:"fàntuán",vi:"cơm nắm"},{w:"三明治",py:"sānmíngzhì",vi:"bánh sandwich"},{w:"茶葉蛋",py:"cháyèdàn",vi:"trứng trà"}]},
{t:"數量",kind:"table",head:["漢字","拼音","使用方式"],rows:[
 ["一個","yí ge","一個飯糰"],["兩個","liǎng ge","兩個茶葉蛋"],["一瓶","yì píng","一瓶水"],["一杯","yì bēi","一杯咖啡"]]},
{t:"核心句型",kind:"pattern",items:[
 {zh:"我要＿＿＿＿。",py:"Wǒ yào ______.",vi:"Tôi muốn ______."},
 {zh:"我還要＿＿＿＿。",py:"Wǒ hái yào ______.",vi:"Tôi còn muốn ______."},
 {zh:"還要什麼？",py:"Hái yào shénme?",vi:"Còn muốn gì nữa?"}],
 sub:{t:"例句",items:[{zh:"我要一個飯糰。",py:"Wǒ yào yí ge fàntuán."},{zh:"我還要一瓶水。",py:"Wǒ hái yào yì píng shuǐ."}]}},
{t:"店員問句",kind:"listen",items:[
 {zh:"要加熱嗎？",py:"Yào jiārè ma?",vi:"Có hâm nóng không?"},
 {zh:"要袋子嗎？",py:"Yào dàizi ma?",vi:"Có cần túi không?"}]},
{t:"回答方式",kind:"pattern",items:[
 {zh:"要，謝謝。",py:"Yào, xièxie.",vi:""},
 {zh:"不用，謝謝。",py:"Bú yòng, xièxie.",vi:""}],
 note:"教學提醒：這裡的「不用」是回應店員「不需要」，比直接說「不要」更自然。"},
{t:"示範對話",kind:"dialog",turns:[
 {who:"店員",zh:"你好。",py:"Nǐ hǎo."},
 {who:"顧客",zh:"你好。我要一個飯糰和一瓶水。",py:"Nǐ hǎo. Wǒ yào yí ge fàntuán hé yì píng shuǐ."},
 {who:"店員",zh:"飯糰要加熱嗎？",py:"Fàntuán yào jiārè ma?"},
 {who:"顧客",zh:"要，謝謝。",py:"Yào, xièxie."},
 {who:"店員",zh:"要袋子嗎？",py:"Yào dàizi ma?"},
 {who:"顧客",zh:"不用，謝謝。",py:"Bú yòng, xièxie."}]},
{t:"練習",kind:"ol",items:[
 "看商品圖片，說「我要＿＿＿＿」。",
 "再選一樣商品，說「我還要＿＿＿＿」。",
 "聽老師問「加熱／袋子」，三秒內回答。"]},
{t:"最後任務",kind:"taskcard",items:[
 "買一種食物。","買一種飲料。","回答「要加熱嗎？」","回答「要袋子嗎？」"]}
]},
{
name:"生活版", lv:"A0後期～A1", time:"60～75分鐘",
goal:"買三樣商品，回答一般結帳時的連續問題並選擇付款方式。",
sections:[
{t:"新增商品",kind:"wordcard",rows:[
 {w:"泡麵",py:"pàomiàn",vi:"mì ly"},{w:"便當",py:"biàndāng",vi:"cơm hộp"},
 {w:"汽水",py:"qìshuǐ",vi:"nước ngọt có ga"},{w:"果汁",py:"guǒzhī",vi:"nước trái cây"}]},
{t:"詢問價錢與付款",kind:"pattern",items:[
 {zh:"這個多少錢？",py:"Zhège duōshǎo qián?",vi:"Cái này bao nhiêu tiền?"},
 {zh:"可以刷卡嗎？",py:"Kěyǐ shuākǎ ma?",vi:"Có thể thanh toán bằng thẻ không?"},
 {zh:"可以用悠遊卡嗎？",py:"Kěyǐ yòng Yōuyóukǎ ma?",vi:"Có thể dùng thẻ EasyCard không?"}]},
{t:"店員常見問句",kind:"listen",items:[
 {zh:"要加熱嗎？",py:"Yào jiārè ma?",vi:"Có hâm nóng không?"},
 {zh:"需要袋子嗎？",py:"Xūyào dàizi ma?",vi:"Có cần túi không?"},
 {zh:"發票要嗎？",py:"Fāpiào yào ma?",vi:"Có lấy hóa đơn không?"},
 {zh:"有會員嗎？",py:"Yǒu huìyuán ma?",vi:"Có thành viên không?"},
 {zh:"要集點嗎？",py:"Yào jídiǎn ma?",vi:"Có tích điểm không?"}]},
{t:"回答配對",kind:"table",head:["店員問句","自然回答"],rows:[
 ["要加熱嗎？","要，謝謝。／不用，謝謝。"],
 ["需要袋子嗎？","要，謝謝。／不用，謝謝。"],
 ["發票要嗎？","要，謝謝。／不用，謝謝。"],
 ["有會員嗎？","有。／沒有。"],
 ["要集點嗎？","要，謝謝。／不用，謝謝。"]]},
{t:"完整對話",kind:"dialog",turns:[
 {who:"店員",zh:"你好。",py:"Nǐ hǎo."},
 {who:"顧客",zh:"我要一個飯糰、一瓶奶茶和兩個茶葉蛋。",py:"Wǒ yào yí ge fàntuán, yì píng nǎichá hé liǎng ge cháyèdàn."},
 {who:"店員",zh:"飯糰要加熱嗎？",py:"Fàntuán yào jiārè ma?"},
 {who:"顧客",zh:"要，謝謝。",py:"Yào, xièxie."},
 {who:"店員",zh:"需要袋子嗎？",py:"Xūyào dàizi ma?"},
 {who:"顧客",zh:"不用，謝謝。",py:"Bú yòng, xièxie."},
 {who:"店員",zh:"有會員嗎？",py:"Yǒu huìyuán ma?"},
 {who:"顧客",zh:"沒有。",py:"Méiyǒu."},
 {who:"店員",zh:"要集點嗎？",py:"Yào jídiǎn ma?"},
 {who:"顧客",zh:"不用，謝謝。",py:"Bú yòng, xièxie."},
 {who:"店員",zh:"發票要嗎？",py:"Fāpiào yào ma?"},
 {who:"顧客",zh:"要，謝謝。",py:"Yào, xièxie."},
 {who:"顧客",zh:"這個多少錢？",py:"Zhège duōshǎo qián?"},
 {who:"店員",zh:"一百五十塊。",py:"Yìbǎi wǔshí kuài."},
 {who:"顧客",zh:"可以用悠遊卡嗎？",py:"Kěyǐ yòng Yōuyóukǎ ma?"},
 {who:"店員",zh:"可以。",py:"Kěyǐ."}]},
{t:"練習",kind:"ol",items:[
 "教師隨機問五個店員問句，學生不能按照固定順序背答案。",
 "學生買三樣商品，至少使用兩種量詞。",
 "學生主動詢問價錢及付款方式。"]},
{t:"最後任務",kind:"taskcard",items:[
 "買三樣商品。","回答加熱、袋子、發票、會員、集點。","詢問總價。","選擇悠遊卡、刷卡或現金。"]}
]},
{
name:"挑戰版", lv:"A1～A2", time:"75～90分鐘",
goal:"處理載具、會員、優惠、付款及突發問題，完成真實結帳。",
sections:[
{t:"載具",kind:"pattern",items:[
 {zh:"有載具嗎？",py:"Yǒu zàijù ma?",vi:"Bạn có mã lưu hóa đơn điện tử không?"},
 {zh:"發票存載具嗎？",py:"Fāpiào cún zàijù ma?",vi:"Có lưu hóa đơn vào mã điện tử không?"},
 {zh:"載具刷一下。",py:"Zàijù shuā yíxià.",vi:"Vui lòng quét mã lưu hóa đơn."},
 {zh:"有，等一下。",py:"Yǒu, děng yíxià.",vi:"Có, xin chờ một chút."},
 {zh:"我沒有載具。",py:"Wǒ méiyǒu zàijù.",vi:"Tôi không có mã lưu hóa đơn."},
 {zh:"給我發票，謝謝。",py:"Gěi wǒ fāpiào, xièxie.",vi:"Cho tôi hóa đơn, cảm ơn."}]},
{t:"會員",kind:"pattern",items:[
 {zh:"有會員嗎？",py:"Yǒu huìyuán ma?",vi:""},
 {zh:"會員可以報電話。",py:"Huìyuán kěyǐ bào diànhuà.",vi:""},
 {zh:"我有會員。",py:"Wǒ yǒu huìyuán.",vi:""},
 {zh:"我報電話。",py:"Wǒ bào diànhuà.",vi:""},
 {zh:"我沒有會員。",py:"Wǒ méiyǒu huìyuán.",vi:""}]},
{t:"優惠與加購",kind:"pattern",items:[
 {zh:"這個第二件有打折。",py:"Zhège dì-èr jiàn yǒu dǎzhé.",vi:""},
 {zh:"這個買一送一。",py:"Zhège mǎi yī sòng yī.",vi:""},
 {zh:"要不要再拿一個？",py:"Yào bú yào zài ná yí ge?",vi:""},
 {zh:"要加購嗎？",py:"Yào jiāgòu ma?",vi:""},
 {zh:"好，我再拿一個。",py:"Hǎo, wǒ zài ná yí ge.",vi:""},
 {zh:"不用，謝謝。",py:"Bú yòng, xièxie.",vi:""},
 {zh:"我只要一個。",py:"Wǒ zhǐ yào yí ge.",vi:""}]},
{t:"付款與問題處理",kind:"pattern",items:[
 {zh:"可以付現金嗎？",py:"Kěyǐ fù xiànjīn ma?",vi:""},
 {zh:"可以刷卡嗎？",py:"Kěyǐ shuākǎ ma?",vi:""},
 {zh:"可以用手機支付嗎？",py:"Kěyǐ yòng shǒujī zhīfù ma?",vi:""},
 {zh:"你的卡刷不過。",py:"Nǐ de kǎ shuā bú guò.",vi:""},
 {zh:"那我付現金。",py:"Nà wǒ fù xiànjīn.",vi:""},
 {zh:"我換一張卡。",py:"Wǒ huàn yì zhāng kǎ.",vi:""},
 {zh:"請再試一次。",py:"Qǐng zài shì yí cì.",vi:""}]},
{t:"聽不懂時的補救句",kind:"pattern",items:[
 {zh:"請再說一次。",py:"Qǐng zài shuō yí cì.",vi:""},
 {zh:"請說慢一點。",py:"Qǐng shuō màn yìdiǎn.",vi:""},
 {zh:"你說「載具」嗎？",py:"Nǐ shuō zàijù ma?",vi:""},
 {zh:"我聽不懂。",py:"Wǒ tīngbudǒng.",vi:""},
 {zh:"可以給我看嗎？",py:"Kěyǐ gěi wǒ kàn ma?",vi:""}]},
{t:"挑戰版完整對話",kind:"dialog",turns:[
 {who:"顧客",zh:"我要一個便當和一瓶果汁。",py:"Wǒ yào yí ge biàndāng hé yì píng guǒzhī."},
 {who:"店員",zh:"便當要加熱嗎？",py:"Biàndāng yào jiārè ma?"},
 {who:"顧客",zh:"要，謝謝。",py:"Yào, xièxie."},
 {who:"店員",zh:"這個果汁第二件六折，要不要再拿一瓶？",py:"Zhège guǒzhī dì-èr jiàn liù zhé, yào bú yào zài ná yì píng?"},
 {who:"顧客",zh:"好，我再拿一瓶。",py:"Hǎo, wǒ zài ná yì píng."},
 {who:"店員",zh:"需要袋子嗎？",py:"Xūyào dàizi ma?"},
 {who:"顧客",zh:"要，謝謝。",py:"Yào, xièxie."},
 {who:"店員",zh:"有會員嗎？",py:"Yǒu huìyuán ma?"},
 {who:"顧客",zh:"有，我報電話。",py:"Yǒu, wǒ bào diànhuà."},
 {who:"店員",zh:"發票存載具嗎？",py:"Fāpiào cún zàijù ma?"},
 {who:"顧客",zh:"抱歉，請再說一次。",py:"Bàoqiàn, qǐng zài shuō yí cì."},
 {who:"店員",zh:"有沒有載具？",py:"Yǒu méiyǒu zàijù?"},
 {who:"顧客",zh:"有，等一下。",py:"Yǒu, děng yíxià."},
 {who:"店員",zh:"一共兩百零五塊。",py:"Yígòng liǎngbǎi língwǔ kuài."},
 {who:"顧客",zh:"可以刷卡嗎？",py:"Kěyǐ shuākǎ ma?"},
 {who:"店員",zh:"可以。",py:"Kěyǐ."}]},
{t:"情境挑戰卡",kind:"table",head:["情境","學生任務"],rows:[
 ["沒有載具","請店員印出發票。"],
 ["卡片刷不過","改用現金或換一張卡。"],
 ["第二件有折扣","決定再拿一件或婉拒。"],
 ["聽不懂店員","請對方再說一次或說慢一點。"],
 ["商品缺貨","改買其他商品。"]]},
{t:"最後任務",kind:"taskcard",items:[
 "買三樣以上的商品。","回答加熱、袋子、會員、集點、發票和載具。","處理一個優惠。",
 "選擇付款方式。","遇到一個突發問題。","至少使用一次補救句。"]}
]}
]}];
