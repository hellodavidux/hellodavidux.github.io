// DOM Elements
const sections = document.querySelectorAll('.section');
const sectionIndicators = document.querySelectorAll('.section-indicator');
const navbar = document.getElementById('navbar');
const navbarLinks = document.querySelectorAll('.navbar-links');
const rightNavLinks = navbar ? navbar.querySelector('div.flex.justify-end.items-center.gap-4') : null;
const homeNavLink = rightNavLinks ? rightNavLinks.querySelector('a[href="#intro"]') : null;
const projectsNavLink = rightNavLinks ? rightNavLinks.querySelector('a[href="#project-agentic-lifecycle"]') : null;
const aboutNavLink = rightNavLinks ? rightNavLinks.querySelector('a[href="#contact"]') : null;
const navBookBtn = rightNavLinks ? rightNavLinks.querySelector('.nav-book-btn') : null;
const DARK_NAV_SECTIONS = new Set(['project-agentic-lifecycle', 'project1', 'project2']);
const logoName = document.getElementById('logo-name');

// State variables
let currentSectionIndex = 0;
let isScrolling = false;
let touchStartY = 0;
let touchEndY = 0;
let lastScrollTime = 0;
const scrollCooldown = 900; // Increased cooldown time to prevent rapid scrolling
const touchThreshold = 55; // Increased threshold for touch sensitivity

// Function to reset intro animations - moved to global scope
function resetIntroAnimations() {
    const animatedElements = document.querySelectorAll('#intro .fade-in-up');
    
    // Remove and re-add animation classes to restart animations
    animatedElements.forEach(element => {
        // Save the original animation and delay
        const originalAnimation = getComputedStyle(element).animation;
        const originalDelay = element.classList.contains('delay-100') ? '0.1s' :
                             element.classList.contains('delay-200') ? '0.2s' :
                             element.classList.contains('delay-300') ? '0.3s' :
                             element.classList.contains('delay-400') ? '0.4s' :
                             element.classList.contains('delay-500') ? '0.5s' :
                             element.classList.contains('delay-600') ? '0.6s' : '0s';
        
        // Reset animation
        element.style.animation = 'none';
        element.style.opacity = '0';
        
        // Trigger reflow to restart animation
        void element.offsetWidth;
        
        // Restore animation with original delay
        element.style.animation = '';
        element.style.animationDelay = originalDelay;
    });
}

// Function to handle direct URL with hash
function handleDirectHashNavigation() {
    if (window.location.hash) {
        const sectionId = window.location.hash.substring(1);
        let targetIndex = 0; // Default to intro
        
        // Find the index of the target section
        Array.from(sections).forEach((section, index) => {
            if (section.id === sectionId) {
                targetIndex = index;
            }
        });
        
        // Set initial section without animation
        currentSectionIndex = targetIndex;
        isScrolling = false;
        
        // Update everything immediately
        updateSections();
        updateIndicators();
        updateNavbarLinks();
    }
}

// Animation for project cards when they enter viewport
const observeProjectCards = () => {
  const projectCards = document.querySelectorAll('.projectcard');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Add a slight delay before animation starts (after scrolling to section)
        setTimeout(() => {
          entry.target.classList.add('animate');
          
          // Make sure Tailwind hover effects work properly after animation completes
          setTimeout(() => {
            entry.target.style.transition = 'transform 0.5s ease-out'; // Restore Tailwind transition
          }, 600); // Wait for the entry animation to complete
        }, 100);
        
        // Unobserve after animation is triggered
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 }); // Animation starts when 30% of the card is visible
  
  projectCards.forEach(card => {
    observer.observe(card);
  });
};

