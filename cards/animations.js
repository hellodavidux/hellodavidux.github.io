// Animation Observer for Holistic Training Builder

document.addEventListener('DOMContentLoaded', () => {
  // Function to check if element is in viewport
  const animateOnScroll = () => {
    const elements = document.querySelectorAll('.animate-on-scroll, .image-animation, .video-animation, .section-heading, .card-animation');
    const listItems = document.querySelectorAll('.list-animation li');
    
    // Create the Intersection Observer
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        // If element is in view
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // If the animation only needs to happen once, unobserve
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1, // Trigger when 10% of the element is visible
      rootMargin: '0px 0px -50px 0px' // Adjust trigger point (negative value means elements start animating before they're fully in view)
    });
    
    // Observe all elements
    elements.forEach(element => {
      observer.observe(element);
    });
    
    // Observe list items
    listItems.forEach(item => {
      observer.observe(item);
    });
  };
  
  // Initialize animations
  animateOnScroll();
  
  // Handle any dynamically loaded content
  document.addEventListener('load', animateOnScroll);
}); 