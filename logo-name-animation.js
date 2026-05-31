document.addEventListener('DOMContentLoaded', function () {
    const logoName = document.getElementById('logo-name');
    if (!logoName) return;

    const firstD = logoName.querySelector('.logo-d-first');
    const lastD = logoName.querySelector('.logo-d-last');
    if (!firstD || !lastD) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const duration = 600;
    const easing = 'cubic-bezier(0.45, 0, 0.55, 1)';
    let activeAnimations = [];

    function setSwapDistance() {
        const offset = lastD.getBoundingClientRect().left - firstD.getBoundingClientRect().left;
        logoName.style.setProperty('--logo-d-swap', offset + 'px');
        return offset;
    }

    function getArcHeight() {
        return parseFloat(window.getComputedStyle(firstD).fontSize) * 0.95;
    }

    function cancelAnimations() {
        activeAnimations.forEach(function (animation) {
            animation.cancel();
        });
        activeAnimations = [];
    }

    function clearTransforms() {
        firstD.style.transform = '';
        lastD.style.transform = '';
    }

    function playSwapAnimation(direction) {
        cancelAnimations();

        const swap = setSwapDistance();
        const arc = getArcHeight();
        const isSwap = direction === 'swap';

        if (isSwap) {
            clearTransforms();
        }

        const firstKeyframes = isSwap
            ? [
                { transform: 'translate(0, 0)' },
                { transform: 'translate(' + (swap * 0.5) + 'px, ' + (-arc) + 'px)', offset: 0.45 },
                { transform: 'translate(' + swap + 'px, 0)' }
            ]
            : [
                { transform: 'translate(' + swap + 'px, 0)' },
                { transform: 'translate(' + (swap * 0.5) + 'px, ' + (-arc) + 'px)', offset: 0.45 },
                { transform: 'translate(0, 0)' }
            ];

        const lastKeyframes = isSwap
            ? [
                { transform: 'translate(0, 0)' },
                { transform: 'translate(' + (-swap * 0.5) + 'px, ' + arc + 'px)', offset: 0.45 },
                { transform: 'translate(' + (-swap) + 'px, 0)' }
            ]
            : [
                { transform: 'translate(' + (-swap) + 'px, 0)' },
                { transform: 'translate(' + (-swap * 0.5) + 'px, ' + arc + 'px)', offset: 0.45 },
                { transform: 'translate(0, 0)' }
            ];

        const options = { duration: duration, easing: easing, fill: 'forwards' };

        activeAnimations.push(firstD.animate(firstKeyframes, options));
        activeAnimations.push(lastD.animate(lastKeyframes, options));
    }

    setSwapDistance();
    window.addEventListener('resize', function () {
        setSwapDistance();
        if (prefersReducedMotion.matches) return;
        cancelAnimations();
        clearTransforms();
    });

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(setSwapDistance);
    }

    logoName.addEventListener('mouseenter', function () {
        if (prefersReducedMotion.matches) return;
        playSwapAnimation('swap');
    });

    logoName.addEventListener('mouseleave', function () {
        if (prefersReducedMotion.matches) return;
        playSwapAnimation('reset');
    });
});