function setupIntroHeroHover() {
    const headline = document.querySelector('.intro-hero-headline');
    const subheadline = document.querySelector('.intro-hero-subheadline');
    const subheadlineWrap = document.querySelector('.intro-hero-subheadline-wrap');
    if (!headline || !subheadline || !subheadlineWrap) return;

    const defaultText = subheadline.dataset.default || subheadline.textContent.trim();
    const allTexts = [
        defaultText,
        ...Array.from(headline.querySelectorAll('.intro-hero-item'))
            .map(item => item.dataset.description)
            .filter(Boolean)
    ];

    const lockSubheadlineHeight = () => {
        const width = subheadline.offsetWidth;
        if (!width) return;

        const probe = subheadline.cloneNode(false);
        probe.className = subheadline.className;
        probe.setAttribute('aria-hidden', 'true');
        probe.style.cssText = `visibility:hidden;position:absolute;inset:0 auto auto 0;pointer-events:none;width:${width}px;margin:0;`;
        subheadlineWrap.appendChild(probe);

        let maxHeight = 0;
        allTexts.forEach(text => {
            probe.textContent = text;
            maxHeight = Math.max(maxHeight, probe.offsetHeight);
        });

        probe.remove();
        subheadlineWrap.style.minHeight = `${maxHeight}px`;
    };

    lockSubheadlineHeight();
    new ResizeObserver(lockSubheadlineHeight).observe(subheadline);
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(lockSubheadlineHeight);
    }

    headline.querySelectorAll('.intro-hero-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            const description = item.dataset.description;
            if (description) subheadline.textContent = description;
        });
    });

    headline.addEventListener('mouseleave', () => {
        subheadline.textContent = defaultText;
    });
}

function getSectionIndex(sectionId) {
    return Array.from(sections).findIndex(section => section.id === sectionId);
}

function setupNavbarLinkNavigation() {
    if (!navbar) return;

    navbar.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return;

            const sectionId = href.slice(1);
            const targetIndex = getSectionIndex(sectionId);
            if (targetIndex === -1) return;

            e.preventDefault();
            if (!isScrolling) {
                navigateToSection(targetIndex);
            }
        });
    });
}

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
                // Keep --light during fade-out; removing it instantly swaps to the dark
                // "View projects" palette while opacity is still animating to 0.
                tooltip.classList.remove('is-visible');
            }
        });
    });
}

const INTRO_COMPANY_LOGO_TOOLTIPS = {
    stackai: 'AI agent no-code workflow builder for Enterprises',
    jabra: 'Ecommerce digital design for Audio Equipment',
    asana: 'Acquired StackAI, joined the team as designer',
    lenus: 'Fitness & Health tools and dashboards for coaches and their clients',
    bc: 'Sports Media, Fantasy and iGaming, and Affiliate Marketing'
};

function getIntroCompanyLogoTooltip(logo) {
    const src = logo.getAttribute('src') || '';
    const key = src.split('/').pop().replace(/\.png$/i, '');
    return INTRO_COMPANY_LOGO_TOOLTIPS[key] || '';
}

function setupIntroCompanyLogosTooltips() {
    const logos = document.querySelectorAll('.intro-company-logo');
    if (!logos.length) return;

    setupCursorFollowingTooltip([...logos], getIntroCompanyLogoTooltip, { variant: 'light' });
}

function setupAboutPhotoStackTooltips() {
    const cards = document.querySelectorAll('.about-photo-card[data-tooltip]');
    if (!cards.length) return;

    setupCursorFollowingTooltip([...cards], function(target) {
        return target.getAttribute('data-tooltip') || '';
    }, { variant: 'light' });
}

let aboutHighlightRaf = null;
let aboutHighlightController = null;
let aboutHighlightSectionActive = false;

function isMobileViewport() {
    return window.matchMedia('(max-width: 767px)').matches;
}

function getSectionOffsetUnit() {
    return isMobileViewport() ? 'dvh' : 'vh';
}

function isActiveContactSection() {
    const activeSection = sections[currentSectionIndex];
    return Boolean(activeSection && activeSection.id === 'contact');
}

function shouldAllowNativeContactScroll(event) {
    if (!isActiveContactSection()) return false;
    const activeSection = sections[currentSectionIndex];
    if (event.target && !activeSection.contains(event.target)) return false;

    return true;
}

