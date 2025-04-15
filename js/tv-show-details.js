// Initialize API
const api = new MovieAPI();
let currentShowId = null;
let currentSeason = 1;

document.addEventListener('DOMContentLoaded', () => {
    initializeTVShowPage();
    initializeBackToTop();
});

async function initializeTVShowPage() {
    try {
        // Get show ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        currentShowId = urlParams.get('id');

        if (!currentShowId) {
            throw new Error('No TV show ID provided');
        }

        document.body.classList.add('loading');

        // Debug: Log the show ID
        console.log('Loading TV show with ID:', currentShowId);

        // Fetch show data with all necessary details
        const [showDetails, watchProviders] = await Promise.all([
            api.getTVShowDetails(currentShowId),
            api.getTVShowWatchProviders(currentShowId)
        ]);

        // Debug: Log the API responses
        console.log('Show Details:', showDetails);
        console.log('Watch Providers:', watchProviders);

        // Check if we have valid data
        if (!showDetails || !showDetails.name) {
            throw new Error('Invalid show data received');
        }

        // Update UI with show data
        updateShowDetails(showDetails);
        updateCastSection(showDetails.credits?.cast || []);
        updateVideosSection(showDetails.videos?.results || []);
        updateSimilarShows(showDetails.similar?.results || []);
        updateStreamingProviders(watchProviders);
        
        // Load first season episodes if available
        if (showDetails.seasons?.length > 0) {
            await loadSeasonEpisodes(1);
        }
        
        // Setup event listeners
        setupEventListeners(showDetails, watchProviders.results?.US);
        
        // Update watchlist button if user is logged in
        if (typeof auth !== 'undefined' && auth.isLoggedIn()) {
            updateWatchlistButton(currentShowId);
        }

        document.body.classList.remove('loading');
    } catch (error) {
        console.error('Error initializing TV show page:', error);
        document.body.classList.remove('loading');
        showError('Unable to load show details. Please try again.');
    }
}

function updateShowDetails(show) {
    // Update backdrop
    const backdropPath = show.backdrop_path 
        ? api.getImageUrl(show.backdrop_path, 'original') 
        : null;
    const backdropElement = document.querySelector('.backdrop-image');
    if (backdropPath) {
        backdropElement.style.backgroundImage = `url('${backdropPath}')`;
    }

    // Update poster
    const posterPath = show.poster_path 
        ? api.getImageUrl(show.poster_path, 'w500') 
        : 'assets/placeholder.jpg';
    document.getElementById('show-poster').src = posterPath;

    // Update basic show information
    document.querySelector('.show-title').textContent = show.name;
    document.querySelector('.show-year').textContent = show.first_air_date 
        ? new Date(show.first_air_date).getFullYear() 
        : 'TBA';
    document.querySelector('.rating-value').textContent = show.vote_average 
        ? show.vote_average.toFixed(1) 
        : 'N/A';
    document.querySelector('.episode-runtime').textContent = show.episode_run_time?.[0] 
        ? `${show.episode_run_time[0]}min` 
        : '';
    document.querySelector('.show-status').textContent = show.status || 'Unknown';

    // Update genres
    document.querySelector('.show-genres').innerHTML = show.genres
        ?.map(genre => `<span class="genre-tag">${genre.name}</span>`)
        .join('') || '';

    // Update overview
    document.querySelector('.show-overview').textContent = show.overview || 'No overview available.';

    // Update stats
    document.querySelector('.first-air-date').textContent = show.first_air_date 
        ? new Date(show.first_air_date).toLocaleDateString() 
        : 'TBA';
    document.querySelector('.network').textContent = show.networks?.[0]?.name || 'Unknown';
    document.querySelector('.status').textContent = show.status || 'Unknown';

    // Update season selector if there are seasons
    const seasonSelect = document.getElementById('season-select');
    if (show.seasons && show.seasons.length > 0) {
        seasonSelect.innerHTML = show.seasons
            .filter(season => season.season_number > 0) // Filter out specials
            .map(season => `
                <option value="${season.season_number}">
                    Season ${season.season_number} (${season.episode_count} episodes)
                </option>
            `).join('');
        document.querySelector('.seasons-section').style.display = 'block';
    } else {
        document.querySelector('.seasons-section').style.display = 'none';
    }

    // Update trailer button
    const trailerButton = document.querySelector('.trailer-button');
    const trailer = show.videos?.results?.find(video => 
        video.type === 'Trailer' && video.site === 'YouTube'
    );
    if (trailer) {
        trailerButton.dataset.videoId = trailer.key;
        trailerButton.style.display = 'inline-flex';
    } else {
        trailerButton.style.display = 'none';
    }
}

