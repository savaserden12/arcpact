'use client';

import { useState, useEffect } from 'react';
import { Job } from '@/types';
import { getJobsByAddress, getStats, getUserProfile } from '@/lib/store';
import JobCard from '@/components/ui/JobCard';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  Briefcase, DollarSign, CheckCircle, Star,
  TrendingUp, Clock, Users, Wallet
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [address, setAddress] = useState('');
  const [clientJobs, setClientJobs] = useState<Job[]>([]);
  const [providerJobs, setProviderJobs] = useState<Job[]>([]);
  const [tab, setTab] = useState<'client' | 'provider'>('client');
  const [profile, setProfile] = useState({
    completedJobs: 0,
    totalEarned: '0',
    totalSpent: '0',
    rating: 0,
    ratingCount: 0,
  });

  useEffect(() => {
    const addr = localStorage.getItem('walletAddress') || '';
    setAddress(addr);
    if (addr) {
      const { asClient, asProvider } = getJobsByAddress(addr);
      setClientJobs(asClient);
      setProviderJobs(asProvider);
      const p = getUserProfile(addr);
      setProfile(p);
    }
  }, []);

  if (!address) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Wallet className="w-12 h-12 text-gray-400" />
      <p className="text-xl font-semibold text-gray-900 dark:text-white">Connect your wallet</p>
      <p className="text-gray-500 dark:text-gray-400">Connect your wallet to view your dashboard.</p>
    </div>
  );

  const stats = [
    {
      label: 'Jobs Posted',
      value: clientJobs.length,
      icon: <Briefcase className="w-5 h-5 text-blue-500" />,
      color: 'bg-blue-500/10',
    },
    {
      label: 'Jobs Completed',
      value: profile.completedJobs,
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      color: 'bg-green-500/10',
    },
    {
      label: 'Total Earned',
      value: `$${profile.totalEarned}`,
      icon: <TrendingUp className="w-5 h-5 text-purple-500" />,
      color: 'bg-purple-500/10',
    },
    {
      label: 'Total Spent',
      value: `$${profile.totalSpent}`,
      icon: <DollarSign className="w-5 h-5 text-yellow-500" />,
      color: 'bg-yellow-500/10',
    },
    {
      label: 'Rating',
      value: profile.rating > 0 ? `${profile.rating} ★` : 'N/A',
      icon: <Star className="w-5 h-5 text-orange-500" />,
      color: 'bg-orange-500/10',
    },
    {
      label: 'Applications',
      value: providerJobs.length,
      icon: <Users className="w-5 h-5 text-pink-500" />,
      color: 'bg-pink-500/10',
    },
  ];

  const displayJobs = tab === 'client' ? clientJobs : providerJobs;
  const activeJobs = displayJobs.filter(j => ['Open', 'Funded', 'Submitted'].includes(j.status));
  const completedJobs = displayJobs.filter(j => ['Completed', 'Rejected', 'Expired'].includes(j.status));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/app/jobs/new"
            className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors text-sm"
          >
            Post a Job
          </Link>
          <Link
            href={`/app/profile/${address}`}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-xl font-medium transition-colors text-sm hover:border-blue-500"
          >
            View Profile
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map(stat => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4"
          >
            <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit mb-6">
        {(['client', 'provider'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            {t === 'client' ? '📋 As Client' : '🔨 As Provider'}
          </button>
        ))}
      </div>

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Active Jobs ({activeJobs.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeJobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Jobs */}
      {completedJobs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Completed Jobs ({completedJobs.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {completedJobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}

      {displayJobs.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg mb-4">
            {tab === 'client' ? "You haven't posted any jobs yet." : "You haven't applied to any jobs yet."}
          </p>
          <Link
            href={tab === 'client' ? '/app/jobs/new' : '/app/jobs'}
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            {tab === 'client' ? 'Post Your First Job' : 'Browse Jobs'}
          </Link>
        </div>
      )}
    </div>
  );
}