function getAboutSectionScrollEdges() {
    const section = sections[currentSectionIndex];
    if (!section || section.id !== 'contact') {
        return { atTop: true, atBottom: true };
    }

    const maxScroll = Math.max(0, section.scrollHeight - section.clientHeight);
    return {
        atTop: section.scrollTop <= 1,
        atBottom: section.scrollTop >= maxScroll - 1
    };
}

function shouldNavigateFromAboutSwipe(deltaY) {
    if (!isActiveContactSection()) return true;

    const { atTop, atBottom } = getAboutSectionScrollEdges();
    if (deltaY > 0 && !atBottom) return false;
    if (deltaY < 0 && !atTop) return false;
    return true;
}

function setupAboutTextHighlight() {
    const aboutContent = document.querySelector('.about-content[data-about-highlight]');
    if (!aboutContent) return null;

    const textParagraphs = aboutContent.querySelectorAll('.about-text');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const msPerChar = 20;
    const startDelayMs = 400;
    let chars = [];
    let playStartTime = null;

    function setParagraphState(className, add) {
        textParagraphs.forEach(function(p) {
            p.classList.toggle(className, add);
        });
    }

    function splitHighlightPhrases() {
        aboutContent.querySelectorAll('.about-highlight').forEach(function(phrase) {
            if (phrase.dataset.charsSplit === 'true') return;

            const text = phrase.textContent;
            phrase.textContent = '';

            const srOnly = document.createElement('span');
            srOnly.className = 'sr-only';
            srOnly.textContent = text;
            phrase.appendChild(srOnly);

            const visual = document.createElement('span');
            visual.className = 'about-highlight__visual';
            visual.setAttribute('aria-hidden', 'true');

            Array.from(text).forEach(function(character) {
                const charSpan = document.createElement('span');
                charSpan.className = 'about-char';
                charSpan.textContent = character;
                visual.appendChild(charSpan);
            });

            phrase.appendChild(visual);

            phrase.dataset.charsSplit = 'true';
        });

        chars = Array.from(aboutContent.querySelectorAll('.about-char'));
    }

    function setActiveCount(count) {
        chars.forEach(function(charEl, index) {
            charEl.classList.toggle('is-active', index < count);
        });
    }

    function cancelPlayback() {
        if (aboutHighlightRaf) {
            cancelAnimationFrame(aboutHighlightRaf);
            aboutHighlightRaf = null;
        }
        playStartTime = null;
    }

    function reset() {
        cancelPlayback();
        setActiveCount(0);
        setParagraphState('about-text--animating', false);
        setParagraphState('about-text--done', false);
    }

    function finishPlayback() {
        cancelPlayback();
        setActiveCount(chars.length);
        setParagraphState('about-text--animating', false);
        setParagraphState('about-text--done', true);
    }

    function play() {
        reset();
        splitHighlightPhrases();

        if (!chars.length) return;

        if (reducedMotion) {
            finishPlayback();
            return;
        }

        setParagraphState('about-text--animating', true);

        function tick(now) {
            if (!playStartTime) playStartTime = now;
            const elapsed = now - playStartTime - startDelayMs;

            if (elapsed < 0) {
                aboutHighlightRaf = requestAnimationFrame(tick);
                return;
            }

            const activeCount = Math.min(chars.length, Math.floor(elapsed / msPerChar));
            setActiveCount(activeCount);

            if (activeCount < chars.length) {
                aboutHighlightRaf = requestAnimationFrame(tick);
            } else {
                finishPlayback();
            }
        }

        aboutHighlightRaf = requestAnimationFrame(tick);
    }

    splitHighlightPhrases();

    return { play: play, reset: reset };
}

function syncAboutTextHighlight() {
    if (!aboutHighlightController || !sections[currentSectionIndex]) return;

    const isContact = sections[currentSectionIndex].id === 'contact';
    if (isContact && !aboutHighlightSectionActive) {
        aboutHighlightController.play();
    } else if (!isContact && aboutHighlightSectionActive) {
        aboutHighlightController.reset();
    }
    aboutHighlightSectionActive = isContact;
}

