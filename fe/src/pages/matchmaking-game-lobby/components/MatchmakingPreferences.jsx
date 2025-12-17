import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const MatchmakingPreferences = ({ 
  onStartMatchmaking,
  isSearching = false 
}) => {
  const [skillRange, setSkillRange] = useState([1200, 1800]);
  const [gameSpeed, setGameSpeed] = useState('standard');
  const [friendCode, setFriendCode] = useState('');
  const [inviteMode, setInviteMode] = useState(false);

  const gameSpeedOptions = [
    {
      id: 'blitz',
      name: 'Blitz',
      description: '30 seconds per move',
      icon: 'Zap',
      color: 'text-error'
    },
    {
      id: 'standard',
      name: 'Standard',
      description: '2 minutes per move',
      icon: 'Clock',
      color: 'text-primary'
    },
    {
      id: 'extended',
      name: 'Extended',
      description: '5 minutes per move',
      icon: 'Timer',
      color: 'text-secondary'
    }
  ];

  const handleSkillRangeChange = (index, value) => {
    const newRange = [...skillRange];
    newRange[index] = parseInt(value);
    
    // Ensure min doesn't exceed max and vice versa
    if (index === 0 && newRange[0] > newRange[1]) {
      newRange[1] = newRange[0];
    } else if (index === 1 && newRange[1] < newRange[0]) {
      newRange[0] = newRange[1];
    }
    
    setSkillRange(newRange);
  };

  const handleStartMatchmaking = () => {
    const preferences = {
      skillRange,
      gameSpeed,
      friendCode: inviteMode ? friendCode : null,
      inviteMode
    };
    onStartMatchmaking(preferences);
  };

  const renderSkillRangeSlider = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-text-primary">
          Opponent Skill Range
        </h3>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Icon name="Target" size={16} />
          <span>{skillRange[0]} - {skillRange[1]} ELO</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-text-secondary min-w-[60px]">
            Min ELO
          </label>
          <input
            type="range"
            min="800"
            max="2400"
            value={skillRange[0]}
            onChange={(e) => handleSkillRangeChange(0, e.target.value)}
            className="flex-1 h-2 bg-border rounded-lg appearance-none cursor-pointer slider"
          />
          <span className="text-sm font-data text-text-primary min-w-[50px]">
            {skillRange[0]}
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-text-secondary min-w-[60px]">
            Max ELO
          </label>
          <input
            type="range"
            min="800"
            max="2400"
            value={skillRange[1]}
            onChange={(e) => handleSkillRangeChange(1, e.target.value)}
            className="flex-1 h-2 bg-border rounded-lg appearance-none cursor-pointer slider"
          />
          <span className="text-sm font-data text-text-primary min-w-[50px]">
            {skillRange[1]}
          </span>
        </div>
      </div>
    </div>
  );

  const renderGameSpeedSelection = () => (
    <div className="space-y-4">
      <h3 className="font-heading font-semibold text-text-primary">
        Game Speed
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {gameSpeedOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setGameSpeed(option.id)}
            className={`
              p-4 rounded-lg border-2 transition-all duration-200 text-left
              ${gameSpeed === option.id 
                ? 'border-primary bg-primary-50' :'border-border bg-surface hover:border-border-secondary'
              }
            `}
          >
            <div className="flex items-center space-x-3 mb-2">
              <Icon 
                name={option.icon} 
                size={20} 
                color={gameSpeed === option.id ? 'var(--color-primary)' : 'var(--color-text-secondary)'}
              />
              <span className={`font-medium ${
                gameSpeed === option.id ? 'text-primary' : 'text-text-primary'
              }`}>
                {option.name}
              </span>
            </div>
            <p className="text-sm text-text-secondary">
              {option.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderFriendInvite = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-text-primary">
          Play with Friend
        </h3>
        <button
          onClick={() => setInviteMode(!inviteMode)}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${inviteMode ? 'bg-primary' : 'bg-border-secondary'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${inviteMode ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>
      
      {inviteMode && (
        <div className="space-y-3 animate-fade-in">
          <Input
            type="text"
            placeholder="Enter friend's game code"
            value={friendCode}
            onChange={(e) => setFriendCode(e.target.value)}
            className="font-data"
          />
          <p className="text-xs text-text-secondary">
            Ask your friend to share their game code from their profile
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="font-heading font-bold text-xl text-text-primary mb-2">
          Find Your Match
        </h2>
        <p className="text-text-secondary">
          Set your preferences and find the perfect opponent
        </p>
      </div>

      {/* Preferences */}
      <div className="space-y-8">
        {renderSkillRangeSlider()}
        {renderGameSpeedSelection()}
        {renderFriendInvite()}
      </div>

      {/* Start Matchmaking Button */}
      <div className="pt-4">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleStartMatchmaking}
          disabled={isSearching || (inviteMode && !friendCode.trim())}
          loading={isSearching}
          iconName={isSearching ? undefined : "Search"}
          iconPosition="left"
        >
          {isSearching ? 'Searching...' : inviteMode ? 'Send Invite' : 'Find Opponent'}
        </Button>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: var(--color-primary);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: var(--color-primary);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
};

export default MatchmakingPreferences;