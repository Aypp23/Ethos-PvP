import React, { useState, useEffect } from 'react';
import { EthosUser } from '../types';
import { getUserByTwitterUsername } from '../services/ethosApi';
import { X, Star } from 'lucide-react';
import SearchOverlay from './SearchOverlay';
import { ComparisonImageGenerator } from './ComparisonImageGenerator';

interface ComparisonViewProps {}

const ComparisonView: React.FC<ComparisonViewProps> = () => {
  const [user1, setUser1] = useState<EthosUser | null>(null);
  const [user2, setUser2] = useState<EthosUser | null>(null);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [error1, setError1] = useState<string | null>(null);
  const [error2, setError2] = useState<string | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [overlayTarget, setOverlayTarget] = useState<'user1' | 'user2' | null>(null);

  // Handle URL parameters for direct comparison links
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const user1Param = urlParams.get('user1');
    const user2Param = urlParams.get('user2');

    const loadUserFromParam = async (username: string, setUser: (user: EthosUser | null) => void, setLoading: (loading: boolean) => void, setError: (error: string | null) => void) => {
      setLoading(true);
      setError(null);
      try {
        const userData = await getUserByTwitterUsername(username);
        setUser(userData);
      } catch (error: any) {
        setError(error.message || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    if (user1Param && !user1) {
      loadUserFromParam(user1Param, setUser1, setLoading1, setError1);
    }
    if (user2Param && !user2) {
      loadUserFromParam(user2Param, setUser2, setLoading2, setError2);
    }
  }, [user1, user2]);

  const handleUser1Select = async (profile: any) => {
    setLoading1(true);
    setError1(null);
    try {
      const userData = await getUserByTwitterUsername(profile.username);
      setUser1(userData);
    } catch (error: any) {
      setError1(error.message || 'Failed to load user data');
    } finally {
      setLoading1(false);
    }
  };

  const handleUser2Select = async (profile: any) => {
    setLoading2(true);
    setError2(null);
    try {
      const userData = await getUserByTwitterUsername(profile.username);
      setUser2(userData);
    } catch (error: any) {
      setError2(error.message || 'Failed to load user data');
    } finally {
      setLoading2(false);
    }
  };

  const clearUser = (side: 'left' | 'right') => {
    if (side === 'left') {
      setUser1(null);
      setLoading1(false);
      setError1(null);
    } else {
      setUser2(null);
      setLoading2(false);
      setError2(null);
    }
  };

  const openOverlay = (target: 'user1' | 'user2') => {
    setOverlayTarget(target);
    setIsOverlayOpen(true);
  };

  const closeOverlay = () => {
    setIsOverlayOpen(false);
    setOverlayTarget(null);
  };

  const handleProfileSelect = (profile: any) => {
    if (overlayTarget === 'user1') {
      handleUser1Select(profile);
    } else if (overlayTarget === 'user2') {
      handleUser2Select(profile);
    }
  };

  const getPerformanceColor = (percentage: number, value: number, metric: string, side: 'left' | 'right') => {
    // If we don't have both users, use default grayscale
    if (!user1 || !user2) {
      if (value === 0) return 'bg-transparent';
      if (percentage >= 80) return 'bg-performance-excellent';
      if (percentage >= 60) return 'bg-performance-good';
      if (percentage >= 40) return 'bg-performance-average';
      if (percentage >= 20) return 'bg-performance-poor';
      return 'bg-performance-critical';
    }

    // Get the values for both users for this metric
    const getValueForMetric = (user: EthosUser, metricName: string): number => {
      switch (metricName) {
        case 'Ethos Score':
          return user.score;
        case 'Total XP':
          return user.xp;
        case 'XP Streak Days':
          return user.xpStreak || 0;
        case 'Total Reviews':
          return (user.stats?.review?.received?.positive || 0) + 
                 (user.stats?.review?.received?.neutral || 0) + 
                 (user.stats?.review?.received?.negative || 0);
        case 'Positive Reviews':
          return user.stats?.review?.received?.positive || 0;
        case 'Neutral Reviews':
          return user.stats?.review?.received?.neutral || 0;
        case 'Negative Reviews':
          return user.stats?.review?.received?.negative || 0;
        case 'Vouches Given':
          return user.stats?.vouch?.given?.count || 0;
        case 'Vouches Received':
          return user.stats?.vouch?.received?.count || 0;
        case 'ETH Vouch Given':
          return user.stats?.vouch?.given?.amountWeiTotal ? 
            parseFloat(user.stats.vouch.given.amountWeiTotal) / Math.pow(10, 18) : 0;
        case 'ETH Vouch Received':
          return user.stats?.vouch?.received?.amountWeiTotal ? 
            parseFloat(user.stats.vouch.received.amountWeiTotal) / Math.pow(10, 18) : 0;
        default:
          return 0;
      }
    };

    const user1Value = getValueForMetric(user1, metric);
    const user2Value = getValueForMetric(user2, metric);

    // If it's a draw, show grey
    if (user1Value === user2Value) return 'bg-gray-400';

    // Both users get black progress bars when different, width shows relative performance
    return 'bg-black';
  };

  const Statistic = ({ label, value, maxValue, showStar = false, side }: { 
    label: string; 
    value: number; 
    maxValue: number; 
    showStar?: boolean; 
    side: 'left' | 'right';
  }) => {
    // Get relative max value between the two users for this metric
    const getRelativeMaxValue = (metricName: string): number => {
      if (!user1 || !user2) return maxValue;
      
      const getValueForMetric = (user: EthosUser, metric: string): number => {
        switch (metric) {
          case 'Ethos Score':
            return user.score;
          case 'Total XP':
            return user.xp;
          case 'XP Streak Days':
            return user.xpStreak || 0;
          case 'Total Reviews':
            return (user.stats?.review?.received?.positive || 0) + 
                   (user.stats?.review?.received?.neutral || 0) + 
                   (user.stats?.review?.received?.negative || 0);
          case 'Positive Reviews':
            return user.stats?.review?.received?.positive || 0;
          case 'Neutral Reviews':
            return user.stats?.review?.received?.neutral || 0;
          case 'Negative Reviews':
            return user.stats?.review?.received?.negative || 0;
          case 'Vouches Given':
            return user.stats?.vouch?.given?.count || 0;
          case 'Vouches Received':
            return user.stats?.vouch?.received?.count || 0;
          case 'ETH Vouch Given':
            return user.stats?.vouch?.given?.amountWeiTotal ? 
              parseFloat(user.stats.vouch.given.amountWeiTotal) / Math.pow(10, 18) : 0;
          case 'ETH Vouch Received':
            return user.stats?.vouch?.received?.amountWeiTotal ? 
              parseFloat(user.stats.vouch.received.amountWeiTotal) / Math.pow(10, 18) : 0;
          default:
            return 0;
        }
      };

      const user1Value = getValueForMetric(user1, metricName);
      const user2Value = getValueForMetric(user2, metricName);
      const relativeMax = Math.max(user1Value, user2Value);
      
      // If both values are 0, use the original maxValue
      return relativeMax > 0 ? relativeMax : maxValue;
    };

    const relativeMaxValue = getRelativeMaxValue(label);
    const percentage = relativeMaxValue > 0 ? (value / relativeMaxValue) * 100 : 0;
    const performanceColor = getPerformanceColor(percentage, value, label, side);
    
    // Format large numbers with k/m abbreviations
    const formatNumber = (num: number): string => {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'm';
      } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'k';
      }
      return num.toString();
    };
    
    // Format ETH values to 2 decimal places, format Total XP with k/m
    const displayValue = label.includes('ETH') ? value.toFixed(2) : 
                        label === 'Total XP' ? formatNumber(value) : 
                        value.toString();

    // Get star color for Ethos Score based on score brackets
    const getStarColor = (score: number): string => {
      if (score >= 2000) return '#7a5eaf'; // Purple
      if (score >= 1600) return '#117f31'; // Green
      if (score >= 1200) return '#c1c0b6'; // Light gray
      if (score >= 800) return '#c29011';  // Orange
      return '#b72c37'; // Red
    };

    return (
      <div className="flex items-center justify-between py-2.5">
        <span className="text-text-dark font-medium text-sm flex-1">{label}</span>
        <div className="w-full max-w-[200px] mx-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${performanceColor} transition-all duration-500`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 min-w-[80px] justify-end">
          <span className="text-text-dark font-bold text-sm text-right">
            {displayValue}
          </span>
          {showStar && (
            <Star 
              className="w-4 h-4 fill-current" 
              style={{ color: label === 'Ethos Score' ? getStarColor(value) : '#6b7280' }}
            />
          )}
        </div>
      </div>
    );
  };

  const ProfileCard = ({ user, loading, error, side }: { 
    user: EthosUser | null; 
    loading: boolean; 
    error: string | null; 
    side: 'left' | 'right'; 
  }) => {
    if (loading) {
      return (
        <div className="relative rounded-[32px] overflow-hidden shadow-card max-w-md w-full bg-white border border-[#2d2d29]">
          <div className="p-6 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-300 animate-pulse"></div>
              <div className="flex-1">
                <div className="h-6 bg-gray-300 rounded animate-pulse mb-2"></div>
                <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="bg-white mx-6 mb-6 rounded-2xl p-4">
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="relative rounded-[32px] overflow-hidden shadow-card max-w-md w-full bg-white border border-[#2d2d29]">
          <div className="p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <p className="text-text-primary text-lg mb-2">Error loading profile</p>
            <p className="text-text-secondary text-sm">{error}</p>
          </div>
        </div>
      );
    }

    if (!user) {
      return (
        <div className="relative rounded-[32px] overflow-hidden shadow-card max-w-md w-full bg-white border border-[#2d2d29]">
          <div className="p-6 text-center">
            <div className="w-16 h-16 border-2 border-dashed border-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-text-secondary text-lg mb-4">Add Username</p>
            <button
              onClick={() => openOverlay(side === 'left' ? 'user1' : 'user2')}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Select Profile
            </button>
          </div>
        </div>
      );
    }

    const statistics = [
      { label: "Ethos Score", value: user.score, maxValue: 2000, showStar: true },
      { label: "Total XP", value: user.xp, maxValue: 100000, showStar: false },
      { label: "XP Streak Days", value: user.xpStreak || 0, maxValue: 365 },
      { label: "Total Reviews", value: (user.stats?.review?.received?.positive || 0) + (user.stats?.review?.received?.neutral || 0) + (user.stats?.review?.received?.negative || 0), maxValue: 1000 },
      { label: "Positive Reviews", value: user.stats?.review?.received?.positive || 0, maxValue: 500 },
      { label: "Neutral Reviews", value: user.stats?.review?.received?.neutral || 0, maxValue: 200 },
      { label: "Negative Reviews", value: user.stats?.review?.received?.negative || 0, maxValue: 100 },
      { label: "Vouches Given", value: user.stats?.vouch?.given?.count || 0, maxValue: 500 },
      { label: "Vouches Received", value: user.stats?.vouch?.received?.count || 0, maxValue: 500 },
      { label: "ETH Vouch Given", value: user.stats?.vouch?.given?.amountWeiTotal ? parseFloat(user.stats.vouch.given.amountWeiTotal) / Math.pow(10, 18) : 0, maxValue: 100 },
      { label: "ETH Vouch Received", value: user.stats?.vouch?.received?.amountWeiTotal ? parseFloat(user.stats.vouch.received.amountWeiTotal) / Math.pow(10, 18) : 0, maxValue: 100 }
    ];

    return (
      <div className="relative rounded-[32px] overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1 max-w-md w-full bg-white border border-[#2d2d29]">
        {/* Header Section */}
        <div className="relative p-6 pb-4">
          {/* Remove Button */}
          <div className="absolute top-4 right-4">
            <button
              onClick={() => clearUser(side)}
              className="hover:bg-gray-100 rounded-full p-1.5 h-auto transition-colors"
              style={{ color: 'rgb(35, 35, 32)' }}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Profile Info */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src={user.avatar || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png'} 
                alt={user.displayName}
                className="w-16 h-16 rounded-full border-3 border-white/30 shadow-lg object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png';
                }}
              />
            </div>
            <div className="flex-1">
              <h2 className="font-queens text-xl leading-tight font-bold" style={{ fontFeatureSettings: '"calt" 0', color: 'rgb(35, 35, 32)' }}>
                {user.displayName}
              </h2>
              <p className="font-inter text-sm" style={{ fontFeatureSettings: '"calt" 0', color: 'rgb(35, 35, 32)' }}>
                <a 
                  href={`https://app.ethos.network/profile/x/${user.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline cursor-pointer"
                  style={{ color: 'rgb(35, 35, 32)' }}
                >
                  @{user.username}
                </a>
              </p>
              <div className="flex items-center mt-1">
                <span className="font-inter text-sm font-medium" style={{ fontFeatureSettings: '"calt" 0', color: 'rgb(35, 35, 32)' }}>
                  {user.level ? user.level.charAt(0).toUpperCase() + user.level.slice(1) : 'User'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Card */}
        <div className="mx-6 mb-6 rounded-2xl p-4">
          <div className="space-y-1 max-h-[400px] overflow-y-auto scrollbar-hide">
            {statistics.map((stat, index) => (
              <Statistic key={index} {...stat} side={side} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-light p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img src="/ethos-pvp-logo.png" alt="Ethos PvP Logo" className="h-48 md:h-56 object-contain invert" />
          </div>
          <h1 className="font-queens text-4xl md:text-5xl font-bold mb-4 text-text-dark" style={{ fontFeatureSettings: '"calt" 0' }}>
            Profile Comparison
          </h1>
          <p className="font-inter text-lg md:text-xl text-text-dark" style={{ fontFeatureSettings: '"calt" 0' }}>
            Compare two Ethos profiles
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 justify-items-center max-w-5xl mx-auto">
          <ProfileCard user={user1} loading={loading1} error={error1} side="left" />
          <ProfileCard user={user2} loading={loading2} error={error2} side="right" />
        </div>

        {!user1 && !user2 && !loading1 && !loading2 && (
          <div className="text-center py-20">
            <p className="text-text-dark text-xl">
              Click "Select Profile" to start comparing profiles!
            </p>
          </div>
        )}

        {/* Comparison Image Generator */}
        {user1 && user2 && (
          <ComparisonImageGenerator user1={user1} user2={user2} />
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-8 mt-12">
        <p className="font-inter text-sm text-text-dark" style={{ fontFeatureSettings: '"calt" 0' }}>
          Built by{' '}
          <a 
            href="https://x.com/ololade_eth"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline cursor-pointer font-medium"
            style={{ color: 'rgb(35, 35, 32)' }}
          >
            ololade_eth
          </a>
        </p>
      </footer>

      {/* Search Overlay */}
      <SearchOverlay
        isOpen={isOverlayOpen}
        onClose={closeOverlay}
        onSelectProfile={handleProfileSelect}
        title={overlayTarget === 'user1' ? 'Add First User' : 'Add Second User'}
      />
    </div>
  );
};

export default ComparisonView;