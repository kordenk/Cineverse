// Initialize API
const api = new MovieAPI();

let currentPage = 1;
let currentFilters = {
    sort_by: 'popularity.desc',
    with_genres: [],
    first_air_date_year: '',
    with_networks: [],
    with_status: ''
};

document.addEventListener('DOMContentLoaded', () => {
    initializeTVShowsPage();
    initializeBackToTop();
    setupEventListeners();
});

async function initializeTVShowsPage() {
    try {
        document.body.classList.add('loading');
        
        // Load each component independently and catch their errors separately
        const initPromises = [
            loadFeaturedShows().catch(err => console.warn('Featured shows not available:', err)),
            populateGenreFilters().catch(err => console.warn('Genre filters not available:', err)),
            populateYearFilter().catch(err => console.warn('Year filter not available:', err)),
            populateNetworkFilters().catch(err => console.warn('Network filters not available:', err)),
            populateStatusFilter().catch(err => console.warn('Status filter not available:', err)),
            loadTVShows().catch(err => console.warn('Initial TV shows not available:', err))
        ];

        await Promise.allSettled(initPromises);
        
        // Only show error if no TV shows could be loaded at all
        const showsGrid = document.querySelector('.shows-grid');
        if (showsGrid && showsGrid.children.length === 0) {
            showError('Unable to load TV shows. Please try refreshing the page.');
        }
    } catch (error) {
        console.error('Critical error initializing TV Shows page:', error);
    } finally {
        document.body.classList.remove('loading');
    }
}

