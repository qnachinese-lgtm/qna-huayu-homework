/* 臺灣生活溝通華語 · 內容資料檔
   內容來源：Quinn 提供的 Word 稿。逐字照抄，未增刪。
   原稿沒有越南文的段落留空，不自行補譯。 */
var TC2=[
{
id:"store", course:"臺灣生活溝通華語", no:1,
title:"去便利商店買東西",
compare:{head:["版本","程度","核心能力","真實情境"],rows:[
 ["生存版","A0","說需求、回答兩個問題","加熱、袋子"],
 ["生活版","A0後期～A1","完成一般結帳","發票、會員、集點、付款"],
 ["挑戰版","A1～A2","處理完整結帳與突發狀況","載具、優惠、刷卡失敗、缺貨"]]},
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
]},

{
id:"breakfast", course:"臺灣生活溝通華語", no:2,
title:"去早餐店點餐",
overview:"本課延續第1課「便利商店買東西」的溝通能力，讓學生從說出基本需求，逐步進展到客製餐點、聽懂早餐店快速問句，以及處理售完、漏餐、拿錯餐點等真實情況。",
compare:{head:["版本","建議程度","核心能力","最後任務"],rows:[
 ["生存版","A0","點主食與飲料；回答內用／外帶、冰／熱","完成一份基本早餐訂單"],
 ["生活版","A0後期～A1","加料、去除配料、選大小杯與甜度","完成客製化點餐並付款"],
 ["挑戰版","A1～A2","理解省略口語、確認訂單、處理臨時問題","完成真實點餐並解決問題"]]},
bridge:{head:["能力","生存版","生活版","挑戰版"],rows:[
 ["主動表達","我要一個蛋餅。","加起司、不要醬。","修改訂單、反映漏餐。"],
 ["理解店員","內用還是外帶？","大小杯、冰熱、加料","省略問句與訂單複述"],
 ["處理變化","選冰的或熱的","選付款方式","售完、等候、拿錯、漏餐"],
 ["溝通補救","以重複練習為主","確認餐點內容","請再說一次、確認問題"]]},
madenote:[
 "商品圖片使用臺灣早餐店常見餐點，避免與實物差距太大的示意圖。",
 "音檔同時提供「教學慢速版」與「真實語速版」。",
 "先呈現完整問句，再逐步加入「內用外帶？」「冰熱？」等省略口語。",
 "甜度調整標註「依店家而定」，避免學生誤以為所有早餐店都能選甜度。",
 "三個版本保留同一組核心圖片與基本句型，方便客製化與逐級複習。"],
versions:[
{
name:"生存版", lv:"A0", time:"60分鐘",
goal:"能點一份主食和一杯飲料，回答兩個基本問題。",
sections:[
{t:"基本餐點",kind:"wordcard",rows:[
 {w:"蛋餅",py:"dànbǐng",vi:"bánh trứng kiểu Đài Loan"},
 {w:"吐司",py:"tǔsī",vi:"bánh mì sandwich nướng"},
 {w:"漢堡",py:"hànbǎo",vi:"hamburger"},
 {w:"蘿蔔糕",py:"luóbogāo",vi:"bánh củ cải"},
 {w:"豆漿",py:"dòujiāng",vi:"sữa đậu nành"},
 {w:"奶茶",py:"nǎichá",vi:"trà sữa"}]},
{t:"基本量詞",kind:"table",head:["說法","例子"],rows:[
 ["一個 yí ge","一個蛋餅／一個漢堡"],
 ["一份 yí fèn","一份蘿蔔糕"],
 ["一杯 yì bēi","一杯豆漿／一杯奶茶"]]},
{t:"核心句型",kind:"pattern",items:[
 {fn:"點餐",zh:"我要一個蛋餅。",py:"Wǒ yào yí ge dànbǐng.",vi:"Tôi muốn một phần bánh trứng."},
 {fn:"點飲料",zh:"我要一杯奶茶。",py:"Wǒ yào yì bēi nǎichá.",vi:"Tôi muốn một ly trà sữa."},
 {fn:"再加一樣",zh:"我還要一個漢堡。",py:"Wǒ hái yào yí ge hànbǎo.",vi:"Tôi còn muốn thêm một hamburger."}]},
{t:"聽懂店員",kind:"listen",items:[
 {zh:"內用還是外帶？",py:"Nèiyòng háishi wàidài?",ans:"內用，謝謝。／外帶，謝謝。"},
 {zh:"飲料要冰的還是熱的？",py:"Yǐnliào yào bīng de háishi rè de?",ans:"冰的，謝謝。／熱的，謝謝。"}]},
{t:"示範對話",kind:"dialog",turns:[
 {who:"店員",zh:"你好，要吃什麼？",py:"Nǐ hǎo, yào chī shénme?"},
 {who:"學生",zh:"我要一個蛋餅和一杯豆漿。",py:"Wǒ yào yí ge dànbǐng hé yì bēi dòujiāng."},
 {who:"店員",zh:"內用還是外帶？",py:"Nèiyòng háishi wàidài?"},
 {who:"學生",zh:"內用，謝謝。",py:"Nèiyòng, xièxie."},
 {who:"店員",zh:"豆漿要冰的還是熱的？",py:"Dòujiāng yào bīng de háishi rè de?"},
 {who:"學生",zh:"冰的，謝謝。",py:"Bīng de, xièxie."},
 {who:"店員",zh:"一共七十塊。",py:"Yígòng qīshí kuài."},
 {who:"學生",zh:"好，謝謝。",py:"Hǎo, xièxie."}]},
{t:"練習",kind:"ol",items:[
 "練習A｜看圖片點餐：選一份主食和一杯飲料，使用「我要……和……」。",
 "練習B｜三秒回答：隨機回答「內用還是外帶？」與「冰的還是熱的？」。"]},
{t:"最後任務",kind:"taskcard",items:[
 "點一份主食。","點一杯飲料。","回答「內用／外帶」。","回答「冰的／熱的」。","聽懂總金額並付款。"]}
]},
{
name:"生活版", lv:"A0後期～A1", time:"60～75分鐘",
goal:"能客製餐點並回答早餐店常見的連續問題。",
sections:[
{t:"新增餐點",kind:"wordcard",rows:[
 {w:"火腿蛋吐司",py:"huǒtuǐ dàn tǔsī",vi:"sandwich giăm bông và trứng"},
 {w:"鮪魚蛋餅",py:"wěiyú dànbǐng",vi:"bánh trứng cá ngừ"},
 {w:"起司蛋餅",py:"qǐsī dànbǐng",vi:"bánh trứng phô mai"},
 {w:"薯餅",py:"shǔbǐng",vi:"bánh khoai tây chiên"},
 {w:"紅茶",py:"hóngchá",vi:"trà đen"},
 {w:"咖啡",py:"kāfēi",vi:"cà phê"}]},
{t:"客製餐點",kind:"table",head:["功能","中文","拼音","意思"],rows:[
 ["加料","蛋餅加起司。","Dànbǐng jiā qǐsī.","原本沒有，希望增加"],
 ["加料","漢堡加蛋。","Hànbǎo jiā dàn.","原本沒有，希望增加"],
 ["去除","不要小黃瓜。","Bú yào xiǎohuángguā.","原本有，希望拿掉"],
 ["去除","不要醬。","Bú yào jiàng.","不要加入醬料"],
 ["減量","醬少一點。","Jiàng shǎo yìdiǎn.","可以有，但不要太多"]]},
{t:"店員常見問句",kind:"table",head:["店員問句","學生可以回答"],rows:[
 ["要加蛋嗎？／要加起司嗎？","要，謝謝。／不用，謝謝。"],
 ["要不要醬？／醬要嗎？","要，謝謝。／不要醬。／醬少一點。"],
 ["飲料要大杯還是小杯？","大杯。／小杯。"],
 ["飲料要冰的還是熱的？","冰的。／熱的。"],
 ["甜度正常嗎？","正常。／半糖。／無糖。"],
 ["內用還是外帶？","內用。／外帶。"]],
 note:"真實提醒：傳統早餐店的飲料可能已經預先調好甜度，不是每一家都能選擇半糖或無糖。"},
{t:"詢問付款方式",kind:"pattern",items:[
 {zh:"可以用悠遊卡嗎？",py:"Kěyǐ yòng Yōuyóukǎ ma?",vi:"Có thể dùng thẻ EasyCard không?"},
 {zh:"可以刷卡嗎？",py:"Kěyǐ shuākǎ ma?",vi:"Có thể thanh toán bằng thẻ không?"},
 {zh:"我付現金。",py:"Wǒ fù xiànjīn.",vi:"Tôi trả tiền mặt."}]},
{t:"完整對話",kind:"dialog",turns:[
 {who:"店員",zh:"你好，要吃什麼？",py:"Nǐ hǎo, yào chī shénme?"},
 {who:"學生",zh:"我要一個鮪魚蛋餅和一杯紅茶。",py:"Wǒ yào yí ge wěiyú dànbǐng hé yì bēi hóngchá."},
 {who:"店員",zh:"蛋餅要加起司嗎？",py:"Dànbǐng yào jiā qǐsī ma?"},
 {who:"學生",zh:"要，謝謝。",py:"Yào, xièxie."},
 {who:"店員",zh:"醬要嗎？",py:"Jiàng yào ma?"},
 {who:"學生",zh:"醬少一點，謝謝。",py:"Jiàng shǎo yìdiǎn, xièxie."},
 {who:"店員",zh:"紅茶大杯小杯？",py:"Hóngchá dàbēi xiǎobēi?"},
 {who:"學生",zh:"大杯。",py:"Dàbēi."},
 {who:"店員",zh:"冰的熱的？",py:"Bīng de rè de?"},
 {who:"學生",zh:"冰的，謝謝。",py:"Bīng de, xièxie."},
 {who:"店員",zh:"內用外帶？",py:"Nèiyòng wàidài?"},
 {who:"學生",zh:"外帶。可以用悠遊卡嗎？",py:"Wàidài. Kěyǐ yòng Yōuyóukǎ ma?"},
 {who:"店員",zh:"可以。",py:"Kěyǐ."}]},
{t:"練習",kind:"ol",items:[
 "練習A｜自由組合訂單：從主食、加料、不要的配料、飲料、冰熱與大小杯各選一項。",
 "練習B｜店員連續問：不按固定順序回答五個問題。",
 "練習C｜找出訂單錯誤：聽店員複述，指出品項、數量、冰熱或大小杯的錯誤。"]},
{t:"最後任務",kind:"taskcard",items:[
 "點兩份餐點和一杯飲料。","說明一項加料。","說明一項不要或減量的配料。",
 "回答內用／外帶、大小杯和冰熱。","詢問付款方式並完成付款。"]}
]},
{
name:"挑戰版", lv:"A1～A2", time:"75～90分鐘",
goal:"能聽懂快速省略問句，確認訂單並處理售完、漏餐或拿錯餐點。",
sections:[
{t:"臺灣早餐店快速口語",kind:"table",head:["完整問法","店員可能說","學生需要理解"],rows:[
 ["請問你要吃什麼？","要吃什麼？／吃什麼？","詢問餐點"],
 ["你要內用還是外帶？","內用外帶？","用餐方式"],
 ["飲料要冰的還是熱的？","冰的熱的？／冰熱？","飲料溫度"],
 ["飲料要大杯還是小杯？","大杯小杯？","飲料大小"],
 ["需要餐具嗎？","餐具需要嗎？","是否拿餐具"],
 ["你要加蛋嗎？","加蛋嗎？","是否加料"],
 ["你要不要醬？","醬要嗎？","是否加醬"]],
 note:"教學提醒：學生不需要模仿所有省略說法，但需要能在真實情境中聽懂。"},
{t:"餐點售完",kind:"table",head:["店員可能說","學生可以回答"],rows:[
 ["蛋餅賣完了。／豆漿沒有了。","那我改點吐司。／那我要紅茶。"],
 ["只剩下紅茶。","好，那我要紅茶。"],
 ["要不要換別的？","還有什麼飲料？／那這個不要了。"]]},
{t:"確認與更正訂單",kind:"table",head:["情況","實用說法"],rows:[
 ["確認正確","對，謝謝。"],
 ["飲料錯誤","不好意思，不是紅茶，是奶茶。"],
 ["數量錯誤","我只有點一個蛋餅。"],
 ["少了一項","還有一杯豆漿。"],
 ["想修改","不好意思，我想改一下。"]]},
{t:"等候、漏餐與拿錯",kind:"table",head:["目的","中文","拼音"],rows:[
 ["詢問時間","大概要等多久？","Dàgài yào děng duōjiǔ?"],
 ["願意等","好，我可以等。","Hǎo, wǒ kěyǐ děng."],
 ["取消","如果要等很久，那我不要了。","Rúguǒ yào děng hěn jiǔ, nà wǒ bú yào le."],
 ["漏餐","不好意思，我的豆漿還沒來。","Bùhǎoyìsi, wǒ de dòujiāng hái méi lái."],
 ["少一份","不好意思，我少了一個蛋餅。","Bùhǎoyìsi, wǒ shǎo le yí ge dànbǐng."],
 ["拿錯","這不是我點的。","Zhè bú shì wǒ diǎn de."],
 ["請求協助","可以幫我看一下嗎？","Kěyǐ bāng wǒ kàn yíxià ma?"]]},
{t:"補救溝通句",kind:"table",head:["中文","拼音","使用時機"],rows:[
 ["不好意思，請再說一次。","Bùhǎoyìsi, qǐng zài shuō yí cì.","完全沒聽清楚"],
 ["請說慢一點。","Qǐng shuō màn yìdiǎn.","對方說得太快"],
 ["你是問內用還是外帶嗎？","Nǐ shì wèn nèiyòng háishi wàidài ma?","確認聽到的內容"],
 ["我聽不懂，可以給我看嗎？","Wǒ tīngbudǒng, kěyǐ gěi wǒ kàn ma?","請對方指菜單或螢幕"],
 ["不好意思，我想改一下。","Bùhǎoyìsi, wǒ xiǎng gǎi yíxià.","修改訂單"]]},
{t:"完整對話",kind:"dialog",turns:[
 {who:"店員",zh:"你好，內用外帶？",py:"Nǐ hǎo, nèiyòng wàidài?"},
 {who:"學生",zh:"外帶。我要一個起司蛋餅、一個火腿蛋吐司和一杯大杯冰豆漿。",py:"Wàidài. Wǒ yào yí ge qǐsī dànbǐng, yí ge huǒtuǐ dàn tǔsī hé yì bēi dàbēi bīng dòujiāng."},
 {who:"店員",zh:"豆漿賣完了，只剩下紅茶和奶茶。",py:"Dòujiāng mài wán le, zhǐ shèngxià hóngchá hé nǎichá."},
 {who:"學生",zh:"那我改成大杯冰奶茶。",py:"Nà wǒ gǎi chéng dàbēi bīng nǎichá."},
 {who:"店員",zh:"蛋餅醬要嗎？",py:"Dànbǐng jiàng yào ma?"},
 {who:"學生",zh:"不要醬，謝謝。吐司不要小黃瓜。",py:"Bú yào jiàng, xièxie. Tǔsī bú yào xiǎohuángguā."},
 {who:"店員",zh:"一個起司蛋餅不要醬、一個火腿蛋吐司不要小黃瓜、大杯冰奶茶，對嗎？",py:"Yí ge qǐsī dànbǐng bú yào jiàng, yí ge huǒtuǐ dàn tǔsī bú yào xiǎohuángguā, dàbēi bīng nǎichá, duì ma?"},
 {who:"學生",zh:"對。大概要等多久？",py:"Duì. Dàgài yào děng duōjiǔ?"},
 {who:"店員",zh:"大概十分鐘。",py:"Dàgài shí fēnzhōng."},
 {who:"學生",zh:"好，沒問題。可以刷卡嗎？",py:"Hǎo, méi wèntí. Kěyǐ shuākǎ ma?"},
 {who:"店員",zh:"不行，只能付現金。",py:"Bùxíng, zhǐ néng fù xiànjīn."},
 {who:"學生",zh:"好，那我付現金。",py:"Hǎo, nà wǒ fù xiànjīn."}]},
{t:"取餐時的延伸對話",kind:"dialog",turns:[
 {who:"學生",zh:"不好意思，我少了一個火腿蛋吐司，可以幫我看一下嗎？",py:"Bùhǎoyìsi, wǒ shǎo le yí ge huǒtuǐ dàn tǔsī, kěyǐ bāng wǒ kàn yíxià ma?"},
 {who:"店員",zh:"不好意思，還在做，請再等一下。",py:"Bùhǎoyìsi, hái zài zuò, qǐng zài děng yíxià."},
 {who:"學生",zh:"好，謝謝。",py:"Hǎo, xièxie."}]},
{t:"情境挑戰卡",kind:"table",head:["情境","學生任務"],rows:[
 ["豆漿賣完了","改點其他飲料。"],
 ["訂單聽錯","店員把冰奶茶聽成冰紅茶，學生在確認時更正。"],
 ["等候十五分鐘","決定等待或取消其中一項餐點。"],
 ["不能刷卡","改用現金付款。"],
 ["少了一份餐點","說明少了什麼，請店員協助。"],
 ["不吃小黃瓜","點餐時先說明；若仍拿到，向店員反映。"],
 ["聽不懂「冰熱？」","請店員再說一次，或確認是不是在問飲料溫度。"]]},
{t:"最後任務",kind:"taskcard",items:[
 "點三樣餐點或飲料。","至少提出兩項客製需求。","聽懂三個快速省略問句。",
 "確認店員複述的訂單。","處理一個售完、等候、付款或漏餐問題。","至少使用一次補救溝通句。"]}
]}
]}
];
