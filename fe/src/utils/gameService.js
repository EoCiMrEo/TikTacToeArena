import axios from 'axios';

const GAME_API_URL = import.meta.env.VITE_GAME_SERVICE_URL || 'http://localhost:5002/games';

const gameClient = axios.create({
  baseURL: GAME_API_URL,
  withCredentials: true, // If using cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

const gameService = {
  createGame: async (player1Id, player2Id = null) => {
    try {
      const response = await gameClient.post('/', { player1_id: player1Id, player2_id: player2Id });
      return { success: true, data: response.data };
    } catch (error) {
       console.error('createGame error:', error);
       return { success: false, error: 'Failed to create game' };
    }
  },

  getActiveGames: async (userId) => {
    try {
      const response = await gameClient.get(`/active/${userId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('getActiveGames error:', error);
      return { success: false, error: 'Failed to fetch active games' };
    }
  },

  getRecentGames: async (userId, limit = 5, offset = 0) => {
    try {
      const response = await gameClient.get(`/recent/${userId}?limit=${limit}&offset=${offset}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('getRecentGames error:', error);
      return { success: false, error: 'Failed to fetch recent games' };
    }
  },

  getGame: async (gameId) => {
    try {
      const response = await gameClient.get(`/${gameId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('getGame error:', error);
      return { success: false, error: 'Failed to fetch game' };
    }
  },

  makeMove: async (gameId, cellIndex, userId) => {
    try {
      const response = await gameClient.post(`/${gameId}/move`, { user_id: userId, position: cellIndex });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('makeMove error:', error);
       const errorMessage = error.response?.data?.error || 'Failed to make move';
      return { success: false, error: errorMessage };
    }
  },

  subscribeToGame: (gameId, callback) => {
    // This will be handled by the WebSocket Gateway separately
    console.log('Use socketService for real-time updates');
    return () => {};
  },

  joinMatchmaking: async (userId, preferences = {}) => {
    try {
      // Logic for ELO matches standard/blitz preferences if backend supports it
      const MATCHMAKING_URL = import.meta.env.VITE_MATCHMAKING_SERVICE_URL || 'http://localhost:5003';
      const response = await axios.post(`${MATCHMAKING_URL}/queue/join`, {
        user_id: userId,
        elo: preferences.elo || 1000, 
        game_speed: preferences.gameSpeed || 'standard',
        min_elo: preferences.skillRange ? preferences.skillRange[0] : 0,
        max_elo: preferences.skillRange ? preferences.skillRange[1] : 3000
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('joinMatchmaking error:', error);
      return { success: false, error: 'Failed to join matchmaking' };
    }
  },

  leaveMatchmaking: async (playerId) => {
    return { success: true };
  }
};

export default gameService;