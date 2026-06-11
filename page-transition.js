/**
 * Monochrome curtain page transitions for project navigation.
 */
(function () {
  'use strict';

  const STORAGE_MODE = 'page-transition-mode';
  const STORAGE_COLOR = 'page-transition-color';
  const CURTAIN_ID = 'page-transition-curtain';
  const DURATION_OUT = 680;
  const DURATION_IN = 780;
  const EASING = 'cubic-bezier(0.76, 0, 0.24, 1)';

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let isTransitioning = false;
  let enterAnimationStarted = false;

  function isHomepage() {
    return Boolean(document.getElementById('fullpage'));
  }

  function cleanupStuckCurtain() {
    const curtain = document.getElementById(CURTAIN_ID);
    if (curtain) {
      curtain.remove();
    }
    isTransitioning = false;
    document.documentElement.style.backgroundColor = '';
  }

  function notifyHomepageRestore() {
    if (!isHomepage()) {
      return;
    }
    document.dispatchEvent(new CustomEvent('homepage:restore'));
  }

  function getCurtain(color) {
    let curtain = document.getElementById(CURTAIN_ID);
    if (!curtain) {
      curtain = document.createElement('div');
      curtain.id = CURTAIN_ID;
      curtain.className = 'page-transition-curtain';
      curtain.setAttribute('aria-hidden', 'true');
      document.body.appendChild(curtain);
    }
    if (color) {
      curtain.style.setProperty('--curtain-color', color);
    }
    return curtain;
  }

  function runAnimation(curtain, keyframes, duration) {
    if (reducedMotion) {
      return Promise.resolve();
    }

    const finalTransform = keyframes[keyframes.length - 1].transform;

    if (typeof curtain.animate !== 'function') {
      curtain.style.transition = `transform ${duration}ms ${EASING}`;
      curtain.style.transform = finalTransform;
      return new Promise((resolve) => {
        setTimeout(resolve, duration);
      });
    }

    const animation = curtain.animate(keyframes, {
      duration,
      easing: EASING,
      fill: 'forwards',
    });

    return Promise.race([
      animation.finished.catch(() => undefined),
      new Promise((resolve) => {
        setTimeout(resolve, duration + 40);
      }),
    ]).then(() => {
      curtain.style.transform = finalTransform;
    });
  }

  function runEnterIfNeeded() {
    if (enterAnimationStarted) {
      return;
    }

    const mode = sessionStorage.getItem(STORAGE_MODE);
    if (!mode || reducedMotion) {
      sessionStorage.removeItem(STORAGE_MODE);
      sessionStorage.removeItem(STORAGE_COLOR);
      return;
    }

    enterAnimationStarted = true;
    const color = sessionStorage.getItem(STORAGE_COLOR) || '#f0f1f3';
    sessionStorage.removeItem(STORAGE_MODE);
    sessionStorage.removeItem(STORAGE_COLOR);

    const startEnter = () => {
      cleanupStuckCurtain();

      const curtain = getCurtain(color);
      curtain.classList.add('page-transition-curtain--active');
      curtain.style.transform = 'translateY(0)';

      requestAnimationFrame(() => {
        const exitKeyframes =
          mode === 'back'
            ? [
                { transform: 'translateY(0)' },
                { transform: 'translateY(-100%)' },
              ]
            : [
                { transform: 'translateY(0)' },
                { transform: 'translateY(100%)' },
              ];

        runAnimation(curtain, exitKeyframes, DURATION_IN).then(() => {
          curtain.classList.remove('page-transition-curtain--active');
          curtain.remove();
          document.documentElement.style.backgroundColor = '';
          isTransitioning = false;

          if (mode === 'back') {
            notifyHomepageRestore();
          }
        });
      });
    };

    if (document.body) {
      startEnter();
    } else {
      document.addEventListener('DOMContentLoaded', startEnter, { once: true });
    }
  }

  function navigate(url, { color = '#f0f1f3', direction = 'forward' } = {}) {
    if (isTransitioning) {
      return Promise.resolve();
    }

    if (reducedMotion) {
      window.location.href = url;
      return Promise.resolve();
    }

    isTransitioning = true;
    const curtain = getCurtain(color);
    curtain.classList.add('page-transition-curtain--active');

    const coverKeyframes =
      direction === 'back'
        ? [
            { transform: 'translateY(100%)' },
            { transform: 'translateY(0)' },
          ]
        : [
            { transform: 'translateY(-100%)' },
            { transform: 'translateY(0)' },
          ];

    curtain.style.transform = coverKeyframes[0].transform;

    return runAnimation(curtain, coverKeyframes, DURATION_OUT)
      .then(() => {
        sessionStorage.setItem(STORAGE_MODE, direction);
        sessionStorage.setItem(STORAGE_COLOR, color);
        window.location.href = url;
      })
      .catch(() => {
        isTransitioning = false;
        window.location.href = url;
      });
  }

  function getSectionCurtainColor(link) {
    const section = link.closest('.section');
    if (!section) {
      return '#f0f1f3';
    }

    const darkSections = new Set([
      'project-org-agent-library',
      'project-agentic-lifecycle',
      'project1',
      'project2',
    ]);

    return darkSections.has(section.id) ? '#0a0a0a' : '#f0f1f3';
  }

  function isBackLink(link) {
    return link.id === 'back-home' || link.classList.contains('back-home');
  }

  function isTransitionLink(link) {
    if (!link || link.target === '_blank' || link.hasAttribute('download')) {
      return false;
    }

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return false;
    }

    if (href.startsWith('cards/')) {
      return true;
    }

    if (isBackLink(link)) {
      return true;
    }

    if (link.classList.contains('next-project-card__link')) {
      return true;
    }

    return false;
  }

  function resolveTransition(link) {
    if (isBackLink(link)) {
      return { direction: 'back', color: '#f0f1f3' };
    }

    return {
      direction: 'forward',
      color: getSectionCurtainColor(link),
    };
  }

  document.addEventListener(
    'click',
    function (event) {
      const link = event.target.closest('a');
      if (!isTransitionLink(link)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const { direction, color } = resolveTransition(link);
      navigate(link.href, { color, direction });
    },
    true
  );

  window.PageTransition = { navigate };

  window.addEventListener('pageshow', function (event) {
    const pendingMode = sessionStorage.getItem(STORAGE_MODE);

    if (event.persisted && pendingMode && isHomepage()) {
      window.location.reload();
      return;
    }

    if (event.persisted && isHomepage()) {
      cleanupStuckCurtain();
      notifyHomepageRestore();
      return;
    }

    if (pendingMode && isHomepage()) {
      runEnterIfNeeded();
    }
  });

  if (sessionStorage.getItem(STORAGE_MODE)) {
    const pendingColor = sessionStorage.getItem(STORAGE_COLOR) || '#f0f1f3';
    document.documentElement.style.backgroundColor = pendingColor;
  }

  runEnterIfNeeded();
})();
