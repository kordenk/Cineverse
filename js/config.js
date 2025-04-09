const config = {
    TMDB_API_KEY: '3dcaeee4e7ea355913b57d50a8d1d610', // Replace with your TMDB API key
    TMDB_BASE_URL: 'https://api.themoviedb.org/3',
    TMDB_IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
    WATCHMODE_API_KEY: '75DR5a0if6ifxQeYPYMdjIX2voBPdmoxv7eGeex0', // Replace with your Watchmode API key
    WATCHMODE_BASE_URL: 'https://api.watchmode.com/v1',
    
    // Image sizes
    IMAGE_SIZES: {
        SMALL: 'w185',
        MEDIUM: 'w342',
        LARGE: 'w500',
        ORIGINAL: 'original'
    },
    
    // API endpoints
    ENDPOINTS: {
        TRENDING: '/trending/all/day',
        POPULAR_MOVIES: '/movie/popular',
        TOP_RATED_MOVIES: '/movie/top_rated',
        UPCOMING_MOVIES: '/movie/upcoming',
        NOW_PLAYING: '/movie/now_playing',
        MOVIE_DETAILS: '/movie',
        MOVIE_CREDITS: '/movie/{id}/credits',
        MOVIE_VIDEOS: '/movie/{id}/videos',
        MOVIE_SIMILAR: '/movie/{id}/similar',
        SEARCH: '/search/movie',
        GENRES: '/genre/movie/list',
        DISCOVER: '/discover/movie',
        TV: '/tv',
        TV_GENRES: '/genre/tv/list',
        DISCOVER_TV: '/discover/tv',
        NETWORKS: '/network',
        SEARCH_TV: '/search/tv'
    },

    // Error messages
    ERRORS: {
        TMDB_API_ERROR: 'Failed to fetch movie data. Please check your TMDB API key.',
        WATCHMODE_API_ERROR: 'Failed to fetch streaming data. Please check your Watchmode API key.',
        NETWORK_ERROR: 'Network error. Please check your internet connection.',
        NO_DATA: 'No data available for this movie.'
    }
}; 