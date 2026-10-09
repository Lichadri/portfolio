/* ==========================================================================
   MAIN.JS
   Responsabilidades: reveal-on-scroll, scroll suave del hero, avatar
   flotante, typewriter de la cita, carrusel y la demo de la cadena de tokens. Nada de
   librerías externas — el motion vive en CSS (transiciones/keyframes), este
   script solo agrega/quita la clase que las dispara. Así, si mañana quitas
   el JS, el sitio sigue siendo funcional (progressive enhancement): la demo
   de tokens tiene un texto de respaldo que se oculta cuando el JS corre.
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

  // ---- Cadena de tokens (sección Sistemas) ----
  // Ilustra la arquitectura de tres capas de Dalton (primitivo → semántico →
  // componente) con los tokens reales de ESTE sitio: los valores se leen de
  // :root, así que si un token cambia en tokens.css, la demo cambia sola.
  // Los nombres son genéricos a propósito — no son los tokens de Dalton.
  const tokenDemo = document.getElementById('token-demo');

  if (tokenDemo) {
    const tokenFallback = document.querySelector('.token-demo__fallback');
    tokenDemo.hidden = false;
    if (tokenFallback) tokenFallback.hidden = true;

    const cssVar = (name) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    const prim = {
      'lima-500': '--color-accent-lime',
      'lima-800': '--color-metric-text',
      'ink-900': '--color-hero-ink',
      'paper-50': '--color-hero-bg',
      'paper-200': '--color-hero-surface'
    };
    const sem = {
      'action/primary': { light: 'lima-800', dark: 'lima-500' },
      'surface/default': { light: 'paper-50', dark: 'ink-900' },
      'text/default': { light: 'ink-900', dark: 'paper-50' },
      'text/on-action': { light: 'paper-50', dark: 'ink-900' }
    };
    const comp = {
      'card/bg': 'surface/default',
      'card/text': 'text/default',
      'button/bg': 'action/primary',
      'button/label': 'text/on-action'
    };

    let mode = 'light';
    let hovered = null;
    let pinned = null;

    const chain = document.getElementById('token-chain');
    const svg = document.getElementById('token-links');
    const preview = document.getElementById('token-preview');
    const previewBtn = preview.querySelector('.token-preview__btn');
    const lists = {
      prim: document.getElementById('tok-prim'),
      sem: document.getElementById('tok-sem'),
      comp: document.getElementById('tok-comp')
    };

    const makeToken = (name, tag) => {
      const li = document.createElement('li');
      const el = document.createElement(tag);
      const swatch = document.createElement('span');
      el.className = 'token';
      swatch.className = 'token__swatch';
      el.appendChild(swatch);
      el.appendChild(document.createTextNode(name));
      li.appendChild(el);
      return { li, el };
    };

    const P = {};
    const S = {};
    const C = {};

    Object.keys(prim).forEach((k) => {
      const t = makeToken(k, 'div');
      P[k] = t.el;
      lists.prim.appendChild(t.li);
    });
    Object.keys(sem).forEach((k) => {
      const t = makeToken(k, 'div');
      S[k] = t.el;
      lists.sem.appendChild(t.li);
    });

    const active = () => hovered || pinned;
    const hexOf = (primName) => cssVar(prim[primName]);
    const resolveComp = (c) => hexOf(sem[comp[c]][mode]);

    const point = (el, side) => {
      const a = el.getBoundingClientRect();
      const b = chain.getBoundingClientRect();
      return {
        x: (side === 'r' ? a.right : a.left) - b.left,
        y: a.top + a.height / 2 - b.top
      };
    };

    const link = (from, to, faint, delay, animate) => {
      const p1 = point(from, 'r');
      const p2 = point(to, 'l');
      const dx = (p2.x - p1.x) / 2;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute(
        'd',
        'M' + p1.x + ',' + p1.y + ' C' + (p1.x + dx) + ',' + p1.y + ' ' +
          (p2.x - dx) + ',' + p2.y + ' ' + p2.x + ',' + p2.y
      );
      if (faint) path.classList.add('is-faint');
      svg.appendChild(path);

      if (animate && !reducedMotionQuery.matches) {
        const len = path.getTotalLength();
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = len;
        requestAnimationFrame(() => {
          path.style.transition =
            'stroke-dashoffset 520ms var(--easing-standard) ' + delay + 'ms';
          path.style.strokeDashoffset = 0;
        });
      }
    };

    const paint = (animate) => {
      svg.textContent = '';
      const a = active();
      const aSem = a ? comp[a] : null;
      const aPrim = aSem ? sem[aSem][mode] : null;
      const used = new Set(Object.values(sem).map((v) => v[mode]));

      Object.entries(P).forEach(([k, el]) => {
        el.querySelector('.token__swatch').style.background = hexOf(k);
        el.classList.toggle('is-dim', !used.has(k) || (!!a && k !== aPrim));
        el.classList.toggle('is-hot', k === aPrim);
      });
      Object.entries(S).forEach(([k, el]) => {
        el.querySelector('.token__swatch').style.background = hexOf(sem[k][mode]);
        el.classList.toggle('is-dim', !!a && k !== aSem);
        el.classList.toggle('is-hot', k === aSem);
      });
      Object.entries(C).forEach(([k, el]) => {
        el.querySelector('.token__swatch').style.background = resolveComp(k);
        el.classList.toggle('is-dim', !!a && k !== a);
        el.classList.toggle('is-hot', k === a);
        el.setAttribute('aria-pressed', String(k === pinned));
      });

      let i = 0;
      Object.keys(sem).forEach((s) =>
        link(P[sem[s][mode]], S[s], !!a && s !== aSem, i++ * 70, animate)
      );
      Object.keys(comp).forEach((c) =>
        link(S[comp[c]], C[c], !!a && c !== a, 300 + i++ * 70, animate)
      );

      preview.style.background = resolveComp('card/bg');
      preview.style.color = resolveComp('card/text');
      preview.style.borderColor =
        mode === 'light' ? cssVar('--color-hero-line') : 'transparent';
      previewBtn.style.background = resolveComp('button/bg');
      previewBtn.style.color = resolveComp('button/label');
    };

    // Los chips de componente son botones reales: hover/foco resaltan la
    // cadena, y el clic la fija (aria-pressed) para que el botón haga algo.
    Object.keys(comp).forEach((k) => {
      const t = makeToken(k, 'button');
      t.el.type = 'button';
      t.el.setAttribute('aria-label', 'Resaltar la cadena de ' + k);
      const on = () => { hovered = k; paint(false); };
      const off = () => { hovered = null; paint(false); };
      t.el.addEventListener('mouseenter', on);
      t.el.addEventListener('focus', on);
      t.el.addEventListener('mouseleave', off);
      t.el.addEventListener('blur', off);
      t.el.addEventListener('click', () => {
        pinned = pinned === k ? null : k;
        paint(false);
      });
      C[k] = t.el;
      lists.comp.appendChild(t.li);
    });

    tokenDemo.querySelectorAll('.mode-switch button').forEach((btn) => {
      btn.addEventListener('click', () => {
        mode = btn.dataset.mode;
        tokenDemo.querySelectorAll('.mode-switch button').forEach((x) => {
          x.setAttribute('aria-pressed', String(x === btn));
        });
        paint(true);
      });
    });

    paint(false);

    // Único momento orquestado: la cadena se dibuja al entrar en pantalla.
    if ('IntersectionObserver' in window) {
      const drawObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            paint(true);
            drawObserver.disconnect();
          }
        },
        { threshold: 0.4 }
      );
      drawObserver.observe(chain);
    }

    window.addEventListener('resize', () => paint(false));
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => paint(false));
    }
  }

  // ---- Carrusel de proyectos ----
  const carouselTrack = document.getElementById('carousel-track');
  const carouselPrev = document.getElementById('carousel-prev');
  const carouselNext = document.getElementById('carousel-next');

  if (carouselTrack && carouselPrev && carouselNext) {
    // Gap leído desde el token real (--space-24), no hardcodeado — mismo
    // patrón que ya usa el typewriter del quote-panel para
    // --motion-reveal-char. Si el token cambia algún día, el carrusel
    // scrollea consistente con lo que el ojo ve, sin tocar JS.
    const cardGap = () =>
      parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--space-24'),
        10
      ) || 24;

    const scrollAmount = () => {
      const card = carouselTrack.querySelector('.carousel-card');
      return card ? card.offsetWidth + cardGap() : 320;
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
