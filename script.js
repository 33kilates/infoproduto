document.addEventListener('DOMContentLoaded', () => {
    /**
     * Tracking (GA4 + Dimpple)
     * - Não mexe no layout.
     * - Só dispara eventos (com try/catch) e nunca quebra a página se algum script estiver bloqueado.
     */

    const PAGE_NAME = document.body?.dataset?.page || 'raiox_equipe_hibrida';

    const safeText = (el) => {
        try {
            const t = (el?.innerText || el?.textContent || '').trim().replace(/\s+/g, ' ');
            return t.slice(0, 120);
        } catch (_) {
            return '';
        }
    };

    const sendGA4 = (eventName, params = {}) => {
        try {
            if (typeof window.gtag === 'function') {
                window.gtag('event', eventName, params);
            }
        } catch (_) { /* noop */ }
    };

    const sendDimpple = (eventName, params = {}) => {
        // A API pública do Dimpple pode variar; fazemos chamadas seguras e silenciosas.
        try {
            const fn = window.trk;
            if (typeof fn !== 'function') return;

            try {
                fn('event', eventName, params);
                return;
            } catch (_) { /* fallback */ }

            try {
                fn('track', eventName, params);
                return;
            } catch (_) { /* fallback */ }

            try {
                fn(eventName, params);
            } catch (_) { /* noop */ }
        } catch (_) { /* noop */ }
    };

    const track = (eventName, params = {}) => {
        const payload = {
            page_name: PAGE_NAME,
            page_path: window.location.pathname,
            page_url: window.location.href,
            ...params
        };

        // GA4 (gtag)
        sendGA4(eventName, payload);

        // Dimpple
        sendDimpple(eventName, payload);
    };

    // Eventos de base
    track('lp_loaded', { title: document.title });

    // Tempo na página (milestones)
    [10, 30, 60, 120].forEach((sec) => {
        window.setTimeout(() => {
            track('time_on_page', { seconds: sec });
        }, sec * 1000);
    });

    // Scroll depth
    const depthMarks = [25, 50, 75, 90];
    const firedDepth = new Set();
    const getScrollPercent = () => {
        const doc = document.documentElement;
        const scrollTop = window.scrollY || doc.scrollTop || 0;
        const scrollHeight = doc.scrollHeight || 0;
        const clientHeight = doc.clientHeight || 0;
        const total = Math.max(scrollHeight - clientHeight, 1);
        return Math.round((scrollTop / total) * 100);
    };

    let scrollTicking = false;
    window.addEventListener('scroll', () => {
        if (scrollTicking) return;
        scrollTicking = true;

        window.requestAnimationFrame(() => {
            const p = getScrollPercent();
            depthMarks.forEach((mark) => {
                if (!firedDepth.has(mark) && p >= mark) {
                    firedDepth.add(mark);
                    track('scroll_depth', { percent: mark });
                }
            });
            scrollTicking = false;
        });
    }, { passive: true });

    // View tracking (qualquer elemento com data-track)
    const viewed = new Set();
    const viewObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            const el = entry.target;
            const key = el.getAttribute('data-track');
            if (!key) return;

            if (!viewed.has(key)) {
                viewed.add(key);
                track('view', {
                    element: key,
                    element_tag: el.tagName.toLowerCase(),
                    element_text: safeText(el)
                });
            }
        });
    }, { threshold: 0.35 });

    document.querySelectorAll('[data-track]').forEach((el) => viewObserver.observe(el));

    // Click tracking (data-track + links relevantes)
    document.addEventListener('click', (e) => {
        const target = e.target;
        if (!target) return;

        const el = target.closest('[data-track], a, button');
        if (!el) return;

        const dataTrack = el.getAttribute('data-track');
        const tag = el.tagName.toLowerCase();

        // Click genérico por data-track
        if (dataTrack) {
            track('click', {
                element: dataTrack,
                element_tag: tag,
                element_text: safeText(el)
            });
        }

        // Outbound / navegação
        if (tag === 'a') {
            const href = el.getAttribute('href') || '';
            if (/^https?:\/\//i.test(href)) {
                track('outbound_click', { href });
            } else if (href.startsWith('#')) {
                track('nav_click', { href });
            }
        }
    }, true);

    // ----------- Seu código original (sem mudanças de layout) -----------

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

                // Se esse elemento tiver data-track, aproveita para marcar "view" também (redundância segura)
                const key = entry.target.getAttribute('data-track');
                if (key && !viewed.has(key)) {
                    viewed.add(key);
                    track('view', {
                        element: key,
                        element_tag: entry.target.tagName.toLowerCase(),
                        element_text: safeText(entry.target)
                    });
                }
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.scroll-reveal');
    revealElements.forEach(el => observer.observe(el));

    // Smooth Scroll for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            // Só previne se existir alvo (pra não “matar” links quebrados)
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // CTA Button (mantém comportamento: só redireciona se você preencher data-checkout-url)
    const ctaBtn = document.getElementById('cta-btn');
    if (ctaBtn) {
        ctaBtn.addEventListener('click', () => {
            track('cta_click', { element: ctaBtn.getAttribute('data-track') || 'cta_main' });

            const url = (ctaBtn.getAttribute('data-checkout-url') || '').trim();
            if (url) {
                window.location.href = url;
                return;
            }

            // Placeholder (como estava antes)
            console.log('Redirecting to checkout...');
            // window.location.href = 'YOUR_CHECKOUT_URL';
        });
    }

    // VSL: click (sem depender de API do player)
    const vslEl = document.querySelector('[data-track="vsl_player"]');
    if (vslEl) {
        vslEl.addEventListener('click', () => {
            track('vsl_click', { element: 'vsl_player' });
        });
    }
});
