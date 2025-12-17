import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import userProfileService from '../../../utils/userProfileService';
import Icon from '../../../components/AppIcon';

const PersonalProgressCard = ({ refreshTrigger = 0 }) => {
  const { user, userProfile } = useAuth();
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadUserRank = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const result = await userProfileService.getUserRank(user.id);
        
        if (result?.success && isMounted) {
          setUserRank(result.data);
        } else if (isMounted) {
          setError(result?.error || 'Failed to load ranking');
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load ranking');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadUserRank();

    return () => {
      isMounted = false;
    };
  }, [user?.id, refreshTrigger]);

  const calculateWinRate = () => {
    const played = userProfile?.games_played || 0;
    const won = userProfile?.games_won || 0;
    return played > 0 ? ((won / played) * 100).toFixed(1) : '0.0';
  };

  const getRankColor = (rank) => {
    if (rank <= 10) return 'text-warning';
    if (rank <= 50) return 'text-success';
    if (rank <= 100) return 'text-primary';
    return 'text-text-secondary';
  };

  const getEloRankTitle = (elo) => {
    if (elo >= 2200) return 'Grandmaster';
    if (elo >= 2000) return 'Master';
    if (elo >= 1800) return 'Expert';
    if (elo >= 1600) return 'Advanced';
    if (elo >= 1400) return 'Intermediate';
    if (elo >= 1200) return 'Beginner';
    return 'Novice';
  };

  if (!user) {
    return (
      <div className="bg-surface rounded-xl border border-border p-6">
        <div className="text-center">
          <Icon name="User" size={48} color="var(--color-text-secondary)" />
          <p className="mt-2 text-text-secondary">Please sign in to see your ranking</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-surface rounded-xl border border-border p-6">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-text-secondary">Loading your stats...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface rounded-xl border border-border p-6">
        <div className="flex items-center justify-center space-x-2 text-error">
          <Icon name="AlertCircle" size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const winRate = calculateWinRate();
  const eloRating = userProfile?.elo_rating || 1200;
  const rank = userRank?.rank || '?';

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-surface-secondary">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center">
            <span className="text-primary font-bold text-lg">
              {userProfile?.username?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">
              {userProfile?.username || 'Your Profile'}
            </h3>
            <p className="text-sm text-text-secondary">
              {getEloRankTitle(eloRating)} Player
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Current Rank */}
          <div className="text-center p-4 bg-surface-secondary rounded-lg">
            <div className={`text-3xl font-bold ${getRankColor(rank)}`}>
              #{rank}
            </div>
            <div className="text-sm text-text-secondary mt-1">
              Global Rank
            </div>
          </div>

          {/* ELO Rating */}
          <div className="text-center p-4 bg-surface-secondary rounded-lg">
            <div className="text-3xl font-bold text-primary">
              {eloRating}
            </div>
            <div className="text-sm text-text-secondary mt-1">
              ELO Rating
            </div>
          </div>

          {/* Games Played */}
          <div className="text-center p-4 bg-surface-secondary rounded-lg">
            <div className="text-2xl font-bold text-text-primary">
              {userProfile?.games_played || 0}
            </div>
            <div className="text-sm text-text-secondary mt-1">
              Games Played
            </div>
          </div>

          {/* Win Rate */}
          <div className="text-center p-4 bg-surface-secondary rounded-lg">
            <div className="text-2xl font-bold text-success">
              {winRate}%
            </div>
            <div className="text-sm text-text-secondary mt-1">
              Win Rate
            </div>
          </div>
        </div>

        {/* Performance Breakdown */}
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium text-text-secondary uppercase tracking-wider">
            Performance Breakdown
          </h4>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-success">
                {userProfile?.games_won || 0}
              </div>
              <div className="text-xs text-text-secondary">Wins</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-text-secondary">
                {userProfile?.games_drawn || 0}
              </div>
              <div className="text-xs text-text-secondary">Draws</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-error">
                {userProfile?.games_lost || 0}
              </div>
              <div className="text-xs text-text-secondary">Losses</div>
            </div>
          </div>
        </div>

        {/* Win Streak */}
        <div className="mt-6 p-4 bg-warning-50 rounded-lg border border-warning-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon name="Flame" size={20} color="var(--color-warning)" />
              <span className="text-sm font-medium text-warning">Current Streak</span>
            </div>
            <span className="text-lg font-bold text-warning">
              {userProfile?.win_streak || 0}
            </span>
          </div>
          <div className="mt-2 text-xs text-text-secondary">
            Best: {userProfile?.best_win_streak || 0} wins
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalProgressCard;