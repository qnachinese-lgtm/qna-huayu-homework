/* 上線前檢查（Vercel 每次部署都會先跑這支）
   漢字遊戲靠 db.js 最後面的 HANZI_LOADER 接到老師後台和學生端。
   如果有人用舊的檔案覆蓋，把漢字遊戲需要的東西弄掉了，這次部署就停下來，網站維持上一版，
   GitHub 上這一次的提交會顯示紅色的 ✕，點進去就看得到下面這段說明。 */
const fs = require('fs');
const need = ['hanzi.html', 'hanzi-game.js', 'hanzi-data.js', 'hanzi-teacher.js', 'hanzi-student.js', 'hanzi-fuweng.js', 'db.js', 'teacher.html', 'student.html'];
const bad = [];
need.forEach(f => { if (!fs.existsSync(f)) bad.push('少了檔案：' + f); });
const read = f => { try { return fs.readFileSync(f, 'utf8'); } catch (e) { return ''; } };
if (!/HANZI_LOADER/.test(read('db.js'))) bad.push('db.js 最後面的「HANZI_LOADER 漢字遊戲外掛」那一段不見了（可能用了舊的 db.js 覆蓋）');
['teacher.html', 'student.html'].forEach(f => { if (read(f) && !/src="db\.js/.test(read(f))) bad.push(f + ' 沒有載入 db.js'); });
if (bad.length) {
  console.error('\n✕ 漢字遊戲檢查沒過，這次不上線（網站維持上一版）：');
  bad.forEach(x => console.error('  - ' + x));
  console.error('請從 GitHub 上一個版本把上面這些東西補回來再上傳。\n');
  process.exit(1);
}
console.log('✓ 漢字遊戲檢查通過');
