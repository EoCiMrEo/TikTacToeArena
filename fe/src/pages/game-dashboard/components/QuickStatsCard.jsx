import React from 'react';
import Icon from '../../../components/AppIcon';

const QuickStatsCard = ({ stats }) => {
  const winRate = stats.totalGames > 0 ? ((stats.wins / stats.totalGames) * 100).toFixed(1) : 0;
  
  const getWinRateColor = (rate) => {
    if (rate >= 70) return 'text-success';
    if (rate >= 50) return 'text-warning';
    return 'text-error';
  };

  const getStreakIcon = () => {
    if (stats.currentStreak > 0) return 'Flame';
    if (stats.currentStreak < 0) return 'Snowflake';
    return 'Minus';
  };

  const getStreakColor = () => {
    if (stats.currentStreak > 0) return 'text-success';
    if (stats.currentStreak < 0) return 'text-error';
    return 'text-text-secondary';
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-lg text-text-primary">Quick Stats</h3>
        <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
          <Icon name="BarChart3" size={18} color="var(--color-primary)" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-success-50 rounded-lg">
          <p className="text-2xl font-bold text-success">{stats.wins}</p>
          <p className="text-sm text-success-700">Wins</p>
        </div>
        <div className="text-center p-3 bg-error-50 rounded-lg">
          <p className="text-2xl font-bold text-error">{stats.losses}</p>
          <p className="text-sm text-error-700">Losses</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Win Rate</span>
          <span className={`font-data font-semibold ${getWinRateColor(winRate)}`}>
            {winRate}%
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Total Games</span>
          <span className="font-data font-semibold text-text-primary">
            {stats.totalGames}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon 
              name={getStreakIcon()} 
              size={16} 
              color={getStreakColor().replace('text-', 'var(--color-')} 
            />
            <span className="text-sm text-text-secondary">Current Streak</span>
          </div>
          <span className={`font-data font-semibold ${getStreakColor()}`}>
            {Math.abs(stats.currentStreak)}
            {stats.currentStreak > 0 ? 'W' : stats.currentStreak < 0 ? 'L' : ''}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Best Streak</span>
          <span className="font-data font-semibold text-success">
            {stats.bestStreak}W
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuickStatsCard;