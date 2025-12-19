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
  const [gameId, setGameId] = useState(null);
  
  // Ready/Countdown state hoisted from GameLobby
  const [isReady, setIsReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [countdown, setCountdown] = useState(null);

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
      
      const newGameId = data.game_id;
      setGameId(newGameId);
      
      // Join game room for sync updates
      socketService.emit('join_game', { game_id: newGameId });

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

      // Reset states for new match
      setIsReady(false);
      setOpponentReady(false);
      setCountdown(null);
      setGameState('lobby');
    };

    const onPlayerReadyUpdate = (data) => {
        // data: { user_id, ready }
        if (data.user_id === opponent?.id) {
            setOpponentReady(data.ready);
        } else if (data.user_id === currentUser.id) {
            // Confirm my own ready state from server (optional, but good for sync)
            setIsReady(data.ready);
        }
    };

    const onGameStartCountdown = (data) => {
        // data: { start_in, game_id }
        if (data.game_id === gameId) {
             console.log("Starting countdown:", data.start_in);
             setCountdown(data.start_in);
        }
    };

    const onOnlineUsersUpdate = (data) => {
      if (data && typeof data.count === 'number') {
        setOnlineUsersCount(data.count);
      }
    };

    socketService.on('match_found', onMatchFound);
    socketService.on('online_users_update', onOnlineUsersUpdate);
    socketService.on('player_ready_update', onPlayerReadyUpdate);
    socketService.on('game_start_countdown', onGameStartCountdown);

    return () => {
      socketService.off('match_found', onMatchFound);
      socketService.off('online_users_update', onOnlineUsersUpdate);
      socketService.off('player_ready_update', onPlayerReadyUpdate);
      socketService.off('game_start_countdown', onGameStartCountdown);
    };
  }, [user, gameId, opponent]); // Depend on gameId/opponent for socket handlers logic if needed

  // Handle auto-match finding simulation/real call
  const handleStartMatchmaking = async (preferences) => {
    // Inject current user ELO into preferences for service call
    const finalPreferences = {
        ...preferences,
        elo: currentUser.elo
    };
    
    setMatchmakingPreferences(finalPreferences);
    setGameState('searching');
    
    // Call backend to join queue
    const res = await gameService.joinMatchmaking(currentUser.id, finalPreferences);
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
    setGameId(null);
    if (gameId) {
        socketService.emit('leave_game', { game_id: gameId });
    }
  };

  const handleReady = (ready) => {
    // Emit ready state to server
    if (gameId) {
        socketService.emit('player_ready', { game_id: gameId, ready: ready });
    }
  };

  const handleStartGame = () => {
    // Navigate to active game board
    navigate(`/active-game-board/${gameId}`);
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
            // Pass synced state
            isReady={isReady}
            opponentReady={opponentReady}
            serverCountdown={countdown}
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
        opponent={null}
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