export type JobStatus = 'Open' | 'ProviderSelected' | 'BudgetSet' | 'Funded' | 'Submitted' | 'Completed' | 'Rejected' | 'Expired';

export type Category =
  | 'Design'
  | 'Development'
  | 'Writing'
  | 'Architecture'
  | 'Marketing'
  | 'Video'
  | 'Music'
  | 'Other';

export interface Job {
  id: string;
  title: string;
  description: string;
  category: Category;
  budget: string;
  token: 'USDC' | 'EURC';
  deadline: string;
  client: `0x${string}`;
  provider?: `0x${string}`;
  evaluator?: `0x${string}`;
  status: JobStatus;
  ipfsHash?: string;
  deliverableHash?: string;
  createdAt: string;
  applications: Application[];
  rating?: number;
  disputeReason?: string;
  aiVerdict?: AIVerdict;
  txHash?: string;
  chainJobId?: string;
}

export interface Application {
  id: string;
  jobId: string;
  provider: `0x${string}`;
  price: string;
  message: string;
  createdAt: string;
  selected: boolean;
}

export interface UserProfile {
  address: `0x${string}`;
  completedJobs: number;
  totalEarned: string;
  totalSpent: string;
  rating: number;
  ratingCount: number;
  activeJobs: Job[];
  completedJobsList: Job[];
}

export interface AIVerdict {
  decision: 'approve' | 'reject' | 'partial';
  percentage?: number;
  reasoning: string;
  confidence: number;
  createdAt: string;
}

export interface Dispute {
  jobId: string;
  clientReason: string;
  providerDefense: string;
  aiVerdict?: AIVerdict;
  clientAccepted?: boolean;
  providerAccepted?: boolean;
  createdAt: string;
}

export interface Stats {
  totalJobs: number;
  totalVolume: string;
  activeJobs: number;
  completedJobs: number;
  totalUsers: number;
}