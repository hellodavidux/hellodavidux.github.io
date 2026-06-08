/**
 * Muted inline video autoplay.
 * Fullpage homepage: play/pause is driven by section activation (transform-based nav).
 * Card pages: play/pause is driven by IntersectionObserver on video containers.
 * iOS requires play() inside a user-gesture handler — primeSectionVideos() is called
 * synchronously from touch/pointer handlers before section transitions.
 */
(function () {
  const MOBILE_QUERY = '(max-width: 767px)';
  const VIDEO_SELECTOR = 'video[autoplay]';
  const CARD_SECTION_SELECTOR =
    '.video-animation, .video-frame, .intro-hero-video, .animate-on-scroll';
  const FULLPAGE_SELECTOR = '#fullpage';
  const ACTIVE_SECTION_SELECTOR = '#fullpage .section.active';
  const VIEWPORT_OPTIONS = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
  const RETRY_DELAYS_MS = [0, 50, 150, 400, 900];

  let gestureUnlocked = false;
  let viewportObserver = null;
  let cardSectionObserver = null;
  let cardVisibilityObserver = null;
  let fullpageClassObserver = null;
  let scrollRefreshFrame = null;
  let activeFullpageSection = null;

  function isFullpageSite() {
    return Boolean(document.querySelector(FULLPAGE_SELECTOR));
  }

  function prepareMutedInlineVideo(video) {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
  }

  function isVideoDisplayed(video) {
    const rect = video.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;

    const style = window.getComputedStyle(video);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

  function playVideo(video, options) {
    const ignoreViewport = options && options.ignoreViewport;
    if (!video || video.tagName !== 'VIDEO') return;
    if (!ignoreViewport && !isVideoDisplayed(video)) return;

    prepareMutedInlineVideo(video);
    const promise = video.play();
    if (promise !== undefined) {
      promise.catch(function () {});
    }
  }

  function pauseVideo(video) {
    if (video && !video.paused) {
      video.pause();
    }
  }

  function playVideosInContainer(container, options) {
    if (!container) return;
    container.querySelectorAll(VIDEO_SELECTOR).forEach(function (video) {
      if (ignoreViewportOrDisplayed(options, video)) {
        playVideo(video, options);
      }
    });
  }

  function ignoreViewportOrDisplayed(options, video) {
    if (options && options.ignoreViewport) return true;
    return isVideoDisplayed(video);
  }

  function pauseVideosInContainer(container) {
    if (!container) return;
    container.querySelectorAll(VIDEO_SELECTOR).forEach(pauseVideo);
  }

  function schedulePlaybackRetries(container) {
    RETRY_DELAYS_MS.forEach(function (delay) {
      window.setTimeout(function () {
        playVideosInContainer(container);
      }, delay);
    });
  }

  function getActiveFullpageSection() {
    return document.querySelector(ACTIVE_SECTION_SELECTOR);
  }

  function setActiveFullpageSection(section) {
    if (!isFullpageSite() || !section) return;

    if (activeFullpageSection && activeFullpageSection !== section) {
      pauseVideosInContainer(activeFullpageSection);
    }

    activeFullpageSection = section;
    playVideosInContainer(section);
    schedulePlaybackRetries(section);
  }

  function primeSectionVideos(section) {
    if (!section) return;

    gestureUnlocked = true;
    playVideosInContainer(section, { ignoreViewport: true });
  }

  function unlockFromUserGesture() {
    const wasUnlocked = gestureUnlocked;
    gestureUnlocked = true;

    if (!wasUnlocked) {
      document.dispatchEvent(new CustomEvent('video-autoplay:unlock'));
    }

    if (isFullpageSite()) {
      const activeSection = getActiveFullpageSection();
      if (activeSection) {
        playVideosInContainer(activeSection, { ignoreViewport: true });
      }
      return;
    }

    playVisibleAutoplayVideos();
  }

  function isVideoInViewport(video) {
    if (!isVideoDisplayed(video)) return false;
    const rect = video.getBoundingClientRect();
    const viewHeight = window.innerHeight || document.documentElement.clientHeight;
    return rect.bottom > 0 && rect.top < viewHeight;
  }

  function playVisibleAutoplayVideos() {
    document.querySelectorAll(VIDEO_SELECTOR).forEach(function (video) {
      if (isVideoInViewport(video)) {
        playVideo(video);
      }
    });
  }

  function pauseOffscreenAutoplayVideos() {
    document.querySelectorAll(VIDEO_SELECTOR).forEach(function (video) {
      if (activeFullpageSection && activeFullpageSection.contains(video)) return;
      if (!isVideoInViewport(video)) {
        pauseVideo(video);
      }
    });
  }

  function registerPassiveUnlockListeners() {
    ['touchstart', 'pointerdown', 'keydown'].forEach(function (eventName) {
      document.addEventListener(eventName, unlockFromUserGesture, {
        once: true,
        passive: true,
        capture: true,
      });
    });
  }

  function observeAutoplayVideos() {
    const videos = document.querySelectorAll(VIDEO_SELECTOR);
    if (!videos.length) return;

    if (viewportObserver) {
      viewportObserver.disconnect();
    }

    viewportObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          const video = entry.target;
          if (entry.isIntersecting) {
            playVideo(video);
            return;
          }
          if (activeFullpageSection && activeFullpageSection.contains(video)) return;
          pauseVideo(video);
        });
      },
      VIEWPORT_OPTIONS
    );

    videos.forEach(function (video) {
      prepareMutedInlineVideo(video);
      viewportObserver.observe(video);
    });
  }

  function getCardVideoSections() {
    return Array.from(document.querySelectorAll(CARD_SECTION_SELECTOR)).filter(function (section) {
      return section.querySelector(VIDEO_SELECTOR);
    });
  }

  function observeCardVideoSections() {
    const sections = getCardVideoSections();
    if (!sections.length) return;

    if (cardSectionObserver) {
      cardSectionObserver.disconnect();
    }

    cardSectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            playVideosInContainer(entry.target);
          } else {
            pauseVideosInContainer(entry.target);
          }
        });
      },
      VIEWPORT_OPTIONS
    );

    sections.forEach(function (section) {
      cardSectionObserver.observe(section);
    });
  }

  function observeCardVisibleClass() {
    const sections = getCardVideoSections();
    if (!sections.length) return;

    if (cardVisibilityObserver) {
      cardVisibilityObserver.disconnect();
    }

    cardVisibilityObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type !== 'attributes' || mutation.attributeName !== 'class') return;

        const section = mutation.target;
        if (section.classList.contains('visible')) {
          playVideosInContainer(section);
        }
      });
    });

    sections.forEach(function (section) {
      cardVisibilityObserver.observe(section, {
        attributes: true,
        attributeFilter: ['class'],
      });

      if (section.classList.contains('visible')) {
        playVideosInContainer(section);
      }
    });
  }

  function observeFullpageSections() {
    const fullpage = document.getElementById('fullpage');
    if (!fullpage) return;

    const sections = fullpage.querySelectorAll('.section');
    if (!sections.length) return;

    if (fullpageClassObserver) {
      fullpageClassObserver.disconnect();
    }

    fullpageClassObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type !== 'attributes' || mutation.attributeName !== 'class') return;
        if (!mutation.target.classList.contains('active')) return;
        setActiveFullpageSection(mutation.target);
      });
    });

    sections.forEach(function (section) {
      fullpageClassObserver.observe(section, {
        attributes: true,
        attributeFilter: ['class'],
      });

      if (section.classList.contains('active')) {
        setActiveFullpageSection(section);
      }
    });
  }

  function refreshVisible() {
    if (isFullpageSite()) {
      if (activeFullpageSection) {
        playVideosInContainer(activeFullpageSection);
      }
      return;
    }

    pauseOffscreenAutoplayVideos();
    playVisibleAutoplayVideos();
  }

  function scheduleRefreshVisible() {
    if (scrollRefreshFrame !== null) return;
    scrollRefreshFrame = window.requestAnimationFrame(function () {
      scrollRefreshFrame = null;
      refreshVisible();
    });
  }

  function setupObservers() {
    observeAutoplayVideos();

    if (isFullpageSite()) {
      observeFullpageSections();
      return;
    }

    observeCardVideoSections();
    observeCardVisibleClass();
  }

  function initFullpageVideos() {
    const fullpage = document.getElementById('fullpage');
    if (!fullpage) return;

    fullpage.querySelectorAll(VIDEO_SELECTOR).forEach(function (video) {
      prepareMutedInlineVideo(video);
    });

    fullpage.querySelectorAll('.section').forEach(function (section) {
      if (!section.classList.contains('active')) {
        pauseVideosInContainer(section);
      }
    });

    const activeSection = getActiveFullpageSection();
    if (activeSection) {
      setActiveFullpageSection(activeSection);
    }
  }

  function initCardVideos() {
    document.querySelectorAll(VIDEO_SELECTOR).forEach(function (video) {
      prepareMutedInlineVideo(video);
      video.pause();
    });
  }

  function handleViewportModeChange() {
    setupObservers();
    refreshVisible();
  }

  function init() {
    if (isFullpageSite()) {
      initFullpageVideos();
    } else {
      initCardVideos();
    }

    setupObservers();
    registerPassiveUnlockListeners();
    refreshVisible();

    window.addEventListener(
      'load',
      function () {
        setupObservers();
        refreshVisible();
        window.requestAnimationFrame(refreshVisible);
      },
      { once: true }
    );

    if (!isFullpageSite()) {
      window.addEventListener('scroll', scheduleRefreshVisible, { passive: true });
    }

    window.addEventListener('resize', scheduleRefreshVisible, { passive: true });
    window.addEventListener('hashchange', scheduleRefreshVisible);
    window.matchMedia(MOBILE_QUERY).addEventListener('change', handleViewportModeChange);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.VideoAutoplay = {
    playVideo: playVideo,
    playVideosInContainer: playVideosInContainer,
    primeSectionVideos: primeSectionVideos,
    setActiveFullpageSection: setActiveFullpageSection,
    refreshVisible: refreshVisible,
    setupObservers: setupObservers,
    unlockFromUserGesture: unlockFromUserGesture,
    playSectionVideos: playVideosInContainer,
  };
})();
