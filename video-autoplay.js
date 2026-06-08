/**
 * Mobile-friendly muted video autoplay.
 * Browsers block programmatic play() without a real user gesture; simulated clicks do not count.
 * This unlocks playback on the first touch/click/keypress and retries when videos enter view.
 */
(function () {
  let gestureUnlocked = false;

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

  function unlockFromUserGesture() {
    if (gestureUnlocked) return;
    gestureUnlocked = true;

    if (document.getElementById('fullpage')) {
      document.dispatchEvent(new CustomEvent('video-autoplay:unlock'));
      return;
    }

    document.querySelectorAll('video[autoplay]').forEach(attemptPlayWhenReady);
  }

  function observeAutoplayVideos() {
    if (document.getElementById('fullpage')) return;

    const videos = document.querySelectorAll('video[autoplay]');
    if (!videos.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            attemptPlayWhenReady(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    videos.forEach((video) => {
      prepareMutedInlineVideo(video);
      observer.observe(video);
    });
  }

  ['touchstart', 'pointerdown', 'keydown'].forEach((eventName) => {
    document.addEventListener(eventName, unlockFromUserGesture, {
      once: true,
      passive: true,
      capture: true,
    });
  });

  function init() {
    document.querySelectorAll('video[autoplay]').forEach(prepareMutedInlineVideo);
    observeAutoplayVideos();
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
