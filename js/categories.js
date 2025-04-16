// Initialize API
const api = new MovieAPI();

let currentCategory = 'movie';
let currentGenres = {};
let currentPage = {
    movie: {},
    tv: {}
};

document.addEventListener('DOMContentLoaded', () => {
    initializeCategoriesPage();
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

async function initializeCategoriesPage() {
    try {
        document.body.classList.add('loading');
        await Promise.all([
            loadMovieGenres(),
            loadTVGenres()
        ]);
        setupEventListeners();
        document.body.classList.remove('loading');
    } catch (error) {
        console.error('Error initializing Categories page:', error);
        showError('Failed to initialize the Categories page. Please try again.');
        document.body.classList.remove('loading');
    }
}

async function loadMovieGenres() {
    try {
        const response = await api.getMovieGenres();
        if (!response.genres || response.genres.length === 0) {
            throw new Error('No movie genres available');
        }
        currentGenres.movie = response.genres;
        await loadGenreContent('movie');
    } catch (error) {
        console.error('Error loading movie genres:', error);
        throw new Error('Failed to load movie genres.');
    }
}

async function loadTVGenres() {
    try {
        const response = await api.getTVGenres();
        if (!response.genres || response.genres.length === 0) {
            throw new Error('No TV genres available');
        }
        currentGenres.tv = response.genres;
        await loadGenreContent('tv');
    } catch (error) {
        console.error('Error loading TV genres:', error);
        throw new Error('Failed to load TV genres.');
    }
}

function setupEventListeners() {
    // Category toggle
    document.querySelectorAll('.category-toggle button').forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            if (category !== currentCategory) {
                currentCategory = category;
                updateActiveCategory();
                loadGenreContent(category);
            }
        });
    });

    // Genre card clicks
    document.querySelector('.genres-grid').addEventListener('click', async (e) => {
        const genreCard = e.target.closest('.genre-card');
        if (genreCard) {
            const genreId = genreCard.dataset.id;
            const genreName = genreCard.dataset.name;
            await loadGenreItems(genreId, genreName);
        }
    });

    // Back button
    document.querySelector('.back-button')?.addEventListener('click', () => {
        showGenresGrid();
    });

    // Pagination
    document.querySelector('.pagination')?.addEventListener('click', (e) => {
        const genreId = document.querySelector('.genre-items').dataset.currentGenre;
        if (!genreId) return;

        if (e.target.classList.contains('prev-page') && getCurrentPage() > 1) {
            setCurrentPage(getCurrentPage() - 1);
            loadGenreItems(genreId);
        } else if (e.target.classList.contains('next-page')) {
            setCurrentPage(getCurrentPage() + 1);
            loadGenreItems(genreId);
        }
    });

    // Item card clicks
    document.querySelector('.items-grid').addEventListener('click', (e) => {
        const itemCard = e.target.closest('.item-card');
        if (itemCard) {
            const itemId = itemCard.dataset.id;
            navigateToDetails(itemId);
        }
    });

    // Search
    const searchInput = document.querySelector('#search-input');
    const searchButton = document.querySelector('#search-button');

    searchButton?.addEventListener('click', () => {
        handleSearch(searchInput.value);
    });

    searchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch(searchInput.value);
        }
    });
}

