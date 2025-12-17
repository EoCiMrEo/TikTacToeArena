import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickActionsCard = ({ onFindMatch, onChallengeFriend, onViewStats }) => {
  const navigate = useNavigate();

  const quickActions = [
    {
      id: 'find-match',
      title: 'Find Match',
      description: 'Quick matchmaking with players of similar skill',
      icon: 'Search',
      color: 'primary',
      action: () => {
        onFindMatch();
        navigate('/matchmaking-game-lobby');
      }
    },
    {
      id: 'challenge-friend',
      title: 'Challenge Friend',
      description: 'Send a game invitation to a friend',
      icon: 'UserPlus',
      color: 'secondary',
      action: onChallengeFriend
    },
    {
      id: 'view-rankings',
      title: 'View Rankings',
      description: 'Check leaderboards and your position',
      icon: 'Trophy',
      color: 'accent',
      action: () => navigate('/rankings-leaderboard')
    },
    {
      id: 'full-stats',
      title: 'Full Statistics',
      description: 'Detailed performance analytics',
      icon: 'BarChart3',
      color: 'success',
      action: () => {
        onViewStats();
        navigate('/user-profile');
      }
    }
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      primary: {
        bg: 'bg-primary-50',
        icon: 'var(--color-primary)',
        button: 'primary'
      },
      secondary: {
        bg: 'bg-secondary-50',
        icon: 'var(--color-secondary)',
        button: 'secondary'
      },
      accent: {
        bg: 'bg-accent-50',
        icon: 'var(--color-accent)',
        button: 'warning'
      },
      success: {
        bg: 'bg-success-50',
        icon: 'var(--color-success)',
        button: 'success'
      }
    };
    return colorMap[color] || colorMap.primary;
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-semibold text-lg text-text-primary">Quick Actions</h3>
        <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
          <Icon name="Zap" size={18} color="var(--color-primary)" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickActions.map((action) => {
          const colors = getColorClasses(action.color);
          
          return (
            <div 
              key={action.id}
              className="p-4 border border-border rounded-lg hover:shadow-sm transition-shadow duration-150"
            >
              <div className="flex items-start space-x-3 mb-3">
                <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon name={action.icon} size={20} color={colors.icon} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-heading font-semibold text-text-primary text-sm mb-1">
                    {action.title}
                  </h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {action.description}
                  </p>
                </div>
              </div>
              
              <Button
                variant={colors.button}
                fullWidth
                onClick={action.action}
                className="text-sm h-8"
              >
                {action.title}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActionsCard;