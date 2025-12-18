import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameContextHeader from '../../components/ui/GameContextHeader';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import MatchmakingPreferences from './components/MatchmakingPreferences';
import SearchingState from './components/SearchingState';
import socketService from '../../utils/socketService';
import gameService from '../../utils/gameService';
import userProfileService from '../../utils/userProfileService';
import { useAuth } from '../../contexts/AuthContext';
import GameLobby from './components/GameLobby';

const MatchmakingGameLobbyPage = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('preferences'); // preferences, searching, lobby
  const [matchmakingPreferences, setMatchmakingPreferences] = useState(null);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(30);

  const [onlineUsersCount, setOnlineUsersCount] = useState(0);

  const { user, userProfile } = useAuth();
  
  // Use real user data if available
  const currentUser = {
    id: user?.id,
    username: userProfile?.username || user?.email?.split('@')[0] || "Player",
    avatar: userProfile?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face",
    elo: userProfile?.elo_rating || 1200,
    wins: userProfile?.wins || 0,
    losses: userProfile?.losses || 0,
    status: 'online',
    gameCode: userProfile?.game_code || 'PLAYER'
  };

  const [opponent, setOpponent] = useState(null);
  const [activeGameSettings, setActiveGameSettings] = useState(null);

  // Default fallback settings
  const defaultSettings = {
    speed: 'standard',
    timePerMove: '2 minutes',
    playerSymbol: 'X',
    eloStakes: 24
  };

  useEffect(() => {
    // Connect to socket on mount
    const socket = socketService.connect(user?.access_token); // Pass token if needed

    const onMatchFound = async (data) => {
      console.log("Match found!", data);
      // data: { game_id, symbol, opponent_id, game_settings }
      
      const opponentId = data.opponent_id;
      const mySymbol = data.symbol;
      const serverSettings = data.game_settings;

      // Update settings from server if available
      if (serverSettings) {
          setActiveGameSettings({
              ...defaultSettings,
              speed: serverSettings.speed,
              timePerMove: serverSettings.timePerMove,
              playerSymbol: mySymbol, // My symbol
              eloStakes: serverSettings.eloStakes || 24
          });
      } else {
          // Fallback if no settings sent (shouldn't happen with new backend)
          setActiveGameSettings({
              ...defaultSettings,
              playerSymbol: mySymbol || 'X'
          });
      }
      
      if (opponentId) {
          try {
              const { success, data: profileData, error } = await userProfileService.getProfile(opponentId);
              if (success) {
                   const opponentData = {
                       id: profileData.id,
                       username: profileData.username || "Opponent",
                       avatar: profileData.avatar_url || "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
                       elo: profileData.elo_rating || 1200,
                       wins: profileData.wins || 0,
                       losses: profileData.losses || 0,
                       status: 'online'
                   };
                   setOpponent(opponentData);
              } else {
                  console.error("Failed to fetch opponent profile:", error);
                  setOpponent({
                      id: opponentId,
                      username: "Opponent",
                      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
                      elo: 1200,
                      wins: 0,
                      losses: 0,
                      status: 'online'
                  });
              }
          } catch (err) {
              console.error("Error fetching opponent:", err);
          }
      }

      setGameState('lobby');
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
            opponent={opponent}
            gameSettings={activeGameSettings || gameSettings}
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
        opponent={gameState === 'lobby' ? opponent : null}
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