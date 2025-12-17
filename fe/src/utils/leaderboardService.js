import axios from 'axios';

const LEADERBOARD_API_URL = import.meta.env.VITE_LEADERBOARD_SERVICE_URL || 'http://localhost:5004';

const leaderboardClient = axios.create({
  baseURL: LEADERBOARD_API_URL,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json'
  }
});

const leaderboardService = {
  // Get global leaderboard
  getGlobalLeaderboard: async (limit = 50, offset = 0) => {
    try {
      const response = await leaderboardClient.get('/leaderboard', {
        params: { limit, offset }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('getGlobalLeaderboard error:', error);
      return { success: false, error: 'Failed to load leaderboard' };
    }
  },

  // Get user's rank
  getUserRank: async (userId) => {
    try {
      const response = await leaderboardClient.get(`/leaderboard/${userId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('getUserRank error:', error);
      // Return stub if not found/error to prevent UI crash, or let UI handle it
      return { success: false, error: 'Failed to get user rank' };
    }
  },

  // Search players - Uses User Profile Service
  searchPlayers: async (searchTerm, limit = 20) => {
    try {
      // Direct call to profile service or import the client?
      // Let's create a temp client or reuse imports if I could. 
      // Simpler: Just Fetch.
      const response = await axios.get('http://localhost:5000/profile/search', {
         params: { q: searchTerm },
         withCredentials: true
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('searchPlayers error:', error);
      return { success: false, error: 'Failed to search players' };
    }
  },

  // Get player statistics - Uses User Profile Service
  getPlayerStats: async (userId) => {
    try {
      const response = await axios.get(`http://localhost:5000/profile/${userId}`, { withCredentials: true });
      const profile = response.data;
      
      const stats = {
        ...profile,
        win_rate: profile.games_played > 0 ? 
          ((profile.games_won / profile.games_played) * 100).toFixed(1) : '0.0',
        recent_results: [] // Stubbed
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('getPlayerStats error:', error);
      return { success: false, error: 'Failed to load player stats' };
    }
  },

  // Get ELO distribution - Stubbed
  getEloDistribution: async () => {
    // Return dummy distribution to prevent crash
    const distribution = {
      "0-999": 0, "1000-1199": 0, "1200-1399": 0, "1400-1599": 0,
      "1600-1799": 0, "1800-1999": 0, "2000-2199": 0, "2200-2500": 0
    };
    return { success: true, data: distribution };
  }
};

export default leaderboardService;