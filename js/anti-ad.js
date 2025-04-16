// Anti-Ad Overlay Implementation
class AntiAdOverlay {
    constructor() {
        this.overlay = null;
        this.init();
    }

    init() {
        // Create overlay element
        this.overlay = document.createElement('div');
        this.overlay.className = 'anti-ad-overlay';
        this.overlay.id = 'antiAdOverlay';

        // Add to body when DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.mount());
        } else {
            this.mount();
        }

        // Handle potential popups and redirects
        this.handlePopupPrevention();
    }

    mount() {
        document.body.appendChild(this.overlay);
        
        // Remove overlay after animation (3 seconds total)
        setTimeout(() => {
            this.overlay.remove();
        }, 3000);
    }

    handlePopupPrevention() {
        // Prevent window.open calls
        window.originalOpen = window.open;
        window.open = function() {
            console.log('Popup blocked by AntiAdOverlay');
            return null;
        };

        // Prevent redirects during protected period
        const originalLocation = window.location.href;
        Object.defineProperty(window, 'location', {
            get: function() {
                return originalLocation;
            },
            set: function(value) {
                console.log('Redirect blocked by AntiAdOverlay');
                return originalLocation;
            }
        });

        // Reset after 2 seconds
        setTimeout(() => {
            window.open = window.originalOpen;
            delete window.originalOpen;
            
            // Restore location functionality
            delete window.location;
            window.location = window.location;
        }, 2000);
    }
}

// Initialize the overlay
const antiAd = new AntiAdOverlay(); 