import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const LoginForm = () => {
  const navigate = useNavigate();
  const { signIn, authError, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
      const result = await signIn(formData.email, formData.password);
      
      if (result?.success) {
        navigate('/game-dashboard');
      }
    } catch (error) {
      console.log('Login form error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
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
            placeholder="Enter your password"
            className={`w-full ${formErrors.password ? 'border-error focus:border-error' : ''}`}
            disabled={isSubmitting}
          />
          {formErrors.password && (
            <p className="mt-1 text-sm text-error">{formErrors.password}</p>
          )}
        </div>

        {/* Forgot Password Link */}
        <div className="text-right">
          <Link 
            to="/forgot-password"
            className="text-sm text-primary hover:text-primary-hover transition-colors duration-200"
          >
            Forgot your password?
          </Link>
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
              <span>Signing In...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Icon name="LogIn" size={20} />
              <span>Sign In</span>
            </div>
          )}
        </Button>

        {/* Register Link */}
        <div className="text-center">
          <p className="text-sm text-text-secondary">
            Don't have an account?{' '}
            <Link 
              to="/user-registration"
              className="text-primary hover:text-primary-hover font-medium transition-colors duration-200"
            >
              Create Account
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;