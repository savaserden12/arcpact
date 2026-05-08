import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

// Job types
export interface DbJob {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: string;
  token: string;
  deadline: string;
  client: string;
  provider?: string;
  evaluator?: string;
  status: string;
  ipfs_hash?: string;
  tx_hash?: string;
  chain_job_id?: string;
  created_at: string;
}

export interface DbApplication {
  id: string;
  job_id: string;
  provider: string;
  price: string;
  message: string;
  selected: boolean;
  created_at: string;
}

export interface DbMessage {
  id: string;
  job_id: string;
  from_address: string;
  to_address: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface DbDispute {
  id: string;
  job_id: string;
  client_reason: string;
  provider_defense: string;
  ai_verdict?: object;
  created_at: string;
}