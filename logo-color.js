// Logo Name Color Management
document.addEventListener('DOMContentLoaded', function() {
    // Get logo name element
    const logoName = document.getElementById('logo-name');
    if (!logoName) return;

    // Function to update logo name color based on background
    function updateLogoNameColor() {
        // Get the background color of the section the logo is currently over
        const navbar = document.getElementById('navbar');
        if (!navbar) return;

        // First, try to handle the case for the main index page
        const fullpage = document.getElementById('fullpage');
        if (fullpage) {
            // Check for the current visible section on the main page
            const hash = window.location.hash || '#intro';
            const sectionId = hash.substring(1);
            
            // Apply logic based on section ID (same as in the original main.js)
            if (sectionId === 'intro' || sectionId === 'project2' || sectionId === 'contact') {
                logoName.classList.remove('text-white');
                logoName.classList.add('text-black');
            } else {
                logoName.classList.remove('text-black');
                logoName.classList.add('text-white');
            }
            
            return;
        }
        
        // For project pages or other pages, use the background color detection
        // Get the current background color behind the navbar
        const rect = navbar.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Get the element at the center point of the navbar
        const elementAtPoint = document.elementFromPoint(centerX, centerY);
        if (!elementAtPoint) return;
        
        // Find the section containing this element
        let currentSection = elementAtPoint.closest('section') || 
                            elementAtPoint.closest('.section') || 
                            elementAtPoint;
        
        // Get the computed background color
        const backgroundColor = window.getComputedStyle(currentSection).backgroundColor;
        
        // Determine if the background is dark or light
        const isDark = isColorDark(backgroundColor);
        
        // Set text color based on background
        if (isDark) {
            logoName.classList.remove('text-black');
            logoName.classList.add('text-white');
        } else {
            logoName.classList.remove('text-white');
            logoName.classList.add('text-black');
        }
    }
    
    // Helper function to determine if a color is dark
    function isColorDark(color) {
        // Default to assuming light background if we can't parse the color
        if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
            return false;
        }
        
        // Parse RGB or RGBA color
        let r, g, b;
        
        if (color.startsWith('rgb')) {
            const rgbValues = color.match(/\d+/g);
            if (rgbValues && rgbValues.length >= 3) {
                r = parseInt(rgbValues[0]);
                g = parseInt(rgbValues[1]);
                b = parseInt(rgbValues[2]);
            } else {
                return false; // Couldn't parse RGB values
            }
        } else {
            // For other color formats, default to assuming light
            return false;
        }
        
        // Calculate brightness using perceived luminance formula
        // https://www.w3.org/TR/AERT/#color-contrast
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        
        // If brightness is less than 128, consider it dark
        return brightness < 128;
    }
    
    // Initial call
    updateLogoNameColor();
    
    // Update on scroll
    window.addEventListener('scroll', updateLogoNameColor);
    
    // For single-page applications with hash navigation
    window.addEventListener('hashchange', updateLogoNameColor);
    
    // Handle project page navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function() {
            // Give time for the section to transition before updating colors
            setTimeout(updateLogoNameColor, 500);
        });
    });
    
    // Set up mutation observer to detect class changes on sections
    // This helps handle dynamic content changes or animations
    const observer = new MutationObserver(updateLogoNameColor);
    const sections = document.querySelectorAll('section, .section');
    sections.forEach(section => {
        observer.observe(section, { 
            attributes: true, 
            attributeFilter: ['class', 'style']
        });
    });
}); 