/* PRAJAPAT — smooth FX layer: whole-word text reveal, giant word fit, soft parallax */
(() => {
  const WORDS = ['PRAJAPAT', 'WORK', 'EXPERIENCE', 'SOFTWARE', 'SOCIAL', 'HIRE'];
  const SEL = '.hero-title,.hero-title-sub,.hero-tagline p,.hero-meta-label,.hero-meta-value,.section-title,.section-number,.work-card-title,.work-card-desc,.stat-label,.software-name,.social-card-name,.hire-contact-label,.contact-text,.cta-text,.cta-secondary,.work-card-number';
  const slides = () => [...document.querySelectorAll('.section-slide')];

  // Wrap every WORD (never letters) in a mask so words slide up whole
  function wrap(el) {
    if (el.querySelector('.w')) return;
    let i = 0;
    (function walk(n) {
      [...n.childNodes].forEach(c => {
        if (c.nodeType === 3) {
          const f = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(p => {
            if (!p) return;
            if (/^\s+$/.test(p)) return f.append(' ');
            const w = document.createElement('span'), s = document.createElement('span');
            w.className = 'w'; s.textContent = p; s.style.transitionDelay = (i++ * 55) + 'ms';
            w.append(s); f.append(w);
          });
          c.replaceWith(f);
        } else if (c.nodeType === 1) walk(c);
      });
    })(el);
  }

  function activate(s) {
    s.querySelectorAll(SEL).forEach(wrap);
    if (s._p) return;
    s._p = 1;
    setTimeout(() => { s._p = 0; if (s.classList.contains('active')) s.classList.add('reveal'); }, 300);
  }

  new MutationObserver(ms => ms.forEach(m => {
    const s = m.target;
    if (!s.matches || !s.matches('.section-slide')) return;
    const on = s.classList.contains('active');
    if (on && !s.classList.contains('reveal')) activate(s);
    if (!on && s.classList.contains('reveal')) s.classList.remove('reveal');
  })).observe(document.getElementById('sections-container'), { attributes: true, attributeFilter: ['class'], subtree: true });

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
  slides().forEach(s => s.classList.contains('active') && activate(s));
})();
