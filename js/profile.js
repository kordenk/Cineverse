document.addEventListener('DOMContentLoaded', () => {
    // Initialize the profile page
    initializeProfilePage();
    
    // Check if user is logged in, if not show login modal
    if (!auth.isLoggedIn()) {
        showAuthModal();
    }
});

function initializeProfilePage() {
    // Setup menu navigation
    initializeMenu();
    
    // Setup auth forms
    initializeAuthForms();
    
    // Setup account form
    initializeAccountForm();
    
    // Setup watchlist
    initializeWatchlist();
    
    // Setup history
    initializeHistory();
    
    // Setup preferences
    initializePreferences();
    
    // Load user data if logged in
    if (auth.isLoggedIn()) {
        loadUserData();
    }
    
    // Setup avatar change
    initializeAvatarChange();
}

// Menu Navigation
function initializeMenu() {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all items
            menuItems.forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked item
            item.classList.add('active');
            
            // Hide all sections
            document.querySelectorAll('.profile-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show the selected section
            const sectionId = item.dataset.section + '-section';
            document.getElementById(sectionId).classList.add('active');
        });
    });
    
    // Setup logout button
    document.querySelector('.logout-button').addEventListener('click', () => {
        auth.logout();
        showAuthModal();
    });
}

// Auth Forms
function initializeAuthForms() {
    const authModal = document.getElementById('auth-modal');
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const closeAuth = document.querySelector('.close-auth');
    
    // Switch between login and register forms
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            authForms.forEach(form => form.classList.remove('active'));
            const tabName = tab.dataset.tab;
            document.getElementById(`${tabName}-form`).classList.add('active');
        });
    });
    
    // Handle form submissions
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            auth.login(email, password);
            hideAuthModal();
            loadUserData();
        } catch (error) {
            document.getElementById('login-error').textContent = error.message;
        }
    });
    
    registerForm.addEventListener('submit', e => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm').value;
        
        if (password !== confirmPassword) {
            document.getElementById('register-error').textContent = 'Passwords do not match';
            return;
        }
        
        try {
            auth.register(username, email, password);
            hideAuthModal();
            loadUserData();
        } catch (error) {
            document.getElementById('register-error').textContent = error.message;
        }
    });
    
    // Close modal
    closeAuth.addEventListener('click', () => {
        hideAuthModal();
        if (!auth.isLoggedIn()) {
            window.location.href = 'index.html'; // Redirect to home if not logged in
        }
    });
}

function showAuthModal() {
    const authModal = document.getElementById('auth-modal');
    authModal.classList.add('active');
}

function hideAuthModal() {
    const authModal = document.getElementById('auth-modal');
    authModal.classList.remove('active');
}

