/**
 * Muted video autoplay when videos enter the viewport.
 * Videos pause when they leave the viewport. Browsers may block programmatic play()
 * without a user gesture on mobile; unlock listeners retry on first touch.
 */
(function () {
  const MOBILE_QUERY = '(max-width: 767px)';
  let gestureUnlocked = false;
  let viewportObserver = null;

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
    document.querySelectorAll('video[autoplay]').forEach((video) => {
      if (isVideoInViewport(video)) {
        attemptPlayWhenReady(video);
      }
    });
  }

  function pauseOffscreenAutoplayVideos() {
    document.querySelectorAll('video[autoplay]').forEach((video) => {
      if (!isVideoInViewport(video)) {
        pauseVideo(video);
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
    const videos = document.querySelectorAll('video[autoplay]');
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
      { threshold: 0.15, rootMargin: '0px 0px -5% 0px' }
    );

    videos.forEach((video) => {
      prepareMutedInlineVideo(video);
      viewportObserver.observe(video);
    });
  }

  function refreshVisible() {
    pauseOffscreenAutoplayVideos();
    playVisibleAutoplayVideos();
  }

  function handleViewportModeChange() {
    observeAutoplayVideos();
    refreshVisible();
  }

  function init() {
    document.querySelectorAll('video[autoplay]').forEach((video) => {
      prepareMutedInlineVideo(video);
      video.pause();
    });
    observeAutoplayVideos();
    registerPassiveUnlockListeners();
    refreshVisible();
    window.addEventListener('load', refreshVisible, { once: true });
    window.matchMedia(MOBILE_QUERY).addEventListener('change', handleViewportModeChange);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.VideoAutoplay = {
    attemptPlay: attemptPlayWhenReady,
    refreshVisible,
    unlockFromUserGesture,
  };
})();
