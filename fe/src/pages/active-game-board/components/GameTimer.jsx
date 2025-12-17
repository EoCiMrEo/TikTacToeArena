import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const GameTimer = ({ 
  timeRemaining = 30, 
  totalTime = 30, 
  isActive = false, 
  onTimeUp = () => {},
  urgencyThreshold = 10,
  warningThreshold = 5
}) => {
  const [displayTime, setDisplayTime] = useState(timeRemaining);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    setDisplayTime(timeRemaining);
    setIsUrgent(timeRemaining <= urgencyThreshold && timeRemaining > warningThreshold);
    setIsWarning(timeRemaining <= warningThreshold);

    if (timeRemaining === 0 && isActive) {
      onTimeUp();
    }
  }, [timeRemaining, isActive, urgencyThreshold, warningThreshold, onTimeUp]);

  const getProgressPercentage = () => {
    return Math.max(0, (displayTime / totalTime) * 100);
  };

  const getTimerColor = () => {
    if (isWarning) return 'var(--color-error)';
    if (isUrgent) return 'var(--color-warning)';
    return 'var(--color-success)';
  };

  const getBackgroundColor = () => {
    if (isWarning) return 'bg-error-50';
    if (isUrgent) return 'bg-warning-50';
    return 'bg-success-50';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`
      flex items-center justify-center space-x-3 px-4 py-3 rounded-lg border
      ${getBackgroundColor()}
      ${isWarning ? 'border-error animate-pulse' : isUrgent ?'border-warning' : 'border-success'}
      transition-all duration-300 ease-out
    `}>
      {/* Timer Icon */}
      <div className="relative">
        <Icon 
          name="Clock" 
          size={24} 
          color={getTimerColor()} 
          strokeWidth={2}
        />
        
        {/* Urgency Indicator */}
        {(isUrgent || isWarning) && (
          <div className={`
            absolute -top-1 -right-1 w-3 h-3 rounded-full
            ${isWarning ? 'bg-error animate-ping' : 'bg-warning pulse-slow'}
          `} />
        )}
      </div>

      {/* Time Display */}
      <div className="flex flex-col items-center">
        <div className={`
          font-data text-2xl font-bold
          ${isWarning ? 'text-error' : isUrgent ?'text-warning' : 'text-success'}
          ${isWarning ? 'animate-pulse' : ''}
        `}>
          {formatTime(displayTime)}
        </div>
        
        {/* Status Text */}
        <div className="text-xs font-medium text-text-secondary">
          {isActive ? 'Time Remaining' : 'Paused'}
        </div>
      </div>

      {/* Progress Ring */}
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
          {/* Background Circle */}
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-border opacity-30"
          />
          
          {/* Progress Circle */}
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke={getTimerColor()}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 20}`}
            strokeDashoffset={`${2 * Math.PI * 20 * (1 - getProgressPercentage() / 100)}`}
            className="transition-all duration-300 ease-out"
          />
        </svg>
        
        {/* Center Percentage */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`
            text-xs font-bold
            ${isWarning ? 'text-error' : isUrgent ?'text-warning' : 'text-success'}
          `}>
            {Math.round(getProgressPercentage())}%
          </span>
        </div>
      </div>

      {/* Warning Messages */}
      {isWarning && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <div className="bg-error text-white text-xs font-medium px-2 py-1 rounded shadow-lg animate-bounce">
            Time's almost up!
          </div>
        </div>
      )}
    </div>
  );
};

export default GameTimer;