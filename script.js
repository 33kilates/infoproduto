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
    // Select ALL buttons with the trigger class (Main button + Floating Mobile Button)
    const checkoutButtons = document.querySelectorAll('.checkout-click');
    
    checkoutButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
             e.preventDefault(); // Prevent default if it's an anchor tag
             
             // Base Checkout URL
             const baseUrl = 'https://payment.ticto.app/O025361D8?event=PageView&lp_cta=cta-btn&product_id=102220&offer_code=O025361D8&currency=brl';
             
             // Get current URL parameters
             const currentParams = window.location.search;

             // Combine them
             let finalUrl = baseUrl;
             if (currentParams) {
                 const cleanParams = currentParams.replace('?', '');
                 finalUrl += '&' + cleanParams;
             }

             // Redirect
             window.location.href = finalUrl;
        });
    });
});
