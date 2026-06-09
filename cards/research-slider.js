const totalSlides = 4;
let currentSlide = 0;
let previousSlide = 0;
let slideInterval;
let isTransitioning = false;
let isMobile = window.innerWidth < 768;

// Design process slider variables
let designCurrentSlide = 0;
let designPreviousSlide = 0;
let designSlideInterval;
let designIsTransitioning = false;

// Pause state variables
let researchSliderPaused = false;
let designSliderPaused = false;

function getSliderTextColumn(container, imageContainerClass) {
  return container.querySelector(`:scope > div:not(.${imageContainerClass})`);
}

function measureTextColumnHeight(textColumn, contentIdPrefix, slideCount) {
  if (!textColumn || slideCount === 0) return;

  const savedStates = [];
  let maxHeight = 0;
  const previousVisibility = textColumn.style.visibility;
  textColumn.style.visibility = 'hidden';

  for (let i = 0; i < slideCount; i++) {
    const content = document.getElementById(`${contentIdPrefix}${i}`);
    savedStates[i] = content ? content.classList.contains('active') : false;
  }

  for (let i = 0; i < slideCount; i++) {
    for (let j = 0; j < slideCount; j++) {
      const content = document.getElementById(`${contentIdPrefix}${j}`);
      if (content) {
        content.classList.toggle('active', j === i);
      }
    }
    maxHeight = Math.max(maxHeight, textColumn.offsetHeight);
  }

  for (let j = 0; j < slideCount; j++) {
    const content = document.getElementById(`${contentIdPrefix}${j}`);
    if (content) {
      content.classList.toggle('active', savedStates[j]);
    }
  }

  textColumn.style.minHeight = `${maxHeight}px`;
  textColumn.style.visibility = previousVisibility;
}

function measureImageContainerHeight(imageContainer, imageSelector) {
  if (!imageContainer) return;

  const images = imageContainer.querySelectorAll(imageSelector);
  if (images.length === 0) return;

  const containerWidth = imageContainer.offsetWidth;
  if (!containerWidth) return;

  let maxHeight = 0;

  images.forEach((img) => {
    if (img.naturalWidth > 0) {
      const scaledHeight = containerWidth * (img.naturalHeight / img.naturalWidth);
      maxHeight = Math.max(maxHeight, scaledHeight);
    }
  });

  if (maxHeight > 0) {
    imageContainer.style.minHeight = `${Math.ceil(maxHeight)}px`;
  }
}

function stabilizeSliderLayout() {
  if (isMobile) {
    document.querySelectorAll('.slider-container, .design-slider-container').forEach((container) => {
      const textColumn = container.querySelector(':scope > div:not(.desktop-image-container):not(.design-desktop-image-container)');
      const imageContainer = container.querySelector('.desktop-image-container, .design-desktop-image-container');
      if (textColumn) textColumn.style.minHeight = '';
      if (imageContainer) imageContainer.style.minHeight = '';
      container.style.minHeight = '';
    });
    return;
  }

  stabilizeSingleSliderLayout(
    document.querySelector('.slider-container'),
    'desktop-image-container',
    'content-',
    document.querySelectorAll('[id^="desktop-image-"]').length,
    '.slide-image'
  );

  stabilizeSingleSliderLayout(
    document.querySelector('.design-slider-container'),
    'design-desktop-image-container',
    'design-content-',
    document.querySelectorAll('[id^="design-desktop-image-"]').length,
    '.design-slide-image'
  );
}

function stabilizeSingleSliderLayout(container, imageContainerClass, contentIdPrefix, slideCount, imageSelector) {
  if (!container || slideCount === 0) return;

  const textColumn = getSliderTextColumn(container, imageContainerClass);
  const imageContainer = container.querySelector(`.${imageContainerClass}`);
  measureTextColumnHeight(textColumn, contentIdPrefix, slideCount);
  measureImageContainerHeight(imageContainer, imageSelector);

  const containerHeight = Math.max(
    textColumn ? parseFloat(textColumn.style.minHeight) || 0 : 0,
    imageContainer ? parseFloat(imageContainer.style.minHeight) || 0 : 0
  );

  if (containerHeight > 0) {
    container.style.minHeight = `${containerHeight}px`;
  }
}

