import { Job, Application, Dispute, Stats, UserProfile } from '../types';

const STORAGE_KEYS = {
  JOBS: 'arcpact_jobs',
  APPLICATIONS: 'arcpact_applications',
  DISPUTES: 'arcpact_disputes',
  RATINGS: 'arcpact_ratings',
  HIDDEN_JOBS: 'arcpact_hidden_jobs',
  MESSAGES: 'arcpact_messages',
  PROFILES: 'arcpact_profiles',
};

export function saveJob(job: Job): void {
  const jobs = getAllJobsRaw();
  const existing = jobs.findIndex(j => j.id === job.id);
  if (existing >= 0) jobs[existing] = job;
  else jobs.unshift(job);
  localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
}

export function getAllJobsRaw(): Job[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.JOBS);
  return data ? JSON.parse(data) : [];
}

export function getAllJobs(): Job[] {
  const hidden = getHiddenJobs();
  return getAllJobsRaw().filter(j => !hidden.includes(j.id));
}

export function getJobById(id: string): Job | null {
  return getAllJobsRaw().find(j => j.id === id) || null;
}

export function updateJobStatus(id: string, updates: Partial<Job>): void {
  const job = getJobById(id);
  if (job) saveJob({ ...job, ...updates });
}

export function removeJob(id: string): void {
  const jobs = getAllJobsRaw().filter(j => j.id !== id);
  localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
}

export function hideJob(id: string): void {
  const hidden = getHiddenJobs();
  if (!hidden.includes(id)) {
    hidden.push(id);
    localStorage.setItem(STORAGE_KEYS.HIDDEN_JOBS, JSON.stringify(hidden));
  }
}

export function getHiddenJobs(): string[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.HIDDEN_JOBS);
  return data ? JSON.parse(data) : [];
}

export function getJobsByAddress(address: string): { asClient: Job[]; asProvider: Job[] } {
  const jobs = getAllJobsRaw();
  return {
    asClient: jobs.filter(j => j.client.toLowerCase() === address.toLowerCase()),
    asProvider: jobs.filter(j => j.provider?.toLowerCase() === address.toLowerCase()),
  };
}

export function saveApplication(application: Application): void {
  const apps = getAllApplications();
  const existing = apps.findIndex(a => a.id === application.id);
  if (existing >= 0) apps[existing] = application;
  else apps.unshift(application);
  localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
}

export function getAllApplications(): Application[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
  return data ? JSON.parse(data) : [];
}

export function getApplicationsByJob(jobId: string): Application[] {
  return getAllApplications().filter(a => a.jobId === jobId);
}

export function getApplicationsByProvider(provider: string): Application[] {
  return getAllApplications().filter(a => a.provider.toLowerCase() === provider.toLowerCase());
}

export function selectApplication(jobId: string, applicationId: string): void {
  const apps = getAllApplications();
  apps.forEach(a => {
    if (a.jobId === jobId) a.selected = a.id === applicationId;
  });
  localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
}

