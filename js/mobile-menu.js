document.addEventListener('DOMContentLoaded', function() {
    const nav = document.querySelector('.main-nav');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    let lastScroll = 0;

    // Handle scroll effect
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Add scrolled class when scrolling down
        if (currentScroll > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
        
        // Hide/show nav on scroll
        if (currentScroll > lastScroll && currentScroll > 100) {
            nav.classList.add('nav-hidden');
        } else {
            nav.classList.remove('nav-hidden');
        }
        
        lastScroll = currentScroll;
    });

    // Mobile menu toggle
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
            
            // Update button icon
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) {
                icon.className = navLinks.classList.contains('active') ? 'fas fa-times' : 'fas fa-bars';
            }
        });
    }

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (navLinks.classList.contains('active') && 
            !e.target.closest('.nav-links') && 
            !e.target.closest('.mobile-menu-btn')) {
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
            
            // Reset button icon
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-bars';
            }
        }
    });

    // Close menu on window resize if open
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
            
            // Reset button icon
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-bars';
            }
        }
    });

    // Handle active link
    const currentPath = window.location.pathname;
    const navLinksList = document.querySelectorAll('.nav-links a');
    
    navLinksList.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
}); 