// Initialize API
const api = new MovieAPI();
let currentShowId = null;
let currentSeason = 1;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the page
    initializeTVShowPage();
    // Initialize back to top button
    initializeBackToTop();

    // Watchlist button
    const watchlistButton = document.querySelector('.watchlist-btn');
    if (watchlistButton) {
        watchlistButton.addEventListener('click', () => {
            if (typeof auth === 'undefined' || !auth.isLoggedIn()) {
                window.location.href = 'profile.html';
                return;
            }

            try {
                const showId = new URLSearchParams(window.location.search).get('id');
                const showData = {
                    id: showId,
                    title: document.querySelector('.show-title').textContent,
                    type: 'tv',
                    poster_path: document.querySelector('.show-poster img').src.replace(/^.*\/poster\//, '')
                };

                if (auth.isInWatchlist(showId, 'tv')) {
                    auth.removeFromWatchlist(showId, 'tv');
                    watchlistButton.innerHTML = '<i class="fas fa-plus"></i> Add to List';
                    watchlistButton.classList.remove('in-list');
                    showNotification('Removed from your list');
                } else {
                    auth.addToWatchlist(showData);
                    watchlistButton.innerHTML = '<i class="fas fa-check"></i> In Your List';
                    watchlistButton.classList.add('in-list');
                    showNotification('Added to your list');
                }

                updateWatchlistButton(showId, watchlistButton);
            } catch (error) {
                console.error('Error updating watchlist:', error);
                showNotification('Something went wrong. Please try again.');
            }
        });
    }
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

async function initializeTVShowPage() {
    try {
        // Get show ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        currentShowId = urlParams.get('id');

        if (!currentShowId) {
            throw new Error('No TV show ID provided');
        }

        document.body.classList.add('loading');

        // Fetch all show data
        const [showDetails, credits, videos, streamingProviders] = await Promise.all([
            api.getTVShowDetails(currentShowId),
            api.getTVShowCredits(currentShowId),
            api.getTVShowVideos(currentShowId),
            api.getTVShowWatchProviders(currentShowId)
        ]);

        // Update the UI with show data
        updateShowDetails(showDetails);
        updateCastSection(credits.cast);
        updateVideosSection(videos.results);
        updateSimilarShows(showDetails.similar.results);
        updateStreamingProviders(streamingProviders);
        
        // Load first season episodes
        await loadSeasonEpisodes(1);
        
        // Setup event listeners
        setupEventListeners(showDetails, streamingProviders.results?.US);
        
        document.body.classList.remove('loading');
    } catch (error) {
        console.error('Error initializing TV show page:', error);
        showError('Failed to load TV show details. Please try again.');
        document.body.classList.remove('loading');
    }
}

function updateShowDetails(show) {
    // Update backdrop
    const backdropPath = show.backdrop_path 
        ? api.getImageUrl(show.backdrop_path, 'original') 
        : '';
    document.querySelector('.backdrop-image').style.backgroundImage = `url('${backdropPath}')`;

    // Update poster
    const posterPath = show.poster_path 
        ? api.getImageUrl(show.poster_path, 'w500') 
        : 'assets/placeholder.jpg';
    document.getElementById('show-poster').src = posterPath;

    // Update title and meta information
    document.querySelector('.show-title').textContent = show.name;
    document.querySelector('.show-year').textContent = show.first_air_date?.split('-')[0] || 'N/A';
    document.querySelector('.rating-value').textContent = show.vote_average?.toFixed(1) || 'N/A';
    document.querySelector('.show-status').textContent = show.status || 'N/A';

    // Update genres
    const genresHTML = show.genres?.map(genre => 
        `<span class="genre-tag">${genre.name}</span>`
    ).join('') || '';
    document.querySelector('.show-genres').innerHTML = genresHTML;

    // Update overview
    document.querySelector('.show-overview').textContent = show.overview || 'No overview available.';

    // Update season selector
    const seasonSelect = document.getElementById('season-select');
    seasonSelect.innerHTML = show.seasons?.map((season, index) => 
        `<option value="${season.season_number}">Season ${season.season_number}</option>`
    ).join('') || '';
}

function updateCastSection(cast) {
    const castGrid = document.querySelector('.cast-grid');
    castGrid.innerHTML = cast.slice(0, 12).map(actor => `
        <div class="cast-card">
            <div class="cast-image">
                <img src="${actor.profile_path ? api.getImageUrl(actor.profile_path, 'w185') : 'assets/placeholder-actor.jpg'}" 
                     alt="${actor.name}"
                     onerror="this.src='assets/placeholder-actor.jpg'">
            </div>
            <div class="cast-info">
                <h4>${actor.name}</h4>
                <p>${actor.character}</p>
            </div>
        </div>
    `).join('');
}

function updateVideosSection(videos) {
    const videosGrid = document.querySelector('.videos-grid');
    const trailers = videos.filter(video => 
        video.type.toLowerCase() === 'trailer' || 
        video.type.toLowerCase() === 'teaser'
    ).slice(0, 6);

    videosGrid.innerHTML = trailers.map(video => `
        <div class="video-card" data-video-id="${video.key}">
            <img class="video-thumbnail" 
                 src="https://img.youtube.com/vi/${video.key}/maxresdefault.jpg" 
                 alt="${video.name}">
            <div class="video-play-button">
                <i class="fas fa-play"></i>
            </div>
        </div>
    `).join('');

    // Set first trailer as main trailer
    if (trailers.length > 0) {
        document.querySelector('.trailer-button').dataset.videoId = trailers[0].key;
    }
}

function updateSimilarShows(shows) {
    const similarGrid = document.querySelector('.similar-grid');
    similarGrid.innerHTML = shows.slice(0, 6).map(show => `
        <div class="item-card" data-id="${show.id}">
            <img src="${show.poster_path ? api.getImageUrl(show.poster_path, 'w342') : 'assets/placeholder.jpg'}" 
                 alt="${show.name}"
                 onerror="this.src='assets/placeholder.jpg'">
            <div class="item-info">
                <h3>${show.name}</h3>
                <div class="item-meta">
                    <span>${show.first_air_date?.split('-')[0] || 'N/A'}</span>
                    <span class="item-rating">
                        <i class="fas fa-star"></i>
                        ${show.vote_average?.toFixed(1) || 'N/A'}
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

function updateStreamingProviders(providers) {
    const streamingSection = document.querySelector('.streaming-providers');
    
    if (!providers.results || !providers.results.US) {
        streamingSection.innerHTML = '<p class="no-streaming">No streaming options available at the moment</p>';
        return;
    }

    const usProviders = providers.results.US;
    const allProviders = [];

    // Add subscription providers
    if (usProviders.flatrate) {
        usProviders.flatrate.forEach(provider => {
            allProviders.push({
                name: provider.provider_name,
                logo: api.getImageUrl(provider.logo_path),
                url: usProviders.link,
                type: "subscription"
            });
        });
    }

    // Add rental providers
    if (usProviders.rent) {
        usProviders.rent.forEach(provider => {
            allProviders.push({
                name: provider.provider_name,
                logo: api.getImageUrl(provider.logo_path),
                url: usProviders.link,
                type: "rent"
            });
        });
    }

    // Add purchase providers
    if (usProviders.buy) {
        usProviders.buy.forEach(provider => {
            allProviders.push({
                name: provider.provider_name,
                logo: api.getImageUrl(provider.logo_path),
                url: usProviders.link,
                type: "buy"
            });
        });
    }

    if (allProviders.length > 0) {
        streamingSection.innerHTML = allProviders.map(provider => `
            <a href="${provider.url}" target="_blank" class="streaming-option ${provider.type}">
                <img src="${provider.logo}" alt="${provider.name}">
                <span>${provider.name}</span>
                <div class="provider-type">${provider.type}</div>
            </a>
        `).join('');
        
        // Update watch now button functionality
        const watchButton = document.querySelector('.watch-button');
        if (watchButton) {
            watchButton.addEventListener('click', () => {
                window.open(allProviders[0].url, '_blank');
            });
        }
    } else {
        streamingSection.innerHTML = '<p class="no-streaming">No streaming options available at the moment</p>';
    }
}

async function loadSeasonEpisodes(seasonNumber) {
    try {
        document.body.classList.add('loading');
        const episodes = await api.getTVShowEpisodes(currentShowId, seasonNumber);
        
        const episodesGrid = document.querySelector('.episodes-grid');
        episodesGrid.innerHTML = episodes.episodes.map(episode => `
            <div class="episode-card">
                <div class="episode-image">
                    <img src="${episode.still_path ? api.getImageUrl(episode.still_path, 'w300') : 'assets/placeholder.jpg'}" 
                         alt="Episode ${episode.episode_number}"
                         onerror="this.src='assets/placeholder.jpg'">
                </div>
                <div class="episode-info">
                    <h3>Episode ${episode.episode_number}: ${episode.name}</h3>
                    <p class="episode-overview">${episode.overview || 'No overview available.'}</p>
                    <div class="episode-meta">
                        <span class="air-date">${episode.air_date || 'TBA'}</span>
                        <span class="rating">
                            <i class="fas fa-star"></i>
                            ${episode.vote_average?.toFixed(1) || 'N/A'}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
        
        document.body.classList.remove('loading');
    } catch (error) {
        console.error('Error loading episodes:', error);
        document.querySelector('.episodes-grid').innerHTML = '<p class="error">Failed to load episodes</p>';
        document.body.classList.remove('loading');
    }
}

function setupEventListeners(show, providers) {
    // Season selector
    const seasonSelect = document.getElementById('season-select');
    seasonSelect.addEventListener('change', (e) => {
        currentSeason = parseInt(e.target.value);
        loadSeasonEpisodes(currentSeason);
    });

    // Watch button
    const watchButton = document.querySelector('.watch-button');
    if (watchButton) {
        watchButton.addEventListener('click', () => {
            // Add to history if user is logged in
            if (typeof auth !== 'undefined' && auth.isLoggedIn()) {
                const showTitle = document.querySelector('.show-title').textContent;
                const posterPath = document.getElementById('show-poster').src.includes('no-poster.jpg')
                    ? null
                    : document.getElementById('show-poster').src.replace('https://image.tmdb.org/t/p/w500', '');
                
                auth.addToHistory({
                    id: currentShowId,
                    type: 'tv',
                    name: showTitle,
                    poster_path: posterPath
                });
            }
            
            // Open streaming provider if available
            const streamingSection = document.querySelector('.streaming-providers');
            streamingSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Video cards
    document.querySelector('.videos-grid').addEventListener('click', (e) => {
        const videoCard = e.target.closest('.video-card');
        if (videoCard) {
            openVideoModal(videoCard.dataset.videoId);
        }
    });

    // Trailer button
    const trailerButton = document.querySelector('.trailer-button');
    if (trailerButton && trailerButton.dataset.videoId) {
        trailerButton.addEventListener('click', () => {
            openVideoModal(trailerButton.dataset.videoId);
        });
    }

    // Close modal
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('video-modal')) {
            closeVideoModal();
        }
    });

    // Similar shows
    document.querySelector('.similar-grid').addEventListener('click', (e) => {
        const showCard = e.target.closest('.item-card');
        if (showCard) {
            const showId = showCard.dataset.id;
            window.location.href = `tv-show-details.html?id=${showId}`;
        }
    });
}

function updateWatchlistButton(showId, button) {
    if (typeof auth !== 'undefined' && auth.isLoggedIn()) {
        button.style.display = 'flex';
        if (auth.isInWatchlist(showId, 'tv')) {
            button.innerHTML = '<i class="fas fa-check"></i> In Your List';
            button.classList.add('in-list');
        } else {
            button.innerHTML = '<i class="fas fa-plus"></i> Add to List';
            button.classList.remove('in-list');
        }
    } else {
        button.style.display = 'none';
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span>${message}</span>
    `;
    
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

function openVideoModal(videoId) {
    const modal = document.getElementById('video-modal');
    const videoContainer = modal.querySelector('.video-container');
    
    videoContainer.innerHTML = `
        <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                allow="autoplay; encrypted-media" 
                allowfullscreen>
        </iframe>
    `;
    
    modal.classList.add('active');
}

function closeVideoModal() {
    const modal = document.getElementById('video-modal');
    const videoContainer = modal.querySelector('.video-container');
    
    videoContainer.innerHTML = '';
    modal.classList.remove('active');
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