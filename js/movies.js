let currentPage = 1;
let currentFilters = {
    sort_by: 'popularity.desc',
    with_genres: [],
    year: ''
};

document.addEventListener('DOMContentLoaded', () => {
    initializeMoviesPage();
});

async function initializeMoviesPage() {
    try {
        // Load genres and populate filter
        const genres = await movieAPI.getMovieGenres();
        populateGenreFilters(genres.genres);

        // Populate year filter
        populateYearFilter();

        // Load initial movies
        await loadMovies();

        // Setup event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing movies page:', error);
        showError('Failed to initialize page. Please try again later.');
    }
}

function populateGenreFilters(genres) {
    const genreFilters = document.getElementById('genre-filters');
    genreFilters.innerHTML = genres.map(genre => `
        <label class="genre-checkbox">
            <input type="checkbox" value="${genre.id}">
            ${genre.name}
        </label>
    `).join('');
}

function populateYearFilter() {
    const yearSelect = document.getElementById('year-select');
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 50 }, (_, i) => currentYear - i);
    
    yearSelect.innerHTML += years.map(year => `
        <option value="${year}">${year}</option>
    `).join('');
}

function setupEventListeners() {
    // Sort select
    document.getElementById('sort-select').addEventListener('change', (e) => {
        currentFilters.sort_by = e.target.value;
    });

    // Year select
    document.getElementById('year-select').addEventListener('change', (e) => {
        currentFilters.year = e.target.value;
    });

    // Genre checkboxes
    document.querySelectorAll('.genre-checkbox input').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const selectedGenres = [...document.querySelectorAll('.genre-checkbox input:checked')]
                .map(input => input.value);
            currentFilters.with_genres = selectedGenres;
        });
    });

    // Apply filters button
    document.querySelector('.apply-filters-btn').addEventListener('click', () => {
        currentPage = 1;
        loadMovies();
    });

    // Movie card clicks
    document.getElementById('movies-grid').addEventListener('click', (e) => {
        const movieCard = e.target.closest('.movie-card');
        if (movieCard) {
            const movieId = movieCard.dataset.id;
            window.location.href = `movie-details.html?id=${movieId}`;
        }
    });

    // Pagination
    document.querySelector('.prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadMovies();
        }
    });

    document.querySelector('.next-page').addEventListener('click', () => {
        currentPage++;
        loadMovies();
    });

    // Search functionality
    const searchInput = document.querySelector('.nav-search input');
    const searchButton = document.querySelector('.nav-search button');

    searchButton.addEventListener('click', () => handleSearch(searchInput.value));
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch(searchInput.value);
        }
    });
}

async function loadMovies() {
    try {
        // Show loading state
        document.getElementById('movies-grid').innerHTML = '<div class="loading">Loading...</div>';

        // Prepare query parameters
        const params = {
            sort_by: currentFilters.sort_by,
            page: currentPage
        };

        if (currentFilters.with_genres.length > 0) {
            params.with_genres = currentFilters.with_genres.join(',');
        }

        if (currentFilters.year) {
            params.primary_release_year = currentFilters.year;
        }

        // Fetch movies
        const data = await movieAPI.discoverMovies(params);

        // Update movies grid
        const moviesGrid = document.getElementById('movies-grid');
        moviesGrid.innerHTML = data.results
            .map(movie => createMovieCard(movie))
            .join('');

        // Update pagination
        updatePagination(data.page, data.total_pages);
    } catch (error) {
        console.error('Error loading movies:', error);
        showError('Failed to load movies. Please try again.');
    }
}

function updatePagination(currentPage, totalPages) {
    document.querySelector('.current-page').textContent = `Page ${currentPage}`;
    document.querySelector('.prev-page').disabled = currentPage === 1;
    document.querySelector('.next-page').disabled = currentPage === totalPages;
}

async function handleSearch(query) {
    if (!query.trim()) return;

    try {
        currentPage = 1;
        const data = await movieAPI.searchMovies(query);
        
        const moviesGrid = document.getElementById('movies-grid');
        moviesGrid.innerHTML = data.results
            .map(movie => createMovieCard(movie))
            .join('');

        updatePagination(data.page, data.total_pages);
    } catch (error) {
        console.error('Error searching movies:', error);
        showError('Failed to search movies. Please try again.');
    }
}

function createMovieCard(movie) {
    const imageUrl = movie.poster_path
        ? movieAPI.getImageUrl(movie.poster_path)
        : 'assets/placeholder.jpg';

    const title = movie.title || movie.name || 'Title Not Available';
    const releaseDate = movie.release_date || movie.first_air_date || 'Release Date N/A';
    const rating = movie.vote_average ? `${movie.vote_average.toFixed(1)}` : 'N/A';

    return `
        <div class="movie-card" data-id="${movie.id}">
            <img src="${imageUrl}" alt="${title}">
            <div class="movie-info">
                <h3>${title}</h3>
                <p>${releaseDate.split('-')[0]}</p>
                <div class="rating">
                    <i class="fas fa-star"></i>
                    <span>${rating}</span>
                </div>
            </div>
        </div>
    `;
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
} 