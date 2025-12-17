import React from 'react';
import AuthenticationWrapper from '../../components/ui/AuthenticationWrapper';
import LoginHeader from './components/LoginHeader';
import LoginForm from './components/LoginForm';
import SocialLoginOptions from './components/SocialLoginOptions';

const UserLogin = () => {
  return (
    <AuthenticationWrapper 
      title="Sign In to Your Account"
      showToggle={true}
    >
      <div className="space-y-8">
        {/* Header Section */}
        <LoginHeader />

        {/* Login Form */}
        <LoginForm />

        {/* Social Login Options */}
        <SocialLoginOptions />
      </div>
    </AuthenticationWrapper>
  );
};

export default UserLogin;