function updateCastSection(cast) {
    const castGrid = document.querySelector('.cast-grid');
    if (!cast || cast.length === 0) {
        castGrid.innerHTML = '<p class="no-results">No cast information available.</p>';
        return;
    }

    castGrid.innerHTML = cast.slice(0, 12).map(person => `
        <div class="cast-card">
            <div class="cast-image">
                <img src="${person.profile_path 
                    ? api.getImageUrl(person.profile_path, 'w185') 
                    : 'assets/placeholder.jpg'}"
                    alt="${person.name}"
                    onerror="this.src='assets/placeholder.jpg'">
            </div>
            <div class="cast-info">
                <h4>${person.name}</h4>
                <p>${person.character}</p>
            </div>
        </div>
    `).join('');
}

function updateVideosSection(videos) {
    const videosGrid = document.querySelector('.videos-grid');
    if (!videos || videos.length === 0) {
        videosGrid.innerHTML = '<p class="no-results">No videos available.</p>';
        return;
    }

    videosGrid.innerHTML = videos.map(video => `
        <div class="video-card" data-video-id="${video.key}">
            <img class="video-thumbnail" 
                src="https://img.youtube.com/vi/${video.key}/maxresdefault.jpg" 
                alt="${video.name}"
                onerror="this.src='assets/placeholder.jpg'">
            <div class="play-icon">
                <i class="fas fa-play"></i>
            </div>
            <div class="video-info">
                <h4>${video.name}</h4>
                <p>${video.type}</p>
            </div>
        </div>
    `).join('');
}

function updateSimilarShows(shows) {
    const similarGrid = document.querySelector('.similar-grid');
    if (!shows || shows.length === 0) {
        similarGrid.innerHTML = '<p class="no-results">No similar shows available.</p>';
        return;
    }

    similarGrid.innerHTML = shows.slice(0, 6).map(show => `
        <div class="show-card" onclick="window.location.href='tv-show-details.html?id=${show.id}'">
            <img src="${show.poster_path 
                ? api.getImageUrl(show.poster_path, 'w342') 
                : 'assets/placeholder.jpg'}"
                alt="${show.name}"
                onerror="this.src='assets/placeholder.jpg'">
            <div class="show-info">
                <h3>${show.name}</h3>
                <div class="show-meta">
                    ${show.first_air_date 
                        ? `<span>${new Date(show.first_air_date).getFullYear()}</span>` 
                        : ''}
                    ${show.vote_average 
                        ? `<span>${show.vote_average.toFixed(1)} ★</span>` 
                        : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function updateStreamingProviders(data) {
    const providersSection = document.querySelector('.streaming-providers');
    const results = data.results?.US;

    if (!results || (!results.flatrate && !results.free && !results.ads)) {
        providersSection.innerHTML = '<p class="no-results">No streaming information available.</p>';
        return;
    }

    const allProviders = [
        ...(results.flatrate || []),
        ...(results.free || []),
        ...(results.ads || [])
    ];

    if (allProviders.length === 0) {
        providersSection.innerHTML = '<p class="no-results">No streaming information available.</p>';
        return;
    }

    providersSection.innerHTML = allProviders.map(provider => `
        <div class="provider-card">
            <img class="provider-logo" 
                src="${api.getImageUrl(provider.logo_path, 'w92')}" 
                alt="${provider.provider_name}"
                onerror="this.src='assets/placeholder.jpg'">
            <span class="provider-name">${provider.provider_name}</span>
        </div>
    `).join('');
}

async function loadSeasonEpisodes(seasonNumber) {
    try {
        document.body.classList.add('loading');
        const seasonData = await api.getTVShowEpisodes(currentShowId, seasonNumber);
        
        const episodesGrid = document.querySelector('.episodes-grid');
        if (!seasonData.episodes || seasonData.episodes.length === 0) {
            episodesGrid.innerHTML = '<p class="no-results">No episodes available for this season.</p>';
            return;
        }

        episodesGrid.innerHTML = seasonData.episodes.map(episode => `
            <div class="episode-card">
                <div class="episode-image">
                    <img src="${episode.still_path 
                        ? api.getImageUrl(episode.still_path, 'w300') 
                        : 'assets/placeholder.jpg'}"
                        alt="Episode ${episode.episode_number}"
                        onerror="this.src='assets/placeholder.jpg'">
                </div>
                <div class="episode-info">
                    <h3>Episode ${episode.episode_number}: ${episode.name}</h3>
                    <div class="episode-meta">
                        ${episode.air_date 
                            ? `<span class="air-date">${new Date(episode.air_date).toLocaleDateString()}</span>` 
                            : '<span class="air-date">TBA</span>'}
                        ${episode.vote_average 
                            ? `<span class="rating"><i class="fas fa-star"></i> ${episode.vote_average.toFixed(1)}</span>` 
                            : ''}
                    </div>
                    <p class="episode-overview">${episode.overview || 'No overview available.'}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading episodes:', error);
        document.querySelector('.episodes-grid').innerHTML = 
            '<p class="error">Unable to load episodes. Please try again.</p>';
    } finally {
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
    watchButton.addEventListener('click', () => {
        document.querySelector('.streaming-section').scrollIntoView({ behavior: 'smooth' });
    });

    // Trailer button
    const trailerButton = document.querySelector('.trailer-button');
    if (trailerButton.dataset.videoId) {
        trailerButton.addEventListener('click', () => {
            openVideoModal(trailerButton.dataset.videoId);
        });
    }

    // Video cards
    document.querySelector('.videos-grid').addEventListener('click', (e) => {
        const videoCard = e.target.closest('.video-card');
        if (videoCard) {
            openVideoModal(videoCard.dataset.videoId);
        }
    });

    // Watchlist button
    const watchlistButton = document.querySelector('.watchlist-button');
    watchlistButton.addEventListener('click', () => {
        if (typeof auth === 'undefined' || !auth.isLoggedIn()) {
            window.location.href = 'profile.html';
            return;
        }

        const isInWatchlist = watchlistButton.classList.contains('in-list');
        if (isInWatchlist) {
            auth.removeFromWatchlist(currentShowId, 'tv');
            watchlistButton.innerHTML = '<i class="fas fa-plus"></i> Add to Watchlist';
            watchlistButton.classList.remove('in-list');
            showNotification('Removed from your watchlist');
        } else {
            auth.addToWatchlist({
                id: currentShowId,
                title: show.name,
                type: 'tv',
                poster_path: show.poster_path
            });
            watchlistButton.innerHTML = '<i class="fas fa-check"></i> In Watchlist';
            watchlistButton.classList.add('in-list');
            showNotification('Added to your watchlist');
        }
    });

    // Close modal button
    document.querySelector('.close-modal').addEventListener('click', closeVideoModal);
}

function openVideoModal(videoId) {
    const modal = document.getElementById('video-modal');
    const container = modal.querySelector('.video-container');
    container.innerHTML = `
        <iframe
            src="https://www.youtube.com/embed/${videoId}?autoplay=1"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
        ></iframe>
    `;
    modal.classList.add('active');
}

function closeVideoModal() {
    const modal = document.getElementById('video-modal');
    modal.classList.remove('active');
    modal.querySelector('.video-container').innerHTML = '';
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }, 100);
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

function updateWatchlistButton(showId) {
    if (typeof auth !== 'undefined' && auth.isLoggedIn()) {
        const watchlistButton = document.querySelector('.watchlist-button');
        if (auth.isInWatchlist(showId, 'tv')) {
            watchlistButton.innerHTML = '<i class="fas fa-check"></i> In Your List';
            watchlistButton.classList.add('in-list');
        } else {
            watchlistButton.innerHTML = '<i class="fas fa-plus"></i> Add to List';
            watchlistButton.classList.remove('in-list');
        }
    } else {
        const watchlistButton = document.querySelector('.watchlist-button');
        watchlistButton.style.display = 'none';
    }
} 