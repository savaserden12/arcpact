import { AIVerdict, Job, Dispute } from '../types';
import { Message } from './store';

export async function getAIVerdict(
  job: Job,
  dispute: Dispute,
  messages?: Message[]
): Promise<AIVerdict> {
  const response = await fetch('/api/ai-verdict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job, dispute, messages }),
  });
  if (!response.ok) throw new Error('AI verdict failed');
  return response.json();
}

export function formatVerdictDecision(verdict: AIVerdict): string {
  if (verdict.decision === 'approve') return '✅ Full Payment to Provider';
  if (verdict.decision === 'reject') return '❌ Full Refund to Client';
  return '⚖️ Partial Payment — ' + verdict.percentage + '% to Provider';
}

export function getVerdictColor(decision: AIVerdict['decision']): string {
  if (decision === 'approve') return 'text-green-500';
  if (decision === 'reject') return 'text-red-500';
  return 'text-yellow-500';
}