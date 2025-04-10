// Initialize API
const api = new MovieAPI();

document.addEventListener('DOMContentLoaded', () => {
    // Initialize search functionality
    initializeSearch();
    // Initialize back to top button
    initializeBackToTop();
    // Initialize main page
    initializePage();
    // Initialize profile dropdown
    initializeProfileDropdown();
});

function initializeSearch() {
    const searchInput = document.querySelector('.nav-search input');
    const searchButton = document.querySelector('.nav-search button');

    // Handle search button click
    searchButton.addEventListener('click', () => {
        handleSearch(searchInput.value);
    });

    // Handle Enter key press
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch(searchInput.value);
        }
    });
}

async function handleSearch(query) {
    if (!query.trim()) {
        showError('Please enter a search term');
        return;
    }

    try {
        document.body.classList.add('loading');
        
        // Search both movies and TV shows
        const [movieResults, tvResults] = await Promise.all([
            api.searchMovies(query),
            api.searchTVShows(query)
        ]);

        // Combine and sort results by popularity
        const combinedResults = [
            ...movieResults.results.map(item => ({ ...item, media_type: 'movie' })),
            ...tvResults.results.map(item => ({ ...item, media_type: 'tv' }))
        ].sort((a, b) => b.popularity - a.popularity);

        if (combinedResults.length === 0) {
            showError('No results found');
            return;
        }

        // Display results in a modal
        displaySearchResults(combinedResults);
    } catch (error) {
        console.error('Search error:', error);
        showError('Failed to perform search. Please try again.');
    } finally {
        document.body.classList.remove('loading');
    }
}

function displaySearchResults(results) {
    const modal = document.createElement('div');
    modal.className = 'search-modal';
    modal.innerHTML = `
        <div class="search-modal-content">
            <div class="search-modal-header">
                <h2>Search Results</h2>
                <button class="close-modal"><i class="fas fa-times"></i></button>
            </div>
            <div class="search-results-grid">
                ${results.map(item => `
                    <div class="result-card" data-id="${item.id}" data-type="${item.media_type}">
                        <img src="${item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'assets/no-poster.jpg'}" 
                             alt="${item.title || item.name}">
                        <div class="result-type">${item.media_type === 'movie' ? 'Movie' : 'TV Show'}</div>
                        <div class="result-info">
                            <h3>${item.title || item.name}</h3>
                            <p>${item.release_date ? item.release_date.split('-')[0] : item.first_air_date ? item.first_air_date.split('-')[0] : 'N/A'}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Add click event listeners
    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
    });

    modal.querySelectorAll('.result-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            const type = card.dataset.type;
            const url = type === 'movie' ? `movie-details.html?id=${id}` : `tv-show-details.html?id=${id}`;
            window.location.href = url;
        });
    });
}

function initializeBackToTop() {
    const backToTopButton = document.getElementById('back-to-top');
    
    // Show button when scrolling down
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    });
    
    // Smooth scroll to top when clicked
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

function initializePage() {
    // Remove loading screen
    setTimeout(() => {
        document.querySelector('.loading-screen').style.display = 'none';
    }, 1500);

    // Load trending movies
    loadTrendingMovies();
    
    // Load new releases
    loadNewReleases();
    
    // Load top rated movies
    loadTopRatedMovies();
    
    // Setup event listeners
    setupEventListeners();
}

async function loadTrendingMovies() {
    try {
        const response = await api.getTrendingMovies();
        displayMovies(response.results, 'trending-movies');
    } catch (error) {
        console.error('Error loading trending movies:', error);
    }
}

async function loadNewReleases() {
    try {
        const response = await api.getNowPlayingMovies();
        displayMovies(response.results, 'new-releases');
    } catch (error) {
        console.error('Error loading new releases:', error);
    }
}

async function loadTopRatedMovies() {
    try {
        const response = await api.getTopRatedMovies();
        displayMovies(response.results, 'top-rated');
    } catch (error) {
        console.error('Error loading top rated movies:', error);
    }
}

function displayMovies(movies, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = movies.map(movie => createMovieCard(movie)).join('');
}

function createMovieCard(movie) {
    const posterPath = movie.poster_path 
        ? api.getImageUrl(movie.poster_path, 'w342') 
        : 'assets/no-poster.jpg';
    
    return `
        <div class="movie-card" data-id="${movie.id}">
            <img src="${posterPath}" alt="${movie.title}" onerror="this.src='assets/no-poster.jpg'">
            <div class="movie-info">
                <h3>${movie.title}</h3>
                <div class="movie-meta">
                    <span>${movie.release_date?.split('-')[0] || 'N/A'}</span>
                    <span class="movie-rating">
                        <i class="fas fa-star"></i>
                        ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
                    </span>
                </div>
            </div>
        </div>
    `;
}

function setupEventListeners() {
    // Movie card clicks
    document.querySelectorAll('.movie-card').forEach(card => {
        card.addEventListener('click', () => {
            const movieId = card.dataset.id;
            showMovieDetails(movieId);
        });
    });
    
    // Close modal
    document.querySelector('.close-modal')?.addEventListener('click', () => {
        document.getElementById('movie-modal').style.display = 'none';
    });
}

async function showMovieDetails(movieId) {
    try {
        const movie = await api.getMovieDetails(movieId);
        const modal = document.getElementById('movie-modal');
        const modalBody = modal.querySelector('.modal-body');
        
        modalBody.innerHTML = createMovieDetailsHTML(movie);
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading movie details:', error);
    }
}

