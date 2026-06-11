/**
 * Project page functionality
 * Handles navbar behavior and scroll spy
 */

document.addEventListener('DOMContentLoaded', function() {
  if (typeof setupDotCursor === 'function') {
    setupDotCursor();
  }

  // Get references to DOM elements
  const navItems = document.querySelectorAll('.scroll-spy-section');
  const mainSections = Array.from(navItems)
    .map(item => document.getElementById(item.dataset.section))
    .filter(Boolean);
  const solutionSections = document.querySelectorAll('#solution, #solution2, #solution3, #solution4');
  const sections = [];
  mainSections.forEach(section => {
    sections.push(section);
    if (section.id === 'solution') {
      solutionSections.forEach(subsection => {
        if (subsection.id !== 'solution') sections.push(subsection);
      });
    }
  });
  const navbar = document.getElementById('navbar');
  const scrollSpy = document.getElementById('scroll-spy');
  const progressIndicator = document.getElementById('progress-indicator');
  const backButton = document.getElementById('back-home');

  if (scrollSpy) {
    scrollSpy.style.display = 'none';
  }
  
  function navigateToHome() {
    window.location.href = backButton.getAttribute('href');
  }

  // Handle back button click - return to previous page
  backButton.addEventListener('click', function(e) {
    e.preventDefault();
    navigateToHome();
  });

  // Allow Esc to close the project page, unless another overlay owns Esc
  document.addEventListener('keydown', function(event) {
    if (event.key !== 'Escape' || event.defaultPrevented) {
      return;
    }

    const lightboxOpen = document.querySelector('.media-lightbox.is-open');
    if (lightboxOpen) {
      return;
    }

    event.preventDefault();
    navigateToHome();
  });
  
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelector(this.getAttribute('href')).scrollIntoView({
        behavior: 'smooth'
      });
    });
  });
  
  // Handle alert close buttons
  document.querySelectorAll('.alert-close-button').forEach(button => {
    button.addEventListener('click', function() {
      const alertElement = this.closest('[role="alert"]');
      if (alertElement) {
        // Store original height before hiding content
        const originalHeight = alertElement.offsetHeight;
        
        // Clone the element to keep its structure but hide its content
        const placeholder = alertElement.cloneNode(true);
        
        // Apply styles to make the content invisible but preserve space
        placeholder.style.height = originalHeight + 'px';
        placeholder.style.opacity = '0';
        placeholder.style.pointerEvents = 'none';
        placeholder.style.transition = 'opacity 0.3s ease';
        
        // Replace the original with the placeholder
        alertElement.parentNode.replaceChild(placeholder, alertElement);
        
        // After transition, gradually reduce height to zero
        setTimeout(() => {
          placeholder.style.transition = 'height 0.5s ease, opacity 0.3s ease';
          placeholder.style.height = '0';
          placeholder.style.margin = '0';
          placeholder.style.padding = '0';
          placeholder.style.overflow = 'hidden';
          
          // Remove the element completely after transition completes
          setTimeout(() => {
            placeholder.remove();
          }, 500);
        }, 300);
      }
    });
  });
  
  // Scroll event handler
  function handleScroll() {
    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    // Handle navbar visibility - only show at top of page
    if (scrollPosition > 50) {
      navbar.style.transform = 'translateY(-100%)';
      backButton.classList.add('visible');
    } else {
      navbar.style.transform = 'translateY(0)';
      backButton.classList.remove('visible');
    }
    
    // Track active section for navigation highlighting
    let activeNavIndex = 0;
    let activeMainSection = null;
    
    mainSections.forEach((section, index) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      
      if (scrollPosition >= sectionTop - 400 && scrollPosition < sectionTop + sectionHeight - 400) {
        activeNavIndex = index;
        activeMainSection = section;
        
        // Update styles for active section in scroll spy
        navItems.forEach((item, i) => {
          if (i === activeNavIndex) {
            item.classList.add('active');
          } else {
            item.classList.remove('active');
          }
        });
      }
    });
    
    // Calculate overall scroll progress for progress bar
    const totalScrollableHeight = documentHeight - windowHeight;
    const currentScrollProgress = scrollPosition / totalScrollableHeight;
    
    // For more granular progress within sections
    let currentSectionIndex = -1;
    let currentSection = null;
    
    // Find which section we're currently in
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionTop = section.offsetTop;
      const sectionBottom = sectionTop + section.offsetHeight;
      
      if (scrollPosition >= sectionTop - 400 && scrollPosition < sectionBottom - 400) {
        currentSectionIndex = i;
        currentSection = section;
        break;
      }
    }
    
    // Calculate progress percentage
    if (currentSection) {
      // Map sections to the 5 main sections for progress calculation
      let progressSectionCount = mainSections.length;
      let adjustedSectionIndex = 0;
      
      // Get the section ID
      const sectionId = currentSection.id;
      
      const mainSectionIndex = Array.from(mainSections).findIndex(section => section.id === sectionId);
      if (mainSectionIndex >= 0) {
        adjustedSectionIndex = mainSectionIndex;
      } else if (sectionId.startsWith('solution')) {
        adjustedSectionIndex = Array.from(mainSections).findIndex(section => section.id === 'solution');
        if (adjustedSectionIndex < 0) adjustedSectionIndex = mainSections.length - 2;
        
        // Calculate sub-progress within all solution sections
        const allSolutionSections = Array.from(document.querySelectorAll('#solution, #solution2, #solution3, #solution4'));
        const solutionTotalHeight = allSolutionSections.reduce((total, section) => total + section.offsetHeight, 0);
        const currentSolutionIndex = allSolutionSections.findIndex(section => section.id === sectionId);
        
        // Calculate how far we are through all solution sections
        let solutionProgress = 0;
        if (currentSolutionIndex >= 0) {
          // Add heights of previous solution sections
          let heightBefore = 0;
          for (let i = 0; i < currentSolutionIndex; i++) {
            heightBefore += allSolutionSections[i].offsetHeight;
          }
          
          // Add progress within current solution section
          const sectionTop = currentSection.offsetTop - 400;
          const progressInCurrentSection = (scrollPosition - sectionTop) / currentSection.offsetHeight;
          const currentSectionContribution = allSolutionSections[currentSolutionIndex].offsetHeight * progressInCurrentSection;
          
          solutionProgress = (heightBefore + currentSectionContribution) / solutionTotalHeight;
        }
        
        // Calculate final progress width
        const progressWidth = ((adjustedSectionIndex + solutionProgress) / progressSectionCount) * 100;
        if (progressIndicator) progressIndicator.style.width = `${progressWidth}%`;
        return; // Exit early since we've calculated the width
      }
      else if (sectionId === 'insights') {
        adjustedSectionIndex = Array.from(mainSections).findIndex(section => section.id === 'insights');
        if (adjustedSectionIndex < 0) adjustedSectionIndex = mainSections.length - 1;
      }
      
      // For non-solution sections, calculate progress within the section
      const sectionTop = currentSection.offsetTop - 400;
      const progressInSection = (scrollPosition - sectionTop) / currentSection.offsetHeight;
      const clampedProgress = Math.max(0, Math.min(1, progressInSection)); // Ensure value is between 0 and 1
      
      // Calculate final progress width
      const progressWidth = ((adjustedSectionIndex + clampedProgress) / progressSectionCount) * 100;
      if (progressIndicator) progressIndicator.style.width = `${progressWidth}%`;
    }
  }
  
  // Add scroll event handler
  window.addEventListener('scroll', handleScroll);
  
  // Initialize on load
  handleScroll();
  
  // Recalculate on window resize
  window.addEventListener('resize', handleScroll);
});

// Cal.com element-click embed (nav "Book 15-min" button)
(function (C, A, L) {
  let p = function (a, ar) { a.q.push(ar); };
  let d = C.document;
  C.Cal = C.Cal || function () {
    let cal = C.Cal;
    let ar = arguments;
    if (!cal.loaded) {
      cal.ns = {};
      cal.q = cal.q || [];
      d.head.appendChild(d.createElement('script')).src = A;
      cal.loaded = true;
    }
    if (ar[0] === L) {
      const api = function () { p(api, arguments); };
      const namespace = ar[1];
      api.q = api.q || [];
      if (typeof namespace === 'string') {
        cal.ns[namespace] = cal.ns[namespace] || api;
        p(cal.ns[namespace], ar);
        p(cal, ['initNamespace', namespace]);
      } else {
        p(cal, ar);
      }
      return;
    }
    p(cal, ar);
  };
})(window, 'https://app.cal.com/embed/embed.js', 'init');
Cal('init', '15min', { origin: 'https://app.cal.com' });
Cal.ns['15min']('ui', { hideEventTypeDetails: false, layout: 'month_view' });