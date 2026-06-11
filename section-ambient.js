(function () {
  const SAMPLE_SIZE = 40;
  let updateIntervalMs = 600;

  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = SAMPLE_SIZE;
  sampleCanvas.height = SAMPLE_SIZE;
  const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });

  const ambientControllers = new Map();
  let activeSectionId = null;
  let rafId = null;
  let lastUpdate = 0;

  function getProjectSections() {
    return [...document.querySelectorAll('#fullpage .section[id^="project"]')];
  }

  function isElementVisible(el) {
    if (!el || !el.isConnected) return false;

    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;

    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function getSectionMedia(section) {
    const projectCard = section.querySelector('.projectcard');
    const root = projectCard || section;

    const visibleVideo = [...root.querySelectorAll('video')].find(isElementVisible);
    if (visibleVideo) return { type: 'video', el: visibleVideo };

    const visibleImage = [...root.querySelectorAll('img')].find(isElementVisible);
    if (visibleImage) return { type: 'img', el: visibleImage };

    const fallbackVideo = root.querySelector('video');
    if (fallbackVideo) return { type: 'video', el: fallbackVideo };

    const fallbackImage = root.querySelector('img');
    if (fallbackImage) return { type: 'img', el: fallbackImage };

    return null;
  }

  function isLightSection(section) {
    const { backgroundColor } = window.getComputedStyle(section);
    const match = backgroundColor.match(/[\d.]+/g);
    if (!match || match.length < 3) return false;

    const [r, g, b] = match.map(Number);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.52;
  }

  function isMediaReady(media) {
    if (!media) return false;
    if (media.type === 'video') {
      return media.el.readyState >= 2 && media.el.videoWidth > 0;
    }
    return media.el.complete && media.el.naturalWidth > 0;
  }

  function drawMediaSample(media) {
    if (!isMediaReady(media)) return false;

    sampleCtx.clearRect(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    sampleCtx.drawImage(media.el, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    return true;
  }

  function sampleRegion(x, y, width, height) {
    const imageData = sampleCtx.getImageData(x, y, width, height);
    const data = imageData.data;
    let r = 0;
    let g = 0;
    let b = 0;
    let weight = 0;

    for (let i = 0; i < data.length; i += 4) {
      const pr = data[i];
      const pg = data[i + 1];
      const pb = data[i + 2];
      const max = Math.max(pr, pg, pb);
      const min = Math.min(pr, pg, pb);
      const saturation = max === 0 ? 0 : (max - min) / max;
      const luminance = (0.299 * pr + 0.587 * pg + 0.114 * pb) / 255;

      if (luminance < 0.06 || luminance > 0.97) continue;

      const pixelWeight = saturation * 0.75 + luminance * 0.25;
      r += pr * pixelWeight;
      g += pg * pixelWeight;
      b += pb * pixelWeight;
      weight += pixelWeight;
    }

    if (weight < 1) return null;

    return {
      r: Math.round(r / weight),
      g: Math.round(g / weight),
      b: Math.round(b / weight),
    };
  }

  function getPalette(media) {
    if (!drawMediaSample(media)) return null;

    const third = Math.floor(SAMPLE_SIZE / 3);
    const primary = sampleRegion(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    const secondary = sampleRegion(0, 0, third, SAMPLE_SIZE);
    const tertiary = sampleRegion(SAMPLE_SIZE - third, 0, third, SAMPLE_SIZE);

    if (!primary) return null;

    return {
      primary,
      secondary: secondary || primary,
      tertiary: tertiary || primary,
    };
  }

  function resizeAmbientCanvas(controller) {
    const rect = controller.section.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));

    if (controller.canvas.width !== width || controller.canvas.height !== height) {
      controller.canvas.width = width;
      controller.canvas.height = height;
      controller.needsPaint = true;
    }
  }

  function paintAmbient(controller, palette) {
    const { canvas, ctx, section } = controller;
    const width = canvas.width;
    const height = canvas.height;
    const isLight = isLightSection(section);

    section.classList.toggle('section--ambient-light', isLight);

    ctx.clearRect(0, 0, width, height);

    const blooms = [
      { x: 0.5, y: 0.36, radius: 0.74, color: palette.primary, alpha: isLight ? 0.26 : 0.3 },
      { x: 0.34, y: 0.42, radius: 0.5, color: palette.secondary, alpha: isLight ? 0.13 : 0.16 },
      { x: 0.66, y: 0.42, radius: 0.5, color: palette.tertiary, alpha: isLight ? 0.13 : 0.16 },
    ];

    blooms.forEach((bloom) => {
      const cx = width * bloom.x;
      const cy = height * bloom.y;
      const radius = Math.max(width, height) * bloom.radius;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      const { r, g, b } = bloom.color;

      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${bloom.alpha})`);
      gradient.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, ${bloom.alpha * 0.45})`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    });

    controller.needsPaint = false;
  }

  function refreshControllerMedia(controller) {
    controller.media = getSectionMedia(controller.section);
  }

  function updateController(controller, forceSample) {
    resizeAmbientCanvas(controller);
    refreshControllerMedia(controller);

    if (!controller.media) return;

    const shouldSample =
      forceSample ||
      !controller.palette ||
      Date.now() - controller.lastSampleAt > updateIntervalMs;

    if (shouldSample) {
      const palette = getPalette(controller.media);
      if (palette) {
        controller.palette = palette;
        controller.lastSampleAt = Date.now();
        controller.needsPaint = true;
      }
    }

    if (controller.palette && controller.needsPaint) {
      paintAmbient(controller, controller.palette);
    }
  }

  function updateActiveSection(forceSample) {
    activeSectionId = getActiveSectionId();
    if (!activeSectionId) return;

    const controller = ambientControllers.get(activeSectionId);
    if (controller) updateController(controller, forceSample);
  }

  function getActiveSectionId() {
    const activeSection = document.querySelector('.section.active');
    return activeSection ? activeSection.id : null;
  }

  function tick(timestamp) {
    if (timestamp - lastUpdate >= updateIntervalMs) {
      lastUpdate = timestamp;

      ambientControllers.forEach((controller, sectionId) => {
        if (sectionId !== getActiveSectionId()) return;
        updateController(controller, false);
      });
    }

    rafId = window.requestAnimationFrame(tick);
  }

  function attachMediaListeners(controller) {
    const { section } = controller;

    const onMediaReady = () => {
      if (getActiveSectionId() === section.id) {
        updateController(controller, true);
      }
    };

    section.querySelectorAll('video').forEach((video) => {
      video.addEventListener('loadeddata', onMediaReady);
      video.addEventListener('playing', onMediaReady);
      video.addEventListener('seeked', onMediaReady);
    });

    section.querySelectorAll('img').forEach((img) => {
      if (img.complete) onMediaReady();
      else img.addEventListener('load', onMediaReady);
    });
  }

  function initSection(section) {
    section.classList.add('section--ambient');

    const ambient = document.createElement('div');
    ambient.className = 'section-ambient';
    ambient.setAttribute('aria-hidden', 'true');

    const canvas = document.createElement('canvas');
    canvas.className = 'section-ambient__canvas';
    ambient.appendChild(canvas);

    section.insertBefore(ambient, section.firstChild);

    const controller = {
      section,
      media: getSectionMedia(section),
      ambient,
      canvas,
      ctx: canvas.getContext('2d'),
      palette: null,
      lastSampleAt: 0,
      needsPaint: true,
    };

    ambientControllers.set(section.id, controller);
    attachMediaListeners(controller);
  }

  function observeSectionChanges() {
    const fullpage = document.getElementById('fullpage');
    if (!fullpage) return;

    const observer = new MutationObserver(() => {
      const nextActiveId = getActiveSectionId();
      if (!nextActiveId || nextActiveId === activeSectionId) return;

      activeSectionId = nextActiveId;
      updateActiveSection(true);
    });

    observer.observe(fullpage, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true,
    });
  }

  function init() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      updateIntervalMs = 4000;
    }

    getProjectSections().forEach(initSection);

    activeSectionId = getActiveSectionId();
    updateActiveSection(true);

    observeSectionChanges();

    document.addEventListener('portfolio:section-change', () => {
      setTimeout(() => updateActiveSection(true), 50);
    });

    window.addEventListener('load', () => {
      setTimeout(() => updateActiveSection(true), 250);
    });

    window.addEventListener('resize', () => {
      updateActiveSection(false);
    });

    window.matchMedia('(min-width: 768px)').addEventListener('change', () => {
      ambientControllers.forEach((controller) => {
        controller.palette = null;
        controller.needsPaint = true;
      });
      updateActiveSection(true);
    });

    rafId = window.requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('pagehide', () => {
    if (rafId) window.cancelAnimationFrame(rafId);
  });
})();
