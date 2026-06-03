/**
 * Fullscreen lightbox for project page images and videos.
 */
(function () {
  const EXCLUDED_ANCESTORS =
    '#navbar, #next-project, .before-after-container, .logo-avatar, nav';
  const MEDIA_SELECTOR =
    'img.image-animation, img.slide-image, img.design-slide-image, .video-animation video, .video-animation img';

  const SWIPE_THRESHOLD_PX = 48;

  let lightbox = null;
  let gallery = [];
  let currentIndex = 0;
  let activeVideo = null;
  let lastFocusedElement = null;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchTracking = false;
  let suppressImageClickUntil = 0;

  function isExcluded(element) {
    return Boolean(element.closest(EXCLUDED_ANCESTORS));
  }

  function getMediaSrc(element) {
    if (element.tagName === 'VIDEO') {
      const source = element.querySelector('source');
      return source ? source.getAttribute('src') : element.getAttribute('src');
    }

    return element.getAttribute('src');
  }

  function getMediaElements() {
    return Array.from(document.querySelectorAll(MEDIA_SELECTOR)).filter(
      (element) => !isExcluded(element) && getMediaSrc(element)
    );
  }

  function buildGallery() {
    const seen = new Set();
    const items = [];

    getMediaElements().forEach((element) => {
      const src = getMediaSrc(element);
      if (!src || seen.has(src)) {
        return;
      }

      seen.add(src);

      items.push({
        type: element.tagName === 'VIDEO' ? 'video' : 'image',
        src,
        alt: element.getAttribute('alt') || '',
        loop: element.tagName === 'VIDEO' ? element.loop : false,
        muted: element.tagName === 'VIDEO' ? element.muted : false,
      });
    });

    return items;
  }

  function createLightbox() {
    const overlay = document.createElement('div');
    overlay.className = 'media-lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Media viewer');
    overlay.innerHTML = `
      <button type="button" class="media-lightbox__close" aria-label="Close">
        <i class="fas fa-times" aria-hidden="true"></i>
      </button>
      <button type="button" class="media-lightbox__nav media-lightbox__nav--prev" aria-label="Previous">
        <i class="fas fa-chevron-left" aria-hidden="true"></i>
      </button>
      <button type="button" class="media-lightbox__nav media-lightbox__nav--next" aria-label="Next">
        <i class="fas fa-chevron-right" aria-hidden="true"></i>
      </button>
      <div class="media-lightbox__backdrop" aria-hidden="true"></div>
      <div class="media-lightbox__panel">
        <div class="media-lightbox__counter" hidden></div>
        <div class="media-lightbox__media-wrap"></div>
        <p class="media-lightbox__caption" hidden></p>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('.media-lightbox__close').addEventListener('click', closeLightbox);
    overlay.querySelector('.media-lightbox__backdrop').addEventListener('click', closeLightbox);
    overlay.querySelector('.media-lightbox__nav--prev').addEventListener('click', () => showItem(currentIndex - 1));
    overlay.querySelector('.media-lightbox__nav--next').addEventListener('click', () => showItem(currentIndex + 1));

    setupTouchNavigation(overlay);

    return overlay;
  }

  function canSwipeGallery() {
    return (
      lightbox &&
      lightbox.classList.contains('is-open') &&
      gallery.length > 1 &&
      !lightbox.querySelector('.media-lightbox__media-wrap')?.classList.contains('is-zoomed')
    );
  }

  function setupTouchNavigation(overlay) {
    overlay.addEventListener(
      'touchstart',
      (event) => {
        if (!canSwipeGallery() || event.touches.length !== 1) {
          touchTracking = false;
          return;
        }

        touchTracking = true;
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
      },
      { passive: true }
    );

    overlay.addEventListener(
      'touchend',
      (event) => {
        if (!touchTracking || event.changedTouches.length !== 1) {
          touchTracking = false;
          return;
        }

        touchTracking = false;

        if (!canSwipeGallery()) {
          return;
        }

        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;

        if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) {
          return;
        }

        if (Math.abs(deltaY) >= Math.abs(deltaX)) {
          return;
        }

        suppressImageClickUntil = Date.now() + 400;

        if (deltaX < 0) {
          showItem(currentIndex + 1);
        } else {
          showItem(currentIndex - 1);
        }
      },
      { passive: true }
    );

    overlay.addEventListener(
      'touchcancel',
      () => {
        touchTracking = false;
      },
      { passive: true }
    );
  }

  const ZOOM_SCALE = 2;

  function resetImageZoom(image) {
    image.classList.remove('is-zoomed');
    image.style.width = '';
    image.style.height = '';
    image.style.maxWidth = '';
    image.style.maxHeight = '';
  }

  function resetZoom() {
    if (!lightbox) {
      return;
    }

    const mediaWrap = lightbox.querySelector('.media-lightbox__media-wrap');
    mediaWrap.classList.remove('is-zoomed');
    mediaWrap.querySelectorAll('img').forEach(resetImageZoom);
  }

  function getZoomScale(image) {
    const fittedWidth = image.offsetWidth;
    if (!fittedWidth || !image.naturalWidth) {
      return ZOOM_SCALE;
    }

    const naturalScale = image.naturalWidth / fittedWidth;
    if (naturalScale <= 1.05) {
      return ZOOM_SCALE;
    }

    return Math.min(ZOOM_SCALE, naturalScale);
  }

  function toggleImageZoom(image, event) {
    event.stopPropagation();

    if (Date.now() < suppressImageClickUntil) {
      return;
    }

    const mediaWrap = image.closest('.media-lightbox__media-wrap');
    const willZoom = !image.classList.contains('is-zoomed');

    mediaWrap.querySelectorAll('img').forEach(resetImageZoom);

    if (willZoom) {
      const scale = getZoomScale(image);
      image.classList.add('is-zoomed');
      image.style.maxWidth = 'none';
      image.style.maxHeight = 'none';
      image.style.width = `${image.offsetWidth * scale}px`;
      image.style.height = 'auto';
      mediaWrap.classList.add('is-zoomed');
    } else {
      mediaWrap.classList.remove('is-zoomed');
    }
  }

  function setupImageZoom(image) {
    image.classList.add('media-lightbox__zoomable');
    image.addEventListener('click', (event) => toggleImageZoom(image, event));
  }

  function clearMedia() {
    if (!lightbox) {
      return;
    }

    const mediaWrap = lightbox.querySelector('.media-lightbox__media-wrap');
    if (activeVideo) {
      activeVideo.pause();
      activeVideo = null;
    }
    resetZoom();
    mediaWrap.innerHTML = '';
  }

  function renderCompare(container) {
    const images = container.querySelectorAll('img');
    const compare = document.createElement('div');
    compare.className = 'media-lightbox__compare';

    images.forEach((image, index) => {
      const item = document.createElement('div');
      item.className = 'media-lightbox__compare-item';

      const label = document.createElement('div');
      label.className = 'media-lightbox__compare-label';
      label.textContent = index === 0 ? 'Before' : 'After';

      const clone = document.createElement('img');
      clone.src = image.getAttribute('src');
      clone.alt = image.getAttribute('alt') || '';
      setupImageZoom(clone);

      item.appendChild(label);
      item.appendChild(clone);
      compare.appendChild(item);
    });

    return compare;
  }

  function showItem(index) {
    if (!lightbox || !gallery.length) {
      return;
    }

    currentIndex = (index + gallery.length) % gallery.length;
    const item = gallery[currentIndex];
    const mediaWrap = lightbox.querySelector('.media-lightbox__media-wrap');
    const caption = lightbox.querySelector('.media-lightbox__caption');
    const counter = lightbox.querySelector('.media-lightbox__counter');
    const prevButton = lightbox.querySelector('.media-lightbox__nav--prev');
    const nextButton = lightbox.querySelector('.media-lightbox__nav--next');

    clearMedia();

    if (item.type === 'video') {
      const video = document.createElement('video');
      video.src = item.src;
      video.controls = true;
      video.playsInline = true;
      video.loop = item.loop;
      video.muted = item.muted;
      video.autoplay = true;
      mediaWrap.appendChild(video);
      activeVideo = video;
      video.play().catch(() => {});
    } else {
      const image = document.createElement('img');
      image.src = item.src;
      image.alt = item.alt;
      mediaWrap.appendChild(image);
      setupImageZoom(image);
    }

    if (item.alt) {
      caption.textContent = item.alt;
      caption.hidden = false;
    } else {
      caption.textContent = '';
      caption.hidden = true;
    }

    if (gallery.length > 1) {
      counter.textContent = `${currentIndex + 1} / ${gallery.length}`;
      counter.hidden = false;
      prevButton.disabled = false;
      nextButton.disabled = false;
    } else {
      counter.hidden = true;
      prevButton.disabled = true;
      nextButton.disabled = true;
    }
  }

  function openLightbox(sourceElement) {
    if (!lightbox) {
      lightbox = createLightbox();
    }

    gallery = buildGallery();
    const sourceSrc = getMediaSrc(sourceElement);
    currentIndex = Math.max(
      0,
      gallery.findIndex((item) => item.src === sourceSrc)
    );

    lastFocusedElement = document.activeElement;
    document.body.style.overflow = 'hidden';
    lightbox.classList.add('is-open');
    showItem(currentIndex);
    lightbox.querySelector('.media-lightbox__close').focus();
  }

  function openCompareLightbox(container) {
    if (!lightbox) {
      lightbox = createLightbox();
    }

    gallery = [];
    clearMedia();

    const mediaWrap = lightbox.querySelector('.media-lightbox__media-wrap');
    const caption = lightbox.querySelector('.media-lightbox__caption');
    const counter = lightbox.querySelector('.media-lightbox__counter');
    const prevButton = lightbox.querySelector('.media-lightbox__nav--prev');
    const nextButton = lightbox.querySelector('.media-lightbox__nav--next');

    mediaWrap.appendChild(renderCompare(container));
    caption.hidden = true;
    counter.hidden = true;
    prevButton.disabled = true;
    nextButton.disabled = true;

    lastFocusedElement = document.activeElement;
    document.body.style.overflow = 'hidden';
    lightbox.classList.add('is-open');
    lightbox.querySelector('.media-lightbox__close').focus();
  }

  function closeLightbox() {
    if (!lightbox) {
      return;
    }

    clearMedia();
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
    touchTracking = false;

    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }

  function initBeforeAfterExpand() {
    document.querySelectorAll('.before-after-container').forEach((container) => {
      if (container.querySelector('.media-lightbox-expand-btn')) {
        return;
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'media-lightbox-expand-btn';
      button.setAttribute('aria-label', 'View fullscreen');
      button.innerHTML = '<i class="fas fa-expand" aria-hidden="true"></i>';
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        openCompareLightbox(container);
      });

      container.appendChild(button);
    });
  }

  function initMediaClicks() {
    getMediaElements().forEach((element) => {
      element.classList.add('media-expandable');
      element.addEventListener('click', (event) => {
        event.preventDefault();
        openLightbox(element);
      });
    });
  }

  function handleKeydown(event) {
    if (!lightbox || !lightbox.classList.contains('is-open')) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      const mediaWrap = lightbox.querySelector('.media-lightbox__media-wrap');
      if (mediaWrap?.classList.contains('is-zoomed')) {
        resetZoom();
        return;
      }
      closeLightbox();
      return;
    }

    if (!gallery.length) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showItem(currentIndex - 1);
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      showItem(currentIndex + 1);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initMediaClicks();
    initBeforeAfterExpand();
  });

  document.addEventListener('keydown', handleKeydown);
})();
