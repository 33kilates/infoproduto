document.addEventListener('DOMContentLoaded', () => {
  /**
   * =========================
   * 0) Helpers (GA4 + Dimpple)
   * =========================
   */

  const DEBUG = false; // true pra ver logs no console

  const safeLog = (...args) => {
    if (DEBUG) console.log('[TRACK]', ...args);
  };

  // Normaliza nomes/ids
  const normalize = (str) =>
    String(str || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w\-]/g, '');

  // Track GA4 (se existir)
  const gaTrack = (eventName, params = {}) => {
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, params);
        safeLog('GA4:', eventName, params);
      }
    } catch (e) {
      // silencioso
    }
  };

  /**
   * Track Dimpple (se existir)
   * - Como a API pública pode variar, fazemos chamadas "compatíveis" e seguras.
   * - Se a Dimpple não aceitar algum formato, ela tende a ignorar. Não quebra a página.
   */
  const dimppleTrack = (eventName, params = {}) => {
    try {
      if (typeof window.trk === 'function') {
        // Tentativa 1: padrão comum: trk('event', name, params)
        window.trk('event', eventName, params);
        safeLog('DIMPPLE:', eventName, params);
      }
    } catch (e) {
      // tentativa 2: algumas libs usam trk(name, params)
      try {
        if (typeof window.trk === 'function') window.trk(eventName, params);
      } catch {
        // silencioso
      }
    }
  };

  // Track unificado
  const track = (eventName, params = {}) => {
    const cleanName = normalize(eventName);
    const payload = {
      ...params,
      page_path: window.location.pathname,
      page_url: window.location.href,
    };

    gaTrack(cleanName, payload);
    dimppleTrack(cleanName, payload);
  };

  /**
   * =======================================
   * 1) Scroll Reveal + Section View Tracking
   * =======================================
   */

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const seenSections = new Set();

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      // Reveal visual (o que você já tinha)
      entry.target.classList.add('active');

      // Section view (1x por elemento)
      const sectionKeyRaw = entry.target.dataset.track; // << usa SEMPRE o data-track
      const sectionKey = normalize(sectionKeyRaw);

      if (sectionKey && !seenSections.has(sectionKey)) {
        seenSections.add(sectionKey);

        track('section_view', {
          section: sectionKey,
          section_raw: sectionKeyRaw
        });
      }

      obs.unobserve(entry.target); // Reveal/track só 1x
    });
  }, observerOptions);

  const revealElements = document.querySelectorAll('.scroll-reveal');
  revealElements.forEach(el => observer.observe(el));

  /**
   * ======================================
   * 2) Smooth Scroll + Track clicks âncoras
   * ======================================
   */

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);

      // track de navegação interna (sem exagero)
      if (targetId && targetId.length > 1) {
        track('anchor_click', { target: normalize(targetId) });
      }

      // comportamento que você já tinha
      e.preventDefault();
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  /**
   * =========================
   * 3) CTA Click (principal)
   * =========================
   */

  const ctaBtn = document.getElementById('cta-btn');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      track('cta_click', { cta_id: 'cta-btn' });

      // Se quiser redirecionar, só descomentar e colocar sua URL
      // const CHECKOUT_URL = 'https://seu-checkout-aqui';
      // setTimeout(() => { window.location.href = CHECKOUT_URL; }, 250);
    });
  }

  /**
   * =========================
   * 4) Scroll Depth (25/50/75/90)
   * =========================
   */

  const scrollMilestones = [25, 50, 75, 90];
  const firedScroll = new Set();

  let scrollTicking = false;
  const onScroll = () => {
    if (scrollTicking) return;
    scrollTicking = true;

    window.requestAnimationFrame(() => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop || 0;
      const scrollHeight = (doc.scrollHeight || 0) - (doc.clientHeight || 0);
      const percent = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;

      scrollMilestones.forEach(m => {
        if (percent >= m && !firedScroll.has(m)) {
          firedScroll.add(m);
          track('scroll_depth', { percent: m });
        }
      });

      scrollTicking = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });

  /**
   * =========================
   * 5) Time on Page (30/60/120/240s)
   * =========================
   */

  const timeMarks = [30, 60, 120, 240];
  const firedTime = new Set();
  const startTs = Date.now();

  const timeTimer = setInterval(() => {
    const seconds = Math.floor((Date.now() - startTs) / 1000);

    timeMarks.forEach(t => {
      if (seconds >= t && !firedTime.has(t)) {
        firedTime.add(t);
        track('time_on_page', { seconds: t });
      }
    });

    // se já disparou tudo, para
    if (firedTime.size === timeMarks.length) clearInterval(timeTimer);
  }, 1000);

  /**
   * =========================
   * 6) Engajamento (primeira interação)
   * =========================
   */

  let engagedSent = false;
  const markEngaged = () => {
    if (engagedSent) return;
    engagedSent = true;
    track('engaged', { value: 1 });
    window.removeEventListener('scroll', markEngaged);
    window.removeEventListener('click', markEngaged);
    window.removeEventListener('keydown', markEngaged);
  };

  window.addEventListener('scroll', markEngaged, { passive: true });
  window.addEventListener('click', markEngaged, { passive: true });
  window.addEventListener('keydown', markEngaged);

});
