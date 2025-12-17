import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const ActiveGamesCard = ({ activeGames, onJoinGame }) => {
  const navigate = useNavigate();

  const getGameStatusColor = (status) => {
    switch (status) {
      case 'your-turn': return 'text-success';
      case 'opponent-turn': return 'text-warning';
      case 'waiting': return 'text-text-secondary';
      default: return 'text-text-primary';
    }
  };

  const getGameStatusIcon = (status) => {
    switch (status) {
      case 'your-turn': return 'Play';
      case 'opponent-turn': return 'Clock';
      case 'waiting': return 'Loader';
      default: return 'GamepadIcon';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const gameTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - gameTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleJoinGame = (gameId) => {
    onJoinGame(gameId);
    navigate('/active-game-board');
  };

  if (activeGames.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-lg text-text-primary">Active Games</h3>
          <div className="w-8 h-8 bg-secondary-50 rounded-lg flex items-center justify-center">
            <Icon name="GamepadIcon" size={18} color="var(--color-secondary)" />
          </div>
        </div>
        
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="GamepadIcon" size={24} color="var(--color-text-tertiary)" />
          </div>
          <p className="text-text-secondary mb-4">No active games</p>
          <Button 
            variant="primary" 
            onClick={() => navigate('/matchmaking-game-lobby')}
            iconName="Play"
            iconPosition="left"
          >
            Find Match
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-lg text-text-primary">Active Games</h3>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-secondary-50 rounded-lg flex items-center justify-center">
            <Icon name="GamepadIcon" size={18} color="var(--color-secondary)" />
          </div>
          <span className="bg-secondary text-white text-xs font-bold px-2 py-1 rounded-full">
            {activeGames.length}
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {activeGames.slice(0, 3).map((game) => (
          <div 
            key={game.id}
            className="flex items-center justify-between p-3 bg-background rounded-lg hover:bg-surface-secondary transition-colors duration-150 cursor-pointer"
            onClick={() => handleJoinGame(game.id)}
          >
            <div className="flex items-center space-x-3">
              <Image
                src={game.opponent.avatar}
                alt={`${game.opponent.name}'s avatar`}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-medium text-text-primary text-sm">
                  vs {game.opponent.name}
                </p>
                <div className="flex items-center space-x-2">
                  <Icon 
                    name={getGameStatusIcon(game.status)} 
                    size={12} 
                    color={getGameStatusColor(game.status).replace('text-', 'var(--color-')} 
                  />
                  <span className={`text-xs ${getGameStatusColor(game.status)}`}>
                    {game.status === 'your-turn' ? 'Your turn' :
                     game.status === 'opponent-turn' ? 'Their turn' :
                     game.status === 'waiting' ? 'Waiting' : game.status}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xs text-text-secondary">
                {formatTimeAgo(game.lastMove)}
              </p>
              <div className="flex items-center space-x-1 mt-1">
                <Icon name="Trophy" size={12} color="var(--color-accent)" />
                <span className="text-xs font-data text-accent">±{game.eloStakes}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeGames.length > 3 && (
        <Button 
          variant="ghost" 
          fullWidth 
          onClick={() => navigate('/matchmaking-game-lobby')}
          className="text-sm"
        >
          View All Games ({activeGames.length})
        </Button>
      )}
    </div>
  );
};

export default ActiveGamesCard;