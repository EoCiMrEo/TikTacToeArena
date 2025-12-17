import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import userProfileService from '../../utils/userProfileService';
import GameContextHeader from '../../components/ui/GameContextHeader';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfileData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        // Load detailed stats which includes profile data
        const statsResult = await userProfileService.getPlayerStats(user.id);
        
        if (isMounted) {
          if (statsResult.success) {
            setProfile(statsResult.data);
            setStats(statsResult.data);
          } else {
            setError(statsResult.error);
          }
        }
      } catch (err) {
        if (isMounted) setError('Failed to load profile');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProfileData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/user-login');
  };

  const handleEditProfile = () => {
    // Navigate to edit profile or open modal
    console.log('Edit profile clicked');
  };

  const getEloRankColor = (elo) => {
    if (elo >= 2000) return 'text-purple-600';
    if (elo >= 1800) return 'text-blue-600';
    if (elo >= 1600) return 'text-green-600';
    if (elo >= 1400) return 'text-yellow-600';
    if (elo >= 1200) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
            <Icon name="AlertCircle" size={32} />
          </div>
          <h2 className="text-xl font-bold text-text-primary">Failed to load profile</h2>
          <p className="text-text-secondary">{error}</p>
          <Button onClick={() => window.location.reload()} variant="primary" className="w-full">
            Retry
          </Button>
          <Button onClick={() => navigate('/')} variant="ghost" className="w-full">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <GameContextHeader title="Profile" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Profile Header Card */}
        <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
              {/* Avatar */}
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center text-primary text-3xl font-bold border-4 border-surface shadow-lg">
                {profile?.username?.charAt(0)?.toUpperCase()}
              </div>
              
              <div className="text-center sm:text-left space-y-1">
                <h1 className="text-2xl font-bold text-text-primary">{profile?.username}</h1>
                <p className="text-text-secondary">{user?.email}</p>
                <div className="flex items-center justify-center sm:justify-start space-x-2 pt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold bg-surface-secondary ${getEloRankColor(profile?.elo_rating || 1200)}`}>
                    {profile?.elo_rating || 1200} ELO
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-surface-secondary text-text-secondary">
                    Rank #UserRank
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-2 w-full sm:w-auto">
              {/* Actions */}
              <Button 
                onClick={handleEditProfile} 
                variant="secondary" 
                size="sm"
                iconName="Edit"
                className="w-full sm:w-auto"
              >
                Edit Profile
              </Button>
               <Button 
                onClick={handleSignOut} 
                variant="ghost" 
                size="sm"
                iconName="LogOut"
                className="w-full sm:w-auto text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface p-4 rounded-xl border border-border text-center">
            <div className="text-3xl font-bold text-text-primary">{stats?.games_played || 0}</div>
            <div className="text-xs text-text-secondary uppercase tracking-wider mt-1">Games Played</div>
          </div>
          <div className="bg-surface p-4 rounded-xl border border-border text-center">
            <div className="text-3xl font-bold text-success">{stats?.games_won || 0}</div>
            <div className="text-xs text-text-secondary uppercase tracking-wider mt-1">Wins</div>
          </div>
           <div className="bg-surface p-4 rounded-xl border border-border text-center">
            <div className="text-3xl font-bold text-text-secondary">{stats?.games_drawn || 0}</div>
             <div className="text-xs text-text-secondary uppercase tracking-wider mt-1">Draws</div>
          </div>
          <div className="bg-surface p-4 rounded-xl border border-border text-center">
            <div className="text-3xl font-bold text-red-500">{stats?.games_lost || 0}</div>
            <div className="text-xs text-text-secondary uppercase tracking-wider mt-1">Losses</div>
          </div>
        </div>

        {/* Detailed Stats & Win Rate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface rounded-2xl border border-border p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center">
              <Icon name="Activity" className="mr-2 text-primary" size={20} />
              Performance
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-secondary">Win Rate</span>
                  <span className="font-semibold text-text-primary">{stats?.win_rate || '0.0'}%</span>
                </div>
                <div className="w-full bg-surface-secondary rounded-full h-2">
                  <div 
                    className="bg-success h-2 rounded-full" 
                    style={{ width: `${Math.min(parseFloat(stats?.win_rate || 0), 100)}%` }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                 <div className="p-3 bg-surface-secondary rounded-lg text-center">
                    <div className="text-xl font-bold text-warning">{stats?.win_streak || 0}</div>
                    <div className="text-xs text-text-secondary">Current Streak</div>
                 </div>
                 <div className="p-3 bg-surface-secondary rounded-lg text-center">
                    <div className="text-xl font-bold text-primary">{stats?.best_win_streak || 0}</div>
                     <div className="text-xs text-text-secondary">Best Streak</div>
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-border p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center">
              <Icon name="Clock" className="mr-2 text-primary" size={20} />
              Recent Activity
            </h3>
            {/* Stub for recent games */}
            <div className="space-y-3">
               <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg border border-transparent hover:border-border transition-colors">
                  <div className="flex items-center space-x-3">
                     <div className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">W</div>
                     <div>
                       <div className="text-sm font-medium text-text-primary">vs. Opponent</div>
                       <div className="text-xs text-text-secondary">Ranked Match</div>
                     </div>
                  </div>
                  <span className="text-green-600 font-semibold text-sm">+15 ELO</span>
               </div>
               {/* Empty state if no games */}
               <div className="text-center py-4 text-text-secondary text-sm">
                  View full history (Coming Soon)
               </div>
            </div>
          </div>
        </div>
      </main>
      
      <BottomTabNavigation activeGameCount={0} unreadNotifications={0} userRank={0} />
    </div>
  );
};

export default UserProfile;
