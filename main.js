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

  // ---- Scroll suave desde el scroll-cue del hero hacia proyectos ----
  const heroScrollCue = document.getElementById('hero-scroll-cue');
  const projectsSection = document.querySelector('.projects-section');

  if (heroScrollCue && projectsSection) {
    heroScrollCue.addEventListener('click', () => {
      projectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    heroScrollCue.setAttribute('role', 'button');
    heroScrollCue.setAttribute('tabindex', '0');
    heroScrollCue.setAttribute('aria-label', 'Ir a la sección de proyectos');
    heroScrollCue.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        projectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // ---- Avatar flotante persistente ----
  // Aparece después de pasar el hero, y se oculta de nuevo al llegar al
  // footer (evita que compita visualmente con el logo "AB" del footer —
  // dos elementos idénticos en la misma esquina rompen la heurística de
  // consistencia de Nielsen).
  const floatingAvatar = document.getElementById('floating-avatar');
  const heroSection = document.querySelector('.hero-b, .case-hero');
  const footerSection = document.querySelector('.footer');

  if (floatingAvatar && heroSection) {
    let pastHero = false;
    let nearFooter = false;

    const updateAvatarVisibility = () => {
      floatingAvatar.classList.toggle('is-visible', pastHero && !nearFooter);
    };

    if ('IntersectionObserver' in window) {
      const heroObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            pastHero = !entry.isIntersecting;
            updateAvatarVisibility();
          });
        },
        { threshold: 0 }
      );
      heroObserver.observe(heroSection);

      if (footerSection) {
        const footerObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              nearFooter = entry.isIntersecting;
              updateAvatarVisibility();
            });
          },
          { threshold: 0, rootMargin: '0px 0px -10% 0px' }
        );
        footerObserver.observe(footerSection);
      }
    } else {
      floatingAvatar.classList.add('is-visible');
    }

    floatingAvatar.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

});
