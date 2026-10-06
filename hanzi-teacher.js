/* HZTB_V1415 學生進度表在手機上：八欄一次只看得到兩欄。
   表格 720px、手機框 331px，雖然外面有 overflow-x:auto 滑得動，
   但沒有任何提示說可以往右滑。表格又沒辦法像關卡列那樣折行，
   所以 820px 以下把每一列攤成一張卡片：表頭藏起來，欄位名用
   td::before 從 data-l 印在值前面。樣式寫在這支檔案自己注入的
   #hz-css 裡，不去碰 teacher.html／teacher-app.js（見上面第 3 條）。 */
/* ══════ 漢字遊戲・老師後台外掛（hanzi-teacher.js）══════
   這支檔案自己把漢字遊戲接到老師後台上：側欄／頂部選單的按鈕、漢字遊戲那一頁、
   「待交作業」裡的漢字遊戲作業。teacher.html 和 teacher-app.js 裡完全不用寫任何漢字遊戲的程式，
   所以不管後台怎麼改、用哪一份舊檔案覆蓋，漢字遊戲都不會不見。
   由 db.js 最後面的 HANZI_LOADER 自動載入（只在 teacher.html）。
   這支檔案由漢字遊戲的產生器輸出，關卡清單也在裡面；要改請找漢字遊戲的原始檔。 */
var HZ_STAGE_LIST = [{"lv":"精選字族","stages":[["青","青",7],["艮","艮",7],["寺","寺",6],["包","包",4],["反","反",3],["方","方",4],["官","官",2],["交","交",4],["古","古",7],["己","己",4],["果／頁","果／頁",4],["隹","隹",3],["音（多層）","音（多層）",5],["相（多層）","相（多層）",3],["買（多層）","買（多層）",4],["每","每",4],["門","門",5],["射","射",2],["僉","僉",6],["戔","戔",4],["余","余",3],["兆","兆",4],["非","非",4],["者","者",5],["采","采",3],["至（多層）","至（多層）",5],["形近字","形近字",7]]},{"lv":"準備一級","stages":[["L0-01","門 家族",3],["L0-02","口 口字旁 1",5],["L0-03","口 口字旁 2",4],["L0-04","亻 單人旁",8],["L0-05","女 女字旁",7],["L0-06","日 日字旁",7],["L0-07","言 言字旁",6],["L0-08","宀 寶蓋頭",5],["L0-09","木 木字旁",5],["L0-10","辶 辵字旁",4],["L0-11","⺮ 竹字頭",3],["L0-12","心 心字底",3],["L0-13","土 土字旁",3],["L0-14","囗 國字框",3],["L0-15","氵 三點水",3],["L0-16","綜合 1",7],["L0-17","綜合 2",7],["L0-18","綜合 3",7],["L0-19","綜合 4",7],["L0-20","綜合 5",7],["L0-21","綜合 6",7]]},{"lv":"準備二級","stages":[["L1-01","工 家族",4],["L1-02","口 口字旁",8],["L1-03","艹 草字頭",7],["L1-04","亻 單人旁",6],["L1-05","辶 辵字旁",5],["L1-06","言 言字旁",5],["L1-07","飠 食字旁",5],["L1-08","目 目字旁",4],["L1-09","月 月字旁",4],["L1-10","忄 豎心旁",4],["L1-11","木 木字旁",4],["L1-12","田 田字旁",4],["L1-13","广 廣字頭",3],["L1-14","⻊ 足字旁",3],["L1-15","疒 病字頭",3],["L1-16","心 心字底",3],["L1-17","氵 三點水",3],["L1-18","宀 寶蓋頭",3],["L1-19","綜合 1",7],["L1-20","綜合 2",7],["L1-21","綜合 3",7],["L1-22","綜合 4",7],["L1-23","綜合 5",7],["L1-24","綜合 6",6],["L1-25","綜合 7",6],["L1-26","綜合 8",6],["L1-27","綜合 9",6],["L1-28","綜合 10",6]]},{"lv":"入門級","stages":[["L2-01","林 家族",3],["L2-02","氵 三點水 1",6],["L2-03","氵 三點水 2",6],["L2-04","氵 三點水 3",5],["L2-05","糹 絞絲旁",8],["L2-06","口 口字旁",7],["L2-07","扌 提手旁",7],["L2-08","⺮ 竹字頭",6],["L2-09","言 言字旁",6],["L2-10","亻 單人旁",6],["L2-11","木 木字旁",5],["L2-12","土 土字旁",5],["L2-13","广 廣字頭",4],["L2-14","阝 耳朵旁",4],["L2-15","宀 寶蓋頭",4],["L2-16","衤 衣字旁",4],["L2-17","車 車字旁",3],["L2-18","彳 雙人旁",3],["L2-19","耳 耳字旁",3],["L2-20","月 月字旁",3],["L2-21","艹 草字頭",3],["L2-22","攵 反文旁",3],["L2-23","忄 豎心旁",3],["L2-24","禾 禾木旁",3],["L2-25","力 力",3],["L2-26","女 女字旁",3],["L2-27","雨 雨字頭",3],["L2-28","日 日字旁",3],["L2-29","火 火字旁",3],["L2-30","⻊ 足字旁",3],["L2-31","辶 辵字旁",3],["L2-32","金 金字旁",3],["L2-33","隹 隹",3],["L2-34","綜合 1",7],["L2-35","綜合 2",7],["L2-36","綜合 3",7],["L2-37","綜合 4",7],["L2-38","綜合 5",7],["L2-39","綜合 6",7],["L2-40","綜合 7",7],["L2-41","綜合 8",6],["L2-42","綜合 9",6],["L2-43","綜合 10",6]]},{"lv":"基礎級","stages":[["L3-01","氵 三點水 1",6],["L3-02","氵 三點水 2",6],["L3-03","氵 三點水 3",5],["L3-04","扌 提手旁 1",8],["L3-05","扌 提手旁 2",7],["L3-06","亻 單人旁 1",6],["L3-07","亻 單人旁 2",5],["L3-08","木 木字旁 1",6],["L3-09","木 木字旁 2",5],["L3-10","口 口字旁 1",5],["L3-11","口 口字旁 2",4],["L3-12","辶 辵字旁 1",5],["L3-13","辶 辵字旁 2",4],["L3-14","言 言字旁 1",5],["L3-15","言 言字旁 2",4],["L3-16","阝 耳朵旁",7],["L3-17","糹 絞絲旁",4],["L3-18","攵 反文旁",4],["L3-19","女 女字旁",4],["L3-20","⺮ 竹字頭",4],["L3-21","月 月字旁",4],["L3-22","土 土字旁",4],["L3-23","礻 示字旁",4],["L3-24","王 王字旁",4],["L3-25","艹 草字頭",4],["L3-26","尸 尸字頭",3],["L3-27","禾 禾木旁",3],["L3-28","彳 雙人旁",3],["L3-29","火 火字旁",3],["L3-30","日 日字旁",3],["L3-31","貝 貝字底",3],["L3-32","走 走字旁",3],["L3-33","宀 寶蓋頭",3],["L3-34","綜合 1",7],["L3-35","綜合 2",7],["L3-36","綜合 3",7],["L3-37","綜合 4",7],["L3-38","綜合 5",7],["L3-39","綜合 6",7],["L3-40","綜合 7",7],["L3-41","綜合 8",7],["L3-42","綜合 9",7],["L3-43","綜合 10",6]]},{"lv":"進階級","stages":[["L4-01","直 家族",4],["L4-02","艮 家族",4],["L4-03","乃 家族",4],["L4-04","巨 家族",3],["L4-05","交 家族",3],["L4-06","扌 提手旁 1",8],["L4-07","扌 提手旁 2",8],["L4-08","扌 提手旁 3",8],["L4-09","扌 提手旁 4",8],["L4-10","亻 單人旁 1",6],["L4-11","亻 單人旁 2",6],["L4-12","亻 單人旁 3",6],["L4-13","言 言字旁 1",6],["L4-14","言 言字旁 2",6],["L4-15","言 言字旁 3",5],["L4-16","口 口字旁 1",8],["L4-17","口 口字旁 2",7],["L4-18","氵 三點水 1",7],["L4-19","氵 三點水 2",6],["L4-20","貝 貝字底 1",6],["L4-21","貝 貝字底 2",5],["L4-22","土 土字旁 1",5],["L4-23","土 土字旁 2",5],["L4-24","木 木字旁 1",5],["L4-25","木 木字旁 2",4],["L4-26","辶 辵字旁 1",5],["L4-27","辶 辵字旁 2",4],["L4-28","糹 絞絲旁 1",5],["L4-29","糹 絞絲旁 2",4],["L4-30","心 心字底 1",5],["L4-31","心 心字底 2",4],["L4-32","阝 耳朵旁",7],["L4-33","宀 寶蓋頭",6],["L4-34","頁 頁字旁",6],["L4-35","酉 酉字旁",6],["L4-36","禾 禾木旁",5],["L4-37","忄 豎心旁",5],["L4-38","月 月字旁",4],["L4-39","刂 立刀旁",4],["L4-40","犭 反犬旁",4],["L4-41","衤 衣字旁",4],["L4-42","石 石字旁",4],["L4-43","日 日字旁",4],["L4-44","王 王字旁",3],["L4-45","女 女字旁",3],["L4-46","彳 雙人旁",3],["L4-47","馬 馬字旁",3],["L4-48","目 目字旁",3],["L4-49","礻 示字旁",3],["L4-50","車 車字旁",3],["L4-51","灬 四點火",3],["L4-52","艹 草字頭",3],["L4-53","金 金字旁",3],["L4-54","广 廣字頭",3],["L4-55","虫 虫字旁",3],["L4-56","綜合 1",7],["L4-57","綜合 2",7],["L4-58","綜合 3",7],["L4-59","綜合 4",7],["L4-60","綜合 5",7],["L4-61","綜合 6",7],["L4-62","綜合 7",7],["L4-63","綜合 8",7],["L4-64","綜合 9",6],["L4-65","綜合 10",6],["L4-66","綜合 11",6],["L4-67","綜合 12",6],["L4-68","綜合 13",6],["L4-69","綜合 14",6]]},{"lv":"高階級","stages":[["L5-01","分 家族",6],["L5-02","皮 家族",6],["L5-03","少 家族",5],["L5-04","甫 家族",4],["L5-05","門 家族",4],["L5-06","肖 家族",4],["L5-07","發 家族",3],["L5-08","闌 家族",3],["L5-09","𢦏 家族",3],["L5-10","東 家族",3],["L5-11","支 家族",3],["L5-12","同 家族",3],["L5-13","夆 家族",3],["L5-14","每 家族",3],["L5-15","堯 家族",3],["L5-16","卷 家族",3],["L5-17","包 家族",3],["L5-18","羊 家族",3],["L5-19","匋 家族",3],["L5-20","扌 提手旁 1",7],["L5-21","扌 提手旁 2",7],["L5-22","扌 提手旁 3",7],["L5-23","扌 提手旁 4",7],["L5-24","扌 提手旁 5",7],["L5-25","扌 提手旁 6",6],["L5-26","氵 三點水 1",7],["L5-27","氵 三點水 2",7],["L5-28","氵 三點水 3",7],["L5-29","氵 三點水 4",7],["L5-30","亻 單人旁 1",8],["L5-31","亻 單人旁 2",8],["L5-32","亻 單人旁 3",7],["L5-33","口 口字旁 1",8],["L5-34","口 口字旁 2",8],["L5-35","口 口字旁 3",6],["L5-36","月 月字旁 1",6],["L5-37","月 月字旁 2",6],["L5-38","月 月字旁 3",5],["L5-39","木 木字旁 1",6],["L5-40","木 木字旁 2",6],["L5-41","木 木字旁 3",5],["L5-42","辶 辵字旁 1",7],["L5-43","辶 辵字旁 2",6],["L5-44","女 女字旁 1",6],["L5-45","女 女字旁 2",6],["L5-46","心 心字底 1",6],["L5-47","心 心字底 2",5],["L5-48","糹 絞絲旁 1",5],["L5-49","糹 絞絲旁 2",5],["L5-50","忄 豎心旁 1",5],["L5-51","忄 豎心旁 2",5],["L5-52","艹 草字頭 1",5],["L5-53","艹 草字頭 2",4],["L5-54","金 金字旁 1",5],["L5-55","金 金字旁 2",4],["L5-56","言 言字旁",8],["L5-57","石 石字旁",8],["L5-58","⻊ 足字旁",8],["L5-59","貝 貝字底",8],["L5-60","宀 寶蓋頭",7],["L5-61","火 火字旁",7],["L5-62","禾 禾木旁",7],["L5-63","土 土字旁",7],["L5-64","疒 病字頭",6],["L5-65","米 米字旁",6],["L5-66","目 目字旁",6],["L5-67","犭 反犬旁",6],["L5-68","虫 虫字旁",5],["L5-69","⺮ 竹字頭",5],["L5-70","力 力",5],["L5-71","日 日字旁",5],["L5-72","尸 尸字頭",5],["L5-73","巾 巾字旁",4],["L5-74","阝 耳朵旁",4],["L5-75","大 大",4],["L5-76","隹 隹",4],["L5-77","刂 立刀旁",3],["L5-78","罒 四字頭",3],["L5-79","山 山字旁",3],["L5-80","弓 弓字旁",3],["L5-81","广 廣字頭",3],["L5-82","糸 絞絲底",3],["L5-83","馬 馬字旁",3],["L5-84","衣 衣",3],["L5-85","王 王字旁",3],["L5-86","彳 雙人旁",3],["L5-87","匚 匚",3],["L5-88","綜合 1",7],["L5-89","綜合 2",7],["L5-90","綜合 3",7],["L5-91","綜合 4",7],["L5-92","綜合 5",7],["L5-93","綜合 6",7],["L5-94","綜合 7",7],["L5-95","綜合 8",7],["L5-96","綜合 9",7],["L5-97","綜合 10",7],["L5-98","綜合 11",7],["L5-99","綜合 12",6]]},{"lv":"流利級","stages":[["L6-01","者 家族",5],["L6-02","方 家族",4],["L6-03","戔 家族",4],["L6-04","各 家族",4],["L6-05","易 家族",4],["L6-06","襄 家族",4],["L6-07","俞 家族",3],["L6-08","敝 家族",3],["L6-09","尃 家族",3],["L6-10","從 家族",3],["L6-11","羊 家族",3],["L6-12","古 家族",3],["L6-13","公 家族",3],["L6-14","合 家族",3],["L6-15","文 家族",3],["L6-16","羅 家族",3],["L6-17","肖 家族",3],["L6-18","堯 家族",3],["L6-19","亶 家族",3],["L6-20","由 家族",3],["L6-21","氵 三點水 1",8],["L6-22","氵 三點水 2",8],["L6-23","氵 三點水 3",8],["L6-24","氵 三點水 4",8],["L6-25","氵 三點水 5",7],["L6-26","扌 提手旁 1",7],["L6-27","扌 提手旁 2",7],["L6-28","扌 提手旁 3",7],["L6-29","扌 提手旁 4",5],["L6-30","口 口字旁 1",8],["L6-31","口 口字旁 2",8],["L6-32","口 口字旁 3",6],["L6-33","亻 單人旁 1",7],["L6-34","亻 單人旁 2",7],["L6-35","亻 單人旁 3",7],["L6-36","艹 草字頭 1",6],["L6-37","艹 草字頭 2",6],["L6-38","艹 草字頭 3",6],["L6-39","木 木字旁 1",6],["L6-40","木 木字旁 2",6],["L6-41","木 木字旁 3",5],["L6-42","忄 豎心旁 1",8],["L6-43","忄 豎心旁 2",7],["L6-44","言 言字旁 1",7],["L6-45","言 言字旁 2",7],["L6-46","金 金字旁 1",6],["L6-47","金 金字旁 2",6],["L6-48","辶 辵字旁 1",5],["L6-49","辶 辵字旁 2",5],["L6-50","糹 絞絲旁 1",5],["L6-51","糹 絞絲旁 2",5],["L6-52","土 土字旁 1",5],["L6-53","土 土字旁 2",4],["L6-54","貝 貝字底 1",5],["L6-55","貝 貝字底 2",4],["L6-56","心 心字底",8],["L6-57","疒 病字頭",8],["L6-58","日 日字旁",7],["L6-59","犭 反犬旁",7],["L6-60","山 山字旁",7],["L6-61","火 火字旁",7],["L6-62","⺮ 竹字頭",6],["L6-63","馬 馬字旁",6],["L6-64","酉 酉字旁",6],["L6-65","刂 立刀旁",6],["L6-66","虫 虫字旁",5],["L6-67","广 廣字頭",5],["L6-68","月 月字旁",5],["L6-69","攵 反文旁",5],["L6-70","車 車字旁",4],["L6-71","力 力",4],["L6-72","阝 耳朵旁",4],["L6-73","石 石字旁",4],["L6-74","目 目字旁",4],["L6-75","女 女字旁",4],["L6-76","飠 食字旁",4],["L6-77","宀 寶蓋頭",4],["L6-78","手 手",3],["L6-79","禾 禾木旁",3],["L6-80","頁 頁字旁",3],["L6-81","衣 衣",3],["L6-82","大 大",3],["L6-83","尸 尸字頭",3],["L6-84","辰 辰",3],["L6-85","綜合 1",7],["L6-86","綜合 2",7],["L6-87","綜合 3",7],["L6-88","綜合 4",7],["L6-89","綜合 5",7],["L6-90","綜合 6",7],["L6-91","綜合 7",7],["L6-92","綜合 8",7],["L6-93","綜合 9",7],["L6-94","綜合 10",7],["L6-95","綜合 11",6],["L6-96","綜合 12",6],["L6-97","綜合 13",6]]}];
(function(){
'use strict';
if (window.__HZ_TEACHER__) return; window.__HZ_TEACHER__ = true;
/* 如果有人用舊檔案把舊的漢字遊戲程式放回 teacher-app.js，這支外掛還是會蓋過去，用新版的畫面和功能 */
/* ══════ HANZI_V1 漢字遊戲（字族工坊 hanzi.html） ══════
   作業存在 lessons（kind:'hanzitask'，指派名單 assigned_ids + read_uids）。
   學生的遊戲紀錄存在 results（kind:'hanzi'，lesson_id:'__hanzi__'，一位學生一筆）。
   完成條件：學生在指定難度、指定關卡拿到的星星 ≥ 作業要求的星星。 */
const HZ_CUR=['青','艮','寺','包','反','方','官','交','古','己','果／頁','隹','音（多層）','相（多層）','買（多層）','每','門','射','僉','戔','余','兆','非','者','采','至（多層）','形近字'];
/* HANZI_V3 關卡清單在 hanzi-stages.js（精選字族＋華語八千詞七個等級，約 430 關）。檔案沒載入時退回精選字族。 */
const HZ_LIST=(window.HZ_STAGE_LIST&&window.HZ_STAGE_LIST.length)?window.HZ_STAGE_LIST:[{lv:'精選字族',stages:HZ_CUR.map(n=>[n,n,0])}];
const HZ_NAME={};HZ_LIST.forEach(L=>L.stages.forEach(s=>{HZ_NAME[s[0]]=(L.lv==='精選字族'?'':L.lv.replace('級','')+'・')+s[1];}));
const HZ_STAGES=Object.keys(HZ_NAME);
const HZ_DIFF={easy:'入門',normal:'進階',hard:'高手'};
function hzDocOf(s){if(!s)return null;return (S.hanzis||[]).find(r=>r&&((s.uid&&r.uid===s.uid)||r.student_id===s.id))||null;}
function hzStars(s,diff,fam){const d=hzDocOf(s);const st=d&&d.rec&&d.rec.stars&&d.rec.stars[diff];return (st&&Number(st[fam]))||0;}
function hzDone(t,s){return hzStars(s,t.diff,t.fam)>=(Number(t.min_stars)||1);}
function hzLive(s){return s&&!s.deleted_at&&!s.is_test&&enrollOf(s)!=='paused';}
function hzWhen(iso){if(!iso)return '—';const d=new Date(iso);if(isNaN(d))return '—';return (d.getMonth()+1)+'/'+d.getDate()+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');}
const HZ_LV=[[0,'漢字學徒'],[300,'拼字工匠'],[1000,'字族達人'],[2500,'字源學者'],[5000,'漢字大師']];
function hzLevel(xp){let i=0;HZ_LV.forEach((l,k)=>{if((xp||0)>=l[0])i=k;});return (i+1)+'・'+HZ_LV[i][1];}
/* 課本：平台上有生詞的課，也可以指派成漢字作業（關卡 id 是 'L:' + 課的 id） */
function hzVocabChars(l){const ds=(Array.isArray(l.dialogues)&&l.dialogues.length)?l.dialogues:[{vocabulary:l.vocabulary||''}];const seen=new Set();
  ds.forEach(d=>String(d.vocabulary||'').split('\n').forEach(raw=>{const t=raw.trim();if(!t||/^[-－・·→*]|^例[:：]/.test(t))return;
    const f=t.split(/[｜|\s\[【（(=＝:：]/)[0];[...f].forEach(c=>{if(/[\u3400-\u9FFF]/.test(c))seen.add(c);});}));return seen.size;}
function hzSyncCourse(){
  const ls=(S.rawLessons||S.lessons||[]).filter(l=>l&&!l.kind&&!l.deleted_at).map(l=>({l,n:hzVocabChars(l)})).filter(x=>x.n)
    .sort((a,b)=>String(a.l.textbook||'').localeCompare(String(b.l.textbook||''))||((a.l.order_index||0)-(b.l.order_index||0)));
  const lab=l=>((l.textbook||'').trim()?(l.textbook.trim()+'・'):'')+((l.title||'').trim()||('第'+(l.order_index||'')+'課'));
  const g={lv:'課本（平台上的課，練這一課生詞裡的字）',course:true,stages:ls.map(x=>['L:'+x.l.id,lab(x.l),x.n])};
  if(HZ_LIST[0]&&HZ_LIST[0].course)HZ_LIST[0]=g;else if(g.stages.length)HZ_LIST.unshift(g);
  g.stages.forEach(s=>{HZ_NAME[s[0]]='課本・'+s[1];if(HZ_STAGES.indexOf(s[0])<0)HZ_STAGES.push(s[0]);});
}
function renderHanzi(){
  const body=$('#panel-hanzi');if(!body)return;
  try{hzSyncCourse();}catch(e){}
  const tasks=(S.hanziTasks||[]).slice().sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
  const chip=(t,s)=>{/* HANZI_V3 */
    const got=hzStars(s,t.diff,t.fam);
    if(hzDone(t,s))return '<span class="badge" style="background:#E1F0E8;color:#1F6A54">✓ '+snm(s.name)+' '+'★'.repeat(got)+'</span>';
    const dd=hwDaysTo(t.due_date);
    if(dd!=null&&dd<0)return '<span class="badge badge-overdue">'+snm(s.name)+' 逾期 '+(-dd)+' 天</span>';
    return '<span class="badge'+(dd!=null&&dd<=2?' badge-soon':'')+'">'+snm(s.name)+(got?(' 目前 '+'★'.repeat(got)):' 還沒完成')+'</span>';};
  const taskHtml=tasks.length?tasks.map(t=>{
    const who=lessonTargets(t).filter(hzLive);
    const done=who.filter(s=>hzDone(t,s)).length;
    return '<div class="dash-row" style="flex-wrap:wrap;align-items:flex-start">'
      +'<b>'+esc(t.title||((HZ_NAME[t.fam]||t.fam)+'・'+(HZ_DIFF[t.diff]||'')))+'</b>'
      +'<span class="tag">'+esc(HZ_NAME[t.fam]||t.fam)+'・'+esc(HZ_DIFF[t.diff]||'')+'・至少 '+(Number(t.min_stars)||1)+' 星</span>'
      +'<span class="muted" style="font-size:12px">'+(t.due_date?('截止 '+esc(t.due_date)):'沒有截止日')+'</span>'
      +'<span class="grow"></span><span class="muted" style="font-size:13px">完成 '+done+'／'+who.length+'</span>'
      +'<button class="btn btn-sm btn-ghost" data-act="hzDel" data-id="'+esc(t.id)+'">刪除</button>'
      +'<div style="flex-basis:100%;margin-top:6px;display:flex;flex-wrap:wrap;gap:6px">'+(who.map(s=>chip(t,s)).join('')||'<span class="muted">這份作業沒有指派給在學中的學生</span>')+'</div></div>';}).join('')
    :'<div class="muted" style="padding:8px 2px">還沒有指派漢字遊戲作業。按右上角「＋ 指派作業」開始。</div>';
  const stus=(S.students||[]).filter(hzLive).slice().sort((a,b)=>{const x=hzDocOf(a),y=hzDocOf(b);return String((y&&y.updated_at)||'').localeCompare(String((x&&x.updated_at)||''))||stuNameCmp(a,b);});
  const rows=stus.map(s=>{const d=hzDocOf(s);const r=(d&&d.rec)||null;
    /* HZTB_V1415 每個 td 補 data-l（欄位名）。手機上表頭會藏起來，
       改用 td::before 把欄位名印在值前面——八欄才不會只看得到兩欄。 */
    if(!r)return '<tr><td data-l="學生">'+snm(s.name)+'</td><td colspan="7" class="muted" data-l="進度">還沒玩過</td></tr>';
    const sm=k=>Object.values((r.stars&&r.stars[k])||{}).reduce((a,b)=>a+(Number(b)||0),0);
    const rc=r.recall||{};const rate=rc.done?(Math.round(rc.ok/rc.done*100)+'%（'+rc.done+' 題）'):'—';
    const wr=Object.entries(r.wrong||{}).sort((a,b)=>b[1]-a[1]);
    const hard=(wr.length?wr.slice(0,8).map(x=>x[0]+(x[1]>1?'<sub style="font-size:11px;color:#B4364A">×'+x[1]+'</sub>':'')):Object.entries(r.hard||{}).sort((a,b)=>((b[1]&&b[1].miss)||0)-((a[1]&&a[1].miss)||0)).slice(0,6).map(x=>x[0])).join(' ');
    const today=new Date().toISOString().slice(0,10);const rv=Object.values(r.review||{});const rvDue=rv.filter(x=>x&&x.due<=today).length;
    const learned=Object.values(r.course||{}).reduce((a,c)=>a+Object.keys((c&&c.m)||{}).length,0);
    return '<tr><td data-l="學生">'+snm(s.name)+'</td><td data-l="最近玩">'+hzWhen(d.updated_at)+'</td><td data-l="等級">'+hzLevel(r.xp)+'<br><span class="muted" style="font-size:12px">'+(r.xp||0)+' XP</span></td>'
      +'<td data-l="課本學會">'+learned+' 個</td><td data-l="待複習">'+(rv.length?(rv.length+' 個'+(rvDue?'<br><span class="badge badge-soon">今天 '+rvDue+'</span>':'')):'—')+'</td>'
      +'<td data-l="闖關星星">'+sm('easy')+'／'+sm('normal')+'／'+sm('hard')+'</td><td data-l="回想關正確率">'+rate+'</td>'
      +'<td data-l="最常錯的字" style="font-size:20px;letter-spacing:2px">'+(hard||'—')+'</td></tr>';}).join('');
  body.innerHTML='<div class="section-head"><h2>🀄 漢字遊戲（字族工坊）</h2><span class="sub">指派關卡給學生，看每個人的漢字進度</span>'
    +'<span class="grow"></span><a class="btn btn-sm" href="hanzi.html" target="_blank" rel="noopener">開啟遊戲試玩 ↗</a>'
    +'<button class="btn btn-sm btn-accent" data-act="hzNew">＋ 指派作業</button></div>'
    +'<div class="card"><h3 style="margin:0 0 8px">作業</h3><div class="hint" style="margin-bottom:8px">綠色＝已完成；紅色＝已經過了截止日還沒完成。學生在學生頁的「待辦」也會看到這些作業。</div>'+taskHtml+'</div>'
    +'<div class="card" style="margin-top:14px"><h3 style="margin:0 0 8px">學生進度</h3><div class="hint" style="margin-bottom:8px">課本學會＝在「課本」練習裡寫對也用對的字。待複習＝寫錯或選錯、排了 1／3／7／15 天複習的字。最常錯的字：右下角的 ×2 是錯了幾次，上課可以先帶這些字。</div>'
    +'<div style="overflow-x:auto"><table class="hz-tb" style="min-width:720px;width:100%"><thead><tr><th>學生</th><th>最近玩</th><th>等級</th><th>課本學會</th><th>待複習</th><th>闖關星星</th><th>回想關正確率</th><th>最常錯的字</th></tr></thead><tbody>'
    +(rows||'<tr><td colspan="8" class="muted">還沒有學生</td></tr>')+'</tbody></table></div></div>';
}
H.hzNew=()=>{
  const live=(S.students||[]).filter(s=>s&&!s.deleted_at&&!s.is_test);
  const rank=(x)=>{const e=enrollOf(x);return e==='active'?0:(e==='trial'?1:(e==='reserved'?2:3));};
  const checks=live.slice().sort((a,b)=>rank(a)-rank(b)||stuNameCmp(a,b)).map(s=>{const on=enrollOf(s)==='active';
    return '<label class="qzw-s"><input type="checkbox" class="hz-stu" value="'+esc(s.id)+'"'+(on?' checked':'')+'><span>'+snm(s.name)+'</span>'
      +(on?'':'<i>（'+({trial:'試學',reserved:'預約',paused:'休學'}[enrollOf(s)]||'')+'）</i>')+'</label>';}).join('');
  const d=new Date();d.setDate(d.getDate()+7);
  const def=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  openModal('<div class="modal" style="max-width:640px"><div class="modal-head"><h3>🀄 指派漢字遊戲作業</h3><button class="x" data-act="closeModal">×</button></div>'
   +'<div class="modal-body"><div class="form-grid">'
   +'<div class="field"><label>關卡</label><input id="hz-fam-q" type="search" placeholder="先搜尋：打課本名、課名或關卡名（例如「時代華語一」「第三課」「門」）" style="width:100%;margin-bottom:6px"><select id="hz-fam">'+HZ_LIST.map(L=>'<optgroup label="'+esc(L.lv)+'">'+L.stages.map((s,i)=>'<option value="'+esc(s[0])+'">'+(i+1)+'・'+esc(s[1])+(s[2]?'（'+s[2]+' 字）':'')+'</option>').join('')+'</optgroup>').join('')+'</select></div>'
   +'<div class="field"><label>難度</label><select id="hz-diff"><option value="easy">入門（有拼音提示）</option><option value="normal" selected>進階（只給詞）</option><option value="hard">高手（只給詞、限時）</option></select></div>'
   +'<div class="field"><label>至少要拿幾顆星</label><select id="hz-min"><option value="1">1 顆（過關就好）</option><option value="2" selected>2 顆</option><option value="3">3 顆（不能拼錯、不能用提示）</option></select><div class="hint" style="margin-top:4px">選「課本」的課時：1 顆＝這一課的字學會三成，2 顆＝六成，3 顆＝九成（寫對也用對才算學會）。難度只影響第一步「拼」。</div></div>'
   +'<div class="field"><label>截止日</label><input id="hz-due" type="date" value="'+def+'" min="2000-01-01" max="2100-12-31"></div>'
   +'<div class="field full"><label>作業名稱 <span class="hint">可以不填，會自動用「關卡・難度」</span></label><input id="hz-title" placeholder="例如：這週練艮家族"></div></div>'
   +'<div class="field full"><label>指派給誰</label>'
   +'<div style="display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap"><button class="btn btn-sm" type="button" data-act="hzStuAll">✔ 全選</button><button class="btn btn-sm" type="button" data-act="hzStuNone">✕ 全部取消</button></div>'
   +'<div class="qzw-stus">'+(checks||'<span class="muted">還沒有學生</span>')+'</div></div></div>'
   +'<div class="modal-foot"><button class="btn btn-ghost" data-act="closeModal">取消</button><span style="flex:1"></span>'
   +'<button class="btn btn-primary" data-act="hzSave">📤 指派出去</button></div></div>');};
H.hzStuAll=()=>{document.querySelectorAll('.hz-stu').forEach(c=>{c.checked=true;});};
H.hzStuNone=()=>{document.querySelectorAll('.hz-stu').forEach(c=>{c.checked=false;});};
H.hzSave=async()=>{
  const ids=[].slice.call(document.querySelectorAll('.hz-stu:checked')).map(c=>c.value);
  if(!ids.length)return toast('請至少選一位學生');
  const _v=(id)=>{const e=document.getElementById(id);return e?String(e.value||'').trim():'';};
  const fam=_v('hz-fam'),diff=_v('hz-diff')||'normal',min=Number(_v('hz-min'))||1,due=_v('hz-due');
  if(HZ_STAGES.indexOf(fam)<0)return toast('請選一個關卡');
  const title=_v('hz-title')||((HZ_NAME[fam]||fam)+'・'+HZ_DIFF[diff]+'・'+min+' 星');
  const btn=document.querySelector('[data-act="hzSave"]');if(btn){btn.disabled=true;btn.textContent='指派中…';}
  try{await ensureAuthFresh();
    const row={kind:'hanzitask',title:title,fam:fam,diff:diff,min_stars:min,due_date:due,assigned_ids:ids,created_at:new Date().toISOString()};
    row.read_uids=ruCalc(row);
    await DB.insert('lessons',row);
    await loadAll();closeModal();render();toast('已指派給 '+ids.length+' 位學生'+(due?('，截止 '+due):''));
  }catch(e){if(btn){btn.disabled=false;btn.textContent='📤 指派出去';}toast('指派失敗：'+((e&&e.message)||e));}};
H.hzDel=async(id)=>{const t=(S.hanziTasks||[]).find(x=>x.id===id);if(!t)return;
  const b=document.querySelector('[data-act="hzDel"][data-id="'+id+'"]');
  if(b&&!b.dataset.sure){b.dataset.sure='1';b.textContent='再按一次確定刪除';b.classList.add('btn-danger');setTimeout(()=>{if(b){delete b.dataset.sure;b.textContent='刪除';b.classList.remove('btn-danger');}},4000);return;}
  try{await ensureAuthFresh();await DB.update('lessons',id,{deleted_at:new Date().toISOString()});await loadAll();render();toast('已刪除這份作業');}
  catch(e){toast('刪除失敗：'+((e&&e.message)||e));}};
/* ══════ HANZI_V1 end ══════ */

/* 指派作業的關卡清單很長：上面的搜尋框可以縮小範圍 */
document.addEventListener('input',e=>{if(!e.target||e.target.id!=='hz-fam-q')return;const kw=e.target.value.trim();const sel=document.getElementById('hz-fam');if(!sel)return;let first=null;
  sel.querySelectorAll('optgroup').forEach(g=>{let any=false;g.querySelectorAll('option').forEach(o=>{const ok=!kw||o.textContent.includes(kw)||g.label.includes(kw);o.hidden=!ok;o.disabled=!ok;if(ok){any=true;if(!first)first=o;}});g.hidden=!any;});
  if(first&&sel.selectedOptions[0]&&sel.selectedOptions[0].hidden)sel.value=first.value;});
/* ---------- 接到後台上 ---------- */
function injectDom(){
  if (!document.getElementById('hz-css')){
    const st = document.createElement('style'); st.id = 'hz-css';
    st.textContent = ".hz-tb{border-collapse:collapse;font-size:14px}.hz-tb th{text-align:left;font-weight:500;color:var(--muted,#667);border-bottom:1px solid #dde3ea;padding:6px 8px;white-space:nowrap}.hz-tb td{border-bottom:1px solid #eef1f5;padding:8px;vertical-align:top}@media(max-width:820px){.hz-tb{min-width:0!important;width:100%!important;display:block}.hz-tb thead{display:none}.hz-tb tbody,.hz-tb tr,.hz-tb td{display:block;width:auto}.hz-tb tr{border:1px solid #E3E8EF;border-radius:10px;background:#fff;padding:9px 11px;margin-bottom:9px}.hz-tb td{border-bottom:0!important;padding:3px 0;display:flex;gap:10px;align-items:baseline}.hz-tb td::before{content:attr(data-l);flex:0 0 94px;color:var(--muted,#667);font-size:12.5px;font-weight:600}.hz-tb td:first-child{display:block;font-weight:700;font-size:15px;padding:0 0 7px;margin-bottom:5px;border-bottom:1px solid #E3E8EF!important}.hz-tb td:first-child::before{display:none}}"; document.head.appendChild(st);
  }
  if (!document.querySelector('.sidenav .tab[data-id="hanzi"]')){
    const after = document.querySelector('.sidenav .tab[data-id="lessons"]');
    if (after) after.insertAdjacentHTML('afterend', "<button class=\"tab\" data-act=\"tab\" data-id=\"hanzi\" data-group=\"students\" title=\"漢字遊戲\"><span class=\"e\"><svg class=\"nv-i\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect x=\"4\" y=\"4\" width=\"16\" height=\"16\" rx=\"2.5\"/><path d=\"M12 7v10M8 10h8M8.5 14.5h7\"/></svg></span><span class=\"lab\">漢字遊戲</span></button>");
  }
  if (!document.getElementById('panel-hanzi')){
    const give = document.getElementById('panel-give') || document.querySelector('section.panel');
    if (give) give.insertAdjacentHTML('afterend', '<section id="panel-hanzi" class="panel hide"></section>');
  }
  /* 頂部選單：還沒畫出來就改 TNAV，已經畫出來就直接插一顆 */
  try{
    const g = (typeof TNAV !== 'undefined') && TNAV.find(x => x && x.sub && x.sub.some(s => s[0] === 'lessons'));
    if (g && !g.sub.some(s => s[0] === 'hanzi')){
      const i = g.sub.findIndex(s => s[0] === 'lessons'); g.sub.splice(i + 1, 0, ['hanzi', '🀄 漢字遊戲', '']);
    }
  }catch(e){}
  const tn = document.querySelector('#tnav .tn-p button[data-id="lessons"]');
  if (tn && !document.querySelector('#tnav .tn-p button[data-id="hanzi"]'))
    tn.insertAdjacentHTML('afterend', '<button type="button" data-act="tab" data-id="hanzi">🀄 漢字遊戲<span class="tn-n" data-from=""></span></button>');
}
/* 資料：漢字作業從課程清單分出來、學生的遊戲紀錄從成績分出來 */
function splitHz(){
  const raw = (S.rawLessons && S.rawLessons.length) ? S.rawLessons : (S.lessons || []);
  S.hanziTasks = raw.filter(x => x && x.kind === 'hanzitask' && !x.deleted_at);
  S.lessons = (S.lessons || []).filter(x => !x || x.kind !== 'hanzitask');
  const rs = S.results || [];
  const mine = rs.filter(x => x && x.kind === 'hanzi');
  if (mine.length || !S.hanzis) S.hanzis = mine.length ? mine : (S.hanzis || []);
  S.results = rs.filter(x => !x || x.kind !== 'hanzi');
  try{
    if (typeof IS_OWNER !== 'undefined' && !IS_OWNER){
      const ids = new Set((S.students || []).map(s => s.id)), uids = new Set((S.students || []).map(s => s.uid).filter(Boolean));
      S.hanzis = S.hanzis.filter(r => ids.has(r.student_id) || (r.uid && uids.has(r.uid)));
    }
  }catch(e){}
}
const _split = window.splitResults;
if (typeof _split === 'function'){
  window.splitResults = function(d){ const r = _split.apply(this, arguments); try{ S.hanzis = (d || []).filter(x => x && x.kind === 'hanzi'); splitHz(); }catch(e){} return r; };
}
/* HZREG：後台「線上課 → 會員」每一位會員那一列，加上他玩漢字遊戲的情形 */
const HZ_XPLV = [[0, '漢字學徒'], [300, '拼字工匠'], [1000, '字族達人'], [2500, '字源學者'], [5000, '漢字大師']];
function hzMemBit(d){
  const r = d && d.rec;
  if (!r) return '<span class="mem-bit" style="color:var(--muted)">🀄 還沒玩過漢字遊戲</span>';
  let lv = 0; HZ_XPLV.forEach((x, i) => { if ((r.xp || 0) >= x[0]) lv = i; });
  const found = Object.keys(r.found || {}).length + Object.values(r.course || {}).reduce((a, c) => a + Object.keys((c && c.m) || {}).length, 0);
  const t = new Date(), today = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
  const due = Object.values(r.review || {}).filter(x => x && x.due && x.due <= today).length;
  const weak = Object.entries(r.wrong || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(x => x[0]).join('');
  const last = String(r.lastAt ? new Date(r.lastAt).toISOString() : (d.updated_at || '')).slice(0, 10);
  return '<span class="mem-bit">🀄 漢字遊戲 ' + esc(HZ_XPLV[lv][1]) + '・' + (r.xp || 0) + ' XP・會 ' + found + ' 字' + (due ? '・待複習 ' + due : '') + (weak ? '・常錯 ' + esc(weak) : '') + (last ? '・最後玩 ' + esc(last) : '') + '</span>';
}
const _memRow = window.memRowHtml;
if (typeof _memRow === 'function') window.memRowHtml = function(m){
  let h = _memRow.apply(this, arguments);
  try{ const d = (S.hanzis || []).find(x => x && m && m.uid && x.uid === m.uid); h = h.replace('</i></span><span class="oc-b">', hzMemBit(d) + '</i></span><span class="oc-b">'); }catch(e){}
  return h;
};
const _render = window.render;
if (typeof _render === 'function'){
  window.render = function(){
    try{ injectDom(); }catch(e){}
    try{ const hz = (S.lessons || []).filter(x => x && x.kind === 'hanzitask');
      if (hz.length){ S.hanziTasks = hz.filter(x => !x.deleted_at); S.lessons = S.lessons.filter(x => !x || x.kind !== 'hanzitask'); } }catch(e){}
    const r = _render.apply(this, arguments);
    try{ if (S.tab === 'hanzi'){ renderHanzi(); try{ navSibApply(); }catch(e){} } }catch(e){ console.error(e); }
    return r;
  };
}
const _hw = window.hwPending;
if (typeof _hw === 'function'){
  window.hwPending = function(){
    const out = _hw.apply(this, arguments);
    try{
      if (out.some(x => x && x.kind === '漢字遊戲')) return out;
      const live = s => s && !s.deleted_at && !s.is_test && enrollOf(s) !== 'paused';
      (S.hanziTasks || []).forEach(t => { if (!t || t.deleted_at) return;
        lessonTargets(t).filter(live).forEach(s => { if (hzDone(t, s)) return;
          out.push({sid:s.id, name:s.name || '', what:t.title || t.fam, lid:t.id, kind:'漢字遊戲', due:t.due_date || '', draft:hzStars(s, t.diff, t.fam) > 0, days:hwDaysTo(t.due_date || '')}); }); });
      out.sort((a, b) => {
        const ra = (a.days == null) ? 2 : (a.days < 0 ? 0 : 1), rb = (b.days == null) ? 2 : (b.days < 0 ? 0 : 1);
        if (ra !== rb) return ra - rb;
        if (a.days != null && b.days != null && a.days !== b.days) return a.days - b.days;
        return String(a.name).localeCompare(String(b.name)); });
    }catch(e){}
    return out;
  };
}
window.renderHanzi = renderHanzi;
try{ injectDom(); }catch(e){}
/* 如果後台已經先把資料載好、畫面也畫了，補做一次 */
try{ if ((S.students || []).length || (S.lessons || []).length){ splitHz(); render(); } }catch(e){}
})();
