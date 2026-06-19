/* ============================================================
   設定檔  config.js
   ============================================================
   後端三選一（平台會自動偵測，優先 Firebase）：

   ① Firebase（推薦，與 QNA Homework 同一套）
      到 Firebase 主控台 → 專案設定 → 你的應用程式 → 複製「設定物件」
      貼到下面 FIREBASE_CONFIG（取得步驟見「部署與使用指南.md」）。

   ② Supabase：改填 SUPABASE_URL / SUPABASE_ANON_KEY。

   ③ 兩者皆留空 → 示範模式（資料只存在本機瀏覽器）。
   ============================================================ */

window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyAWaIwB88LtRfjUQE58F8iJsHt22xfY7iI",
  authDomain: "qna-huayu-homework.firebaseapp.com",
  projectId: "qna-huayu-homework",
  storageBucket: "qna-huayu-homework.firebasestorage.app",
  messagingSenderId: "416621883462",
  appId: "1:416621883462:web:dcc5c89cdc084790b7da47"
};

/* （備用）Supabase —— 不用 Firebase 時才填 */
window.SUPABASE_URL      = "";
window.SUPABASE_ANON_KEY = "";

/* 教師管理頁的登入密碼 —— 請務必改成你自己的密碼 */
window.TEACHER_PASSWORD = "teacher2026";

/* 平台名稱（會顯示在每一頁的頁首） */
window.APP_NAME = "華語線上作業簿";

/* ============================================================
   小提醒：Firebase 的設定物件屬於前端公開金鑰，可放在網頁；
   實際存取權限由 Firestore 安全規則控管（見部署指南）。
   教師密碼僅為基本保護，請勿視為高度機密。
   ============================================================ */
