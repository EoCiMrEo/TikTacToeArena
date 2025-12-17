import React from 'react';
import AuthenticationWrapper from '../../components/ui/AuthenticationWrapper';
import RegistrationForm from './components/RegistrationForm';
import RegistrationBenefits from './components/RegistrationBenefits';
import SocialRegistration from './components/SocialRegistration';

const UserRegistration = () => {
  return (
    <AuthenticationWrapper 
      title="Create Your Account"
      showToggle={true}
    >
      <div className="space-y-6">
        {/* Registration Benefits - Mobile Only */}
        <div className="block sm:hidden">
          <RegistrationBenefits />
        </div>

        {/* Main Registration Form */}
        <RegistrationForm />

        {/* Social Registration Options */}
        <SocialRegistration />

        {/* Desktop Benefits - Hidden on Mobile */}
        <div className="hidden sm:block">
          <RegistrationBenefits />
        </div>
      </div>
    </AuthenticationWrapper>
  );
};

export default UserRegistration;