function stabilizeSliderLayoutWhenReady() {
  const images = document.querySelectorAll('.slide-image, .design-slide-image');
  const pendingImages = Array.from(images).filter((img) => !img.complete);

  if (pendingImages.length === 0) {
    stabilizeSliderLayout();
    return;
  }

  let loadedCount = 0;
  const onImageReady = () => {
    loadedCount += 1;
    if (loadedCount === pendingImages.length) {
      stabilizeSliderLayout();
    }
  };

  pendingImages.forEach((img) => {
    img.addEventListener('load', onImageReady, { once: true });
    img.addEventListener('error', onImageReady, { once: true });
  });
}

function startProgress() {
  const researchSlideCount = document.querySelectorAll('[id^="desktop-image-"]').length;
  if (isMobile) {
    // On mobile, just toggle the active class on the container
    for (let i = 0; i < researchSlideCount; i++) {
      const progressContainer = document.getElementById(`progress-container-${i}`);
      if (progressContainer) {
        if (i === currentSlide) {
          progressContainer.classList.add('active');
        } else {
          progressContainer.classList.remove('active');
        }
      }
    }
  } else {
    // On desktop, animate the progress line
    const progressLines = document.querySelectorAll('.progress-line');
    
    // Reset all progress lines
    progressLines.forEach((line, index) => {
      // Only process if index is within the valid range
      if (index < researchSlideCount) {
        // Reset height
        line.style.height = '0%';
        
        // Remove active class from all
        line.classList.remove('active');
        
        // Set active class only on current slide's progress line
        if (index === currentSlide) {
          line.classList.add('active');
          
          // Only start progress animation if not paused
          if (!researchSliderPaused) {
            // Force reflow to restart the animation
            void line.offsetWidth;
            
            // Start progress animation
            line.style.height = '100%';
          }
        }
      }
    });
  }
}

function startDesignProgress() {
  const designSlideCount = document.querySelectorAll('[id^="design-desktop-image-"]').length;
  if (isMobile) {
    // On mobile, just toggle the active class on the container
    for (let i = 0; i < designSlideCount; i++) {
      const progressContainer = document.getElementById(`design-progress-container-${i}`);
      if (progressContainer) {
        if (i === designCurrentSlide) {
          progressContainer.classList.add('active');
        } else {
          progressContainer.classList.remove('active');
        }
      }
    }
  } else {
    // On desktop, animate the progress line
    const progressLines = document.querySelectorAll('.design-progress-line');
    
    // Reset all progress lines
    progressLines.forEach((line, index) => {
      // Only process if index is within the valid range
      if (index < designSlideCount) {
        // Reset height
        line.style.height = '0%';
        
        // Remove active class from all
        line.classList.remove('active');
        
        // Set active class only on current slide's progress line
        if (index === designCurrentSlide) {
          line.classList.add('active');
          
          // Only start progress animation if not paused
          if (!designSliderPaused) {
            // Force reflow to restart the animation
            void line.offsetWidth;
            
            // Start progress animation
            line.style.height = '100%';
          }
        }
      }
    });
  }
}

function updateHeadlines() {
  // Update headline styles
  const researchSlideCount = document.querySelectorAll('[id^="desktop-image-"]').length;
  for (let i = 0; i < researchSlideCount; i++) {
    const headline = document.getElementById(`headline-${i}`);
    if (headline) {
      if (i === currentSlide) {
        headline.classList.add('active');
      } else {
        headline.classList.remove('active');
      }
    }
  }
}

function updateDesignHeadlines() {
  // Update headline styles
  const designSlideCount = document.querySelectorAll('[id^="design-desktop-image-"]').length;
  for (let i = 0; i < designSlideCount; i++) {
    const headline = document.getElementById(`design-headline-${i}`);
    if (headline) {
      if (i === designCurrentSlide) {
        headline.classList.add('active');
      } else {
        headline.classList.remove('active');
      }
    }
  }
}

function updateImages() {
  // Update desktop images
  const researchSlideCount = document.querySelectorAll('[id^="desktop-image-"]').length;
  for (let i = 0; i < researchSlideCount; i++) {
    const desktopImage = document.getElementById(`desktop-image-${i}`);
    
    if (desktopImage) {
      if (i === currentSlide) {
        desktopImage.classList.add('active');
      } else {
        desktopImage.classList.remove('active');
      }
    }
  }
}

function updateDesignImages() {
  // Update desktop images
  const designSlideCount = document.querySelectorAll('[id^="design-desktop-image-"]').length;
  for (let i = 0; i < designSlideCount; i++) {
    const desktopImage = document.getElementById(`design-desktop-image-${i}`);
    
    if (desktopImage) {
      if (i === designCurrentSlide) {
        desktopImage.classList.add('active');
      } else {
        desktopImage.classList.remove('active');
      }
    }
  }
}

function hideContent(callback) {
  if (previousSlide === currentSlide) {
    callback();
    return;
  }

  const prevContent = document.getElementById(`content-${previousSlide}`);
  const prevMobileImage = document.getElementById(`mobile-image-${previousSlide}`);

  if (isMobile) {
    if (prevContent) prevContent.classList.remove('active');
    if (prevMobileImage) prevMobileImage.classList.remove('active');
    setTimeout(callback, 400);
    return;
  }

  if (prevContent) prevContent.classList.remove('active');
  if (prevMobileImage) prevMobileImage.classList.remove('active');
  callback();
}

function hideDesignContent(callback) {
  if (designPreviousSlide === designCurrentSlide) {
    callback();
    return;
  }

  const prevContent = document.getElementById(`design-content-${designPreviousSlide}`);
  const prevMobileImage = document.getElementById(`design-mobile-image-${designPreviousSlide}`);

  if (isMobile) {
    if (prevContent) prevContent.classList.remove('active');
    if (prevMobileImage) prevMobileImage.classList.remove('active');
    setTimeout(callback, 400);
    return;
  }

  if (prevContent) prevContent.classList.remove('active');
  if (prevMobileImage) prevMobileImage.classList.remove('active');
  callback();
}

function showContent() {
  // Show the new content
  const newContent = document.getElementById(`content-${currentSlide}`);
  if (newContent) newContent.classList.add('active');
  
  // Also show mobile image if on mobile
  const newMobileImage = document.getElementById(`mobile-image-${currentSlide}`);
  if (newMobileImage) newMobileImage.classList.add('active');
  
  // Mark transition as complete
  isTransitioning = false;
}

function showDesignContent() {
  // Show the new content
  const newContent = document.getElementById(`design-content-${designCurrentSlide}`);
  if (newContent) newContent.classList.add('active');
  
  // Also show mobile image if on mobile
  const newMobileImage = document.getElementById(`design-mobile-image-${designCurrentSlide}`);
  if (newMobileImage) newMobileImage.classList.add('active');
  
  // Mark transition as complete
  designIsTransitioning = false;
}

function showSlide(index) {
  // Prevent multiple transitions at once
  if (isTransitioning) return;
  isTransitioning = true;
  
  // Store previous slide for content transitions
  previousSlide = currentSlide;
  
  // Update current slide
  currentSlide = index;
  
  // Update headlines and images immediately
  updateHeadlines();
  updateImages();
  
  // Update button visibility
  updateResearchSliderButtons(researchSliderPaused);
  
  // Start progress indicator (different for mobile and desktop)
  startProgress();
  
  // Sequential content transition
  hideContent(showContent);
}

function showDesignSlide(index) {
  // Prevent multiple transitions at once
  if (designIsTransitioning) return;
  designIsTransitioning = true;
  
  // Store previous slide for content transitions
  designPreviousSlide = designCurrentSlide;
  
  // Update current slide
  designCurrentSlide = index;
  
  // Update headlines and images immediately
  updateDesignHeadlines();
  updateDesignImages();
  
  // Update button visibility
  updateDesignSliderButtons(designSliderPaused);
  
  // Start progress indicator (different for mobile and desktop)
  startDesignProgress();
  
  // Sequential content transition
  hideDesignContent(showDesignContent);
}

function nextSlide() {
  // Only proceed if not currently transitioning
  if (!isTransitioning) {
    const researchSlideCount = document.querySelectorAll('[id^="desktop-image-"]').length;
    const nextIndex = (currentSlide + 1) % researchSlideCount;
    showSlide(nextIndex);
  }
}

function nextDesignSlide() {
  // Only proceed if not currently transitioning
  if (!designIsTransitioning) {
    const designSlideCount = document.querySelectorAll('[id^="design-desktop-image-"]').length;
    const nextIndex = (designCurrentSlide + 1) % designSlideCount;
    showDesignSlide(nextIndex);
  }
}

function goToSlide(index) {
  // Only proceed if not currently transitioning
  const researchSlideCount = document.querySelectorAll('[id^="desktop-image-"]').length;
  if (!isTransitioning && index >= 0 && index < researchSlideCount) {
    // If slider was paused, resume it when user clicks on a headline
    if (researchSliderPaused) {
      researchSliderPaused = false;
      if (!isMobile) {
        slideInterval = setInterval(() => {
          const nextIndex = (currentSlide + 1) % researchSlideCount;
          showSlide(nextIndex);
        }, 10000);
      }
    }
    
    // Reset the interval if on desktop and not paused
    if (!isMobile && slideInterval && !researchSliderPaused) {
      clearInterval(slideInterval);
    }
    
    // Show the selected slide
    showSlide(index);
    
    // Restart the interval if on desktop and not paused
    if (!isMobile && !researchSliderPaused) {
      slideInterval = setInterval(() => {
        const nextIndex = (currentSlide + 1) % researchSlideCount;
        showSlide(nextIndex);
      }, 10000);
    }
  }
}

function goToDesignSlide(index) {
  // Only proceed if not currently transitioning
  const designSlideCount = document.querySelectorAll('[id^="design-desktop-image-"]').length;
  if (!designIsTransitioning && index >= 0 && index < designSlideCount) {
    // If slider was paused, resume it when user clicks on a headline
    if (designSliderPaused) {
      designSliderPaused = false;
      if (!isMobile) {
        designSlideInterval = setInterval(() => {
          const nextIndex = (designCurrentSlide + 1) % designSlideCount;
          showDesignSlide(nextIndex);
        }, 10000);
      }
    }
    
    // Reset the interval if on desktop and not paused
    if (!isMobile && designSlideInterval && !designSliderPaused) {
      clearInterval(designSlideInterval);
    }
    
    // Show the selected slide
    showDesignSlide(index);
    
    // Restart the interval if on desktop and not paused
    if (!isMobile && !designSliderPaused) {
      designSlideInterval = setInterval(() => {
        const nextIndex = (designCurrentSlide + 1) % designSlideCount;
        showDesignSlide(nextIndex);
      }, 10000);
    }
  }
}

// Initialize sliders
function initSliders() {
  // Initialize research slider
  initResearchSlider();
  
  // Initialize design slider
  initDesignSlider();
  
  // Initialize slider control buttons
  initSliderControlButtons();
}

// Initialize research slider
function initResearchSlider() {
  // Dynamically determine the number of slides for research slider
  const researchSlideCount = document.querySelectorAll('[id^="desktop-image-"]').length;
  if (researchSlideCount === 0) return;

  console.log('Initializing research slider');
  console.log(`Detected ${researchSlideCount} slides for research slider`);
  
  // Add click event listeners to headline groups
  for (let i = 0; i < researchSlideCount; i++) {
    const headlineGroup = document.getElementById(`headline-group-${i}`);
    if (headlineGroup) {
      headlineGroup.addEventListener('click', (event) => {
        if (event.target.closest('.slider-control-btn')) return;
        goToSlide(i);
      });
    }
  }

  // Check for slide elements
  for (let i = 0; i < researchSlideCount; i++) {
    const desktopImage = document.getElementById(`desktop-image-${i}`);
    if (!desktopImage) {
      console.warn(`Missing desktop image element: desktop-image-${i}`);
    }
    
    const mobileImage = document.getElementById(`mobile-image-${i}`);
    if (!mobileImage) {
      console.warn(`Missing mobile image element: mobile-image-${i}`);
    }
  }

  // Initialize with the first slide
  const firstContent = document.getElementById(`content-0`);
  if (firstContent) firstContent.classList.add('active');
  
  const firstHeadline = document.getElementById(`headline-0`);
  if (firstHeadline) firstHeadline.classList.add('active');
  
  const firstDesktopImage = document.getElementById(`desktop-image-0`);
  if (firstDesktopImage) {
    console.log('Setting first desktop image active');
    firstDesktopImage.classList.add('active');
  } else {
    console.warn('First desktop image element not found');
  }
  
  const firstMobileImage = document.getElementById(`mobile-image-0`);
  if (firstMobileImage) {
    console.log('Setting first mobile image active');
    firstMobileImage.classList.add('active');
  } else {
    console.warn('First mobile image element not found');
  }
  
  // Hide other mobile images
  for (let i = 1; i < researchSlideCount; i++) {
    const mobileImage = document.getElementById(`mobile-image-${i}`);
    if (mobileImage) {
      mobileImage.classList.remove('active');
    }
  }
  
  const firstProgressContainer = document.getElementById(`progress-container-0`);
  if (firstProgressContainer) firstProgressContainer.classList.add('active');
  
  // Start progress indicators
  startProgress();
  
  // Update button visibility for initial state
  updateResearchSliderButtons(researchSliderPaused);
  
  // Start auto-rotation only if on desktop
  if (!isMobile) {
    slideInterval = setInterval(() => {
      const nextIndex = (currentSlide + 1) % researchSlideCount;
      showSlide(nextIndex);
    }, 10000);
  }
}

