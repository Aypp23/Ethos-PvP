import React, { useState, useEffect, useRef, useCallback } from 'react';
import { searchProfiles } from '../services/ethosApi';
import { SearchResult } from '../types';

interface SearchDropdownProps {
  id?: string;
  onProfileSelect: (profile: SearchResult) => void;
  placeholder?: string;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({ 
  id, 
  onProfileSelect, 
  placeholder = "Search for a user..." 
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [debounceTimeout, setDebounceTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Don't clear cache on mount - let each instance work independently
  useEffect(() => {
    console.log(`${id || 'unknown'}: SearchDropdown initialized`);
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    // Cancel previous request
    if (abortController) {
      abortController.abort();
    }

    const newAbortController = new AbortController();
    setAbortController(newAbortController);

    setLoading(true);
    setIsOpen(true);

    try {
      const searchResults = await searchProfiles(searchQuery);
      if (!newAbortController.signal.aborted) {
        setResults(searchResults);
        setSelectedIndex(-1);
      }
    } catch (error) {
      if (!newAbortController.signal.aborted) {
        console.error('Search error:', error);
        setResults([]);
      }
    } finally {
      if (!newAbortController.signal.aborted) {
        setLoading(false);
      }
    }
  }, [abortController]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // Clear previous timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      performSearch(newQuery);
    }, newQuery.length >= 3 ? 150 : 0); // Faster for longer queries

    setDebounceTimeout(timeout);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleProfileSelect(results[selectedIndex]);
        } else {
          // If no item is selected, try to perform exact search
          performExactSearch();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const performExactSearch = async () => {
    if (query.length < 3) return;

    setLoading(true);
    try {
      const searchResults = await searchProfiles(query);
      const exactMatch = searchResults.find(
        profile => profile.username.toLowerCase() === query.toLowerCase()
      );
      
      if (exactMatch) {
        handleProfileSelect(exactMatch);
      } else {
        // If no exact match found, just show the search results
        setResults(searchResults);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Exact search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSelect = (profile: SearchResult) => {
    setQuery(profile.username);
    setIsOpen(false);
    setSelectedIndex(-1);
    onProfileSelect(profile);
  };

  const handleSearchClick = () => {
    performExactSearch();
  };

  const isSearchButtonDisabled = query.length < 3 || loading;

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (query.length >= 3 && results.length > 0) {
                setIsOpen(true);
              }
            }}
            placeholder={placeholder}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent text-text-dark placeholder-gray-500"
          />
          
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-800"></div>
            </div>
          )}
        </div>
        
        <button
          onClick={handleSearchClick}
          disabled={isSearchButtonDisabled}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            isSearchButtonDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gray-800 text-white hover:bg-gray-900 active:scale-95'
          }`}
        >
          Search
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.length > 0 ? (
            <div className="py-2">
              {results.map((profile, index) => (
                <div
                  key={profile.id}
                  onClick={() => handleProfileSelect(profile)}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? 'bg-gray-100'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={profile.avatarUrl || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png'}
                      alt={profile.displayName}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <p className="text-text-dark font-medium truncate">
                          {profile.displayName}
                        </p>
                      </div>
                      <p className="text-gray-500 text-sm truncate">
                        @{profile.username}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-text-dark font-bold text-sm">
                        {profile.score}
                      </div>
                      <div className="text-gray-500 text-xs">
                        Score
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-gray-500 text-lg">No results found</p>
              <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchDropdown; 