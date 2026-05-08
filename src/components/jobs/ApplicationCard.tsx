'use client';

import { Application } from '@/types';
import { getUserRating } from '@/lib/store';
import { Star, DollarSign, CheckCircle } from 'lucide-react';

interface Props {
  application: Application;
  isClient: boolean;
  jobStatus: string;
  onSelect: (applicationId: string, price: string, provider: string) => void;
}

export default function ApplicationCard({ application, isClient, jobStatus, onSelect }: Props) {
  const { average, count } = getUserRating(application.provider);

  return (
    <div className={`bg-white dark:bg-gray-800 border rounded-xl p-5 transition-all ${
      application.selected
        ? 'border-blue-500 bg-blue-500/5'
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {application.provider.slice(2, 4).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {application.provider.slice(0, 6)}...{application.provider.slice(-4)}
              </p>
              {count > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs text-gray-500">{average} ({count} reviews)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-green-500 font-bold">
          <DollarSign className="w-4 h-4" />
          <span>{application.price} USDC</span>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        {application.message}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {new Date(application.createdAt).toLocaleDateString()}
        </span>

        {application.selected ? (
          <span className="flex items-center gap-1 text-xs text-blue-500 font-medium">
            <CheckCircle className="w-4 h-4" />
            Selected
          </span>
        ) : (
          isClient && jobStatus === 'Open' && (
            <button
              onClick={() => onSelect(application.id, application.price, application.provider)}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg font-medium transition-colors"
            >
              Select Provider
            </button>
          )
        )}
      </div>
    </div>
  );
}