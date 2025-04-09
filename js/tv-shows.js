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
    // Initialize the page
    initializeTVShowsPage();
    // Initialize back to top button
    initializeBackToTop();
});

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

async function initializeTVShowsPage() {
    try {
        document.body.classList.add('loading');
        await Promise.all([
            loadFeaturedShows(),
            populateGenreFilters(),
            populateYearFilter(),
            populateNetworkFilters(),
            populateStatusFilter(),
            loadTVShows()
        ]);
        setupEventListeners();
        document.body.classList.remove('loading');
    } catch (error) {
        console.error('Error initializing TV Shows page:', error);
        showError('Failed to initialize the TV Shows page. Please try again.');
        document.body.classList.remove('loading');
    }
}

async function loadFeaturedShows() {
    try {
        const response = await api.discoverTVShows({ 
            sort_by: 'popularity.desc', 
            page: 1,
            'vote_count.gte': 100 // Ensure we get shows with significant votes
        });
        
        if (!response.results || response.results.length === 0) {
            throw new Error('No featured shows available');
        }

        const featuredShows = response.results.slice(0, 3);
        const featuredGrid = document.querySelector('.featured-grid');
        
        featuredGrid.innerHTML = featuredShows.map(show => createFeaturedShowCard(show)).join('');
    } catch (error) {
        console.error('Error loading featured shows:', error);
        throw new Error('Failed to load featured shows.');
    }
}

function createFeaturedShowCard(show) {
    const backdropPath = show.backdrop_path ? api.getImageUrl(show.backdrop_path, 'original') : 'images/no-image.png';
    return `
        <div class="featured-show-card" data-id="${show.id}">
            <img src="${backdropPath}" alt="${show.name}">
            <div class="featured-show-info">
                <h3>${show.name}</h3>
                <div class="featured-show-meta">
                    <span>${show.first_air_date?.split('-')[0] || 'N/A'}</span>
                    <span>${show.vote_average ? show.vote_average.toFixed(1) : 'N/A'} ★</span>
                </div>
                <p class="featured-show-overview">${show.overview || 'No overview available.'}</p>
            </div>
        </div>
    `;
}

async function populateGenreFilters() {
    try {
        const response = await api.getTVGenres();
        
        if (!response.genres || response.genres.length === 0) {
            throw new Error('No genres available');
        }

        const genreContainer = document.querySelector('.genre-filters');
        genreContainer.innerHTML = response.genres.map(genre => `
            <label class="genre-checkbox">
                <input type="checkbox" value="${genre.id}">
                <span class="checkmark"></span>
                ${genre.name}
            </label>
        `).join('');
    } catch (error) {
        console.error('Error loading genres:', error);
        throw new Error('Failed to load genre filters.');
    }
}