function createMovieDetailsHTML(movie) {
    const posterPath = movie.poster_path 
        ? api.getImageUrl(movie.poster_path, 'w500') 
        : 'assets/no-poster.jpg';
    
    const backdropPath = movie.backdrop_path 
        ? api.getImageUrl(movie.backdrop_path, 'original') 
        : '';
    
    return `
        <div class="movie-details" style="background-image: url('${backdropPath}')">
            <div class="movie-details-content">
                <div class="movie-poster">
                    <img src="${posterPath}" alt="${movie.title}" onerror="this.src='assets/no-poster.jpg'">
                </div>
                <div class="movie-info-detailed">
                    <h2>${movie.title}</h2>
                    <div class="movie-meta-detailed">
                        <span>${movie.release_date?.split('-')[0] || 'N/A'}</span>
                        <span>${movie.runtime} min</span>
                        <span class="movie-rating">
                            <i class="fas fa-star"></i>
                            ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
                        </span>
                    </div>
                    <p class="movie-overview">${movie.overview || 'No overview available.'}</p>
                    <div class="movie-genres">
                        ${movie.genres?.map(genre => `<span class="genre-tag">${genre.name}</span>`).join('') || ''}
                    </div>
                    <button class="watch-button">Watch Now</button>
                </div>
            </div>
        </div>
    `;
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
        <button class="close-error">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(errorDiv);

    // Add click handler to close button
    errorDiv.querySelector('.close-error').addEventListener('click', () => {
        errorDiv.remove();
    });

    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

// Update the click event listener for movie cards
document.addEventListener('click', (e) => {
    const movieCard = e.target.closest('.movie-card');
    if (movieCard) {
        const movieId = movieCard.dataset.id;
        window.location.href = `movie-details.html?id=${movieId}`;
    }
});

function initializeProfileDropdown() {
    // Create and append dropdown menu
    const navProfile = document.querySelector('.nav-profile');
    const dropdownHTML = `
        <div class="profile-dropdown">
            <div class="profile-dropdown-header">
                <div class="dropdown-user-info">
                    <p class="dropdown-username">Guest</p>
                    <p class="dropdown-email">Not logged in</p>
                </div>
            </div>
            <div class="profile-dropdown-menu">
                <a href="profile.html" class="dropdown-item">
                    <i class="fas fa-user"></i> My Profile
                </a>
                <a href="profile.html#watchlist" class="dropdown-item">
                    <i class="fas fa-bookmark"></i> My Watchlist
                </a>
                <a href="profile.html#history" class="dropdown-item">
                    <i class="fas fa-history"></i> Viewing History
                </a>
                <a href="profile.html#preferences" class="dropdown-item">
                    <i class="fas fa-sliders-h"></i> Preferences
                </a>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item login-button">
                    <i class="fas fa-sign-in-alt"></i> Login / Register
                </button>
                <button class="dropdown-item logout-button" style="display: none;">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>
        </div>
    `;
    
    navProfile.insertAdjacentHTML('beforeend', dropdownHTML);
    
    // Toggle dropdown on click
    navProfile.addEventListener('click', (e) => {
        const dropdown = navProfile.querySelector('.profile-dropdown');
        dropdown.classList.toggle('active');
        
        // Stop propagation to prevent closing when clicking inside dropdown
        e.stopPropagation();
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        const dropdown = navProfile.querySelector('.profile-dropdown');
        if (dropdown.classList.contains('active')) {
            dropdown.classList.remove('active');
        }
    });
    
    // Handle auth buttons
    const loginButton = document.querySelector('.login-button');
    const logoutButton = document.querySelector('.logout-button');
    
    loginButton.addEventListener('click', () => {
        window.location.href = 'profile.html';
    });
    
    logoutButton.addEventListener('click', () => {
        if (typeof auth !== 'undefined') {
            auth.logout();
            updateProfileDropdown();
        }
    });
    
    // Initialize dropdown with user data if logged in
    updateProfileDropdown();
}

function updateProfileDropdown() {
    const navProfileImg = document.querySelector('.nav-profile img');
    const dropdownUsername = document.querySelector('.dropdown-username');
    const dropdownEmail = document.querySelector('.dropdown-email');
    const loginButton = document.querySelector('.login-button');
    const logoutButton = document.querySelector('.logout-button');
    
    if (typeof auth !== 'undefined' && auth.isLoggedIn()) {
        const user = auth.getCurrentUser();
        navProfileImg.src = user.avatar;
        dropdownUsername.textContent = user.username;
        dropdownEmail.textContent = user.email;
        loginButton.style.display = 'none';
        logoutButton.style.display = 'flex';
    } else {
        navProfileImg.src = 'assets/default-avatar.png';
        dropdownUsername.textContent = 'Guest';
        dropdownEmail.textContent = 'Not logged in';
        loginButton.style.display = 'flex';
        logoutButton.style.display = 'none';
    }
}

// Auto-hide navigation bar
let lastScrollTop = 0;
const nav = document.querySelector('.main-nav');
const scrollThreshold = 50; // Reduced threshold for faster response
const hideDelay = 500; // Reduced delay for quicker hiding

let hideTimeout;

function handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Clear any existing timeout
    clearTimeout(hideTimeout);
    
    // Show nav immediately when scrolling up or at the top
    if (scrollTop < lastScrollTop || scrollTop < scrollThreshold) {
        nav.classList.remove('nav-hidden');
    } else if (scrollTop > lastScrollTop) {
        // Set a timeout to hide the nav after scrolling stops
        hideTimeout = setTimeout(() => {
            if (scrollTop > scrollThreshold) {
                nav.classList.add('nav-hidden');
            }
        }, hideDelay);
    }
    
    lastScrollTop = scrollTop;
}

// Add scroll event listener with throttling
let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            handleScroll();
            ticking = false;
        });
        ticking = true;
    }
});

// Show nav when mouse is near the top of the page
document.addEventListener('mousemove', (e) => {
    if (e.clientY < 50) {
        nav.classList.remove('nav-hidden');
    }
}); 
