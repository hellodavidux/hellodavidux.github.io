/**
 * Project page functionality
 * Handles navbar behavior and scroll spy
 */

document.addEventListener('DOMContentLoaded', function() {
  // Get references to DOM elements
  const sections = document.querySelectorAll('#intro, #discovery, #design-process, #solution, #solution2, #solution3, #solution4, #insights');
  const mainSections = document.querySelectorAll('#intro, #discovery, #design-process, #solution, #insights'); // For navigation purposes
  const navItems = document.querySelectorAll('.scroll-spy-section');
  const navbar = document.getElementById('navbar');
  const scrollSpy = document.getElementById('scroll-spy');
  const progressIndicator = document.getElementById('progress-indicator');
  const backButton = document.getElementById('back-home');
  
  // Handle back button click - return to previous page
  backButton.addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = backButton.getAttribute('href');
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
    const bottomThreshold = 500; // Threshold from bottom in pixels
    
    // Handle navbar visibility - only show at top of page
    if (scrollPosition > 50) {
      navbar.style.transform = 'translateY(-100%)';
    } else {
      navbar.style.transform = 'translateY(0)';
    }
    
    // Calculate if we're near the bottom of the page
    const isNearBottom = (documentHeight - (scrollPosition + windowHeight)) < bottomThreshold;
    
    // Handle scroll spy and back button visibility
    if (scrollPosition > 800 && !isNearBottom) {
      scrollSpy.classList.remove('opacity-0', 'translate-y-10');
      scrollSpy.classList.add('opacity-100', 'translate-y-0');
      backButton.classList.add('visible');
    } else {
      scrollSpy.classList.add('opacity-0', 'translate-y-10');
      scrollSpy.classList.remove('opacity-100', 'translate-y-0');
      // Only hide back button if we're at the top, not at the bottom
      if (scrollPosition <= 800) {
        backButton.classList.remove('visible');
      }
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
      
      // Adjust index based on which section we're in
      if (sectionId === 'intro') adjustedSectionIndex = 0;
      else if (sectionId === 'discovery') adjustedSectionIndex = 1;
      else if (sectionId === 'design-process') adjustedSectionIndex = 2;
      else if (sectionId.startsWith('solution')) {
        adjustedSectionIndex = 3;
        
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
        progressIndicator.style.width = `${progressWidth}%`;
        return; // Exit early since we've calculated the width
      }
      else if (sectionId === 'insights') adjustedSectionIndex = 4;
      
      // For non-solution sections, calculate progress within the section
      const sectionTop = currentSection.offsetTop - 400;
      const progressInSection = (scrollPosition - sectionTop) / currentSection.offsetHeight;
      const clampedProgress = Math.max(0, Math.min(1, progressInSection)); // Ensure value is between 0 and 1
      
      // Calculate final progress width
      const progressWidth = ((adjustedSectionIndex + clampedProgress) / progressSectionCount) * 100;
      progressIndicator.style.width = `${progressWidth}%`;
    }
  }
  
  // Add scroll event handler
  window.addEventListener('scroll', handleScroll);
  
  // Initialize on load
  handleScroll();
  
  // Recalculate on window resize
  window.addEventListener('resize', handleScroll);
}); 