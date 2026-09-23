/**
 * PRAJAPAT Portfolio — Admin CMS Panel
 * Manages portfolio content via localStorage
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'prajapat_cms_data';
  const PIN_HASH_KEY = 'prajapat_admin_pin_hash';
  const DEFAULTS_URL = 'data/defaults.json';

  // ═══════════════════════════════════════
  // Simple hash function (SHA-256 via SubtleCrypto)
  // ═══════════════════════════════════════
  async function hashPin(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ═══════════════════════════════════════
  // Toast notifications
  // ═══════════════════════════════════════
  function showToast(message) {
    const toast = document.getElementById('admin-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // ═══════════════════════════════════════
  // Authentication
  // ═══════════════════════════════════════
  const loginScreen = document.getElementById('admin-login');
  const dashboard = document.getElementById('admin-dashboard');
  const pinInput = document.getElementById('pin-input');
  const pinSubmit = document.getElementById('pin-submit');
  const pinError = document.getElementById('pin-error');
  const pinSetup = document.getElementById('pin-setup');

  // Check if PIN exists
  const existingHash = localStorage.getItem(PIN_HASH_KEY);
  if (!existingHash) {
    pinSetup.textContent = 'First time? Enter a new PIN to set up admin access.';
    pinSetup.style.display = 'block';
  }

  pinSubmit.addEventListener('click', handlePinSubmit);
  pinInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handlePinSubmit();
  });

  async function handlePinSubmit() {
    const pin = pinInput.value.trim();
    if (!pin || pin.length < 4) {
      pinError.textContent = 'PIN must be at least 4 characters';
      pinError.style.display = 'block';
      return;
    }

    const hash = await hashPin(pin);

    if (!existingHash) {
      // First time — set PIN
      localStorage.setItem(PIN_HASH_KEY, hash);
      showLogin(false);
      showToast('PIN created successfully');
    } else if (hash === existingHash) {
      // Correct PIN
      showLogin(false);
    } else {
      // Wrong PIN
      pinError.textContent = 'Incorrect PIN';
      pinError.style.display = 'block';
      pinInput.value = '';
      pinInput.focus();
    }
  }

  function showLogin(show) {
    loginScreen.style.display = show ? 'block' : 'none';
    dashboard.style.display = show ? 'none' : 'block';
    if (!show) loadAdminData();
  }

  // Logout
  document.getElementById('admin-logout').addEventListener('click', () => {
    showLogin(true);
    pinInput.value = '';
    pinError.style.display = 'none';
  });

  // ═══════════════════════════════════════
  // Data management
  // ═══════════════════════════════════════
  let cmsData = null;

  async function loadDefaults() {
    try {
      const resp = await fetch(DEFAULTS_URL);
      return await resp.json();
    } catch (e) {
      console.warn('Could not load defaults.json, using hardcoded fallback');
      return getHardcodedDefaults();
    }
  }

  function getHardcodedDefaults() {
    return {
      brand: { name: 'PRAJAPAT', tagline: 'VIDEO EDITOR / VISUAL STORYTELLER' },
      hero: { title: 'VIDEO EDITOR', subtitle: 'VISUAL STORYTELLER', tagline: 'I turn raw footage into cinematic stories built to hold attention, communicate clearly, and leave an impact.', metaRole: 'VIDEO EDITOR / VFX', metaStatus: 'AVAILABLE' },
      work: { categories: [
        { title: 'LONG-FORM VIDEO', description: 'Professional YouTube, educational, storytelling and content-driven editing.' },
        { title: 'SHORT-FORM VIDEO', description: 'Reels, Shorts and social-focused fast-paced editing.' },
        { title: 'GFX DESIGN', description: 'Motion graphics, titles, overlays and visual graphics.' },
        { title: 'DOCUMENTARY EDITING', description: 'Story-driven documentary editing, pacing, structure and cinematic presentation.' }
      ]},
      experience: { stats: [
        { number: '7+', label: 'YEARS EDITING EXPERIENCE' },
        { number: '98%', label: 'CLIENT SATISFACTION' },
        { number: '150+', label: 'CLIENTS / PROJECTS' },
        { number: '50M+', label: 'REACH GENERATED' }
      ]},
      software: { items: [
        { name: 'Adobe After Effects', abbr: 'Ae', bgColor: '#00005B', textColor: '#9999FF', badge: '' },
        { name: 'Adobe Premiere Pro', abbr: 'Pr', bgColor: '#00005B', textColor: '#9999FF', badge: '' },
        { name: 'Adobe Photoshop', abbr: 'Ps', bgColor: '#001E36', textColor: '#31A8FF', badge: '' },
        { name: 'Alight Motion', abbr: 'Am', bgColor: '#1A1A2E', textColor: '#E94560', badge: 'FOR MOBILE' }
      ]},
      social: { platforms: [
        { platform: 'instagram', name: 'Instagram', url: '#' },
        { platform: 'youtube', name: 'YouTube Channel 01', url: '#' },
        { platform: 'youtube', name: 'YouTube Channel 02', url: '#' },
        { platform: 'telegram', name: 'Telegram', url: '#' }
      ]},
      hire: { ctaPrimary: 'START A PROJECT', ctaSecondary: "LET'S WORK TOGETHER", email: '', whatsapp: '' }
    };
  }

  async function loadAdminData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        cmsData = JSON.parse(stored);
      } catch (e) {
        cmsData = await loadDefaults();
      }
    } else {
      cmsData = await loadDefaults();
    }
    populateFields();
  }

  // ═══════════════════════════════════════
  // Populate form fields from data
  // ═══════════════════════════════════════
  function populateFields() {
    if (!cmsData) return;

    // Brand
    setVal('brand-name', cmsData.brand?.name);
    setVal('brand-tagline', cmsData.brand?.tagline);

    // Hero
    setVal('hero-title', cmsData.hero?.title);
    setVal('hero-subtitle', cmsData.hero?.subtitle);
    setVal('hero-tagline', cmsData.hero?.tagline);
    setVal('hero-meta-role', cmsData.hero?.metaRole);
    setVal('hero-meta-status', cmsData.hero?.metaStatus);

    // Work categories
    renderWorkCategories();

    // Experience stats
    renderExperienceStats();

    // Software
    renderSoftware();

    // Social
    renderSocial();

    // Hire
    setVal('hire-cta-primary', cmsData.hire?.ctaPrimary);
    setVal('hire-cta-secondary', cmsData.hire?.ctaSecondary);
    setVal('hire-email', cmsData.hire?.email);
    setVal('hire-whatsapp', cmsData.hire?.whatsapp);
  }

  function setVal(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || '';
  }

  // ═══════════════════════════════════════
  // Dynamic field renderers
  // ═══════════════════════════════════════

  function renderWorkCategories() {
    const container = document.getElementById('work-categories-container');
    container.innerHTML = '';
    const cats = cmsData.work?.categories || [];
    cats.forEach((cat, i) => {
      container.appendChild(createFieldGroup(`work-cat-${i}`, [
        { label: `Category ${i + 1} — Title`, id: `work-cat-title-${i}`, value: cat.title, type: 'text' },
        { label: `Category ${i + 1} — Description`, id: `work-cat-desc-${i}`, value: cat.description, type: 'textarea' }
      ], () => {
        cmsData.work.categories.splice(i, 1);
        renderWorkCategories();
      }));
    });
  }

  function renderExperienceStats() {
    const container = document.getElementById('experience-stats-container');
    container.innerHTML = '';
    const stats = cmsData.experience?.stats || [];
    stats.forEach((stat, i) => {
      container.appendChild(createFieldGroup(`exp-stat-${i}`, [
        { label: `Stat ${i + 1} — Number`, id: `exp-stat-num-${i}`, value: stat.number, type: 'text' },
        { label: `Stat ${i + 1} — Label`, id: `exp-stat-label-${i}`, value: stat.label, type: 'text' }
      ]));
    });
  }

  function renderSoftware() {
    const container = document.getElementById('software-container');
    container.innerHTML = '';
    const items = cmsData.software?.items || [];
    items.forEach((item, i) => {
      container.appendChild(createFieldGroup(`sw-${i}`, [
        { label: `Software ${i + 1} — Name`, id: `sw-name-${i}`, value: item.name, type: 'text' },
        { label: `Abbreviation`, id: `sw-abbr-${i}`, value: item.abbr, type: 'text' },
        { label: `Badge (e.g. FOR MOBILE)`, id: `sw-badge-${i}`, value: item.badge, type: 'text' }
      ], () => {
        cmsData.software.items.splice(i, 1);
        renderSoftware();
      }));
    });
  }

  function renderSocial() {
    const container = document.getElementById('social-container');
    container.innerHTML = '';
    const platforms = cmsData.social?.platforms || [];
    const platformOptions = ['instagram', 'youtube', 'telegram', 'payhip', 'facebook', 'x', 'linkedin', 'tiktok', 'discord', 'behance', 'dribbble', 'github', 'custom'];

    platforms.forEach((plat, i) => {
      const group = document.createElement('div');
      group.style.cssText = 'padding:16px;border:1px solid rgba(0,0,0,0.1);margin-bottom:12px;position:relative;';

      // Platform select
      const selectField = document.createElement('div');
      selectField.className = 'admin-field';
      const selectLabel = document.createElement('label');
      selectLabel.textContent = `Platform ${i + 1} — Type`;
      selectLabel.setAttribute('for', `social-platform-${i}`);
      const select = document.createElement('select');
      select.id = `social-platform-${i}`;
      platformOptions.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
        if (opt === plat.platform) option.selected = true;
        select.appendChild(option);
      });
      selectField.appendChild(selectLabel);
      selectField.appendChild(select);
      group.appendChild(selectField);

      // Name
      const nameField = createField(`social-name-${i}`, `Platform ${i + 1} — Display Name`, plat.name, 'text');
      group.appendChild(nameField);

      // URL
      const urlField = createField(`social-url-${i}`, `Platform ${i + 1} — URL`, plat.url, 'text');
      group.appendChild(urlField);

      // Remove button
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '✕ REMOVE';
      removeBtn.style.cssText = 'position:absolute;top:12px;right:12px;background:none;border:none;color:#999;font-size:0.65rem;letter-spacing:0.1em;cursor:pointer;';
      removeBtn.addEventListener('click', () => {
        cmsData.social.platforms.splice(i, 1);
        renderSocial();
      });
      group.appendChild(removeBtn);

      container.appendChild(group);
    });
  }

  // ═══════════════════════════════════════
  // Field helpers
  // ═══════════════════════════════════════
  function createField(id, labelText, value, type) {
    const div = document.createElement('div');
    div.className = 'admin-field';
    const label = document.createElement('label');
    label.textContent = labelText;
    label.setAttribute('for', id);
    div.appendChild(label);

    if (type === 'textarea') {
      const textarea = document.createElement('textarea');
      textarea.id = id;
      textarea.value = value || '';
      div.appendChild(textarea);
    } else {
      const input = document.createElement('input');
      input.type = type || 'text';
      input.id = id;
      input.value = value || '';
      div.appendChild(input);
    }
    return div;
  }

  function createFieldGroup(prefix, fields, onRemove) {
    const group = document.createElement('div');
    group.style.cssText = 'padding:16px;border:1px solid rgba(0,0,0,0.1);margin-bottom:12px;position:relative;';

    fields.forEach(f => {
      group.appendChild(createField(f.id, f.label, f.value, f.type));
    });

    if (onRemove) {
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '✕ REMOVE';
      removeBtn.style.cssText = 'position:absolute;top:12px;right:12px;background:none;border:none;color:#999;font-size:0.65rem;letter-spacing:0.1em;cursor:pointer;';
      removeBtn.addEventListener('click', onRemove);
      group.appendChild(removeBtn);
    }

    return group;
  }

  // ═══════════════════════════════════════
  // Collect form data
  // ═══════════════════════════════════════
  function collectData() {
    const data = {
      brand: {
        name: sanitize(getVal('brand-name')),
        tagline: sanitize(getVal('brand-tagline'))
      },
      hero: {
        title: sanitize(getVal('hero-title')),
        subtitle: sanitize(getVal('hero-subtitle')),
        tagline: sanitize(getVal('hero-tagline')),
        metaRole: sanitize(getVal('hero-meta-role')),
        metaStatus: sanitize(getVal('hero-meta-status'))
      },
      work: { categories: [] },
      experience: { stats: [] },
      software: { items: [] },
      social: { platforms: [] },
      hire: {
        ctaPrimary: sanitize(getVal('hire-cta-primary')),
        ctaSecondary: sanitize(getVal('hire-cta-secondary')),
        email: sanitize(getVal('hire-email')),
        whatsapp: sanitize(getVal('hire-whatsapp'))
      }
    };

    // Work categories
    let i = 0;
    while (document.getElementById(`work-cat-title-${i}`)) {
      data.work.categories.push({
        title: sanitize(getVal(`work-cat-title-${i}`)),
        description: sanitize(getVal(`work-cat-desc-${i}`))
      });
      i++;
    }

    // Experience stats
    i = 0;
    while (document.getElementById(`exp-stat-num-${i}`)) {
      data.experience.stats.push({
        number: sanitize(getVal(`exp-stat-num-${i}`)),
        label: sanitize(getVal(`exp-stat-label-${i}`))
      });
      i++;
    }

    // Software
    i = 0;
    while (document.getElementById(`sw-name-${i}`)) {
      data.software.items.push({
        name: sanitize(getVal(`sw-name-${i}`)),
        abbr: sanitize(getVal(`sw-abbr-${i}`)),
        bgColor: cmsData.software?.items?.[i]?.bgColor || '#1A1A2E',
        textColor: cmsData.software?.items?.[i]?.textColor || '#FFFFFF',
        badge: sanitize(getVal(`sw-badge-${i}`))
      });
      i++;
    }

    // Social platforms
    i = 0;
    while (document.getElementById(`social-platform-${i}`)) {
      data.social.platforms.push({
        platform: sanitize(getVal(`social-platform-${i}`)),
        name: sanitize(getVal(`social-name-${i}`)),
        url: sanitizeUrl(getVal(`social-url-${i}`))
      });
      i++;
    }

    return data;
  }

  function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  // ═══════════════════════════════════════
  // Sanitization (XSS protection)
  // ═══════════════════════════════════════
  function sanitize(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function sanitizeUrl(url) {
    if (!url) return '#';
    url = url.trim();
    // Only allow http, https, mailto, tel protocols
    if (/^(https?:\/\/|mailto:|tel:|#)/i.test(url)) {
      return url;
    }
    // If it looks like a relative path or domain, prepend https
    if (/^[a-z0-9]/i.test(url) && !url.includes('javascript:')) {
      return 'https://' + url;
    }
    return '#';
  }

  // ═══════════════════════════════════════
  // Save / Reset / Add handlers
  // ═══════════════════════════════════════
  document.getElementById('admin-save-all').addEventListener('click', () => {
    cmsData = collectData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cmsData));
    showToast('All changes saved successfully');
  });

  document.getElementById('admin-reset').addEventListener('click', async () => {
    if (confirm('Reset all content to defaults? This cannot be undone.')) {
      localStorage.removeItem(STORAGE_KEY);
      cmsData = await loadDefaults();
      populateFields();
      showToast('Reset to defaults');
    }
  });

  // Add work category
  document.getElementById('add-work-category').addEventListener('click', () => {
    if (!cmsData.work) cmsData.work = { categories: [] };
    cmsData.work.categories.push({ title: '', description: '' });
    renderWorkCategories();
  });

  // Add software
  document.getElementById('add-software').addEventListener('click', () => {
    if (!cmsData.software) cmsData.software = { items: [] };
    cmsData.software.items.push({ name: '', abbr: '', bgColor: '#1A1A2E', textColor: '#FFFFFF', badge: '' });
    renderSoftware();
  });

  // Add social platform
  document.getElementById('add-social').addEventListener('click', () => {
    if (!cmsData.social) cmsData.social = { platforms: [] };
    cmsData.social.platforms.push({ platform: 'instagram', name: '', url: '#' });
    renderSocial();
  });

})();
