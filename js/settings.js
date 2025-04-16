document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in, if not redirect to login page
    if (!auth.requireAuth()) {
        return; // Stop execution if not authenticated
    }

    // Initialize settings
    initializeSettings();
});

// ... rest of the existing code ... 