let dotCursorInitialized = false;

function setupDotCursor() {
    if (dotCursorInitialized) return;

    const isSupportedPage = Boolean(
        document.getElementById('fullpage') || document.getElementById('scroll-spy')
    );
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isSupportedPage || !finePointer || reducedMotion) return;

    dotCursorInitialized = true;

    const dot = document.createElement('div');
    dot.className = 'dot-cursor';
    dot.setAttribute('aria-hidden', 'true');
    document.body.appendChild(dot);

    const imageSelector = [
        'img',
        'video',
        'picture',
        '.intro-hero-card__media',
        '.intro-hero-cards__stack',
        '.intro-hero-video',
        '.video-animation',
        '.video-frame',
        '.projectcard',
        '.about-photo-card',
        '.media-lightbox-trigger'
    ].join(', ');

    let visible = false;

    function setPosition(clientX, clientY) {
        dot.style.transform =
            'translate3d(' + clientX + 'px, ' + clientY + 'px, 0) translate(-50%, -50%)';
    }

    function updateHoverState(clientX, clientY) {
        const target = document.elementFromPoint(clientX, clientY);
        if (!target) return;

        dot.classList.toggle('dot-cursor--image', Boolean(target.closest(imageSelector)));
    }

    function show(clientX, clientY) {
        if (!visible) {
            dot.classList.add('is-visible');
            visible = true;
        }
        setPosition(clientX, clientY);
        updateHoverState(clientX, clientY);
    }

    function hide() {
        dot.classList.remove('is-visible', 'dot-cursor--image');
        visible = false;
    }

    document.addEventListener('mousemove', function(e) {
        show(e.clientX, e.clientY);
    }, { passive: true });

    document.addEventListener('mouseleave', hide);

    window.addEventListener('blur', hide);
}
