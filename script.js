document.addEventListener('DOMContentLoaded', () => {
  /**
   * =========================
   *  Tracking helpers (GA4 + Dimpple)
   * =========================
   */

  const TRACKING = {
    gaEnabled: true,
    dimppleEnabled: true,
  };

  // GA4 safe call
  function gaTrack(eventName, params = {}) {
    if (!TRACKING.gaEnabled) return;

    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, params);
        return;
      }
      // fallback: empilha no dataLayer (caso gtag ainda não esteja pronto)
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: eventName, ...params });
    } catch (_) {
      // não quebra a página
    }
  }

  // Dimpple safe call (tentativas comuns)
  let dimppleMode = null; // 'track' | 'event' | 'direct' | null

  function dimppleTrack(eventName, params = {}) {
    if (!TRACKING.dimppleEnabled) return;

    try {
      if (typeof window.trk !== 'function') return;

      // Se já detectamos um modo que não dá erro, usamos ele
      if (dimppleMode === 'track') return window.trk('track', eventName, params);
      if (dimppleMode === 'event') return window.trk('event', eventName, params);
      if (dimppleMode === 'direct') return window.trk(eventName, params);

      // Autodetect (usa o primeiro que não lançar exceção)
      try {
        window.trk('track', eventName, params);
        dimppleMode = 'track';
        return;
      } catch (_) {}

      try {
        window.trk('event', eventName, params);
        dimppleMode = 'event';
        return;
      } catch (_) {}

      try {
        window.trk(eventName, params);
        dimppleMode = 'direct';
        return;
      } catch (_) {}

      // Se nada funcionou, desabilita para evitar tentativas repetidas
      TRACKING.dimppleEnabled = false;
    } catch (_) {
      // não quebra a página
    }
  }

  function track(eventName, params = {}) {
    // padroniza parâmetros úteis
    const payload = {
      page_path: location.pathname + location.search,
      page_title: document.title,
      ...params,
    };

    gaTrack(eventName, payload);
    dimppleTrack(eventName, payload);
  }

  /**
   * =========================
   *  Scroll Reveal + Section View Tracking
   * =========================
   */
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add('active');
      obs.unobserve(entry.target); // Reveal only once

      // Se tiver data-track, contabiliza como "view" da seção
      const key = entry.target.getAttribute('data-track');
      if (key) {
        track('section_view', {
          section_key: key
        });
      }
    });
  }, observerOptions);

  const revealElements = document.querySelectorAll('.scroll-reveal');
  revealElements.forEach(el => observer.observe(el));

  /**
   * =========================
   *  Smooth Scroll for Anchor Links
   * =========================
   */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);

      if (!targetElement) return;

      e.preventDefault();

      // tracking para CTA mobile (se for o link do sticky)
      if (targetId === '#checkout') {
        track('cta_click', { cta_id: 'sticky_checkout', target: '#checkout' });
      }

      targetElement.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /**
   * =========================
   *  CTA Button tracking + ação
   * =========================
   */
  const ctaBtn = document.getElementById('cta-btn');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      track('cta_click', { cta_id: 'cta-btn', placement: 'final_cta', target: '#checkout' });

      // Se existir âncora #checkout, vai nela (você pode trocar por redirect depois)
      const checkoutAnchor = document.getElementById('checkout');
      if (checkoutAnchor) {
        checkoutAnchor.scrollIntoView({ behavior: 'smooth' });
      }

      // Se quiser redirecionar futuramente:
      // window.location.href = 'SUA_URL_DE_CHECKOUT';
    });
  }

  /**
   * =========================
   *  VSL tracking (placeholder)
   *  - Se você colocar iframe real depois, a gente adapta para play/percentuais
   * =========================
   */
  const vsl = document.getElementById('vsl');
  if (vsl) {
    vsl.addEventListener('click', () => {
      track('vsl_click', { element_id: 'vsl' });
    });

    // view da VSL quando entrar na tela
    const vslObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        track('vsl_view', { element_id: 'vsl' });
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.35 });

    vslObserver.observe(vsl);
  }

  /**
   * =========================
   *  Global click tracking for elements with data-track
   *  (sem precisar adicionar listener em cada bloco)
   * =========================
   */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-track]');
    if (!el) return;

    const key = el.getAttribute('data-track');
    track('element_click', { element_key: key });
  }, true);

  /**
   * =========================
   *  Scroll depth tracking (25/50/75/90)
   * =========================
   */
  const firedDepths = new Set();
  const depths = [25, 50, 75, 90];

  function getScrollPercent() {
    const doc = document.documentElement;
    const scrollTop = window.pageYOffset || doc.scrollTop || 0;
    const scrollHeight = doc.scrollHeight || 1;
    const clientHeight = doc.clientHeight || 1;
    const maxScroll = Math.max(scrollHeight - clientHeight, 1);
    return Math.min(100, Math.round((scrollTop / maxScroll) * 100));
  }

  function onScrollDepth() {
    const percent = getScrollPercent();
    depths.forEach(d => {
      if (percent >= d && !firedDepths.has(d)) {
        firedDepths.add(d);
        track('scroll_depth', { percent: d });
      }
    });
  }

  window.addEventListener('scroll', onScrollDepth, { passive: true });
  onScrollDepth(); // roda uma vez no load
});
