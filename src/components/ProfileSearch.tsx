import React, { useState, useRef } from 'react';
import SearchDropdown from './SearchDropdown';
import { getUserByTwitterUsername, getUserScore, getUserXP } from '../services/ethosApi';

interface SearchResult {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string;
  score: number;
  status: string;
  userkeys: string[];
  xpTotal: number;
  xpStreakDays: number;
}

interface UserData {
  score: number;
  level: string;
  xp: number;
  xpStreak: number;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  twitterUsername: string;
  // Add review statistics
  reviewsReceived: {
    total: number;
    positive: number;
    neutral: number;
    negative: number;
  };
  vouches: {
    given: {
      count: number;
      ethAmount: number;
    };
    received: {
      count: number;
      ethAmount: number;
    };
  };
}

const ProfileSearch: React.FC = () => {
  const [selectedProfile, setSelectedProfile] = useState<SearchResult | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchKey, setSearchKey] = useState(0); // Add key for forcing re-render

  const handleProfileSelect = async (profile: SearchResult) => {
    setSelectedProfile(profile);
    setUserData(null);
    setError('');
    setSearchKey(prev => prev + 1); // Force SearchDropdown to reset

    // Fetch detailed profile data
    setLoading(true);
    try {
      const user = await getUserByTwitterUsername(profile.username);
      
      setUserData({
        score: user.score || profile.score,
        level: user.level || 'neutral',
        xp: user.xp || profile.xpTotal,
        xpStreak: user.xpStreak || profile.xpStreakDays, // Use xpStreak from user object or xpStreakDays from profile
        username: user.username || profile.username,
        displayName: user.displayName || profile.displayName,
        avatar: user.avatar || profile.avatarUrl,
        bio: user.bio || '',
        twitterUsername: user.twitterUsername || profile.username,
        // Add review statistics
        reviewsReceived: {
          total: (user.stats?.review?.received?.positive || 0) + 
                 (user.stats?.review?.received?.neutral || 0) + 
                 (user.stats?.review?.received?.negative || 0),
          positive: user.stats?.review?.received?.positive || 0,
          neutral: user.stats?.review?.received?.neutral || 0,
          negative: user.stats?.review?.received?.negative || 0,
        },
        // Add vouch statistics
        vouches: {
          given: {
            count: user.stats?.vouch?.given?.count || 0,
            ethAmount: parseFloat(user.stats?.vouch?.given?.amountWeiTotal || "0") / Math.pow(10, 18)
          },
          received: {
            count: user.stats?.vouch?.received?.count || 0,
            ethAmount: parseFloat(user.stats?.vouch?.received?.amountWeiTotal || "0") / Math.pow(10, 18)
          }
        }
      });
    } catch (err) {
      console.error('Error fetching profile details:', err);
      setError('Failed to fetch profile details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-gray-900 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-white">Ethos Profile Search</h2>
      
      <div className="mb-6">
        <SearchDropdown 
          key={searchKey}
          onProfileSelect={handleProfileSelect}
          placeholder="Search for Ethos profiles..."
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900 border border-red-600 text-red-200 rounded">
          {error}
        </div>
      )}

      {loading && (
        <div className="mb-4 p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
            <span className="text-gray-300">Loading profile details...</span>
          </div>
        </div>
      )}

      {userData && (
        <div className="p-4 bg-gray-800 rounded-lg animate-fade-in">
          {/* Profile Header */}
          <div className="flex items-center space-x-4">
            <img 
              src={userData.avatar} 
              alt={userData.displayName}
              className="w-16 h-16 rounded-full border-2 border-gray-600"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/64x64/374151/9CA3AF?text=?' 
              }}
            />
            <div>
              <h2 className="text-2xl font-bold text-white">{userData.displayName}</h2>
              <a 
                href={`https://app.ethos.network/profile/x/${userData.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer text-lg"
              >
                @{userData.username}
              </a>
              {userData.bio && (
                <p className="text-gray-300 mt-2">{userData.bio}</p>
              )}
            </div>
          </div>

          {/* Bio */}
          {userData.bio && (
            <div className="mb-4 p-3 bg-gray-700 rounded border border-gray-600">
              <p className="text-sm text-gray-300">{userData.bio}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded border border-gray-600">
              <span className="font-medium text-gray-300">Ethos Score:</span>
              <span className="text-blue-400 font-bold text-lg">{userData.score}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded border border-gray-600">
              <span className="font-medium text-gray-300">Level:</span>
              <span className="text-green-400 font-bold capitalize">{userData.level}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded border border-gray-600">
              <span className="font-medium text-gray-300">Total XP:</span>
              <span className="text-purple-400 font-bold text-lg">{userData.xp.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded border border-gray-600">
              <span className="font-medium text-gray-300">XP Streak:</span>
              <span className="text-yellow-400 font-bold text-lg">{userData.xpStreak} days</span>
            </div>
          </div>

          {/* Review Statistics */}
          <div className="mt-6">
            <h3 className="text-xl font-bold text-white mb-4">Review Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="flex justify-between items-center p-3 bg-gray-700 rounded border border-gray-600">
                <span className="font-medium text-gray-300">Total Reviews:</span>
                <span className="text-blue-400 font-bold text-lg">{userData.reviewsReceived.total}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-700 rounded border border-gray-600">
                <span className="font-medium text-gray-300">Positive:</span>
                <span className="text-green-400 font-bold text-lg">{userData.reviewsReceived.positive}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-700 rounded border border-gray-600">
                <span className="font-medium text-gray-300">Neutral:</span>
                <span className="text-yellow-400 font-bold text-lg">{userData.reviewsReceived.neutral}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-700 rounded border border-gray-600">
                <span className="font-medium text-gray-300">Negative:</span>
                <span className="text-red-400 font-bold text-lg">{userData.reviewsReceived.negative}</span>
              </div>
            </div>
          </div>

          {/* Vouch Statistics */}
          <div className="mt-6">
            <h3 className="text-xl font-bold text-white mb-4">Vouch Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="flex justify-between items-center p-3 bg-gray-700 rounded border border-gray-600">
                <span className="font-medium text-gray-300">Vouches Given:</span>
                <span className="text-blue-400 font-bold text-lg">{userData.vouches.given.count}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-700 rounded border border-gray-600">
                <span className="font-medium text-gray-300">Vouches Received:</span>
                <span className="text-green-400 font-bold text-lg">{userData.vouches.received.count}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-700 rounded border border-gray-600">
                <span className="font-medium text-gray-300">ETH Vouched Given:</span>
                <span className="text-purple-400 font-bold text-lg">{userData.vouches.given.ethAmount.toFixed(2)} ETH</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-700 rounded border border-gray-600">
                <span className="font-medium text-gray-300">ETH Vouched Received:</span>
                <span className="text-yellow-400 font-bold text-lg">{userData.vouches.received.ethAmount.toFixed(2)} ETH</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSearch; 