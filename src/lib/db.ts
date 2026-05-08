import { supabase, DbJob, DbApplication, DbMessage, DbDispute } from './supabase';
import { Job, Application, Dispute } from '../types';

// ============ JOBS ============

export async function dbSaveJob(job: Job): Promise<void> {
  const { error } = await supabase.from('jobs').upsert({
    id: job.id,
    title: job.title,
    description: job.description,
    category: job.category,
    budget: job.budget,
    token: job.token || 'USDC',
    deadline: job.deadline,
    client: job.client,
    provider: job.provider || null,
    evaluator: job.evaluator || null,
    status: job.status,
    ipfs_hash: job.ipfsHash || null,
    tx_hash: job.txHash || null,
    chain_job_id: job.chainJobId || null,
  }, { onConflict: 'id' });
  if (error) console.error('dbSaveJob error:', error);
}

export async function dbGetAllJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(dbJobToJob);
}

export async function dbGetJobById(id: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  const job = dbJobToJob(data);
  const apps = await dbGetApplicationsByJob(id);
  job.applications = apps;
  return job;
}

export async function dbUpdateJob(id: string, updates: Partial<Job>): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.provider !== undefined) dbUpdates.provider = updates.provider;
  if (updates.evaluator !== undefined) dbUpdates.evaluator = updates.evaluator;
  if (updates.ipfsHash !== undefined) dbUpdates.ipfs_hash = updates.ipfsHash;
  if (updates.budget !== undefined) dbUpdates.budget = updates.budget;
  await supabase.from('jobs').update(dbUpdates).eq('id', id);
}

export async function dbDeleteJob(id: string): Promise<void> {
  await supabase.from('disputes').delete().eq('job_id', id);
  await supabase.from('messages').delete().eq('job_id', id);
  await supabase.from('applications').delete().eq('job_id', id);
  await supabase.from('jobs').delete().eq('id', id);
}

function dbJobToJob(d: DbJob): Job {
  return {
    id: d.id,
    title: d.title,
    description: d.description,
    category: d.category as Job['category'],
    budget: d.budget,
    token: (d.token || 'USDC') as 'USDC' | 'EURC',
    deadline: d.deadline,
    client: d.client as `0x${string}`,
    provider: d.provider as `0x${string}` | undefined,
    evaluator: d.evaluator as `0x${string}` | undefined,
    status: d.status as Job['status'],
    ipfsHash: d.ipfs_hash,
    txHash: d.tx_hash,
    chainJobId: d.chain_job_id,
    createdAt: d.created_at,
    applications: [],
  };
}

// ============ APPLICATIONS ============

export async function dbSaveApplication(app: Application): Promise<void> {
  await supabase.from('applications').upsert({
    id: app.id,
    job_id: app.jobId,
    provider: app.provider,
    price: app.price,
    message: app.message,
    selected: app.selected,
  });
}

export async function dbGetApplicationsByJob(jobId: string): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map((d: DbApplication) => ({
    id: d.id,
    jobId: d.job_id,
    provider: d.provider as `0x${string}`,
    price: d.price,
    message: d.message,
    selected: d.selected,
    createdAt: d.created_at,
  }));
}

export async function dbSelectApplication(jobId: string, applicationId: string): Promise<void> {
  await supabase.from('applications').update({ selected: false }).eq('job_id', jobId);
  await supabase.from('applications').update({ selected: true }).eq('id', applicationId);
}

export async function dbDeleteApplication(id: string): Promise<void> {
  await supabase.from('applications').delete().eq('id', id);
}

// ============ MESSAGES ============

export async function dbSendMessage(msg: {
  jobId: string;
  from: string;
  to: string;
  content: string;
}): Promise<DbMessage | null> {
  const { data, error } = await supabase.from('messages').insert({
    id: Math.random().toString(36).slice(2) + Date.now(),
    job_id: msg.jobId,
    from_address: msg.from,
    to_address: msg.to,
    content: msg.content,
    read: false,
  }).select().single();
  if (error) return null;
  return data;
}

export async function dbGetMessagesByJob(jobId: string): Promise<DbMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data;
}

export async function dbMarkMessagesRead(jobId: string, toAddress: string): Promise<void> {
  await supabase
    .from('messages')
    .update({ read: true })
    .eq('job_id', jobId)
    .eq('to_address', toAddress)
    .eq('read', false);
}

export async function dbGetUnreadCount(address: string): Promise<number> {
  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('to_address', address)
    .eq('read', false);
  return count || 0;
}

export async function dbGetConversations(address: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or('from_address.eq.' + address + ',to_address.eq.' + address)
    .order('created_at', { ascending: false });
  if (error || !data) return [];

  const convMap = new Map<string, DbMessage[]>();
  for (const msg of data) {
    const other = msg.from_address.toLowerCase() === address.toLowerCase()
      ? msg.to_address
      : msg.from_address;
    const key = msg.job_id + '_' + other.toLowerCase();
    if (!convMap.has(key)) convMap.set(key, []);
    convMap.get(key)!.push(msg);
  }

  return Array.from(convMap.entries()).map(([key, msgs]) => {
    const parts = key.split('_');
    const jobId = parts[0];
    const other = parts[1];
    const unread = msgs.filter(
      m => m.to_address.toLowerCase() === address.toLowerCase() && !m.read
    ).length;
    return { jobId, other, lastMessage: msgs[0], unreadCount: unread };
  });
}

// ============ DISPUTES ============

export async function dbSaveDispute(dispute: Dispute): Promise<void> {
  await supabase.from('disputes').upsert({
    id: dispute.jobId,
    job_id: dispute.jobId,
    client_reason: dispute.clientReason,
    provider_defense: dispute.providerDefense || null,
    ai_verdict: dispute.aiVerdict || null,
  });
}

export async function dbGetDisputeByJob(jobId: string): Promise<Dispute | null> {
  const { data, error } = await supabase
    .from('disputes')
    .select('*')
    .eq('job_id', jobId)
    .single();
  if (error || !data) return null;
  return {
    jobId: data.job_id,
    clientReason: data.client_reason,
    providerDefense: data.provider_defense || '',
    aiVerdict: data.ai_verdict || undefined,
    createdAt: data.created_at,
  };
}