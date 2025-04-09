class Auth {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        this.watchlist = this.loadWatchlist();
        this.history = this.loadHistory();
        this.preferences = this.loadPreferences();
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

    isLoggedIn() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        if (!this.currentUser) {
            const savedUser = localStorage.getItem('cineverse_current_user');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
                this.initUserData();
            }
        }
        return this.currentUser;
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
}

// Create global auth instance
const auth = new Auth();

// Check for existing session
document.addEventListener('DOMContentLoaded', () => {
    auth.getCurrentUser();
}); 