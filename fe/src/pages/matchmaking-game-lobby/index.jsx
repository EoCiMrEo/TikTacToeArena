import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameContextHeader from '../../components/ui/GameContextHeader';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import MatchmakingPreferences from './components/MatchmakingPreferences';
import SearchingState from './components/SearchingState';
import socketService from '../../utils/socketService';
import gameService from '../../utils/gameService';
import { useAuth } from '../../contexts/AuthContext';
import GameLobby from './components/GameLobby';

const MatchmakingGameLobbyPage = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('preferences'); // preferences, searching, lobby
  const [matchmakingPreferences, setMatchmakingPreferences] = useState(null);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(30);

  const [onlineUsersCount, setOnlineUsersCount] = useState(0);

  const { user, userProfile } = useAuth();
  
  // Use real user data if available, fallback to mock for now if context is missing (though it shouldn't be)
  const currentUser = {
    id: user?.id || 1,
    username: userProfile?.username || "GameMaster2024",
    avatar: userProfile?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face",
    elo: userProfile?.elo_rating || 1456,
    wins: userProfile?.wins || 0,
    losses: userProfile?.losses || 0,
    status: 'online',
    gameCode: 'GM2024'
  };

  // Mock opponent data
  const mockOpponent = {
    id: 2,
    username: "TicTacPro",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    elo: 1523,
    wins: 203,
    losses: 156,
    status: 'online'
  };

  // Mock game settings
  const gameSettings = {
    speed: 'standard',
    timePerMove: '2 minutes',
    playerSymbol: 'X',
    eloStakes: 24
  };

  useEffect(() => {
    // Connect to socket on mount
    const socket = socketService.connect(user?.access_token); // Pass token if needed

    const onMatchFound = (data) => {
      console.log("Match found!", data);
      // data: { game_id, symbol, opponent_id }
      // In a real app, we'd fetch opponent details here or pass them in the event
      // For now, let's just transition to lobby and set game details
      
      // Mocking opponent details since backend might just send ID
      // You might want to fetch profile by ID in a real scenario
      const opponentId = data.opponent_id;
      
      setGameState('lobby');
      // Navigate to active game or show lobby?
      // Design says Lobby first (Ready handling), but Active Game Board is also an option.
      // Let's go to Lobby/Ready check first as per UI.
      
      // We need to store the gameId somewhere, maybe in navigation state or context
      // For now, let's just navigate directly to active game if "Lobby" is just a visual transition
      // But the UI shows a "Ready" screen.
    };

    const onOnlineUsersUpdate = (data) => {
      if (data && typeof data.count === 'number') {
        setOnlineUsersCount(data.count);
      }
    };

    socketService.on('match_found', onMatchFound);
    socketService.on('online_users_update', onOnlineUsersUpdate);

    return () => {
      socketService.off('match_found', onMatchFound);
      socketService.off('online_users_update', onOnlineUsersUpdate);
    };
  }, [user]);

  // Handle auto-match finding simulation/real call
  const handleStartMatchmaking = async (preferences) => {
    setMatchmakingPreferences(preferences);
    setGameState('searching');
    
    // Call backend to join queue
    const res = await gameService.joinMatchmaking(currentUser.id, preferences);
    if (!res.success) {
        console.error("Failed to join queue", res.error);
        setGameState('preferences');
        // Show error toast
        return;
    }

    // Calculate estimated wait time based on preferences
    const baseTime = 30;
    const skillRangeModifier = (preferences.skillRange[1] - preferences.skillRange[0]) / 100;
    const speedModifier = preferences.gameSpeed === 'blitz' ? 0.5 : preferences.gameSpeed === 'extended' ? 1.5 : 1;
    
    setEstimatedWaitTime(Math.round(baseTime * speedModifier / Math.max(skillRangeModifier, 0.5)));
  };

  const handleCancelSearch = async () => {
    setGameState('preferences');
    setMatchmakingPreferences(null);
    await gameService.leaveMatchmaking(currentUser.id);
  };

  const handleCancelMatch = () => {
    setGameState('preferences');
    setMatchmakingPreferences(null);
  };

  const handleReady = (ready) => {
    // Handle ready state change
    console.log('Player ready:', ready);
  };

  const handleStartGame = () => {
    // Navigate to active game board
    navigate('/active-game-board');
  };

  const handleMenuToggle = () => {
    // Handle menu toggle for mobile
    console.log('Menu toggled');
  };

  const renderContent = () => {
    switch (gameState) {
      case 'preferences':
        return (
          <MatchmakingPreferences
            onStartMatchmaking={handleStartMatchmaking}
            isSearching={false}
          />
        );
      
      case 'searching':
        return (
          <SearchingState
            preferences={matchmakingPreferences}
            onCancel={handleCancelSearch}
            estimatedWaitTime={estimatedWaitTime}
            onlineUsersCount={onlineUsersCount}
          />
        );
      
      case 'lobby':
        return (
          <GameLobby
            currentUser={currentUser}
            opponent={mockOpponent}
            gameSettings={gameSettings}
            onReady={handleReady}
            onCancel={handleCancelMatch}
            onStartGame={handleStartGame}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <GameContextHeader
        gameState={gameState === 'lobby' ? 'waiting' : 'idle'}
        opponent={gameState === 'lobby' ? mockOpponent : null}
        onMenuToggle={handleMenuToggle}
        title="TicTacToe Arena"
      />

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-surface rounded-lg border border-border p-6 shadow-sm">
          {renderContent()}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomTabNavigation
        activeGameCount={gameState === 'lobby' ? 1 : 0}
        unreadNotifications={0}
        userRank={currentUser.elo > 1800 ? 8 : null}
      />
    </div>
  );
};

export default MatchmakingGameLobbyPage;