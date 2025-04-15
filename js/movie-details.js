// Initialize API
// const api = new MovieAPI();

document.addEventListener('DOMContentLoaded', () => {
    // Get movie ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');

    if (!movieId) {
        showError('No movie ID provided');
        return;
    }

    // Initialize back to top button
    initializeBackToTop();

    // Load movie details
    loadMovieDetails(movieId);
});

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

async function loadMovieDetails(movieId) {
    try {
        // Show loading state
        document.body.classList.add('loading');

        // Fetch all required data in parallel
        const [movieDetails, credits, videos, streamingProviders] = await Promise.all([
            api.getMovieDetails(movieId),
            api.getMovieCredits(movieId),
            api.getMovieVideos(movieId),
            api.getMovieWatchProviders(movieId)
        ]).catch(error => {
            console.error('Error fetching movie data:', error);
            throw new Error('Failed to load movie data. Please try again.');
        });

        // Update backdrop
        if (movieDetails.backdrop_path) {
            const backdropUrl = api.getImageUrl(movieDetails.backdrop_path, 'original');
            document.querySelector('.movie-backdrop').style.backgroundImage = `url(${backdropUrl})`;
        }

        // Update movie poster
        if (movieDetails.poster_path) {
            const posterUrl = api.getImageUrl(movieDetails.poster_path, 'w500');
            document.getElementById('movie-poster').src = posterUrl;
        }

        // Update movie info
        document.getElementById('movie-title').textContent = movieDetails.title;
        document.getElementById('movie-year').textContent = movieDetails.release_date?.split('-')[0] || 'N/A';
        document.getElementById('movie-runtime').textContent = movieDetails.runtime ? `${movieDetails.runtime} min` : 'N/A';
        document.getElementById('movie-rating').textContent = movieDetails.vote_average ? `${movieDetails.vote_average.toFixed(1)}/10` : 'N/A';
        document.getElementById('movie-tagline').textContent = movieDetails.tagline || '';
        document.getElementById('movie-overview').textContent = movieDetails.overview || 'No overview available';

        // Update cast
        const castList = document.getElementById('cast-list');
        if (credits.cast && credits.cast.length > 0) {
            castList.innerHTML = credits.cast.slice(0, 6).map(actor => `
                <div class="cast-member">
                    <img src="${actor.profile_path 
                        ? api.getImageUrl(actor.profile_path, 'w185')
                        : 'assets/placeholder-actor.jpg'}"
                         alt="${actor.name}">
                    <p>${actor.name}</p>
                    <p class="character">${actor.character}</p>
                </div>
            `).join('');
        } else {
            castList.innerHTML = '<p class="no-data">No cast information available</p>';
        }

        // Update streaming options
        const streamingOptions = document.getElementById('streaming-options');
        if (streamingProviders.results && streamingProviders.results.US) {
            const providers = streamingProviders.results.US;
            const allProviders = [];

            // Add subscription providers
            if (providers.flatrate) {
                providers.flatrate.forEach(provider => {
                    allProviders.push({
                        name: provider.provider_name,
                        logo: api.getImageUrl(provider.logo_path),
                        url: providers.link,
                        type: "subscription"
                    });
                });
            }

            // Add rental providers
            if (providers.rent) {
                providers.rent.forEach(provider => {
                    allProviders.push({
                        name: provider.provider_name,
                        logo: api.getImageUrl(provider.logo_path),
                        url: providers.link,
                        type: "rent"
                    });
                });
            }

            // Add purchase providers
            if (providers.buy) {
                providers.buy.forEach(provider => {
                    allProviders.push({
                        name: provider.provider_name,
                        logo: api.getImageUrl(provider.logo_path),
                        url: providers.link,
                        type: "buy"
                    });
                });
            }

            if (allProviders.length > 0) {
                streamingOptions.innerHTML = allProviders.map(provider => `
                    <a href="${provider.url}" target="_blank" class="streaming-option ${provider.type}">
                        <img src="${provider.logo}" alt="${provider.name}">
                        <span>${provider.name}</span>
                        <div class="provider-type">${provider.type}</div>
                    </a>
                `).join('');
            } else {
                streamingOptions.innerHTML = '<p class="no-data">No streaming options available at the moment</p>';
            }
        } else {
            streamingOptions.innerHTML = '<p class="no-data">No streaming options available at the moment</p>';
        }

        // Update trailer
        const trailerContainer = document.getElementById('trailer-container');
        if (videos.results && videos.results.length > 0) {
            const trailer = videos.results.find(video => 
                video.type === 'Trailer' && video.site === 'YouTube'
            ) || videos.results[0];
            
            if (trailer) {
                trailerContainer.innerHTML = `
                    <iframe src="https://www.youtube.com/embed/${trailer.key}"
                            frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowfullscreen>
                    </iframe>
                `;
            } else {
                trailerContainer.innerHTML = '<p class="no-data">No trailer available</p>';
            }
        } else {
            trailerContainer.innerHTML = '<p class="no-data">No trailer available</p>';
        }

        // Update similar movies
        const similarMoviesContainer = document.getElementById('similar-movies');
        if (movieDetails.similar && movieDetails.similar.results && movieDetails.similar.results.length > 0) {
            similarMoviesContainer.innerHTML = movieDetails.similar.results.slice(0, 6).map(movie => `
                <div class="similar-movie-card" onclick="window.location.href='movie-details.html?id=${movie.id}'">
                    <img src="${movie.poster_path 
                        ? api.getImageUrl(movie.poster_path, 'w342')
                        : 'assets/placeholder.jpg'}" 
                         alt="${movie.title}">
                    <div class="similar-movie-info">
                        <h3>${movie.title}</h3>
                        <p>${movie.release_date?.split('-')[0] || 'N/A'}</p>
                    </div>
                </div>
            `).join('');
        } else {
            similarMoviesContainer.innerHTML = '<p class="no-data">No similar movies available</p>';
        }

        // Remove loading state
        document.body.classList.remove('loading');

        // Setup event listeners
        setupEventListeners(movieId, streamingProviders.results?.US);
    } catch (error) {
        console.error('Error loading movie details:', error);
        showError(error.message || 'Failed to load movie details. Please try again later.');
        document.body.classList.remove('loading');
    }
}

