import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const NotificationCard = ({ notifications, onMarkAsRead, onAcceptChallenge, onDeclineChallenge }) => {
  const [expandedNotifications, setExpandedNotifications] = useState(new Set());

  const toggleExpanded = (notificationId) => {
    const newExpanded = new Set(expandedNotifications);
    if (newExpanded.has(notificationId)) {
      newExpanded.delete(notificationId);
    } else {
      newExpanded.add(notificationId);
    }
    setExpandedNotifications(newExpanded);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'challenge': return 'Swords';
      case 'game-result': return 'Trophy';
      case 'rank-change': return 'TrendingUp';
      case 'friend-request': return 'UserPlus';
      case 'system': return 'Bell';
      default: return 'Info';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'challenge': return 'var(--color-warning)';
      case 'game-result': return 'var(--color-success)';
      case 'rank-change': return 'var(--color-primary)';
      case 'friend-request': return 'var(--color-secondary)';
      case 'system': return 'var(--color-text-secondary)';
      default: return 'var(--color-text-secondary)';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (notifications.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-lg text-text-primary">Notifications</h3>
          <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
            <Icon name="Bell" size={18} color="var(--color-primary)" />
          </div>
        </div>
        
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="Bell" size={24} color="var(--color-text-tertiary)" />
          </div>
          <p className="text-text-secondary">No notifications</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="font-heading font-semibold text-lg text-text-primary">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-error text-white text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
          <Icon name="Bell" size={18} color="var(--color-primary)" />
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {notifications.slice(0, 4).map((notification) => (
          <div 
            key={notification.id}
            className={`p-3 rounded-lg border transition-colors duration-150 ${
              notification.read 
                ? 'bg-background border-border' :'bg-primary-50 border-primary-200'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                notification.read ? 'bg-background' : 'bg-white'
              }`}>
                <Icon 
                  name={getNotificationIcon(notification.type)} 
                  size={16} 
                  color={getNotificationColor(notification.type)} 
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      notification.read ? 'text-text-secondary' : 'text-text-primary'
                    }`}>
                      {notification.title}
                    </p>
                    <p className={`text-xs mt-1 ${
                      notification.read ? 'text-text-tertiary' : 'text-text-secondary'
                    }`}>
                      {expandedNotifications.has(notification.id) 
                        ? notification.message 
                        : notification.message.length > 60 
                          ? `${notification.message.substring(0, 60)}...`
                          : notification.message
                      }
                    </p>
                    
                    {notification.message.length > 60 && (
                      <button
                        onClick={() => toggleExpanded(notification.id)}
                        className="text-xs text-primary hover:text-primary-700 mt-1"
                      >
                        {expandedNotifications.has(notification.id) ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-2">
                    <span className="text-xs text-text-tertiary">
                      {formatTimeAgo(notification.timestamp)}
                    </span>
                    {!notification.read && (
                      <button
                        onClick={() => onMarkAsRead(notification.id)}
                        className="w-2 h-2 bg-primary rounded-full"
                        aria-label="Mark as read"
                      />
                    )}
                  </div>
                </div>

                {/* Challenge Actions */}
                {notification.type === 'challenge' && !notification.read && notification.challenger && (
                  <div className="flex items-center space-x-2 mt-3">
                    <Image
                      src={notification.challenger.avatar}
                      alt={`${notification.challenger.name}'s avatar`}
                      className="w-6 h-6 rounded-full"
                    />
                    <div className="flex space-x-2 flex-1">
                      <Button
                        variant="success"
                        onClick={() => onAcceptChallenge(notification.id, notification.challenger)}
                        className="text-xs h-7 flex-1"
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => onDeclineChallenge(notification.id)}
                        className="text-xs h-7 flex-1"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {notifications.length > 4 && (
        <Button 
          variant="ghost" 
          fullWidth 
          className="text-sm"
        >
          View All Notifications ({notifications.length})
        </Button>
      )}
    </div>
  );
};

export default NotificationCard;