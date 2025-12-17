import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const FriendsRankingList = ({ 
  friends = [],
  currentUserId = null,
  onChallengePlayer = () => {},
  onViewProfile = () => {},
  isLoading = false
}) => {
  const [sortBy, setSortBy] = useState('rank');
  const [sortOrder, setSortOrder] = useState('asc');

  const sortedFriends = [...friends].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'rank') {
      // For rank, lower numbers are better
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-success';
      case 'in-game': return 'bg-warning';
      case 'away': return 'bg-accent';
      default: return 'bg-text-tertiary';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Online';
      case 'in-game': return 'In Game';
      case 'away': return 'Away';
      default: return 'Offline';
    }
  };

  const getTierBadge = (elo) => {
    if (elo >= 2000) return { label: 'Expert', color: 'bg-error text-white' };
    if (elo >= 1500) return { label: 'Advanced', color: 'bg-warning text-white' };
    if (elo >= 1000) return { label: 'Intermediate', color: 'bg-secondary text-white' };
    return { label: 'Beginner', color: 'bg-primary text-white' };
  };

  const renderSortButton = (key, label) => (
    <button
      onClick={() => handleSort(key)}
      className="flex items-center space-x-1 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-150"
    >
      <span>{label}</span>
      <Icon 
        name={
          sortBy === key 
            ? (sortOrder === 'asc' ? 'ArrowUp' : 'ArrowDown')
            : 'ArrowUpDown'
        } 
        size={14} 
        color={sortBy === key ? 'var(--color-primary)' : 'var(--color-text-tertiary)'} 
      />
    </button>
  );

  const renderFriendCard = (friend) => {
    const isCurrentUser = friend.id === currentUserId;
    const tierBadge = getTierBadge(friend.elo);
    
    return (
      <div
        key={friend.id}
        className={`
          bg-surface border border-border rounded-lg p-4 transition-all duration-150 hover:shadow-sm
          ${isCurrentUser ? 'ring-2 ring-primary ring-opacity-20 bg-primary-50' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* Rank */}
            <div className="text-center min-w-[40px]">
              <div className="font-data font-bold text-lg text-text-primary">
                #{friend.rank}
              </div>
              {friend.rankChange !== 0 && (
                <div className={`
                  flex items-center justify-center space-x-1 text-xs
                  ${friend.rankChange > 0 ? 'text-success' : 'text-error'}
                `}>
                  <Icon 
                    name={friend.rankChange > 0 ? 'ArrowUp' : 'ArrowDown'} 
                    size={10} 
                  />
                  <span>{Math.abs(friend.rankChange)}</span>
                </div>
              )}
            </div>

            {/* Player Info */}
            <div className="flex items-center space-x-3 flex-1">
              <div className="relative">
                <Image
                  src={friend.avatar}
                  alt={`${friend.username}'s avatar`}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className={`
                  absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-surface
                  ${getStatusColor(friend.status)}
                `} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-text-primary truncate">
                    {friend.displayName || friend.username}
                  </h3>
                  {isCurrentUser && (
                    <span className="text-xs font-medium text-primary bg-primary-100 px-2 py-0.5 rounded-full">
                      You
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-text-secondary">
                    @{friend.username}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tierBadge.color}`}>
                    {tierBadge.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="hidden sm:flex items-center space-x-6">
              <div className="text-center">
                <div className="font-data font-semibold text-text-primary">
                  {friend.elo.toLocaleString()}
                </div>
                <div className="text-xs text-text-secondary">ELO</div>
              </div>
              
              <div className="text-center">
                <div className="font-data font-semibold text-text-primary">
                  {friend.winRate}%
                </div>
                <div className="text-xs text-text-secondary">Win Rate</div>
              </div>
              
              <div className="text-center">
                <div className="font-data font-semibold text-text-primary">
                  {friend.gamesPlayed}
                </div>
                <div className="text-xs text-text-secondary">Games</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 ml-4">
            {!isCurrentUser && (
              <>
                {friend.status === 'online' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onChallengePlayer(friend)}
                    iconName="Swords"
                  >
                    <span className="hidden sm:inline">Challenge</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewProfile(friend)}
                  iconName="Eye"
                >
                  <span className="hidden sm:inline">View</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Stats */}
        <div className="sm:hidden mt-4 pt-4 border-t border-border-tertiary">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-text-secondary">
                ELO: <span className="font-data font-semibold text-text-primary">{friend.elo.toLocaleString()}</span>
              </span>
              <span className="text-text-secondary">
                Win Rate: <span className="font-data font-semibold text-text-primary">{friend.winRate}%</span>
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(friend.status)}`} />
              <span className="text-xs text-text-secondary">
                {getStatusText(friend.status)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-surface border border-border rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-border-tertiary rounded animate-pulse" />
              <div className="w-12 h-12 bg-border-tertiary rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-border-tertiary rounded animate-pulse" />
                <div className="h-3 bg-border-tertiary rounded w-2/3 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="bg-surface rounded-lg border border-border p-8 text-center">
        <Icon name="Users" size={48} color="var(--color-text-tertiary)" className="mx-auto mb-4" />
        <h3 className="font-heading font-semibold text-text-primary mb-2">
          No friends found
        </h3>
        <p className="text-text-secondary mb-4">
          Add friends to see their rankings and challenge them to matches
        </p>
        <Button variant="primary" iconName="UserPlus">
          Find Friends
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort Controls */}
      <div className="flex items-center justify-between bg-surface-secondary rounded-lg p-3">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-text-secondary">Sort by:</span>
          {renderSortButton('rank', 'Rank')}
          {renderSortButton('elo', 'ELO')}
          {renderSortButton('winRate', 'Win Rate')}
        </div>
        <div className="text-sm text-text-secondary">
          {friends.length} friend{friends.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Friends List */}
      <div className="space-y-3">
        {sortedFriends.map(renderFriendCard)}
      </div>
    </div>
  );
};

export default FriendsRankingList;