/**
 * Muted video autoplay when videos enter the viewport.
 * Videos pause when they leave the viewport. Browsers may block programmatic play()
 * without a user gesture on mobile; unlock listeners retry on first touch.
 */
(function () {
  const MOBILE_QUERY = '(max-width: 767px)';
  const SECTION_SELECTOR =
    '.video-animation, .video-frame, .intro-hero-video, .animate-on-scroll';
  const VIDEO_SELECTOR = 'video[autoplay]';
  const VIEWPORT_OPTIONS = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
  let gestureUnlocked = false;
  let viewportObserver = null;
  let sectionObserver = null;
  let visibilityObserver = null;
  let scrollRefreshFrame = null;

  function prepareMutedInlineVideo(video) {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
  }

  function isVideoDisplayed(video) {
    const rect = video.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return false;
    }

    const style = window.getComputedStyle(video);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

  function attemptPlay(video) {
    if (!video || video.tagName !== 'VIDEO' || !isVideoDisplayed(video)) return;
    prepareMutedInlineVideo(video);
    const promise = video.play();
    if (promise !== undefined) {
      promise.catch(() => {});
    }
  }

  function attemptPlayWhenReady(video) {
    if (!video || video.tagName !== 'VIDEO' || !isVideoDisplayed(video)) return;
    attemptPlay(video);
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      video.addEventListener('canplay', () => attemptPlay(video), { once: true });
      video.addEventListener('loadeddata', () => attemptPlay(video), { once: true });
    }
  }

  function pauseVideo(video) {
    if (video && !video.paused) {
      video.pause();
    }
  }

  function isVideoInViewport(video) {
    if (!isVideoDisplayed(video)) return false;
    const rect = video.getBoundingClientRect();
    const viewHeight = window.innerHeight || document.documentElement.clientHeight;
    return rect.bottom > 0 && rect.top < viewHeight;
  }

  function playVisibleAutoplayVideos() {
    document.querySelectorAll(VIDEO_SELECTOR).forEach((video) => {
      if (isVideoInViewport(video)) {
        attemptPlayWhenReady(video);
      }
    });
  }

  function pauseOffscreenAutoplayVideos() {
    document.querySelectorAll(VIDEO_SELECTOR).forEach((video) => {
      if (!isVideoInViewport(video)) {
        pauseVideo(video);
      }
    });
  }

  function pauseSectionVideos(section) {
    section.querySelectorAll(VIDEO_SELECTOR).forEach(pauseVideo);
  }

  function playSectionVideos(section) {
    section.querySelectorAll(VIDEO_SELECTOR).forEach((video) => {
      if (isVideoDisplayed(video) && isVideoInViewport(video)) {
        attemptPlayWhenReady(video);
      }
    });
  }

  function playVideosInContainer(container) {
    if (!container) return;
    container.querySelectorAll(VIDEO_SELECTOR).forEach((video) => {
      if (isVideoDisplayed(video)) {
        attemptPlayWhenReady(video);
      }
    });
  }

  function unlockFromUserGesture() {
    if (gestureUnlocked) return;
    gestureUnlocked = true;
    document.dispatchEvent(new CustomEvent('video-autoplay:unlock'));
    playVisibleAutoplayVideos();
  }

  function registerPassiveUnlockListeners() {
    ['touchstart', 'pointerdown', 'keydown'].forEach((eventName) => {
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
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            attemptPlayWhenReady(video);
          } else {
            pauseVideo(video);
          }
        });
      },
      VIEWPORT_OPTIONS
    );

    videos.forEach((video) => {
      prepareMutedInlineVideo(video);
      viewportObserver.observe(video);
    });
  }

  function getVideoSections() {
    return Array.from(document.querySelectorAll(SECTION_SELECTOR)).filter(
      (section) => section.querySelector(VIDEO_SELECTOR)
    );
  }

  function observeVideoSections() {
    const sections = getVideoSections();
    if (!sections.length) return;

    if (sectionObserver) {
      sectionObserver.disconnect();
    }

    sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            playSectionVideos(entry.target);
          } else {
            pauseSectionVideos(entry.target);
          }
        });
      },
      VIEWPORT_OPTIONS
    );

    sections.forEach((section) => {
      sectionObserver.observe(section);
    });
  }

  function observeVisibleClass() {
    const sections = getVideoSections();
    if (!sections.length) return;

    if (visibilityObserver) {
      visibilityObserver.disconnect();
    }

    visibilityObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type !== 'attributes' || mutation.attributeName !== 'class') {
          return;
        }

        const section = mutation.target;
        if (section.classList.contains('visible')) {
          playSectionVideos(section);
        }
      });
    });

    sections.forEach((section) => {
      visibilityObserver.observe(section, {
        attributes: true,
        attributeFilter: ['class'],
      });

      if (section.classList.contains('visible')) {
        playSectionVideos(section);
      }
    });
  }

  function refreshVisible() {
    pauseOffscreenAutoplayVideos();
    playVisibleAutoplayVideos();
  }

  function scheduleRefreshVisible() {
    if (scrollRefreshFrame !== null) return;
    scrollRefreshFrame = window.requestAnimationFrame(() => {
      scrollRefreshFrame = null;
      refreshVisible();
    });
  }

  function setupObservers() {
    observeAutoplayVideos();
    observeVideoSections();
    observeVisibleClass();
  }

  function handleViewportModeChange() {
    setupObservers();
    refreshVisible();
  }

  function init() {
    document.querySelectorAll(VIDEO_SELECTOR).forEach((video) => {
      prepareMutedInlineVideo(video);
      video.pause();
    });
    setupObservers();
    registerPassiveUnlockListeners();
    refreshVisible();
    window.addEventListener('load', () => {
      setupObservers();
      refreshVisible();
      requestAnimationFrame(refreshVisible);
    }, { once: true });
    window.addEventListener('scroll', scheduleRefreshVisible, { passive: true });
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
    attemptPlay: attemptPlayWhenReady,
    playSectionVideos,
    playVideosInContainer,
    refreshVisible,
    setupObservers,
    observeAutoplayVideos,
    observeVideoSections,
    unlockFromUserGesture,
  };
})();