// Initialize design slider
function initDesignSlider() {
  // Dynamically determine the number of slides for design slider
  const designSlideCount = document.querySelectorAll('[id^="design-desktop-image-"]').length;
  if (designSlideCount === 0) return;

  console.log('Initializing design slider');
  console.log(`Detected ${designSlideCount} slides for design slider`);
  
  // Add click event listeners to headline groups
  for (let i = 0; i < designSlideCount; i++) {
    const headlineGroup = document.getElementById(`design-headline-group-${i}`);
    if (headlineGroup) {
      headlineGroup.addEventListener('click', (event) => {
        if (event.target.closest('.slider-control-btn')) return;
        goToDesignSlide(i);
      });
    }
  }

  // Check for slide elements
  for (let i = 0; i < designSlideCount; i++) {
    const desktopImage = document.getElementById(`design-desktop-image-${i}`);
    if (!desktopImage) {
      console.warn(`Missing design desktop image element: design-desktop-image-${i}`);
    }
    
    const mobileImage = document.getElementById(`design-mobile-image-${i}`);
    if (!mobileImage) {
      console.warn(`Missing design mobile image element: design-mobile-image-${i}`);
    }
  }

  // Initialize with the first slide
  const firstContent = document.getElementById(`design-content-0`);
  if (firstContent) firstContent.classList.add('active');
  
  const firstHeadline = document.getElementById(`design-headline-0`);
  if (firstHeadline) firstHeadline.classList.add('active');
  
  const firstDesktopImage = document.getElementById(`design-desktop-image-0`);
  if (firstDesktopImage) {
    console.log('Setting first design desktop image active');
    firstDesktopImage.classList.add('active');
  } else {
    console.warn('First design desktop image element not found');
  }
  
  const firstMobileImage = document.getElementById(`design-mobile-image-0`);
  if (firstMobileImage) {
    console.log('Setting first design mobile image active');
    firstMobileImage.classList.add('active');
  } else {
    console.warn('First design mobile image element not found');
  }
  
  // Hide other mobile images
  for (let i = 1; i < designSlideCount; i++) {
    const mobileImage = document.getElementById(`design-mobile-image-${i}`);
    if (mobileImage) {
      mobileImage.classList.remove('active');
    }
  }
  
  const firstProgressContainer = document.getElementById(`design-progress-container-0`);
  if (firstProgressContainer) firstProgressContainer.classList.add('active');
  
  // Start progress indicators
  startDesignProgress();
  
  // Update button visibility for initial state
  updateDesignSliderButtons(designSliderPaused);
  
  // Start auto-rotation only if on desktop
  if (!isMobile) {
    designSlideInterval = setInterval(() => {
      const nextIndex = (designCurrentSlide + 1) % designSlideCount;
      showDesignSlide(nextIndex);
    }, 10000);
  }
}

// Handle resize events to adjust between mobile and desktop behavior
window.addEventListener('resize', () => {
  const wasMobile = isMobile;
  isMobile = window.innerWidth < 768;
  
  stabilizeSliderLayoutWhenReady();

  // If switching from mobile to desktop, start auto-rotation (if not paused)
  if (wasMobile && !isMobile) {
    // Research slider
    if (!researchSliderPaused) {
      if (slideInterval) clearInterval(slideInterval);
      slideInterval = setInterval(nextSlide, 10000);
    }
    startProgress();
    
    // Design slider
    if (!designSliderPaused) {
      if (designSlideInterval) clearInterval(designSlideInterval);
      designSlideInterval = setInterval(nextDesignSlide, 10000);
    }
    startDesignProgress();
  }
  
  // If switching from desktop to mobile, stop auto-rotation
  if (!wasMobile && isMobile) {
    // Research slider
    if (slideInterval) {
      clearInterval(slideInterval);
      slideInterval = null;
    }
    startProgress(); // Update the progress style for mobile
    
    // Design slider
    if (designSlideInterval) {
      clearInterval(designSlideInterval);
      designSlideInterval = null;
    }
    startDesignProgress(); // Update the progress style for mobile
  }
});

// Start the sliders when page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');
  
  // Wait a brief moment to ensure all elements are rendered
  setTimeout(() => {
    initSliders();
    
    // Manually trigger initial slide display
    updateImages();
    updateDesignImages();
    stabilizeSliderLayoutWhenReady();
    console.log('Sliders initialized');
  }, 100);
});

// Pause/Resume functionality
function toggleResearchSlider() {
  researchSliderPaused = !researchSliderPaused;
  
  if (researchSliderPaused) {
    // Pause the slider
    if (slideInterval) {
      clearInterval(slideInterval);
      slideInterval = null;
    }
    // Stop the progress line animation
    const currentProgressLine = document.querySelector(`#progress-${currentSlide}`);
    if (currentProgressLine) {
      currentProgressLine.style.transition = 'none';
      currentProgressLine.style.height = currentProgressLine.style.height || '0%';
    }
    // Update all research slider buttons to show play icon
    updateResearchSliderButtons(true);
  } else {
    // Resume the slider
    if (!isMobile) {
      const researchSlideCount = document.querySelectorAll('[id^="desktop-image-"]').length;
      slideInterval = setInterval(() => {
        const nextIndex = (currentSlide + 1) % researchSlideCount;
        showSlide(nextIndex);
      }, 10000);
    }
    // Resume the progress line animation
    const currentProgressLine = document.querySelector(`#progress-${currentSlide}`);
    if (currentProgressLine) {
      currentProgressLine.style.transition = 'height 10s linear';
      currentProgressLine.style.height = '100%';
    }
    // Update all research slider buttons to show pause icon
    updateResearchSliderButtons(false);
  }
}

function toggleDesignSlider() {
  designSliderPaused = !designSliderPaused;
  
  if (designSliderPaused) {
    // Pause the slider
    if (designSlideInterval) {
      clearInterval(designSlideInterval);
      designSlideInterval = null;
    }
    // Stop the progress line animation
    const currentProgressLine = document.querySelector(`#design-progress-${designCurrentSlide}`);
    if (currentProgressLine) {
      currentProgressLine.style.transition = 'none';
      currentProgressLine.style.height = currentProgressLine.style.height || '0%';
    }
    // Update all design slider buttons to show play icon
    updateDesignSliderButtons(true);
  } else {
    // Resume the slider
    if (!isMobile) {
      const designSlideCount = document.querySelectorAll('[id^="design-desktop-image-"]').length;
      designSlideInterval = setInterval(() => {
        const nextIndex = (designCurrentSlide + 1) % designSlideCount;
        showDesignSlide(nextIndex);
      }, 10000);
    }
    // Resume the progress line animation
    const currentProgressLine = document.querySelector(`#design-progress-${designCurrentSlide}`);
    if (currentProgressLine) {
      currentProgressLine.style.transition = 'height 10s linear';
      currentProgressLine.style.height = '100%';
    }
    // Update all design slider buttons to show pause icon
    updateDesignSliderButtons(false);
  }
}

function updateResearchSliderButtons(isPaused) {
  const buttons = document.querySelectorAll('.slider-control-btn[data-slider="research"]');
  buttons.forEach((button, index) => {
    const icon = button.querySelector('i');
    const isActive = index === currentSlide;
    
    // Only show button if headline is active
    if (isActive) {
      button.style.display = 'flex';
      if (isPaused) {
        icon.className = 'fas fa-play text-xs opacity-60 hover:opacity-100 transition-opacity';
        button.classList.add('paused');
      } else {
        icon.className = 'fas fa-pause text-xs opacity-60 hover:opacity-100 transition-opacity';
        button.classList.remove('paused');
      }
    } else {
      button.style.display = 'none';
    }
  });
}

function updateDesignSliderButtons(isPaused) {
  const buttons = document.querySelectorAll('.slider-control-btn[data-slider="design"]');
  buttons.forEach((button, index) => {
    const icon = button.querySelector('i');
    const isActive = index === designCurrentSlide;
    
    // Only show button if headline is active
    if (isActive) {
      button.style.display = 'flex';
      if (isPaused) {
        icon.className = 'fas fa-play text-xs opacity-60 hover:opacity-100 transition-opacity';
        button.classList.add('paused');
      } else {
        icon.className = 'fas fa-pause text-xs opacity-60 hover:opacity-100 transition-opacity';
        button.classList.remove('paused');
      }
    } else {
      button.style.display = 'none';
    }
  });
}

// Add event listeners for slider control buttons
function initSliderControlButtons() {
  // Research slider buttons
  const researchButtons = document.querySelectorAll('.slider-control-btn[data-slider="research"]');
  researchButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent headline click
      toggleResearchSlider();
    });
  });
  
  // Design slider buttons
  const designButtons = document.querySelectorAll('.slider-control-btn[data-slider="design"]');
  designButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent headline click
      toggleDesignSlider();
    });
  });
} 