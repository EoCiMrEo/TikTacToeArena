import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const SocialLoginOptions = () => {
  const navigate = useNavigate();
  const [loadingProvider, setLoadingProvider] = useState(null);

  const socialProviders = [
    {
      id: 'google',
      name: 'Google',
      icon: 'Chrome',
      color: 'var(--color-error)',
      bgColor: 'bg-error-50 hover:bg-error-100',
      textColor: 'text-error-700'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: 'Facebook',
      color: 'var(--color-primary)',
      bgColor: 'bg-primary-50 hover:bg-primary-100',
      textColor: 'text-primary-700'
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: 'MessageSquare',
      color: 'var(--color-secondary)',
      bgColor: 'bg-secondary-50 hover:bg-secondary-100',
      textColor: 'text-secondary-700'
    }
  ];

  const handleSocialLogin = async (provider) => {
    setLoadingProvider(provider.id);

    try {
      // Simulate social login API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock successful social login
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', `user@${provider.id}.com`);
      localStorage.setItem('loginProvider', provider.id);
      
      navigate('/game-dashboard');
    } catch (error) {
      console.error(`${provider.name} login failed:`, error);
      alert(`${provider.name} login failed. Please try again.`);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border-secondary" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-surface text-text-secondary">
            Or continue with
          </span>
        </div>
      </div>

      {/* Social Login Buttons */}
      <div className="grid grid-cols-1 gap-3">
        {socialProviders.map((provider) => (
          <Button
            key={provider.id}
            variant="outline"
            size="lg"
            fullWidth
            onClick={() => handleSocialLogin(provider)}
            disabled={loadingProvider !== null}
            loading={loadingProvider === provider.id}
            className={`
              ${provider.bgColor} border-transparent transition-all duration-150
              ${provider.textColor} hover:shadow-sm
            `}
          >
            <div className="flex items-center justify-center space-x-3">
              {loadingProvider === provider.id ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icon 
                  name={provider.icon} 
                  size={20} 
                  color={provider.color}
                />
              )}
              <span className="font-medium">
                {loadingProvider === provider.id 
                  ? `Connecting to ${provider.name}...` 
                  : `Continue with ${provider.name}`
                }
              </span>
            </div>
          </Button>
        ))}
      </div>

      {/* Security Notice */}
      <div className="bg-surface-secondary rounded-lg p-4 mt-6">
        <div className="flex items-start space-x-3">
          <Icon name="Shield" size={20} color="var(--color-success)" />
          <div>
            <p className="text-sm font-medium text-text-primary">Secure Authentication</p>
            <p className="text-xs text-text-secondary mt-1">
              Your social login is secured with industry-standard OAuth 2.0 protocols. 
              We never store your social media passwords.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialLoginOptions;