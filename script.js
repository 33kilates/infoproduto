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

});
