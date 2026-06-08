/**
 * Mobile-friendly muted video autoplay.
 * On mobile project pages, videos play when they enter the viewport and pause when they leave.
 * Browsers may still block programmatic play() without a user gesture; unlock listeners retry on first touch.
 */
(function () {
  const MOBILE_QUERY = '(max-width: 767px)';
  let gestureUnlocked = false;
  let viewportObserver = null;

  function isMobile() {
    return window.matchMedia(MOBILE_QUERY).matches;
  }

  function isFullpageHome() {
    return Boolean(document.getElementById('fullpage'));
  }

  function shouldUseViewportAutoplay() {
    return isMobile() && !isFullpageHome();
  }

  function prepareMutedInlineVideo(video) {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
  }

  function attemptPlay(video) {
    if (!video || video.tagName !== 'VIDEO') return;
    prepareMutedInlineVideo(video);
    const promise = video.play();
    if (promise !== undefined) {
      promise.catch(() => {});
    }
  }

  function attemptPlayWhenReady(video) {
    attemptPlay(video);
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      video.addEventListener('canplay', () => attemptPlay(video), { once: true });
    }
  }

  function pauseVideo(video) {
    if (video && !video.paused) {
      video.pause();
    }
  }

  function isVideoInViewport(video) {
    const rect = video.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 0 && rect.height > 0;
  }

  function playVisibleAutoplayVideos() {
    if (!shouldUseViewportAutoplay()) return;

    document.querySelectorAll('video[autoplay]').forEach((video) => {
      if (isVideoInViewport(video)) {
        attemptPlayWhenReady(video);
      }
    });
  }

  function playAllAutoplayVideos() {
    if (isFullpageHome()) {
      document.dispatchEvent(new CustomEvent('video-autoplay:unlock'));
      return;
    }

    document.querySelectorAll('video[autoplay]').forEach(attemptPlayWhenReady);
  }

  function unlockFromUserGesture() {
    if (gestureUnlocked) return;
    gestureUnlocked = true;
    playAllAutoplayVideos();
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
    if (isFullpageHome()) return;

    const videos = document.querySelectorAll('video[autoplay]');
    if (!videos.length) return;

    if (viewportObserver) {
      viewportObserver.disconnect();
    }

    const useViewportAutoplay = shouldUseViewportAutoplay();

    viewportObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            if (useViewportAutoplay || gestureUnlocked) {
              attemptPlayWhenReady(video);
            }
          } else if (useViewportAutoplay) {
            pauseVideo(video);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -5% 0px' }
    );

    videos.forEach((video) => {
      prepareMutedInlineVideo(video);
      viewportObserver.observe(video);
    });
  }

  function handleViewportModeChange() {
    observeAutoplayVideos();
    if (shouldUseViewportAutoplay()) {
      playVisibleAutoplayVideos();
    } else if (gestureUnlocked) {
      playAllAutoplayVideos();
    }
  }

  function init() {
    document.querySelectorAll('video[autoplay]').forEach(prepareMutedInlineVideo);
    observeAutoplayVideos();
    registerPassiveUnlockListeners();
    playVisibleAutoplayVideos();
    window.addEventListener('load', playVisibleAutoplayVideos, { once: true });
    window.matchMedia(MOBILE_QUERY).addEventListener('change', handleViewportModeChange);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.VideoAutoplay = {
    attemptPlay: attemptPlayWhenReady,
    unlockFromUserGesture,
  };
})();
