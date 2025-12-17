import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const ConnectionStatus = ({ 
  isConnected = true, 
  latency = 0, 
  onReconnect = () => {},
  reconnectAttempts = 0,
  maxReconnectAttempts = 5
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    if (!isConnected && reconnectAttempts < maxReconnectAttempts) {
      setIsReconnecting(true);
      const timer = setTimeout(() => {
        setIsReconnecting(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, reconnectAttempts, maxReconnectAttempts]);

  const getConnectionQuality = () => {
    if (!isConnected) return { label: 'Disconnected', color: 'error', icon: 'WifiOff' };
    if (latency < 50) return { label: 'Excellent', color: 'success', icon: 'Wifi' };
    if (latency < 100) return { label: 'Good', color: 'success', icon: 'Wifi' };
    if (latency < 200) return { label: 'Fair', color: 'warning', icon: 'Wifi' };
    return { label: 'Poor', color: 'error', icon: 'Wifi' };
  };

  const handleReconnect = () => {
    if (!isReconnecting && reconnectAttempts < maxReconnectAttempts) {
      onReconnect();
    }
  };

  const quality = getConnectionQuality();

  if (isConnected && latency < 100) {
    // Don't show status for good connections
    return null;
  }

  return (
    <div className={`
      fixed top-20 right-4 z-50 bg-surface border border-border rounded-lg shadow-lg
      transition-all duration-300 ease-out
      ${showDetails ? 'w-64' : 'w-auto'}
    `}>
      <div className="p-3">
        {/* Connection Status Header */}
        <div 
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => setShowDetails(!showDetails)}
        >
          <div className={`
            w-3 h-3 rounded-full
            ${quality.color === 'success' ? 'bg-success animate-pulse' :
              quality.color === 'warning'? 'bg-warning pulse-slow' : 'bg-error animate-ping'}
          `} />
          
          <Icon 
            name={quality.icon} 
            size={16} 
            color={`var(--color-${quality.color})`} 
          />
          
          <span className={`
            text-sm font-medium
            text-${quality.color}
          `}>
            {quality.label}
          </span>

          <Icon 
            name={showDetails ? "ChevronUp" : "ChevronDown"} 
            size={14} 
            color="var(--color-text-secondary)" 
          />
        </div>

        {/* Connection Details */}
        {showDetails && (
          <div className="mt-3 space-y-3 animate-fade-in">
            {/* Latency */}
            {isConnected && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Latency:</span>
                <span className={`
                  font-data font-medium
                  ${latency < 100 ? 'text-success' : 
                    latency < 200 ? 'text-warning' : 'text-error'}
                `}>
                  {latency}ms
                </span>
              </div>
            )}

            {/* Reconnection Status */}
            {!isConnected && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Attempts:</span>
                  <span className="font-medium text-text-primary">
                    {reconnectAttempts}/{maxReconnectAttempts}
                  </span>
                </div>

                {isReconnecting ? (
                  <div className="flex items-center space-x-2 text-sm text-warning">
                    <div className="w-4 h-4 border-2 border-warning border-t-transparent rounded-full animate-spin" />
                    <span>Reconnecting...</span>
                  </div>
                ) : (
                  <button
                    onClick={handleReconnect}
                    disabled={reconnectAttempts >= maxReconnectAttempts}
                    className={`
                      w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150
                      ${reconnectAttempts >= maxReconnectAttempts
                        ? 'bg-text-tertiary text-white cursor-not-allowed' :'bg-primary text-white hover:bg-primary-600 focus-game'
                      }
                    `}
                  >
                    {reconnectAttempts >= maxReconnectAttempts 
                      ? 'Max attempts reached' :'Reconnect'
                    }
                  </button>
                )}
              </div>
            )}

            {/* Connection Tips */}
            {!isConnected && (
              <div className="text-xs text-text-secondary bg-surface-secondary p-2 rounded">
                <div className="font-medium mb-1">Connection Tips:</div>
                <ul className="space-y-1">
                  <li>• Check your internet connection</li>
                  <li>• Refresh the page if issues persist</li>
                  <li>• Contact support if problem continues</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;