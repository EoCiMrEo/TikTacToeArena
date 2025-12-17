import axios from 'axios';

// API URLs from environment variables
const AUTH_API_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:5001/auth';
// Create axios instances with credentials support
const authClient = axios.create({
  baseURL: AUTH_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Simple event emitter for auth state changes
let authListeners = [];
const notifyListeners = (event, session) => {
  authListeners.forEach(callback => callback(event, session));
};

const authService = {
  // Sign in with email and password
  signIn: async (email, password) => {
    try {
      const response = await authClient.post('/login', { email, password });
      const { user } = response.data;
      
      // Notify listeners
      notifyListeners('SIGNED_IN', { user });
      
      return { success: true, data: { user } };
    } catch (error) {
      console.error('Sign in error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed';
      return { success: false, error: errorMessage };
    }
  },

  // Sign up with email and password
  signUp: async (email, password, userData = {}) => {
    try {
      const response = await authClient.post('/register', { 
        email, 
        password,
        username: userData.username 
      });
      
      // Note: Registration might not auto-login depending on backend.
      // Backend returns { message, user_id }.
      // Usually users need to verify email first.
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Sign up error:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed';
      return { success: false, error: errorMessage };
    }
  },

  // Sign out
  signOut: async () => {
    try {
      await authClient.post('/logout');
      notifyListeners('SIGNED_OUT', null);
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if backend fails, clear local state
      notifyListeners('SIGNED_OUT', null);
      return { success: false, error: 'Logout failed' };
    }
  },

  // Resend verification email
  resendVerification: async (email) => {
    try {
      await authClient.post('/resend-verification', { email });
      return { success: true };
    } catch (error) {
      console.error('Resend verification error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to resend email';
      return { success: false, error: errorMessage };
    }
  },

  // Get current session
  getSession: async () => {
    try {
      const response = await authClient.get('/me');
      const { user } = response.data;
      
      // Match the structure expected by AuthContext (data.session.user)
      return { 
        success: true, 
        data: { 
          session: { user } 
        } 
      };
    } catch (error) {
      // If unauthorized, just return no session
      if (error.response && error.response.status === 401) {
        return { success: false, error: 'No active session' };
      }
      return { success: false, error: 'Failed to get session' };
    }
  },



  // Reset password - NOT YET IMPLEMENTED IN BACKEND
  resetPassword: async (email) => {
    // Placeholder or call legacy Supabase if needed?
    // For now, return error or mock success
    return { success: false, error: 'Password reset not yet implemented.' };
  },

  // Listen for auth state changes - Mock implementation for AuthContext
  onAuthStateChange: (callback) => {
    authListeners.push(callback);
    
    // Return unsubscribe function
    return {
      data: {
        subscription: {
          unsubscribe: () => {
             authListeners = authListeners.filter(cb => cb !== callback);
          }
        }
      }
    };
  }
};

export default authService;