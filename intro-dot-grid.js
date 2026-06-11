(function () {
  const GRID_SPACING = 21;
  const DOT_RADIUS = 1.15;
  const DOT_COLOR = 'rgba(150, 158, 170, 0.74)';
  const INFLUENCE_RADIUS = 108;
  const MAX_PUSH = 26;
  const PUSH_POWER = 1.45;
  const EASE = 0.24;
  const CURSOR_RADIUS = 16;

  const grids = [];
  let initialized = false;
  let rafId = null;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function DotGrid(container, activeSection, activeClass) {
    this.container = container;
    this.activeSection = activeSection;
    this.activeClass = activeClass;
    this.canvas = null;
    this.ctx = null;
    this.dots = [];
    this.width = 0;
    this.height = 0;
    this.cursorX = -9999;
    this.cursorY = -9999;
    this.smoothX = -9999;
    this.smoothY = -9999;
    this.cursorActive = false;
  }

  DotGrid.prototype.buildGrid = function buildGrid() {
    this.dots = [];
    const cols = Math.ceil(this.width / GRID_SPACING) + 1;
    const rows = Math.ceil(this.height / GRID_SPACING) + 1;
    const offsetX = (this.width - (cols - 1) * GRID_SPACING) / 2;
    const offsetY = (this.height - (rows - 1) * GRID_SPACING) / 2;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        this.dots.push({
          baseX: offsetX + col * GRID_SPACING,
          baseY: offsetY + row * GRID_SPACING,
          x: offsetX + col * GRID_SPACING,
          y: offsetY + row * GRID_SPACING,
        });
      }
    }
  };

  DotGrid.prototype.resize = function resize() {
    if (!this.container || !this.canvas) return;

    const rect = this.container.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(rect.width));
    const nextHeight = Math.max(1, Math.round(rect.height));

    if (nextWidth === this.width && nextHeight === this.height) return;

    this.width = nextWidth;
    this.height = nextHeight;
    this.canvas.width = nextWidth;
    this.canvas.height = nextHeight;
    this.buildGrid();
  };

  DotGrid.prototype.updateDots = function updateDots() {
    if (!this.cursorActive) {
      let settled = true;

      this.dots.forEach((dot) => {
        dot.x = lerp(dot.x, dot.baseX, EASE);
        dot.y = lerp(dot.y, dot.baseY, EASE);
        if (Math.abs(dot.x - dot.baseX) > 0.05 || Math.abs(dot.y - dot.baseY) > 0.05) {
          settled = false;
        }
      });

      return !settled;
    }

    this.smoothX = lerp(this.smoothX, this.cursorX, 0.35);
    this.smoothY = lerp(this.smoothY, this.cursorY, 0.35);

    const influence = INFLUENCE_RADIUS + CURSOR_RADIUS;

    this.dots.forEach((dot) => {
      const dx = dot.baseX - this.smoothX;
      const dy = dot.baseY - this.smoothY;
      const dist = Math.hypot(dx, dy);
      let targetX = dot.baseX;
      let targetY = dot.baseY;

      if (dist > 0 && dist < influence) {
        const force = Math.pow(1 - dist / influence, PUSH_POWER);
        const push = force * MAX_PUSH;
        targetX = dot.baseX + (dx / dist) * push;
        targetY = dot.baseY + (dy / dist) * push;
      }

      dot.x = lerp(dot.x, targetX, EASE);
      dot.y = lerp(dot.y, targetY, EASE);
    });

    return true;
  };

  DotGrid.prototype.draw = function draw() {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = DOT_COLOR;

    this.dots.forEach((dot) => {
      this.ctx.beginPath();
      this.ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);
      this.ctx.fill();
    });
  };

  DotGrid.prototype.tick = function tick() {
    if (!this.activeSection.classList.contains('active')) return false;

    this.resize();
    const needsFrame = this.updateDots();
    this.draw();
    return needsFrame || this.cursorActive;
  };

  DotGrid.prototype.handleMouseMove = function handleMouseMove(clientX, clientY) {
    const rect = this.container.getBoundingClientRect();
    const inside =
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom;

    this.cursorX = clientX - rect.left;
    this.cursorY = clientY - rect.top;
    this.cursorActive = inside;
  };

  DotGrid.prototype.mount = function mount() {
    this.container.classList.add(this.activeClass);

    const layer = document.createElement('div');
    layer.className = 'intro-dot-grid';
    layer.setAttribute('aria-hidden', 'true');

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'intro-dot-grid__canvas';
    layer.appendChild(this.canvas);
    this.container.insertBefore(layer, this.container.firstChild);

    this.ctx = this.canvas.getContext('2d');
    this.resize();
    this.draw();
  };

  function tickAll() {
    rafId = null;

    let needsMore = false;
    grids.forEach((grid) => {
      if (grid.tick()) needsMore = true;
    });

    if (needsMore || grids.some((grid) => grid.cursorActive)) {
      rafId = window.requestAnimationFrame(tickAll);
    }
  }

  function requestTick() {
    if (rafId == null) {
      rafId = window.requestAnimationFrame(tickAll);
    }
  }

  function setupIntroDotGrid() {
    if (initialized) return;

    const isHomePage = Boolean(document.getElementById('fullpage'));
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isHomePage || !finePointer || reducedMotion) return;

    const intro = document.getElementById('intro');
    const contact = document.getElementById('contact');

    if (intro) {
      grids.push(new DotGrid(intro, intro, 'intro-dot-grid-active'));
    }

    if (contact) {
      grids.push(new DotGrid(contact, contact, 'about-dot-grid-active'));
    }

    if (grids.length === 0) return;

    initialized = true;
    grids.forEach((grid) => grid.mount());

    document.addEventListener('mousemove', function onMouseMove(event) {
      grids.forEach((grid) => grid.handleMouseMove(event.clientX, event.clientY));
      requestTick();
    }, { passive: true });

    document.addEventListener('mouseleave', function onMouseLeave() {
      grids.forEach((grid) => {
        grid.cursorActive = false;
      });
      requestTick();
    });

    window.addEventListener('resize', requestTick);

    const fullpage = document.getElementById('fullpage');
    if (fullpage) {
      const observer = new MutationObserver(requestTick);
      observer.observe(fullpage, {
        attributes: true,
        attributeFilter: ['class'],
        subtree: true,
      });
    }

    requestTick();
  }

  window.setupIntroDotGrid = setupIntroDotGrid;
})();