function setupIntroHeroCardsLink() {
    const link = document.querySelector('.intro-hero-cards__link');
    if (!link) return;

    link.addEventListener('click', function(e) {
        e.preventDefault();
        if (!isScrolling) {
            navigateToSection(getSectionIndex('project-agentic-lifecycle'));
        }
    });

    setupCursorFollowingTooltip([link], 'View projects');

    const projectCardLinks = document.querySelectorAll('.projectcard a.w-full.h-full');
    setupCursorFollowingTooltip([...projectCardLinks], 'View project');
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Get all sections and indicators
    const sections = document.querySelectorAll('.section');
    const indicators = document.querySelectorAll('.section-indicator');
    const navbar = document.getElementById('navbar');
    const logoName = document.getElementById('logo-name');
    
    // Initial setup of all indicators to ensure consistent styling
    indicators.forEach(indicator => {
        const isActive = indicator.getAttribute('data-section') === 'intro';
        if (isActive) {
            indicator.classList.add('bg-gray-500');
            indicator.classList.remove('bg-white/30', 'bg-zinc-300');
        } else {
            // When starting on intro section, inactive indicators should be bg-zinc-300
            indicator.classList.add('bg-zinc-300');
            indicator.classList.remove('bg-gray-500', 'bg-white/30');
        }
    });
    
    setupIntroHeroHover();
    setupIntroHeroCardsLink();
    setupAboutPhotoStackTooltips();
    aboutHighlightController = setupAboutTextHighlight();
    setupIntroCompanyLogosTooltips();
    setupNavbarLinkNavigation();

    // Handle direct hash navigation as the first operation
    handleDirectHashNavigation();
    
    // Make sure the initial section is properly visible
    updateSections();
    updateIndicators();
    updateNavbarLinks();
    
    // Handle hash changes
    window.addEventListener('hashchange', function() {
        const hash = window.location.hash;
        if (hash) {
            const targetSection = document.querySelector(hash);
            if (targetSection) {
                // Find the index of the target section
                Array.from(sections).forEach((section, index) => {
                    if (section.id === targetSection.id) {
                        navigateToSection(index);
                    }
                });
            }
        } else {
            // No hash means we should navigate to the intro section
            navigateToSection(0);
        }
    });
    
    // Handle indicator clicks
    indicators.forEach(indicator => {
        indicator.addEventListener('click', function(e) {
            const sectionId = this.getAttribute('data-section');
            
            // Find the index of the section
            let targetIndex = 0;
            Array.from(sections).forEach((section, index) => {
                if (section.id === sectionId) {
                    targetIndex = index;
                }
            });
            
            // Navigate to the section
            navigateToSection(targetIndex);
        });
    });
    
    // Set up navbar scroll behavior
    setupNavbarScroll();
    
    // When coming back from a project page, ensure navbar is in the right state
    if (document.referrer.includes('/cards/')) {
        // Coming back from a project page, ensure navbar is visible
        navbar.classList.remove('below-content');
        navbar.classList.add('above-content');
    }
    
    observeProjectCards();
});

// Handle mouse wheel scrolling with debouncing and sensitivity control
window.addEventListener('wheel', function(e) {
    // Only trigger scroll if the delta is significant enough to be intentional
    if (Math.abs(e.deltaY) > 15) {
        if (shouldNavigateFromAboutSwipe(e.deltaY)) {
            e.preventDefault();
            handleScroll(e.deltaY > 0);
        }
    }
}, { passive: false });

// Handle touch events for mobile
window.addEventListener('touchstart', function(e) {
    touchStartY = e.touches[0].clientY;
});

window.addEventListener('touchmove', function(e) {
    if (shouldAllowNativeContactScroll(e)) {
        return;
    }
    e.preventDefault(); // Prevent default scrolling behavior
}, { passive: false });

