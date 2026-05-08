'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getUserProfile, saveRating, getProfile, saveProfile, ProfileData } from '@/lib/store';
import { UserProfile } from '@/types';
import JobCard from '@/components/ui/JobCard';
import { toast } from '@/components/ui/Toast';
import {
  Star, CheckCircle, DollarSign, TrendingUp, Briefcase,
  Copy, Award, MessageSquare, Edit2, Save, X,
  AtSign, Globe, GitBranch, ExternalLink
} from 'lucide-react';

export default function ProfilePage() {
  const { address } = useParams<{ address: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [userAddress, setUserAddress] = useState('');
  const [tab, setTab] = useState<'active' | 'completed' | 'posted'>('active');
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    bio: '',
    skills: '',
    twitter: '',
    github: '',
    website: '',
  });

  useEffect(() => {
    const addr = localStorage.getItem('walletAddress') || '';
    setUserAddress(addr);
    loadProfile();
  }, [address]);

  function loadProfile() {
    const p = getUserProfile(address);
    setProfile(p);
    const pd = getProfile(address);
    if (pd) {
      setProfileData(pd);
      setEditForm({
        username: pd.username || '',
        bio: pd.bio || '',
        skills: pd.skills?.join(', ') || '',
        twitter: pd.twitter || '',
        github: pd.github || '',
        website: pd.website || '',
      });
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(address);
    toast('Address copied!', 'success');
  }

  function handleRating(r: number) {
    if (!userAddress || userAddress.toLowerCase() === address.toLowerCase()) return;
    setSelectedRating(r);
    saveRating('general', userAddress, address, r);
    setRatingSubmitted(true);
    toast('Rating submitted!', 'success');
    loadProfile();
  }

  function handleSaveProfile() {
    const pd: ProfileData = {
      address: address as `0x${string}`,
      username: editForm.username,
      bio: editForm.bio,
      skills: editForm.skills.split(',').map(s => s.trim()).filter(Boolean),
      twitter: editForm.twitter,
      github: editForm.github,
      website: editForm.website,
      updatedAt: new Date().toISOString(),
    };
    saveProfile(pd);
    setProfileData(pd);
    setEditing(false);
    toast('Profile updated!', 'success');
  }

  function handleMessage() {
    if (!userAddress) {
      toast('Connect your wallet first.', 'error');
      return;
    }
    const jobId = profile?.activeJobs[0]?.id || 'general';
    router.push('/app/messages?jobId=' + jobId + '&with=' + address);
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  const isOwnProfile = userAddress.toLowerCase() === address.toLowerCase();
  const postedJobs = profile.activeJobs.filter(j => j.client.toLowerCase() === address.toLowerCase());
  const activeAsProvider = profile.activeJobs.filter(j => j.provider?.toLowerCase() === address.toLowerCase());
  const displayJobs = tab === 'active' ? activeAsProvider
    : tab === 'completed' ? profile.completedJobsList
    : postedJobs;

  const stats = [
    { label: 'Completed', value: profile.completedJobs, icon: <CheckCircle className="w-5 h-5 text-green-500" />, color: 'bg-green-500/10' },
    { label: 'Earned', value: '$' + profile.totalEarned, icon: <TrendingUp className="w-5 h-5 text-purple-500" />, color: 'bg-purple-500/10' },
    { label: 'Spent', value: '$' + profile.totalSpent, icon: <DollarSign className="w-5 h-5 text-yellow-500" />, color: 'bg-yellow-500/10' },
    { label: 'Active', value: profile.activeJobs.length, icon: <Briefcase className="w-5 h-5 text-blue-500" />, color: 'bg-blue-500/10' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Profile Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">

            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-3">
                {address.slice(2, 4).toUpperCase()}
              </div>

              {editing ? (
                <input
                  value={editForm.username}
                  onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))}
                  placeholder="Your name"
                  className="text-center w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm mb-2 text-gray-900 dark:text-white"
                />
              ) : (
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {profileData?.username || address.slice(0, 6) + '...' + address.slice(-4)}
                </h1>
              )}

              <div className="flex items-center gap-2 flex-wrap justify-center">
                <button onClick={handleCopy} className="text-xs text-gray-400 hover:text-blue-500 flex items-center gap-1">
                  <Copy className="w-3 h-3" />
                  {address.slice(0, 6)}...{address.slice(-4)}
                </button>
                {profile.completedJobs >= 5 && (
                  <span className="flex items-center gap-1 text-xs bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 px-2 py-0.5 rounded-full">
                    <Award className="w-3 h-3" /> Top Provider
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-3">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className={star <= (profile.rating || 0) ? 'w-4 h-4 text-yellow-500 fill-yellow-500' : 'w-4 h-4 text-gray-300'} />
                ))}
                <span className="text-xs text-gray-500 ml-1">
                  {profile.rating > 0 ? profile.rating + ' (' + profile.ratingCount + ')' : 'No reviews'}
                </span>
              </div>
            </div>

            {editing ? (
              <textarea
                value={editForm.bio}
                onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))}
                rows={3}
                placeholder="Tell others about yourself..."
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm resize-none mb-3 text-gray-900 dark:text-white"
              />
            ) : profileData?.bio ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">{profileData.bio}</p>
            ) : null}

            {editing ? (
              <div className="mb-3">
                <label className="text-xs text-gray-500 mb-1 block">Skills (comma separated)</label>
                <input
                  value={editForm.skills}
                  onChange={e => setEditForm(p => ({ ...p, skills: e.target.value }))}
                  placeholder="Design, Figma, React..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white"
                />
              </div>
            ) : profileData?.skills && profileData.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mb-4 justify-center">
                {profileData.skills.map(skill => (
                  <span key={skill} className="text-xs bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            ) : null}

            {editing ? (
              <div className="space-y-2 mb-4">
                <input value={editForm.twitter} onChange={e => setEditForm(p => ({ ...p, twitter: e.target.value }))}
                  placeholder="Twitter username"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white" />
                <input value={editForm.github} onChange={e => setEditForm(p => ({ ...p, github: e.target.value }))}
                  placeholder="GitHub username"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white" />
                <input value={editForm.website} onChange={e => setEditForm(p => ({ ...p, website: e.target.value }))}
                  placeholder="Website URL"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white" />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4 mb-4">
                {profileData?.twitter && (
                  <button onClick={() => window.open('https://twitter.com/' + profileData.twitter, '_blank')}
                    className="text-gray-400 hover:text-blue-400 transition-colors">
                    <AtSign className="w-4 h-4" />
                  </button>
                )}
                {profileData?.github && (
                  <button onClick={() => window.open('https://github.com/' + profileData.github, '_blank')}
                    className="text-gray-400 hover:text-gray-600 transition-colors">
                    <GitBranch className="w-4 h-4" />
                  </button>
                )}
                {profileData?.website && (
                  <button onClick={() => window.open(profileData.website, '_blank')}
                    className="text-gray-400 hover:text-blue-500 transition-colors">
                    <Globe className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => window.open('https://testnet.arcscan.app/address/' + address, '_blank')}
                  className="text-gray-400 hover:text-blue-500 transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            )}

            {isOwnProfile ? (
              editing ? (
                <div className="flex gap-2">
                  <button onClick={handleSaveProfile}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-xl text-sm font-medium transition-colors">
                    <Save className="w-4 h-4" /> Save
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-2 rounded-xl text-sm font-medium transition-colors">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditing(true)}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl text-sm font-medium transition-colors">
                  <Edit2 className="w-4 h-4" /> Edit Profile
                </button>
              )
            ) : (
              <div className="space-y-2">
                {userAddress && (
                  <button onClick={handleMessage}
                    className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
                    <MessageSquare className="w-4 h-4" /> Send Message
                  </button>
                )}
                {!ratingSubmitted && userAddress && (
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 text-center mb-2">Rate this user</p>
                    <div className="flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onClick={() => handleRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}>
                          <Star className={star <= (hoverRating || selectedRating) ? 'w-6 h-6 text-yellow-500 fill-yellow-500' : 'w-6 h-6 text-gray-300'} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {ratingSubmitted && (
                  <p className="text-xs text-green-500 text-center flex items-center justify-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Rating submitted!
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {stats.map(stat => (
              <div key={stat.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <div className={`w-9 h-9 ${stat.color} rounded-lg flex items-center justify-center mb-2`}>
                  {stat.icon}
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Jobs */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {[
                { key: 'active', label: 'Active Work (' + activeAsProvider.length + ')' },
                { key: 'posted', label: 'Posted Jobs (' + postedJobs.length + ')' },
                { key: 'completed', label: 'Completed (' + profile.completedJobsList.length + ')' },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
                  className={`flex-1 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                    tab === t.key
                      ? 'border-blue-500 text-blue-500'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-5">
              {displayJobs.length === 0 ? (
                <div className="text-center py-16">
                  <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No jobs in this category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {displayJobs.map(job => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}