async function populateNetworkFilters() {
    try {
        const response = await api.getTVNetworks();
        
        if (!response.results || response.results.length === 0) {
            throw new Error('No networks available');
        }

        const networkSelect = document.querySelector('#network-select');
        networkSelect.innerHTML = `
            <option value="">All Networks</option>
            ${response.results.map(network => `
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
    document.querySelector('#sort-select').addEventListener('change', (e) => {
        currentFilters.sort_by = e.target.value;
        currentPage = 1;
        loadTVShows();
    });

    // Genre checkboxes
    document.querySelectorAll('.genre-checkbox input').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const checkedGenres = Array.from(document.querySelectorAll('.genre-checkbox input:checked'))
                .map(input => input.value);
            currentFilters.with_genres = checkedGenres;
            currentPage = 1;
            loadTVShows();
        });
    });

    // Year change
    document.querySelector('#year-select').addEventListener('change', (e) => {
        currentFilters.first_air_date_year = e.target.value;
        currentPage = 1;
        loadTVShows();
    });

    // Network change
    document.querySelector('#network-select').addEventListener('change', (e) => {
        currentFilters.with_networks = e.target.value ? [e.target.value] : [];
        currentPage = 1;
        loadTVShows();
    });

    // Status change
    document.querySelector('#status-select').addEventListener('change', (e) => {
        currentFilters.with_status = e.target.value;
        currentPage = 1;
        loadTVShows();
    });

    // Search input
    const searchInput = document.querySelector('.nav-search input');
    const searchButton = document.querySelector('.nav-search button');

    searchButton.addEventListener('click', () => {
        handleSearch(searchInput.value);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch(searchInput.value);
        }
    });

    // Pagination
    document.querySelector('.pagination').addEventListener('click', (e) => {
        if (e.target.closest('.prev-page') && currentPage > 1) {
            currentPage--;
            loadTVShows();
        } else if (e.target.closest('.next-page')) {
            currentPage++;
            loadTVShows();
        }
    });

    // Featured show clicks
    document.querySelector('.featured-grid').addEventListener('click', (e) => {
        const featuredCard = e.target.closest('.featured-show-card');
        if (featuredCard) {
            const showId = featuredCard.dataset.id;
            window.location.href = `tv-show-details.html?id=${showId}`;
        }
    });

    // Regular show card clicks
    document.querySelector('.shows-grid').addEventListener('click', (e) => {
        const showCard = e.target.closest('.show-card');
        if (showCard) {
            const showId = showCard.dataset.id;
            window.location.href = `tv-show-details.html?id=${showId}`;
        }
    });
}

async function loadTVShows() {
    try {
        document.body.classList.add('loading');
        const params = { ...currentFilters, page: currentPage };
        const response = await api.discoverTVShows(params);
        
        if (!response.results || response.results.length === 0) {
            throw new Error('No TV shows available');
        }

        updateShowsGrid(response.results);
        updatePagination(response.page, response.total_pages);
        document.body.classList.remove('loading');
    } catch (error) {
        console.error('Error loading TV shows:', error);
        showError('Failed to load TV shows. Please try again.');
        document.body.classList.remove('loading');
    }
}

function updateShowsGrid(shows) {
    const showsGrid = document.querySelector('.shows-grid');
    
    if (!shows || shows.length === 0) {
        showsGrid.innerHTML = '<p class="no-data">No TV shows found matching your criteria</p>';
        return;
    }

    showsGrid.innerHTML = shows.map(show => createShowCard(show)).join('');
}

function createShowCard(show) {
    const posterPath = show.poster_path ? api.getImageUrl(show.poster_path, 'w342') : 'images/no-image.png';
    return `
        <div class="show-card" data-id="${show.id}">
            <img src="${posterPath}" alt="${show.name}">
            ${show.status ? `<span class="show-status">${show.status}</span>` : ''}
            <div class="show-info">
                <h3>${show.name}</h3>
                <div class="show-meta">
                    <span>${show.first_air_date?.split('-')[0] || 'N/A'}</span>
                    <span class="show-rating">
                        <i class="fas fa-star"></i>
                        ${show.vote_average ? show.vote_average.toFixed(1) : 'N/A'}
                    </span>
                </div>
            </div>
        </div>
    `;
}

function updatePagination(currentPage, totalPages) {
    const prevButton = document.querySelector('.prev-page');
    const nextButton = document.querySelector('.next-page');
    const currentPageSpan = document.querySelector('.current-page');

    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;
    currentPageSpan.textContent = `Page ${currentPage} of ${totalPages}`;
}

async function handleSearch(query) {
    if (!query.trim()) {
        currentFilters = {
            sort_by: 'popularity.desc',
            with_genres: [],
            first_air_date_year: '',
            with_networks: [],
            with_status: ''
        };
        currentPage = 1;
        loadTVShows();
        return;
    }

    try {
        const response = await api.searchTVShows(query, 1);
        
        if (!response.results || response.results.length === 0) {
            throw new Error('No TV shows found matching your search');
        }

        updateShowsGrid(response.results);
        updatePagination(response.page, response.total_pages);
    } catch (error) {
        console.error('Error searching TV shows:', error);
        showError('Failed to search TV shows. Please try again.');
    }
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