window.addEventListener('touchend', function(e) {
    touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY - touchEndY;

    if (!shouldNavigateFromAboutSwipe(deltaY)) {
        return;
    }

    const { atTop, atBottom } = getAboutSectionScrollEdges();
    const atScrollEdge = (deltaY > 0 && atBottom) || (deltaY < 0 && atTop);
    const threshold = isActiveContactSection() && atScrollEdge ? 35 : touchThreshold;

    if (Math.abs(deltaY) > threshold) {
        handleScroll(deltaY > 0);
    }
});

// Handle keyboard navigation
window.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        handleScroll(true);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        handleScroll(false);
    }
});

// Handle indicator clicks
sectionIndicators.forEach((indicator, index) => {
    indicator.addEventListener('click', function(e) {
        e.preventDefault();
        if (!isScrolling) {
            navigateToSection(index);
        }
    });
});

// Handle hash changes in URL
window.addEventListener('hashchange', function() {
    const hash = window.location.hash;
    if (hash) {
        const targetSection = document.querySelector(hash);
        if (targetSection) {
            // Find the index of the target section
            Array.from(sections).forEach((section, index) => {
                if (section.id === targetSection.id) {
                    navigateToSection(index);
                }
            });
        }
    } else {
        // No hash means we should navigate to the intro section
        navigateToSection(0);
    }
});

// Core scroll handling function
function handleScroll(scrollDown) {
    // Check cooldown to prevent rapid scrolling
    const now = Date.now();
    if (now - lastScrollTime < scrollCooldown || isScrolling) return;
    
    lastScrollTime = now;
    
    if (scrollDown && currentSectionIndex < sections.length - 1) {
        navigateToSection(currentSectionIndex + 1);
    } else if (!scrollDown && currentSectionIndex > 0) {
        navigateToSection(currentSectionIndex - 1);
    }
}

// Function to navigate to a specific section
function navigateToSection(index) {
    // Ensure index is within bounds
    if (index < 0) {
        index = 0;
    } else if (index >= sections.length) {
        index = sections.length - 1;
    }
    
    // Set scrolling state and update current section index
    isScrolling = true;
    currentSectionIndex = index;
    
    // Update sections visibility
    updateSections();
    
    // Update indicators
    updateIndicators();
    
    // Update navbar links
    updateNavbarLinks();
    
    // Reset scrolling state after animation completes
    setTimeout(() => {
        isScrolling = false;
    }, 1000);
}

// Function to update sections visibility
function updateSections() {
    sections.forEach((section, index) => {
        // Position each section based on the current section index
        const offset = (index - currentSectionIndex) * 100;
        section.style.transition = isScrolling ? 'transform 1s cubic-bezier(0.23, 1, 0.32, 1)' : 'none';
        section.style.transform = `translateY(${offset}${getSectionOffsetUnit()})`;
        section.style.zIndex = sections.length - Math.abs(index - currentSectionIndex);
        
        // Add/remove active class for additional styling
        if (index === currentSectionIndex) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });

    // Update the URL hash
    const currentSectionId = sections[currentSectionIndex].id;
    if (currentSectionId === 'intro') {
        history.replaceState(null, null, ' ');
    } else {
        history.replaceState(null, null, `#${currentSectionId}`);
    }

    syncAboutTextHighlight();
    resetContactSectionScrollIfNeeded();
}

function resetContactSectionScrollIfNeeded() {
    const contact = document.getElementById('contact');
    if (!contact) return;
    if (!isActiveContactSection()) {
        contact.scrollTop = 0;
    }
}