// Account Form
function initializeAccountForm() {
    const saveButton = document.getElementById('save-account-btn');
    
    saveButton.addEventListener('click', () => {
        const username = document.getElementById('username').value;
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (newPassword && newPassword !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }
        
        try {
            const userData = {
                username
            };
            
            if (newPassword) {
                userData.password = newPassword;
            }
            
            auth.updateProfile(userData);
            showNotification('Profile updated successfully');
            loadUserData();
            
            // Clear password fields
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });
}

// Avatar Change
function initializeAvatarChange() {
    const avatarModal = document.getElementById('avatar-modal');
    const avatarChangeBtn = document.querySelector('.avatar-change-btn');
    const closeAvatar = document.querySelector('.close-avatar');
    const avatarOptions = document.querySelectorAll('.avatar-option');
    const saveAvatarBtn = document.querySelector('.save-avatar-btn');
    const customAvatarInput = document.getElementById('custom-avatar-input');
    const previewContainer = document.querySelector('.preview-container');
    const avatarPreview = document.getElementById('avatar-preview');
    const removePreviewBtn = document.querySelector('.remove-preview');
    const uploadLabel = document.querySelector('.upload-label');
    
    let selectedAvatar = null;
    let customImageFile = null;
    
    // Open modal
    avatarChangeBtn.addEventListener('click', () => {
        avatarModal.classList.add('active');
        
        // Find current avatar and select it
        const currentAvatar = auth.getCurrentUser()?.avatar || 'assets/default-avatar.png';
        avatarOptions.forEach(option => {
            if (option.dataset.avatar === currentAvatar) {
                option.classList.add('selected');
                selectedAvatar = currentAvatar;
            } else {
                option.classList.remove('selected');
            }
        });
        
        // Reset custom upload
        resetCustomUpload();
    });
    
    // Close modal
    closeAvatar.addEventListener('click', () => {
        avatarModal.classList.remove('active');
        resetCustomUpload();
    });
    
    // Select avatar
    avatarOptions.forEach(option => {
        option.addEventListener('click', () => {
            avatarOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedAvatar = option.dataset.avatar;
            
            // Reset custom upload when selecting a preset avatar
            resetCustomUpload();
        });
    });
    
    // Handle custom image upload
    customAvatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showNotification('Please upload an image file', 'error');
                return;
            }
            
            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                showNotification('File size should be less than 5MB', 'error');
                return;
            }
            
            // Deselect preset avatars
            avatarOptions.forEach(opt => opt.classList.remove('selected'));
            selectedAvatar = null;
            
            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                avatarPreview.src = e.target.result;
                previewContainer.classList.remove('hidden');
                uploadLabel.classList.add('hidden');
                customImageFile = file;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Remove custom image preview
    removePreviewBtn.addEventListener('click', () => {
        resetCustomUpload();
    });
    
    // Save avatar
    saveAvatarBtn.addEventListener('click', async () => {
        try {
            if (customImageFile) {
                // Handle custom image upload
                const formData = new FormData();
                formData.append('avatar', customImageFile);
                
                // Upload the image and get the URL
                const avatarUrl = await uploadCustomAvatar(formData);
                
                // Update profile with new avatar URL
                await auth.updateProfile({
                    avatar: avatarUrl
                });
                
                // Update UI
                updateAvatarInUI(avatarUrl);
            } else if (selectedAvatar) {
                // Update profile with selected preset avatar
                await auth.updateProfile({
                    avatar: selectedAvatar
                });
                
                // Update UI
                updateAvatarInUI(selectedAvatar);
            }
            
            showNotification('Profile picture updated successfully');
            avatarModal.classList.remove('active');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });
    
    function resetCustomUpload() {
        customAvatarInput.value = '';
        previewContainer.classList.add('hidden');
        uploadLabel.classList.remove('hidden');
        customImageFile = null;
    }
    
    function updateAvatarInUI(avatarUrl) {
        document.getElementById('profile-avatar-img').src = avatarUrl;
        document.getElementById('nav-profile-img').src = avatarUrl;
    }
}

// Function to handle custom avatar upload
async function uploadCustomAvatar(formData) {
    try {
        // In a real application, you would upload the image to a server
        // and get back a URL. For this example, we'll create a local URL
        const file = formData.get('avatar');
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            reader.readAsDataURL(file);
        });
    } catch (error) {
        throw new Error('Failed to upload image. Please try again.');
    }
}

// Watchlist
function initializeWatchlist() {
    const filterButtons = document.querySelectorAll('.watchlist-filters .filter-btn');
    
    // Filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const filter = button.dataset.filter;
            loadWatchlistItems(filter);
        });
    });
}

function loadWatchlistItems(filter = 'all') {
    const watchlistGrid = document.getElementById('watchlist-grid');
    const watchlist = auth.getWatchlist();
    
    // Filter items if needed
    const filteredWatchlist = filter === 'all' 
        ? watchlist 
        : watchlist.filter(item => item.type === filter);
    
    if (filteredWatchlist.length === 0) {
        watchlistGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bookmark"></i>
                <p>Your watchlist is empty. Start adding movies and TV shows!</p>
            </div>
        `;
        return;
    }
    
    watchlistGrid.innerHTML = filteredWatchlist.map(item => `
        <div class="watchlist-item" data-id="${item.id}" data-type="${item.type}">
            <div class="watchlist-poster">
                <img src="${item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'assets/no-poster.jpg'}" alt="${item.title || item.name}">
                <div class="watchlist-type">${item.type === 'movie' ? 'Movie' : 'TV Show'}</div>
                <div class="watchlist-remove" data-id="${item.id}" data-type="${item.type}">
                    <i class="fas fa-times"></i>
                </div>
            </div>
            <div class="watchlist-details">
                <div class="watchlist-title">${item.title || item.name}</div>
                <div class="watchlist-meta">
                    <span>${item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0] || 'N/A'}</span>
                    <span><i class="fas fa-star"></i> ${item.vote_average?.toFixed(1) || 'N/A'}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    // Add event listeners to watchlist items
    document.querySelectorAll('.watchlist-item').forEach(item => {
        item.addEventListener('click', e => {
            // Don't trigger if clicking on remove button
            if (e.target.closest('.watchlist-remove')) return;
            
            const id = item.dataset.id;
            const type = item.dataset.type;
            
            // Add to history
            auth.addToHistory({
                id,
                type,
                title: item.querySelector('.watchlist-title').textContent,
                poster_path: item.querySelector('img').src.includes('no-poster.jpg') 
                    ? null 
                    : item.querySelector('img').src.replace('https://image.tmdb.org/t/p/w500', '')
            });
            
            // Navigate to detail page
            window.location.href = type === 'movie' 
                ? `movie-details.html?id=${id}` 
                : `tv-show-details.html?id=${id}`;
        });
    });
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.watchlist-remove').forEach(button => {
        button.addEventListener('click', e => {
            e.stopPropagation();
            
            const id = button.dataset.id;
            const type = button.dataset.type;
            
            auth.removeFromWatchlist(id, type);
            loadWatchlistItems(filter);
            showNotification('Removed from watchlist');
        });
    });
}

