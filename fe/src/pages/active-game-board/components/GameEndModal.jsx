import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';

const GameEndModal = ({ 
  isOpen = false, 
  gameResult = null, 
  onClose = () => {},
  onRematch = () => {},
  onNewGame = () => {},
  eloChanges = null,
  gameStats = null,
  opponent = null
}) => {
  const navigate = useNavigate();
  const [showStats, setShowStats] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Auto-show stats after 2 seconds
      const timer = setTimeout(() => setShowStats(true), 2000);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleBackToDashboard = () => {
    handleClose();
    navigate('/game-dashboard');
  };

  const handleRematch = () => {
    handleClose();
    onRematch();
  };

  const handleNewGame = () => {
    handleClose();
    onNewGame();
  };

  if (!isOpen || !gameResult) return null;

  const getResultIcon = () => {
    switch (gameResult.result) {
      case 'win': return 'Trophy';
      case 'loss': return 'X';
      case 'draw': return 'Minus';
      default: return 'AlertCircle';
    }
  };

  const getResultColor = () => {
    switch (gameResult.result) {
      case 'win': return 'success';
      case 'loss': return 'error';
      case 'draw': return 'warning';
      default: return 'text-secondary';
    }
  };

  const getResultTitle = () => {
    switch (gameResult.result) {
      case 'win': return 'Victory!';
      case 'loss': return 'Defeat';
      case 'draw': return 'Draw';
      default: return 'Game Over';
    }
  };

  const getResultMessage = () => {
    switch (gameResult.result) {
      case 'win': return 'Congratulations! You won the match.';
      case 'loss': return 'Better luck next time!';
      case 'draw': return 'Well played by both players!';
      default: return 'The game has ended.';
    }
  };

  return (
    <div className={`
      fixed inset-0 z-200 flex items-center justify-center p-4
      bg-background/80 backdrop-blur-sm
      ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}
    `}>
      <div className={`
        bg-surface rounded-xl border border-border shadow-2xl
        max-w-md w-full max-h-[90vh] overflow-y-auto
        ${isClosing ? 'animate-scale-out' : 'animate-scale-in'}
      `}>
        {/* Header */}
        <div className="p-6 text-center border-b border-border">
          <div className={`
            w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center
            bg-${getResultColor()}-50
          `}>
            <Icon 
              name={getResultIcon()} 
              size={32} 
              color={`var(--color-${getResultColor()})`} 
              strokeWidth={2}
            />
          </div>

          <h2 className={`
            font-heading font-bold text-2xl mb-2
            text-${getResultColor()}
          `}>
            {getResultTitle()}
          </h2>

          <p className="text-text-secondary">
            {getResultMessage()}
          </p>
        </div>

        {/* ELO Changes */}
        {eloChanges && (
          <div className="p-6 border-b border-border">
            <h3 className="font-heading font-semibold text-lg mb-4 text-center">
              Rating Changes
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg">
                <span className="text-text-secondary">Your Rating:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-data font-medium text-text-primary">
                    {eloChanges.oldRating}
                  </span>
                  <Icon name="ArrowRight" size={16} color="var(--color-text-secondary)" />
                  <span className="font-data font-bold text-text-primary">
                    {eloChanges.newRating}
                  </span>
                  <span className={`
                    font-data font-bold text-sm
                    ${eloChanges.change >= 0 ? 'text-success' : 'text-error'}
                  `}>
                    ({eloChanges.change >= 0 ? '+' : ''}{eloChanges.change})
                  </span>
                </div>
              </div>

              {opponent && (
                <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden">
                      <Image 
                        src={opponent.avatar} 
                        alt={opponent.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-text-secondary">{opponent.name}:</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-data font-medium text-text-primary">
                      {eloChanges.opponentOldRating}
                    </span>
                    <Icon name="ArrowRight" size={16} color="var(--color-text-secondary)" />
                    <span className="font-data font-bold text-text-primary">
                      {eloChanges.opponentNewRating}
                    </span>
                    <span className={`
                      font-data font-bold text-sm
                      ${eloChanges.opponentChange >= 0 ? 'text-success' : 'text-error'}
                    `}>
                      ({eloChanges.opponentChange >= 0 ? '+' : ''}{eloChanges.opponentChange})
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Game Stats */}
        {gameStats && (
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-lg">
                Game Statistics
              </h3>
              <Button
                variant="ghost"
                onClick={() => setShowStats(!showStats)}
                iconName={showStats ? "ChevronUp" : "ChevronDown"}
                iconSize={16}
                className="p-1 h-auto"
              />
            </div>

            {showStats && (
              <div className="space-y-3 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-surface-secondary rounded-lg">
                    <div className="font-data text-2xl font-bold text-text-primary">
                      {gameStats.duration}
                    </div>
                    <div className="text-sm text-text-secondary">Duration</div>
                  </div>
                  
                  <div className="text-center p-3 bg-surface-secondary rounded-lg">
                    <div className="font-data text-2xl font-bold text-text-primary">
                      {gameStats.totalMoves}
                    </div>
                    <div className="text-sm text-text-secondary">Total Moves</div>
                  </div>
                </div>

                <div className="p-3 bg-surface-secondary rounded-lg">
                  <div className="text-sm text-text-secondary mb-2">Move History:</div>
                  <div className="text-xs font-data text-text-primary">
                    {gameStats.moveHistory.join(' → ')}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="primary"
              onClick={handleRematch}
              iconName="RotateCcw"
              iconPosition="left"
              fullWidth
            >
              Rematch
            </Button>
            
            <Button
              variant="secondary"
              onClick={handleNewGame}
              iconName="Play"
              iconPosition="left"
              fullWidth
            >
              New Game
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={handleBackToDashboard}
            iconName="Home"
            iconPosition="left"
            fullWidth
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameEndModal;