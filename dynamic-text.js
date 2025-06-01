// dynamic-text.js

document.addEventListener('DOMContentLoaded', () => {
    const changingText = document.getElementById('changing-text');
    
    if (!changingText) return;
    
    const phrases = [
        'understanding user needs',
        'identifying opportunities',
        'solving real problems',
        'creating intuitive flows'
    ];
    
    let currentIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingDelay = 100;
    let deletingDelay = 50;
    let pauseDelay = 2500;
    
    function typeText() {
        const currentPhrase = phrases[currentIndex];
        
        if (isDeleting) {
            changingText.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
            typingDelay = deletingDelay;
            
            if (charIndex === 0) {
                isDeleting = false;
                currentIndex = (currentIndex + 1) % phrases.length;
                typingDelay = 500;
            }
        } else {
            changingText.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
            typingDelay = 100;
            
            if (charIndex === currentPhrase.length) {
                isDeleting = true;
                typingDelay = pauseDelay;
            }
        }
        
        setTimeout(typeText, typingDelay);
    }
    
    // Start the typing animation after 3 seconds
    setTimeout(typeText, 5000);
}); 