document.addEventListener('DOMContentLoaded', () => {

  /**
   * Checkout (Ticto)
   * Mantém exatamente o link que você passou, e só acrescenta parâmetros úteis (utm/fbclid/etc).
   */
  const CHECKOUT_BASE_URL = 'https://payment.ticto.app/O025361D8?event=PageView';

  const PASS_THROUGH_PARAMS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'fbclid', 'gclid', 'ttclid', 'wbraid', 'gbraid'
  ];

  function buildCheckoutUrl(source) {
    const checkoutUrl = new URL(CHECKOUT_BASE_URL);
    const currentParams = new URLSearchParams(window.location.search);

    // Repasse de parâmetros de campanha para o checkout (se ainda não existirem lá)
    PASS_THROUGH_PARAMS.forEach((key) => {
      if (currentParams.has(key) && !checkoutUrl.searchParams.has(key)) {
        checkoutUrl.searchParams.set(key, currentParams.get(key));
      }
    });

    // Identificador opcional de qual CTA foi clicado (ajuda debug/atribuição)
    if (source) checkoutUrl.searchParams.set('lp_cta', source);

    return checkoutUrl.toString();
  }

  function redirectToCheckout(source) {
    window.location.href = buildCheckoutUrl(source);
  }

  // Intersection Observer for Scroll Reveal
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observerInstance) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observerInstance.unobserve(entry.target); // Reveal only once
      }
    });
  }, observerOptions);

  const revealElements = document.querySelectorAll('.scroll-reveal');
  revealElements.forEach(el => observer.observe(el));

  // Smooth Scroll for Anchor Links (mantido)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });

  // CTA principal -> Checkout
  const ctaBtn = document.getElementById('cta-btn');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      redirectToCheckout('cta_btn');
    });
  }

  // CTA mobile fixo -> Checkout (captura clique sem afetar layout)
  const ctaMobile = document.getElementById('cta-mobile');
  if (ctaMobile) {
    ctaMobile.addEventListener('click', (e) => {
      e.preventDefault();
      redirectToCheckout('cta_mobile');
    });
  }

  /**
   * SIMULADOR (20/50/100)
   * Atualiza valores da seção D2 sem “cara de promessa”.
   */
  const simData = {
    20: { hybridLow: 13600, hybridMid: 25000, hybridHigh: 36400 },
    50: { hybridLow: 34000, hybridMid: 62500, hybridHigh: 91000 },
    100: { hybridLow: 68000, hybridMid: 125000, hybridHigh: 182000 }
  };

  const fmtBRL = (value) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(value);

  function formatRange(min, max) {
    return `${fmtBRL(min)} – ${fmtBRL(max)}`;
  }

  function setActiveSimButton(size) {
    document.querySelectorAll('.sim-btn').forEach(btn => {
      const isActive = btn.getAttribute('data-sim-size') === String(size);
      btn.classList.toggle('bg-white', isActive);
      btn.classList.toggle('shadow-sm', isActive);
      btn.classList.toggle('text-brand-dark', isActive);
      btn.classList.toggle('text-gray-600', !isActive);
    });
  }

  function updateSimulator(size) {
    const data = simData[size];
    if (!data) return;

    // Potencial com equipe híbrida
    const elLow = document.getElementById('sim-hybrid-low');
    const elMid = document.getElementById('sim-hybrid-mid');
    const elHigh = document.getElementById('sim-hybrid-high');

    if (elLow) elLow.textContent = fmtBRL(data.hybridLow);
    if (elMid) elMid.textContent = fmtBRL(data.hybridMid);
    if (elHigh) elHigh.textContent = fmtBRL(data.hybridHigh);

    // Perdas “Equipe Zumbi” (calculadas a partir do cenário provável)
    // Moderado: 10%–15% abaixo do potencial
    const moderateMin = Math.round(data.hybridMid * 0.10);
    const moderateMax = Math.round(data.hybridMid * 0.15);

    // Pesado: 30%–50% abaixo do potencial
    const heavyMin = Math.round(data.hybridMid * 0.30);
    const heavyMax = Math.round(data.hybridMid * 0.50);

    const elLossModerate = document.getElementById('sim-loss-moderate');
    const elLossHeavy = document.getElementById('sim-loss-heavy');

    if (elLossModerate) elLossModerate.textContent = formatRange(moderateMin, moderateMax);
    if (elLossHeavy) elLossHeavy.textContent = formatRange(heavyMin, heavyMax);

    setActiveSimButton(size);
  }

  // Init
  const simButtons = document.querySelectorAll('.sim-btn');
  if (simButtons.length) {
    simButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const size = Number(btn.getAttribute('data-sim-size'));
        updateSimulator(size);
      });
    });

    // Default: 50 revendedoras (melhor “âncora”)
    updateSimulator(50);
  }

});
