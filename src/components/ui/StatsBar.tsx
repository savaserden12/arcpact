'use client';

import { useEffect, useState } from 'react';
import { getStats } from '@/lib/store';
import { Stats } from '@/types';
import { Briefcase, DollarSign, Users, CheckCircle } from 'lucide-react';

export default function StatsBar() {
  const [stats, setStats] = useState<Stats>({
    totalJobs: 0,
    totalVolume: '0',
    activeJobs: 0,
    completedJobs: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    setStats(getStats());
  }, []);

  const items = [
    {
      label: 'Total Jobs',
      value: stats.totalJobs,
      icon: <Briefcase className="w-5 h-5 text-blue-500" />,
    },
    {
      label: 'Volume (USDC)',
      value: `$${stats.totalVolume}`,
      icon: <DollarSign className="w-5 h-5 text-green-500" />,
    },
    {
      label: 'Active Jobs',
      value: stats.activeJobs,
      icon: <Briefcase className="w-5 h-5 text-yellow-500" />,
    },
    {
      label: 'Completed',
      value: stats.completedJobs,
      icon: <CheckCircle className="w-5 h-5 text-purple-500" />,
    },
    {
      label: 'Users',
      value: stats.totalUsers,
      icon: <Users className="w-5 h-5 text-pink-500" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col gap-2"
        >
          <div className="flex items-center gap-2">
            {item.icon}
            <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}