import React from 'react';
import { User, Twitter, Star, Zap, MessageSquare, ThumbsUp, Award, Coins } from 'lucide-react';
import { EthosUser, UserMetrics } from '../types';
import MetricCard from './MetricCard';

interface ProfileCardProps {
  user: EthosUser;
  metrics: UserMetrics;
  isLoading?: boolean;
  error?: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user, metrics, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Profile</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
          {user.avatar ? (
            <img src={user.avatar} alt={user.displayName || user.username || 'User'} className="w-16 h-16 rounded-full" />
          ) : (
            <User className="w-8 h-8 text-white" />
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">
            {user.displayName || user.username || 'Unknown User'}
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {user.twitterUsername && (
              <div className="flex items-center gap-1">
                <Twitter className="w-4 h-4" />
                <span>@{user.twitterUsername}</span>
              </div>
            )}
          </div>
          {user.bio && (
            <p className="text-sm text-gray-600 mt-1">{user.bio}</p>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Ethos Score"
          value={metrics.score}
          icon={<Star className="w-4 h-4" />}
          className="col-span-2 md:col-span-1"
        />
        
        <MetricCard
          title="Twitter Followers"
          value={metrics.twitterFollowers}
          icon={<Twitter className="w-4 h-4" />}
        />
        
        <MetricCard
          title="Yaps"
          value={metrics.yapsCount}
          icon={<MessageSquare className="w-4 h-4" />}
        />
        
        <MetricCard
          title="Total XP"
          value={metrics.totalXp}
          icon={<Zap className="w-4 h-4" />}
        />
        
        <MetricCard
          title="XP Streak"
          value={metrics.xpStreak}
          subtitle="days"
          icon={<Zap className="w-4 h-4" />}
        />
        
        <MetricCard
          title="Reviews Received"
          value={metrics.reviewsReceived.total}
          icon={<Star className="w-4 h-4" />}
        />
        
        <MetricCard
          title="Positive Reviews"
          value={metrics.reviewsReceived.positive}
          icon={<Star className="w-4 h-4" />}
          className="text-green-600"
        />
        
        <MetricCard
          title="Neutral Reviews"
          value={metrics.reviewsReceived.neutral}
          icon={<Star className="w-4 h-4" />}
          className="text-yellow-600"
        />
        
        <MetricCard
          title="Negative Reviews"
          value={metrics.reviewsReceived.negative}
          icon={<Star className="w-4 h-4" />}
          className="text-red-600"
        />
        
        <MetricCard
          title="Reviews Given"
          value={metrics.reviewsGiven}
          icon={<Star className="w-4 h-4" />}
        />
        
        <MetricCard
          title="Vouches Given"
          value={metrics.vouchesGiven}
          icon={<Award className="w-4 h-4" />}
        />
        
        <MetricCard
          title="Vouches Received"
          value={metrics.vouchesReceived}
          icon={<Award className="w-4 h-4" />}
        />
        
        <MetricCard
          title="ETH Vouched Given"
          value={`${metrics.ethVouchedGiven.toFixed(2)} ETH`}
          icon={<Coins className="w-4 h-4" />}
        />
        
        <MetricCard
          title="ETH Vouched Received"
          value={`${metrics.ethVouchedReceived.toFixed(2)} ETH`}
          icon={<Coins className="w-4 h-4" />}
        />
        
        <MetricCard
          title="Total Votes Cast"
          value={metrics.totalVotesCast}
          icon={<ThumbsUp className="w-4 h-4" />}
        />
      </div>
    </div>
  );
};

export default ProfileCard; 