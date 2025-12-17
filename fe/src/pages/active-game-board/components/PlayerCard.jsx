import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const PlayerCard = ({ 
  player = {}, 
  isCurrentPlayer = false, 
  symbol = 'X', 
  position = 'top',
  capturedSquares = 0,
  isConnected = true,
  isThinking = false
}) => {
  const {
    id = 'player1',
    name = 'Player',
    avatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    elo = 1200,
    rank = 'Bronze',
    status = 'online'
  } = player;

  const getStatusColor = () => {
    if (!isConnected) return 'bg-error';
    switch (status) {
      case 'online': return 'bg-success animate-pulse';
      case 'in-game': return 'bg-warning pulse-slow';
      default: return 'bg-text-tertiary';
    }
  };

  const getSymbolIcon = () => {
    return symbol === 'X' ? 'X' : 'Circle';
  };

  const getSymbolColor = () => {
    return symbol === 'X' ? 'var(--color-primary)' : 'var(--color-secondary)';
  };

  return (
    <div className={`
      bg-surface rounded-lg border border-border p-4 shadow-sm
      ${isCurrentPlayer ? 'ring-2 ring-primary bg-primary-50/30' : ''}
      ${position === 'bottom' ? 'order-2' : 'order-1'}
      transition-all duration-300 ease-out
    `}>
      <div className="flex items-center space-x-3">
        {/* Avatar with Status */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-border">
            <Image 
              src={avatar} 
              alt={`${name}'s avatar`}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Status Indicator */}
          <div className={`
            absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-surface
            ${getStatusColor()}
          `} />
          
          {/* Thinking Indicator */}
          {isThinking && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-warning rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-ping" />
            </div>
          )}
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="font-heading font-semibold text-text-primary truncate">
              {name}
            </h3>
            
            {/* Player Symbol */}
            <div className="flex-shrink-0 w-6 h-6 bg-surface-secondary rounded-full flex items-center justify-center">
              <Icon 
                name={getSymbolIcon()} 
                size={14} 
                color={getSymbolColor()} 
                strokeWidth={2.5}
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 mt-1">
            {/* ELO Rating */}
            <div className="flex items-center space-x-1">
              <Icon name="Trophy" size={14} color="var(--color-accent)" />
              <span className="font-data text-sm font-medium text-text-primary">
                {elo.toLocaleString()}
              </span>
            </div>

            {/* Rank Badge */}
            <div className="px-2 py-0.5 bg-accent-100 text-accent text-xs font-medium rounded-full">
              {rank}
            </div>

            {/* Connection Status */}
            {!isConnected && (
              <div className="flex items-center space-x-1">
                <Icon name="WifiOff" size={12} color="var(--color-error)" />
                <span className="text-xs text-error font-medium">
                  Disconnected
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Game Stats */}
        <div className="flex-shrink-0 text-right">
          <div className="text-sm font-medium text-text-primary">
            {capturedSquares}
          </div>
          <div className="text-xs text-text-secondary">
            squares
          </div>
        </div>
      </div>

      {/* Current Player Indicator */}
      {isCurrentPlayer && (
        <div className="mt-3 flex items-center justify-center space-x-2 py-2 bg-primary-100 rounded-lg">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-sm font-medium text-primary">
            Your Turn
          </span>
        </div>
      )}

      {/* Thinking Indicator Text */}
      {isThinking && !isCurrentPlayer && (
        <div className="mt-3 flex items-center justify-center space-x-2 py-2 bg-warning-100 rounded-lg">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-warning rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-1 bg-warning rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-1 bg-warning rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm font-medium text-warning">
            Thinking...
          </span>
        </div>
      )}
    </div>
  );
};

export default PlayerCard;