// Update section indicators
function updateIndicators() {
    const currentSection = sections[currentSectionIndex].id;

    const sectionIndicatorsContainer = document.getElementById('section-indicators');
    if (sectionIndicatorsContainer) {
        sectionIndicatorsContainer.classList.toggle('hidden', !currentSection.startsWith('project'));
    }
    
    // Determine the background color for inactive indicators based on current section
    const inactiveClass = (currentSection === 'intro' || currentSection === 'project-agent-evaluator' || currentSection === 'project3' || currentSection === 'contact') 
        ? 'bg-zinc-300' 
        : 'bg-white/30';
    
    sectionIndicators.forEach((indicator, index) => {
        // Reset all indicators first
        indicator.classList.remove('h-12');
        indicator.classList.add('h-3');
        
        if (index === currentSectionIndex) {
            // Make active indicator taller
            indicator.classList.remove('h-3');
            indicator.classList.add('h-12');
            
            // Set active indicator color based on section
            if (currentSection === 'intro' || currentSection === 'project-agent-evaluator' || currentSection === 'project3' || currentSection === 'contact') {
                indicator.className = 'section-indicator self-stretch h-14 bg-gray-500 rounded-lg transition-all duration-300';
            } else {
                // Dark background sections (other projects)
                indicator.className = 'section-indicator self-stretch h-14 bg-white rounded-lg transition-all duration-300';
            }
        } else {
            // Set inactive indicator color based on section
            if (currentSection === 'intro' || currentSection === 'project-agent-evaluator' || currentSection === 'project3' || currentSection === 'contact') {
                indicator.className = 'section-indicator self-stretch h-4 bg-zinc-300 rounded-lg transition-all duration-300';
            } else {
                // Dark background sections (other projects)
                indicator.className = 'section-indicator self-stretch h-4 bg-white/30 rounded-lg transition-all duration-300';
            }
        }
    });
}

function setNavLinkState(link, isActive, onDarkBg) {
    if (!link) return;

    link.classList.toggle('font-medium', isActive);
    link.classList.toggle('font-normal', !isActive);

    if (onDarkBg) {
        link.classList.toggle('text-white', isActive);
        link.classList.toggle('text-gray-400', !isActive);
        link.classList.remove('text-gray-600');
    } else {
        link.classList.toggle('text-gray-600', isActive);
        link.classList.toggle('text-gray-400', !isActive);
        link.classList.remove('text-white');
    }
}

// Update navbar links visibility and scroll-spy emphasis
function updateNavbarLinks() {
    // Always keep navbar links visible
    navbarLinks.forEach(link => {
        link.style.opacity = '1';
        link.style.pointerEvents = 'auto';
    });

    if (!sections[currentSectionIndex]) return;

    const sectionId = sections[currentSectionIndex].id;
    const onDarkBg = DARK_NAV_SECTIONS.has(sectionId);
    const isIntro = sectionId === 'intro';
    const isProjects = sectionId.startsWith('project');
    const isContact = sectionId === 'contact';

    setNavLinkState(homeNavLink, isIntro, onDarkBg);
    setNavLinkState(projectsNavLink, isProjects, onDarkBg);
    setNavLinkState(aboutNavLink, isContact, onDarkBg);

    if (navBookBtn) {
        navBookBtn.classList.toggle('nav-book-btn--light', onDarkBg);
    }
}

// Set up the navbar scroll behavior
function setupNavbarScroll() {
    let prevSectionIndex = currentSectionIndex;
    
    // Check if we should show/hide navbar based on scroll direction
    function updateNavbar() {
        // Keep navbar always visible on homepage
        if (document.getElementById('fullpage')) {
            // Always ensure navbar is visible on the homepage
            navbar.classList.remove('below-content');
            navbar.classList.add('above-content');
            
            // Update the previous section index for tracking purposes
            prevSectionIndex = currentSectionIndex;
        } else {
            // For other pages, don't interfere with their navbar behavior
            // The project-page.js will handle the navbar there
        }
    }
    
    // Update interval to check section changes
    setInterval(updateNavbar, 100);
}

// Run the direct hash navigation handler immediately (not waiting for DOMContentLoaded)
// This ensures section positioning even before full DOM loads
if (window.location.hash) {
    window.addEventListener('load', function() {
        setTimeout(handleDirectHashNavigation, 100);
    });
} 