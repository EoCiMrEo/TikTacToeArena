import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';

const GameLobby = ({ 
  currentUser,
  opponent,
  gameSettings,
  onReady,
  onCancel,
  onStartGame 
}) => {
  const [isReady, setIsReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);

  // Mock chat messages
  const initialMessages = [
    {
      id: 1,
      sender: 'system',
      message: 'Match found! Get ready to play.',
      timestamp: new Date(Date.now() - 5000)
    }
  ];

  useEffect(() => {
    setChatMessages(initialMessages);
  }, []);

  useEffect(() => {
    // Simulate opponent readying up after some time
    const timer = setTimeout(() => {
      setOpponentReady(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isReady && opponentReady && countdown === null) {
      setCountdown(5);
    }
  }, [isReady, opponentReady, countdown]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      onStartGame();
    }
  }, [countdown, onStartGame]);

  const handleReady = () => {
    setIsReady(!isReady);
    onReady(!isReady);
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        id: Date.now(),
        sender: 'you',
        message: chatMessage.trim(),
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, newMessage]);
      setChatMessage('');
    }
  };

  const handleEmojiReaction = (emoji) => {
    const newMessage = {
      id: Date.now(),
      sender: 'you',
      message: emoji,
      timestamp: new Date(),
      isEmoji: true
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  const renderPlayerCard = (player, isCurrentUser = false, ready = false) => (
    <div className={`
      bg-surface border-2 rounded-lg p-4 transition-all duration-300
      ${ready ? 'border-success bg-success-50' : 'border-border'}
    `}>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Image
            src={player.avatar}
            alt={`${player.username}'s avatar`}
            className="w-16 h-16 rounded-full object-cover"
          />
          {ready && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success rounded-full flex items-center justify-center">
              <Icon name="Check" size={14} color="white" />
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-heading font-semibold text-text-primary">
              {player.username}
            </h3>
            {isCurrentUser && (
              <span className="text-xs bg-primary-100 text-primary px-2 py-1 rounded-full">
                You
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4 mt-1 text-sm text-text-secondary">
            <div className="flex items-center space-x-1">
              <Icon name="Trophy" size={14} />
              <span className="font-data">{player.elo}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-success">{player.wins}W</span>
              <span>/</span>
              <span className="text-error">{player.losses}L</span>
            </div>
          </div>
          
          <div className="mt-2">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                player.status === 'online' ? 'bg-success animate-pulse' : 'bg-text-tertiary'
              }`} />
              <span className="text-xs text-text-secondary capitalize">
                {player.status}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {ready && (
        <div className="mt-3 flex items-center justify-center space-x-2 text-success">
          <Icon name="CheckCircle" size={16} />
          <span className="text-sm font-medium">Ready to play!</span>
        </div>
      )}
    </div>
  );

  const renderGameSettings = () => (
    <div className="bg-surface-secondary rounded-lg p-4">
      <h3 className="font-heading font-semibold text-text-primary mb-3 text-center">
        Game Settings
      </h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Game Speed:</span>
          <span className="text-text-primary capitalize font-medium">
            {gameSettings.speed}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Time per Move:</span>
          <span className="text-text-primary font-medium">
            {gameSettings.timePerMove}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">You play as:</span>
          <div className="flex items-center space-x-2">
            <span className="text-text-primary font-bold text-lg">
              {gameSettings.playerSymbol}
            </span>
            <span className="text-text-secondary">
              ({gameSettings.playerSymbol === 'X' ? 'First' : 'Second'})
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">ELO Stakes:</span>
          <span className="text-accent font-data font-medium">
            ±{gameSettings.eloStakes}
          </span>
        </div>
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="bg-surface border border-border rounded-lg">
      <div className="p-3 border-b border-border">
        <h3 className="font-heading font-semibold text-text-primary text-sm">
          Pre-game Chat
        </h3>
      </div>
      
      <div className="h-32 overflow-y-auto p-3 space-y-2">
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`
            text-xs ${msg.sender === 'system' ? 'text-center text-text-tertiary' : ''}
          `}>
            {msg.sender === 'system' ? (
              <span>{msg.message}</span>
            ) : (
              <div className={`flex ${msg.sender === 'you' ? 'justify-end' : 'justify-start'}`}>
                <div className={`
                  max-w-[80%] px-2 py-1 rounded-lg
                  ${msg.sender === 'you' ?'bg-primary text-white' :'bg-surface-secondary text-text-primary'
                  }
                  ${msg.isEmoji ? 'text-lg' : ''}
                `}>
                  {msg.message}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="p-3 border-t border-border space-y-2">
        <div className="flex space-x-2">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Say something nice..."
            className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleSendMessage}
            disabled={!chatMessage.trim()}
            iconName="Send"
          />
        </div>
        
        <div className="flex items-center justify-center space-x-2">
          {['👍', '😊', '🔥', '💪', '🎯'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiReaction(emoji)}
              className="text-lg hover:scale-110 transition-transform duration-150"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCountdown = () => {
    if (countdown === null) return null;

    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-200 flex items-center justify-center">
        <div className="bg-surface rounded-lg p-8 text-center shadow-lg">
          <h3 className="font-heading font-bold text-2xl text-text-primary mb-4">
            Game Starting In
          </h3>
          <div className="text-6xl font-bold text-primary mb-4 animate-pulse">
            {countdown}
          </div>
          <p className="text-text-secondary">
            Get ready to play!
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="font-heading font-bold text-xl text-text-primary mb-2">
          Game Lobby
        </h2>
        <p className="text-text-secondary">
          Match found! Prepare for battle.
        </p>
      </div>

      {/* Players */}
      <div className="space-y-4">
        {renderPlayerCard(currentUser, true, isReady)}
        
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2 text-text-secondary">
            <div className="h-px bg-border flex-1 w-8" />
            <span className="text-sm font-medium">VS</span>
            <div className="h-px bg-border flex-1 w-8" />
          </div>
        </div>
        
        {renderPlayerCard(opponent, false, opponentReady)}
      </div>

      {/* Game Settings */}
      {renderGameSettings()}

      {/* Chat */}
      {renderChat()}

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          variant={isReady ? "success" : "primary"}
          size="lg"
          fullWidth
          onClick={handleReady}
          iconName={isReady ? "CheckCircle" : "Play"}
          iconPosition="left"
          disabled={countdown !== null}
        >
          {isReady ? 'Ready!' : 'Ready Up'}
        </Button>
        
        <Button
          variant="outline"
          size="md"
          fullWidth
          onClick={onCancel}
          iconName="X"
          iconPosition="left"
          disabled={countdown !== null}
        >
          Cancel Match
        </Button>
      </div>

      {/* Status */}
      {!isReady && !opponentReady && (
        <p className="text-center text-sm text-text-secondary">
          Both players must ready up to start the game
        </p>
      )}
      
      {isReady && !opponentReady && (
        <p className="text-center text-sm text-warning">
          Waiting for opponent to ready up...
        </p>
      )}
      
      {!isReady && opponentReady && (
        <p className="text-center text-sm text-success">
          Your opponent is ready! Click "Ready Up" to start.
        </p>
      )}

      {/* Countdown Overlay */}
      {renderCountdown()}
    </div>
  );
};

export default GameLobby;