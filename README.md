

## ⚠️ 漢字遊戲（字族工坊）備註

1. 漢字遊戲的程式「不在」這個檔案裡，全部在 hanzi.html、hanzi-game.js、hanzi-data.js、hanzi-teacher.js、hanzi-student.js。
2. 它是靠 db.js 最後面的「HANZI_LOADER」那一段，自動接到老師後台（teacher.html）和學生頁（student.html）。
3. 所以：不要在 teacher.html／teacher-app.js／student.html 裡加漢字遊戲的程式；也不要刪 db.js 的 HANZI_LOADER、根目錄的 check-hanzi.js、vercel.json 的 buildCommand。
4. 每次修改前先從 GitHub 下載「最新」的檔案再改，不要拿電腦裡或別的對話裡的舊檔案上傳（舊檔案會把別人改過的東西蓋掉）。
5. 上傳後如果 GitHub 出現紅色 ✕，代表漢字遊戲需要的東西被弄掉了，網站會維持上一版，點進去看說明再補回來。
