'use client';
import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Job } from '@/types';
import { dbGetAllJobs } from '@/lib/db';
import JobCard from '@/components/ui/JobCard';
import { CATEGORIES } from '@/lib/config';
import { Search, SlidersHorizontal, Plus, Loader, X, DollarSign, Briefcase, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const STATUS_OPTIONS = ['All', 'Open', 'Funded', 'Submitted', 'Completed', 'Rejected'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'budget_high', label: 'Budget: High to Low' },
  { value: 'budget_low', label: 'Budget: Low to High' },
];

function JobsPageInner() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [status, setStatus] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [token, setToken] = useState('All');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { loadJobs(); }, [searchParams]);

  async function loadJobs() {
    setLoading(true);
    try {
      const dbJobs = await dbGetAllJobs();
      setJobs(dbJobs);
    } catch (err) {
      console.error('loadJobs error:', err);
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setSearch(''); setCategory('All'); setStatus('All');
    setSortBy('newest'); setToken('All'); setBudgetMin(''); setBudgetMax('');
  }

  const hasActiveFilters = search || category !== 'All' || status !== 'All' || sortBy !== 'newest' || token !== 'All' || budgetMin || budgetMax;

  const filtered = jobs.filter(j => {
    const matchSearch = !search ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.description.toLowerCase().includes(search.toLowerCase()) ||
      j.client.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'All' || j.category === category;
    const matchStatus = status === 'All' || j.status === status;
    const matchToken = token === 'All' || j.token === token;
    const matchMin = !budgetMin || parseFloat(j.budget) >= parseFloat(budgetMin);
    const matchMax = !budgetMax || parseFloat(j.budget) <= parseFloat(budgetMax);
    return matchSearch && matchCategory && matchStatus && matchToken && matchMin && matchMax;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === 'budget_high') return parseFloat(b.budget) - parseFloat(a.budget);
    if (sortBy === 'budget_low') return parseFloat(a.budget) - parseFloat(b.budget);
    return 0;
  });

  const totalBudget = filtered.reduce((s, j) => s + parseFloat(j.budget || '0'), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Browse Jobs</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {loading ? 'Loading...' : filtered.length + ' job' + (filtered.length !== 1 ? 's' : '') + ' found'}
          </p>
        </div>
        <Link href="/app/jobs/new" className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors">
          <Plus className="w-4 h-4" />Post a Job
        </Link>
      </div>

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Jobs Found', value: filtered.length, icon: <Briefcase className="w-4 h-4 text-blue-500" />, color: 'bg-blue-500/10' },
            { label: 'Avg Budget', value: '$' + (filtered.length > 0 ? (totalBudget / filtered.length).toFixed(0) : '0'), icon: <DollarSign className="w-4 h-4 text-green-500" />, color: 'bg-green-500/10' },
            { label: 'Total Volume', value: '$' + totalBudget.toFixed(0), icon: <TrendingUp className="w-4 h-4 text-purple-500" />, color: 'bg-purple-500/10' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex items-center gap-3">
              <div className={'w-8 h-8 ' + s.color + ' rounded-lg flex items-center justify-center'}>{s.icon}</div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="font-bold text-gray-900 dark:text-white">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-5 space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search jobs..."
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${showFilters || hasActiveFilters ? 'bg-blue-500 border-blue-500 text-white' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}>
            <SlidersHorizontal className="w-4 h-4" />Filters
          </button>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2.5 text-sm text-red-500 hover:bg-red-500/10 rounded-xl">
              <X className="w-4 h-4" />Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {['All', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${category === c ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-500/10'}`}>
              {c}
            </button>
          ))}
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Token</label>
              <select value={token} onChange={e => setToken(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="All">All Tokens</option>
                <option value="USDC">USDC</option>
                <option value="EURC">EURC</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Min Budget</label>
              <input type="number" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} placeholder="0"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Max Budget</label>
              <input type="number" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} placeholder="Any"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2 sm:col-span-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">Sort By</label>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setSortBy(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sortBy === opt.value ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-gray-400">Loading jobs...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">No jobs found</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-blue-500 text-sm hover:underline mb-4 block mx-auto">
              Clear filters
            </button>
          )}
          <Link href="/app/jobs/new" className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors">
            <Plus className="w-4 h-4" />Post a Job
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(job => <JobCard key={job.id} job={job} onDeleted={loadJobs} />)}
        </div>
      )}
    </div>
  );
}



export default function JobsPage() {
  return <Suspense><JobsPageInner /></Suspense>;
}

