import React, { useState, useEffect, useRef } from 'react';
import { SearchResult } from '../types';
import { searchProfiles } from '../services/ethosApi';
import { Search, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProfile: (profile: SearchResult) => void;
  title: string;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({
  isOpen,
  onClose,
  onSelectProfile,
  title
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const searchResults = await searchProfiles(query);
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectProfile(results[selectedIndex]);
    }
  };

  const handleSelectProfile = (profile: SearchResult) => {
    onSelectProfile(profile);
    setQuery('');
    setResults([]);
    setSelectedIndex(-1);
    onClose();
  };

    return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[400px] bg-gradient-light p-0 flex flex-col">
        <SheetHeader className="border-b pb-4 p-6">
          <SheetTitle className="text-xl font-bold text-text-dark flex items-center gap-2">
            <Search className="w-5 h-5" />
            {title}
          </SheetTitle>
          <SheetDescription className="text-sm text-gray-600">
            Find and add Ethos profiles to compare their performance stats
          </SheetDescription>
        </SheetHeader>

        <div className="p-6 flex flex-col flex-1">
          {/* Search Input */}
          <div className="relative mb-6 flex-shrink-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search for a username"
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-text-dark placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
              ) : null}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
            <div
              className={`transition-all duration-300 ease-in-out transform space-y-3 ${
                results.length > 0 ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1'
              }`}
            >
              {results.length > 0 ? (
                results.map((profile, index) => (
                  <button
                    key={profile.username}
                    onClick={() => handleSelectProfile(profile)}
                    className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                      index === selectedIndex
                        ? 'bg-gray-100 text-text-dark'
                        : 'bg-white text-text-dark hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full mr-3 overflow-hidden">
                      <img 
                        src={profile.avatarUrl || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png'} 
                        alt={profile.displayName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png';
                        }}
                      />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-medium">{profile.displayName}</div>
                      <div className="text-sm text-text-secondary">@{profile.username}</div>
                    </div>
                                          <div className="text-right">
                        <div 
                          className="text-sm font-medium" 
                          style={{ 
                            color: profile.score >= 2000 ? '#7a5eaf' :
                                   profile.score >= 1600 ? '#117f31' :
                                   profile.score >= 1200 ? '#c1c0b6' :
                                   profile.score >= 800 ? '#c29011' :
                                   '#b72c37'
                          }}
                        >
                          {profile.score.toLocaleString()}
                        </div>
                        <div className="text-xs text-text-secondary">Score</div>
                      </div>
                  </button>
                ))
              ) : query && !loading ? (
                <div className="text-center text-text-secondary py-8">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No results found</p>
                  <p className="text-sm mt-2">Try a different search term</p>
                </div>
              ) : !query && (
                <div className="text-center text-text-secondary py-8">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Start typing to search for Ethos profiles</p>
                  <p className="text-xs mt-2 text-gray-400">
                    Search by username to find profiles
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SearchOverlay; 