async function loadFeaturedShows() {
    const featuredGrid = document.querySelector('.featured-grid');
    try {
        featuredGrid.innerHTML = '<div class="loading-spinner">Loading featured shows...</div>';
        
        const response = await api.getPopularTVShows(1);
        
        if (!response.results || response.results.length === 0) {
            featuredGrid.innerHTML = '<div class="no-results">No featured shows available</div>';
            return;
        }

        const featuredShows = response.results.slice(0, 3);
        featuredGrid.innerHTML = featuredShows.map(show => createFeaturedShowCard(show)).join('');

        // Add click event listeners to featured shows
        featuredGrid.querySelectorAll('.featured-show-card').forEach(card => {
            card.addEventListener('click', () => {
                const showId = card.dataset.id;
                window.location.href = `tv-show-details.html?id=${showId}`;
            });
        });
    } catch (error) {
        console.error('Error loading featured shows:', error);
        featuredGrid.innerHTML = `
            <div class="error-state">
                <p>Unable to load featured shows</p>
                <button onclick="loadFeaturedShows()" class="retry-btn">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

function createFeaturedShowCard(show) {
    const backdropPath = show.backdrop_path 
        ? api.getImageUrl(show.backdrop_path, 'original') 
        : 'assets/placeholder.jpg';

    return `
        <div class="featured-show-card" data-id="${show.id}">
            <img src="${backdropPath}" alt="${show.name}" onerror="this.src='assets/placeholder.jpg'">
            <div class="featured-show-info">
                <h3>${show.name}</h3>
                <div class="featured-show-meta">
                    ${show.first_air_date ? `<span>${show.first_air_date.split('-')[0]}</span>` : ''}
                    ${show.vote_average ? `<span>${show.vote_average.toFixed(1)} ★</span>` : ''}
                </div>
                ${show.overview ? `<p class="featured-show-overview">${show.overview}</p>` : ''}
            </div>
        </div>
    `;
}

// Helper function to get genre name from ID
function getGenreName(genreId) {
    const genreMap = {
        10759: "Action & Adventure",
        16: "Animation",
        35: "Comedy",
        80: "Crime",
        99: "Documentary",
        18: "Drama",
        10751: "Family",
        10762: "Kids",
        9648: "Mystery",
        10763: "News",
        10764: "Reality",
        10765: "Sci-Fi & Fantasy",
        10766: "Soap",
        10767: "Talk",
        10768: "War & Politics",
        37: "Western"
    };
    return genreMap[genreId] || "Other";
}

async function populateGenreFilters() {
    try {
        const response = await api.getTVGenres();
        
        if (!response.genres || response.genres.length === 0) {
            throw new Error('No genres available');
        }

        const genreContainer = document.querySelector('.genre-section .genre-filters');
        if (!genreContainer) {
            console.error('Genre container not found');
            return;
        }

        genreContainer.innerHTML = response.genres.map(genre => `
            <label class="genre-checkbox">
                <input type="checkbox" value="${genre.id}" name="genre">
                <span class="checkmark"></span>
                ${genre.name}
            </label>
        `).join('');
    } catch (error) {
        console.error('Error loading genres:', error);
        showError('Failed to load genre filters.');
    }
}

async function populateNetworkFilters() {
    try {
        const response = await api.getTVNetworks();
        
        if (!response.networks || response.networks.length === 0) {
            throw new Error('No networks available');
        }

        const networkSelect = document.querySelector('#network-select');
        networkSelect.innerHTML = `
            <option value="">All Networks</option>
            ${response.networks.map(network => `
                <option value="${network.id}">${network.name}</option>
            `).join('')}
        `;
    } catch (error) {
        console.error('Error loading networks:', error);
        throw new Error('Failed to load network filters.');
    }
}

function populateYearFilter() {
    const yearSelect = document.querySelector('#year-select');
    const currentYear = new Date().getFullYear();
    
    yearSelect.innerHTML = `
        <option value="">All Years</option>
        ${Array.from({ length: 50 }, (_, i) => currentYear - i).map(year => `
            <option value="${year}">${year}</option>
        `).join('')}
    `;
}

function populateStatusFilter() {
    const statusSelect = document.querySelector('#status-select');
    const statuses = [
        { value: '', label: 'All Statuses' },
        { value: '0', label: 'Returning Series' },
        { value: '1', label: 'Planned' },
        { value: '2', label: 'In Production' },
        { value: '3', label: 'Ended' },
        { value: '4', label: 'Cancelled' },
        { value: '5', label: 'Pilot' }
    ];
    
    statusSelect.innerHTML = statuses.map(status => `
        <option value="${status.value}">${status.label}</option>
    `).join('');
}

function setupEventListeners() {
    // Sort change
    document.getElementById('sort-select').addEventListener('change', (e) => {
        currentFilters.sort_by = e.target.value;
        currentPage = 1;
        loadTVShows();
    });

    // Genre changes
    document.querySelector('.genre-filters').addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            const genreId = e.target.value;
            if (e.target.checked) {
                currentFilters.with_genres.push(genreId);
            } else {
                currentFilters.with_genres = currentFilters.with_genres.filter(id => id !== genreId);
            }
            currentPage = 1;
            loadTVShows();
        }
    });

    // Status change
    document.getElementById('status-select').addEventListener('change', (e) => {
        currentFilters.with_status = e.target.value;
        currentPage = 1;
        loadTVShows();
    });

    // Network change
    document.getElementById('network-select').addEventListener('change', (e) => {
        currentFilters.with_networks = e.target.value ? [e.target.value] : [];
        currentPage = 1;
        loadTVShows();
    });

    // Year change
    document.getElementById('year-select').addEventListener('change', (e) => {
        currentFilters.first_air_date_year = e.target.value;
        currentPage = 1;
        loadTVShows();
    });

    // Search functionality
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    const handleSearch = async () => {
        const query = searchInput.value.trim();
        if (query) {
            try {
                document.body.classList.add('loading');
                const response = await api.searchTVShows(query);
                updateShowsGrid(response.results);
                document.body.classList.remove('loading');
            } catch (error) {
                console.error('Error searching shows:', error);
                showError('Failed to search TV shows.');
                document.body.classList.remove('loading');
            }
        } else {
            loadTVShows();
        }
    };

    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Pagination
    document.querySelector('.prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadTVShows();
        }
    });

    document.querySelector('.next-page').addEventListener('click', () => {
        currentPage++;
        loadTVShows();
    });
}

async function loadTVShows() {
    try {
        document.body.classList.add('loading');
        const showsGrid = document.querySelector('.shows-grid');
        showsGrid.innerHTML = '<div class="loading-spinner">Loading shows...</div>';

        const params = {
            ...currentFilters,
            page: currentPage,
            language: 'en-US',
            include_adult: false,
            include_null_first_air_dates: false,
            sort_by: currentFilters.sort_by || 'popularity.desc',
            with_original_language: 'en'
        };

        if (currentFilters.with_genres.length) {
            params.with_genres = currentFilters.with_genres.join(',');
        }

        const response = await api.discoverTVShows(params);
        
        if (!response.results || response.results.length === 0) {
            showsGrid.innerHTML = '<div class="no-results">No TV shows found.</div>';
            return;
        }

        // Filter out shows without necessary data
        const validShows = response.results.filter(show => 
            show.name && 
            show.poster_path &&
            show.first_air_date
        );

        updateShowsGrid(validShows);
        updatePagination(response.page, response.total_pages);
    } catch (error) {
        console.error('Error loading TV shows:', error);
        const showsGrid = document.querySelector('.shows-grid');
        showsGrid.innerHTML = `
            <div class="error-state">
                <p>Unable to load TV shows. Please try again.</p>
                <button class="retry-btn" onclick="loadTVShows()">Retry</button>
            </div>
        `;
    } finally {
        document.body.classList.remove('loading');
    }
}

function resetFilters() {
    // Reset all filters to default values
    currentFilters = {
        sort_by: 'popularity.desc',
        with_genres: [],
        first_air_date_year: '',
        with_networks: [],
        with_status: ''
    };
    currentPage = 1;

    // Reset UI elements
    document.getElementById('sort-select').value = 'popularity.desc';
    document.getElementById('year-select').value = '';
    document.getElementById('network-select').value = '';
    document.getElementById('status-select').value = '';
    document.querySelectorAll('.genre-filters input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });

    // Reload shows with reset filters
    loadTVShows();
}

function createShowCard(show) {
    const posterPath = show.poster_path 
        ? api.getImageUrl(show.poster_path, 'w342') 
        : 'assets/placeholder.jpg';

    const year = show.first_air_date ? show.first_air_date.split('-')[0] : '';
    const rating = show.vote_average ? show.vote_average.toFixed(1) : '';

    return `
        <a href="tv-show-details.html?id=${show.id}" class="show-card-link">
            <div class="show-card" data-id="${show.id}">
                <img src="${posterPath}" alt="${show.name}" loading="lazy">
                <div class="show-info">
                    <h3>${show.name}</h3>
                    <div class="show-meta">
                        ${year ? `<span class="year">${year}</span>` : ''}
                        ${rating ? `<span class="rating">${rating} ★</span>` : ''}
                    </div>
                </div>
            </div>
        </a>
    `;
}

function updateShowsGrid(shows) {
    const showsGrid = document.querySelector('.shows-grid');
    if (!showsGrid) return;

    const showCards = shows.map(show => createShowCard(show)).join('');
    showsGrid.innerHTML = showCards;

    // Add lazy loading for images
    showsGrid.querySelectorAll('img').forEach(img => {
        img.loading = 'lazy';
    });
}

function updatePagination(currentPage, totalPages) {
    const prevButton = document.querySelector('.prev-page');
    const nextButton = document.querySelector('.next-page');
    const pageInfo = document.querySelector('.current-page');

    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
}

function showError(message) {
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

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

    const closeButton = errorDiv.querySelector('.close-error');
    closeButton.addEventListener('click', () => errorDiv.remove());

    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

function initializeBackToTop() {
    const backToTopButton = document.getElementById('back-to-top');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    });
    
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
} 