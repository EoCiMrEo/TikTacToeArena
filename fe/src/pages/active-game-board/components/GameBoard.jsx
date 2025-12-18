import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const GameBoard = ({ 
  gameState = [], 
  currentPlayer = 'X', 
  isMyTurn = false, 
  onCellClick = () => {},
  gameStatus = 'active',
  winningCells = [],
  disabled = false,
  boardSize = 13
}) => {
  const [animatingCell, setAnimatingCell] = useState(null);
  const [lastMove, setLastMove] = useState(null);

  useEffect(() => {
    // Track last move for animation
    const newMove = gameState.findIndex((cell, index) => 
      cell !== null && (lastMove === null || gameState[lastMove] !== cell)
    );
    if (newMove !== -1 && newMove !== lastMove) {
      setLastMove(newMove);
      setAnimatingCell(newMove);
      setTimeout(() => setAnimatingCell(null), 300);
    }
  }, [gameState, lastMove]);

  const handleCellClick = (index) => {
    if (disabled || !isMyTurn || gameState[index] !== null || gameStatus !== 'active') {
      // Show invalid move feedback
      setAnimatingCell(index);
      setTimeout(() => setAnimatingCell(null), 200);
      return;
    }
    onCellClick(index);
  };

  const renderCellContent = (value, index) => {
    if (!value) return null;

    const isWinningCell = winningCells.includes(index);
    const isAnimating = animatingCell === index;
    const iconSize = boardSize > 10 ? 16 : 48; // Smaller icons for large board

    return (
      <div className={`
        flex items-center justify-center w-full h-full
        ${isAnimating ? 'animate-scale-in' : ''}
        ${isWinningCell ? 'animate-pulse' : ''}
      `}>
        {value === 'X' ? (
          <Icon 
            name="X" 
            size={iconSize} 
            color={isWinningCell ? 'var(--color-success)' : 'var(--color-primary)'} 
            strokeWidth={3}
            className="drop-shadow-sm"
          />
        ) : (
          <Icon 
            name="Circle" 
            size={iconSize} 
            color={isWinningCell ? 'var(--color-success)' : 'var(--color-secondary)'} 
            strokeWidth={3}
            className="drop-shadow-sm"
          />
        )}
      </div>
    );
  };

  const getCellClassName = (index) => {
    const baseClasses = `
      game-cell relative cursor-pointer select-none
      transition-all duration-150 ease-out
      flex items-center justify-center
      border border-border/30
    `;
    // Removed min-h to allow dense grid to fit
    
    const stateClasses = `
      ${gameState[index] !== null ? 'cursor-not-allowed' : ''}
      ${!isMyTurn || disabled ? 'cursor-not-allowed opacity-75' : ''}
      ${animatingCell === index && gameState[index] === null ? 'bg-error-50 scale-95' : ''}
      ${winningCells.includes(index) ? 'bg-success-50 ring-1 ring-success z-10' : ''}
    `;

    const interactiveClasses = `
      ${isMyTurn && gameState[index] === null && !disabled ? 
        'hover:bg-primary-50 hover:scale-105 active:scale-95 z-10' : ''}
    `;

    return `${baseClasses} ${stateClasses} ${interactiveClasses}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Game Status Indicator */}
      <div className="text-center mb-4">
        <div className={`
          inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium
          ${gameStatus === 'active' ? 'bg-success-50 text-success' : 
            gameStatus === 'ended'? 'bg-text-secondary/10 text-text-secondary' : 'bg-warning-50 text-warning'}
        `}>
          {gameStatus === 'active' && (
            <>
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span>{isMyTurn ? 'Your Turn' : 'Opponent\'s Turn'}</span>
            </>
          )}
          {gameStatus === 'ended' && (
            <>
              <Icon name="Flag" size={16} />
              <span>Game Ended</span>
            </>
          )}
          {gameStatus === 'waiting' && (
            <>
              <div className="w-2 h-2 bg-warning rounded-full pulse-slow" />
              <span>Waiting for opponent...</span>
            </>
          )}
          {gameStatus === 'abandoned' && (
            <>
              <Icon name="AlertTriangle" size={16} />
              <span>Game Abandoned</span>
            </>
          )}
        </div>
      </div>

      {/* Game Board Grid */}
      <div className="aspect-square w-full p-2 bg-surface rounded-xl border-2 border-border shadow-lg">
        <div 
            className="grid w-full h-full gap-[1px] bg-border/20"
            style={{ 
                gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${boardSize}, minmax(0, 1fr))`
            }}
        >
            {gameState.map((cell, index) => (
            <button
                key={index}
                onClick={() => handleCellClick(index)}
                className={getCellClassName(index) + " bg-surface"} // Ensure cells have background to cover gap gap
                disabled={disabled || !isMyTurn || gameState[index] !== null}
                aria-label={`Cell ${index + 1}, ${cell || 'empty'}`}
            >
                {renderCellContent(cell, index)}
                
                {/* Turn Preview (Simplified for performance on large grid) */}
                {!cell && isMyTurn && !disabled && gameStatus === 'active' && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-20 bg-primary/10 transition-opacity">
                   {/* No icon for preview on large grid to avoid clutter, just highlight */}
                </div>
                )}
            </button>
            ))}
        </div>
      </div>

      {/* Move Counter */}
      <div className="text-center mt-4">
        <span className="text-sm text-text-secondary">
          Move {gameState.filter(cell => cell !== null).length} of {boardSize * boardSize}
        </span>
      </div>
    </div>
  );
};

export default GameBoard;