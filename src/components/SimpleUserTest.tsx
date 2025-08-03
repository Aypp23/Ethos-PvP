import React, { useState } from 'react';
import { getUserByTwitterUsername, getUserScore, getUserXP, clearCache } from '../services/ethosApi';

interface UserData {
  score: number;
  level: string;
  xp: number;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  twitterUsername: string;
}

const SimpleUserTest: React.FC = () => {
  const [username, setUsername] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');

  const handleFetchUser = async () => {
    if (!username.trim()) return;

    setLoading(true);
    setError('');
    setUserData(null);

    try {
      // Clear cache to ensure fresh data
      clearCache();
      
      console.log('🔍 Starting fetch for username:', username);
      
      // Step 1: Get user data (this includes score and XP from the search response)
      setLoadingStep('Finding user...');
      const user = await getUserByTwitterUsername(username);
      
      console.log('📊 Raw user data from API:', JSON.stringify(user, null, 2));
      console.log('🔑 Userkey:', user.userkey);
      console.log('📈 Score:', user.score);
      console.log('🎯 Level:', user.level);
      console.log('⭐ XP:', user.xp);
      console.log('👤 Display Name:', user.displayName);
      console.log('🖼️ Avatar:', user.avatar);
      
      // Use the data directly from the user search response
      const processedData = {
        score: user.score || 0,
        level: user.level || 'neutral',
        xp: user.xp || 0,
        username: user.username || username,
        displayName: user.displayName || user.username || username,
        avatar: user.avatar || '',
        bio: user.bio || '',
        twitterUsername: user.twitterUsername || user.username || username
      };
      
      console.log('✅ Processed data for display:', JSON.stringify(processedData, null, 2));
      
      setUserData(processedData);
    } catch (err) {
      console.error('❌ Error fetching user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Simple User Test</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Twitter Username
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter Twitter username (e.g., ololade_eth)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
      </div>

      <button
        onClick={handleFetchUser}
        disabled={loading || !username.trim()}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {loadingStep}
          </>
        ) : (
          'Fetch User Data'
        )}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {userData && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg animate-fade-in">
          {/* Profile Header */}
          <div className="flex items-center mb-4">
            <img 
              src={userData.avatar || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png'} 
              alt={`${userData.displayName}'s avatar`}
              className="w-16 h-16 rounded-full mr-4 border-2 border-gray-200"
              onError={(e) => {
                e.currentTarget.src = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png';
              }}
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">{userData.displayName}</h3>
              <p className="text-blue-500 font-medium">@{userData.twitterUsername}</p>
            </div>
          </div>

          {/* Bio */}
          {userData.bio && (
            <div className="mb-4 p-3 bg-white rounded border">
              <p className="text-sm text-gray-700">{userData.bio}</p>
            </div>
          )}

          {/* Stats */}
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-white rounded border">
              <span className="font-medium text-gray-700">Ethos Score:</span>
              <span className="text-blue-600 font-bold text-lg">{userData.score}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white rounded border">
              <span className="font-medium text-gray-700">Level:</span>
              <span className="text-green-600 font-bold capitalize">{userData.level}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white rounded border">
              <span className="font-medium text-gray-700">Total XP:</span>
              <span className="text-purple-600 font-bold text-lg">{userData.xp.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleUserTest; 