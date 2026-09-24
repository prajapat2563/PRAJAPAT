/* PRAJAPAT — hero character A ⇄ B with a short, controlled digital glitch (RGB split, band tearing, scanlines).
   Swaps the src of the existing hero <img>, so parallax, float, mask and slide motion are untouched. */
(() => {
  const A = 'assets/characters/hero.webp', B = 'assets/characters/hero-b.webp';
  const HOLD = 4600;
  // [displacement, RGB split, scanline opacity] per frame (~60ms): three controlled hits, swap at the peak
  const F = [[0, 0, 0], [8, 2, .25], [22, 6, .5], [6, 3, .3], [34, 9, .6, 1], [12, 4, .45], [26, 6, .35], [5, 2, .2], [0, 0, 0]];
  const SW = 4, STEP = 62;
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;

  document.addEventListener('DOMContentLoaded', () => {
    const slide = document.querySelector('.section-slide[data-index="0"]'); if (!slide) return;
    const box = slide.querySelector('.character-container');
    document.body.insertAdjacentHTML('beforeend', `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="pg" x="-6%" y="-2%" width="112%" height="104%" color-interpolation-filters="sRGB">
      <feTurbulence id="pg-n" type="fractalNoise" baseFrequency="0 .045" numOctaves="2" seed="3" result="n"/>
      <feDisplacementMap id="pg-d" in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feColorMatrix in="d" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/><feOffset id="pg-r" in="r" dx="0" result="ro"/>
      <feColorMatrix in="d" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g"/>
      <feColorMatrix in="d" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b"/><feOffset id="pg-b" in="b" dx="0" result="bo"/>
      <feBlend in="ro" in2="g" mode="screen" result="rg"/><feBlend in="rg" in2="bo" mode="screen"/></filter></svg>`);
    const $ = id => document.getElementById(id), n = $('pg-n'), d = $('pg-d'), r = $('pg-r'), b = $('pg-b');
    const imgB = new Image(); imgB.src = B;
    let showB = false, busy = false;

    const ready = () => box && !box.classList.contains('has-media') && slide.classList.contains('active') && !document.hidden;
    function glitch() {
      const img = box.querySelector('.character-img'), k = Math.max(.5, img.clientWidth / 600);
      busy = true; box.style.setProperty('--gm', `url("${img.src}")`); box.classList.add('gl');
      let i = 0;
      (function step() {
        const [ds, sp, sc, swap] = F[i];
        if (i === SW) { showB = !showB; img.src = showB ? B : A; }
        n.setAttribute('seed', 3 + i * 7); d.setAttribute('scale', ds * k);
        r.setAttribute('dx', -sp * k); b.setAttribute('dx', sp * k); box.style.setProperty('--sc', sc);
        img.style.filter = ds ? 'url(#pg)' : '';
        if (++i < F.length) return setTimeout(step, STEP);
        img.style.filter = ''; box.classList.remove('gl'); busy = false;
      })();
    }
    (function loop() { setTimeout(() => { if (imgB.decode) imgB.decode().catch(() => {}); if (ready() && !busy) glitch(); loop(); }, HOLD); })();
  });
})();
