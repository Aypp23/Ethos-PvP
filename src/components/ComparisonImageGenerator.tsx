import { useRef } from "react";
import { Download, Share2 } from "lucide-react";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { EthosUser } from '../types';

interface ComparisonImageGeneratorProps {
  user1: EthosUser | null;
  user2: EthosUser | null;
}

export const ComparisonImageGenerator = ({ user1, user2 }: ComparisonImageGeneratorProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const getKeyStats = (user: EthosUser) => {
    // Format large numbers with k/m abbreviations
    const formatNumber = (num: number): string => {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'm';
      } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'k';
      }
      return num.toString();
    };

    return {
      ethosScore: user.score || 0,
      totalXP: user.xp || 0,
      totalXPFormatted: formatNumber(user.xp || 0),
      totalReviews: (user.stats?.review?.received?.positive || 0) + 
                   (user.stats?.review?.received?.neutral || 0) + 
                   (user.stats?.review?.received?.negative || 0),
      ethVouchReceived: user.stats?.vouch?.received?.amountWeiTotal ? parseFloat(user.stats.vouch.received.amountWeiTotal) / Math.pow(10, 18) : 0
    };
  };

  const generateImage = async () => {
    if (!canvasRef.current || !user1 || !user2) {
      toast.error("Please ensure both profiles are loaded");
      return;
    }

    try {
      toast("Generating comparison image...");
      
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        height: canvasRef.current.offsetHeight,
        width: canvasRef.current.offsetWidth,
      });

      // Create download link
      const link = document.createElement("a");
      link.download = `ethos-comparison-${user1.username.replace(/[^a-zA-Z0-9]/g, '')}-vs-${user2.username.replace(/[^a-zA-Z0-9]/g, '')}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      toast.success("Comparison image downloaded!");
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image. Please try again.");
    }
  };

  const shareComparison = async () => {
    if (!user1 || !user2) {
      toast.error("Please ensure both profiles are loaded");
      return;
    }

    try {
      const comparisonUrl = `${window.location.origin}${window.location.pathname}?user1=${user1.username}&user2=${user2.username}`;
      const tweetText = `Check out this comparison between ${user1.displayName} (@${user1.username}) and ${user2.displayName} (@${user2.username}) on Ethos! 🏆\n\nCompare profiles: ${comparisonUrl}`;
      
      const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
      
      window.open(twitterShareUrl, '_blank', 'width=600,height=400');
      toast.success("Opening Twitter share dialog!");
    } catch (error) {
      console.error("Error sharing comparison:", error);
      toast.error("Failed to share comparison. Please try again.");
    }
  };

  if (!user1 || !user2) {
    return (
      <div className="text-center py-8">
        <p className="text-text-dark">Two profiles are required to generate a comparison image.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-6 mt-32">
        <h2 className="font-queens text-2xl md:text-3xl font-bold mb-2 text-text-dark">
          Generate Comparison Image
        </h2>
        <p className="text-text-dark/70 mb-4">
          Create a beautiful comparison image to share
        </p>
        <div className="flex gap-4 justify-center items-center">
          <button 
            onClick={generateImage}
            className="text-text-primary px-6 py-3 text-lg font-inter font-semibold rounded-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
            style={{ fontFeatureSettings: '"calt" 0', backgroundColor: '#4b4a44' }}
          >
            <Download className="w-4 h-4 mr-2 inline" />
            Download Comparison
          </button>
          <button 
            onClick={shareComparison}
            className="p-3 rounded-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
            style={{ fontFeatureSettings: '"calt" 0', color: 'rgb(35, 35, 32)' }}
            title="Share to Twitter"
          >
            <Share2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div 
        ref={canvasRef}
        className="bg-gradient-light p-12 rounded-xl shadow-2xl"
        style={{ fontFamily: 'Inter, sans-serif', position: 'absolute', left: '-9999px', top: '-9999px' }}
      >
        {/* Header with Logo */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img 
              src="/ethos-pvp-logo.png" 
              alt="Ethos PvP Logo" 
              className="h-48 md:h-56 object-contain invert"
            />
          </div>
          <h1 className="text-4xl font-bold mb-3" style={{ color: 'rgb(35, 35, 32)' }}>
            Profile Comparison
          </h1>
          <p className="text-lg" style={{ color: 'rgb(35, 35, 32)' }}>
            Head-to-Head Performance Analysis
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-2 gap-6">
          {[user1, user2].map((user, index) => {
            const stats = getKeyStats(user);
            return (
              <div key={user.username} className="overflow-hidden rounded-[32px] shadow-lg max-w-md w-full bg-white border border-[#2d2d29]">
                <div className="p-6 pb-4">
                  {/* Profile Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <img
                        src={user.avatar || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png'}
                        alt={user.displayName}
                        className="w-16 h-16 rounded-full border-4 border-white/30 shadow-lg object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1" style={{ color: 'rgb(35, 35, 32)' }}>
                        {user.displayName}
                      </h3>
                      <p className="text-sm mb-2" style={{ color: 'rgb(35, 35, 32)' }}>
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
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ color: 'rgb(35, 35, 32)' }}>
                        {user.level ? user.level.charAt(0).toUpperCase() + user.level.slice(1) : 'User'}
                      </span>
                    </div>
                  </div>
                </div>

                                {/* Key Stats */}
                <div className="mx-6 mb-6 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700">Ethos Score</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{stats.ethosScore.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700">Total XP</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{stats.totalXPFormatted}</span>
                  </div>

                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700">Total Reviews</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{stats.totalReviews.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700">ETH Vouch Received</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900 ml-4">{stats.ethVouchReceived.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>


      </div>
    </div>
  );
}; 