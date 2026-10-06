/* יוצר את og.jpg (1200×630) של כל ספק — התמונה שמופיעה בוואטסאפ כשהספק שולח ללקוח את הקישור.
   התמונה נבנית מהשם, השורה, הצבעים והלוגו שב-config.js של הספק.
   הרצה (מתוך תיקייה שבה מותקנים playwright-core ו-@fontsource/assistant):
       node <hatzaa>/tools/make_og.mjs <hatzaa> [slug] [--force]
   בלי --force נוצרת תמונה רק לספקים שאין להם og.jpg. אחרי זה: python3 tools/make_pages.py */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { createRequire } from 'module';

const require = createRequire(path.join(process.cwd(), 'x.js'));
const { chromium } = require('playwright-core');
const fontDir = path.join(path.dirname(require.resolve('@fontsource/assistant/package.json')), 'files');

const args = process.argv.slice(2);
const root = path.resolve(args.find(a => !a.startsWith('--') ) || '.');
const only = args.filter(a => !a.startsWith('--'))[1];
const force = args.includes('--force');

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
function hexToRgb(h){ h = String(h || '').replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return isNaN(n) ? [43, 89, 255] : [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;
const font = w => `@font-face{font-family:A;font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(fontDir, `assistant-hebrew-${w}-normal.woff2`)).toString('base64')}) format('woff2');}`
    + `@font-face{font-family:A;font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(fontDir, `assistant-latin-${w}-normal.woff2`)).toString('base64')}) format('woff2');unicode-range:U+0000-00FF;}`;

function html(T, dir){
    const B = T.business || {}, b = hexToRgb((T.theme || {}).brand), dk = mix(b, [0, 0, 0], .35), lt = mix(b, [255, 255, 255], .82);
    const logo = B.logo && fs.existsSync(path.join(dir, B.logo))
        ? `<img src="data:image/${B.logo.endsWith('.svg') ? 'svg+xml' : 'png'};base64,${fs.readFileSync(path.join(dir, B.logo)).toString('base64')}">`
        : `<span>${esc((B.name || '?').trim().charAt(0))}</span>`;
    return `<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"><style>
${[400, 600, 700, 800].map(font).join('\n')}
*{box-sizing:border-box;margin:0}
html,body{width:1200px;height:630px;overflow:hidden}
.frame{position:fixed;left:0;top:0;width:1200px;height:630px;overflow:hidden;font-family:A,sans-serif;color:#fff;background:linear-gradient(135deg,${rgb(b)} 0%,${rgb(dk)} 100%)}
.glow{position:absolute;border-radius:50%;filter:blur(2px)}
.g1{width:560px;height:560px;left:-140px;top:-180px;background:radial-gradient(circle,rgba(255,255,255,.18),rgba(255,255,255,0) 70%)}
.g2{width:420px;height:420px;right:-120px;bottom:-200px;background:radial-gradient(circle,rgba(255,255,255,.12),rgba(255,255,255,0) 70%)}
.main{position:absolute;right:80px;top:0;bottom:0;width:640px;display:flex;flex-direction:column;justify-content:center;gap:22px}
.mono{width:104px;height:104px;border-radius:30px;background:#fff;color:${rgb(b)};display:grid;place-items:center;font-size:62px;font-weight:800;box-shadow:0 18px 40px -14px rgba(0,0,0,.45);overflow:hidden}
.mono img{width:100%;height:100%;object-fit:contain;padding:10px}
.name{font-size:${(B.name || '').length > 18 ? 58 : 68}px;font-weight:800;line-height:1.05;letter-spacing:-.5px}
.tag{font-size:27px;font-weight:600;opacity:.88;margin-top:-8px}
.head{font-size:40px;font-weight:700;margin-top:10px}
.cta{align-self:flex-start;display:inline-flex;align-items:center;gap:14px;background:#fff;color:${rgb(dk)};font-size:28px;font-weight:800;padding:16px 30px;border-radius:999px;box-shadow:0 16px 34px -16px rgba(0,0,0,.5)}
.cta b{font-size:30px}
.doc{position:absolute;left:96px;top:92px;width:330px;height:440px;background:#fff;border-radius:22px;transform:rotate(-6deg);box-shadow:0 40px 70px -30px rgba(0,0,0,.55);padding:34px 30px;display:flex;flex-direction:column;gap:16px}
.doc .bar{height:16px;border-radius:8px;background:${rgb(lt)}}
.doc .bar.t{height:26px;width:70%;background:${rgb(b)}}
.doc .bar.s{width:55%}
.doc .rows{display:flex;flex-direction:column;gap:12px;margin-top:8px}
.doc .row{display:flex;justify-content:space-between;gap:16px}
.doc .row i{display:block;height:13px;border-radius:7px;background:#ECEAF0}
.doc .tot{margin-top:6px;border-top:3px solid #222;padding-top:14px;display:flex;justify-content:space-between}
.doc .tot i{display:block;height:20px;border-radius:9px;background:${rgb(b)}}
.doc svg{margin-top:auto}
.seal{position:absolute;left:350px;top:430px;width:118px;height:118px;border-radius:50%;background:#fff;display:grid;place-items:center;box-shadow:0 18px 36px -14px rgba(0,0,0,.5)}
.seal svg{width:62px;height:62px}
</style></head><body><div class="frame">
<div class="glow g1"></div><div class="glow g2"></div>
<div class="doc">
  <div class="bar t"></div><div class="bar s"></div>
  <div class="rows">${[[60, 22], [48, 18], [66, 20], [40, 16]].map(([a, c]) => `<div class="row"><i style="width:${a}%"></i><i style="width:${c}%"></i></div>`).join('')}</div>
  <div class="tot"><i style="width:30%"></i><i style="width:26%"></i></div>
  <svg viewBox="0 0 260 80" width="230" height="70"><path d="M8 52c18-30 34-40 44-28 9 11-6 34 6 34 14 0 22-40 38-40 12 0 4 30 16 30 14 0 20-22 34-22 10 0 8 16 20 16 16 0 28-14 50-18" fill="none" stroke="#1d1d24" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 70h244" stroke="#D5D3DA" stroke-width="3"/></svg>
</div>
<div class="seal"><svg viewBox="0 0 24 24" fill="none" stroke="${rgb(b)}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>
<div class="main">
  <div class="mono">${logo}</div>
  <div class="name">${esc(B.name)}</div>
  ${B.tagline ? `<div class="tag">${esc(B.tagline)}</div>` : ''}
  <div class="head">הצעת המחיר שלך מוכנה</div>
  <div class="cta">לחצו לצפייה ולחתימה <b>←</b></div>
</div>
</div></body></html>`;
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
for (const dirent of fs.readdirSync(root, { withFileTypes: true })) {
    const dir = path.join(root, dirent.name), cfg = path.join(dir, 'config.js');
    if (!dirent.isDirectory() || !fs.existsSync(cfg)) continue;
    if (only && dirent.name !== only) continue;
    const out = path.join(dir, 'og.jpg');
    if (fs.existsSync(out) && !force) { console.log('skip', dirent.name, '(og.jpg exists)'); continue; }
    const sandbox = { window: {} }; vm.runInNewContext(fs.readFileSync(cfg, 'utf8'), sandbox);
    const T = sandbox.window.TENANT;
    await page.setContent(html(T, dir), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: out, type: 'jpeg', quality: 86 });
    console.log('wrote', path.relative(root, out), Math.round(fs.statSync(out).size / 1024) + 'KB');
}
await browser.close();
