'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Job, Application } from '@/types';
import {
  dbGetJobById, dbSaveApplication, dbSelectApplication,
  dbUpdateJob, dbDeleteJob, dbDeleteApplication, dbSendMessage, dbGetMessagesByJob,
  dbMarkMessagesRead, DbMessage
} from '@/lib/db';
import {
  submitJobOnChain, completeJobOnChain, claimRefundOnChain,
} from '@/lib/blockchain';
import { toast } from '@/components/ui/Toast';
import StatusBadge from '@/components/ui/StatusBadge';
import DisputePanel from '@/components/jobs/DisputePanel';
import FileUpload from '@/components/ui/FileUpload';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Clock, DollarSign, Tag, User, ExternalLink,
  Send, CheckCircle, XCircle, RefreshCw, Loader,
  FileCheck, MessageSquare, Trash2, Lock, Award, Users, Wallet
} from 'lucide-react';

function Countdown({ deadline }: { deadline: string }) {
  const [time, setTime] = useState('');
  const [urgent, setUrgent] = useState(false);
  useEffect(() => {
    function update() {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) { setTime('Expired'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setUrgent(diff < 86400000);
      if (d > 0) setTime(d + 'd ' + h + 'h ' + m + 'm');
      else if (h > 0) setTime(h + 'h ' + m + 'm ' + s + 's');
      else setTime(m + 'm ' + s + 's');
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [deadline]);
  return (
    <span className={'flex items-center gap-1.5 font-mono text-sm font-semibold ' + (urgent ? 'text-red-500' : 'text-gray-600 dark:text-gray-300')}>
      <Clock className="w-4 h-4" />{time}
    </span>
  );
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [userAddress, setUserAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [applyForm, setApplyForm] = useState({ price: '', message: '' });
  const [showApply, setShowApply] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [deliverableHash, setDeliverableHash] = useState('');
  const [showDeliver, setShowDeliver] = useState(false);
  const [activeTab, setActiveTab] = useState<'applications' | 'chat'>('applications');
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const addr = localStorage.getItem('walletAddress') || '';
    setUserAddress(addr);
    loadJob();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel('job-realtime-' + id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: 'job_id=eq.' + id }, () => { loadMessages(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications', filter: 'job_id=eq.' + id }, () => { loadJob(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs', filter: 'id=eq.' + id }, () => { loadJob(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  async function loadJob() {
    const j = await dbGetJobById(id);
    if (j) { setJob(j); setApplications(j.applications || []); }
    setPageLoading(false);
  }

  async function loadMessages() {
    const msgs = await dbGetMessagesByJob(id);
    setMessages(msgs);
    const addr = localStorage.getItem('walletAddress') || '';
    if (addr) await dbMarkMessagesRead(id, addr);
  }

  async function handleTabChange(tab: 'applications' | 'chat') {
    setActiveTab(tab);
    if (tab === 'chat') await loadMessages();
  }

  if (pageLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );

  if (!job) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-gray-400">Job not found.</p>
    </div>
  );

  const userAddr = localStorage.getItem('walletAddress') || userAddress;
  const isClient = job.client.toLowerCase() === userAddr.toLowerCase();
  const isProvider = job.provider?.toLowerCase() === userAddr.toLowerCase();
  const isParticipant = isClient || isProvider;
  const daysLeft = Math.ceil((new Date(job.deadline).getTime() - Date.now()) / 86400000);
  const hasApplied = applications.some(a => a.provider.toLowerCase() === userAddr.toLowerCase());
  const selectedApp = applications.find(a => a.selected);
  const chatOther = isClient ? job.provider : job.client;

  async function handleSelectProvider(applicationId: string, price: string, provider: string) {
    setLoading(true);
    try {
      const rawChainJobId = job.chainJobId;
      if (!rawChainJobId || rawChainJobId === '0') { toast('Chain Job ID bulunamadı.', 'error'); return; }
      const chainJobId = BigInt(rawChainJobId);
      const { createWalletClient, custom } = await import('viem');
      const { arcTestnet, ERC8183_ADDRESS, publicClient } = await import('@/lib/config');
      const { ERC8183_ABI } = await import('@/lib/erc8183.abi');
      const wc = createWalletClient({ chain: arcTestnet, transport: custom(window.ethereum) });
      const [account] = await wc.getAddresses();
      toast('Setting provider on-chain...', 'info');
      const tx = await wc.writeContract({
        address: ERC8183_ADDRESS, abi: ERC8183_ABI,
        functionName: 'setProvider',
        args: [chainJobId, provider as `0x${string}`],
        account,
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });
      await dbSelectApplication(id, applicationId);
      await dbUpdateJob(id, { provider: provider as `0x${string}`, status: 'ProviderSelected' as Job['status'], budget: price });
      await dbSendMessage({ jobId: id, from: job.client, to: provider, content: 'You have been selected! Please accept the job and set your budget (' + price + ' ' + (job.token || 'USDC') + ') on the job page.' });
      toast('Provider selected!', 'success');
      loadJob();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast(msg.includes('rejected') ? 'Transaction rejected.' : 'Failed: ' + msg.slice(0, 120), 'error');
    } finally { setLoading(false); }
  }

  async function handleProviderAccept() {
    setLoading(true);
    try {
      const rawChainJobId = job.chainJobId;
      if (!rawChainJobId || rawChainJobId === '0') { toast('Chain Job ID bulunamadı.', 'error'); return; }
      const chainJobId = BigInt(rawChainJobId);
      const { createWalletClient, custom, parseUnits } = await import('viem');
      const { arcTestnet, ERC8183_ADDRESS, publicClient } = await import('@/lib/config');
      const { ERC8183_ABI } = await import('@/lib/erc8183.abi');
      const wc = createWalletClient({ chain: arcTestnet, transport: custom(window.ethereum) });
      const [account] = await wc.getAddresses();
      const amount = parseUnits(job.budget, 6);
      toast('Accepting job & setting budget...', 'info');
      const tx = await wc.writeContract({
        address: ERC8183_ADDRESS, abi: ERC8183_ABI,
        functionName: 'setBudget',
        args: [chainJobId, amount, '0x' as `0x${string}`],
        account,
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });
      await dbUpdateJob(id, { status: 'BudgetSet' as Job['status'] });
      await dbSendMessage({ jobId: id, from: userAddr, to: job.client, content: 'I have accepted the job and set the budget. Please lock the funds to get started!' });
      toast('Budget set!', 'success');
      loadJob();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast(msg.includes('rejected') ? 'Transaction rejected.' : 'Failed: ' + msg.slice(0, 120), 'error');
    } finally { setLoading(false); }
  }

  async function handleFund() {
    setLoading(true);
    try {
      const rawChainJobId = job.chainJobId;
      if (!rawChainJobId || rawChainJobId === '0') { toast('Chain Job ID bulunamadı.', 'error'); return; }
      const chainJobId = BigInt(rawChainJobId);
      const { createWalletClient, custom, parseUnits } = await import('viem');
      const { arcTestnet, ERC8183_ADDRESS, USDC_ADDRESS, EURC_ADDRESS, publicClient } = await import('@/lib/config');
      const { ERC8183_ABI, USDC_ABI } = await import('@/lib/erc8183.abi');
      const wc = createWalletClient({ chain: arcTestnet, transport: custom(window.ethereum) });
      const [account] = await wc.getAddresses();
      const tokenAddress = job.token === 'EURC' ? EURC_ADDRESS : USDC_ADDRESS;
      const amount = parseUnits(job.budget, 6);
      toast('Step 1/2 — Approving token...', 'info');
      const tx1 = await wc.writeContract({ address: tokenAddress, abi: USDC_ABI, functionName: 'approve', args: [ERC8183_ADDRESS, amount], account });
      await publicClient.waitForTransactionReceipt({ hash: tx1 });
      toast('Step 2/2 — Locking funds...', 'info');
      const tx2 = await wc.writeContract({ address: ERC8183_ADDRESS, abi: ERC8183_ABI, functionName: 'fund', args: [chainJobId, '0x' as `0x${string}`], account });
      await publicClient.waitForTransactionReceipt({ hash: tx2 });
      await dbUpdateJob(id, { status: 'Funded' });
      if (job.provider) await dbSendMessage({ jobId: id, from: userAddr, to: job.provider, content: job.budget + ' ' + (job.token || 'USDC') + ' locked in escrow. Please start working! 🔒' });
      toast(job.budget + ' ' + (job.token || 'USDC') + ' locked! 🔒', 'success');
      loadJob();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast(msg.includes('rejected') ? 'Transaction rejected.' : 'Failed: ' + msg.slice(0, 120), 'error');
    } finally { setLoading(false); }
  }

  async function handleApply() {
    if (!applyForm.price || !applyForm.message) { toast('Fill in all fields.', 'error'); return; }
    setLoading(true);
    try {
      const app: Application = {
        id: Math.random().toString(36).slice(2) + Date.now(),
        jobId: id,
        provider: userAddr as `0x${string}`,
        price: applyForm.price,
        message: applyForm.message,
        createdAt: new Date().toISOString(),
        selected: false,
      };
      await dbSaveApplication(app);
      setShowApply(false);
      setApplyForm({ price: '', message: '' });
      toast('Application submitted!', 'success');
    } finally { setLoading(false); }
  }

  async function handleWithdrawApplication() {
    if (!confirm('Withdraw your application?')) return;
    const myApp = applications.find(a => a.provider.toLowerCase() === userAddr.toLowerCase());
    if (!myApp) return;
    await dbDeleteApplication(myApp.id);
    setApplications(prev => prev.filter(a => a.id !== myApp.id));
    toast('Application withdrawn.', 'info');
  }

  async function handleDeleteJob() {
    if (!confirm('Remove this job permanently?')) return;
    try {
      const res = await fetch('/api/delete-job', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: id }),
      });
      if (!res.ok) throw new Error('Failed');
      toast('Job deleted.', 'success');
      router.push('/app/jobs?t=' + Date.now());
    } catch {
      toast('Failed to delete job.', 'error');
    }
  }

  async function handleDeliver() {
    if (!deliverableHash) { toast('Upload your deliverable first.', 'error'); return; }
    setLoading(true);
    try {
      const rawChainJobId = job.chainJobId;
      if (!rawChainJobId || rawChainJobId === '0') { toast('Chain Job ID bulunamadı.', 'error'); return; }
      const chainJobId = BigInt(rawChainJobId);
      toast('Submitting on-chain...', 'info');
      await submitJobOnChain(chainJobId, deliverableHash);
      await dbUpdateJob(id, { status: 'Submitted', ipfsHash: deliverableHash });
      await dbSendMessage({ jobId: id, from: userAddr, to: job.client, content: 'I have submitted the deliverable. Please review and approve or open a dispute.' });
      setShowDeliver(false);
      toast('Work submitted! ✅', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      toast(msg.includes('rejected') ? 'Transaction rejected.' : 'Failed: ' + msg.slice(0, 100), 'error');
    } finally { setLoading(false); }
  }

  async function handleApprove() {
    setLoading(true);
    try {
      const rawChainJobId = job.chainJobId;
      if (!rawChainJobId || rawChainJobId === '0') { toast('Chain Job ID bulunamadı.', 'error'); return; }
      const chainJobId = BigInt(rawChainJobId);
      toast('Releasing payment...', 'info');
      await completeJobOnChain(chainJobId);
      await dbUpdateJob(id, { status: 'Completed' });
      if (job.provider) await dbSendMessage({ jobId: id, from: userAddr, to: job.provider, content: 'Payment approved and released! Thank you for your work. 💰' });
      toast('Payment released! 💰', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      toast(msg.includes('rejected') ? 'Transaction rejected.' : 'Failed: ' + msg.slice(0, 100), 'error');
    } finally { setLoading(false); }
  }

  async function handleRefund() {
    setLoading(true);
    try {
      const rawChainJobId = job.chainJobId;
      if (!rawChainJobId || rawChainJobId === '0') { toast('Chain Job ID bulunamadı.', 'error'); return; }
      const chainJobId = BigInt(rawChainJobId);
      await claimRefundOnChain(chainJobId);
      await dbUpdateJob(id, { status: 'Expired' });
      toast('Refund claimed!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      toast(msg.includes('rejected') ? 'Rejected.' : 'Failed.', 'error');
    } finally { setLoading(false); }
  }

  async function handleSendMessage() {
    if (!newMsg.trim() || !chatOther) return;
    setSendingMsg(true);
    try {
      await dbSendMessage({ jobId: id, from: userAddr, to: chatOther, content: newMsg.trim() });
      setNewMsg('');
      await loadMessages();
    } finally { setSendingMsg(false); }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{job.title}</h1>
              <div className="flex items-center gap-2 shrink-0">
                {job.status === 'Funded' && (
                  <span className="flex items-center gap-1 text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full font-medium">
                    <Lock className="w-3 h-3" />Escrow Locked
                  </span>
                )}
                {selectedApp && job.status !== 'Open' && (
                  <span className="flex items-center gap-1 text-xs bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-medium">
                    <Award className="w-3 h-3" />Hired
                  </span>
                )}
                <StatusBadge status={job.status} />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mb-5">
              <span className="flex items-center gap-1.5"><Tag className="w-4 h-4" />{job.category}</span>
              <span className="flex items-center gap-1.5 text-green-500 font-semibold"><DollarSign className="w-4 h-4" />{job.budget} {job.token || 'USDC'}</span>
              <Countdown deadline={job.deadline} />
              <Link href={'/app/profile/' + job.client} className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                <User className="w-4 h-4" />{job.client.slice(0, 6)}...{job.client.slice(-4)}
              </Link>
            </div>
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{job.description}</p>
            {job.txHash && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button onClick={() => window.open('https://testnet.arcscan.app/tx/' + job.txHash, '_blank')}
                  className="flex items-center gap-2 text-xs text-blue-500 hover:underline">
                  <ExternalLink className="w-3.5 h-3.5" />View on Arc Explorer
                  {job.chainJobId && <span className="text-gray-400 ml-1">(Job #{job.chainJobId})</span>}
                </button>
              </div>
            )}
          </div>

          {job.status !== 'Open' && job.status !== 'Completed' && job.status !== 'Expired' && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Progress</p>
              <div className="flex items-center gap-2">
                {[
                  { label: '1. Provider Selected', done: ['ProviderSelected','BudgetSet','Funded','Submitted'].includes(job.status) },
                  { label: '2. Budget Set', done: ['BudgetSet','Funded','Submitted'].includes(job.status) },
                  { label: '3. Funded', done: ['Funded','Submitted'].includes(job.status) },
                  { label: '4. Submitted', done: job.status === 'Submitted' },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 flex-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${step.done ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
                      {step.done ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs hidden sm:block ${step.done ? 'text-green-500 font-medium' : 'text-gray-400'}`}>{step.label}</span>
                    {i < 3 && <div className={`flex-1 h-0.5 ${step.done ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {job.ipfsHash && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-green-500" />Submitted Deliverable
              </h3>
              <button onClick={() => window.open('https://gateway.pinata.cloud/ipfs/' + job.ipfsHash, '_blank')}
                className="flex items-center gap-2 text-blue-500 hover:underline text-sm">
                <ExternalLink className="w-4 h-4" />View on IPFS
              </button>
            </div>
          )}

          {(showDispute || isProvider) && job.status === 'Submitted' && (
            <DisputePanel job={job} userAddress={userAddr} onResolved={() => { loadJob(); setShowDispute(false); }} />
          )}

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button onClick={() => handleTabChange('applications')}
                className={'flex-1 py-3.5 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-2 ' + (activeTab === 'applications' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-700')}>
                <Users className="w-4 h-4" />Applications ({applications.length})
              </button>
              {isParticipant && job.status !== 'Open' && (
                <button onClick={() => handleTabChange('chat')}
                  className={'flex-1 py-3.5 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-2 ' + (activeTab === 'chat' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-700')}>
                  <MessageSquare className="w-4 h-4" />Private Chat
                  {messages.filter(m => m.to_address.toLowerCase() === userAddr.toLowerCase() && !m.read).length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                      {messages.filter(m => m.to_address.toLowerCase() === userAddr.toLowerCase() && !m.read).length}
                    </span>
                  )}
                </button>
              )}
            </div>

            {activeTab === 'applications' ? (
              <div className="p-5">
                {applications.length === 0 ? (
                  <p className="text-gray-400 text-sm">No applications yet. Be the first to apply!</p>
                ) : (
                  <div className="space-y-4">
                    {applications.map(app => (
                      <div key={app.id} className={'bg-gray-50 dark:bg-gray-700/50 border rounded-xl p-4 transition-all ' + (app.selected ? 'border-blue-500 bg-blue-500/5' : 'border-gray-200 dark:border-gray-600')}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {app.provider.slice(2, 4).toUpperCase()}
                            </div>
                            <div>
                              <Link href={'/app/profile/' + app.provider} className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-500">
                                {app.provider.slice(0, 6)}...{app.provider.slice(-4)}
                              </Link>
                              <p className="text-xs text-gray-400">{new Date(app.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <span className="text-green-500 font-bold text-sm">{app.price} {job.token || 'USDC'}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{app.message}</p>
                        <div className="flex items-center justify-between">
                          {app.selected ? (
                            <span className="flex items-center gap-1 text-xs text-blue-500 font-medium">
                              <CheckCircle className="w-4 h-4" />Selected & Hired
                            </span>
                          ) : (
                            isClient && job.status === 'Open' && (
                              <button onClick={() => handleSelectProvider(app.id, app.price, app.provider)} disabled={loading}
                                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                                {loading ? <Loader className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />}
                                Select Provider
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col" style={{ height: '400px' }}>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400 text-sm">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map(msg => {
                      const isMe = msg.from_address.toLowerCase() === userAddr.toLowerCase();
                      return (
                        <div key={msg.id} className={'flex ' + (isMe ? 'justify-end' : 'justify-start')}>
                          <div className={'max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm ' + (isMe ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm')}>
                            <p className="break-words">{msg.content}</p>
                            <p className={'text-xs mt-1 ' + (isMe ? 'text-blue-100' : 'text-gray-400')}>{timeAgo(msg.created_at)}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 items-end">
                  <textarea value={newMsg} onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    rows={2} placeholder="Type a message... (Enter to send)"
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 dark:text-white" />
                  <button onClick={handleSendMessage} disabled={sendingMsg || !newMsg.trim()}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-2.5 rounded-xl transition-colors disabled:opacity-50 shrink-0">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Posted by</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {job.client.slice(2, 4).toUpperCase()}
              </div>
              <div>
                <Link href={'/app/profile/' + job.client} className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-500 transition-colors">
                  {job.client.slice(0, 6)}...{job.client.slice(-4)}
                </Link>
                <p className="text-xs text-gray-400">Client</p>
              </div>
            </div>
            <Link href={'/app/profile/' + job.client} className="block text-center text-xs bg-gray-100 dark:bg-gray-700 hover:bg-blue-500/10 text-gray-600 dark:text-gray-300 hover:text-blue-500 py-2 rounded-lg transition-colors font-medium">
              View Profile
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Actions</h3>

            {!isClient && !isProvider && job.status === 'Open' && !hasApplied && userAddr && (
              <button onClick={() => setShowApply(!showApply)}
                className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-xl font-medium transition-colors">
                <Send className="w-4 h-4" />Apply for this Job
              </button>
            )}

            {hasApplied && job.status === 'Open' && (
              <div className="space-y-2">
                <p className="text-sm text-center text-green-500 font-medium">✓ Application Submitted</p>
                <button onClick={handleWithdrawApplication}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-2 rounded-xl text-sm font-medium hover:bg-red-500/10 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />Withdraw Application
                </button>
              </div>
            )}

            {showApply && (
              <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <input type="number" value={applyForm.price} onChange={e => setApplyForm(p => ({ ...p, price: e.target.value }))}
                  placeholder={'Your price (' + (job.token || 'USDC') + ')'}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" />
                <textarea value={applyForm.message} onChange={e => setApplyForm(p => ({ ...p, message: e.target.value }))}
                  rows={3} placeholder="Why are you the best fit?"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 dark:text-white" />
                <button onClick={handleApply} disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  {loading ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Submit Application'}
                </button>
              </div>
            )}

            {isProvider && job.status === 'ProviderSelected' && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 text-center">You were selected! Accept to set the budget on-chain.</p>
                <button onClick={handleProviderAccept} disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50">
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" />Accept & Set Budget ({job.budget} {job.token})</>}
                </button>
              </div>
            )}

            {isClient && job.status === 'BudgetSet' && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 text-center">Provider accepted. Lock the funds to start!</p>
                <button onClick={handleFund} disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50">
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : <><Wallet className="w-4 h-4" />Lock {job.budget} {job.token} in Escrow</>}
                </button>
              </div>
            )}

            {isProvider && job.status === 'Funded' && (
              <>
                <button onClick={() => setShowDeliver(!showDeliver)}
                  className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white py-2.5 rounded-xl font-medium transition-colors">
                  <FileCheck className="w-4 h-4" />Submit Deliverable
                </button>
                {showDeliver && (
                  <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <FileUpload onUpload={hash => setDeliverableHash(hash)} />
                    <button onClick={handleDeliver} disabled={loading || !deliverableHash}
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                      {loading ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Delivery'}
                    </button>
                  </div>
                )}
              </>
            )}

            {isClient && job.status === 'Submitted' && (
              <div className="space-y-2">
                <button onClick={handleApprove} disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50">
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" />Approve & Pay</>}
                </button>
                <button onClick={() => setShowDispute(!showDispute)}
                  className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 py-2.5 rounded-xl font-medium transition-colors">
                  <XCircle className="w-4 h-4" />Open Dispute
                </button>
              </div>
            )}

            {isClient && job.status === 'Funded' && daysLeft <= 0 && (
              <button onClick={handleRefund} disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl font-medium transition-colors">
                <RefreshCw className="w-4 h-4" />Claim Refund
              </button>
            )}

            {isClient && job.status === 'Open' && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                <button onClick={handleDeleteJob}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl font-medium transition-colors hover:bg-red-500/10 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />Remove Job
                </button>
              </div>
            )}

            {!userAddr && (
              <p className="text-sm text-center text-gray-400">Connect wallet to interact</p>
            )}
          </div>

          <button onClick={() => window.open('https://testnet.arcscan.app', '_blank')}
            className="flex items-center justify-center gap-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:border-blue-500 transition-colors">
            <ExternalLink className="w-4 h-4" />View on Arc Explorer
          </button>
        </div>
      </div>
    </div>
  );
}