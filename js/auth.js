class Auth {
    constructor() {
        // Wait for Supabase to be initialized
        if (!window.supabase) {
            console.error('Supabase client not initialized');
            return;
        }
        
        this.supabase = window.supabase;
        this.currentUser = null;
        
        // Initialize data
        this.users = this.loadUsers();
        this.watchlist = this.loadWatchlist();
        this.history = this.loadHistory();
        this.preferences = this.loadPreferences();
        
        // Check auth state and set up listener
        this.checkAuth();
        this.setupAuthListener();
    }

    async checkAuth() {
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) {
                console.error('Error checking auth:', error.message);
                return;
            }
            
            if (session) {
                this.handleAuthChange(session.user);
            }
        } catch (error) {
            console.error('Error checking auth:', error);
        }
    }

    setupAuthListener() {
        this.supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                this.handleAuthChange(session.user);
            } else if (event === 'SIGNED_OUT') {
                this.handleSignOut();
            }
        });
    }

    handleAuthChange(user) {
        const authButtons = document.querySelectorAll('.auth-buttons');
        const profileButtons = document.querySelectorAll('.profile-buttons');
        const userAvatar = document.querySelectorAll('.user-avatar');
        
        authButtons.forEach(btn => btn.style.display = 'none');
        profileButtons.forEach(btn => btn.style.display = 'flex');
        
        // Update user avatar if available
        if (user.user_metadata?.avatar_url) {
            userAvatar.forEach(avatar => {
                avatar.src = user.user_metadata.avatar_url;
                avatar.alt = user.email;
            });
        }

        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(user));
        
        // Also store in cineverse_current_user for compatibility
        const currentUser = {
            username: user.user_metadata?.username || user.email.split('@')[0],
            email: user.email,
            avatar: user.user_metadata?.avatar_url || 'assets/default-avatar.png'
        };
        localStorage.setItem('cineverse_current_user', JSON.stringify(currentUser));

        // Check if there's a redirect URL stored
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
            sessionStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectUrl;
        } else if (window.location.pathname.includes('login.html')) {
            // Only redirect to index if we're on the login page
            window.location.href = 'index.html';
        }
    }

    handleSignOut() {
        const authButtons = document.querySelectorAll('.auth-buttons');
        const profileButtons = document.querySelectorAll('.profile-buttons');
        const userAvatar = document.querySelectorAll('.user-avatar');
        
        authButtons.forEach(btn => btn.style.display = 'flex');
        profileButtons.forEach(btn => btn.style.display = 'none');
        
        // Reset avatar to default
        userAvatar.forEach(avatar => {
            avatar.src = 'assets/default-avatar.png';
            avatar.alt = 'Profile';
        });

        // Clear user data from localStorage
        localStorage.removeItem('user');
        this.currentUser = null;
    }

    async signIn(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                this.showNotification(error.message, 'error');
                return { success: false, error };
            }

            this.showNotification('Successfully signed in!', 'success');
            return { success: true, data };
        } catch (error) {
            console.error('Error signing in:', error);
            this.showNotification(error.message, 'error');
            return { success: false, error };
        }
    }

    async signUp(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password
            });

            if (error) {
                this.showNotification(error.message, 'error');
                return { success: false, error };
            }

            this.showNotification('Verification email sent! Please check your inbox.', 'success');
            return { success: true, data };
        } catch (error) {
            console.error('Error signing up:', error);
            this.showNotification(error.message, 'error');
            return { success: false, error };
        }
    }

    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            
            if (error) {
                throw error;
            }
            
            // Clear all stored user data
            localStorage.removeItem('cineverse_current_user');
            localStorage.removeItem('user');
            sessionStorage.clear();
            
            // Reset auth state
            this.currentUser = null;
            this.watchlist = [];
            this.history = [];
            this.preferences = {};
            
            this.showNotification('Successfully logged out!', 'success');
            
            // Redirect to login page
            window.location.href = 'login.html';
            
            return { success: true };
        } catch (error) {
            console.error('Error signing out:', error);
            this.showNotification(error.message || 'Error signing out', 'error');
            return { success: false, error };
        }
    }

    async resetPassword(email) {
        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            });

            if (error) throw error;

            showNotification('Password reset email sent!');
            return { success: true };
        } catch (error) {
            console.error('Error resetting password:', error);
            showNotification(error.message, 'error');
            return { success: false, error };
        }
    }

    async updatePassword(newPassword) {
        try {
            const { error } = await this.supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            showNotification('Password updated successfully!');
            return { success: true };
        } catch (error) {
            console.error('Error updating password:', error);
            showNotification(error.message, 'error');
            return { success: false, error };
        }
    }

    async updateProfile(data) {
        try {
            const { error } = await supabase.auth.updateUser({
                data: data
            });

            if (error) throw error;

            showNotification('Profile updated successfully!');
            return { success: true };
        } catch (error) {
            console.error('Error updating profile:', error);
            showNotification(error.message, 'error');
            return { success: false, error };
        }
    }

    isLoggedIn() {
        // Check if user exists in localStorage
        const user = localStorage.getItem('user');
        
        // If we have a user in localStorage, consider them logged in
        if (user) {
            return true;
        }
        
        // Also check if we have a current user in the cineverse_current_user key
        const currentUser = localStorage.getItem('cineverse_current_user');
        if (currentUser) {
            return true;
        }
        
        // If we have a Supabase session, consider them logged in
        if (this.supabase?.auth?.session) {
            return true;
        }
        
        return false;
    }

    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    // User Management
    loadUsers() {
        const savedUsers = localStorage.getItem('cineverse_users');
        return savedUsers ? JSON.parse(savedUsers) : {};
    }

    saveUsers() {
        localStorage.setItem('cineverse_users', JSON.stringify(this.users));
    }

    register(username, email, password) {
        if (this.users[email]) {
            throw new Error('User with this email already exists');
        }

        if (!username || !email || !password) {
            throw new Error('All fields are required');
        }

        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        const newUser = {
            username,
            email,
            password, // In a real app, this should be hashed
            created: new Date().toISOString(),
            avatar: 'assets/default-avatar.png'
        };

        this.users[email] = newUser;
        this.saveUsers();
        
        // Auto login after registration
        this.login(email, password);
        return true;
    }

    login(email, password) {
        const user = this.users[email];
        
        if (!user) {
            throw new Error('User not found');
        }

        if (user.password !== password) { // In a real app, compare hashed passwords
            throw new Error('Invalid password');
        }

        // Set current user and save to localStorage
        this.currentUser = {
            username: user.username,
            email: user.email,
            avatar: user.avatar
        };
        
        localStorage.setItem('cineverse_current_user', JSON.stringify(this.currentUser));
        this.initUserData();
        return true;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('cineverse_current_user');
        return true;
    }

    updateProfile(userData) {
        if (!this.currentUser) {
            throw new Error('User not logged in');
        }

        const user = this.users[this.currentUser.email];
        if (!user) {
            throw new Error('User not found');
        }

        // Update user data
        if (userData.username) user.username = userData.username;
        if (userData.avatar) user.avatar = userData.avatar;
        if (userData.password) user.password = userData.password;

        // Update current user
        this.currentUser.username = user.username;
        this.currentUser.avatar = user.avatar;

        // Save changes
        this.saveUsers();
        localStorage.setItem('cineverse_current_user', JSON.stringify(this.currentUser));
        return true;
    }

    // Watchlist Management
    initUserData() {
        this.loadWatchlist();
        this.loadHistory();
        this.loadPreferences();
    }

    loadWatchlist() {
        if (!this.currentUser) return [];
        
        const savedWatchlist = localStorage.getItem(`cineverse_watchlist_${this.currentUser.email}`);
        this.watchlist = savedWatchlist ? JSON.parse(savedWatchlist) : [];
        return this.watchlist;
    }

    saveWatchlist() {
        if (!this.currentUser) return false;
        
        localStorage.setItem(`cineverse_watchlist_${this.currentUser.email}`, JSON.stringify(this.watchlist));
        return true;
    }

    addToWatchlist(item) {
        if (!this.currentUser) {
            throw new Error('User not logged in');
        }
        
        // Check if item already exists
        const exists = this.watchlist.some(watchItem => 
            watchItem.id === item.id && watchItem.type === item.type
        );
        
        if (!exists) {
            this.watchlist.push({
                ...item,
                added: new Date().toISOString()
            });
            this.saveWatchlist();
            return true;
        }
        
        return false;
    }

    removeFromWatchlist(itemId, type) {
        if (!this.currentUser) {
            throw new Error('User not logged in');
        }
        
        const initialLength = this.watchlist.length;
        this.watchlist = this.watchlist.filter(item => !(item.id === itemId && item.type === type));
        
        if (this.watchlist.length !== initialLength) {
            this.saveWatchlist();
            return true;
        }
        
        return false;
    }

    getWatchlist() {
        return this.watchlist || [];
    }

    isInWatchlist(itemId, type) {
        return this.watchlist.some(item => item.id === itemId && item.type === type);
    }

    // Viewing History
    loadHistory() {
        if (!this.currentUser) return [];
        
        const savedHistory = localStorage.getItem(`cineverse_history_${this.currentUser.email}`);
        this.history = savedHistory ? JSON.parse(savedHistory) : [];
        return this.history;
    }

    saveHistory() {
        if (!this.currentUser) return false;
        
        localStorage.setItem(`cineverse_history_${this.currentUser.email}`, JSON.stringify(this.history));
        return true;
    }

    addToHistory(item) {
        if (!this.currentUser) return false;
        
        // Remove existing entry if present (to update timestamp)
        this.history = this.history.filter(historyItem => 
            !(historyItem.id === item.id && historyItem.type === item.type)
        );
        
        // Add to beginning of array (most recent first)
        this.history.unshift({
            ...item,
            viewed: new Date().toISOString()
        });
        
        // Keep only last 50 items
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }
        
        this.saveHistory();
        return true;
    }

    getHistory() {
        return this.history || [];
    }

    clearHistory() {
        if (!this.currentUser) return false;
        
        this.history = [];
        this.saveHistory();
        return true;
    }

    // User Preferences
    loadPreferences() {
        if (!this.currentUser) return {};
        
        const savedPreferences = localStorage.getItem(`cineverse_preferences_${this.currentUser.email}`);
        this.preferences = savedPreferences ? JSON.parse(savedPreferences) : {
            theme: 'dark',
            subtitlesEnabled: true,
            autoplayTrailers: true,
            favoriteGenres: []
        };
        return this.preferences;
    }

    savePreferences() {
        if (!this.currentUser) return false;
        
        localStorage.setItem(`cineverse_preferences_${this.currentUser.email}`, JSON.stringify(this.preferences));
        return true;
    }

    updatePreferences(newPreferences) {
        if (!this.currentUser) return false;
        
        this.preferences = { ...this.preferences, ...newPreferences };
        this.savePreferences();
        return true;
    }

    getPreferences() {
        return this.preferences || {};
    }

    showNotification(message, type = 'info') {
        const container = document.querySelector('.notification-container');
        const notification = document.createElement('div');
        
        // Add icon based on type
        let icon = '';
        switch (type) {
            case 'success':
                icon = '<i class="fas fa-check-circle"></i>';
                break;
            case 'error':
                icon = '<i class="fas fa-exclamation-circle"></i>';
                break;
            case 'warning':
                icon = '<i class="fas fa-exclamation-triangle"></i>';
                break;
            default:
                icon = '<i class="fas fa-info-circle"></i>';
        }

        notification.className = `notification ${type}`;
        notification.innerHTML = `${icon}${message}`;
        
        // Add to container
        container.appendChild(notification);

        // Remove after 8 seconds
        setTimeout(() => {
            notification.classList.add('slide-out');
            setTimeout(() => notification.remove(), 300);
        }, 8000);
    }

    // Helper method to show form errors
    showFormError(formGroup, message) {
        formGroup.classList.add('error');
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = message;
        formGroup.appendChild(errorMessage);
    }

    // Helper method to clear form errors
    clearFormErrors() {
        document.querySelectorAll('.form-group.error').forEach(group => {
            group.classList.remove('error');
            const errorMessage = group.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.remove();
            }
        });
    }

    // Add this new method
    requireAuth() {
        const isLoggedIn = this.isLoggedIn();
        if (!isLoggedIn) {
            // Store current page for redirect after login
            if (!window.location.pathname.includes('login.html')) {
                sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
            }
            
            // Force redirect to login page
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }
}

// Initialize auth
const auth = new Auth();

// Check for existing session
document.addEventListener('DOMContentLoaded', () => {
    auth.getCurrentUser();
}); 