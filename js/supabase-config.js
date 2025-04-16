const SUPABASE_URL = 'https://ytodivresashwwotdogw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0b2RpdnJlc2FzaHd3b3Rkb2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MjM3MDIsImV4cCI6MjA2MDI5OTcwMn0.OTBh7tFdsDmheqnjOy9qrQvYY_s_oo-4iblgt9HgjCY';

// Initialize Supabase client
try {
    // Wait for Supabase to be available
    if (typeof supabase === 'undefined') {
        throw new Error('Supabase library not loaded');
    }

    // Create the Supabase client with specific options
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        },
        global: {
            headers: {
                'X-Client-Info': 'supabase-js-web'
            }
        }
    });

    // Test the connection
    supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session ? 'User authenticated' : 'User not authenticated');
    });

    // Make it globally available
    window.supabase = supabaseClient;
    console.log('Supabase client initialized successfully');

} catch (error) {
    console.error('Failed to initialize Supabase client:', error);
} 