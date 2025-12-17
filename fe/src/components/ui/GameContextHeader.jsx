import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';

const GameContextHeader = ({ 
  gameState = 'idle', 
  opponent = null, 
  gameTimer = null, 
  eloStakes = null,
  currentPlayer = null,
  onMenuToggle = () => {},
  showBackButton = false,
  onBackClick = () => {},
  title = 'TicTacToe Arena'
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (gameState === 'active') {
        // Hide header during active gameplay when scrolling down
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, gameState]);

  const formatTimer = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getGameStateColor = () => {
    switch (gameState) {
      case 'active':
        return 'text-success';
      case 'waiting':
        return 'text-warning';
      case 'ended':
        return 'text-text-secondary';
      default:
        return 'text-text-primary';
    }
  };

  const renderLogo = () => (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
        <Icon name="Grid3X3" size={20} color="white" strokeWidth={2.5} />
      </div>
      <span className="font-heading font-bold text-lg text-text-primary hidden sm:block">
        {title}
      </span>
    </div>
  );

  const renderGameInfo = () => {
    if (!opponent && !gameTimer && !eloStakes) return null;

    return (
      <div className="flex items-center space-x-4 text-sm">
        {opponent && (
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-secondary-100 rounded-full flex items-center justify-center">
              <Icon name="User" size={14} color="var(--color-secondary)" />
            </div>
            <span className="font-medium text-text-primary hidden sm:block">
              {opponent.name}
            </span>
            <div className={`w-2 h-2 rounded-full ${
              opponent.status === 'online' ? 'bg-success animate-pulse' :
              opponent.status === 'in-game'? 'bg-warning pulse-slow' : 'bg-text-tertiary'
            }`} />
          </div>
        )}

        {gameTimer && (
          <div className="flex items-center space-x-1">
            <Icon name="Clock" size={16} color="var(--color-text-secondary)" />
            <span className={`font-data font-medium ${getGameStateColor()}`}>
              {formatTimer(gameTimer)}
            </span>
          </div>
        )}

        {eloStakes && (
          <div className="flex items-center space-x-1">
            <Icon name="Trophy" size={16} color="var(--color-accent)" />
            <span className="font-data font-medium text-accent">
              ±{eloStakes}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderPlayerTurn = () => {
    if (gameState !== 'active' || !currentPlayer) return null;

    return (
      <div className="flex items-center space-x-2 px-3 py-1 bg-primary-50 rounded-full">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        <span className="text-sm font-medium text-primary">
          {currentPlayer === 'you' ? 'Your Turn' : `${currentPlayer}'s Turn`}
        </span>
      </div>
    );
  };

  return (
    <header 
      className={`
        sticky top-0 z-90 bg-surface/95 backdrop-blur-md border-b border-border
        transition-transform duration-300 ease-out
        ${isVisible ? 'translate-y-0' : '-translate-y-full'}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <button
                onClick={onBackClick}
                className="p-2 hover:bg-surface-secondary rounded-lg transition-colors duration-150 focus-game"
                aria-label="Go back"
              >
                <Icon name="ArrowLeft" size={20} color="var(--color-text-primary)" />
              </button>
            )}
            {renderLogo()}
          </div>

          {/* Center Section - Game Info (Desktop) */}
          <div className="hidden md:flex items-center justify-center flex-1 max-w-md mx-8">
            {renderGameInfo()}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {renderPlayerTurn()}
            
            {/* Mobile Game Info */}
            <div className="md:hidden">
              {gameTimer && (
                <span className={`font-data text-sm font-medium ${getGameStateColor()}`}>
                  {formatTimer(gameTimer)}
                </span>
              )}
            </div>

            {/* Menu Button */}
            <button
              onClick={onMenuToggle}
              className="p-2 hover:bg-surface-secondary rounded-lg transition-colors duration-150 focus-game lg:hidden"
              aria-label="Toggle menu"
            >
              <Icon name="Menu" size={20} color="var(--color-text-primary)" />
            </button>
          </div>
        </div>

        {/* Mobile Game Info Row */}
        <div className="md:hidden pb-3 border-t border-border-tertiary mt-2 pt-3">
          {renderGameInfo()}
        </div>
      </div>
    </header>
  );
};

export default GameContextHeader;