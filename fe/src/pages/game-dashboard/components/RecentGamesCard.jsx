import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const RecentGamesCard = ({ recentGames }) => {
  const navigate = useNavigate();

  const getResultColor = (result) => {
    switch (result) {
      case 'win': return 'text-success';
      case 'loss': return 'text-error';
      case 'draw': return 'text-warning';
      default: return 'text-text-secondary';
    }
  };

  const getResultIcon = (result) => {
    switch (result) {
      case 'win': return 'Trophy';
      case 'loss': return 'X';
      case 'draw': return 'Minus';
      default: return 'Circle';
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const getEloChangeDisplay = (change) => {
    if (change > 0) return `+${change}`;
    return change.toString();
  };

  const getEloChangeColor = (change) => {
    if (change > 0) return 'text-success';
    if (change < 0) return 'text-error';
    return 'text-text-secondary';
  };

  if (recentGames.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-lg text-text-primary">Recent Games</h3>
          <div className="w-8 h-8 bg-accent-50 rounded-lg flex items-center justify-center">
            <Icon name="History" size={18} color="var(--color-accent)" />
          </div>
        </div>
        
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="History" size={24} color="var(--color-text-tertiary)" />
          </div>
          <p className="text-text-secondary mb-4">No games played yet</p>
          <Button 
            variant="primary" 
            onClick={() => navigate('/matchmaking-game-lobby')}
            iconName="Play"
            iconPosition="left"
          >
            Play Your First Game
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-lg text-text-primary">Recent Games</h3>
        <div className="w-8 h-8 bg-accent-50 rounded-lg flex items-center justify-center">
          <Icon name="History" size={18} color="var(--color-accent)" />
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {recentGames.slice(0, 5).map((game) => (
          <div 
            key={game.id}
            className="flex items-center justify-between p-3 bg-background rounded-lg hover:bg-surface-secondary transition-colors duration-150"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                game.result === 'win' ? 'bg-success-50' :
                game.result === 'loss' ? 'bg-error-50' : 'bg-warning-50'
              }`}>
                <Icon 
                  name={getResultIcon(game.result)} 
                  size={16} 
                  color={getResultColor(game.result).replace('text-', 'var(--color-')} 
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Image
                  src={game.opponent.avatar}
                  alt={`${game.opponent.name}'s avatar`}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="font-medium text-text-primary text-sm">
                    vs {game.opponent.name}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {formatDate(game.completedAt)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className={`font-data font-semibold text-sm ${getResultColor(game.result)}`}>
                {game.result.toUpperCase()}
              </p>
              <p className={`text-xs font-data ${getEloChangeColor(game.eloChange)}`}>
                {getEloChangeDisplay(game.eloChange)} ELO
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex space-x-2">
        <Button 
          variant="ghost" 
          fullWidth 
          onClick={() => navigate('/game-history')}
          className="text-sm"
        >
          View All History
        </Button>
        <Button 
          variant="outline" 
          fullWidth 
          onClick={() => navigate('/rankings-leaderboard')}
          className="text-sm"
        >
          View Rankings
        </Button>
      </div>
    </div>
  );
};

export default RecentGamesCard;