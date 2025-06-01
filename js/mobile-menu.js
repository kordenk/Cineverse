document.addEventListener('DOMContentLoaded', function() {
    const nav = document.querySelector('.main-nav');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const body = document.body;
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

    // Toggle mobile menu
    mobileMenuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        navLinks.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
        
        // Prevent body scroll when menu is open
        if (navLinks.classList.contains('active')) {
            body.style.overflow = 'hidden';
        } else {
            body.style.overflow = '';
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            navLinks.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
            body.style.overflow = '';
        }
    });

    // Close menu when clicking on a link
    const menuLinks = navLinks.querySelectorAll('a');
    menuLinks.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
            body.style.overflow = '';
        });
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            navLinks.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
            body.style.overflow = '';
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