function setupEventListeners(movieId, streamingLinks) {
    // Play button
    const playButton = document.querySelector('.play-button');
    const videoPlayerSection = document.getElementById('video-player-section');
    const movieIframe = document.getElementById('movie-iframe');
    const closeVideoBtn = document.getElementById('close-video');

    playButton.addEventListener('click', () => {
        // Set up vidsrc.to player
        const videoUrl = `https://vidsrc.to/embed/movie/${movieId}`;
        movieIframe.src = videoUrl;
        videoPlayerSection.style.display = 'flex';
        
        // Add to history if user is logged in
        if (typeof auth !== 'undefined' && auth.isLoggedIn()) {
            const movieTitle = document.getElementById('movie-title').textContent;
            const posterPath = document.getElementById('movie-poster').src.includes('no-poster.jpg')
                ? null
                : document.getElementById('movie-poster').src.replace('https://image.tmdb.org/t/p/w500', '');
            
            auth.addToHistory({
                id: movieId,
                type: 'movie',
                title: movieTitle,
                poster_path: posterPath
            });
        }
    });

    // Close video button
    closeVideoBtn.addEventListener('click', () => {
        movieIframe.src = '';
        videoPlayerSection.style.display = 'none';
    });

    // Add to list button
    const addListButton = document.querySelector('.add-list-button');
    updateWatchlistButton(movieId, addListButton);
    
    addListButton.addEventListener('click', () => {
        if (typeof auth === 'undefined' || !auth.isLoggedIn()) {
            // Redirect to profile page for login
            window.location.href = 'profile.html';
            return;
        }
        
        try {
            const movieTitle = document.getElementById('movie-title').textContent;
            const posterPath = document.getElementById('movie-poster').src.includes('no-poster.jpg')
                ? null
                : document.getElementById('movie-poster').src.replace('https://image.tmdb.org/t/p/w500', '');
            
            if (auth.isInWatchlist(movieId, 'movie')) {
                auth.removeFromWatchlist(movieId, 'movie');
                showNotification('Removed from your watchlist');
            } else {
                auth.addToWatchlist({
                    id: movieId,
                    type: 'movie',
                    title: movieTitle,
                    poster_path: posterPath
                });
                showNotification('Added to your watchlist!');
            }
            
            updateWatchlistButton(movieId, addListButton);
        } catch (error) {
            console.error('Watchlist error:', error);
            showNotification(error.message || 'An error occurred', 'error');
        }
    });
}

function updateWatchlistButton(movieId, button) {
    if (typeof auth !== 'undefined' && auth.isLoggedIn() && auth.isInWatchlist(movieId, 'movie')) {
        button.innerHTML = '<i class="fas fa-check"></i> In Watchlist';
        button.classList.add('in-watchlist');
    } else {
        button.innerHTML = '<i class="fas fa-plus"></i> Add to List';
        button.classList.remove('in-watchlist');
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Add show class after a small delay for animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
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