import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const LeaderboardTable = ({ players = [], currentUserId, isLoading = false, error = null }) => {
  // const [leaderboard, setLeaderboard] = useState([]); // Removed internal state
  // const [loading, setLoading] = useState(true); // use prop
  // const [error, setError] = useState(null); // use prop

  // Internal fetch removed. Using passed 'players' prop.


  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Icon name="Trophy" size={20} color="var(--color-warning)" />;
      case 2:
        return <Icon name="Medal" size={20} color="rgb(192, 192, 192)" />;
      case 3:
        return <Icon name="Award" size={20} color="rgb(205, 127, 50)" />;
      default:
        return <span className="text-text-secondary font-medium">#{rank}</span>;
    }
  };

  const getEloRankClass = (elo) => {
    if (elo >= 2000) return 'text-purple-600 font-bold';
    if (elo >= 1800) return 'text-blue-600 font-semibold';
    if (elo >= 1600) return 'text-green-600 font-semibold';
    if (elo >= 1400) return 'text-yellow-600 font-medium';
    if (elo >= 1200) return 'text-orange-600 font-medium';
    return 'text-red-600 font-medium';
  };

  const calculateWinRate = (won, played) => {
    return played > 0 ? ((won / played) * 100).toFixed(1) : '0.0';
  };

  if (isLoading) {
    return (
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-text-secondary">Loading leaderboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-center space-x-2 text-error">
            <Icon name="AlertCircle" size={20} />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-surface-secondary">
        <div className="flex items-center space-x-2">
          <Icon name="Trophy" size={24} color="var(--color-primary)" />
          <h2 className="text-xl font-bold text-text-primary">Global Leaderboard</h2>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-secondary">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Player
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                ELO Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Games Played
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Win Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Win Streak
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {players?.length > 0 ? (
              players.map((player, index) => {
                const rank = index + 1;
                const winRate = calculateWinRate(player?.games_won || 0, player?.games_played || 0);
                
                return (
                  <tr 
                    key={player?.id} 
                    className="hover:bg-surface-secondary transition-colors duration-150"
                  >
                    {/* Rank */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRankIcon(rank)}
                      </div>
                    </td>

                    {/* Player */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">
                            {player?.username?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-text-primary">
                            {player?.username || 'Unknown Player'}
                          </div>
                          <div className="text-sm text-text-secondary">
                            {player?.full_name || ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* ELO Rating */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-lg ${getEloRankClass(player?.elo || 1200)}`}>
                        {player?.elo || 1200}
                      </span>
                    </td>

                    {/* Games Played */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {player?.games_played || 0}
                    </td>

                    {/* Win Rate */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-text-primary">
                          {winRate}%
                        </span>
                        <div className="w-16 bg-surface-secondary rounded-full h-2">
                          <div 
                            className="bg-success h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(parseFloat(winRate), 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Win Streak */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        {(player?.win_streak || 0) > 0 && (
                          <Icon name="Flame" size={16} color="var(--color-warning)" />
                        )}
                        <span className="text-sm font-medium text-text-primary">
                          {player?.win_streak || 0}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <Icon name="Users" size={48} color="var(--color-text-secondary)" />
                    <span className="text-text-secondary">No players found</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {players?.length > 0 && (
        <div className="px-6 py-4 border-t border-border bg-surface-secondary">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">
              Showing top {players.length} players
            </span>
            <div className="flex items-center space-x-2 text-xs text-text-secondary">
              <Icon name="Clock" size={14} />
              <span>Updated in real-time</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardTable;