/* ==========================================================================
   MAIN.JS
   Solo dos responsabilidades: activar el reveal-on-scroll y el scroll suave
   de la flecha del hero. Nada de librerías externas — el motion vive en CSS
   (transiciones/keyframes), este script solo agrega/quita la clase que las
   dispara. Así, si mañana quitas el JS, el sitio sigue siendo 100% funcional
   (progressive enhancement).
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ---- Scroll reveal ----
  const revealTargets = document.querySelectorAll('[data-reveal]');

  if ('IntersectionObserver' in window && revealTargets.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target); // se revela una sola vez
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    revealTargets.forEach((el, i) => {
      // Delay escalonado dentro de un mismo grupo (ej. las 5 project cards)
      // usando el índice dentro de su contenedor padre, no un índice global,
      // para que cada sección entre con su propio ritmo.
      const siblings = el.parentElement
        ? Array.from(el.parentElement.children).filter((c) => c.hasAttribute('data-reveal'))
        : [el];
      const localIndex = siblings.indexOf(el);
      el.style.setProperty('--reveal-delay', `${Math.min(localIndex * 80, 320)}ms`);
      observer.observe(el);
    });
  } else {
    // Fallback: sin IntersectionObserver, mostrar todo de inmediato
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  }

  // ---- Scroll suave desde la flecha del hero hacia proyectos ----
  const heroArrow = document.querySelector('.hero__arrow');
  const projectsSection = document.querySelector('.projects-section');

  if (heroArrow && projectsSection) {
    heroArrow.addEventListener('click', () => {
      projectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    heroArrow.setAttribute('role', 'button');
    heroArrow.setAttribute('tabindex', '0');
    heroArrow.setAttribute('aria-label', 'Ir a la sección de proyectos');
    heroArrow.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        projectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // ---- Parallax sutil en las cards del hero ----
  // Referencia: la sensación de profundidad de MetaMask/Swag, traducida a
  // un mousemove simple. Se desactiva en touch (no hay cursor) y en
  // prefers-reduced-motion (accesibilidad > efecto).
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = window.matchMedia('(hover: none)').matches;
  const heroStage = document.querySelector('.hero__stage');
  const parallaxEls = document.querySelectorAll('[data-parallax]');

  if (heroStage && parallaxEls.length && !prefersReducedMotion && !isTouchDevice) {
    let rafId = null;

    heroStage.addEventListener('mousemove', (e) => {
      const rect = heroStage.getBoundingClientRect();
      const relX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const relY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        parallaxEls.forEach((el) => {
          const depth = parseFloat(el.getAttribute('data-depth')) || 10;
          el.style.setProperty('--parallax-x', `${relX * depth}px`);
          el.style.setProperty('--parallax-y', `${relY * depth}px`);
        });
      });
    });

    heroStage.addEventListener('mouseleave', () => {
      parallaxEls.forEach((el) => {
        el.style.setProperty('--parallax-x', '0px');
        el.style.setProperty('--parallax-y', '0px');
      });
    });
  }

});
