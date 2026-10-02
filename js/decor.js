/* PRAJAPAT — Background line-art layer.
   Minimal futuristic line elements that live in the empty negative space of each section,
   BEHIND the giant word and the character. Pure SVG, GPU-only motion (transform/opacity/stroke-dashoffset).
   Layout data lives in LAYOUT at the bottom: one composition per section, desktop (d) and compact (m). */
(() => {
  const f = n => +n.toFixed(2);
  const RAD = Math.PI / 180;

  /* ---------- tiny generators ---------- */
  const ticks = (cx, cy, r1, r2, n, a0 = 0, a1 = 360, every = 0, r3 = 0) => {
    let d = '';
    for (let i = 0; i < n; i++) {
      const a = (a0 + (a1 - a0) * i / n) * RAD, long = every && i % every === 0, r = long && r3 ? r3 : r2;
      d += `M${f(cx + Math.cos(a) * r1)} ${f(cy + Math.sin(a) * r1)}L${f(cx + Math.cos(a) * r)} ${f(cy + Math.sin(a) * r)}`;
    }
    return `<path d="${d}"/>`;
  };
  const ruler = (len, step, long, short, vertical = true) => {
    let d = '';
    for (let p = 2, i = 0; p <= len; p += step, i++) {
      const l = i % 5 === 0 ? long : short;
      d += vertical ? `M${30 - l} ${p}H30` : `M${p} ${30 - l}V30`;
    }
    return `<path d="${d}" opacity=".7"/>`;
  };
  const dotMatrix = (cols, rows, step, skip, big) => {
    let s = '';
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      if ((i * 7 + j * 3) % skip === 0) continue;
      const b = (i + j) % big === 0;
      s += `<circle cx="${6 + i * step}" cy="${6 + j * step}" r="${b ? 2 : 1}" fill="currentColor" opacity="${b ? .85 : .55}"/>`;
    }
    return s;
  };

  /* ---------- the collection: [viewBoxW, viewBoxH, markup] ---------- */
  const P = {
    /* 1 — angular geometric line structures */
    angular1: [240, 150, `<path class="dr" d="M2 118H58L92 84H158L184 58H238"/><path d="M2 128H62L96 94H132" opacity=".5"/><path d="M158 84v-13l13 13" opacity=".7"/><path d="M2 108v20M238 50v14" opacity=".6"/><rect x="236" y="56" width="4" height="4" fill="currentColor" stroke="none"/>`],
    angular2: [190, 190, `<path class="dr" d="M2 40H62L102 80V186"/><path d="M14 52H58L90 84V150" opacity=".45"/><path d="M122 100l-14 14M134 100l-26 26M146 100l-38 38" opacity=".35"/><circle cx="102" cy="186" r="3"/><path d="M2 30v20" opacity=".6"/>`],
    angular3: [260, 120, `<path class="dr" d="M2 100H66L110 24H258"/><path d="M30 100v12M46 100v8M62 100v4" opacity=".5"/><path d="M126 24v8M142 24v5M158 24v8" opacity=".45"/><path d="M174 24V10h40" opacity=".6"/><circle cx="258" cy="24" r="2" fill="currentColor"/>`],

    /* 2 — futuristic circuit-style paths */
    circuit1: [240, 160, `<path class="dr" d="M2 20H88L118 50H198V122H238"/><path d="M118 50V100H150" opacity=".55"/><rect x="84" y="16" width="8" height="8" opacity=".8"/><circle cx="240" cy="122" r="3.5"/><circle cx="240" cy="122" r="1.2" fill="currentColor"/><circle cx="150" cy="100" r="1.8" fill="currentColor" class="pls"/><path d="M198 50v-14h-20" opacity=".4"/>`],
    circuit2: [170, 230, `<path class="dr" d="M20 4V62L50 92V166H122L152 196V228"/><path d="M50 92H108" opacity=".5"/><circle cx="108" cy="92" r="2" fill="currentColor" class="pls"/><circle cx="20" cy="4" r="3"/><path d="M122 166v-18h-24" opacity=".4"/><rect x="148" y="224" width="8" height="4" opacity=".7"/>`],
    circuit3: [300, 100, `<path class="dr" d="M2 30H84L106 52H190"/><path d="M2 42H76L98 64H190" opacity=".5"/><circle cx="198" cy="52" r="6"/><circle cx="198" cy="52" r="1.8" fill="currentColor"/><path d="M206 52H298" stroke-dasharray="2 5" opacity=".6"/><path d="M98 64V92H140" opacity=".4"/>`],

    /* 3 — thin technical grids and connectors */
    grid1: [200, 140, `<g opacity=".35"><path d="M0 0V140M40 0V140M80 0V140M120 0V140M160 0V140M200 0V140M0 0H200M0 35H200M0 70H200M0 105H200M0 140H200"/></g><path d="M36 35h8M40 31v8M116 70h8M120 66v8M156 105h8M160 101v8M76 105h8M80 101v8" opacity=".9"/><rect class="dr" x="80" y="35" width="40" height="35"/>`, 'fade'],
    grid2: [220, 120, `<path d="M0 10H180M0 30H120M0 50H200M0 70H90M0 90H150M0 110H60" opacity=".4"/><path d="M120 30V50M90 70V90M150 90V110" opacity=".8"/><path class="dr" d="M180 10V2M200 50V42M90 70h60"/><circle cx="180" cy="10" r="2" fill="currentColor"/><circle cx="200" cy="50" r="2" fill="currentColor" class="pls"/><circle cx="150" cy="90" r="2" fill="currentColor"/>`, 'fade'],

    /* 4 — abstract segmented lines */
    seg1: [260, 56, `<path class="mr" style="--len:-140;--dur:70s" d="M0 8H260" stroke-dasharray="34 6 8 6 60 6 14 6"/><path class="mr" style="--len:-102;--dur:90s" d="M0 26H200" stroke-dasharray="10 6 54 6 20 6" opacity=".6"/><path class="mr" style="--len:-92;--dur:110s" d="M0 44H140" stroke-dasharray="70 8 6 8" opacity=".4"/><rect x="256" y="5" width="4" height="6" fill="currentColor" stroke="none"/>`],
    seg2: [36, 210, `<path class="mr" style="--len:-98;--dur:80s" d="M6 0V210" stroke-dasharray="22 5 5 5 44 5 12 5"/><path class="mr" style="--len:-62;--dur:100s" d="M18 0V140" stroke-dasharray="8 6 48 6" opacity=".55"/><path class="mr" style="--len:-60;--dur:120s" d="M30 0V90" stroke-dasharray="6 4 30 4 6 4 10 4" opacity=".4"/>`],

    /* 5 — dots and node patterns */
    nodes1: [200, 130, `<path d="M14 100L48 60L92 84L130 32L172 58L186 112M92 84L110 120" opacity=".45"/><g fill="currentColor" stroke="none"><circle cx="14" cy="100" r="2"/><circle cx="48" cy="60" r="2"/><circle cx="92" cy="84" r="2.2" class="pls"/><circle cx="130" cy="32" r="1.6"/><circle cx="172" cy="58" r="2"/><circle cx="186" cy="112" r="1.6"/><circle cx="110" cy="120" r="1.6"/></g><circle cx="130" cy="32" r="7" class="dr" opacity=".9"/>`],
    nodes2: [150, 120, dotMatrix(8, 6, 20, 5, 9)],
    nodes3: [120, 120, `<path d="M10 10L60 40L100 20M60 40L50 100" opacity=".4"/><circle cx="10" cy="10" r="1.8" fill="currentColor"/><circle cx="60" cy="40" r="4"/><circle cx="60" cy="40" r="1.2" fill="currentColor" class="pls"/><circle cx="100" cy="20" r="1.8" fill="currentColor"/><circle cx="50" cy="100" r="1.8" fill="currentColor"/><circle cx="110" cy="96" r="1.2" fill="currentColor"/><circle cx="24" cy="70" r="1.2" fill="currentColor"/>`],

    /* 6 — corner-frame elements (flippable) */
    corner1: [170, 130, `<path class="dr" d="M1 56V1H70"/><path d="M12 44V12H46" opacity=".5"/><rect x="1" y="1" width="6" height="6" fill="currentColor" stroke="none"/><path d="M84 1H150" stroke-dasharray="3 5" opacity=".6"/><path d="M1 70V120" stroke-dasharray="3 5" opacity=".6"/><path d="M1 18h6M1 30h4M1 42h6M30 1v6M42 1v4M54 1v6" opacity=".7"/>`],
    corner2: [200, 200, `<path class="dr" d="M1 90V1H110L128 19H196"/><path d="M12 78V12H104" opacity=".45"/><circle cx="196" cy="19" r="3"/><path d="M1 120V150" opacity=".6"/><rect x="1" y="160" width="4" height="4" fill="currentColor" stroke="none"/>`],
    corner3: [150, 150, `<path class="dr" d="M1 60V1H60"/><path d="M149 90V149H90" opacity=".8"/><rect x="22" y="22" width="106" height="106" stroke-dasharray="1 6" opacity=".35"/><path d="M75 68v14M68 75h14" opacity=".7"/>`],

    /* 7 — floating geometric accents (slow rotation) */
    float1: [90, 90, `<g class="rot" style="--rd:140s"><path d="M45 2L88 45L45 88L2 45Z"/></g><g class="rot rev" style="--rd:100s"><path d="M45 24L66 45L45 66L24 45Z" opacity=".6"/></g><circle cx="45" cy="45" r="1.4" fill="currentColor"/>`],
    float2: [80, 92, `<g class="rot" style="--rd:180s"><path d="M40 2L77 23V69L40 90L3 69V23Z"/><path d="M40 26L58 36V56L40 66L22 56V36Z" opacity=".5"/></g><circle cx="40" cy="46" r="1.4" fill="currentColor"/>`],
    float3: [70, 64, `<g class="rot" style="--rd:160s"><path d="M35 2L68 62H2Z"/><path d="M35 26L52 56H18Z" opacity=".5"/></g>`],
    float4: [64, 64, `<g class="rot" style="--rd:200s"><path d="M10 2H54L62 10V54H10Z"/><path d="M32 18V46M18 32H46" opacity=".6"/></g>`],

    /* 8 — minimal HUD-inspired shapes */
    hud1: [220, 220, `<circle cx="110" cy="110" r="104" opacity=".3"/><g class="rot" style="--rd:260s">${ticks(110, 110, 100, 95, 72, 0, 360, 6, 90)}</g><circle class="rot rev" style="--rd:190s" cx="110" cy="110" r="82" stroke-dasharray="60 12 14 12 150 12 30 12" opacity=".7"/><circle cx="110" cy="110" r="58" opacity=".35"/><circle class="rot" style="--rd:140s" cx="110" cy="110" r="40" stroke-dasharray="2 6" opacity=".6"/><path d="M110 98v24M98 110h24" opacity=".6"/><path d="M110 2v8M110 210v8M2 110h8M210 110h8" opacity=".8"/>`],
    hud2: [240, 130, `<path d="M20 120A100 100 0 0 1 220 120" opacity=".5"/><path d="M36 120A84 84 0 0 1 204 120" stroke-dasharray="3 6" opacity=".5"/>${ticks(120, 120, 100, 94, 20, 180, 360, 5, 88).replace('<path ', '<path opacity=".7" ')}<g class="sway" style="transform-origin:120px 120px"><path d="M120 120V56" class="ac"/><path d="M116 62L120 50L124 62Z" fill="currentColor"/></g><circle cx="120" cy="120" r="4"/><path d="M0 121H240" opacity=".25"/>`],
    hud3: [170, 60, `<path d="M1 1H10M1 1V59M1 59H10" opacity=".8"/><path d="M14 50H162" opacity=".5"/><path d="M20 50V36M29 50V26M38 50V40M47 50V18M56 50V32M65 50V44M74 50V22M83 50V38M92 50V30M101 50V46M110 50V24M119 50V36M128 50V42M137 50V28M146 50V40M155 50V34" opacity=".55"/><path class="eq" style="--dl:0s" d="M47 50V18M110 50V24"/><path class="eq" style="--dl:-4s" d="M74 50V22M137 50V28"/>`],

    /* 9 — asymmetric line compositions */
    asym1: [280, 140, `<path d="M2 104H278" opacity=".45"/><path class="dr ac" style="stroke-width:2" d="M40 104H128"/><path class="dr" d="M128 104L158 54H262"/><circle cx="262" cy="54" r="3"/><rect x="196" y="98" width="12" height="12"/><path d="M70 104v10M82 104v6M94 104v10M106 104v6" opacity=".5"/><path d="M2 96v16" opacity=".8"/>`],
    asym2: [150, 230, `<path d="M20 2V228" opacity=".4"/><path class="dr ac" style="stroke-width:2" d="M20 40V120"/><path class="dr" d="M20 120L50 150V222"/><path d="M20 43H60" opacity=".6"/><rect x="60" y="36" width="40" height="14"/><circle cx="50" cy="222" r="2.4" fill="currentColor"/><path d="M20 170h-10M20 182h-6M20 194h-10" opacity=".5"/>`],

    /* 10 — small technical decorative marks */
    marks1: [130, 60, `<circle cx="10" cy="12" r="5"/><path d="M10 3v18M1 12h18" opacity=".8"/><path d="M51 7l10 10M61 7l-10 10"/><circle cx="102" cy="16" r="8" opacity=".8"/><path d="M102 4v24M90 16h24" opacity=".6"/><path d="M2 46v8M14 48v6M26 48v6M38 46v8M50 48v6M62 48v6M74 46v8M86 48v6M98 48v6M110 46v8M122 48v6" opacity=".55"/>`],
    marks2: [90, 90, `<path d="M10 10L50 30L80 70" stroke-dasharray="2 6" opacity=".35"/><path d="M4 10h12M10 4v12M44 30h12M50 24v12M76 70h8M80 66v8M24 76h12M30 70v12" opacity=".8"/>`],
    marks3: [100, 40, `<path d="M2 4H10V36H2M98 4H90V36H98" opacity=".8"/><circle cx="22" cy="20" r="1.8" fill="currentColor" class="pls"/><path d="M34 20H48M54 20H58M64 20H78" opacity=".7"/>`],
    ruler1: [40, 200, `<path d="M30 2V198" opacity=".5"/>${ruler(198, 8, 20, 9)}<g class="scan"><path d="M0 -4L9 0L0 4Z" fill="currentColor" stroke="none"/><path d="M10 0H30" opacity=".7"/></g>`],
    ruler2: [200, 40, `<path d="M2 30H198" opacity=".5"/>${ruler(198, 8, 20, 9, false)}<g class="scanx"><path d="M0 0L-4 -9L4 -9Z" fill="currentColor" stroke="none" transform="translate(0 4)"/><path d="M0 -10V30" opacity=".7"/></g>`],
    hud4: [200, 110, `<path class="dr" d="M10 104A92 92 0 0 1 102 12"/><path d="M28 104A74 74 0 0 1 102 30" stroke-dasharray="4 6" opacity=".55"/><path d="M102 12H150M102 30H130" opacity=".5"/><path d="M102 12v9M10 104h9" opacity=".8"/><rect x="154" y="8" width="38" height="8" opacity=".6"/><circle cx="102" cy="12" r="2" fill="currentColor" class="pls"/>`],
    wave: [260, 60, `<path d="M0 30H260" opacity=".25"/><path class="dr" d="M0 30H40L52 10L66 50L80 20L92 36H150L160 26L172 40H258"/><circle cx="258" cy="40" r="2.2" fill="currentColor" class="pls"/><path d="M0 26v8M130 26v8" opacity=".5"/>`],
    reticle: [90, 90, `<circle cx="45" cy="45" r="26" opacity=".6"/><path d="M45 4v22M45 64v22M4 45h22M64 45h22" opacity=".8"/><circle cx="45" cy="45" r="1.6" fill="currentColor"/><g class="rot" style="--rd:220s"><path d="M45 12a33 33 0 0 1 28.6 16.5"/></g>`],
    chev: [92, 30, `<path class="cv" style="--dl:0s" d="M4 4L16 15L4 26"/><path class="cv" style="--dl:.7s" d="M22 4L34 15L22 26"/><path class="cv" style="--dl:1.4s" d="M40 4L52 15L40 26"/><path d="M64 15H90" opacity=".5"/>`]
  };

  /* ---------- composition per section ----------
     d = desktop {x,y: % of slide, s: scale, f: flip 'x'|'y'|'xy', p: parallax px, m: float motion id, t: seconds, o: delay, dd: draw cycle s}
     c = compact (phones / portrait tablets) – fewer, smaller pieces                                     */
  const LAYOUT = [
    /* 00 HERO */
    { d: [
      ['angular1', { x: 5, y: 51, s: .8, m: 1, t: 34, p: 8 }],
      ['marks2',   { x: 9, y: 63, s: .8, m: 3, t: 41, p: 6 }],
      ['seg1',     { x: 24, y: 6.4, s: .7, m: 2, t: 47, p: 5 }],
      ['corner1',  { x: 81, y: 40, s: .85, m: 4, t: 38, p: 10 }],
      ['float1',   { x: 77, y: 56, s: .62, m: 5, t: 29, p: 14 }],
      ['nodes1',   { x: 85, y: 55, s: .6, m: 2, t: 44, p: 9 }],
      ['ruler1',   { x: 2.4, y: 30, s: .55, m: 3, t: 52, p: 4 }],
    ], c: [
      ['circuit3', { x: 58, y: 8, s: .5, m: 1, t: 36, p: 5 }],
      ['marks3',   { x: 66, y: 22, s: .6, m: 3, t: 44, p: 4 }],
      ['corner1',  { x: 72, y: 32, s: .5, m: 4, t: 40, p: 4, f: 'x' }],
    ]},
    /* 01 WORK */
    { d: [
      ['circuit1', { x: 3.6, y: 38, s: .66, m: 2, t: 40, p: 8 }],
      ['nodes3',   { x: 80, y: 13, s: .85, m: 4, t: 36, p: 10 }],
      ['angular3', { x: 74, y: 33, s: .78, m: 1, t: 45, p: 7 }],
      ['marks1',   { x: 74, y: 46, s: .8, m: 5, t: 33, p: 6 }],
      ['float4',   { x: 27, y: 10, s: .6, m: 3, t: 31, p: 12 }],
    ], c: [
      ['float2',   { x: 82, y: 4, s: .45, m: 3, t: 33, p: 6 }],
      ['seg1',     { x: 58, y: 45.5, s: .55, m: 2, t: 48, p: 4 }],
      ['marks1',   { x: 6, y: 45, s: .6, m: 5, t: 37, p: 4 }],
    ]},
    /* 02 EXPERIENCE */
    { d: [
      ['hud2',     { x: 4.6, y: 38, s: .7, m: 3, t: 42, p: 8 }],
      ['grid1',    { x: 77, y: 12, s: .9, m: 2, t: 50, p: 6 }],
      ['corner3',  { x: 79, y: 33, s: .6, m: 1, t: 36, p: 9 }],
      ['chev',     { x: 31, y: 15, s: .8, m: 5, t: 30, p: 8 }],
      ['seg2',     { x: 94, y: 56, s: .6, m: 4, t: 56, p: 3 }],
    ], c: [
      ['grid2',    { x: 64, y: 6.5, s: .38, m: 2, t: 46, p: 4 }],
      ['chev',     { x: 6, y: 45, s: .7, m: 5, t: 30, p: 4 }],
      ['float3',   { x: 85, y: 44, s: .5, m: 4, t: 35, p: 6 }],
    ]},
    /* 03 SOFTWARE */
    { d: [
      ['angular2', { x: 77, y: 12, s: .75, m: 4, t: 39, p: 8 }],
      ['hud1',     { x: 80, y: 40, s: .8, m: 2, t: 55, p: 5 }],
      ['marks3',   { x: 5, y: 41, s: .85, m: 3, t: 34, p: 7 }],
      ['nodes2',   { x: 30, y: 10, s: .62, m: 1, t: 47, p: 8 }],
    ], c: [
      ['corner2',  { x: 70, y: 5.2, s: .32, m: 4, t: 41, p: 4, f: 'x' }],
      ['marks2',   { x: 7, y: 45, s: .55, m: 3, t: 38, p: 4 }],
      ['seg1',     { x: 4, y: 49, s: .5, m: 2, t: 52, p: 3 }],
    ]},
    /* 04 SOCIAL */
    { d: [
      ['circuit2', { x: 79, y: 12, s: .7, m: 1, t: 43, p: 8 }],
      ['reticle',  { x: 5, y: 44, s: .8, m: 3, t: 40, p: 6 }],
      ['float2',   { x: 27, y: 9, s: .7, m: 5, t: 28, p: 12 }],
      ['seg1',     { x: 74, y: 49, s: .75, m: 2, t: 49, p: 5 }],
    ], c: [
      ['nodes3',   { x: 68, y: 5, s: .45, m: 4, t: 37, p: 5 }],
      ['ruler2',   { x: 6, y: 46, s: .7, m: 2, t: 50, p: 3 }],
      ['float1',   { x: 86, y: 45, s: .4, m: 5, t: 32, p: 6 }],
    ]},
    /* 05 HIRE */
    { d: [
      ['asym1',    { x: 4, y: 33, s: .8, m: 2, t: 44, p: 8 }],
      ['corner2',  { x: 78, y: 12, s: .75, m: 4, t: 38, p: 9, f: 'x' }],
      ['wave',     { x: 76, y: 36, s: .85, m: 1, t: 46, p: 6 }],
      ['hud4',     { x: 76, y: 55, s: .8, m: 3, t: 41, p: 7 }],
      ['float3',   { x: 31, y: 9, s: .65, m: 5, t: 30, p: 12 }],
      ['marks1',   { x: 5, y: 57, s: .8, m: 4, t: 35, p: 5 }],
    ], c: [
      ['asym1',    { x: 54, y: 8, s: .45, m: 2, t: 44, p: 4 }],
      ['hud3',     { x: 62, y: 38, s: .6, m: 3, t: 36, p: 4 }],
      ['float4',   { x: 82, y: 14, s: .45, m: 5, t: 34, p: 6 }],
    ]}
  ];

  /* ---------- build ---------- */
  const mk = (name, o, mode) => {
    const def = P[name]; if (!def || !o.s) return '';
    const [w, h, body, cls] = def;
    const width = f(w * o.s / 14.4);                       // in --u units (≈ px on a 1440 wide screen)
    const markup = body.replace(/class="dr/g, 'pathLength="1" class="dr');
    const st = [`--${mode}x:${o.x}%`, `--${mode}y:${o.y}%`, `--${mode}w:${width}`, `--k:${o.p || 8}`];
    const fl = o.f ? ` style="scale:${/x/.test(o.f) ? -1 : 1} ${/y/.test(o.f) ? -1 : 1}"` : '';
    const rnd = (a, b) => f(a + ((name.length * 7 + o.x * 3 + o.y) % 10) / 10 * (b - a));
    const an = `--an:fl${o.m || 1};--t:${o.t || 36}s;--dl:${-rnd(0, o.t || 36)}s;--dd:${rnd(20, 34)}s;--ddl:${-rnd(0, 20)}s`;
    return `<div class="pd" data-p="${name}" style="${st.join(';')}"><div class="pc ${cls || ''}" style="${an}"><div class="pf"${fl}><svg viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false">${markup}</svg></div></div></div>`;
  };

  function build() {
    document.querySelectorAll('.section-slide').forEach(slide => {
      if (slide.querySelector(':scope > .decor')) return;
      const i = +slide.dataset.index, L = LAYOUT[i]; if (!L) return;
      const el = document.createElement('div');
      el.className = 'decor'; el.setAttribute('aria-hidden', 'true');
      el.innerHTML = L.d.map(([n, o]) => mk(n, o, 'a')).join('') + L.c.map(([n, o]) => mk(n, o, 'b')).join('').replace(/class="pd"/g, 'class="pd pm"');
      slide.insertBefore(el, slide.firstChild);
    });
  }

  const go = () => build();
  if (document.querySelector('.section-slide')) go();
  else document.addEventListener('DOMContentLoaded', () => setTimeout(go, 0));
  window.__decorBuild = build;
})();
