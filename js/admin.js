(() => {
  const { KEY, D, load, IC } = CMS, $ = s => document.querySelector(s), PW = 'prajapat_admin_pw2';
  let data = load(), tab = 'hero';
  const hash = async (p, salt) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + p)))].map(b => b.toString(16).padStart(2, '0')).join('');
  let tt; const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 1600); };
  // cloud writes are debounced so fast typing/reordering doesn't spam Firestore with a write per keystroke
  let cloudTimer; const cloudSave = () => {
    if (!window.CMS_DOC) return;
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(() => { CMS_DOC().set(data).catch(() => toast('Cloud sync failed — check connection')); }, 700);
  };
  const save = () => { localStorage.setItem(KEY, JSON.stringify(data)); toast('Saved'); cloudSave(); };

  // ── access: default admin password is fixed below (as a salted hash, not plaintext). ──
  // Changing the password in General Settings stores a new hash in localStorage, which then
  // overrides this default — so admin.js never needs to be re-edited after that point.
  const DEFAULT_PW = { salt: 'ddc450dcad0b80d63bb726070e80837b', h: 'a952c72eeb227dc5a2319e4437124ec2871b76474f06907c220c5c5e85fc90a9' };
  const stored = () => JSON.parse(localStorage.getItem(PW) || 'null') || DEFAULT_PW;
  const enter = async () => {
    sessionStorage.setItem('pj_ok', '1'); $('#login').style.display = 'none'; $('#app').style.display = 'grid';
    if (window.CMS_DOC) {
      try {
        const snap = await CMS_DOC().get();
        if (snap.exists) { data = { ...structuredClone(D), ...snap.data() }; localStorage.setItem(KEY, JSON.stringify(data)); }
      } catch (e) { toast('Offline — showing last saved copy'); }
    }
    nav(); show();
  };
  $('#go').onclick = async () => {
    const p = $('#pw').value, s = stored();
    (await hash(p, s.salt)) === s.h ? enter() : ($('#msg').textContent = 'Incorrect password.');
  };
  $('#pw').onkeydown = e => { if (e.key === 'Enter') $('#go').click(); };
  if (sessionStorage.getItem('pj_ok')) enter();

  // ── ui helpers ──
  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  const btn = (t, f, c) => { const b = el('button', c, t); b.onclick = f; return b; };
  const inp = (lab, obj, k, o = {}) => {
    const l = el('label', 'f', `<span>${lab}</span>`), e = o.opts ? el('select') : el(o.ta ? 'textarea' : 'input');
    if (o.opts) o.opts.forEach(([v, t]) => e.append(new Option(t, v)));
    e.value = obj[k] || ''; e.oninput = () => { obj[k] = e.value; save(); }; l.append(e); return l;
  };
  const logoData = f => new Promise((ok, no) => { const i = new Image(), u = URL.createObjectURL(f); i.onload = () => { const s = Math.min(1, 192 / Math.max(i.width, i.height)), c = el('canvas'); c.width = i.width * s; c.height = i.height * s; c.getContext('2d').drawImage(i, 0, 0, c.width, c.height); URL.revokeObjectURL(u); ok(c.toDataURL('image/png')); }; i.onerror = () => no(); i.src = u; });
  function list(arr, fields, blank, logo, extra) {
    const box = el('div'), draw = () => {
      box.innerHTML = '';
      arr.forEach((it, i) => {
        const r = el('div', 'row'); fields.forEach(([k, lab, ta]) => r.append(inp(lab, it, k, { ta })));
        if (logo) {
          const lg = el('div', 'logo', it.logo ? `<img src="${it.logo}" alt="">` : '<i></i>');
          lg.append(btn(it.logo ? 'Replace logo' : 'Upload logo', () => { const f = el('input'); f.type = 'file'; f.accept = 'image/png,image/jpeg,image/webp,image/svg+xml'; f.onchange = async () => { try { it.logo = await logoData(f.files[0]); save(); draw(); } catch (e) { toast('Could not read image'); } }; f.click(); }));
          if (it.logo) lg.append(btn('Remove logo', () => { it.logo = ''; save(); draw(); }));
          r.append(lg);
        }
        const c = el('div', 'ctl');
        c.append(btn('↑', () => { if (i) arr.splice(i - 1, 0, ...arr.splice(i, 1)); save(); draw(); }), btn('↓', () => { if (i < arr.length - 1) arr.splice(i + 1, 0, ...arr.splice(i, 1)); save(); draw(); }), btn('Delete', () => { arr.splice(i, 1); save(); draw(); }));
        r.append(c); box.append(r);
      });
      const p = el('div', 'presets'); (extra || [['+ Add', blank]]).forEach(([t, b]) => p.append(btn(t, () => { arr.push({ ...b }); save(); draw(); }))); box.append(p);
    }; draw(); return box;
  }

  const P = {
    hero: () => ['Hero', 'Headline, subtitle, description and status.', [inp('Title (line breaks at spaces)', data.hero, 'title'), inp('Subtitle', data.hero, 'sub'), inp('Description', data.hero, 'tag', { ta: 1 }), inp('Role', data.hero, 'role'), inp('Status', data.hero, 'status')]],
    work: () => ['My Work', 'Categories shown around the character. Split evenly left/right.', [list(data.work, [['t', 'Category name'], ['d', 'Description', 1]], { t: '', d: '' })]],
    exp: () => ['Experience', 'Numbers and labels. Add, edit, delete, reorder.', [list(data.exp, [['n', 'Number / years'], ['l', 'Label / role / description']], { n: '', l: '' })]],
    sw: () => ['Software I Use', 'Name, logo (or letter tile), badge.', [list(data.sw, [['n', 'Name'], ['ab', 'Letters (if no logo)'], ['badge', 'Badge text']], { n: '', ab: '', bg: '#1A1A2E', fg: '#FFFFFF', badge: '', logo: '' }, true)]],
    soc: () => ['Social Media', 'Any platform, any link, any logo.', [list(data.soc, [['n', 'Platform name'], ['url', 'Link (https://…, mailto:, tel:)']], { n: '', url: '', ic: 'link', logo: '' }, true,
      [['Instagram', 'instagram'], ['YouTube', 'youtube'], ['Telegram', 'telegram'], ['TikTok', 'tiktok'], ['X', 'x']].map(([n, ic]) => ['+ ' + n, { n, url: '', ic, logo: '' }]).concat([['+ Custom platform', { n: '', url: '', ic: 'link', logo: '' }]]))]],
    hire: () => ['Hire Me', 'Contact details and what the buttons do.', [inp('Email', data.hire, 'email'), inp('WhatsApp Business number', data.hire, 'waNum'), inp('WhatsApp chat link (optional — overrides number)', data.hire, 'waLink'), inp('Start-a-project button label', data.hire, 'cta'), inp('Secondary label', data.hire, 'cta2'), inp('Start-a-project opens', data.hire, 'action', { opts: [['whatsapp', 'WhatsApp'], ['email', 'Email']] })]],
    media: () => ['Center Media', 'Image or video per section.', []],
    gen: () => ['General Settings', 'Password and reset.', [(() => { const d = el('div'), pw = el('label', 'f', '<span>New password (min 8)</span><input type="password">'); d.append(pw, btn('Change password', async () => { const v = pw.querySelector('input').value; if (v.length < 8) return toast('Too short'); const salt = crypto.randomUUID(); localStorage.setItem(PW, JSON.stringify({ salt, h: await hash(v, salt) })); pw.querySelector('input').value = ''; toast('Password changed'); }, 'add'), btn('Reset all text content to defaults', () => { if (confirm('Reset all content?')) { localStorage.removeItem(KEY); data = load(); show(); if (window.CMS_DOC) CMS_DOC().delete().catch(() => {}); } }, 'add')); return d; })()]]
  };
  const names = { hero: 'Hero', work: 'My Work', exp: 'Experience', sw: 'Software I Use', soc: 'Social Media', hire: 'Hire Me', media: 'Center Media', gen: 'General Settings' };
  function nav() { const n = $('#tabs'); n.innerHTML = '<b>PRAJAPAT</b>'; Object.keys(names).forEach(k => { const b = btn(names[k], () => { tab = k; nav(); show(); }); b.className = k === tab ? 'on' : ''; n.append(b); }); n.append(btn('Log out', () => { sessionStorage.removeItem('pj_ok'); location.reload(); }, 'out')); }
  function show() {
    const [h, s, kids] = P[tab](), p = $('#panel'); p.innerHTML = `<h2>${h}</h2><p class="sub">${s}</p>`; kids.forEach(k => p.append(k));
    $('#media-admin').hidden = tab !== 'media';
  }
})();
