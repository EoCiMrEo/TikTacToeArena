import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Image from '../../../components/AppImage';

const PlayerSearchBar = ({ 
  onSearch = () => {},
  suggestions = [],
  isLoading = false,
  placeholder = "Search players...",
  onPlayerSelect = () => {}
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, onSearch]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(value.length > 0 && suggestions.length > 0);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handlePlayerSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        searchRef.current?.blur();
        break;
    }
  };

  const handlePlayerSelect = (player) => {
    setQuery(player.username);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onPlayerSelect(player);
  };

  const clearSearch = () => {
    setQuery('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onSearch('');
    searchRef.current?.focus();
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-accent-100 text-accent-800 font-medium">
          {part}
        </span>
      ) : part
    );
  };

  const renderSuggestion = (player, index) => {
    const isSelected = index === selectedIndex;
    
    return (
      <div
        key={player.id}
        className={`
          flex items-center space-x-3 px-4 py-3 cursor-pointer transition-colors duration-150
          ${isSelected ? 'bg-primary-50 text-primary' : 'hover:bg-surface-secondary'}
        `}
        onClick={() => handlePlayerSelect(player)}
        onMouseEnter={() => setSelectedIndex(index)}
      >
        <div className="relative flex-shrink-0">
          <Image
            src={player.avatar}
            alt={`${player.username}'s avatar`}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className={`
            absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-surface
            ${player.isOnline ? 'bg-success' : 'bg-text-tertiary'}
          `} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-text-primary truncate">
            {highlightMatch(player.displayName || player.username, query)}
          </div>
          <div className="text-sm text-text-secondary truncate">
            @{highlightMatch(player.username, query)}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 flex-shrink-0">
          <div className="text-right">
            <div className="font-data text-sm font-semibold text-text-primary">
              {player.elo.toLocaleString()}
            </div>
            <div className="text-xs text-text-secondary">
              Rank #{player.rank}
            </div>
          </div>
          <Icon name="ChevronRight" size={16} color="var(--color-text-tertiary)" />
        </div>
      </div>
    );
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-text-tertiary border-t-transparent rounded-full animate-spin" />
          ) : (
            <Icon name="Search" size={20} color="var(--color-text-secondary)" />
          )}
        </div>
        
        <Input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(query.length > 0 && suggestions.length > 0)}
          className="pl-10 pr-10"
          autoComplete="off"
        />
        
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-text-primary transition-colors duration-150"
            aria-label="Clear search"
          >
            <Icon name="X" size={20} color="var(--color-text-secondary)" />
          </button>
        )}
      </div>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          <div className="py-2">
            {suggestions.slice(0, 8).map((player, index) => renderSuggestion(player, index))}
          </div>
          
          {suggestions.length > 8 && (
            <div className="border-t border-border-tertiary px-4 py-2 text-center">
              <span className="text-sm text-text-secondary">
                Showing 8 of {suggestions.length} results
              </span>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {showSuggestions && suggestions.length === 0 && query.length > 0 && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg z-50">
          <div className="px-4 py-6 text-center">
            <Icon name="SearchX" size={32} color="var(--color-text-tertiary)" className="mx-auto mb-2" />
            <p className="text-sm text-text-secondary">
              No players found for "{query}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerSearchBar;