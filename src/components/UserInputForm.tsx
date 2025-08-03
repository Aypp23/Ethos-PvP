import React, { useState } from 'react';
import { Search, Users, ArrowRight } from 'lucide-react';

interface UserInputFormProps {
  onCompare: (username1: string, username2: string) => void;
  isLoading?: boolean;
}

const UserInputForm: React.FC<UserInputFormProps> = ({ onCompare, isLoading }) => {
  const [username1, setUsername1] = useState('');
  const [username2, setUsername2] = useState('');
  const [errors, setErrors] = useState<{ username1?: string; username2?: string }>({});

  const validateForm = () => {
    const newErrors: { username1?: string; username2?: string } = {};

    if (!username1.trim()) {
      newErrors.username1 = 'First username is required';
    } else if (username1.trim().length < 1) {
      newErrors.username1 = 'Username must be at least 1 character';
    }

    if (!username2.trim()) {
      newErrors.username2 = 'Second username is required';
    } else if (username2.trim().length < 1) {
      newErrors.username2 = 'Username must be at least 1 character';
    }

    if (username1.trim().toLowerCase() === username2.trim().toLowerCase()) {
      newErrors.username2 = 'Usernames must be different';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onCompare(username1.trim(), username2.trim());
    }
  };

  const handleSwapUsernames = () => {
    const temp = username1;
    setUsername1(username2);
    setUsername2(temp);
    setErrors({});
  };

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ethos Profile Comparison</h1>
        <p className="text-gray-600">
          Compare two Ethos profiles by entering their X (Twitter) usernames
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Username Input */}
          <div>
            <label htmlFor="username1" className="block text-sm font-medium text-gray-700 mb-2">
              First Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="username1"
                value={username1}
                onChange={(e) => {
                  setUsername1(e.target.value);
                  if (errors.username1) setErrors({ ...errors, username1: undefined });
                }}
                placeholder="Enter X username"
                className={`input-field pl-10 ${errors.username1 ? 'border-red-500 focus:ring-red-500' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.username1 && (
              <p className="mt-1 text-sm text-red-600">{errors.username1}</p>
            )}
          </div>

          {/* Second Username Input */}
          <div>
            <label htmlFor="username2" className="block text-sm font-medium text-gray-700 mb-2">
              Second Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="username2"
                value={username2}
                onChange={(e) => {
                  setUsername2(e.target.value);
                  if (errors.username2) setErrors({ ...errors, username2: undefined });
                }}
                placeholder="Enter X username"
                className={`input-field pl-10 ${errors.username2 ? 'border-red-500 focus:ring-red-500' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.username2 && (
              <p className="mt-1 text-sm text-red-600">{errors.username2}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={isLoading || !username1.trim() || !username2.trim()}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Comparing Profiles...
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                Compare Profiles
              </>
            )}
          </button>
          
          {username1 && username2 && (
            <button
              type="button"
              onClick={handleSwapUsernames}
              disabled={isLoading}
              className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Swap
            </button>
          )}
        </div>
      </form>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">How to use:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Enter two X (Twitter) usernames without the @ symbol</li>
          <li>• Both users must have Ethos profiles linked to their X accounts</li>
          <li>• The comparison will show detailed metrics for both profiles</li>
          <li>• Use the swap button to quickly switch the order of comparison</li>
        </ul>
      </div>
    </div>
  );
};

export default UserInputForm; 