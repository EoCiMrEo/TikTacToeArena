import React from 'react';
import Icon from '../../../components/AppIcon';

const RegistrationBenefits = () => {
  const benefits = [
    {
      id: 1,
      icon: 'Zap',
      title: 'Instant Matchmaking',
      description: 'Get matched with players of similar skill level in seconds',
      color: 'var(--color-primary)'
    },
    {
      id: 2,
      icon: 'Trophy',
      title: 'Competitive Rankings',
      description: 'Climb the leaderboard with our ELO rating system',
      color: 'var(--color-accent)'
    },
    {
      id: 3,
      icon: 'BarChart3',
      title: 'Detailed Statistics',
      description: 'Track your wins, losses, and improvement over time',
      color: 'var(--color-secondary)'
    },
    {
      id: 4,
      icon: 'Users',
      title: 'Global Community',
      description: 'Play against thousands of players worldwide',
      color: 'var(--color-success)'
    }
  ];

  return (
    <div className="bg-surface-secondary rounded-lg p-6 mb-6">
      <div className="text-center mb-6">
        <h3 className="font-heading font-semibold text-lg text-text-primary mb-2">
          Join the Arena
        </h3>
        <p className="text-sm text-text-secondary">
          Experience competitive tic-tac-toe like never before
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {benefits.map((benefit) => (
          <div key={benefit.id} className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <Icon 
                name={benefit.icon} 
                size={18} 
                color={benefit.color}
                strokeWidth={2.5}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-text-primary mb-1">
                {benefit.title}
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                {benefit.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-6 border-t border-border-tertiary">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="font-heading font-bold text-lg text-primary">10K+</div>
            <div className="text-xs text-text-secondary">Active Players</div>
          </div>
          <div>
            <div className="font-heading font-bold text-lg text-secondary">50K+</div>
            <div className="text-xs text-text-secondary">Games Played</div>
          </div>
          <div>
            <div className="font-heading font-bold text-lg text-accent">24/7</div>
            <div className="text-xs text-text-secondary">Online Gaming</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationBenefits;