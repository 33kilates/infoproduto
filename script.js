document.addEventListener('DOMContentLoaded', () => {

  /**
   * Checkout (Ticto)
   * Mantém exatamente o link que você passou, e só acrescenta parâmetros úteis (utm/fbclid/etc).
   */
  const CHECKOUT_BASE_URL = 'https://payment.ticto.app/O025361D8?event=PageView';

  const PASS_THROUGH_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'fbclid', 'gclid', 'ttclid', 'wbraid', 'gbraid',
  'fbp', 'fbc'
];

function getCookie(name) {
  const match = document.cookie.match(
    new RegExp("(^|; )" + name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[2]) : null;
}
  
  function buildCheckoutUrl(source) {
  const checkoutUrl = new URL(CHECKOUT_BASE_URL);
  const currentParams = new URLSearchParams(window.location.search);

  // 1) Repasse de parâmetros de campanha para o checkout (se ainda não existirem lá)
  PASS_THROUGH_PARAMS.forEach((key) => {
    if (currentParams.has(key) && !checkoutUrl.searchParams.has(key)) {
      checkoutUrl.searchParams.set(key, currentParams.get(key));
    }
  });

  // 2) Fallback: se não veio fbp/fbc na URL, tenta cookie
  if (!checkoutUrl.searchParams.get('fbp')) {
    const fbp = getCookie('_fbp');
    if (fbp) checkoutUrl.searchParams.set('fbp', fbp);
  }

  if (!checkoutUrl.searchParams.get('fbc')) {
    const fbc = getCookie('_fbc');
    if (fbc) checkoutUrl.searchParams.set('fbc', fbc);
  }

  // 3) Se não vier fbc, mas vier fbclid, monta um fbc válido
  const fbclid = checkoutUrl.searchParams.get('fbclid');
  if (!checkoutUrl.searchParams.get('fbc') && fbclid) {
    const ts = Math.floor(Date.now() / 1000);
    checkoutUrl.searchParams.set('fbc', `fb.1.${ts}.${fbclid}`);
  }

  // 4) Identificador opcional do CTA
  if (source) checkoutUrl.searchParams.set('lp_cta', source);

  return checkoutUrl.toString();
}

  function redirectToCheckout(source) {
  const url = buildCheckoutUrl(source);

  // Dá tempo do evento de clique ser enviado (Dimpple/GA/Meta etc.)
  setTimeout(() => {
    window.location.href = url;
  }, 250);
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

  // CTA do FAQ -> Checkout
  const ctaFaq = document.getElementById('cta-faq');
  if (ctaFaq) {
    ctaFaq.addEventListener('click', (e) => {
      e.preventDefault();
      redirectToCheckout('cta_faq');
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
/**
   * FAQ Accordion (melhorado)
   * - Abre/fecha com animação suave
   * - Fecha os outros itens
   * - Reaplica "hidden" ao fechar (evita espaçamento/padding “fantasma”)
   */
  const faqItems = document.querySelectorAll('.faq-item');
  const FAQ_ANIM_MS = 260;

  function closeFaqItem(item) {
    item.classList.remove('open');
    const content = item.querySelector('.faq-content');
    const icon = item.querySelector('.faq-icon');

    if (!content) return;

    // anima fechamento
    content.style.maxHeight = '0px';
    if (icon) icon.textContent = '+';

    // depois da animação, esconde de verdade
    window.setTimeout(() => {
      content.classList.add('hidden');
    }, FAQ_ANIM_MS);
  }

  function openFaqItem(item) {
    item.classList.add('open');
    const content = item.querySelector('.faq-content');
    const icon = item.querySelector('.faq-icon');

    if (!content) return;

    content.classList.remove('hidden');
    // força “reflow” antes de medir altura
    void content.offsetHeight;
    content.style.maxHeight = content.scrollHeight + 'px';
    if (icon) icon.textContent = '–';
  }

  faqItems.forEach((item) => {
    const trigger = item.querySelector('.faq-trigger');
    const content = item.querySelector('.faq-content');

    if (!trigger || !content) return;

    // estado inicial
    content.style.overflow = 'hidden';
    content.style.maxHeight = '0px';
    content.style.transition = `max-height ${FAQ_ANIM_MS}ms ease`;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // fecha os outros
      faqItems.forEach((other) => {
        if (other !== item && other.classList.contains('open')) {
          closeFaqItem(other);
        }
      });

      if (isOpen) {
        closeFaqItem(item);
      } else {
        openFaqItem(item);
      }
    });
  });
    // Qualquer botão/link com .js-checkout -> Checkout
  document.querySelectorAll('.js-checkout').forEach((el) => {
    el.addEventListener('click', (e) => {
      // evita conflito com âncoras ou href="#"
      e.preventDefault();

      const source = el.getAttribute('data-cta-source') || el.id || 'cta_generic';
      redirectToCheckout(source);
    });
  });
});
  



