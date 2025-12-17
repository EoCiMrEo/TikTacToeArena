import React, { createContext, useContext, useEffect, useState } from "react";
import authService from "../utils/authService";
import userProfileService from "../utils/userProfileService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setAuthError(null);

        const sessionResult = await authService.getSession();

        if (
          sessionResult?.success &&
          sessionResult?.data?.session?.user &&
          isMounted
        ) {
          const authUser = sessionResult.data.session.user;
          setUser(authUser);

          // Fetch user profile
          const { data: profileData, error: profileError } = await userProfileService.getProfile(authUser.id);

          if (!profileError && isMounted) {
            setUserProfile(profileData);
          } else if (isMounted) {
            setAuthError(profileError || "Failed to load user profile");
          }
        }
      } catch (error) {
        if (isMounted) {
          setAuthError("Failed to initialize authentication");
          console.log("Auth initialization error:", error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      setAuthError(null);

      if (event === "SIGNED_IN" && session?.user) {
        console.log("AuthContext: User signed in", session.user.id);
        if (session.access_token) {
             console.log("AuthContext: Access Token present");
             session.user.access_token = session.access_token; // Ensure it's attached for context consumers
        } else {
             console.warn("AuthContext: No Access Token in session!");
        }
        setUser(session.user);

        // Fetch user profile for signed in user
        authService.getUserProfile(session.user.id).then((profileResult) => {
          if (profileResult?.success && isMounted) {
            setUserProfile(profileResult.data);
          } else if (isMounted) {
            setAuthError(profileResult?.error || "Failed to load user profile");
          }
        });
      } else if (event === "SIGNED_OUT") {
        console.log("AuthContext: User signed out");
        setUser(null);
        setUserProfile(null);
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        console.log("AuthContext: Token refreshed");
        if (session.access_token) {
            session.user.access_token = session.access_token;
        }
        setUser(session.user);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  // Sign in function
  const signIn = async (email, password) => {
    try {
      setAuthError(null);
      const result = await authService.signIn(email, password);

      if (!result?.success) {
        setAuthError(result?.error || "Login failed");
        return { success: false, error: result?.error };
      }

      return { success: true, data: result.data };
    } catch (error) {
      const errorMsg = "Something went wrong during login. Please try again.";
      setAuthError(errorMsg);
      console.log("Sign in error:", error);
      return { success: false, error: errorMsg };
    }
  };

  // Sign up function
  const signUp = async (email, password, userData = {}) => {
    try {
      setAuthError(null);
      const result = await authService.signUp(email, password, userData);

      if (!result?.success) {
        setAuthError(result?.error || "Signup failed");
        return { success: false, error: result?.error };
      }

      return { success: true, data: result.data };
    } catch (error) {
      const errorMsg = "Something went wrong during signup. Please try again.";
      setAuthError(errorMsg);
      console.log("Sign up error:", error);
      return { success: false, error: errorMsg };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setAuthError(null);
      const result = await authService.signOut();

      if (!result?.success) {
        setAuthError(result?.error || "Logout failed");
        return { success: false, error: result?.error };
      }

      return { success: true };
    } catch (error) {
      const errorMsg = "Something went wrong during logout. Please try again.";
      setAuthError(errorMsg);
      console.log("Sign out error:", error);
      return { success: false, error: errorMsg };
    }
  };

  // Update profile function
  const updateProfile = async (updates) => {
    try {
      setAuthError(null);

      if (!user?.id) {
        const errorMsg = "User not authenticated";
        setAuthError(errorMsg);
        return { success: false, error: errorMsg };
      }

      setUserProfile(result.data);
      return { success: true, data: result.data };
    } catch (error) {
      const errorMsg =
        "Something went wrong updating profile. Please try again.";
      setAuthError(errorMsg);
      console.log("Update profile error:", error);
      return { success: false, error: errorMsg };
    }
  };

  // Reset password function
  const resetPassword = async (email) => {
    try {
      setAuthError(null);
      const result = await authService.resetPassword(email);

      if (!result?.success) {
        setAuthError(result?.error || "Password reset failed");
        return { success: false, error: result?.error };
      }

      return { success: true };
    } catch (error) {
      const errorMsg =
        "Something went wrong sending reset email. Please try again.";
      setAuthError(errorMsg);
      console.log("Reset password error:", error);
      return { success: false, error: errorMsg };
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    authError,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPassword,
    clearError: () => setAuthError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;