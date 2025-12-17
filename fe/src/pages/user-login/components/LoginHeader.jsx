import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const LoginHeader = () => {
  const navigate = useNavigate();

  const handleSignUpRedirect = () => {
    navigate('/user-registration');
  };

  return (
    <div className="text-center space-y-6">
      {/* Welcome Message */}
      <div className="space-y-2">
        <h1 className="font-heading font-bold text-2xl text-text-primary">
          Welcome Back!
        </h1>
        <p className="text-text-secondary">
          Sign in to continue your gaming journey and climb the leaderboards
        </p>
      </div>

      {/* Quick Stats Preview */}
      <div className="grid grid-cols-3 gap-4 py-4">
        <div className="text-center">
          <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Icon name="Users" size={20} color="var(--color-primary)" />
          </div>
          <p className="text-xs font-medium text-text-primary">2,847</p>
          <p className="text-xs text-text-secondary">Active Players</p>
        </div>
        
        <div className="text-center">
          <div className="w-10 h-10 bg-success-50 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Icon name="Gamepad2" size={20} color="var(--color-success)" />
          </div>
          <p className="text-xs font-medium text-text-primary">15,234</p>
          <p className="text-xs text-text-secondary">Games Today</p>
        </div>
        
        <div className="text-center">
          <div className="w-10 h-10 bg-accent-50 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Icon name="Trophy" size={20} color="var(--color-accent)" />
          </div>
          <p className="text-xs font-medium text-text-primary">892</p>
          <p className="text-xs text-text-secondary">Tournaments</p>
        </div>
      </div>

      {/* Sign Up Prompt */}
      <div className="bg-surface-secondary rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="text-sm font-medium text-text-primary">New to TicTacToe Arena?</p>
            <p className="text-xs text-text-secondary">Join thousands of players worldwide</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSignUpRedirect}
            iconName="UserPlus"
            iconPosition="left"
          >
            Sign Up
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginHeader;