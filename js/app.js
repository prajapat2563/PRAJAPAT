/**
 * PRAJAPAT Portfolio — Core Navigation Engine
 * Full-screen cinematic slide/state system with character transitions
 * Zero dependencies — pure vanilla JS
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ═══════════════════════════════════════
  // 1. State Management
  // ═══════════════════════════════════════
  const APP = {
    currentSection: 0,
    totalSections: 6,
    isTransitioning: false,
    touchStartX: 0,
    touchStartY: 0,
    sections: ['hero', 'work', 'experience', 'software', 'social', 'hire'],
    characterImages: [
      'assets/characters/hero.webp',
      'assets/characters/work.webp',
      'assets/characters/experience.webp',
      'assets/characters/software.webp',
      'assets/characters/social.webp',
      'assets/characters/hire.webp'
    ]
  };

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ═══════════════════════════════════════
  // 2. Initialization
  // ═══════════════════════════════════════
  initSections();
  preloadImages();
  initNavigation();
  showSection(0);
  updateCounter();
  loadCMSData();

  // ═══════════════════════════════════════
  // 3. Preload Images
  // ═══════════════════════════════════════
  function preloadImages() {
    APP.characterImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }

  // ═══════════════════════════════════════
  // 4. Navigation Setup
  // ═══════════════════════════════════════
  function initNavigation() {
    // Keyboard
    document.addEventListener('keydown', (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          navigateNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          navigatePrev();
          break;
      }
    });

    // Touch/Swipe via pointer events
    document.addEventListener('pointerdown', (e) => {
      APP.touchStartX = e.clientX;
      APP.touchStartY = e.clientY;
    }, { passive: true });

    document.addEventListener('pointerup', (e) => {
      const deltaX = e.clientX - APP.touchStartX;
      const deltaY = e.clientY - APP.touchStartY;

      const d = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
      if (Math.abs(d) > 50) {
        if (d < 0) navigateNext(); else navigatePrev();
      }
    }, { passive: true });

    // Mouse wheel (debounced)
    let lastWheelTime = 0;
    document.addEventListener('wheel', (e) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelTime < 1100 || Math.abs(e.deltaY) < 8) return;

      if (e.deltaY > 0) {
        navigateNext();
        lastWheelTime = now;
      } else if (e.deltaY < 0) {
        navigatePrev();
        lastWheelTime = now;
      }
    }, { passive: false });

    // Nav arrow buttons
    const prevBtn = document.querySelector('.nav-arrow-prev');
    const nextBtn = document.querySelector('.nav-arrow-next');
    if (prevBtn) prevBtn.addEventListener('click', navigatePrev);
    if (nextBtn) nextBtn.addEventListener('click', navigateNext);

    // Nav dots
    document.querySelectorAll('.nav-dot').forEach((dot) => {
      dot.addEventListener('click', () => {
        const index = parseInt(dot.getAttribute('data-index'), 10);
        goToSection(index);
      });
    });
  }

  // ═══════════════════════════════════════
  // 5. Navigate Next / Prev
  // ═══════════════════════════════════════
  function navigateNext() {
    if (APP.isTransitioning) return;
    if (APP.currentSection < APP.totalSections - 1) {
      transitionTo(APP.currentSection + 1, 'next');
    }
  }

  function navigatePrev() {
    if (APP.isTransitioning) return;
    if (APP.currentSection > 0) {
      transitionTo(APP.currentSection - 1, 'prev');
    }
  }

  // ═══════════════════════════════════════
  // 6. Go To Section (dot click)
  // ═══════════════════════════════════════
  function goToSection(index) {
    if (index === APP.currentSection || APP.isTransitioning) return;
    const direction = index > APP.currentSection ? 'next' : 'prev';
    transitionTo(index, direction);
  }

  // ═══════════════════════════════════════
  // 7. Core Cinematic Transition
  // ═══════════════════════════════════════
  function transitionTo(newIndex, direction) {
    if (APP.isTransitioning) return;
    APP.isTransitioning = true;

    const currentSlide = document.querySelector(`.section-slide[data-index="${APP.currentSection}"]`);
    const nextSlide = document.querySelector(`.section-slide[data-index="${newIndex}"]`);

    if (!currentSlide || !nextSlide) {
      APP.isTransitioning = false;
      return;
    }

    // Remove idle animation from current character
    const currentChar = currentSlide.querySelector('.character-img');
    if (currentChar) currentChar.classList.remove('idle');

    // Reduced motion: instant swap
    if (prefersReducedMotion) {
      currentSlide.classList.remove('active');
      nextSlide.classList.add('active');
      APP.currentSection = newIndex;
      APP.isTransitioning = false;
      updateCounter();
      updateNavDots();
      updateArrowStates();
      announceSection(newIndex);
      return;
    }

    // Determine animation classes
    const outClass = direction === 'next' ? 'slide-out-left' : 'slide-out-right';
    const inClass = direction === 'next' ? 'slide-in-right' : 'slide-in-left';

    // Animate current slide out
    currentSlide.classList.add(outClass);

    // Animate next slide in
    nextSlide.classList.add(inClass);
    nextSlide.classList.add('active');

    // After transition completes
    setTimeout(() => {
      currentSlide.classList.remove('active', outClass);
      nextSlide.classList.remove(inClass);

      // Add idle animation to new character
      const newChar = nextSlide.querySelector('.character-img');
      if (newChar) {
        setTimeout(() => newChar.classList.add('idle'), 100);
      }

      APP.currentSection = newIndex;
      APP.isTransitioning = false;

      updateCounter();
      updateNavDots();
      updateArrowStates();
      announceSection(newIndex);
    }, 1000);
  }

  // ═══════════════════════════════════════
  // 8. Show Section (initial)
  // ═══════════════════════════════════════
  function showSection(index) {
    const slide = document.querySelector(`.section-slide[data-index="${index}"]`);
    if (slide) {
      slide.classList.add('active');
      if (!prefersReducedMotion) {
        const char = slide.querySelector('.character-img');
        if (char) setTimeout(() => char.classList.add('idle'), 300);
      }
    }
    updateCounter();
    updateNavDots();
    updateArrowStates();
  }

  // ═══════════════════════════════════════
  // 9. Update Counter
  // ═══════════════════════════════════════
  function updateCounter() {
    const current = document.querySelector('.nav-counter .current');
    const total = document.querySelector('.nav-counter .total');
    if (current) current.textContent = String(APP.currentSection + 1).padStart(2, '0');
    if (total) total.textContent = String(APP.totalSections).padStart(2, '0');
  }

  // ═══════════════════════════════════════
  // 10. Update Nav Dots
  // ═══════════════════════════════════════
  function updateNavDots() {
    document.querySelectorAll('.nav-dot').forEach((dot, index) => {
      dot.classList.toggle('active', index === APP.currentSection);
      dot.setAttribute('aria-selected', index === APP.currentSection ? 'true' : 'false');
    });
  }

  // ═══════════════════════════════════════
  // 11. Update Arrow States
  // ═══════════════════════════════════════
  function updateArrowStates() {
    const prevBtn = document.querySelector('.nav-arrow-prev');
    const nextBtn = document.querySelector('.nav-arrow-next');
    if (prevBtn) prevBtn.disabled = APP.currentSection === 0;
    if (nextBtn) nextBtn.disabled = APP.currentSection === APP.totalSections - 1;
  }

  // ═══════════════════════════════════════
  // 12. Announce Section (a11y)
  // ═══════════════════════════════════════
  function announceSection(index) {
    const liveRegion = document.getElementById('section-announcer');
    if (liveRegion) {
      liveRegion.textContent = `Section ${index + 1} of ${APP.totalSections}: ${APP.sections[index]}`;
    }
  }

  // ═══════════════════════════════════════
  // 13. Load CMS Data
  // ═══════════════════════════════════════
  function loadCMSData() {
    try {
      const stored = localStorage.getItem('prajapat_cms_data');
      if (stored) {
        applyCMSData(JSON.parse(stored));
      } else {
        fetch('data/defaults.json')
          .then(r => r.json())
          .then(data => applyCMSData(data))
          .catch(() => {});
      }
    } catch (e) {
      console.warn('CMS data load error', e);
    }
  }

  // ═══════════════════════════════════════
  // 14. Apply CMS Data
  // ═══════════════════════════════════════
  function applyCMSData(data) {
    if (!data) return;

    // Brand
    setText('.hero-brand-name', data.brand?.name);

    // Hero
    setText('.hero-title', data.hero?.title);
    setText('.hero-title-sub', data.hero?.subtitle);
    const taglineEl = document.querySelector('.hero-tagline p');
    if (taglineEl && data.hero?.tagline) taglineEl.textContent = data.hero.tagline;
    setText('.hero-meta-role', data.hero?.metaRole);
    setText('.hero-meta-status', data.hero?.metaStatus);

    // Work categories
    if (data.work?.categories) {
      const cards = document.querySelectorAll('.work-card');
      data.work.categories.forEach((cat, i) => {
        if (cards[i]) {
          const title = cards[i].querySelector('h3');
          const desc = cards[i].querySelector('p');
          if (title) title.textContent = cat.title;
          if (desc) desc.textContent = cat.description;
        }
      });
    }

    // Experience stats
    if (data.experience?.stats) {
      const blocks = document.querySelectorAll('.stat-block');
      data.experience.stats.forEach((stat, i) => {
        if (blocks[i]) {
          const num = blocks[i].querySelector('.stat-number');
          const label = blocks[i].querySelector('.stat-label');
          if (num) num.textContent = stat.number;
          if (label) label.textContent = stat.label;
        }
      });
    }

    // Software
    if (data.software?.items) {
      const items = document.querySelectorAll('.software-item');
      data.software.items.forEach((sw, i) => {
        if (items[i]) {
          const name = items[i].querySelector('.software-name');
          if (name) name.textContent = sw.name;
          const badge = items[i].querySelector('.software-badge');
          if (badge && sw.badge) {
            badge.textContent = sw.badge;
            badge.style.display = '';
          } else if (badge && !sw.badge) {
            badge.style.display = 'none';
          }
        }
      });
    }

    // Social links
    if (data.social?.platforms) {
      const cards = document.querySelectorAll('.social-card');
      data.social.platforms.forEach((plat, i) => {
        if (cards[i]) {
          const name = cards[i].querySelector('.social-card-name');
          if (name) name.textContent = plat.name;
          if (plat.url && plat.url !== '#') {
            cards[i].href = plat.url;
            cards[i].target = '_blank';
            cards[i].rel = 'noopener noreferrer';
          }
        }
      });
    }

    // Hire
    setText('.cta-primary .cta-text', data.hire?.ctaPrimary);
    setText('.cta-secondary', data.hire?.ctaSecondary);
    if (data.hire?.email) {
      const emailText = document.querySelector('.hire-email .contact-text');
      if (emailText) emailText.textContent = data.hire.email;
    }
    if (data.hire?.whatsapp) {
      const waText = document.querySelector('.hire-whatsapp .contact-text');
      if (waText) waText.textContent = data.hire.whatsapp;
    }
  }

  function setText(selector, value) {
    if (!value) return;
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  }

  // ═══════════════════════════════════════
  // 15. Init Sections — Build all 6 section slides
  // ═══════════════════════════════════════
  function initSections() {
    const container = document.getElementById('sections-container');
    if (!container) return;

    const fragment = document.createDocumentFragment();
    fragment.appendChild(renderHero());
    fragment.appendChild(renderWork());
    fragment.appendChild(renderExperience());
    fragment.appendChild(renderSoftware());
    fragment.appendChild(renderSocial());
    fragment.appendChild(renderHire());
    container.appendChild(fragment);
  }

  // ═══════════════════════════════════════
  // Section Slide Factory
  // ═══════════════════════════════════════
  function createSectionSlide(index, contentHTML) {
    const section = document.createElement('section');
    section.className = 'section-slide';
    section.setAttribute('data-index', index);
    section.setAttribute('aria-label', APP.sections[index] + ' section');

    section.innerHTML = `
      <div class="character-container">
        <div class="character-glow"></div>
        <img class="character-img" src="${APP.characterImages[index]}" alt="PRAJAPAT character - ${APP.sections[index]}" loading="${index === 0 ? 'eager' : 'lazy'}">
      </div>
      <div class="section-content">
        ${contentHTML}
      </div>
    `;
    return section;
  }

  // ═══════════════════════════════════════
  // 01 — HERO SECTION
  // ═══════════════════════════════════════
  function renderHero() {
    return createSectionSlide(0, `
      <div class="hero-layout">
        <div class="hero-brand">
          <div class="hero-brand-name">PRAJAPAT</div>
        </div>

        <div class="hero-title-block">
          <h1 class="hero-title">VIDEO<br>EDITOR</h1>
          <p class="hero-title-sub">VISUAL STORYTELLER</p>
        </div>

        <div class="hero-tagline">
          <p>I turn raw footage into cinematic stories built to hold attention, communicate clearly, and leave an impact.</p>
        </div>

        <div class="hero-meta-right">
          <div class="hero-meta-label">ROLE</div>
          <div class="hero-meta-value hero-meta-role">VIDEO EDITOR / VFX</div>
          <div class="hero-meta-gap">
            <div class="hero-meta-label">STATUS</div>
            <div class="hero-meta-value hero-meta-status">AVAILABLE</div>
          </div>
        </div>
      </div>
    `);
  }

  // ═══════════════════════════════════════
  // 02 — MY WORK
  // ═══════════════════════════════════════
  function renderWork() {
    return createSectionSlide(1, `
      <div class="section-header">
        <div class="section-number">02</div>
        <h2 class="section-title">MY WORK</h2>
      </div>

      <div class="work-columns">
        <div class="work-left">
          <div class="work-card">
            <div class="work-card-number">01</div>
            <h3 class="work-card-title">LONG-FORM VIDEO</h3>
            <p class="work-card-desc">Professional YouTube, educational, storytelling and content-driven editing.</p>
          </div>
          <div class="work-card">
            <div class="work-card-number">02</div>
            <h3 class="work-card-title">SHORT-FORM VIDEO</h3>
            <p class="work-card-desc">Reels, Shorts and social-focused fast-paced editing.</p>
          </div>
        </div>

        <div class="work-right">
          <div class="work-card">
            <div class="work-card-number">03</div>
            <h3 class="work-card-title">GFX DESIGN</h3>
            <p class="work-card-desc">Motion graphics, titles, overlays and visual graphics.</p>
          </div>
          <div class="work-card">
            <div class="work-card-number">04</div>
            <h3 class="work-card-title">DOCUMENTARY EDITING</h3>
            <p class="work-card-desc">Story-driven documentary editing, pacing, structure and cinematic presentation.</p>
          </div>
        </div>
      </div>
    `);
  }

  // ═══════════════════════════════════════
  // 03 — EXPERIENCE
  // ═══════════════════════════════════════
  function renderExperience() {
    return createSectionSlide(2, `
      <div class="section-header">
        <div class="section-number">03</div>
        <h2 class="section-title">EXPERIENCE</h2>
      </div>

      <div class="stats-grid">
        <div class="stat-block">
          <div class="stat-number">7+</div>
          <div class="stat-label">YEARS EDITING<br>EXPERIENCE</div>
        </div>
        <div class="stat-block">
          <div class="stat-number">98%</div>
          <div class="stat-label">CLIENT<br>SATISFACTION</div>
        </div>
        <div class="stat-block">
          <div class="stat-number">150+</div>
          <div class="stat-label">CLIENTS /<br>PROJECTS</div>
        </div>
        <div class="stat-block">
          <div class="stat-number">50M+</div>
          <div class="stat-label">REACH<br>GENERATED</div>
        </div>
      </div>
    `);
  }

  // ═══════════════════════════════════════
  // 04 — SOFTWARE I USE
  // ═══════════════════════════════════════
  function renderSoftware() {
    return createSectionSlide(3, `
      <div class="section-header">
        <div class="section-number">04</div>
        <h2 class="section-title">SOFTWARE I USE</h2>
      </div>

      <div class="software-list">
        <div class="software-item">
          <div class="software-icon">
            <svg viewBox="0 0 36 36"><rect width="36" height="36" rx="6" fill="#00005B"/><text x="18" y="24" text-anchor="middle" fill="#9999FF" font-size="14" font-weight="700">Ae</text></svg>
          </div>
          <span class="software-name">Adobe After Effects</span>
        </div>
        <div class="software-item">
          <div class="software-icon">
            <svg viewBox="0 0 36 36"><rect width="36" height="36" rx="6" fill="#00005B"/><text x="18" y="24" text-anchor="middle" fill="#9999FF" font-size="14" font-weight="700">Pr</text></svg>
          </div>
          <span class="software-name">Adobe Premiere Pro</span>
        </div>
        <div class="software-item">
          <div class="software-icon">
            <svg viewBox="0 0 36 36"><rect width="36" height="36" rx="6" fill="#001E36"/><text x="18" y="24" text-anchor="middle" fill="#31A8FF" font-size="14" font-weight="700">Ps</text></svg>
          </div>
          <span class="software-name">Adobe Photoshop</span>
        </div>
        <div class="software-item">
          <div class="software-icon">
            <svg viewBox="0 0 36 36"><rect width="36" height="36" rx="6" fill="#1A1A2E"/><text x="18" y="24" text-anchor="middle" fill="#E94560" font-size="14" font-weight="700">Am</text></svg>
          </div>
          <span class="software-name">Alight Motion</span>
          <span class="software-badge">FOR MOBILE</span>
        </div>
      </div>
    `);
  }

  // ═══════════════════════════════════════
  // 05 — SOCIAL MEDIA
  // ═══════════════════════════════════════
  function renderSocial() {
    return createSectionSlide(4, `
      <div class="section-header">
        <div class="section-number">05</div>
        <h2 class="section-title">SOCIAL MEDIA</h2>
      </div>

      <div class="social-grid">
        <a href="#" class="social-card" data-platform="instagram" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
          <div class="social-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </div>
          <span class="social-card-name">Instagram</span>
        </a>

        <a href="#" class="social-card" data-platform="youtube" aria-label="YouTube Channel 01" target="_blank" rel="noopener noreferrer">
          <div class="social-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.16 1 12 1 12s0 3.84.46 5.58a2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.84 23 12 23 12s0-3.84-.46-5.58z"></path>
              <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon>
            </svg>
          </div>
          <span class="social-card-name">YouTube Channel 01</span>
        </a>

        <a href="#" class="social-card" data-platform="youtube" aria-label="YouTube Channel 02" target="_blank" rel="noopener noreferrer">
          <div class="social-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.16 1 12 1 12s0 3.84.46 5.58a2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.84 23 12 23 12s0-3.84-.46-5.58z"></path>
              <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon>
            </svg>
          </div>
          <span class="social-card-name">YouTube Channel 02</span>
        </a>

        <a href="#" class="social-card" data-platform="telegram" aria-label="Telegram" target="_blank" rel="noopener noreferrer">
          <div class="social-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </div>
          <span class="social-card-name">Telegram</span>
        </a>
      </div>
    `);
  }

  // ═══════════════════════════════════════
  // 06 — HIRE ME
  // ═══════════════════════════════════════
  function renderHire() {
    return createSectionSlide(5, `
      <div class="section-header">
        <div class="section-number">06</div>
        <h2 class="section-title">HIRE ME</h2>
      </div>

      <div class="hire-content">
        <button class="hire-cta-primary cta-primary" aria-label="Start a project">
          <span class="cta-text">START A PROJECT</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>

        <a href="#" class="hire-cta-secondary cta-secondary">LET'S WORK TOGETHER</a>

        <div class="hire-contacts">
          <div class="hire-contact-item hire-email">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <div>
              <div class="hire-contact-label contact-label">EMAIL</div>
              <div class="contact-text">Configure in admin</div>
            </div>
          </div>

          <div class="hire-contact-item hire-whatsapp">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <div>
              <div class="hire-contact-label contact-label">WHATSAPP BUSINESS</div>
              <div class="contact-text">Configure in admin</div>
            </div>
          </div>
        </div>
      </div>
    `);
  }

});
