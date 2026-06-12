let cursorFollowingTooltip = null;
let cursorFollowingTooltipActiveCount = 0;

function getCursorFollowingTooltip() {
    if (cursorFollowingTooltip) return cursorFollowingTooltip;

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reducedMotion) return null;

    cursorFollowingTooltip = document.createElement('div');
    cursorFollowingTooltip.className = 'intro-hero-cards-tooltip';
    cursorFollowingTooltip.setAttribute('role', 'tooltip');
    cursorFollowingTooltip.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cursorFollowingTooltip);
    return cursorFollowingTooltip;
}

function setupCursorFollowingTooltip(targets, text, options) {
    const elements = targets.filter(Boolean);
    const tooltip = getCursorFollowingTooltip();
    if (!elements.length || !tooltip) return;

    const offsetX = 14;
    const offsetY = 14;
    const variantClass = options && options.variant === 'light'
        ? 'intro-hero-cards-tooltip--light'
        : null;

    function resolveText(target) {
        return typeof text === 'function' ? text(target) : text;
    }

    function positionAt(clientX, clientY) {
        tooltip.style.transform =
            'translate3d(' + (clientX + offsetX) + 'px, ' + (clientY + offsetY) + 'px, 0)';
    }

    elements.forEach(function(target) {
        target.addEventListener('mouseenter', function(e) {
            const message = resolveText(target);
            if (!message) return;

            cursorFollowingTooltipActiveCount += 1;
            tooltip.textContent = message;
            tooltip.classList.remove('intro-hero-cards-tooltip--light');
            if (variantClass) tooltip.classList.add(variantClass);
            tooltip.classList.add('is-visible');
            positionAt(e.clientX, e.clientY);
        });

        target.addEventListener('mousemove', function(e) {
            if (!cursorFollowingTooltipActiveCount) return;
            positionAt(e.clientX, e.clientY);
        });

        target.addEventListener('mouseleave', function() {
            cursorFollowingTooltipActiveCount = Math.max(0, cursorFollowingTooltipActiveCount - 1);
            if (!cursorFollowingTooltipActiveCount) {
                tooltip.classList.remove('is-visible');
            }
        });
    });
}

function setupDataTooltips() {
    const elements = document.querySelectorAll('[data-tooltip]');
    if (!elements.length) return;

    const lightElements = [];
    const darkElements = [];

    elements.forEach(function(el) {
        if (el.classList.contains('about-chip') || el.classList.contains('company-chip')) {
            darkElements.push(el);
        } else {
            lightElements.push(el);
        }
    });

    const getTooltipText = function(target) {
        return target.getAttribute('data-tooltip') || '';
    };

    if (darkElements.length) {
        setupCursorFollowingTooltip(darkElements, getTooltipText);
    }

    if (lightElements.length) {
        setupCursorFollowingTooltip(lightElements, getTooltipText, { variant: 'light' });
    }
}
