import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';

const AuthenticationWrapper = ({ 
  children,
  showToggle = true,
  title = 'Welcome to TicTacToe Arena'
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const isLoginPage = location.pathname === '/user-login';
  const isRegistrationPage = location.pathname === '/user-registration';

  const handleToggleAuth = async () => {
    setIsLoading(true);
    
    // Simulate navigation delay for smooth transition
    setTimeout(() => {
      if (isLoginPage) {
        navigate('/user-registration');
      } else {
        navigate('/user-login');
      }
      setIsLoading(false);
    }, 150);
  };

  const renderLogo = () => (
    <div className="flex items-center justify-center space-x-3 mb-8">
      <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-game">
        <Icon name="Grid3X3" size={28} color="white" strokeWidth={2.5} />
      </div>
      <div className="text-center">
        <h1 className="font-heading font-bold text-2xl text-text-primary">
          TicTacToe Arena
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Competitive Gaming Platform
        </p>
      </div>
    </div>
  );

  const renderAuthToggle = () => {
    if (!showToggle) return null;

    return (
      <div className="flex items-center justify-center space-x-2 mb-6">
        <span className="text-sm text-text-secondary">
          {isLoginPage ? "Don't have an account?" : "Already have an account?"}
        </span>
        <Button
          variant="link"
          onClick={handleToggleAuth}
          disabled={isLoading}
          className="text-sm font-medium p-0 h-auto"
        >
          {isLoginPage ? 'Sign Up' : 'Sign In'}
        </Button>
      </div>
    );
  };

  const renderFeatureHighlights = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div className="text-center p-4 bg-surface rounded-lg border border-border">
        <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Icon name="Zap" size={20} color="var(--color-primary)" />
        </div>
        <h3 className="font-heading font-semibold text-sm text-text-primary mb-1">
          Real-time Play
        </h3>
        <p className="text-xs text-text-secondary">
          Instant matchmaking and live gameplay
        </p>
      </div>

      <div className="text-center p-4 bg-surface rounded-lg border border-border">
        <div className="w-10 h-10 bg-secondary-50 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Icon name="Trophy" size={20} color="var(--color-secondary)" />
        </div>
        <h3 className="font-heading font-semibold text-sm text-text-primary mb-1">
          Competitive Ranks
        </h3>
        <p className="text-xs text-text-secondary">
          ELO-based ranking system
        </p>
      </div>

      <div className="text-center p-4 bg-surface rounded-lg border border-border">
        <div className="w-10 h-10 bg-accent-50 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Icon name="BarChart3" size={20} color="var(--color-accent)" />
        </div>
        <h3 className="font-heading font-semibold text-sm text-text-primary mb-1">
          Detailed Stats
        </h3>
        <p className="text-xs text-text-secondary">
          Track your progress and improvement
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-surface border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4">
          {renderLogo()}
          {title && (
            <div className="text-center mb-4">
              <h2 className="font-heading font-semibold text-lg text-text-primary">
                {title}
              </h2>
            </div>
          )}
          {renderAuthToggle()}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <div className="max-w-md mx-auto w-full px-4 py-6 flex-1">
          {/* Feature highlights for registration page */}
          {isRegistrationPage && renderFeatureHighlights()}
          
          {/* Auth Form Content */}
          <div className="bg-surface rounded-lg border border-border p-6 shadow-sm">
            {children}
          </div>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-2">
            <div className="flex items-center justify-center space-x-4 text-xs text-text-secondary">
              <button className="hover:text-text-primary transition-colors duration-150">
                Privacy Policy
              </button>
              <span>•</span>
              <button className="hover:text-text-primary transition-colors duration-150">
                Terms of Service
              </button>
              <span>•</span>
              <button className="hover:text-text-primary transition-colors duration-150">
                Support
              </button>
            </div>
            <p className="text-xs text-text-tertiary">
              © 2024 TicTacToe Arena. All rights reserved.
            </p>
          </div>
        </div>
      </main>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-200 flex items-center justify-center">
          <div className="bg-surface rounded-lg p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium text-text-primary">
                Loading...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthenticationWrapper;