// Script to update projects indicator behavior
document.addEventListener('DOMContentLoaded', function() {
    const projectsIndicator = document.getElementById('projects-indicator');
    const projectsLink = document.getElementById('projects-link');
    const introSection = document.getElementById('intro');
    const cardsSection = document.getElementById('cards');
    const contentSection = document.getElementById('content');
    
    // Function to update the projects indicator based on current section
    function updateProjectsIndicator() {
        // Hide indicator in cards or content sections
        if (!cardsSection.classList.contains('hidden') || !contentSection.classList.contains('hidden')) {
            projectsIndicator.style.display = 'none';
        } else {
            // Show indicator in intro section
            projectsIndicator.style.display = 'flex';
        }
    }
    
    // Initial check
    updateProjectsIndicator();
    
    // Setup observers to watch for class changes on the sections
    const sectionObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class') {
                updateProjectsIndicator();
            }
        });
    });
    
    // Observe all sections for class changes
    sectionObserver.observe(introSection, { attributes: true });
    sectionObserver.observe(cardsSection, { attributes: true });
    sectionObserver.observe(contentSection, { attributes: true });
}); 