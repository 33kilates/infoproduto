document.addEventListener('DOMContentLoaded', () => {

    // Intersection Observer for Scroll Reveal
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Reveal only once
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.scroll-reveal');
    revealElements.forEach(el => observer.observe(el));

    // Smooth Scroll for Anchor Links
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

    // Button Interaction with UTM Forwarding
    const ctaBtn = document.getElementById('cta-btn');
    if (ctaBtn) {
        ctaBtn.addEventListener('click', () => {
             // 1. Link Base da Ticto (sem os parametros vazios do final)
             const baseUrl = 'https://payment.ticto.app/O025361D8?event=PageView&lp_cta=cta-btn&product_id=102220&offer_code=O025361D8&currency=brl';
             
             // 2. Pega os parametros que estao na URL do seu site (Ex: ?utm_source=facebook)
             const currentParams = window.location.search;

             // 3. Junta tudo
             let finalUrl = baseUrl;
             if (currentParams) {
                 // Remove o "?" extra se tiver e adiciona com "&"
                 const cleanParams = currentParams.replace('?', '');
                 finalUrl += '&' + cleanParams;
             }

             // 4. Redireciona com o rastreio completo
             window.location.href = finalUrl;
        });
    }
});
