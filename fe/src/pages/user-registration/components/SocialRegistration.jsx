import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const SocialRegistration = () => {
  const [isLoading, setIsLoading] = useState({
    google: false,
    facebook: false,
    apple: false
  });

  const handleSocialLogin = async (provider) => {
    setIsLoading(prev => ({ ...prev, [provider]: true }));
    
    // Simulate social login API call
    setTimeout(() => {
      setIsLoading(prev => ({ ...prev, [provider]: false }));
      // In a real app, this would handle the OAuth flow
      console.log(`${provider} registration initiated`);
    }, 1500);
  };

  const socialProviders = [
    {
      id: 'google',
      name: 'Google',
      icon: 'Chrome',
      color: '#4285F4',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: 'Facebook',
      color: '#1877F2',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      id: 'apple',
      name: 'Apple',
      icon: 'Apple',
      color: '#000000',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-900'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
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
            onClick={() => handleSocialLogin(provider.id)}
            loading={isLoading[provider.id]}
            disabled={Object.values(isLoading).some(loading => loading)}
            className="h-12 justify-center"
            fullWidth
          >
            <div className="flex items-center space-x-3">
              <div className={`w-5 h-5 rounded ${provider.bgColor} flex items-center justify-center`}>
                <Icon 
                  name={provider.icon} 
                  size={16} 
                  color={provider.color}
                />
              </div>
              <span className="font-medium">
                Continue with {provider.name}
              </span>
            </div>
          </Button>
        ))}
      </div>

      {/* Security Notice */}
      <div className="bg-primary-50 rounded-lg p-4 mt-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Icon name="Shield" size={20} color="var(--color-primary)" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-sm text-primary mb-1">
              Secure Registration
            </h4>
            <p className="text-xs text-primary-700 leading-relaxed">
              Your data is protected with industry-standard encryption. We never store your social media passwords.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialRegistration;