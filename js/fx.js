/* PRAJAPAT — FX layer: SaaS-style text motion (blur + rise + stagger, count-up numbers), giant word fit, soft parallax */
(() => {
  const WORDS = ['PRAJAPAT', 'WORK', 'EXPERIENCE', 'SOFTWARE', 'SOCIAL', 'HIRE'];
  const HEAD = '.hero-title,.section-title';
  const NUM = '.stat-number';
  const SEL = HEAD + ',' + NUM + ',.hero-title-sub,.hero-tagline p,.hero-meta-label,.hero-meta-value,.section-number,.work-card-number,.work-card-title,.work-card-desc,.stat-label,.software-name,.software-badge,.social-card-name,.hire-contact-label,.contact-text,.cta-text,.cta-secondary';
  const RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const root = document.getElementById('sections-container');
  const slides = () => [...document.querySelectorAll('.section-slide')];

  // Wrap every WORD (never letters) so each one animates as a unit
  function wrap(el) {
    (function walk(n) {
      [...n.childNodes].forEach(c => {
        if (c.nodeType === 3) {
          const f = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(p => {
            if (!p) return;
            if (/^\s+$/.test(p)) return f.append(' ');
            const w = document.createElement('span'), s = document.createElement('span');
            w.className = 'w'; s.textContent = p; w.append(s); f.append(w);
          });
          c.replaceWith(f);
        } else if (c.nodeType === 1) walk(c);
      });
    })(el);
  }

  // Stat numbers become a single unit that counts up: "98%" -> 0..98 + "%"
  function prepNum(el) {
    const t = el.textContent.trim(), m = t.match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/);
    if (!m) return false;
    el.dataset.cu = '1'; el.dataset.pre = m[1]; el.dataset.to = m[2].replace(/,/g, ''); el.dataset.suf = m[3];
    el.dataset.comma = /,/.test(m[2]) ? '1' : '';
    el.setAttribute('aria-label', t);
    const w = document.createElement('span'), s = document.createElement('span');
    w.className = 'w'; s.setAttribute('aria-hidden', 'true'); s.textContent = t; w.append(s);
    el.replaceChildren(w);
    return true;
  }

  function count(el) {
    if (!el.dataset.cu) return;
    const out = el.querySelector('.w>span'), to = parseFloat(el.dataset.to), pre = el.dataset.pre, suf = el.dataset.suf;
    const dec = (el.dataset.to.split('.')[1] || '').length;
    const fmt = v => pre + (el.dataset.comma ? Math.round(v).toLocaleString('en-US') : v.toFixed(dec)) + suf;
    cancelAnimationFrame(el._r);
    if (RM) { out.textContent = fmt(to); return; }
    const t0 = performance.now() + (+el.dataset.delay || 0), dur = 1600;
    (function tick(now) {
      const p = Math.min(Math.max((now - t0) / dur, 0), 1);
      out.textContent = fmt(to * (1 - Math.pow(1 - p, 4)));
      if (p < 1) el._r = requestAnimationFrame(tick);
    })(performance.now());
  }

  // Orchestrate: headlines word-by-word, everything else as soft staggered blocks
  function stagger(list) {
    let cur = 0;
    list.forEach(el => {
      const ws = el.querySelectorAll('.w>span');
      if (!ws.length) return;
      const head = el.matches(HEAD), step = head ? 70 : 14;
      ws.forEach((x, i) => x.style.setProperty('--d', Math.min(cur + i * step, 1500) + 'ms'));
      el.dataset.delay = cur;
      cur = Math.min(cur + (head ? Math.min(ws.length * 70, 420) * .6 + 60 : 80), 1100);
    });
  }

  // Wrap any text that isn't prepared yet (also runs when the CMS re-renders content)
  function prep(s) {
    const late = s.classList.contains('reveal'), fresh = [];
    s.querySelectorAll(SEL).forEach(el => {
      if (el.dataset.cu || el.querySelector('.w') || !el.textContent.trim()) return;
      if (!(el.matches(NUM) && prepNum(el))) wrap(el);
      fresh.push(el);
    });
    if (!fresh.length) return;
    stagger(late ? fresh : [...s.querySelectorAll(SEL)]);
    if (late) { // slide already visible: animate only the new text in
      fresh.forEach(el => el.classList.add('pre'));
      void s.offsetWidth;
      requestAnimationFrame(() => requestAnimationFrame(() => fresh.forEach(el => { el.classList.remove('pre'); count(el); })));
    }
  }

  function activate(s) {
    prep(s);
    if (s._p) return;
    s._p = 1;
    setTimeout(() => {
      s._p = 0;
      if (!s.classList.contains('active')) return;
      s.classList.add('reveal');
      s.querySelectorAll('[data-cu]').forEach(count);
    }, 300);
  }

  new MutationObserver(ms => {
    const touched = new Set();
    ms.forEach(m => {
      const s = m.target.closest && m.target.closest('.section-slide');
      if (!s) return;
      if (m.type === 'attributes') {
        if (m.target !== s) return;
        const on = s.classList.contains('active');
        if (on && !s.classList.contains('reveal')) activate(s);
        if (!on && s.classList.contains('reveal')) s.classList.remove('reveal');
      } else touched.add(s);
    });
    touched.forEach(prep);
  }).observe(root, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });

  // Section counter: digit rolls in on change
  const cur = document.querySelector('.nav-counter .current');
  if (cur) new MutationObserver(() => { cur.classList.remove('tick'); void cur.offsetWidth; cur.classList.add('tick'); }).observe(cur, { childList: true });

  // Fit the giant background word so it always shows completely
  function fit() {
    const m = document.createElement('span');
    m.style.cssText = 'position:fixed;left:-9999px;white-space:nowrap;font:800 100px/1 Archivo,"Inter Tight",Arial;font-stretch:125%;letter-spacing:-.03em';
    document.body.append(m);
    const max = innerWidth * (innerWidth < 820 ? .88 : .84);
    slides().forEach((s, i) => {
      m.textContent = WORDS[i];
      s.dataset.word = WORDS[i];
      s.style.setProperty('--wfs', Math.min(100 * max / m.getBoundingClientRect().width, innerHeight * .34) + 'px');
    });
    m.remove();
  }

  // Soft parallax (eased with rAF)
  let tx = 0, ty = 0, x = 0, y = 0;
  addEventListener('pointermove', e => { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; }, { passive: true });
  (function loop() {
    x += (tx - x) * .06; y += (ty - y) * .06;
    document.documentElement.style.setProperty('--mx', x.toFixed(3));
    document.documentElement.style.setProperty('--my', y.toFixed(3));
    requestAnimationFrame(loop);
  })();

  fit();
  addEventListener('resize', fit);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit);
  slides().forEach(s => { prep(s); s.classList.contains('active') && activate(s); });
})();
