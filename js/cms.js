/* PRAJAPAT — content layer: defaults, storage, and public rendering into the existing markup/classes */
(() => {
  const KEY = 'prajapat_cms_v2';
  const D = {
    hero: { title: 'VIDEO EDITOR', sub: 'BATTLE WITH KEYFRAMES', tag: 'I turn every frame into a feeling.', role: 'VIDEO EDITOR / VFX', status: 'AVAILABLE' },
    work: [
      { t: 'LONG-FORM VIDEO EDITING', d: 'Podcast Editing · Gaming Video Editing · YouTube / Educational Video Editing' },
      { t: 'SHORT-FORM VIDEO', d: 'Reels, Shorts and social-focused fast-paced editing.' },
      { t: 'GFX DESIGN', d: 'Motion graphics, titles, overlays and visual graphics.' },
      { t: 'DOCUMENTARY EDITING', d: 'Story-driven documentary editing, pacing, structure and cinematic presentation.' }],
    exp: [{ n: '7+', l: 'YEARS EDITING EXPERIENCE' }, { n: '98%', l: 'CLIENT SATISFACTION' }, { n: '150+', l: 'CLIENTS / PROJECTS' }, { n: '50M+', l: 'REACH GENERATED' }],
    sw: [
      { n: 'Adobe After Effects', ab: 'Ae', bg: '#00005B', fg: '#9999FF', badge: '', logo: '' },
      { n: 'Adobe Premiere Pro', ab: 'Pr', bg: '#00005B', fg: '#9999FF', badge: '', logo: '' },
      { n: 'Adobe Photoshop', ab: 'Ps', bg: '#001E36', fg: '#31A8FF', badge: '', logo: '' },
      { n: 'Alight Motion', ab: 'Am', bg: '#1A1A2E', fg: '#E94560', badge: 'FOR MOBILE', logo: '' }],
    soc: [{ n: 'Instagram', url: '', ic: 'instagram', logo: '' }, { n: 'YouTube Channel 01', url: '', ic: 'youtube', logo: '' }, { n: 'YouTube Channel 02', url: '', ic: 'youtube', logo: '' }, { n: 'Telegram', url: '', ic: 'telegram', logo: '' }],
    hire: { email: '', waNum: '', waLink: '', cta: 'START A PROJECT', cta2: "LET'S WORK TOGETHER", action: 'whatsapp' }
  };
  const raw = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
  const load = () => ({ ...structuredClone(D), ...raw() });
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safe = u => { u = (u || '').trim(); return !u ? '' : /^(https?:|mailto:|tel:)/i.test(u) ? u : /^[\w-]+(\.[\w-]+)+/.test(u) ? 'https://' + u : ''; };
  const L = 'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';
  const IC = {
    instagram: `<svg viewBox="0 0 24 24" ${L}><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
    youtube: `<svg viewBox="0 0 24 24" ${L}><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.16 1 12 1 12s0 3.84.46 5.58a2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.84 23 12 23 12s0-3.84-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>`,
    telegram: `<svg viewBox="0 0 24 24" ${L}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
    tiktok: `<svg viewBox="0 0 24 24" ${L}><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.4 2.6 2.1 4.2 5 4.4"/></svg>`,
    x: `<svg viewBox="0 0 24 24" ${L}><path d="M4 4l16 16M20 4L4 20"/></svg>`,
    link: `<svg viewBox="0 0 24 24" ${L}><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>`
  };
  window.CMS = { KEY, D, load, raw, IC };

  function site() {
    const root = document.getElementById('sections-container'); if (!root) return;
    const c = load(), saved = raw(), q = s => document.querySelector(s), h = c.hire;
    const wa = safe(h.waLink) || (h.waNum ? 'https://wa.me/' + h.waNum.replace(/\D/g, '') : '');
    const mail = h.email ? 'mailto:' + h.email.trim() : '';

    if (saved.hero) {
      const H = c.hero;
      q('.hero-title').innerHTML = esc(H.title).split(' ').join('<br>');
      q('.hero-title-sub').textContent = H.sub; q('.hero-tagline p').textContent = H.tag;
      q('.hero-meta-role').textContent = H.role; q('.hero-meta-status').textContent = H.status;
      const s = q('.section-slide[data-index="0"]'); s.classList.remove('reveal'); // re-run the word reveal
    }
    const cards = c.work.map((w, i) => `<div class="work-card"><div class="work-card-number">${String(i + 1).padStart(2, '0')}</div><h3 class="work-card-title">${esc(w.t)}</h3><p class="work-card-desc">${esc(w.d)}</p></div>`);
    const half = Math.ceil(cards.length / 2);
    q('.work-left').innerHTML = cards.slice(0, half).join(''); q('.work-right').innerHTML = cards.slice(half).join('');
    q('.stats-grid').innerHTML = c.exp.map(e => `<div class="stat-block"><div class="stat-number">${esc(e.n)}</div><div class="stat-label">${esc(e.l)}</div></div>`).join('');
    q('.software-list').innerHTML = c.sw.map(s => `<div class="software-item"><div class="software-icon">${s.logo ? `<img src="${esc(s.logo)}" alt="">` : `<svg viewBox="0 0 36 36"><rect width="36" height="36" rx="6" fill="${esc(s.bg)}"/><text x="18" y="24" text-anchor="middle" fill="${esc(s.fg)}" font-size="14" font-weight="700">${esc(s.ab)}</text></svg>`}</div><span class="software-name">${esc(s.n)}</span>${s.badge ? `<span class="software-badge">${esc(s.badge)}</span>` : ''}</div>`).join('');
    q('.social-grid').innerHTML = c.soc.map(s => { const u = safe(s.url); return `<a class="social-card" ${u ? `href="${esc(u)}" target="_blank" rel="noopener noreferrer"` : 'href="#"'} aria-label="${esc(s.n)}"><div class="social-card-icon">${s.logo ? `<img src="${esc(s.logo)}" alt="">` : (IC[s.ic] || IC.link)}</div><span class="social-card-name">${esc(s.n)}</span></a>`; }).join('');

    q('.cta-primary .cta-text').textContent = h.cta; q('.cta-secondary').textContent = h.cta2;
    const go = u => u && window.open(u, '_blank', 'noopener');
    const act = () => h.action === 'email' ? mail : wa;
    q('.cta-primary').onclick = () => { const u = act(); u.startsWith('mailto:') ? (location.href = u) : go(u); };
    q('.cta-secondary').href = act() || '#'; q('.cta-secondary').target = act().startsWith('http') ? '_blank' : '';
    const em = q('.hire-email'), w = q('.hire-whatsapp');
    em.style.display = mail ? '' : 'none'; w.style.display = wa ? '' : 'none';
    em.querySelector('.contact-text').textContent = h.email; w.querySelector('.contact-text').textContent = h.waNum || 'Chat on WhatsApp';
    em.onclick = () => (location.href = mail); w.onclick = () => go(wa);
    // the name opens admin — no visual hint for visitors
    const b = q('.topbar-brand'); b.style.pointerEvents = 'auto'; b.onclick = () => (location.href = 'admin.html');
  }
  async function syncFromCloud() {
    if (!window.CMS_DOC) return; // firebase-init.js didn't load (e.g. offline on first paint)
    try {
      const snap = await CMS_DOC().get();
      if (snap.exists) {
        localStorage.setItem(KEY, JSON.stringify(snap.data()));
        site(); // re-render with the freshest cloud data
      }
    } catch (e) { /* offline / blocked — keep showing the local cache */ }
  }
  window.CMS.syncFromCloud = syncFromCloud;
  document.addEventListener('DOMContentLoaded', () => { site(); syncFromCloud(); });
})();
