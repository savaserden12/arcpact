'use client';

import Link from 'next/link';
import { Job } from '@/types';
import StatusBadge from './StatusBadge';
import { Clock, DollarSign, Users, Tag, Trash2 } from 'lucide-react';
import { dbDeleteJob } from '@/lib/db';

interface Props {
  job: Job;
  onDeleted?: () => void;
}

export default function JobCard({ job, onDeleted }: Props) {
  const deadline = new Date(job.deadline);
  const now = new Date();
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const walletAddress = typeof window !== 'undefined' ? localStorage.getItem('walletAddress') : null;
  const isOwner = walletAddress?.toLowerCase() === job.client.toLowerCase();

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this job?')) return;
    await dbDeleteJob(job.id);
    onDeleted?.();
  }

  return (
    <Link href={`/app/jobs/${job.id}`}>
      <div className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 cursor-pointer group">

        {isOwner && (
          <button
            onClick={handleDelete}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors z-10"
            title="Delete job">
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors line-clamp-2 pr-6">
            {job.title}
          </h3>
          <StatusBadge status={job.status} />
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
          {job.description}
        </p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" />
            {job.category}
          </span>
          <span className="flex items-center gap-1 text-green-500 font-semibold">
            <DollarSign className="w-3.5 h-3.5" />
            {job.budget} USDC
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {job.applications?.length || 0} applicants
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <span className="text-xs text-gray-400">
            {job.client.slice(0, 6)}...{job.client.slice(-4)}
          </span>
        </div>
      </div>
    </Link>
  );
}