

## ⚠️ 漢字遊戲（字族工坊）備註

1. 漢字遊戲的程式「不在」這個檔案裡，全部在 hanzi.html、hanzi-game.js、hanzi-data.js、hanzi-teacher.js、hanzi-student.js、hanzi-fuweng.js（大富翁）。
2. 它是靠 db.js 最後面的「HANZI_LOADER」那一段，自動接到老師後台（teacher.html）和學生頁（student.html）。
3. 所以：不要在 teacher.html／teacher-app.js／student.html 裡加漢字遊戲的程式；也不要刪 db.js 的 HANZI_LOADER、根目錄的 check-hanzi.js、vercel.json 的 buildCommand。
4. 每次修改前先從 GitHub 下載「最新」的檔案再改，不要拿電腦裡或別的對話裡的舊檔案上傳（舊檔案會把別人改過的東西蓋掉）。
5. 上傳後如果 GitHub 出現紅色 ✕，代表漢字遊戲需要的東西被弄掉了，網站會維持上一版，點進去看說明再補回來。
6. 漢字大富翁「各自用自己的裝置」連線玩，需要 Firestore 規則裡有下面這一段（放在 `match /databases/{database}/documents {` 裡面，跟 `match /results/{id}` 同一層）：

```
    // 漢字大富翁的連線房間（遊戲結束、開房的人離開就會刪掉）
    match /hz_rooms/{code} {
      allow read: if signedIn();
      allow create: if signedIn() && request.resource.data.host == request.auth.uid;
      allow update: if signedIn();
      allow delete: if teacher() || resource.data.host == request.auth.uid;
    }
```
