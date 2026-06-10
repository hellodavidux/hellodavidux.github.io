/**
 * Liquid blob hero, fixed shape mask + cursor reveal spotlight with particles.
 */
(function () {
  const ROOT_ID = "liquid-blob-root";

  const BLOB_CONFIG = {
    viewSize: 400,
    surface: "#f9fafb",

    images: [
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=85",
      "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=85",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=85",
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=85",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=85",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=85",
    ],

    shape: {
      baseRx: 122,
      baseRy: 104,
      anchors: [
        { a: -86, r: 0.94 },
        { a: -38, r: 1.18 },
        { a: 12, r: 1.06 },
        { a: 58, r: 1.2 },
        { a: 102, r: 1.02 },
        { a: 148, r: 1.1 },
        { a: -172, r: 0.86 },
        { a: -128, r: 1.04 },
      ],
      smooth: 0.34,
      wobble: { amp: 0.028, speed: 0.4 },
    },

    mask: { blur: 14 },

    edgeFade: {
      clearUntil: 0.52,
      midAt: 0.72,
      fullAt: 0.94,
      opacity: 0.94,
    },

    /** Cursor spotlight, undoes the photo mask locally */
    reveal: {
      radiusPx: 102,
      softness: 0.45,
      ease: 0.14,
      particleCount: 48,
    },

    /** Local force that deforms the blob edge near the cursor */
    push: {
      strengthViewPx: 18, // how much the edge moves (in SVG viewBox px)
      power: 2.2, // falloff exponent (higher = tighter push)
      influenceScale: 0.86, // < 1 keeps push local instead of swelling the whole blob
    },

    collage: { scale: 1.42 },
  };

  function deepMerge(base, patch) {
    const out = Object.assign({}, base);
    Object.keys(patch).forEach(function (key) {
      const val = patch[key];
      if (val && typeof val === "object" && !Array.isArray(val)) {
        out[key] = deepMerge(base[key] || {}, val);
      } else {
        out[key] = val;
      }
    });
    return out;
  }

  let config = deepMerge({}, BLOB_CONFIG);

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function polar(cx, cy, angleDeg, rx, ry, rMul) {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + Math.cos(rad) * rx * rMul,
      y: cy + Math.sin(rad) * ry * rMul,
    };
  }

  function smoothClosedPath(points, tension) {
    const n = points.length;
    if (n < 3) return "";

    const t = tension;
    let d = "M " + points[0].x.toFixed(2) + " " + points[0].y.toFixed(2);

    for (let i = 0; i < n; i++) {
      const p0 = points[(i - 1 + n) % n];
      const p1 = points[i];
      const p2 = points[(i + 1) % n];
      const p3 = points[(i + 2) % n];

      const cp1x = p1.x + ((p2.x - p0.x) / 6) * t;
      const cp1y = p1.y + ((p2.y - p0.y) / 6) * t;
      const cp2x = p2.x - ((p3.x - p1.x) / 6) * t;
      const cp2y = p2.y - ((p3.y - p1.y) / 6) * t;

      d +=
        " C " +
        cp1x.toFixed(2) +
        " " +
        cp1y.toFixed(2) +
        ", " +
        cp2x.toFixed(2) +
        " " +
        cp2y.toFixed(2) +
        ", " +
        p2.x.toFixed(2) +
        " " +
        p2.y.toFixed(2);
    }

    return d + " Z";
  }

  function buildAnchorPoints(cx, cy, time) {
    const s = config.shape;
    const w = s.wobble;
    return s.anchors.map(function (anchor, i) {
      const phase = i * 0.9 + anchor.a * 0.02;
      const wobble =
        1 + Math.sin(time * w.speed + phase) * w.amp + Math.cos(time * w.speed * 0.7 + phase) * w.amp * 0.5;
      return polar(cx, cy, anchor.a, s.baseRx, s.baseRy, anchor.r * wobble);
    });
  }

  function edgeFadeGradient() {
    const e = config.edgeFade;
    const clear = (e.clearUntil * 100).toFixed(1);
    const mid = (e.midAt * 100).toFixed(1);
    const full = (e.fullAt * 100).toFixed(1);
    return (
      "radial-gradient(ellipse 88% 84% at 50% 50%, transparent 0%, transparent " +
      clear +
      "%, rgba(249, 250, 251, 0.22) " +
      mid +
      "%, var(--blob-surface) " +
      full +
      "%)"
    );
  }

  function createParticles(container, count) {
    const particles = [];
    for (let i = 0; i < count; i++) {
      const el = document.createElement("span");
      el.className = "liquid-blob-particle";
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 42;
      const size = 1.5 + Math.random() * 3.5;
      const p = {
        el: el,
        ox: Math.cos(angle) * dist,
        oy: Math.sin(angle) * dist,
        size: size,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 1.2,
        drift: 0.3 + Math.random() * 0.8,
      };
      el.style.width = size + "px";
      el.style.height = size + "px";
      container.appendChild(el);
      particles.push(p);
    }
    return particles;
  }

  function mount() {
    const root = document.getElementById(ROOT_ID);
    if (!root || root.dataset.mounted === "true") return;
    root.dataset.mounted = "true";

    const V = config.viewSize;
    const C = V / 2;
    const blur = config.mask.blur;
    const revealCfg = config.reveal;

    root.style.setProperty("--blob-surface", config.surface);
    root.style.setProperty("--reveal-r", revealCfg.radiusPx + "px");

    const gridCells = config.images
      .map(function (src) {
        return '<img src="' + src + '" alt="" loading="lazy" decoding="async" />';
      })
      .join("");

    root.innerHTML =
      '<div class="liquid-blob-stage">' +
      '<svg class="liquid-blob-defs" viewBox="0 0 ' +
      V +
      " " +
      V +
      '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      "<defs>" +
      '<filter id="liquid-blob-mask-blur" x="-50%" y="-50%" width="200%" height="200%">' +
      '<feGaussianBlur in="SourceGraphic" stdDeviation="' +
      blur +
      '"/>' +
      "</filter>" +
      '<mask id="liquid-blob-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="' +
      V +
      '" height="' +
      V +
      '">' +
      '<rect width="' +
      V +
      '" height="' +
      V +
      '" fill="black"/>' +
      '<path id="liquid-blob-path" fill="white" filter="url(#liquid-blob-mask-blur)"/>' +
      "</mask>" +
      "</defs>" +
      "</svg>" +
      '<div class="liquid-blob-media">' +
      '<div class="liquid-blob-grid">' +
      gridCells +
      "</div></div>" +
      '<div class="liquid-blob-edge" aria-hidden="true"></div>' +
      '<div class="liquid-blob-reveal" aria-hidden="true">' +
      '<div class="liquid-blob-reveal__spot"></div>' +
      '<div class="liquid-blob-reveal__particles"></div>' +
      "</div>" +
      "</div>";

    const stage = root.querySelector(".liquid-blob-stage");
    const pathEl = root.querySelector("#liquid-blob-path");
    const grid = root.querySelector(".liquid-blob-grid");
    const edge = root.querySelector(".liquid-blob-edge");
    const reveal = root.querySelector(".liquid-blob-reveal");
    const revealSpot = root.querySelector(".liquid-blob-reveal__spot");
    const particleRoot = root.querySelector(".liquid-blob-reveal__particles");

    edge.style.background = edgeFadeGradient();
    edge.style.opacity = String(config.edgeFade.opacity);

    const softStop = ((1 - revealCfg.softness) * 44).toFixed(0);
    revealSpot.style.background =
      "radial-gradient(circle closest-side at 50% 50%, #ffffff 0%, #ffffff " +
      softStop +
      "%, rgba(255,255,255,0.75) 66%, rgba(255,255,255,0.35) 78%, transparent 90%)";

    const particles = createParticles(particleRoot, revealCfg.particleCount);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var revealPos = { x: 50, y: 50 };
    var revealTarget = { x: 50, y: 50 };
    var isRevealing = false;
    var rafId = null;

    const sc = config.collage.scale;
    grid.style.transform = "translate(-50%, -50%) scale(" + sc + ")";

    // Cached stage dimensions for converting cursor radius -> SVG viewBox units.
    var stageW = 1;
    var stageH = 1;

    function updateStageSize() {
      const r = stage.getBoundingClientRect();
      stageW = Math.max(1, r.width);
      stageH = Math.max(1, r.height);
    }

    function applyShape(time) {
      const points = buildAnchorPoints(C, C, time);

      // Only deform when actively revealing; keeps the blob from “always swelling”.
      const active = isRevealing && !reduced;
      if (active) {
        const cursorXView = (revealPos.x / 100) * V;
        const cursorYView = (revealPos.y / 100) * V;
        const influence =
          ((revealCfg.radiusPx * config.push.influenceScale) / Math.min(stageW, stageH)) * V;

        const strength = config.push.strengthViewPx;
        const pow = config.push.power;

        for (let i = 0; i < points.length; i++) {
          const px = points[i].x;
          const py = points[i].y;
          const dx = px - cursorXView;
          const dy = py - cursorYView;
          const d = Math.hypot(dx, dy);

          if (d < influence && d > 0.0001) {
            const m = Math.pow(1 - d / influence, pow);
            const nx = dx / d;
            const ny = dy / d;
            points[i].x = px + nx * strength * m;
            points[i].y = py + ny * strength * m;
          }
        }
      }

      pathEl.setAttribute("d", smoothClosedPath(points, config.shape.smooth));
    }

    function setRevealPosition(px, py) {
      revealTarget.x = px;
      revealTarget.y = py;
    }

    function pointerToPercent(clientX, clientY) {
      const rect = stage.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * 100,
        y: ((clientY - rect.top) / rect.height) * 100,
      };
    }

    function tick(ts) {
      const t = ts * 0.001;

      if (isRevealing && !reduced) {
        revealPos.x = lerp(revealPos.x, revealTarget.x, revealCfg.ease);
        revealPos.y = lerp(revealPos.y, revealTarget.y, revealCfg.ease);
        stage.style.setProperty("--reveal-x", revealPos.x + "%");
        stage.style.setProperty("--reveal-y", revealPos.y + "%");

        particles.forEach(function (p) {
          const wobbleX = Math.sin(t * p.speed + p.phase) * 10 * p.drift;
          const wobbleY = Math.cos(t * p.speed * 0.85 + p.phase) * 10 * p.drift;
          const lift = Math.sin(t * p.speed * 1.4 + p.phase) * 4;
          p.el.style.transform =
            "translate(-50%, -50%) translate(" +
            (p.ox + wobbleX) +
            "px, " +
            (p.oy + wobbleY + lift) +
            "px)";
        });
      }

      // Cursor-driven deformation (local edge push)
      applyShape(0);

      rafId = requestAnimationFrame(tick);
    }

    updateStageSize();
    applyShape(0);
    rafId = requestAnimationFrame(tick);

    if (!reduced) {
      stage.addEventListener("pointerenter", function (e) {
        isRevealing = true;
        stage.classList.add("is-revealing");
        updateStageSize();
        const p = pointerToPercent(e.clientX, e.clientY);
        revealPos.x = p.x;
        revealPos.y = p.y;
        revealTarget.x = p.x;
        revealTarget.y = p.y;
        stage.style.setProperty("--reveal-x", p.x + "%");
        stage.style.setProperty("--reveal-y", p.y + "%");
      });

      stage.addEventListener("pointerleave", function () {
        isRevealing = false;
        stage.classList.remove("is-revealing");
        // Ease the spotlight back to center.
        revealTarget.x = 50;
        revealTarget.y = 50;
      });

      stage.addEventListener("pointermove", function (e) {
        if (!isRevealing) return;
        const p = pointerToPercent(e.clientX, e.clientY);
        setRevealPosition(p.x, p.y);
      });
    }
  }

  window.LiquidBlobHero = {
    getConfig: function () {
      return config;
    },
    updateConfig: function (patch) {
      config = deepMerge(config, patch);
      const root = document.getElementById(ROOT_ID);
      if (root) {
        root.dataset.mounted = "";
        root.innerHTML = "";
        mount();
      }
    },
    setAnchors: function (anchors) {
      window.LiquidBlobHero.updateConfig({ shape: { anchors: anchors } });
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
