class MovieAPI {
    constructor() {
        this.baseUrl = config.TMDB_BASE_URL;
        this.apiKey = config.TMDB_API_KEY;
        this.imageBaseUrl = config.TMDB_IMAGE_BASE_URL;
        this.watchmodeBaseUrl = config.WATCHMODE_BASE_URL;
        this.watchmodeApiKey = config.WATCHMODE_API_KEY;
    }

    async fetchData(endpoint, params = {}) {
        try {
            const queryParams = new URLSearchParams({
                api_key: this.apiKey,
                ...params
            });

            const response = await fetch(`${this.baseUrl}${endpoint}?${queryParams}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching data:', error);
            throw new Error(config.ERRORS.NETWORK_ERROR);
        }
    }

    async fetchWatchmodeData(endpoint, params = {}) {
        try {
            const queryParams = new URLSearchParams({
                apiKey: this.watchmodeApiKey,
                ...params
            });

            const response = await fetch(`${this.watchmodeBaseUrl}${endpoint}?${queryParams}`);
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(config.ERRORS.WATCHMODE_API_ERROR);
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching Watchmode data:', error);
            throw error;
        }
    }

    getImageUrl(path, size = 'original') {
        if (!path) return null;
        return `${this.imageBaseUrl}/${size}${path}`;
    }

    async getMovieDetails(movieId) {
        return this.fetchData(`/movie/${movieId}`, { append_to_response: 'videos,credits,similar' });
    }

    async getMovieCredits(movieId) {
        return this.fetchData(`/movie/${movieId}/credits`);
    }

    async getMovieVideos(movieId) {
        return this.fetchData(`/movie/${movieId}/videos`);
    }

    async getMovieWatchProviders(movieId) {
        return this.fetchData(`/movie/${movieId}/watch/providers`);
    }

    async getSimilarMovies(movieId) {
        return this.fetchData(`/movie/${movieId}/similar`);
    }

    async searchMovies(query, page = 1) {
        return this.fetchData('/search/movie', { query, page });
    }

    async getTrendingMovies(timeWindow = 'day') {
        return this.fetchData(`/trending/movie/${timeWindow}`);
    }

    async getPopularMovies(page = 1) {
        return this.fetchData('/movie/popular', { page });
    }

    async getTopRatedMovies(page = 1) {
        return this.fetchData('/movie/top_rated', { page });
    }

    async getUpcomingMovies(page = 1) {
        return this.fetchData('/movie/upcoming', { page });
    }

    async getNowPlayingMovies(page = 1) {
        return this.fetchData('/movie/now_playing', { page });
    }

    async getMovieGenres() {
        return this.fetchData('/genre/movie/list');
    }

    async discoverMovies(params = {}) {
        return this.fetchData('/discover/movie', params);
    }

    // TV Shows methods
    async getTVShowDetails(id) {
        return this.fetchData(`${config.ENDPOINTS.TV}/${id}`, {
            append_to_response: 'videos,credits,similar'
        });
    }

    async getTVGenres() {
        return this.fetchData(config.ENDPOINTS.TV_GENRES);
    }

    async discoverTVShows(params) {
        return this.fetchData(config.ENDPOINTS.DISCOVER_TV, params);
    }

    async getTVShowSeasons(id) {
        return this.fetchData(`/tv/${id}/seasons`);
    }

    async getTVShowEpisodes(id, seasonNumber) {
        return this.fetchData(`/tv/${id}/season/${seasonNumber}`);
    }

    async getTVNetworks() {
        return this.fetchData(config.ENDPOINTS.NETWORKS);
    }

    async searchTVShows(query, page = 1) {
        return this.fetchData(config.ENDPOINTS.SEARCH_TV, {
            query,
            page
        });
    }

    async getTrendingTVShows(timeWindow = 'day') {
        return this.fetchData(`/trending/tv/${timeWindow}`);
    }

    async getPopularTVShows(page = 1) {
        return this.fetchData(config.ENDPOINTS.DISCOVER_TV, {
            sort_by: 'popularity.desc',
            page
        });
    }

    async getTopRatedTVShows(page = 1) {
        return this.fetchData('/tv/top_rated', { page });
    }

    async getAiringTodayTVShows(page = 1) {
        return this.fetchData('/tv/airing_today', { page });
    }

    async getOnTheAirTVShows(page = 1) {
        return this.fetchData('/tv/on_the_air', { page });
    }

    async getTVShowWatchProviders(id) {
        return this.fetchData(`${config.ENDPOINTS.TV}/${id}/watch/providers`);
    }

    async getTVShowCredits(id) {
        return this.fetchData(`${config.ENDPOINTS.TV}/${id}/credits`);
    }

    async getTVShowVideos(id) {
        return this.fetchData(`${config.ENDPOINTS.TV}/${id}/videos`);
    }

    // Watchmode API Methods
    async getStreamingLinks(movieId) {
        try {
            const watchProviders = await this.getMovieWatchProviders(movieId);
            const region = 'US'; // Default to US
            
            if (!watchProviders.results || !watchProviders.results[region]) {
                // Try to use mock data for demonstration
                return {
                    sources: [
                        {
                            name: "Netflix",
                            logo: "https://image.tmdb.org/t/p/original/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg",
                            url: "https://www.netflix.com/",
                            type: "subscription"
                        },
                        {
                            name: "Disney+",
                            logo: "https://image.tmdb.org/t/p/original/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg",
                            url: "https://www.disneyplus.com/",
                            type: "subscription"
                        },
                        {
                            name: "Amazon Prime",
                            logo: "https://image.tmdb.org/t/p/original/68MNrwlkpF7WnmNPXLah69CR5cb.jpg",
                            url: "https://www.primevideo.com/",
                            type: "subscription"
                        },
                        {
                            name: "YouTube",
                            logo: "https://image.tmdb.org/t/p/original/oIkQkEkwfmcG7IGpRR1NgF8WHyQ.jpg",
                            url: "https://www.youtube.com/",
                            type: "rent"
                        }
                    ]
                };
            }
            
            const providers = watchProviders.results[region];
            const allProviders = [];
            
            // Format subscription providers
            if (providers.flatrate) {
                providers.flatrate.forEach(provider => {
                    allProviders.push({
                        name: provider.provider_name,
                        logo: this.getImageUrl(provider.logo_path),
                        url: providers.link,
                        type: "subscription"
                    });
                });
            }
            
            // Format rental providers
            if (providers.rent) {
                providers.rent.forEach(provider => {
                    allProviders.push({
                        name: provider.provider_name,
                        logo: this.getImageUrl(provider.logo_path),
                        url: providers.link,
                        type: "rent"
                    });
                });
            }
            
            // Format purchase providers
            if (providers.buy) {
                providers.buy.forEach(provider => {
                    allProviders.push({
                        name: provider.provider_name,
                        logo: this.getImageUrl(provider.logo_path),
                        url: providers.link,
                        type: "buy"
                    });
                });
            }
            
            return {
                sources: allProviders
            };
        } catch (error) {
            console.error('Error fetching streaming links:', error);
            // Return mock data for demonstration purposes
            return {
                sources: [
                    {
                        name: "Netflix",
                        logo: "https://image.tmdb.org/t/p/original/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg",
                        url: "https://www.netflix.com/",
                        type: "subscription"
                    },
                    {
                        name: "Disney+",
                        logo: "https://image.tmdb.org/t/p/original/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg",
                        url: "https://www.disneyplus.com/",
                        type: "subscription"
                    },
                    {
                        name: "Amazon Prime",
                        logo: "https://image.tmdb.org/t/p/original/68MNrwlkpF7WnmNPXLah69CR5cb.jpg",
                        url: "https://www.primevideo.com/",
                        type: "subscription"
                    },
                    {
                        name: "YouTube",
                        logo: "https://image.tmdb.org/t/p/original/oIkQkEkwfmcG7IGpRR1NgF8WHyQ.jpg",
                        url: "https://www.youtube.com/",
                        type: "rent"
                    }
                ]
            };
        }
    }

    async getTVSeasonDetails(showId, seasonNumber) {
        return this.fetchData(`${config.ENDPOINTS.TV}/${showId}/season/${seasonNumber}`);
    }

    async getStreamingProviders(showId) {
        return this.fetchData(`${config.ENDPOINTS.TV}/${showId}/watch/providers`);
    }
}

// Create a global instance
const movieAPI = new MovieAPI(); 