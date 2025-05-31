// Like Button Animation and State Management
document.addEventListener('DOMContentLoaded', function() {
    const likeButton = document.getElementById('likeButton');
    
    // To ensure we start with an unliked state on first load, clear localStorage 
    // if this is our first visit (using a separate flag so we don't clear all localStorage)
    if (!localStorage.getItem('likeButtonInitialized')) {
        localStorage.removeItem('likedState');
        localStorage.setItem('likeButtonInitialized', 'true');
    }
    
    if (likeButton) {
        // Check if the button was previously liked - default to unliked (false)
        const isLiked = localStorage.getItem('likedState') === 'true';
        
        // Apply liked state ONLY if previously liked and saved in localStorage
        if (isLiked) {
            likeButton.classList.add('liked');
            // Make sure the heart is filled
            const heartPath = likeButton.querySelector('.heart path');
            if (heartPath) {
                heartPath.style.fill = 'white';
            }
        } else {
            // Ensure unliked state (in case browser cache maintains classes)
            likeButton.classList.remove('liked');
            const heartPath = likeButton.querySelector('.heart path');
            if (heartPath) {
                heartPath.style.fill = 'transparent';
            }
        }
        
        likeButton.addEventListener('click', function(e) {
            // Prevent default button behavior
            e.preventDefault();
            
            // Toggle liked state
            const currentLikedState = this.classList.contains('liked');
            
            if (!currentLikedState) {
                // Liking - add active class for animation only when liking
                if (this.classList.contains('active')) return; // Don't do anything if animation is already running
                this.classList.add('active');
                this.classList.add('liked');
                localStorage.setItem('likedState', 'true');
                
                // Remove active class after animation completes
                setTimeout(() => {
                    this.classList.remove('active');
                }, 1000); // 1000ms = animation duration (500ms) + extra time for particles
            } else {
                // Unliking - no animation, just change state
                this.classList.remove('liked');
                localStorage.setItem('likedState', 'false');
            }
        });
    }
}); 