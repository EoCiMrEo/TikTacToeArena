import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import gameService from '../../utils/gameService';
import userProfileService from '../../utils/userProfileService';
import GameContextHeader from '../../components/ui/GameContextHeader';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import WelcomeCard from './components/WelcomeCard';
import QuickStatsCard from './components/QuickStatsCard';
import ActiveGamesCard from './components/ActiveGamesCard';
import RecentGamesCard from './components/RecentGamesCard';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

import socketService from '../../utils/socketService';

const GameDashboard = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [activeGames, setActiveGames] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [statsData, setStatsData] = useState({
    wins: 0,
    losses: 0,
    totalGames: 0,
    currentStreak: 0,
    bestStreak: 0
  });

  const fetchOpponentProfiles = async (games) => {
      const gamesWithProfiles = await Promise.all(games.map(async (game) => {
          // If name is present (from backend join), use it. otherwise fetch.
          // Currently backend might not return name.
          if (!game.opponent.name || game.opponent.name === "Unknown Opponent") {
             const opponentId = game.current_player_id === user.id ? 
                 (game.player1_id === user.id ? game.player2_id : game.player1_id) : 
                 (game.player1_id === user.id ? game.player2_id : game.player1_id); 
             
             // Quick fix logic: identifying opponent ID can be tricky if not explicit in game object
             // Let's assume game object has opponent_id or we derive it:
             let targetId = null;
             if(game.player1_id && game.player1_id !== user.id) targetId = game.player1_id;
             if(game.player2_id && game.player2_id !== user.id) targetId = game.player2_id;

             if (targetId) {
                 const profileRes = await userProfileService.getProfile(targetId);
                 if (profileRes.success) {
                     return {
                         ...game,
                         opponent: {
                             ...game.opponent,
                             name: profileRes.data.username || "Player",
                             avatar: profileRes.data.avatar_url || game.opponent.avatar,
                             elo: profileRes.data.elo_rating || game.opponent.elo
                         }
                     };
                 }
             }
          }
          return game;
      }));
      return gamesWithProfiles;
  };

  const fetchData = async (silent = false) => {
    if (!user) return;
    
    try {
      if (!silent) setIsRefreshing(true);
      
      // Fetch Active Games
      const activeRes = await gameService.getActiveGames(user.id);
      if (activeRes.success) {
        let formattedActive = activeRes.data.map(game => {
             // Basic formatting first
             const isPlayer1 = game.player1_id === user.id;
             // Determine opponent ID locally if needed for fetchOpponentProfiles
             return {
              ...game,
              id: game.id,
              opponent: {
                name: "Unknown Opponent", 
                avatar: "https://via.placeholder.com/150", 
                elo: 1000
              },
              status: game.current_player_id === user.id ? "your-turn" : "opponent-turn",
              lastMove: new Date(game.updated_at || game.started_at),
              eloStakes: 15
            };
        });

        // Fetch names
        formattedActive = await fetchOpponentProfiles(formattedActive);
        setActiveGames(formattedActive);
      }

      // Fetch Recent Games (Limit 5 for dashboard)
      const recentRes = await gameService.getRecentGames(user.id, 5);
      if (recentRes.success) {
         // Similar fetching could be done here if recent games also miss names, 
         // but recent games usuall store snapshot. For now assuming similar logic or keeping simple.
         const formattedRecent = await Promise.all(recentRes.data.map(async (game) => {
             let opponentName = "Opponent";
             let opponentId = game.player1_id === user.id ? game.player2_id : game.player1_id;
             if (opponentId) {
                 // Optional: cache this or only fetch if needed. 
                 // For dashboard calling it 5 times is okay-ish.
                 const p = await userProfileService.getProfile(opponentId);
                 if (p.success) opponentName = p.data.username;
             }

             return {
                id: game.id,
                opponent: {
                    name: opponentName,
                    avatar: "https://via.placeholder.com/150"
                },
                result: game.winner_id === user.id ? "win" : (game.winner_id ? "loss" : "draw"),
                eloChange: game.winner_id === user.id ? 15 : -10,
                completedAt: new Date(game.finished_at)
            };
        }));
        setRecentGames(formattedRecent);
      }

      // Refresh Stats & Profile Data
      let freshStats = null;
      
      // Always fetch fresh stats to get real-time ELO/Rank updates
      const statsRes = await userProfileService.getPlayerStats(user.id);
      if (statsRes.success) {
           freshStats = statsRes.data;
           setStatsData({
              wins: statsRes.data.games_won || 0,
              losses: statsRes.data.games_lost || 0,
              totalGames: statsRes.data.games_played || 0,
              currentStreak: statsRes.data.win_streak || 0,
              bestStreak: statsRes.data.best_win_streak || 0
          });
      } else if (userProfile) {
          // Fallback to context if fetch fails
          setStatsData({
            wins: userProfile.games_won || 0,
            losses: userProfile.games_lost || 0,
            totalGames: userProfile.games_played || 0,
            currentStreak: userProfile.win_streak || 0,
            bestStreak: userProfile.best_win_streak || 0
        });
      }
      
      setLastUpdated(new Date());
      return freshStats; // Return for use in displayUser update
    } catch (e) {
      console.error("Dashboard refresh failed", e);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  // Local state for user display to allow overrides from fresh fetch
  const [displayData, setDisplayData] = useState(null);

  useEffect(() => {
    // Initial fetch
    fetchData().then(stats => {
        if(stats) setDisplayData(stats);
    });

    // Setup Socket Listeners
    const socket = socketService.connect(user.access_token);
    
    if (socket) {
        socket.on('dashboard_update', (data) => {
            console.log("Received dashboard update:", data);
            fetchData(true).then(stats => {
                 if(stats) setDisplayData(stats);
            });
        });

        socket.on('profile_updated', (data) => {
             console.log("Received profile update:", data);
             fetchData(true).then(stats => {
                  if(stats) setDisplayData(stats);
             });
        });

        socket.on('connect', () => setConnectionStatus('connected'));
        socket.on('disconnect', () => setConnectionStatus('reconnecting'));
    }

    return () => {
        if (socket) {
            socket.off('dashboard_update');
        }
    };
  }, [user, userProfile]);

  const handleRefresh = () => {
    fetchData().then(stats => {
        if(stats) setDisplayData(stats);
    });
  };

  const handleJoinGame = (gameId) => {
    navigate(`/active-game-board/${gameId}`);
  };

  const handleViewProfile = () => {
    navigate('/user-profile');
  };
  
  // Transform data for WelcomeCard: Use fresh displayData if available, else fallback to context
  const displayUser = {
    id: user?.id,
    username: displayData?.username || userProfile?.username || user?.email?.split('@')[0] || "Player",
    avatar: displayData?.avatar_url || userProfile?.avatar_url || "https://via.placeholder.com/150",
    elo: displayData?.elo_rating || userProfile?.elo_rating || 1000,
    rank: (displayData?.current_rank || userProfile?.current_rank) === 'Unranked' ? 'Unranked' : `#${displayData?.current_rank || userProfile?.current_rank || '-'}`,
    eloChange: 0,
    status: 'online'
  };

  return (
    <div className="min-h-screen bg-background">
      <GameContextHeader 
        title="TicTacToe Arena"
        gameState="idle"
      />

      {/* Connection Status Banner */}
      {connectionStatus !== 'connected' && (
        <div className="bg-warning text-white px-4 py-2 text-center text-sm">
          <div className="flex items-center justify-center space-x-2">
            <Icon name="Wifi" size={16} color="white" />
            <span>
              {connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Connection lost'}
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Pull to Refresh Indicator */}
        {isRefreshing && (
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center space-x-2 text-primary">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Refreshing...</span>
            </div>
          </div>
        )}

        {/* Desktop Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (Full width if right column hidden/empty) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Welcome Card */}
            <WelcomeCard 
              user={displayUser}
              onViewProfile={handleViewProfile}
            />

            {/* Stats and Active Games Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <QuickStatsCard stats={statsData} />
              <ActiveGamesCard 
                activeGames={activeGames}
                onJoinGame={handleJoinGame}
              />
            </div>

            {/* Recent Games */}
            <RecentGamesCard recentGames={recentGames} />
          </div>
          
          {/* Right Column Removed (Quick Actions & Notifications) as requested */}
        </div>

        {/* Floating Action Button - Mobile */}
        <div className="fixed bottom-20 right-4 lg:hidden z-50">
          <Button
            variant="primary"
            onClick={() => navigate('/matchmaking-game-lobby')}
            className="w-14 h-14 rounded-full shadow-lg"
            iconName="Play"
          />
        </div>

        {/* Last Updated Info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-text-tertiary">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs text-primary hover:text-primary-700 mt-1 disabled:opacity-50"
          >
            Refresh Data
          </button>
        </div>
      </main>

      <BottomTabNavigation 
        activeGameCount={activeGames.length}
        unreadNotifications={0}
        userRank={displayUser.rank}
      />
    </div>
  );
};

export default GameDashboard;