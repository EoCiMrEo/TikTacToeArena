import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const WelcomeCard = ({ user, onViewProfile }) => {
  const getRankColor = (rank) => {
    if (rank <= 10) return 'text-accent';
    if (rank <= 100) return 'text-primary';
    if (rank <= 1000) return 'text-secondary';
    return 'text-text-secondary';
  };

  const getRankBadge = (rank) => {
    if (rank <= 10) return 'TOP 10';
    if (rank <= 100) return 'TOP 100';
    if (rank <= 1000) return 'TOP 1K';
    return `#${rank}`;
  };

  return (
    <div className="bg-gradient-to-br from-primary to-secondary p-6 rounded-xl text-white shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Image
              src={user.avatar}
              alt={`${user.username}'s avatar`}
              className="w-16 h-16 rounded-full border-2 border-white/20"
            />
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
              user.status === 'online' ? 'bg-success' : 
              user.status === 'in-game' ? 'bg-warning' : 'bg-text-tertiary'
            }`} />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl">{user.username}</h2>
            <p className="text-white/80 text-sm">Welcome back!</p>
          </div>
        </div>
        <button
          onClick={onViewProfile}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-150"
          aria-label="View profile"
        >
          <Icon name="Settings" size={20} color="white" />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <p className="text-white/80 text-sm">Current ELO</p>
            <p className="font-data font-bold text-2xl">{user.elo}</p>
          </div>
          <div className="w-px h-12 bg-white/20" />
          <div>
            <p className="text-white/80 text-sm">Global Rank</p>
            <p className={`font-data font-bold text-lg ${getRankColor(user.rank)}`}>
              {getRankBadge(user.rank)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Icon name="TrendingUp" size={16} color="white" />
          <span className="text-sm font-medium">
            {user.eloChange > 0 ? '+' : ''}{user.eloChange}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;