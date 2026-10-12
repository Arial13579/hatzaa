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
            <b>${esc(B.name)}</b>${B.businessId ? ` · ${esc(B.businessId)}` : ''}${B.address ? ` · ${esc(B.address)}` : ''}
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
    /* הגדרות ספק שנשמרו במאגר (vendorConfigs) אינן קוד שלנו — מנקים לפני שימוש: בלי תגיות, מספרים כמספרים,
       צבעים וקישורים בפורמט תקין בלבד. כך שום ערך לא יכול להריץ קוד בדף. */
    function cleanConfig(T){
        const deep = v => Array.isArray(v) ? v.map(deep) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deep(x)]))
            : typeof v === 'string' ? v.replace(/[<>]/g, '') : (typeof v === 'number' || typeof v === 'boolean' || v == null) ? v : '';
        T = deep(T && typeof T === 'object' && !Array.isArray(T) ? T : {});
        const N = v => Math.max(0, Number(v) || 0), str = v => typeof v === 'string' ? v : '', arr = v => Array.isArray(v) ? v : [];
        const strs = v => arr(v).map(str).filter(Boolean), hex = (v, d) => /^#[0-9a-f]{6}$/i.test(v) ? v : d;
        const B = T.business = Object.assign({}, T.business);
        ['name', 'tagline', 'email', 'phone', 'businessId', 'address'].forEach(k => { B[k] = str(B[k]); });
        B.logo = /^data:image\/(png|jpeg|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(str(B.logo)) ? B.logo : '';
        ['website', 'instagram', 'facebook', 'tiktok'].forEach(k => { if (B[k] !== undefined && !/^https:\/\/[^\s"'`]+$/i.test(str(B[k]))) delete B[k]; });
        const th = T.theme = Object.assign({}, T.theme);
        th.brand = hex(th.brand, '#0F766E'); th.background = hex(th.background, '#F7F6F3'); th.font = /^[A-Za-z ]{1,40}$/.test(str(th.font)) ? th.font : 'Assistant';
        const L = T.labels = Object.assign({}, T.labels);
        ['service', 'included', 'docTitle'].forEach(k => { if (L[k] !== undefined) L[k] = str(L[k]); });
        L.eventTypes = strs(L.eventTypes);
        const P = T.pricing = Object.assign({}, T.pricing), sv = {};
        Object.entries(P.SERVICES && typeof P.SERVICES === 'object' ? P.SERVICES : {}).forEach(([k, s]) => {
            if (/^[A-Za-z][A-Za-z0-9_]{0,40}$/.test(k) && s && typeof s === 'object')
                sv[k] = { label: str(s.label), lead: str(s.lead), base: N(s.base), hours: N(s.hours), extraHour: N(s.extraHour), items: strs(s.items) };
        });
        P.SERVICES = sv;
        if (!sv[P.DEFAULT_SERVICE]) P.DEFAULT_SERVICE = Object.keys(sv)[0] || '';
        ['GUEST_TIERS', 'TRAVEL_TIERS'].forEach(k => { P[k] = arr(P[k]).map(t => ({ max: Number(t && t.max) || 0, price: N(t && t.price), label: str(t && t.label) })); });
        P.CATALOG = arr(P.CATALOG).map(c => ({ label: str(c && c.label), price: N(c && c.price), desc: str(c && c.desc) }));
        P.COMMON_ITEMS = strs(P.COMMON_ITEMS);
        ['DEPOSIT', 'EVENT_HOURS', 'QUOTE_VALID_DAYS'].forEach(k => { if (P[k] != null) P[k] = N(P[k]); });
        if (P.DEPOSIT_PERCENT != null) P.DEPOSIT_PERCENT = Math.min(100, N(P.DEPOSIT_PERCENT));
        if (P.MODE !== undefined) P.MODE = P.MODE === 'items' ? 'items' : '';
        P.EXTRA_FRACTION = Object.fromEntries(Object.entries(P.EXTRA_FRACTION && typeof P.EXTRA_FRACTION === 'object' ? P.EXTRA_FRACTION : { 0: 0, 15: 0.25, 30: 0.5, 45: 0.75 }).map(([k, v]) => [String(N(k)), N(v)]));
        if (P.ORIGIN) { const o = P.ORIGIN; P.ORIGIN = { name: str(o.name) }; if (Number.isFinite(Number(o.lat)) && Number.isFinite(Number(o.lon)) && o.lat !== '' && o.lon !== '') { P.ORIGIN.lat = Number(o.lat); P.ORIGIN.lon = Number(o.lon); } }
        if (P.PAYMENT_METHODS !== undefined) P.PAYMENT_METHODS = strs(P.PAYMENT_METHODS);
        if (P.BALANCE_DUE !== undefined) P.BALANCE_DUE = str(P.BALANCE_DUE);
        T.terms = strs(T.terms);
        const pol = T.policy = Object.assign({}, T.policy);
        ['coolingDays', 'coolingNoticeDays', 'refundDays'].forEach(k => { pol[k] = N(pol[k]); });
        pol.tiers = strs(pol.tiers); pol.postpone = str(pol.postpone);
        if (T.og !== undefined) T.og = { head: str(T.og && T.og.head), cta: str(T.og && T.og.cta) };
        T.sample = T.sample === true;
        return T;
    }
    async function remoteTenant(slug){
        if (!/^[a-z0-9-]{2,40}$/.test(slug || '')) throw new Error('bad slug');
        const r = await fetch(restBase() + 'vendorConfigs/' + slug);
        if (!r.ok) throw new Error('not found');
        const j = await r.json();
        let T = null; try { T = JSON.parse((((j.fields || {}).config) || {}).stringValue || 'null'); } catch(e) {}
        if (!T || typeof T !== 'object') throw new Error('not found');
        T = cleanConfig(T);
        T.slug = slug; T.dynamic = true;
        return T;
    }
    // קישור קצר בלי ?t= — הספק נמצא בקישור עצמו (shortLinks/<id>.tenant)
    async function tenantOfShortLink(id){
        if (!/^[a-z0-9]{6,20}$/.test(id || '')) return '';
        const r = await fetch(restBase() + 'shortLinks/' + id); if (!r.ok) return '';
        const j = await r.json(); return (((j.fields || {}).tenant) || {}).stringValue || '';
    }
    window.Brand = { apply, headerHtml, footerHtml, logoHtml, esc, remoteTenant, tenantOfShortLink, cleanConfig };
})();
