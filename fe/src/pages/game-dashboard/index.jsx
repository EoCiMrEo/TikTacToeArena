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

  const fetchData = async () => {
    if (!user) return;
    
    try {
      setIsRefreshing(true);
      
      // Fetch Active Games
      const activeRes = await gameService.getActiveGames(user.id);
      if (activeRes.success) {
        // Transform DB data to UI format
        const formattedActive = activeRes.data.map(game => ({
          id: game.id,
          opponent: {
            name: game.opponent_name || "Unknown Opponent", // Backend might need to join/fetch opponent name. For now placeholders if not in DB response
            avatar: "https://via.placeholder.com/150", 
            elo: game.opponent_elo || 1000
          },
          status: game.current_player_id === user.id ? "your-turn" : "opponent-turn",
          lastMove: new Date(game.updated_at || game.started_at),
          eloStakes: 15 // Placeholder or calc
        }));
        setActiveGames(formattedActive);
      }

      // Fetch Recent Games
      const recentRes = await gameService.getRecentGames(user.id);
      if (recentRes.success) {
         const formattedRecent = recentRes.data.map(game => ({
          id: game.id,
          opponent: {
            name: "Opponent", // need extra fetch or join
            avatar: "https://via.placeholder.com/150"
          },
          result: game.winner_id === user.id ? "win" : (game.winner_id ? "loss" : "draw"),
          eloChange: game.winner_id === user.id ? 15 : -10, // Placeholder
          completedAt: new Date(game.finished_at)
        }));
        setRecentGames(formattedRecent);
      }

      // Refresh Stats (if profile outdated)
      if (userProfile) {
        setStatsData({
            wins: userProfile.games_won || 0,
            losses: userProfile.games_lost || 0,
            totalGames: userProfile.games_played || 0,
            currentStreak: userProfile.win_streak || 0,
            bestStreak: userProfile.best_win_streak || 0
        });
      } else {
        // Fetch explicit stats if userProfile context is missing specific fields
        const statsRes = await userProfileService.getPlayerStats(user.id);
        if (statsRes.success) {
             setStatsData({
                wins: statsRes.data.games_won || 0,
                losses: statsRes.data.games_lost || 0,
                totalGames: statsRes.data.games_played || 0,
                currentStreak: statsRes.data.win_streak || 0,
                bestStreak: statsRes.data.best_win_streak || 0
            });
        }
      }
      
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Dashboard refresh failed", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll for updates every 30s
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [user, userProfile]); // Re-run when user or profile changes

  const handleRefresh = () => {
    fetchData();
  };

  const handleJoinGame = (gameId) => {
    navigate(`/active-game-board/${gameId}`);
  };

  const handleViewProfile = () => {
    navigate('/user-profile');
  };
  
  // Transform userProfile for WelcomeCard
  const displayUser = {
    id: user?.id,
    username: userProfile?.username || user?.email?.split('@')[0] || "Player",
    avatar: userProfile?.avatar_url || "https://via.placeholder.com/150",
    elo: userProfile?.elo_rating || 1000,
    rank: userProfile?.current_rank === 'Unranked' ? 'Unranked' : `#${userProfile?.current_rank || '-'}`,
    eloChange: 0, // Placeholder
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