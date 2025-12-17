import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

const BottomTabNavigation = ({ 
  activeGameCount = 0, 
  unreadNotifications = 0,
  userRank = null 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/game-dashboard',
      icon: 'LayoutDashboard',
      activeIcon: 'LayoutDashboard',
      badge: unreadNotifications > 0 ? unreadNotifications : null,
      tooltip: 'View your game statistics and recent matches'
    },
    {
      id: 'play',
      label: 'Play',
      path: '/matchmaking-game-lobby',
      icon: 'Play',
      activeIcon: 'Play',
      badge: activeGameCount > 0 ? activeGameCount : null,
      tooltip: 'Find opponents and start new games'
    },
    {
      id: 'rankings',
      label: 'Rankings',
      path: '/rankings-leaderboard',
      icon: 'Trophy',
      activeIcon: 'Trophy',
      badge: userRank && userRank <= 10 ? 'TOP' : null,
      tooltip: 'View leaderboards and your competitive ranking'
    },
    {
      id: 'profile',
      label: 'Profile',
      path: '/user-profile',
      icon: 'User',
      activeIcon: 'User',
      badge: null,
      tooltip: 'Manage your account and view personal statistics'
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide navigation when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    // Don't hide navigation during active gameplay
    if (location.pathname === '/active-game-board') {
      setIsVisible(false);
      return;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, location.pathname]);

  const isActiveTab = (path) => {
    if (path === '/matchmaking-game-lobby') {
      return location.pathname === '/matchmaking-game-lobby' || location.pathname === '/active-game-board';
    }
    return location.pathname === path;
  };

  const handleTabClick = (item) => {
    // Haptic feedback for mobile devices
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    
    navigate(item.path);
  };

  const renderBadge = (badge) => {
    if (!badge) return null;

    const isNumeric = typeof badge === 'number';
    const displayValue = isNumeric && badge > 99 ? '99+' : badge;

    return (
      <div className={`
        absolute -top-1 -right-1 min-w-[18px] h-[18px] 
        ${isNumeric ? 'bg-error' : 'bg-accent'} 
        text-white text-xs font-bold rounded-full 
        flex items-center justify-center px-1
        animate-scale-in
      `}>
        {displayValue}
      </div>
    );
  };

  const renderTabIcon = (item, isActive) => (
    <div className="relative">
      <Icon 
        name={isActive ? item.activeIcon : item.icon}
        size={24}
        color={isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)'}
        strokeWidth={isActive ? 2.5 : 2}
      />
      {renderBadge(item.badge)}
    </div>
  );

  // Don't render during authentication flows
  if (location.pathname === '/user-login' || location.pathname === '/user-registration') {
    return null;
  }

  return (
    <>
      {/* Bottom Navigation */}
      <nav 
        className={`
          fixed bottom-0 left-0 right-0 z-100 bg-surface/95 backdrop-blur-md 
          border-t border-border transition-transform duration-300 ease-out
          ${isVisible ? 'translate-y-0' : 'translate-y-full'}
          pb-safe
        `}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-around h-16">
            {navigationItems.map((item) => {
              const isActive = isActiveTab(item.path);
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item)}
                  className={`
                    nav-tab min-w-0 flex-1 relative group
                    ${isActive ? 'active' : ''}
                    focus-game
                  `}
                  aria-label={item.tooltip}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {renderTabIcon(item, isActive)}
                  
                  <span className={`
                    mt-1 text-xs font-medium transition-colors duration-150
                    ${isActive ? 'text-primary' : 'text-text-secondary'}
                  `}>
                    {item.label}
                  </span>

                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                  )}

                  {/* Tooltip for desktop */}
                  <div className="tooltip group-hover:show bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden lg:block">
                    {item.tooltip}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content from being hidden behind fixed navigation */}
      <div className="h-16 pb-safe" />
    </>
  );
};

export default BottomTabNavigation;