// History
function initializeHistory() {
    const filterButtons = document.querySelectorAll('.history-filters .filter-btn');
    const clearButton = document.querySelector('.clear-history-btn');
    
    // Filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const filter = button.dataset.filter;
            loadHistoryItems(filter);
        });
    });
    
    // Clear history button
    clearButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your viewing history?')) {
            auth.clearHistory();
            loadHistoryItems();
            showNotification('History cleared');
        }
    });
}

function loadHistoryItems(filter = 'all') {
    const historyList = document.getElementById('history-list');
    const history = auth.getHistory();
    
    // Filter items if needed
    const filteredHistory = filter === 'all' 
        ? history 
        : history.filter(item => item.type === filter);
    
    if (filteredHistory.length === 0) {
        historyList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <p>Your viewing history is empty.</p>
            </div>
        `;
        return;
    }
    
    historyList.innerHTML = filteredHistory.map(item => {
        const date = new Date(item.viewed);
        const timeString = `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
        
        return `
            <div class="history-item" data-id="${item.id}" data-type="${item.type}">
                <div class="history-poster">
                    <img src="${item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'assets/no-poster.jpg'}" alt="${item.title || item.name}">
                </div>
                <div class="history-info">
                    <div class="history-title">${item.title || item.name}</div>
                    <div class="history-meta">
                        <span>${item.type === 'movie' ? 'Movie' : 'TV Show'}</span>
                        <span>${item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0] || 'N/A'}</span>
                    </div>
                    <div class="history-time">Viewed: ${timeString}</div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add event listeners to history items
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id;
            const type = item.dataset.type;
            
            // Add to history again (updates timestamp)
            auth.addToHistory({
                id,
                type,
                title: item.querySelector('.history-title').textContent,
                poster_path: item.querySelector('img').src.includes('no-poster.jpg') 
                    ? null 
                    : item.querySelector('img').src.replace('https://image.tmdb.org/t/p/w500', '')
            });
            
            // Navigate to detail page
            window.location.href = type === 'movie' 
                ? `movie-details.html?id=${id}` 
                : `tv-show-details.html?id=${id}`;
        });
    });
}

// Preferences
function initializePreferences() {
    // Theme buttons
    const themeButtons = document.querySelectorAll('.theme-btn');
    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            themeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });
    
    // Load genres
    loadGenres();
    
    // Save preferences button
    document.getElementById('save-preferences-btn').addEventListener('click', () => {
        const theme = document.querySelector('.theme-btn.active').dataset.theme;
        const autoplayTrailers = document.getElementById('autoplay-toggle').checked;
        const subtitlesEnabled = document.getElementById('subtitles-toggle').checked;
        
        // Get selected genres
        const selectedGenres = [];
        document.querySelectorAll('.genre-item.selected').forEach(genre => {
            selectedGenres.push({
                id: genre.dataset.id,
                name: genre.textContent
            });
        });
        
        // Save preferences
        auth.updatePreferences({
            theme,
            autoplayTrailers,
            subtitlesEnabled,
            favoriteGenres: selectedGenres
        });
        
        applyTheme(theme);
        showNotification('Preferences saved');
    });
}

async function loadGenres() {
    const genresGrid = document.getElementById('genres-grid');
    
    try {
        // Get genres from API
        const movieGenres = await movieAPI.getMovieGenres();
        const tvGenres = await movieAPI.getTVGenres();
        
        // Combine and deduplicate
        const allGenres = [...movieGenres.genres];
        tvGenres.genres.forEach(tvGenre => {
            if (!allGenres.some(g => g.id === tvGenre.id)) {
                allGenres.push(tvGenre);
            }
        });
        
        // Sort alphabetically
        allGenres.sort((a, b) => a.name.localeCompare(b.name));
        
        // Get user preferences
        const userPrefs = auth.getPreferences();
        const favoriteGenres = userPrefs.favoriteGenres || [];
        
        // Create genre items
        genresGrid.innerHTML = allGenres.map(genre => {
            const isSelected = favoriteGenres.some(g => g.id === genre.id);
            return `
                <div class="genre-item ${isSelected ? 'selected' : ''}" data-id="${genre.id}">
                    ${genre.name}
                </div>
            `;
        }).join('');
        
        // Add event listeners
        document.querySelectorAll('.genre-item').forEach(item => {
            item.addEventListener('click', () => {
                item.classList.toggle('selected');
            });
        });
    } catch (error) {
        console.error('Error loading genres:', error);
        genresGrid.innerHTML = '<p>Failed to load genres. Please try again.</p>';
    }
}

// Load user data
function loadUserData() {
    const user = auth.getCurrentUser();
    
    // Update profile info
    document.getElementById('profile-username').textContent = user.username;
    document.getElementById('profile-email').textContent = user.email;
    document.getElementById('profile-avatar-img').src = user.avatar;
    document.getElementById('nav-profile-img').src = user.avatar;
    
    // Update account form
    document.getElementById('username').value = user.username;
    document.getElementById('email').value = user.email;
    
    // Load watchlist
    loadWatchlistItems();
    
    // Load history
    loadHistoryItems();
    
    // Load preferences
    loadUserPreferences();
    
    // Apply current theme
    const preferences = auth.getPreferences();
    applyTheme(preferences.theme || 'dark');
}

function loadUserPreferences() {
    const preferences = auth.getPreferences();
    
    // Set theme
    const themeButtons = document.querySelectorAll('.theme-btn');
    themeButtons.forEach(btn => {
        if (btn.dataset.theme === preferences.theme) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Set toggles
    document.getElementById('autoplay-toggle').checked = preferences.autoplayTrailers !== false;
    document.getElementById('subtitles-toggle').checked = preferences.subtitlesEnabled !== false;
}

function applyTheme(theme) {
    // You can implement theme switching logic here
    // For example, adding a class to the body element
    document.body.className = `theme-${theme}`;
}

// Utility functions
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Handle profile picture upload
const profilePictureInput = document.getElementById('profile-picture');
const profilePicturePreview = document.getElementById('profile-picture-preview');

profilePictureInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showNotification('Please upload an image file', 'error');
            return;
        }
        
        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('File size should be less than 5MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            
            // Update user data in localStorage
            const currentUser = JSON.parse(localStorage.getItem('cineverse_current_user')) || {};
            currentUser.avatar = imageData;
            localStorage.setItem('cineverse_current_user', JSON.stringify(currentUser));
            
            // Update auth user data
            if (typeof auth !== 'undefined' && auth.getCurrentUser()) {
                auth.updateProfile({ avatar: imageData });
            }
            
            // Update all profile images on the current page
            if (typeof updateAllProfileImages === 'function') {
                updateAllProfileImages(imageData);
            } else {
                const allProfileImages = document.querySelectorAll('.nav-profile img, .profile-avatar img, #profile-avatar-img, #profile-picture-preview');
                allProfileImages.forEach(img => img.src = imageData);
            }
            
            // Broadcast the change to other tabs/windows
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'cineverse_current_user',
                newValue: JSON.stringify(currentUser)
            }));
            
            showNotification('Profile picture updated successfully');
        };
        reader.readAsDataURL(file);
    }
});

// Update profile pictures when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('cineverse_current_user'));
    if (currentUser && currentUser.avatar) {
        if (typeof updateAllProfileImages === 'function') {
            updateAllProfileImages(currentUser.avatar);
        } else {
            const allProfileImages = document.querySelectorAll('.nav-profile img, .profile-avatar img, #profile-avatar-img, #profile-picture-preview');
            allProfileImages.forEach(img => img.src = currentUser.avatar);
        }
    }
});

// Listen for profile picture changes from other tabs/windows
window.addEventListener('storage', (e) => {
    if (e.key === 'cineverse_current_user') {
        const userData = JSON.parse(e.newValue);
        if (userData && userData.avatar) {
            if (typeof updateAllProfileImages === 'function') {
                updateAllProfileImages(userData.avatar);
            } else {
                const allProfileImages = document.querySelectorAll('.nav-profile img, .profile-avatar img, #profile-avatar-img, #profile-picture-preview');
                allProfileImages.forEach(img => img.src = userData.avatar);
            }
        }
    }
}); 
