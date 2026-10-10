/* מיתוג הספק: צבעים, גופן, לוגו ופוטר — משותף לדף ההצעה ולדפי המסמכים.
   קורא את window.TENANT (מתוך config.js של הספק). */
(function(){
    function hexToRgb(h){
        h = String(h || '').replace('#', '');
        if (h.length === 3) h = h.split('').map(c => c + c).join('');
        const n = parseInt(h, 16);
        return isNaN(n) ? [43, 89, 255] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
    const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;
    function lum(c){ const s = c.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * s[0] + .7152 * s[1] + .0722 * s[2]; }
    function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m])); }

    function apply(T){
        const th = (T && T.theme) || {};
        const b = hexToRgb(th.brand || '#2B59FF');
        const root = document.documentElement.style;
        root.setProperty('--brand', rgb(b));
        root.setProperty('--brand-ink', lum(b) > 0.45 ? '#16161A' : '#FFFFFF');
        root.setProperty('--brand-soft', `rgba(${b[0]},${b[1]},${b[2]},.09)`);
        root.setProperty('--brand-dk', rgb(mix(b, [0, 0, 0], .3)));
        root.setProperty('--brand-mid', rgb(mix(b, [255, 255, 255], .45)));
        if (th.background) root.setProperty('--bg', th.background);
        const font = th.font || 'Heebo';
        root.setProperty('--font', `'${font}'`);
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(font).replace(/%20/g, '+') + ':wght@400;500;600;700;800;900&family=Heebo:wght@400;500;700;800;900&display=swap';
        document.head.appendChild(l);
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.content = th.background || '#F5F4F1';
    }

    // לוגו (תמונה) או אות ראשונה של שם העסק
    function logoHtml(T, base){
        const B = T.business || {};
        // לוגו של ספק שנוצר מלוח הניהול נשמר כתמונה מוטמעת (data:image/…); אחרת — קובץ בתיקייה של הספק
        if (B.logo) return `<span class="vlogo has-img"><img src="${esc(/^data:image\//.test(B.logo) ? B.logo : base + B.logo)}" alt="${esc(B.name)}"></span>`;
        return `<span class="vlogo" aria-hidden="true">${esc((B.name || '?').trim().charAt(0))}</span>`;
    }
    function headerHtml(T, base){
        const B = T.business || {};
        return `<header class="vhead rise">${logoHtml(T, base)}<div><p class="vname">${esc(B.name)}</p>${B.tagline ? `<p class="vtag">${esc(B.tagline)}</p>` : ''}</div></header>`;
    }
    // פוטר: פרטי הספק + מסמכים משפטיים (הקישורים נושאים ?t= ואם יש — גם ?q= לחזרה להצעה)
    function footerHtml(T, legalBase, q){
        const B = T.business || {};
        const qs = 't=' + encodeURIComponent(T.slug) + (q ? '&q=' + encodeURIComponent(q) : '');
        const contact = [
            B.email ? `<a href="mailto:${esc(B.email)}">${esc(B.email)}</a>` : '',
            B.phone ? `<a href="tel:${esc(String(B.phone).replace(/[^\d+]/g, ''))}" class="ltr">${esc(B.phone)}</a>` : ''
        ].filter(Boolean).join(' · ');
        return `<footer class="foot">
            <b>${esc(B.name)}</b>${B.businessId ? ` · ${esc(B.businessId)}` : ''}
            ${contact ? `<p style="margin:6px 0 0">${contact}</p>` : ''}
            <nav class="pills" aria-label="מסמכים">
                <a href="${legalBase}terms.html?${qs}">תנאי שימוש</a>
                <a href="${legalBase}refunds.html?${qs}">ביטול והחזרים</a>
                <a href="${legalBase}privacy.html?${qs}">פרטיות</a>
                <a href="${legalBase}accessibility.html?${qs}">נגישות</a>
            </nav>
            <p style="margin:0">© ${new Date().getFullYear()} · כל הזכויות שמורות</p>
        </footer>`;
    }
    /* ספק שנוצר מלוח הניהול: ההגדרות שמורות ב-vendorConfigs/<slug> (קריאה ציבורית לפי מזהה, כמו config.js) */
    function restBase(){
        const E = window.__EMU__, P = window.PLATFORM || {};
        const project = (P.firebase && P.firebase.projectId) || 'check-b2a66', db = P.firestoreDatabaseId || 'default';
        return (E ? 'http://127.0.0.1:' + E.firestore + '/v1' : 'https://firestore.googleapis.com/v1') + `/projects/${project}/databases/${db}/documents/`;
    }
    async function remoteTenant(slug){
        if (!/^[a-z0-9-]{2,40}$/.test(slug || '')) throw new Error('bad slug');
        const r = await fetch(restBase() + 'vendorConfigs/' + slug);
        if (!r.ok) throw new Error('not found');
        const j = await r.json(), T = JSON.parse((((j.fields || {}).config) || {}).stringValue || 'null');
        if (!T || typeof T !== 'object') throw new Error('not found');
        T.slug = slug; T.dynamic = true;
        return T;
    }
    // קישור קצר בלי ?t= — הספק נמצא בקישור עצמו (shortLinks/<id>.tenant)
    async function tenantOfShortLink(id){
        if (!/^[a-z0-9]{6,20}$/.test(id || '')) return '';
        const r = await fetch(restBase() + 'shortLinks/' + id); if (!r.ok) return '';
        const j = await r.json(); return (((j.fields || {}).tenant) || {}).stringValue || '';
    }
    window.Brand = { apply, headerHtml, footerHtml, logoHtml, esc, remoteTenant, tenantOfShortLink };
})();
