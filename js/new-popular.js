// Initialize API
// const api = new MovieAPI();
let currentPage = 1;
let currentSection = 'trending';

document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    setupEventListeners();
    initializeBackToTop();
});

async function initializePage() {
    try {
        document.body.classList.add('loading');
        await loadContent('trending');
        document.body.classList.remove('loading');
    } catch (error) {
        console.error('Error initializing page:', error);
        showError('Failed to initialize page. Please try again.');
        document.body.classList.remove('loading');
    }
}

function setupEventListeners() {
    // Tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const section = button.dataset.section;
            if (section !== currentSection) {
                currentPage = 1;
                currentSection = section;
                
                // Update active tab
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Load new content
                loadContent(section);
            }
        });
    });

    // Pagination
    document.querySelector('.pagination').addEventListener('click', (e) => {
        if (e.target.classList.contains('prev-page') && currentPage > 1) {
            currentPage--;
            loadContent(currentSection);
        } else if (e.target.classList.contains('next-page')) {
            currentPage++;
            loadContent(currentSection);
        }
    });
}

async function loadContent(section) {
    try {
        document.body.classList.add('loading');
        let data;

        switch (section) {
            case 'trending':
                data = await api.fetchData('/trending/all/week');
                break;
            case 'upcoming':
                data = await api.getUpcomingMovies(currentPage);
                break;
            case 'new-releases':
                const [movies, tvShows] = await Promise.all([
                    api.getNowPlayingMovies(currentPage),
                    api.fetchData('/tv/on_the_air', { page: currentPage })
                ]);
                data = {
                    results: [...movies.results, ...tvShows.results].sort((a, b) => {
                        const dateA = new Date(a.release_date || a.first_air_date);
                        const dateB = new Date(b.release_date || b.first_air_date);
                        return dateB - dateA;
                    }),
                    page: currentPage,
                    total_pages: Math.max(movies.total_pages, tvShows.total_pages)
                };
                break;
            case 'top-rated':
                const [topMovies, topTVShows] = await Promise.all([
                    api.getTopRatedMovies(currentPage),
                    api.fetchData('/tv/top_rated', { page: currentPage })
                ]);
                data = {
                    results: [...topMovies.results, ...topTVShows.results].sort((a, b) => 
                        b.vote_average - a.vote_average
                    ),
                    page: currentPage,
                    total_pages: Math.max(topMovies.total_pages, topTVShows.total_pages)
                };
                break;
            default:
                throw new Error('Invalid section');
        }

        updateContentGrid(data.results);
        updatePagination(data.page, data.total_pages);
        document.body.classList.remove('loading');
    } catch (error) {
        console.error('Error loading content:', error);
        showError('Failed to load content. Please try again.');
        document.body.classList.remove('loading');
    }
}

function updateContentGrid(items) {
    const contentGrid = document.getElementById('content-grid');
    
    if (!items || items.length === 0) {
        contentGrid.innerHTML = '<p class="no-data">No content available</p>';
        return;
    }

    contentGrid.innerHTML = items.map(item => {
        const posterPath = item.poster_path 
            ? api.getImageUrl(item.poster_path, 'w342')
            : 'assets/placeholder.jpg';
        
        const title = item.title || item.name;
        const releaseDate = item.release_date || item.first_air_date;
        const year = releaseDate ? releaseDate.split('-')[0] : 'N/A';
        const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
        const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
        
        return `
            <div class="content-card" onclick="navigateToDetails('${mediaType}', ${item.id})">
                <div class="card-poster">
                    <img src="${posterPath}" alt="${title}">
                    <div class="card-rating">
                        <i class="fas fa-star"></i>
                        <span>${rating}</span>
                    </div>
                </div>
                <div class="card-info">
                    <h3>${title}</h3>
                    <div class="card-meta">
                        <span>${year}</span>
                        <span class="media-type">${mediaType === 'tv' ? 'TV Show' : 'Movie'}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
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

function navigateToDetails(mediaType, id) {
    window.location.href = mediaType === 'tv' 
        ? `tv-details.html?id=${id}`
        : `movie-details.html?id=${id}`;
}

function showError(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.textContent = message;
    
    document.body.appendChild(errorContainer);
    
    setTimeout(() => {
        errorContainer.remove();
    }, 5000);
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