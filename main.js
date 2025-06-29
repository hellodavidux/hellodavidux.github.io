// DOM Elements
const sections = document.querySelectorAll('.section');
const sectionIndicators = document.querySelectorAll('.section-indicator');
const scrollDownIndicator = document.getElementById('scroll-down-indicator');
const navbar = document.getElementById('navbar');
const navbarLinks = document.querySelectorAll('.navbar-links');
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
        updateScrollDownIndicator();
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

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Get all sections and indicators
    const sections = document.querySelectorAll('.section');
    const indicators = document.querySelectorAll('.section-indicator');
    const scrollDownIndicator = document.getElementById('scroll-down-indicator');
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
    
    // Handle direct hash navigation as the first operation
    handleDirectHashNavigation();
    
    // Make sure the initial section is properly visible
    updateSections();
    
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
    
    // Set up scroll down indicator visibility
    updateScrollDownIndicator();
    
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
        e.preventDefault(); // Prevent default scrolling behavior
        handleScroll(e.deltaY > 0);
    }
}, { passive: false });

// Handle touch events for mobile
window.addEventListener('touchstart', function(e) {
    touchStartY = e.touches[0].clientY;
});

window.addEventListener('touchmove', function(e) {
    e.preventDefault(); // Prevent default scrolling behavior
}, { passive: false });

window.addEventListener('touchend', function(e) {
    touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY - touchEndY;
    
    // Increased threshold for swipe detection to avoid accidental swipes
    if (Math.abs(deltaY) > touchThreshold) {
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

// Handle scroll down indicator click
scrollDownIndicator.addEventListener('click', function() {
    handleScroll(true);
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
    
    // Update scroll down indicator
    updateScrollDownIndicator();
    
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
        section.style.transform = `translateY(${offset}vh)`;
        section.style.zIndex = sections.length - Math.abs(index - currentSectionIndex);
        
        // Add/remove active class for additional styling
        if (index === currentSectionIndex) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });

    // Trigger contact section highlight when navigating to it
    if (sections[currentSectionIndex] && sections[currentSectionIndex].id === 'contact') {
        const thankYouElement = document.querySelector('.thank-you');
        if (thankYouElement) {
            // Remove highlight if already applied
            thankYouElement.classList.remove('highlight');
            
            // Apply highlight after 2 seconds
            setTimeout(() => {
                thankYouElement.classList.add('highlight');
            }, 2000);
        }
    }
    
    // Update the URL hash
    const currentSectionId = sections[currentSectionIndex].id;
    if (currentSectionId === 'intro') {
        history.replaceState(null, null, ' ');
    } else {
        history.replaceState(null, null, `#${currentSectionId}`);
    }
}

// Update section indicators
function updateIndicators() {
    const currentSection = sections[currentSectionIndex].id;
    
    // Determine the background color for inactive indicators based on current section
    const inactiveClass = (currentSection === 'intro' || currentSection === 'project3' || currentSection === 'contact') 
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
            if (currentSection === 'intro' || currentSection === 'project3' || currentSection === 'contact') {
                indicator.className = 'section-indicator self-stretch h-14 bg-gray-500 rounded-lg transition-all duration-300';
            } else {
                // Dark background sections (other projects)
                indicator.className = 'section-indicator self-stretch h-14 bg-white rounded-lg transition-all duration-300';
            }
        } else {
            // Set inactive indicator color based on section
            if (currentSection === 'intro' || currentSection === 'project3' || currentSection === 'contact') {
                indicator.className = 'section-indicator self-stretch h-4 bg-zinc-300 rounded-lg transition-all duration-300';
            } else {
                // Dark background sections (other projects)
                indicator.className = 'section-indicator self-stretch h-4 bg-white/30 rounded-lg transition-all duration-300';
            }
        }
    });
}

// Update scroll down indicator visibility
function updateScrollDownIndicator() {
    if (currentSectionIndex === 0) {
        scrollDownIndicator.style.opacity = '1';
        scrollDownIndicator.style.pointerEvents = 'auto';
    } else {
        scrollDownIndicator.style.opacity = '0';
        scrollDownIndicator.style.pointerEvents = 'none';
    }
}

// Update navbar links visibility
function updateNavbarLinks() {
    // Always keep navbar links visible
    navbarLinks.forEach(link => {
        link.style.opacity = '1';
        link.style.pointerEvents = 'auto';
    });
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