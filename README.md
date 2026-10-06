# הצעות מחיר דיגיטליות

האתר שבו לקוחות פותחים הצעת מחיר, חותמים ומקבלים PDF.
כל תיקייה (למשל `demo/`, `ilana/`) היא ספק: `config.js` מכיל את המיתוג, המחירון, התנאים ומדיניות הביטול שלו.

הקמת ספק:
1. `<slug>/config.js` (טלפון + מייל תמיד).
2. תמונת וואטסאפ: `node tools/make_og.mjs . <slug> --force` (צריך `playwright-core` ו-`@fontsource/assistant`).
3. `python3 tools/make_pages.py` יוצר את `<slug>/index.html`.

מסמכים משפטיים: `legal/terms|refunds|privacy|accessibility.html?t=<slug>`.
