import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import leaderboardService from '../../utils/leaderboardService';
import GameContextHeader from '../../components/ui/GameContextHeader';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import LeaderboardTable from './components/LeaderboardTable';
import PlayerSearchBar from './components/PlayerSearchBar';
import RankingFilters from './components/RankingFilters';
import PersonalProgressCard from './components/PersonalProgressCard';
import FriendsRankingList from './components/FriendsRankingList';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const RankingsLeaderboard = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState('global');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all-time');
  const [selectedTier, setSelectedTier] = useState('all');
  const [searchSuggestions, setSearchSuggestions] = useState([]);

  // Data States
  const [players, setPlayers] = useState([]);
  const [userRankData, setUserRankData] = useState(null);

  // Computed Current User
  const currentUser = {
    id: user?.id || 'guest',
    username: userProfile?.username || 'Guest',
    displayName: userProfile?.full_name || userProfile?.username || 'Guest Player',
    avatar: userProfile?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    elo: userRankData?.elo || userProfile?.elo_rating || 1200, // Default 1200 matches DB
    rank: userRankData?.rank || '-',
    winRate: userProfile?.games_played > 0 ? ((userProfile.games_won / userProfile.games_played) * 100).toFixed(1) : 0,
    gamesPlayed: userProfile?.games_played || 0,
    isOnline: true
  };

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const result = await leaderboardService.getGlobalLeaderboard(50, 0);
      if (result.success) {
        // Map backend data to frontend expected format
        // Backend: { rank, user_id, username, elo }
        // Frontend expects: id, username, displayName, avatar, elo, rank, winRate, etc.
        const mappedPlayers = result.data.map(p => ({
            id: p.user_id,
            username: p.username,
            displayName: p.username, // Fallback as backend doesn't return full name yet
            avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`,
            elo: p.elo,
            rank: p.rank,
            winRate: 0, // Not provided by Leaderboard Service yet
            gamesPlayed: 0, // Not provided
            isOnline: false,
            rankChange: 0
        }));
        setPlayers(mappedPlayers);
      }
      
      if (user?.id) {
        const rankResult = await leaderboardService.getUserRank(user.id);
        if (rankResult.success) {
            setUserRankData(rankResult.data);
        }
      }
      
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch leaderboard and user rank on mount and when user changes
  useEffect(() => {
    fetchLeaderboard();
  }, [user?.id, selectedPeriod, selectedTier]);

  useEffect(() => {
    // Search logic (Client-side filtering of fetched list OR server search)
    // leaderboardService has searchPlayers but it uses Profile Service.
    // Let's use server search if query is long enough.
    const doSearch = async () => {
        if (searchQuery.length > 2) {
            const res = await leaderboardService.searchPlayers(searchQuery);
            if (res.success) {
                // Map search results
                setSearchSuggestions(res.data.map(p => ({
                    ...p,
                    displayName: p.full_name || p.username
                })));
            }
        } else {
            setSearchSuggestions([]);
        }
    };
    
    const timeoutId = setTimeout(doSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handlePlayerSelect = (player) => {
    console.log('Selected player:', player);
    // Could navigate to profile
  };

  const handlePlayerClick = (player) => {
    console.log('View player profile:', player);
  };

  const handleChallengePlayer = (player) => {
    navigate('/matchmaking-game-lobby', { state: { challengePlayer: player } });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLeaderboard();
  };

  // Keep Mock Friends/History/Achievements for now as backend doesn't support them fully yet
  const mockFriends = [
    {
      id: 'friend-1',
      username: 'best_buddy',
      displayName: 'Mike Johnson',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
      elo: 1923,
      rank: 18,
      winRate: 81,
      gamesPlayed: 143,
      status: 'online',
      rankChange: 2
    }
  ];

  const mockEloHistory = [
    { date: '2024-01-01', elo: 1200 },
    { date: '2024-04-15', elo: currentUser.elo }
  ];

  const mockRecentChanges = [];
  const mockAchievements = [];

  const tabs = [
    { id: 'global', label: 'Global Leaderboard', icon: 'Globe' },
    { id: 'friends', label: 'Friends Rankings', icon: 'Users' },
    { id: 'progress', label: 'My Progress', icon: 'TrendingUp' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'global':
        return (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <PlayerSearchBar
                  onSearch={handleSearch}
                  suggestions={searchSuggestions}
                  isLoading={false}
                  onPlayerSelect={handlePlayerSelect}
                />
              </div>
            </div>
            
            <RankingFilters
              selectedPeriod={selectedPeriod}
              selectedTier={selectedTier}
              onPeriodChange={setSelectedPeriod}
              onTierChange={setSelectedTier}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
            
            <LeaderboardTable
              players={players} 
              currentUserId={currentUser.id}
              onPlayerClick={handlePlayerClick}
              onChallengePlayer={handleChallengePlayer}
              isLoading={isLoading}
              searchQuery={searchQuery}
              selectedFilter={selectedPeriod}
            />
          </div>
        );
      
      case 'friends':
        return (
          <FriendsRankingList
            friends={mockFriends}
            currentUserId={currentUser.id}
            onChallengePlayer={handleChallengePlayer}
            onViewProfile={handlePlayerClick}
            isLoading={isLoading}
          />
        );
      
      case 'progress':
        return (
          <PersonalProgressCard
            currentUser={currentUser}
            eloHistory={mockEloHistory}
            recentChanges={mockRecentChanges}
            achievements={mockAchievements}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GameContextHeader
        title="Rankings & Leaderboard"
        showBackButton={false}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-heading font-bold text-3xl text-text-primary">
                Rankings & Leaderboard
              </h1>
              <p className="text-text-secondary mt-1">
                Compete with players worldwide and track your progress
              </p>
            </div>
            
            <div className="hidden lg:flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={handleRefresh}
                disabled={isRefreshing}
                iconName="RotateCcw"
                className={isRefreshing ? 'animate-spin' : ''}
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Current User Quick Stats */}
          <div className="bg-gradient-to-r from-primary to-secondary rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Icon name="Trophy" size={24} color="white" />
                </div>
                <div>
                  <div className="font-heading font-semibold text-lg">
                    {currentUser.rank === '-' ? 'Unranked' : `Rank #${currentUser.rank}`}
                  </div>
                  <div className="text-white/80 text-sm">
                    {currentUser.elo.toLocaleString()} ELO • {currentUser.winRate}% Win Rate
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => setActiveTab('progress')}
                className="text-white border-white/30 hover:bg-white/10"
              >
                View Progress
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-border">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-150
                    ${activeTab === tab.id
                      ? 'border-primary text-primary' :'border-transparent text-text-secondary hover:text-text-primary hover:border-border-secondary'
                    }
                  `}
                >
                  <Icon 
                    name={tab.icon} 
                    size={18} 
                    color={activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)'} 
                  />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Pull to Refresh Indicator */}
        {isRefreshing && (
          <div className="flex items-center justify-center py-4 mb-4">
            <div className="flex items-center space-x-2 text-primary">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Refreshing rankings...</span>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="pb-24">
          {renderTabContent()}
        </div>
      </main>

      <BottomTabNavigation
        activeGameCount={0}
        unreadNotifications={2}
        userRank={typeof currentUser.rank === 'number' ? currentUser.rank : 0}
      />
    </div>
  );
};

export default RankingsLeaderboard;