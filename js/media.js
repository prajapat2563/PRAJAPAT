/* PRAJAPAT — Center Media system: per-section image/video that inherits the character's
   position, scale, fade, parallax and slide motion. Stored in IndexedDB (blobs load lazily). */
(() => {
  'use strict';
  const N = 6, MAX = 2560, MAXV = 80 * 1048576;
  const NAMES = ['Hero', 'My Work', 'Experience', 'Software', 'Social Media', 'Hire Me'];
  const DEF_AR = [1151 / 1247, 1172 / 1254, 1187 / 1240, 971 / 1251, 1125 / 1254, 992 / 1526];
  const DEF = { active: 'default', fit: 'contain', mode: 'auto', feather: 28, image: null, video: null };
  const bc = 'BroadcastChannel' in self ? new BroadcastChannel('prajapat-media') : null;

  // ── storage ──
  let _db;
  const db = () => _db || (_db = new Promise((ok, no) => {
    const r = indexedDB.open('prajapat_media', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('s');
    r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
  }));
  const tx = async (m, f) => { const d = await db(); return new Promise((ok, no) => { const t = d.transaction('s', m), q = f(t.objectStore('s')); t.oncomplete = () => ok(q && q.result); t.onerror = () => no(t.error); }); };
  const get = k => tx('readonly', s => s.get(k)), put = (k, v) => tx('readwrite', s => s.put(v, k)), del = k => tx('readwrite', s => s.delete(k));
  const cfg = async i => ({ ...DEF, ...(await get('c' + i)) });
  const setCfg = async (i, r) => { await put('c' + i, r); bc && bc.postMessage(i); };
  const blob = (i, k) => get('b' + i + k);

  // ── analysis: is the media edge transparent / light / photographic? ──
  function edge(src, w, h) {
    const c = document.createElement('canvas'), s = Math.min(1, 96 / Math.max(w, h));
    c.width = Math.max(4, w * s | 0); c.height = Math.max(4, h * s | 0);
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(src, 0, 0, c.width, c.height);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    let a = 0, l = 0, n = 0, mn = 255, mx = 0;
    for (let i = 0; i < c.height; i++) for (let j = 0; j < c.width; j++) {
      if (i > 1 && i < c.height - 2 && j > 1 && j < c.width - 2) continue;
      const k = (i * c.width + j) * 4, v = (d[k] + d[k + 1] + d[k + 2]) / 3;
      a += d[k + 3]; l += v; mn = Math.min(mn, v); mx = Math.max(mx, v); n++;
    }
    return { a: a / n, l: l / n, sp: mx - mn };
  }

  // ── light-background → real alpha (edge flood fill, soft ramp, halo decontamination) ──
  function key(c) {
    const W = c.width, H = c.height, x = c.getContext('2d'), im = x.getImageData(0, 0, W, H), d = im.data;
    const cs = [0, (W - 1) * 4, (H - 1) * W * 4, ((H - 1) * W + W - 1) * 4];
    const bg = [0, 1, 2].map(k => cs.reduce((s, i) => s + d[i + k], 0) / 4);
    const dist = i => Math.max(Math.abs(d[i] - bg[0]), Math.abs(d[i + 1] - bg[1]), Math.abs(d[i + 2] - bg[2]));
    const T0 = 8, T1 = 44, seen = new Uint8Array(W * H), st = new Int32Array(W * H); let n = 0;
    const add = p => { if (!seen[p] && dist(p * 4) < T1) { seen[p] = 1; st[n++] = p; } };
    for (let a = 0; a < W; a++) { add(a); add((H - 1) * W + a); }
    for (let b = 0; b < H; b++) { add(b * W); add(b * W + W - 1); }
    while (n) {
      const p = st[--n], px = p % W;
      if (px > 0) add(p - 1); if (px < W - 1) add(p + 1); if (p >= W) add(p - W); if (p < W * (H - 1)) add(p + W);
    }
    for (let p = 0; p < W * H; p++) {
      if (!seen[p]) continue;
      const i = p * 4, t = (dist(i) - T0) / (T1 - T0), a = t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
      d[i + 3] = a * 255;
      if (a > 0) for (let k = 0; k < 3; k++) { const v = (d[i + k] - (1 - a) * bg[k]) / a; d[i + k] = v < 0 ? 0 : v > 255 ? 255 : v; }
    }
    x.putImageData(im, 0, 0);
  }

  // ── processing (no distortion: original ratio kept; only downscaled above 2560px) ──
  async function procImage(f) {
    const b = await createImageBitmap(f), w = b.width, h = b.height, s = Math.min(1, MAX / Math.max(w, h));
    const e = edge(b, w, h), kind = e.a < 20 ? 'cutout' : (e.l > 228 && e.sp < 40) ? 'light' : 'photo';
    let out = f;
    if (s < 1 || kind === 'light') {
      const c = document.createElement('canvas'); c.width = w * s | 0; c.height = h * s | 0;
      c.getContext('2d').drawImage(b, 0, 0, c.width, c.height);
      if (kind === 'light') key(c);
      out = await new Promise(o => c.toBlob(o, 'image/webp', .95));
    }
    return { blob: out, ar: w / h, size: out.size, detected: kind === 'photo' ? 'feather' : 'cutout' };
  }
  async function procVideo(f) {
    const u = URL.createObjectURL(f), v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = u;
    await new Promise((ok, no) => { v.onloadeddata = ok; v.onerror = () => no(new Error('Could not read this video')); });
    const sk = new Promise(o => { v.onseeked = o; setTimeout(o, 1500); });
    v.currentTime = Math.min(.1, (v.duration || 1) / 2); await sk;
    const w = v.videoWidth, h = v.videoHeight, s = Math.min(1, 1280 / Math.max(w, h)), c = document.createElement('canvas');
    c.width = w * s | 0; c.height = h * s | 0; c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    const e = edge(c, c.width, c.height); URL.revokeObjectURL(u);
    return { ar: w / h, poster: await new Promise(o => c.toBlob(o, 'image/webp', .82)), detected: (e.l > 228 && e.sp < 40) ? 'blend' : 'feather' };
  }
  async function upload(i, f) {
    const isV = /^video\/(mp4|webm)$/.test(f.type) || /\.(mp4|webm)$/i.test(f.name);
    const isI = /^image\/(png|jpe?g)$/.test(f.type) || /\.(png|jpe?g)$/i.test(f.name);
    if (!isV && !isI) throw new Error('Use PNG, JPG, MP4 or WebM');
    if (isV && f.size > MAXV) throw new Error('Video is over 80 MB — compress it first');
    const r = await cfg(i);
    if (isV) {
      const p = await procVideo(f);
      await put('b' + i + 'video', f); await put('b' + i + 'poster', p.poster);
      r.video = { name: f.name, size: f.size, ar: p.ar, detected: p.detected }; r.active = 'video';
    } else {
      const p = await procImage(f);
      await put('b' + i + 'image', p.blob);
      r.image = { name: f.name, size: p.size, ar: p.ar, detected: p.detected }; r.active = 'image';
    }
    await setCfg(i, r);
  }

  // ═══ PUBLIC SITE ═══
  const REDUCE = matchMedia('(prefers-reduced-motion:reduce)').matches || (navigator.connection && navigator.connection.saveData);
  function sync(s) {
    const v = s.querySelector('video.character-img'); if (!v) return;
    if (s.classList.contains('active') && !REDUCE) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); } else v.pause();
  }
  async function apply(i) {
    const slide = document.querySelector(`.section-slide[data-index="${i}"]`); if (!slide) return;
    const box = slide.querySelector('.character-container'), r = await cfg(i), m = r.active !== 'default' && r[r.active];
    box._def = box._def || box.querySelector('.character-img');
    (box._urls = box._urls || []).forEach(URL.revokeObjectURL); box._urls = [];
    const cur = box.querySelector('.character-img');
    const b = m && await blob(i, r.active);
    if (!b) {
      if (cur !== box._def) cur.replaceWith(box._def);
      box.classList.remove('has-media'); ['bg', 'fit'].forEach(k => box.removeAttribute('data-' + k)); return;
    }
    const url = x => { const u = URL.createObjectURL(x); box._urls.push(u); return u; };
    let el;
    if (r.active === 'image') { el = new Image(); el.decoding = 'async'; el.src = url(b); el.alt = 'PRAJAPAT character - ' + NAMES[i]; }
    else {
      el = document.createElement('video'); el.muted = el.loop = el.playsInline = true; el.preload = 'metadata';
      el.disablePictureInPicture = true; el.setAttribute('aria-label', 'PRAJAPAT character - ' + NAMES[i]);
      const p = await blob(i, 'poster'); if (p) el.poster = url(p);
      el.dataset.src = url(b);
    }
    el.className = 'character-img' + (cur.classList.contains('idle') ? ' idle' : '');
    cur.replaceWith(el);
    box.style.setProperty('--ar', r.fit === 'cover' ? DEF_AR[i] : m.ar);
    box.style.setProperty('--fe', r.feather);
    box.dataset.fit = r.fit; box.dataset.bg = r.mode === 'auto' ? m.detected : r.mode;
    box.classList.add('has-media'); sync(slide);
  }
  function site() {
    const root = document.getElementById('sections-container'); if (!root) return;
    for (let i = 0; i < N; i++) apply(i);
    new MutationObserver(ms => ms.forEach(m => m.target.matches && m.target.matches('.section-slide') && sync(m.target)))
      .observe(root, { attributes: true, attributeFilter: ['class'], subtree: true });
    bc && (bc.onmessage = e => apply(e.data));
  }

  // ═══ ADMIN PANEL ═══
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const kb = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB';
  const toast = m => { const t = document.getElementById('admin-toast'); if (!t) return; t.textContent = m; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2600); };
  const pick = (t, cb) => { const f = document.createElement('input'); f.type = 'file'; f.accept = t === 'video' ? 'video/mp4,video/webm,.mp4,.webm' : 'image/png,image/jpeg,.png,.jpg,.jpeg'; f.onchange = () => f.files[0] && cb(f.files[0]); f.click(); };
  const opt = (v, l, c) => `<option value="${v}"${v === c ? ' selected' : ''}>${l}</option>`;

  async function draw(c, i) {
    const r = await cfg(i), t = c._t || (r.active !== 'default' ? r.active : 'image'), m = r[t];
    const tb = m && await blob(i, t === 'video' ? 'poster' : 'image'), th = tb ? URL.createObjectURL(tb) : '';
    c.innerHTML = `<h3>${String(i + 1).padStart(2, '0')} · ${NAMES[i]}</h3>
      <div class="mt">${['default', 'image', 'video'].map(k => `<button data-t="${k}" class="${r.active === k ? 'on' : ''}">${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}</div>
      <div class="mi">${th ? `<img src="${th}" alt="">` : '<span></span>'}<p>${m ? esc(m.name) + '<br>' + kb(m.size) + ' · ratio ' + m.ar.toFixed(2) + ' · ' + m.detected : 'No ' + t + ' uploaded'}</p></div>
      <div class="mb"><button data-a="up">${m ? 'Replace' : 'Upload'} ${t}</button><button data-a="rm"${m ? '' : ' disabled'}>Remove ${t}</button><button data-a="rs">Reset to Default</button></div>
      <div class="mo">
        <label>Fit<select data-o="fit">${opt('contain', 'Original ratio (no crop)', r.fit)}${opt('cover', 'Fill character frame (crop)', r.fit)}</select></label>
        <label>Blending<select data-o="mode">${opt('auto', 'Auto', r.mode)}${opt('cutout', 'Transparent cutout', r.mode)}${opt('blend', 'Blend light background', r.mode)}${opt('feather', 'Soft feathered edges', r.mode)}</select></label>
        <label>Edge feather<input type="range" data-o="feather" min="0" max="60" value="${r.feather}"></label></div>`;
  }
  function admin(host) {
    host.innerHTML = '<h2>Center Media — per section</h2><p class="mh">Add a PNG/JPG (transparent PNG best) or MP4/WebM. It inherits the character\'s position, scale, fade, motion and responsive sizing. Changes apply instantly in this browser.</p><div class="mgrid"></div>';
    const g = host.querySelector('.mgrid');
    for (let i = 0; i < N; i++) {
      const c = document.createElement('div'); c.className = 'mc'; g.append(c); draw(c, i);
      c.onclick = async e => {
        const b = e.target.closest('button'); if (!b) return;
        const r = await cfg(i), t = c._t || (r.active !== 'default' ? r.active : 'image');
        if (b.dataset.t) { const k = b.dataset.t; if (k !== 'default') c._t = k; if (k === 'default' || r[k]) { r.active = k; await setCfg(i, r); } }
        else if (b.dataset.a === 'up') {
          pick(t, async f => { try { toast('Processing…'); await upload(i, f); c._t = null; toast('Media applied'); } catch (x) { toast(x.message); } draw(c, i); }); return;
        } else if (b.dataset.a === 'rm') {
          r[t] = null; await del('b' + i + t); if (t === 'video') await del('b' + i + 'poster');
          if (r.active === t) r.active = 'default'; await setCfg(i, r);
        } else if (b.dataset.a === 'rs') {
          await Promise.all(['image', 'video', 'poster'].map(k => del('b' + i + k))); await setCfg(i, { ...DEF }); c._t = null;
        }
        draw(c, i);
      };
      c.onchange = async e => { const o = e.target.dataset.o; if (!o) return; const r = await cfg(i); r[o] = o === 'feather' ? +e.target.value : e.target.value; await setCfg(i, r); };
    }
  }

  document.addEventListener('DOMContentLoaded', () => { const h = document.getElementById('media-admin'); h ? admin(h) : site(); });
})();