export interface Message {
  id: string;
  jobId: string;
  from: string;
  to: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export function sendMessage(msg: Omit<Message, 'id' | 'createdAt' | 'read'>): Message {
  const messages = getAllMessages();
  const newMsg: Message = {
    ...msg,
    id: Math.random().toString(36).slice(2) + Date.now(),
    createdAt: new Date().toISOString(),
    read: false,
  };
  messages.push(newMsg);
  localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  return newMsg;
}

export function getAllMessages(): Message[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
  return data ? JSON.parse(data) : [];
}

export function getMessagesByJob(jobId: string): Message[] {
  return getAllMessages()
    .filter(m => m.jobId === jobId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function getConversations(address: string) {
  const messages = getAllMessages().filter(
    m => m.from.toLowerCase() === address.toLowerCase() ||
         m.to.toLowerCase() === address.toLowerCase()
  );
  const convMap = new Map<string, Message[]>();
  for (const msg of messages) {
    const other = msg.from.toLowerCase() === address.toLowerCase() ? msg.to : msg.from;
    const key = msg.jobId + '_' + other.toLowerCase();
    if (!convMap.has(key)) convMap.set(key, []);
    convMap.get(key)!.push(msg);
  }
  return Array.from(convMap.entries()).map(([key, msgs]) => {
    const parts = key.split('_');
    const jobId = parts[0];
    const other = parts[1];
    const sorted = [...msgs].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const unread = msgs.filter(
      m => m.to.toLowerCase() === address.toLowerCase() && !m.read
    ).length;
    return { jobId, other, lastMessage: sorted[0], unreadCount: unread };
  }).sort((a, b) =>
    new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
  );
}

export function markMessagesRead(jobId: string, address: string): void {
  const messages = getAllMessages();
  let changed = false;
  messages.forEach(m => {
    if (m.jobId === jobId && m.to.toLowerCase() === address.toLowerCase() && !m.read) {
      m.read = true;
      changed = true;
    }
  });
  if (changed) localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
}

export function getUnreadCount(address: string): number {
  return getAllMessages().filter(
    m => m.to.toLowerCase() === address.toLowerCase() && !m.read
  ).length;
}

export function saveDispute(dispute: Dispute): void {
  const disputes = getAllDisputes();
  const existing = disputes.findIndex(d => d.jobId === dispute.jobId);
  if (existing >= 0) disputes[existing] = dispute;
  else disputes.unshift(dispute);
  localStorage.setItem(STORAGE_KEYS.DISPUTES, JSON.stringify(disputes));
}

export function getAllDisputes(): Dispute[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.DISPUTES);
  return data ? JSON.parse(data) : [];
}

export function getDisputeByJob(jobId: string): Dispute | null {
  return getAllDisputes().find(d => d.jobId === jobId) || null;
}

export function saveRating(jobId: string, from: string, to: string, rating: number): void {
  const ratings = getAllRatings();
  const key = jobId + '_' + from + '_' + to;
  ratings[key] = { jobId, from, to, rating, createdAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(ratings));
}

export function getAllRatings(): Record<string, {
  jobId: string; from: string; to: string; rating: number; createdAt: string;
}> {
  if (typeof window === 'undefined') return {};
  const data = localStorage.getItem(STORAGE_KEYS.RATINGS);
  return data ? JSON.parse(data) : {};
}

export function getUserRating(address: string): { average: number; count: number } {
  const ratings = Object.values(getAllRatings()).filter(
    r => r.to.toLowerCase() === address.toLowerCase()
  );
  if (ratings.length === 0) return { average: 0, count: 0 };
  const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  return { average: Math.round(avg * 10) / 10, count: ratings.length };
}

export interface ProfileData {
  address: string;
  username?: string;
  bio?: string;
  skills?: string[];
  twitter?: string;
  github?: string;
  website?: string;
  updatedAt: string;
}

export function saveProfile(profile: ProfileData): void {
  const profiles = getAllProfiles();
  profiles[profile.address.toLowerCase()] = profile;
  localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
}

export function getAllProfiles(): Record<string, ProfileData> {
  if (typeof window === 'undefined') return {};
  const data = localStorage.getItem(STORAGE_KEYS.PROFILES);
  return data ? JSON.parse(data) : {};
}

export function getProfile(address: string): ProfileData | null {
  const profiles = getAllProfiles();
  return profiles[address.toLowerCase()] || null;
}

export function getStats(): Stats {
  const jobs = getAllJobs();
  const completed = jobs.filter(j => j.status === 'Completed');
  const totalVolume = completed.reduce((sum, j) => sum + parseFloat(j.budget || '0'), 0);
  const allAddresses = new Set([
    ...jobs.map(j => j.client),
    ...jobs.filter(j => j.provider).map(j => j.provider!),
  ]);
  return {
    totalJobs: jobs.length,
    totalVolume: totalVolume.toFixed(2),
    activeJobs: jobs.filter(j => ['Open', 'Funded', 'Submitted'].includes(j.status)).length,
    completedJobs: completed.length,
    totalUsers: allAddresses.size,
  };
}

export function getUserProfile(address: string): UserProfile {
  const { asClient, asProvider } = getJobsByAddress(address);
  const completedAsProvider = asProvider.filter(j => j.status === 'Completed');
  const completedAsClient = asClient.filter(j => j.status === 'Completed');
  const totalEarned = completedAsProvider.reduce((sum, j) => sum + parseFloat(j.budget || '0'), 0);
  const totalSpent = completedAsClient.reduce((sum, j) => sum + parseFloat(j.budget || '0'), 0);
  const { average, count } = getUserRating(address);
  return {
    address: address as `0x${string}`,
    completedJobs: completedAsProvider.length,
    totalEarned: totalEarned.toFixed(2),
    totalSpent: totalSpent.toFixed(2),
    rating: average,
    ratingCount: count,
    activeJobs: [
      ...asClient.filter(j => ['Open', 'Funded', 'Submitted'].includes(j.status)),
      ...asProvider.filter(j => ['Funded', 'Submitted'].includes(j.status)),
    ],
    completedJobsList: [...completedAsProvider, ...completedAsClient],
  };
}