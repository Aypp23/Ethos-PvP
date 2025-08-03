export interface EthosUser {
  userkey: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  twitterUsername: string;
  twitterFollowers: number;
  twitterVerified: boolean;
  score: number;
  xp: number;
  xpStreak: number;
  level?: string;
  createdAt: string;
  updatedAt: string;
  stats?: {
    review?: {
      received?: {
        positive: number;
        neutral: number;
        negative: number;
      };
      given?: {
        positive: number;
        neutral: number;
        negative: number;
      };
    };
    vouch?: {
      given?: {
        amountWeiTotal: string;
        count: number;
      };
      received?: {
        amountWeiTotal: string;
        count: number;
      };
    };
  };
}

export interface EthosScore {
  userkey: string;
  score: number;
  level?: string;
  rank?: number;
  percentile?: number;
}

export interface EthosXP {
  userkey: string;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
}

export interface EthosReview {
  id: number;
  author: string;
  subject: string;
  rating: 'positive' | 'neutral' | 'negative';
  content?: string;
  createdAt: string;
}

export interface EthosVote {
  id: number;
  voter: string;
  activityId: number;
  activityType: string;
  direction: 'up' | 'down';
  createdAt: string;
}

export interface EthosVouch {
  id: number;
  voucher: string;
  vouchee: string;
  amount: number;
  createdAt: string;
}

export interface EthosActivity {
  id: number;
  type: string;
  author: string;
  subject?: string;
  content?: string;
  timestamp: string;
  totalVotes: number;
  netVotes: number;
}

export interface ProfileComparison {
  user1: EthosUser;
  user2: EthosUser;
  user1Metrics: UserMetrics;
  user2Metrics: UserMetrics;
}

export interface UserMetrics {
  score: number;
  twitterFollowers: number;
  yapsCount: number;
  totalXp: number;
  xpStreak: number;
  reviewsReceived: {
    total: number;
    positive: number;
    neutral: number;
    negative: number;
  };
  reviewsGiven: number;
  vouchesGiven: number;
  vouchesReceived: number;
  ethVouchedGiven: number;
  ethVouchedReceived: number;
  totalVotesCast: number;
}

export interface UserData {
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
  // Add vouch statistics
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

export interface ApiError {
  message: string;
  status?: number;
}

export interface SearchResult {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string;
  score: number;
  userkeys: string[];
  xpTotal: number;
  xpStreakDays: number;
  description?: string;
  primaryAddress?: string;
} 