import axios from 'axios';
import { 
  EthosUser, 
  EthosScore, 
  EthosXP, 
  EthosReview, 
  EthosVote, 
  EthosVouch, 
  EthosActivity,
  UserMetrics,
  ApiError 
} from '../types';

const API_BASE_URL = 'https://api.ethos.network/api/v2';

// Create axios instance with optimized config for speed
const api = axios.create({
  baseURL: 'https://api.ethos.network/api/v2',
  headers: {
    'X-Ethos-Client': 'ethos-profile-comparison@1.0.0'
  },
  timeout: 5000 // Reduced from 10000ms to 5000ms for faster response
});

// Simple in-memory cache for user data
const userCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to get cached data
const getCachedData = (key: string) => {
  const cached = userCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

// Helper function to set cached data
const setCachedData = (key: string, data: any) => {
  userCache.set(key, { data, timestamp: Date.now() });
};

// Helper function to clear cache
export const clearCache = () => {
  userCache.clear();
  console.log('Cache cleared');
};

// Helper function to handle API errors
const handleApiError = (error: any): ApiError => {
  if (error.response) {
    return {
      message: error.response.data?.message || 'API request failed',
      status: error.response.status,
    };
  }
  return {
    message: error.message || 'Network error occurred',
  };
};

// Get user by Twitter username with caching
export const getUserByTwitterUsername = async (twitterUsername: string): Promise<EthosUser> => {
  const cacheKey = `user_${twitterUsername.toLowerCase()}`;
  
  console.log('🔍 getUserByTwitterUsername called with:', twitterUsername);
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log('📦 Returning cached data:', JSON.stringify(cached, null, 2));
    return cached;
  }

  try {
    console.log('🌐 Making API call to search for user...');
    // Use the faster v1 search endpoint for initial search
    const searchResponse = await axios.get(`https://api.ethos.network/api/v1/search?query=${twitterUsername}&limit=10`);
    
    console.log('📡 Search response received:', JSON.stringify(searchResponse.data, null, 2));
    
    if (searchResponse.data?.ok && searchResponse.data.data?.values && searchResponse.data.data.values.length > 0) {
      console.log(`📋 Found ${searchResponse.data.data.values.length} users`);
      
      // Find exact match, prioritizing profiles with profileId
      const exactMatches = searchResponse.data.data.values.filter((user: any) => 
        user.username?.toLowerCase() === twitterUsername.toLowerCase()
      );
      
      console.log(`🎯 Found ${exactMatches.length} exact matches:`, exactMatches.map((u: any) => ({ username: u.username, profileId: u.profileId, score: u.score })));
      
      // Prioritize profiles with profileId, then by score, then take the first match
      const profileUser = exactMatches.find((user: any) => user.profileId);
      const highScoreUser = exactMatches.sort((a: any, b: any) => (b.score || 0) - (a.score || 0))[0];
      const user = profileUser || highScoreUser || exactMatches[0] || searchResponse.data.data.values[0];
      
      console.log('✅ Selected user:', JSON.stringify(user, null, 2));
      
      // Get the score level for better accuracy using v2 API
      let level = 'neutral'; // Default level
      if (user.userkey) {
        try {
          console.log('🎯 Fetching score level for userkey:', user.userkey);
          const scoreResponse = await api.get(`/score/userkey?userkey=${user.userkey}`);
          level = scoreResponse.data.level || 'neutral';
          console.log('📊 Score level fetched:', level);
        } catch (error) {
          console.warn('⚠️ Could not fetch score level, using default');
        }
      }
      
      // Get detailed user data from v2 API using the userkey
      let detailedUserData = null;
      if (user.userkey) {
        try {
          console.log('🔍 Fetching detailed user data from v2 API...');
          const v2Response = await api.get(`/users/search?query=${user.username}`);
          if (v2Response.data?.values && v2Response.data.values.length > 0) {
            const v2User = v2Response.data.values.find((u: any) => 
              u.username?.toLowerCase() === user.username.toLowerCase()
            );
            if (v2User) {
              detailedUserData = v2User;
              console.log('✅ Found detailed v2 data:', JSON.stringify(detailedUserData, null, 2));
            }
          }
        } catch (error) {
          console.warn('⚠️ Could not fetch v2 data, using v1 data only');
        }
      }
      
      // Transform the API response to our EthosUser format
      const userData: EthosUser = {
        userkey: user.userkey || `user_${user.profileId || Math.random()}`,
        username: user.username,
        displayName: user.name,
        avatar: user.avatar || '',
        bio: user.description || '',
        twitterUsername: user.username,
        twitterFollowers: detailedUserData?.twitterFollowers || 0,
        twitterVerified: detailedUserData?.twitterVerified || false,
        score: user.score || 0,
        xp: detailedUserData?.xpTotal || 0,
        xpStreak: detailedUserData?.xpStreakDays || 0,
        level: level,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: detailedUserData?.stats || {
          review: {
            received: {
              positive: 0,
              neutral: 0,
              negative: 0
            }
          },
          vouch: {
            given: {
              amountWeiTotal: "0",
              count: 0
            },
            received: {
              amountWeiTotal: "0",
              count: 0
            }
          }
        }
      };

      console.log('🔄 Transformed user data:', JSON.stringify(userData, null, 2));

      // Cache the result
      setCachedData(cacheKey, userData);
      return userData;
    }
    
    throw new Error(`User not found: ${twitterUsername}`);
  } catch (error: any) {
    console.error('❌ API error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    });
    
    // If search fails, create a mock user for testing
    console.warn('🔄 API not available, using mock data for testing');
    const mockUser = {
      userkey: `mock_${twitterUsername}`,
      username: twitterUsername,
      displayName: twitterUsername,
      avatar: '',
      bio: '',
      twitterUsername: twitterUsername,
      twitterFollowers: Math.floor(Math.random() * 10000),
      twitterVerified: false,
      score: Math.floor(Math.random() * 1000),
      xp: Math.floor(Math.random() * 5000),
      xpStreak: Math.floor(Math.random() * 30),
      level: 'neutral',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: {
        review: {
          received: {
            positive: Math.floor(Math.random() * 10),
            neutral: Math.floor(Math.random() * 5),
            negative: Math.floor(Math.random() * 3)
          }
        },
        vouch: {
          given: {
            amountWeiTotal: (Math.floor(Math.random() * 50) * Math.pow(10, 18)).toString(),
            count: Math.floor(Math.random() * 20)
          },
          received: {
            amountWeiTotal: (Math.floor(Math.random() * 100) * Math.pow(10, 18)).toString(),
            count: Math.floor(Math.random() * 30)
          }
        }
      }
    };
    
    // Cache mock data too
    setCachedData(cacheKey, mockUser);
    return mockUser;
  }
};

// Get user by userkey
export const getUserByUserkey = async (userkey: string): Promise<EthosUser> => {
  try {
    const response = await api.get(`/users/${userkey}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Get user score with caching
export const getUserScore = async (userkey: string): Promise<EthosScore> => {
  const cacheKey = `score_${userkey}`;
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Use the correct v2 score endpoint
    const response = await api.get(`/score/userkey?userkey=${userkey}`);
    const scoreData = response.data;
    
    // Cache the result
    setCachedData(cacheKey, scoreData);
    return scoreData;
  } catch (error) {
    // Return mock data for testing
    console.warn('Score API not available, using mock data');
    const mockScore = {
      userkey,
      score: Math.floor(Math.random() * 1000),
      rank: Math.floor(Math.random() * 10000),
      percentile: Math.random() * 100,
    };
    
    // Cache mock data
    setCachedData(cacheKey, mockScore);
    return mockScore;
  }
};

// Get user XP with caching
export const getUserXP = async (userkey: string): Promise<EthosXP> => {
  const cacheKey = `xp_${userkey}`;
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Use the correct v2 XP endpoint - returns just a number
    const response = await api.get(`/xp/user/${userkey}`);
    const totalXp = typeof response.data === 'number' ? response.data : 0;
    
    const xpData = {
      userkey,
      totalXp,
      currentStreak: 0, // Not available in simple XP endpoint
      longestStreak: 0, // Not available in simple XP endpoint
      level: Math.floor(totalXp / 1000), // Calculate level based on XP
    };
    
    // Cache the result
    setCachedData(cacheKey, xpData);
    return xpData;
  } catch (error) {
    // Return mock data for testing
    console.warn('XP API not available, using mock data');
    const mockXp = {
      userkey,
      totalXp: Math.floor(Math.random() * 5000),
      currentStreak: Math.floor(Math.random() * 30),
      longestStreak: Math.floor(Math.random() * 100),
      level: Math.floor(Math.random() * 50),
    };
    
    // Cache mock data
    setCachedData(cacheKey, mockXp);
    return mockXp;
  }
};

// Get reviews received by user
export const getReviewsReceived = async (userkey: string, limit = 1000): Promise<EthosReview[]> => {
  try {
    // Use the activities endpoint with review filter for v2 API
    const response = await api.post('/activities/profile/received', {
      userkey,
      filter: ['review'],
      limit,
      offset: 0,
      orderBy: {
        field: 'timestamp',
        direction: 'desc'
      }
    });
    
    // Transform the activities response to reviews format
    const activities = response.data.values || [];
    return activities.map((activity: any) => ({
      id: activity.data?.id || Math.random(),
      author: activity.author?.userkey || 'unknown',
      subject: userkey,
      rating: activity.data?.score || 'neutral',
      content: activity.data?.comment || '',
      createdAt: new Date(activity.timestamp * 1000).toISOString(),
    }));
  } catch (error) {
    // Return mock data for testing
    console.warn('Reviews API not available, using mock data');
    const mockReviews: EthosReview[] = [];
    const reviewCount = Math.floor(Math.random() * 50);
    
    for (let i = 0; i < reviewCount; i++) {
      const ratings: ('positive' | 'neutral' | 'negative')[] = ['positive', 'neutral', 'negative'];
      mockReviews.push({
        id: i + 1,
        author: `user_${Math.floor(Math.random() * 1000)}`,
        subject: userkey,
        rating: ratings[Math.floor(Math.random() * 3)],
        content: `Mock review ${i + 1}`,
        createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      });
    }
    
    return mockReviews;
  }
};

// Get reviews given by user
export const getReviewsGiven = async (userkey: string, limit = 1000): Promise<EthosReview[]> => {
  try {
    // Use the activities endpoint with review filter for v2 API
    const response = await api.post('/activities/profile/given', {
      userkey,
      filter: ['review'],
      limit,
      offset: 0,
      orderBy: {
        field: 'timestamp',
        direction: 'desc'
      }
    });
    
    // Transform the activities response to reviews format
    const activities = response.data.values || [];
    return activities.map((activity: any) => ({
      id: activity.data?.id || Math.random(),
      author: userkey,
      subject: activity.subject?.userkey || 'unknown',
      rating: activity.data?.score || 'neutral',
      content: activity.data?.comment || '',
      createdAt: new Date(activity.timestamp * 1000).toISOString(),
    }));
  } catch (error) {
    // Return mock data for testing
    console.warn('Reviews Given API not available, using mock data');
    const mockReviews: EthosReview[] = [];
    const reviewCount = Math.floor(Math.random() * 30);
    
    for (let i = 0; i < reviewCount; i++) {
      const ratings: ('positive' | 'neutral' | 'negative')[] = ['positive', 'neutral', 'negative'];
      mockReviews.push({
        id: i + 1,
        author: userkey,
        subject: `user_${Math.floor(Math.random() * 1000)}`,
        rating: ratings[Math.floor(Math.random() * 3)],
        content: `Mock review given ${i + 1}`,
        createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      });
    }
    
    return mockReviews;
  }
};

// Get vouches given by user
export const getVouchesGiven = async (userkey: string, limit = 1000): Promise<EthosVouch[]> => {
  try {
    // Use the correct votes endpoint for vouches from the API documentation
    const response = await api.post('/votes/vouches/given', {
      userkey,
      limit,
      offset: 0,
      orderBy: {
        field: 'timestamp',
        direction: 'desc'
      }
    });
    return response.data.values || [];
  } catch (error) {
    // Return mock data for testing
    console.warn('Vouches Given API not available, using mock data');
    const mockVouches: EthosVouch[] = [];
    const vouchCount = Math.floor(Math.random() * 20);
    
    for (let i = 0; i < vouchCount; i++) {
      mockVouches.push({
        id: i + 1,
        voucher: userkey,
        vouchee: `user_${Math.floor(Math.random() * 1000)}`,
        amount: Math.random() * 10,
        createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      });
    }
    
    return mockVouches;
  }
};

// Get vouches received by user
export const getVouchesReceived = async (userkey: string, limit = 1000): Promise<EthosVouch[]> => {
  try {
    // Use the correct votes endpoint for vouches from the API documentation
    const response = await api.post('/votes/vouches/received', {
      userkey,
      limit,
      offset: 0,
      orderBy: {
        field: 'timestamp',
        direction: 'desc'
      }
    });
    return response.data.values || [];
  } catch (error) {
    // Return mock data for testing
    console.warn('Vouches Received API not available, using mock data');
    const mockVouches: EthosVouch[] = [];
    const vouchCount = Math.floor(Math.random() * 25);
    
    for (let i = 0; i < vouchCount; i++) {
      mockVouches.push({
        id: i + 1,
        voucher: `user_${Math.floor(Math.random() * 1000)}`,
        vouchee: userkey,
        amount: Math.random() * 15,
        createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      });
    }
    
    return mockVouches;
  }
};

// Get votes cast by user
export const getVotesCast = async (userkey: string, limit = 1000): Promise<EthosVote[]> => {
  try {
    // Use the correct votes endpoint from the API documentation
    const response = await api.post('/votes/cast', {
      userkey,
      limit,
      offset: 0,
      orderBy: {
        field: 'timestamp',
        direction: 'desc'
      }
    });
    return response.data.values || [];
  } catch (error) {
    // Return mock data for testing
    console.warn('Votes Cast API not available, using mock data');
    const mockVotes: EthosVote[] = [];
    const voteCount = Math.floor(Math.random() * 100);
    
    for (let i = 0; i < voteCount; i++) {
      mockVotes.push({
        id: i + 1,
        voter: userkey,
        activityId: Math.floor(Math.random() * 1000),
        activityType: ['attestation', 'review', 'project'][Math.floor(Math.random() * 3)],
        direction: Math.random() > 0.5 ? 'up' : 'down',
        createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      });
    }
    
    return mockVotes;
  }
};

// Get activities by user (for yaps count)
export const getUserActivities = async (userkey: string, limit = 1000): Promise<EthosActivity[]> => {
  try {
    // Use the POST endpoint for activities as per v2 API
    const response = await api.post('/activities/profile/given', {
      userkey,
      limit,
      offset: 0,
      orderBy: {
        field: 'timestamp',
        direction: 'desc'
      }
    });
    
    // Transform the v2 response to our format
    const activities = response.data.values || [];
    return activities.map((activity: any) => ({
      id: activity.data?.id || Math.random(),
      type: activity.type,
      author: userkey,
      content: activity.data?.comment || '',
      timestamp: new Date(activity.timestamp * 1000).toISOString(),
      totalVotes: (activity.votes?.upvotes || 0) + (activity.votes?.downvotes || 0),
      netVotes: (activity.votes?.upvotes || 0) - (activity.votes?.downvotes || 0),
    }));
  } catch (error) {
    // Return mock data for testing
    console.warn('Activities API not available, using mock data');
    const mockActivities: EthosActivity[] = [];
    const activityCount = Math.floor(Math.random() * 50);
    
    for (let i = 0; i < activityCount; i++) {
      mockActivities.push({
        id: i + 1,
        type: 'attestation',
        author: userkey,
        content: `Mock yap ${i + 1}`,
        timestamp: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
        totalVotes: Math.floor(Math.random() * 100),
        netVotes: Math.floor(Math.random() * 50) - 25,
      });
    }
    
    return mockActivities;
  }
};

// Calculate comprehensive user metrics
export const calculateUserMetrics = async (userkey: string, userStats?: any): Promise<UserMetrics> => {
  try {
    // If we have user stats from the search response, use them
    if (userStats) {
      const stats = userStats.stats || {};
      const reviewStats = stats.review?.received || { positive: 0, neutral: 0, negative: 0 };
      const vouchStats = stats.vouch || { given: { count: 0, amountWeiTotal: "0" }, received: { count: 0, amountWeiTotal: "0" } };
      
      return {
        score: userStats.score || 0,
        twitterFollowers: 0, // Not available in API
        yapsCount: 0, // Will be fetched separately
        totalXp: userStats.xpTotal || 0,
        xpStreak: userStats.xpStreakDays || 0,
        reviewsReceived: {
          total: reviewStats.positive + reviewStats.neutral + reviewStats.negative,
          positive: reviewStats.positive,
          neutral: reviewStats.neutral,
          negative: reviewStats.negative,
        },
        reviewsGiven: 0, // Not available in user stats
        vouchesGiven: vouchStats.given?.count || 0,
        vouchesReceived: vouchStats.received?.count || 0,
        ethVouchedGiven: parseFloat(vouchStats.given?.amountWeiTotal || "0") / 1e18, // Convert from Wei to ETH
        ethVouchedReceived: parseFloat(vouchStats.received?.amountWeiTotal || "0") / 1e18, // Convert from Wei to ETH
        totalVotesCast: 0, // Will be fetched separately
      };
    }

    // Fallback to individual API calls
    const [score, xp, reviewsReceived, reviewsGiven, vouchesGiven, vouchesReceived, votesCast, activities] = await Promise.all([
      getUserScore(userkey),
      getUserXP(userkey),
      getReviewsReceived(userkey),
      getReviewsGiven(userkey),
      getVouchesGiven(userkey),
      getVouchesReceived(userkey),
      getVotesCast(userkey),
      getUserActivities(userkey),
    ]);

    // Calculate review breakdown
    const reviewBreakdown = reviewsReceived.reduce(
      (acc, review) => {
        acc.total++;
        acc[review.rating]++;
        return acc;
      },
      { total: 0, positive: 0, neutral: 0, negative: 0 }
    );

    // Calculate ETH vouched amounts
    const ethVouchedGiven = vouchesGiven.reduce((sum, vouch) => sum + vouch.amount, 0);
    const ethVouchedReceived = vouchesReceived.reduce((sum, vouch) => sum + vouch.amount, 0);

    return {
      score: score.score || 0,
      twitterFollowers: 0, // Will be filled from user data
      yapsCount: activities.length,
      totalXp: xp.totalXp || 0,
      xpStreak: xp.currentStreak || 0,
      reviewsReceived: reviewBreakdown,
      reviewsGiven: reviewsGiven.length,
      vouchesGiven: vouchesGiven.length,
      vouchesReceived: vouchesReceived.length,
      ethVouchedGiven,
      ethVouchedReceived,
      totalVotesCast: votesCast.length,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

// Get user contributions history
export const getUserContributions = async (userkey: string, duration = '1y'): Promise<any> => {
  try {
    const response = await api.get(`/contributions/history?duration=${duration}`);
    return response.data;
  } catch (error) {
    // Return mock data for testing
    console.warn('Contributions API not available, using mock data');
    return {
      history: Array.from({ length: 12 }, (_, i) => ({
        date: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tasks: Math.floor(Math.random() * 10)
      }))
    };
  }
};

// Get complete user profile with metrics
export const getCompleteUserProfile = async (twitterUsername: string): Promise<{ user: EthosUser; metrics: UserMetrics }> => {
  try {
    // Search for the user by username using the correct v2 endpoint
    const searchResponse = await api.get(`/users/search?query=${twitterUsername}`);
    
    if (searchResponse.data?.values && searchResponse.data.values.length > 0) {
      // Find exact match, prioritizing ACTIVE users
      const exactMatches = searchResponse.data.values.filter((user: any) => 
        user.username?.toLowerCase() === twitterUsername.toLowerCase()
      );
      
      // Prioritize ACTIVE users, then take the first match
      const activeUser = exactMatches.find((user: any) => user.status === 'ACTIVE');
      const apiUser = activeUser || exactMatches[0] || searchResponse.data.values[0];
      
      // Transform the API response to our EthosUser format
      const user: EthosUser = {
        userkey: apiUser.userkeys?.[0] || `user_${apiUser.id}`,
        username: apiUser.username,
        displayName: apiUser.displayName,
        avatar: apiUser.avatarUrl,
        bio: apiUser.description,
        twitterUsername: apiUser.username,
        twitterFollowers: 0, // Not available in API response
        twitterVerified: false, // Not available in API response
        score: apiUser.score || 0,
        xp: apiUser.xpTotal || 0,
        xpStreak: apiUser.xpStreakDays || 0,
        createdAt: new Date().toISOString(), // Not available in API response
        updatedAt: new Date().toISOString(), // Not available in API response
      };
      
      // Calculate metrics using the user stats from the API response
      const metrics = await calculateUserMetrics(user.userkey, apiUser.stats);
      
      // Try to get activities count for yaps
      try {
        const activities = await getUserActivities(user.userkey);
        metrics.yapsCount = activities.length;
      } catch (error) {
        console.warn('Could not fetch activities, using 0 for yaps count');
        metrics.yapsCount = 0;
      }
      
      return { user, metrics };
    }
    
    throw new Error(`User not found: ${twitterUsername}`);
  } catch (error) {
    // If search fails, create a mock user for testing
    console.warn('API not available, using mock data for testing');
    const mockUser: EthosUser = {
      userkey: `mock_${twitterUsername}`,
      username: twitterUsername,
      displayName: twitterUsername,
      avatar: '',
      bio: '',
      twitterUsername: twitterUsername,
      twitterFollowers: Math.floor(Math.random() * 10000),
      twitterVerified: false,
      score: Math.floor(Math.random() * 1000),
      xp: Math.floor(Math.random() * 5000),
      xpStreak: Math.floor(Math.random() * 30),
      level: 'neutral',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: {
        review: {
          received: {
            positive: Math.floor(Math.random() * 10),
            neutral: Math.floor(Math.random() * 5),
            negative: Math.floor(Math.random() * 3)
          }
        },
        vouch: {
          given: {
            amountWeiTotal: (Math.floor(Math.random() * 50) * Math.pow(10, 18)).toString(),
            count: Math.floor(Math.random() * 20)
          },
          received: {
            amountWeiTotal: (Math.floor(Math.random() * 100) * Math.pow(10, 18)).toString(),
            count: Math.floor(Math.random() * 30)
          }
        }
      }
    };
    
    const mockMetrics = await calculateUserMetrics(mockUser.userkey);
    
    return { user: mockUser, metrics: mockMetrics };
  }
}; 

// Search cache for faster repeated queries
const searchCache = new Map<string, { data: any[]; timestamp: number }>();
const SEARCH_CACHE_DURATION = 30 * 1000; // Reduced to 30 seconds for faster updates

// Clear cache on initialization
searchCache.clear();

// Get cached search results
const getCachedSearch = (query: string) => {
  const cached = searchCache.get(query.toLowerCase());
  if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

// Set cached search results
const setCachedSearch = (query: string, data: any[]) => {
  searchCache.set(query.toLowerCase(), { data, timestamp: Date.now() });
};

// Clear search cache
export const clearSearchCache = () => {
  searchCache.clear();
  console.log('Search cache cleared');
};

// Search for profiles using the Ethos API
export const searchProfiles = async (query: string): Promise<any[]> => {
  if (query.length < 3) return [];

  console.log('🔍 searchProfiles called with:', query);

  // Check cache first (but not for exact username searches)
  const isExactSearch = query.length >= 3 && query.length <= 20; // Likely exact username
  const cached = isExactSearch ? null : getCachedSearch(query);
  if (cached) {
    console.log('📦 Returning cached search results');
    return cached;
  }

  try {
    // Use the faster API v1 endpoint for search suggestions
    const searchResponse = await axios.get(`https://api.ethos.network/api/v1/search?query=${encodeURIComponent(query)}&limit=20`);
    
    console.log('📡 Search response received:', JSON.stringify(searchResponse.data, null, 2));
    
    if (searchResponse.data?.ok && searchResponse.data.data?.values && searchResponse.data.data.values.length > 0) {
      console.log(`📋 Found ${searchResponse.data.data.values.length} users`);
      
      // Transform the v1 API response to our search result format
      const profiles = searchResponse.data.data.values.map((user: any) => ({
        id: user.profileId || Math.random(), // Use profileId or generate random ID
        username: user.username,
        displayName: user.name,
        avatarUrl: user.avatar,
        score: user.score || 0,
        userkeys: user.userkey ? [user.userkey] : [],
        xpTotal: 0, // v1 doesn't provide XP data
        xpStreakDays: 0, // v1 doesn't provide XP streak data
        description: user.description || '',
        primaryAddress: user.primaryAddress || ''
      }));

      // Remove duplicates based on username and prioritize profiles with profileId
      const uniqueProfiles = profiles.reduce((acc: any[], profile: any) => {
        const existingIndex = acc.findIndex((p: any) => p.username === profile.username);
        
        if (existingIndex === -1) {
          // New username, add it
          acc.push(profile);
        } else {
          // Username already exists, prioritize profiles with profileId
          const existing = acc[existingIndex];
          if (profile.id && !existing.id) {
            // Replace with profile that has profileId
            acc[existingIndex] = profile;
          }
        }
        
        return acc;
      }, []);

      console.log(`🎯 After deduplication: ${uniqueProfiles.length} profiles`);

      // Optimized filtering - prioritize exact matches and active users
      const matchingProfiles = uniqueProfiles.filter((profile: any) => {
        const queryLower = query.toLowerCase();
        const usernameLower = profile.username.toLowerCase();
        const displayNameLower = (profile.displayName || '').toLowerCase();
        const descriptionLower = (profile.description || '').toLowerCase();
        
        // More strict matching: username should start with query or be exact match
        const usernameStartsWith = usernameLower.startsWith(queryLower);
        const usernameExact = usernameLower === queryLower;
        const displayNameStartsWith = displayNameLower.startsWith(queryLower);
        const descriptionContains = descriptionLower.includes(queryLower);
        
        return usernameExact || usernameStartsWith || displayNameStartsWith || descriptionContains;
      });

      console.log(`✅ After filtering: ${matchingProfiles.length} matching profiles`);

      // Enhanced sorting: exact matches first, then by score
      const result = matchingProfiles
        .sort((a: any, b: any) => {
          const aExact = a.username.toLowerCase() === query.toLowerCase();
          const bExact = b.username.toLowerCase() === query.toLowerCase();
          
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          
          // For exact matches, prioritize profiles with profileId
          if (aExact && bExact) {
            if (a.id && !b.id) return -1;
            if (!a.id && b.id) return 1;
          }
          
          // Then sort by score descending
          return b.score - a.score;
        })
        .slice(0, 10);

      console.log('📊 Final result:', result.map((p: any) => ({ username: p.username, score: p.score })));

      // Cache the result (but not for exact searches)
      if (!isExactSearch) {
        setCachedSearch(query, result);
      }
      return result;
    }
    
    console.log('❌ No search results found');
    return [];
  } catch (error) {
    console.error('Search profiles error:', error);
    return [];
  }
}; 

// Search for exact username match
export const searchExactUsername = async (username: string): Promise<any | null> => {
  if (username.length < 3) return null;

  try {
    console.log('🔍 searchExactUsername called with:', username);
    
    // Try exact username search
    const searchResponse = await api.get(`/users/search?query=${encodeURIComponent(username)}`);
    
    console.log('📡 Exact search response:', JSON.stringify(searchResponse.data, null, 2));
    
    if (searchResponse.data?.values && searchResponse.data.values.length > 0) {
      // Look for exact match (case-insensitive)
      const exactMatch = searchResponse.data.values.find((user: any) => 
        user.username.toLowerCase() === username.toLowerCase()
      );
      
      if (exactMatch) {
        console.log('✅ Found exact match:', exactMatch.username);
        return {
          id: exactMatch.id,
          username: exactMatch.username,
          displayName: exactMatch.displayName,
          avatarUrl: exactMatch.avatarUrl,
          score: exactMatch.score || 0,
          status: exactMatch.status,
          userkeys: exactMatch.userkeys || [],
          xpTotal: exactMatch.xpTotal || 0,
          xpStreakDays: exactMatch.xpStreakDays || 0,
        };
      }
      
      console.log('❌ No exact match found in search results');
    }
    
    return null;
  } catch (error) {
    console.error('Exact username search error:', error);
    return null;
  }
}; 