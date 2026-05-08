'use client';

import { useState, useEffect } from 'react';
import { Job, Dispute, AIVerdict } from '@/types';
import { dbGetDisputeByJob, dbSaveDispute, dbGetMessagesByJob, dbUpdateJob, dbSendMessage } from '@/lib/db';
import { completeJobOnChain, rejectJobOnChain } from '@/lib/blockchain';
import { toast } from '@/components/ui/Toast';
import { AlertTriangle, Bot, Loader, MessageSquare } from 'lucide-react';

interface Props {
  job: Job;
  userAddress: string;
  onResolved: () => void;
}

export default function DisputePanel({ job, userAddress, onResolved }: Props) {
  const isClient = job.client.toLowerCase() === userAddress.toLowerCase();
  const isProvider = job.provider?.toLowerCase() === userAddress.toLowerCase();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [clientReason, setClientReason] = useState('');
  const [providerDefense, setProviderDefense] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [msgCount, setMsgCount] = useState(0);

  useEffect(() => {
    dbGetDisputeByJob(job.id).then(d => {
      if (d) {
        setDispute(d);
        setClientReason(d.clientReason);
        setProviderDefense(d.providerDefense || '');
      }
    });
    dbGetMessagesByJob(job.id).then(msgs => setMsgCount(msgs.length));
  }, [job.id]);

  async function handleOpenDispute() {
    if (!clientReason.trim()) return;
    setLoading(true);
    try {
      const d: Dispute = {
        jobId: job.id,
        clientReason,
        providerDefense: '',
        createdAt: new Date().toISOString(),
      };
      await dbSaveDispute(d);
      setDispute(d);
      if (job.provider) {
        await dbSendMessage({
          jobId: job.id,
          from: userAddress,
          to: job.provider,
          content: '⚠️ A dispute has been opened. Please go to the job page and submit your defense in the Dispute Resolution section.',
        });
      }
      toast('Dispute opened. Provider notified via chat.', 'warning');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitDefense() {
    if (!providerDefense.trim() || !dispute) return;
    setLoading(true);
    try {
      const updated = { ...dispute, providerDefense };
      await dbSaveDispute(updated);
      setDispute(updated);
      await dbSendMessage({
        jobId: job.id,
        from: userAddress,
        to: job.client,
        content: '🛡️ Provider has submitted their defense. You can now request AI verdict.',
      });
      toast('Defense submitted. Client notified.', 'info');
    } finally {
      setLoading(false);
    }
  }

  async function handleAIVerdict() {
    if (!dispute) return;
    setAiLoading(true);
    try {
      const messages = await dbGetMessagesByJob(job.id);
      const res = await fetch('/api/ai-verdict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job, dispute, messages }),
      });
      if (!res.ok) throw new Error('AI verdict API failed');
      const verdict: AIVerdict = await res.json();
      const updated = { ...dispute, aiVerdict: verdict };
      await dbSaveDispute(updated);
      setDispute(updated);
      toast('AI verdict received. Executing...', 'info');
      await handleExecuteVerdict(verdict);
    } catch (err) {
      console.error('AI verdict error:', err);
      toast('AI verdict failed. Check console.', 'error');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleExecuteVerdict(verdict: AIVerdict) {
    setLoading(true);
    try {
      const chainJobId = BigInt(job.chainJobId || '0');
      if (chainJobId === BigInt(0)) {
        toast('Chain Job ID bulunamadı.', 'error');
        return;
      }

      const decisionText =
        verdict.decision === 'approve'
          ? '✅ Full Payment to Provider'
          : verdict.decision === 'reject'
          ? '❌ Refund to Client'
          : `⚡ Partial — ${verdict.percentage}% to Provider`;

      const verdictMsg =
        `🤖 AI Verdict (Confidence: ${verdict.confidence}%)\n\n` +
        `Decision: ${decisionText}\n\n` +
        `Reasoning: ${verdict.reasoning}`;

      if (verdict.decision === 'approve' || verdict.decision === 'partial') {
        await completeJobOnChain(chainJobId);
        await dbUpdateJob(job.id, { status: 'Completed' });
        await dbSendMessage({ jobId: job.id, from: userAddress, to: job.client, content: verdictMsg });
        if (job.provider) {
          await dbSendMessage({ jobId: job.id, from: userAddress, to: job.provider, content: verdictMsg });
        }
        toast('AI decided: Payment released to provider! ✅', 'success');
      } else {
        await rejectJobOnChain(chainJobId, 'AI verdict: reject');
        await dbUpdateJob(job.id, { status: 'Rejected' });
        await dbSendMessage({ jobId: job.id, from: userAddress, to: job.client, content: verdictMsg });
        if (job.provider) {
          await dbSendMessage({ jobId: job.id, from: userAddress, to: job.provider, content: verdictMsg });
        }
        toast('AI decided: Refund sent to client! ✅', 'success');
      }
      onResolved();
    } catch (err) {
      console.error('Execute verdict error:', err);
      toast('Auto-execution failed.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function verdictColor(d: AIVerdict['decision']) {
    if (d === 'approve') return 'text-green-500';
    if (d === 'reject') return 'text-red-500';
    return 'text-yellow-500';
  }

  function verdictLabel(verdict: AIVerdict) {
    if (verdict.decision === 'approve') return '✅ Full Payment to Provider';
    if (verdict.decision === 'reject') return '❌ Refund to Client';
    return `⚡ Partial — ${verdict.percentage}% to Provider`;
  }

  return (
    <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 space-y-5">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Dispute Resolution</h3>
        {msgCount > 0 && (
          <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />{msgCount} messages reviewed by AI
          </span>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Client reason</label>
        {isClient && !dispute ? (
          <div className="space-y-3">
            <textarea
              value={clientReason}
              onChange={e => setClientReason(e.target.value)}
              rows={3}
              placeholder="Why are you rejecting this work?"
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-gray-900 dark:text-white"
            />
            <button
              onClick={handleOpenDispute}
              disabled={loading || !clientReason.trim()}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              {loading ? 'Opening...' : 'Open Dispute'}
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            {dispute?.clientReason || 'Not submitted yet.'}
          </p>
        )}
      </div>

      {dispute && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Provider defense</label>
          {isProvider && !dispute.providerDefense ? (
            <div className="space-y-3">
              <textarea
                value={providerDefense}
                onChange={e => setProviderDefense(e.target.value)}
                rows={3}
                placeholder="Why does your work meet the requirements?"
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 dark:text-white"
              />
              <button
                onClick={handleSubmitDefense}
                disabled={loading || !providerDefense.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                Submit Defense
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              {dispute.providerDefense || (
                <span className="text-yellow-500 italic">⏳ Waiting for provider defense...</span>
              )}
            </p>
          )}
        </div>
      )}

      {dispute?.providerDefense && !dispute.aiVerdict && (
        <div className="space-y-2">
          {isClient ? (
            <button
              onClick={handleAIVerdict}
              disabled={aiLoading}
              className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50">
              {aiLoading
                ? <><Loader className="w-4 h-4 animate-spin" /> Analyzing & Auto-Resolving...</>
                : <><Bot className="w-4 h-4" /> Request AI Verdict (Auto-Executes)</>}
            </button>
          ) : (
            <p className="text-center text-sm text-gray-400 italic">
              ⏳ Waiting for client to request AI verdict...
            </p>
          )}
        </div>
      )}

      {dispute?.aiVerdict && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-500" />
            <h4 className="font-semibold text-gray-900 dark:text-white">AI Verdict — Auto Executed</h4>
            <span className="ml-auto text-xs text-gray-400">Confidence: {dispute.aiVerdict.confidence}%</span>
          </div>
          <p className={'text-lg font-bold ' + verdictColor(dispute.aiVerdict.decision)}>
            {verdictLabel(dispute.aiVerdict)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">{dispute.aiVerdict.reasoning}</p>
        </div>
      )}
    </div>
  );
}