function updateActiveCategory() {
    document.querySelectorAll('.category-toggle button').forEach(button => {
        if (button.dataset.category === currentCategory) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

async function loadGenreContent(category) {
    const genres = currentGenres[category] || [];
    const genresGrid = document.querySelector('.genres-grid');
    
    genresGrid.innerHTML = genres.map(genre => createGenreCard(genre)).join('');
    showGenresGrid();
}

function createGenreCard(genre) {
    const gradientColors = [
        ['#FF6B6B', '#4ECDC4'],
        ['#A8E6CF', '#FFD3B6'],
        ['#FF9A9E', '#FAD0C4'],
        ['#667EEA', '#764BA2'],
        ['#6B8DD6', '#8E37D7'],
        ['#4FACFE', '#00F2FE'],
        ['#43E97B', '#38F9D7'],
        ['#FA709A', '#FEE140'],
    ];
    
    const colorPair = gradientColors[Math.floor(Math.random() * gradientColors.length)];
    
    return `
        <div class="genre-card" data-id="${genre.id}" data-name="${genre.name}">
            <div class="genre-card-content" style="background: linear-gradient(135deg, ${colorPair[0]}, ${colorPair[1]})">
                <h3>${genre.name}</h3>
                <div class="genre-card-overlay">
                    <span>View All</span>
                </div>
            </div>
        </div>
    `;
}

async function loadGenreItems(genreId, genreName = '') {
    let retryCount = 0;
    const maxRetries = 3;
    
    async function attemptLoad() {
        try {
            document.body.classList.add('loading');
            const params = {
                with_genres: genreId,
                page: getCurrentPage(),
                sort_by: 'popularity.desc'
            };

            const response = currentCategory === 'movie' 
                ? await api.discoverMovies(params)
                : await api.discoverTVShows(params);

            if (!response.results || response.results.length === 0) {
                throw new Error(`No ${currentCategory}s found for this genre`);
            }

            updateGenreItemsGrid(response.results, genreId, genreName);
            updatePagination(response.page, response.total_pages);
            showGenreItems();
            document.body.classList.remove('loading');
        } catch (error) {
            console.error(`Error loading ${currentCategory} genre items:`, error);
            
            if (retryCount < maxRetries) {
                retryCount++;
                console.log(`Retrying... Attempt ${retryCount} of ${maxRetries}`);
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
                return attemptLoad();
            }
            
            showError(`Unable to load ${currentCategory}s for this genre. Please try again later.`);
            document.body.classList.remove('loading');
            showGenresGrid(); // Return to genres grid on final failure
        }
    }

    await attemptLoad();
}

function updateGenreItemsGrid(items, genreId, genreName) {
    const genreItems = document.querySelector('.genre-items');
    genreItems.dataset.currentGenre = genreId;
    
    const genreTitle = document.querySelector('.genre-title');
    if (genreTitle) {
        genreTitle.textContent = genreName;
    }

    const itemsGrid = document.querySelector('.items-grid');
    itemsGrid.innerHTML = items.map(item => createItemCard(item)).join('');
}

function createItemCard(item) {
    const posterPath = item.poster_path 
        ? api.getImageUrl(item.poster_path, 'w342') 
        : 'images/no-image.png';
    
    const title = currentCategory === 'movie' ? item.title : item.name;
    const releaseDate = currentCategory === 'movie' 
        ? item.release_date 
        : item.first_air_date;

    return `
        <div class="item-card" data-id="${item.id}">
            <img src="${posterPath}" alt="${title}" onerror="this.src='images/no-image.png'">
            <div class="item-info">
                <h3>${title}</h3>
                <div class="item-meta">
                    <span>${releaseDate?.split('-')[0] || 'N/A'}</span>
                    <span class="item-rating">
                        <i class="fas fa-star"></i>
                        ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}
                    </span>
                </div>
            </div>
        </div>
    `;
}

function updatePagination(currentPage, totalPages) {
    const pagination = document.querySelector('.pagination');
    const prevButton = pagination.querySelector('.prev-page');
    const nextButton = pagination.querySelector('.next-page');
    const pageInfo = pagination.querySelector('.page-info');
    
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
}

function showGenresGrid() {
    document.querySelector('.genres-grid').style.display = 'grid';
    document.querySelector('.genre-items').style.display = 'none';
    document.querySelector('.back-button')?.classList.remove('hidden');
}

function showGenreItems() {
    document.querySelector('.genres-grid').style.display = 'none';
    document.querySelector('.genre-items').style.display = 'block';
    document.querySelector('.back-button')?.classList.remove('hidden');
}

function getCurrentPage() {
    const genreId = document.querySelector('.genre-items').dataset.currentGenre;
    return currentPage[currentCategory][genreId] || 1;
}

function setCurrentPage(page) {
    const genreId = document.querySelector('.genre-items').dataset.currentGenre;
    currentPage[currentCategory][genreId] = page;
}

function navigateToDetails(itemId) {
    const detailsPage = currentCategory === 'movie' ? 'movie-details.html' : 'tv-details.html';
    window.location.href = `${detailsPage}?id=${itemId}`;
}

async function handleSearch(query) {
    if (!query.trim()) return;

    try {
        document.body.classList.add('loading');
        const page = 1;
        const response = currentCategory === 'movie'
            ? await api.searchMovies(query, page)
            : await api.searchTVShows(query, page);

        if (!response.results || response.results.length === 0) {
            throw new Error(`No ${currentCategory}s found matching your search`);
        }

        updateGenreItemsGrid(response.results, 'search', `Search Results: "${query}"`);
        updatePagination(response.page, response.total_pages);
        showGenreItems();
        document.body.classList.remove('loading');
    } catch (error) {
        console.error('Error searching:', error);
        showError(`Failed to search ${currentCategory}s. Please try again.`);
        document.body.classList.remove('loading');
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