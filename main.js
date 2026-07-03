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
  const heroSection = document.querySelector('.hero-b, .case-hero, .about-hero');
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

  // ---- Quote-panel: typewriter + corner-draw ----
  // Primera vez por sesión: typewriter letra a letra + corners dibujándose.
  // Siguientes veces (o prefers-reduced-motion): contenido completo directo,
  // sin cursor ni animación de escritura (evita fatiga — Ley de Jakob — y
  // respeta accesibilidad).
  const quotePanel = document.querySelector('.quote-panel');
  const quoteTextEl = document.getElementById('quote-typewriter');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (quotePanel && quoteTextEl) {
    const fullText = quoteTextEl.getAttribute('data-typewriter') || quoteTextEl.textContent.trim();
    const alreadyPlayed = sessionStorage.getItem('specCardTypewriterPlayed') === 'true';
    const skipTypewriter = alreadyPlayed || reducedMotionQuery.matches;

    const runTypewriter = () => {
      quoteTextEl.textContent = '';
      const cursor = document.createElement('span');
      cursor.className = 'quote-panel__cursor';
      quoteTextEl.appendChild(cursor);

      let i = 0;
      const charDelay = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--motion-reveal-char'),
        10
      ) || 18;

      const typeNext = () => {
        if (i < fullText.length) {
          cursor.insertAdjacentText('beforebegin', fullText[i]);
          i += 1;
          setTimeout(typeNext, charDelay);
        } else {
          cursor.remove();
          sessionStorage.setItem('specCardTypewriterPlayed', 'true');
        }
      };
      typeNext();
    };

    const revealQuote = () => {
      quotePanel.classList.add('is-drawn');
      if (skipTypewriter) {
        quoteTextEl.textContent = fullText;
      } else {
        runTypewriter();
      }
    };

    if ('IntersectionObserver' in window) {
      const quoteObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              revealQuote();
              quoteObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      quoteObserver.observe(quotePanel);
    } else {
      revealQuote();
    }
  }

  // ---- Carrusel de proyectos ----
  const carouselTrack = document.getElementById('carousel-track');
  const carouselPrev = document.getElementById('carousel-prev');
  const carouselNext = document.getElementById('carousel-next');

  if (carouselTrack && carouselPrev && carouselNext) {
    const scrollAmount = () => {
      const card = carouselTrack.querySelector('.carousel-card');
      return card ? card.offsetWidth + 24 : 320;
    };

    const updateArrowState = () => {
      const maxScroll = carouselTrack.scrollWidth - carouselTrack.clientWidth;
      carouselPrev.disabled = carouselTrack.scrollLeft <= 4;
      carouselNext.disabled = carouselTrack.scrollLeft >= maxScroll - 4;
    };

    carouselPrev.addEventListener('click', () => {
      carouselTrack.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
    });
    carouselNext.addEventListener('click', () => {
      carouselTrack.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
    });
    carouselTrack.addEventListener('scroll', updateArrowState);
    updateArrowState();
  }

});
