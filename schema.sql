-- ============================================================
-- 華語線上作業簿平台 資料庫結構 (Supabase / PostgreSQL)
-- 使用方式：Supabase 後台 → SQL Editor → New query → 貼上整段 → Run
-- ============================================================

create extension if not exists pgcrypto;

-- 學生名冊（含帳號登入） --------------------------------------
create table if not exists students (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,            -- 姓名
  username      text,                     -- 登入帳號（唯一）
  password      text,                     -- 登入密碼（小型平台明碼，進階安全見指南）
  email         text,                     -- Email（選填）
  nationality   text,                     -- 國籍
  textbook      text,                     -- 使用教材
  class_type    text default '1對1',      -- 班別：1對1 / 團班
  class_time    text,                     -- 上課時間
  payment_date  date,                     -- 付款日期
  tuition       numeric,                  -- 學費
  access_code   text,                     -- （舊版相容，可留空）
  reset_requested timestamptz,            -- 學生申請重設密碼的時間（老師處理後清空）
  notes         text,                     -- 備註
  created_at    timestamptz default now()
);
create unique index if not exists students_username_key on students (lower(username)) where username is not null;

-- 課文 / 單元（課文、生字、重點、音檔，並指派給學生） --------
-- 生字格式：每行一個，可寫「詞」或「詞=釋義」或「詞=拼音=釋義」（用於生字卡）
create table if not exists lessons (
  id            uuid primary key default gen_random_uuid(),
  order_index   int default 0,            -- 排序（第幾課）
  title         text not null,            -- 課名
  content       text,                     -- 課文內容
  vocabulary    text,                     -- 生字（每行一個）
  key_points    text,                     -- 語法／重點
  audio_url     text,                     -- 課文音檔（mp3 連結或 YouTube）
  assigned_ids  jsonb default '[]'::jsonb,-- 指派給哪些學生（空＝尚未指派）
  due_date      date,                     -- 截止日（選填）
  created_at    timestamptz default now()
);

-- 練習題 ----------------------------------------------------
-- type: choice(單選) / fill(填空) / order(重組) / match(配對)
--   choice : options=["A","B"...]  answer=正確選項索引(0起)
--   fill   : options=[]            answer=["可接受答案1","可接受答案2"]
--   order  : options=["我","愛","你"]（正確順序） answer=null
--   match  : options=[{"l":"你好","r":"hello"}...] answer=null
create table if not exists questions (
  id            uuid primary key default gen_random_uuid(),
  lesson_id     uuid references lessons(id) on delete cascade,
  order_index   int default 0,
  type          text not null default 'choice',
  prompt        text,
  options       jsonb default '[]'::jsonb,
  answer        jsonb,
  audio_url     text,                     -- 此題音檔（有＝聽力題）
  explanation   text,
  created_at    timestamptz default now()
);

-- 成績 / 作答結果（錯題本由 answers 推導） -------------------
create table if not exists results (
  id            uuid primary key default gen_random_uuid(),
  lesson_id     uuid references lessons(id) on delete cascade,
  student_id    uuid references students(id) on delete cascade,
  answers       jsonb default '{}'::jsonb,-- { 題目id: 作答 }（手寫題存圖片 dataURL）
  score         int default 0,
  auto          int default 0,            -- 自動批改答對數（手寫題的人工分另計）
  manual        jsonb default '{}'::jsonb,-- 手寫題老師批改 { 題目id: done/wrong }
  total         int default 0,
  status        text default 'in_progress',
  completed_at  timestamptz,
  updated_at    timestamptz default now(),
  unique (lesson_id, student_id)
);

-- ============================================================
-- Row Level Security（小型家教採寬鬆政策；進階安全見部署指南）
-- ============================================================
alter table students  enable row level security;
alter table lessons   enable row level security;
alter table questions enable row level security;
alter table results   enable row level security;

create policy "allow all - students"  on students  for all using (true) with check (true);
create policy "allow all - lessons"   on lessons   for all using (true) with check (true);
create policy "allow all - questions" on questions for all using (true) with check (true);
create policy "allow all - results"   on results   for all using (true) with check (true);

-- ============================================================
-- 完成。建立後回到平台，頁首顯示「● 雲端同步」即成功。
-- 已有舊資料表想升級欄位，可執行：
--   alter table students add column if not exists username text;
--   alter table students add column if not exists password text;
--   alter table students add column if not exists email text;
--   alter table students add column if not exists reset_requested timestamptz;
-- ============================================================
