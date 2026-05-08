'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES, SUPPORTED_TOKENS, ERC8183_ADDRESS, arcTestnet, publicClient } from '@/lib/config';
import { dbSaveJob } from '@/lib/db';
import { connectWallet } from '@/lib/blockchain';
import { Job, Category } from '@/types';
import { toast } from '@/components/ui/Toast';
import { Briefcase, DollarSign, Calendar, Tag, FileText, Loader, Zap } from 'lucide-react';

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Design' as Category,
    budget: '',
    token: 'USDC' as 'USDC' | 'EURC',
    deadline: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit() {
    if (!form.title || !form.description || !form.budget || !form.deadline) {
      toast('Please fill in all fields.', 'error');
      return;
    }

    let address = localStorage.getItem('walletAddress');
    if (!address) {
      try {
        address = await connectWallet();
        localStorage.setItem('walletAddress', address);
      } catch {
        toast('Please connect your wallet first.', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      const { createWalletClient, custom } = await import('viem');
      const { ERC8183_ABI } = await import('@/lib/erc8183.abi');

      const wc = createWalletClient({ chain: arcTestnet, transport: custom(window.ethereum) });
      const [account] = await wc.getAddresses();

      const deadlineTs = BigInt(Math.floor(new Date(form.deadline).getTime() / 1000));
      const description = JSON.stringify({
        title: form.title,
        category: form.category,
        budget: form.budget,
        token: form.token,
        deadline: form.deadline,
        description: form.description,
      });

      // Step 1: createJob — tek onay
      toast('Creating job on-chain...', 'info');
      const hash = await wc.writeContract({
        address: ERC8183_ADDRESS,
        abi: ERC8183_ABI,
        functionName: 'createJob',
        args: [
          '0x0000000000000000000000000000000000000000' as `0x${string}`,
          account,
          deadlineTs,
          description,
          '0x0000000000000000000000000000000000000000' as `0x${string}`,
        ],
        account,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log('createJob receipt logs:', receipt.logs);

      // chainJobId: log'dan parse et
      let chainJobId = '0';
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === ERC8183_ADDRESS.toLowerCase()) {
          if (log.topics?.[1]) {
            const parsed = BigInt(log.topics[1]).toString();
            if (parsed !== '0') { chainJobId = parsed; break; }
          }
        }
      }
      if (chainJobId === '0') {
        for (const log of receipt.logs) {
          if (log.topics?.[1]) {
            const parsed = BigInt(log.topics[1]).toString();
            if (parsed !== '0') { chainJobId = parsed; break; }
          }
        }
      }
      console.log('chainJobId:', chainJobId);

      // Step 2: DB'ye kaydet
      toast('Saving to database...', 'info');
      const job: Job = {
        id: receipt.transactionHash,
        title: form.title,
        description: form.description,
        category: form.category,
        budget: form.budget,
        token: form.token,
        deadline: form.deadline,
        client: address as `0x${string}`,
        status: 'Open',
        createdAt: new Date().toISOString(),
        applications: [],
        txHash: receipt.transactionHash,
        chainJobId,
      };

      await dbSaveJob(job);
      toast('Job posted! Chain ID: ' + chainJobId, 'success');
      router.push('/app/jobs');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      console.error('createJob error:', err);
      toast(msg.includes('rejected') ? 'Transaction rejected.' : 'Failed: ' + msg.slice(0, 100), 'error');
    } finally {
      setLoading(false);
    }
  }

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Post a Job</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Describe your project and find the perfect talent.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-6">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Briefcase className="w-4 h-4 text-blue-500" />Job Title
          </label>
          <input name="title" value={form.title} onChange={handleChange}
            placeholder="e.g. Design a logo for my startup"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <FileText className="w-4 h-4 text-blue-500" />Description
          </label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={5}
            placeholder="Describe your project in detail..."
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 dark:text-white" />
          <p className="text-xs text-gray-400 mt-1">{form.description.length} characters</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Tag className="w-4 h-4 text-blue-500" />Category
            </label>
            <select name="category" value={form.category} onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <DollarSign className="w-4 h-4 text-blue-500" />Payment Token
            </label>
            <div className="flex gap-2">
              {SUPPORTED_TOKENS.map(t => (
                <button key={t.symbol} type="button"
                  onClick={() => setForm(p => ({ ...p, token: t.symbol as 'USDC' | 'EURC' }))}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${form.token === t.symbol ? 'border-blue-500 bg-blue-500/10 text-blue-500' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-blue-400'}`}>
                  {t.symbol}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <DollarSign className="w-4 h-4 text-blue-500" />Budget ({form.token})
            </label>
            <input name="budget" value={form.budget} onChange={handleChange}
              type="number" min="1" placeholder="e.g. 100"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 text-blue-500" />Deadline
            </label>
            <input name="deadline" value={form.deadline} onChange={handleChange}
              type="date" min={minDate.toISOString().split('T')[0]}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" />
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
          <Zap className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">On-chain job creation</p>
            <p className="text-xs text-blue-500/80 dark:text-blue-300/70">
              Creates an ERC-8183 job on Arc Testnet. Get free testnet USDC at{' '}
              <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" className="underline">
                faucet.circle.com
              </a>
            </p>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg transition-colors disabled:opacity-50">
          {loading
            ? <><Loader className="w-5 h-5 animate-spin" />Posting on Arc...</>
            : 'Post Job on Arc'}
        </button>
      </div>
    </div>
  );
}