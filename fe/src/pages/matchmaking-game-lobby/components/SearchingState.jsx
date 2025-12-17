import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SearchingState = ({ 
  preferences,
  onCancel,
  estimatedWaitTime = 30,
  onlineUsersCount
}) => {
  const [searchTime, setSearchTime] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setSearchTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const dotTimer = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(dotTimer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSearchingMessages = () => {
    if (searchTime < 10) return "Looking for the perfect opponent";
    if (searchTime < 20) return "Expanding search criteria";
    if (searchTime < 30) return "Almost there, hang tight";
    return "Finding you a worthy challenger";
  };

  const renderSearchCriteria = () => (
    <div className="bg-surface-secondary rounded-lg p-4 space-y-3">
      <h3 className="font-heading font-semibold text-text-primary text-center mb-3">
        Search Criteria
      </h3>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Skill Range:</span>
          <span className="font-data text-text-primary">
            {preferences.skillRange[0]} - {preferences.skillRange[1]} ELO
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Game Speed:</span>
          <span className="text-text-primary capitalize">
            {preferences.gameSpeed}
          </span>
        </div>
        
        {preferences.inviteMode && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Friend Code:</span>
            <span className="font-data text-text-primary">
              {preferences.friendCode}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const renderSearchAnimation = () => (
    <div className="flex flex-col items-center space-y-6">
      {/* Animated Search Icon */}
      <div className="relative">
        <div className="w-20 h-20 border-4 border-primary-200 rounded-full animate-spin">
          <div className="w-4 h-4 bg-primary rounded-full absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon name="Search" size={24} color="var(--color-primary)" />
        </div>
      </div>

      {/* Search Status */}
      <div className="text-center space-y-2">
        <h3 className="font-heading font-semibold text-lg text-text-primary">
          {getSearchingMessages()}{dots}
        </h3>
        <p className="text-text-secondary">
          {preferences.inviteMode 
            ? 'Waiting for your friend to accept'
            : 'Matching you with players of similar skill'
          }
        </p>
      </div>

      {/* Timer */}
      <div className="flex items-center space-x-2 text-sm">
        <Icon name="Clock" size={16} color="var(--color-text-secondary)" />
        <span className="text-text-secondary">Search time:</span>
        <span className="font-data font-medium text-text-primary">
          {formatTime(searchTime)}
        </span>
      </div>

      {/* Estimated Wait Time */}
      {!preferences.inviteMode && (
        <div className="text-center">
          <p className="text-xs text-text-tertiary">
            Estimated wait time: ~{estimatedWaitTime}s
          </p>
          <div className="w-48 h-1 bg-border rounded-full mt-2 mx-auto overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000 ease-out"
              style={{ 
                width: `${Math.min((searchTime / estimatedWaitTime) * 100, 100)}%` 
              }}
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderOnlinePlayersCount = () => (
    <div className="flex items-center justify-center space-x-2 text-sm text-text-secondary">
      <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
      <span>{onlineUsersCount ? onlineUsersCount.toLocaleString() : '...'} players online</span>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="font-heading font-bold text-xl text-text-primary mb-2">
          {preferences.inviteMode ? 'Invitation Sent' : 'Finding Opponent'}
        </h2>
        {renderOnlinePlayersCount()}
      </div>

      {/* Search Animation */}
      {renderSearchAnimation()}

      {/* Search Criteria */}
      {renderSearchCriteria()}

      {/* Tips */}
      <div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Icon name="Lightbulb" size={20} color="var(--color-accent)" />
          <div>
            <h4 className="font-medium text-accent-800 mb-1">
              Pro Tip
            </h4>
            <p className="text-sm text-accent-700">
              {preferences.inviteMode 
                ? 'Your friend will receive a notification. Make sure they\'re online!'
                : 'Wider skill ranges typically result in faster matchmaking times.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Cancel Button */}
      <div className="pt-4">
        <Button
          variant="outline"
          size="lg"
          fullWidth
          onClick={onCancel}
          iconName="X"
          iconPosition="left"
        >
          Cancel Search
        </Button>
      </div>
    </div>
  );
};

export default SearchingState;