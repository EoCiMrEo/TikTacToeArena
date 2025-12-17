import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RankingFilters = ({ 
  selectedPeriod = 'all-time',
  selectedTier = 'all',
  onPeriodChange = () => {},
  onTierChange = () => {},
  onRefresh = () => {},
  isRefreshing = false
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const timePeriods = [
    { value: 'all-time', label: 'All Time', icon: 'Calendar' },
    { value: 'monthly', label: 'This Month', icon: 'CalendarDays' },
    { value: 'weekly', label: 'This Week', icon: 'CalendarRange' },
    { value: 'daily', label: 'Today', icon: 'Clock' }
  ];

  const rankTiers = [
    { value: 'all', label: 'All Tiers', icon: 'Users', color: 'text-text-primary' },
    { value: 'expert', label: 'Expert (2000+)', icon: 'Crown', color: 'text-error' },
    { value: 'advanced', label: 'Advanced (1500+)', icon: 'Award', color: 'text-warning' },
    { value: 'intermediate', label: 'Intermediate (1000+)', icon: 'Medal', color: 'text-secondary' },
    { value: 'beginner', label: 'Beginner (<1000)', icon: 'Star', color: 'text-primary' }
  ];

  const getSelectedPeriodLabel = () => {
    return timePeriods.find(period => period.value === selectedPeriod)?.label || 'All Time';
  };

  const getSelectedTierLabel = () => {
    return rankTiers.find(tier => tier.value === selectedTier)?.label || 'All Tiers';
  };

  const renderFilterButton = (items, selectedValue, onChange, label) => (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setShowFilters(!showFilters)}
        iconName="ChevronDown"
        iconPosition="right"
        className="w-full sm:w-auto"
      >
        {label}
      </Button>
      
      {showFilters && (
        <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-lg shadow-lg z-50 min-w-[200px]">
          <div className="py-2">
            {items.map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  onChange(item.value);
                  setShowFilters(false);
                }}
                className={`
                  w-full flex items-center space-x-3 px-4 py-2 text-left transition-colors duration-150
                  ${selectedValue === item.value 
                    ? 'bg-primary-50 text-primary' :'hover:bg-surface-secondary text-text-primary'
                  }
                `}
              >
                <Icon 
                  name={item.icon} 
                  size={16} 
                  color={selectedValue === item.value ? 'var(--color-primary)' : item.color || 'var(--color-text-secondary)'} 
                />
                <span className="font-medium">{item.label}</span>
                {selectedValue === item.value && (
                  <Icon name="Check" size={16} color="var(--color-primary)" className="ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-surface rounded-lg border border-border p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 flex-1">
          {/* Time Period Filter */}
          <div className="relative">
            <div className="flex items-center space-x-2 mb-1">
              <Icon name="Calendar" size={16} color="var(--color-text-secondary)" />
              <span className="text-sm font-medium text-text-secondary">Period</span>
            </div>
            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => onPeriodChange(e.target.value)}
                className="appearance-none bg-surface border border-border rounded-lg px-3 py-2 pr-8 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {timePeriods.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <Icon name="ChevronDown" size={16} color="var(--color-text-secondary)" />
              </div>
            </div>
          </div>

          {/* Rank Tier Filter */}
          <div className="relative">
            <div className="flex items-center space-x-2 mb-1">
              <Icon name="Trophy" size={16} color="var(--color-text-secondary)" />
              <span className="text-sm font-medium text-text-secondary">Tier</span>
            </div>
            <div className="relative">
              <select
                value={selectedTier}
                onChange={(e) => onTierChange(e.target.value)}
                className="appearance-none bg-surface border border-border rounded-lg px-3 py-2 pr-8 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {rankTiers.map((tier) => (
                  <option key={tier.value} value={tier.value}>
                    {tier.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <Icon name="ChevronDown" size={16} color="var(--color-text-secondary)" />
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        <div className="flex items-center space-x-2">
          {selectedPeriod !== 'all-time' && (
            <span className="inline-flex items-center space-x-1 px-2 py-1 bg-primary-100 text-primary text-xs font-medium rounded-full">
              <Icon name="Calendar" size={12} />
              <span>{getSelectedPeriodLabel()}</span>
              <button
                onClick={() => onPeriodChange('all-time')}
                className="hover:text-primary-700 transition-colors duration-150"
              >
                <Icon name="X" size={12} />
              </button>
            </span>
          )}
          
          {selectedTier !== 'all' && (
            <span className="inline-flex items-center space-x-1 px-2 py-1 bg-secondary-100 text-secondary text-xs font-medium rounded-full">
              <Icon name="Trophy" size={12} />
              <span>{getSelectedTierLabel()}</span>
              <button
                onClick={() => onTierChange('all')}
                className="hover:text-secondary-700 transition-colors duration-150"
              >
                <Icon name="X" size={12} />
              </button>
            </span>
          )}
        </div>

        {/* Refresh Button */}
        <Button
          variant="ghost"
          onClick={onRefresh}
          disabled={isRefreshing}
          iconName="RotateCcw"
          className={`${isRefreshing ? 'animate-spin' : ''}`}
          aria-label="Refresh rankings"
        >
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Filter Summary */}
      <div className="mt-3 pt-3 border-t border-border-tertiary">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">
            Showing {getSelectedTierLabel().toLowerCase()} rankings for {getSelectedPeriodLabel().toLowerCase()}
          </span>
          <span className="text-text-tertiary">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RankingFilters;