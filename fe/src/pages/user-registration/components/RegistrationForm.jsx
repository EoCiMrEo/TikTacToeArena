import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const RegistrationForm = () => {
  const navigate = useNavigate();
  const { signUp, authError, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    fullName: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters';
    }

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signUp(formData.email, formData.password, {
        username: formData.username,
        full_name: formData.fullName
      });
      
      if (result?.success) {
        // Show success message and redirect to login
        navigate('/user-login', { 
          state: { 
            message: 'Account created successfully! Please check your email to verify your account.' 
          }
        });
      }
    } catch (error) {
      console.log('Registration form error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Full Name Input */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-text-primary mb-2">
            Full Name
          </label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleInputChange}
            placeholder="Enter your full name"
            className={`w-full ${formErrors.fullName ? 'border-error focus:border-error' : ''}`}
            disabled={isSubmitting}
          />
          {formErrors.fullName && (
            <p className="mt-1 text-sm text-error">{formErrors.fullName}</p>
          )}
        </div>

        {/* Username Input */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-text-primary mb-2">
            Username
          </label>
          <Input
            id="username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleInputChange}
            placeholder="Choose a username"
            className={`w-full ${formErrors.username ? 'border-error focus:border-error' : ''}`}
            disabled={isSubmitting}
          />
          {formErrors.username && (
            <p className="mt-1 text-sm text-error">{formErrors.username}</p>
          )}
        </div>

        {/* Email Input */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
            Email Address
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email"
            className={`w-full ${formErrors.email ? 'border-error focus:border-error' : ''}`}
            disabled={isSubmitting}
          />
          {formErrors.email && (
            <p className="mt-1 text-sm text-error">{formErrors.email}</p>
          )}
        </div>

        {/* Password Input */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Create a password"
            className={`w-full ${formErrors.password ? 'border-error focus:border-error' : ''}`}
            disabled={isSubmitting}
          />
          {formErrors.password && (
            <p className="mt-1 text-sm text-error">{formErrors.password}</p>
          )}
        </div>

        {/* Confirm Password Input */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Confirm your password"
            className={`w-full ${formErrors.confirmPassword ? 'border-error focus:border-error' : ''}`}
            disabled={isSubmitting}
          />
          {formErrors.confirmPassword && (
            <p className="mt-1 text-sm text-error">{formErrors.confirmPassword}</p>
          )}
        </div>

        {/* Auth Error Display */}
        {authError && (
          <div className="p-4 bg-error-50 border border-error-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Icon name="AlertCircle" size={20} color="var(--color-error)" />
              <span className="text-sm text-error font-medium">{authError}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={isSubmitting || loading}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Creating Account...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Icon name="UserPlus" size={20} />
              <span>Create Account</span>
            </div>
          )}
        </Button>

        {/* Terms and Privacy */}
        <div className="text-center">
          <p className="text-xs text-text-secondary">
            By creating an account, you agree to our{' '}
            <Link to="/terms" className="text-primary hover:text-primary-hover">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary hover:text-primary-hover">
              Privacy Policy
            </Link>
          </p>
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-sm text-text-secondary">
            Already have an account?{' '}
            <Link 
              to="/user-login"
              className="text-primary hover:text-primary-hover font-medium transition-colors duration-200"
            >
              Sign In
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm;