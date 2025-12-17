import axios from 'axios';

const PROFILE_API_URL = import.meta.env.VITE_USER_PROFILE_SERVICE_URL || 'http://localhost:5000/profile';

const profileClient = axios.create({
  baseURL: PROFILE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

const userProfileService = {
  // Get user profile by ID
  getProfile: async (userId) => {
    try {
      const response = await profileClient.get(`/${userId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('getProfile error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load user profile';
      return { success: false, error: errorMessage };
    }
  },

  // Update user profile
  updateProfile: async (userId, updates) => {
    try {
      // Backend uses /me for updates usually, checking routes.py...
      // routes.py has /me [PUT]. But let's check if we can update specific user.
      // Since it's /me, we ignore userId arg (or ensure it matches current).
      const response = await profileClient.put('/me', updates);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('updateProfile error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      return { success: false, error: errorMessage };
    }
  },

  // Get global leaderboard
  getGlobalLeaderboard: async (limit = 50, offset = 0) => {
    try {
      const response = await profileClient.get('/leaderboard', {
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
      const response = await profileClient.get(`/${userId}`);
      const userProfile = response.data;
      
      return { 
        success: true, 
        data: {
          rank: 0, // Placeholder
          elo_rating: userProfile.elo_rating || 1200,
          nearby_players: [] // Placeholder
        }
      };
    } catch (error) {
      console.error('getUserRank error:', error);
      return { success: false, error: 'Failed to get user rank' };
    }
  },

  // Search players
  searchPlayers: async (searchTerm, limit = 20) => {
    try {
      const response = await profileClient.get('/search', {
        params: { q: searchTerm }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('searchPlayers error:', error);
      return { success: false, error: 'Failed to search players' };
    }
  },

  // Get player statistics (Stubbed for now)
  getPlayerStats: async (userId) => {
    try {
      const response = await profileClient.get(`/${userId}`);
      const profile = response.data;
      
      const stats = {
        ...profile,
        win_rate: profile.games_played > 0 ? 
          ((profile.games_won / profile.games_played) * 100).toFixed(1) : '0.0',
        recent_results: []
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('getPlayerStats error:', error);
      return { success: false, error: 'Failed to load player stats' };
    }
  },

  // Get ELO distribution (Stubbed)
  getEloDistribution: async () => {
    const distribution = {
      "0-999": 0, "1000-1199": 0, "1200-1399": 0, "1400-1599": 0,
      "1600-1799": 0, "1800-1999": 0, "2000-2199": 0, "2200-2500": 0
    };
    return { success: true, data: distribution };
  }
};

export default userProfileService;
