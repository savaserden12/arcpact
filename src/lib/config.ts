import { createPublicClient, http } from 'viem';

export const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'USDC',
    symbol: 'USDC',
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: 'https://testnet.arcscan.app',
    },
  },
  testnet: true,
} as const;

export const ERC8183_ADDRESS = '0x0747EEf0706327138c69792bF28Cd525089e4583' as `0x${string}`;
export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as `0x${string}`;
export const EURC_ADDRESS = '0x808456652fdb597867f38412077fC7f9875C3b4' as `0x${string}`;

export const SUPPORTED_TOKENS = [
  { symbol: 'USDC', address: USDC_ADDRESS, decimals: 6, color: 'text-green-500' },
  { symbol: 'EURC', address: EURC_ADDRESS, decimals: 6, color: 'text-blue-400' },
] as const;

export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http('https://rpc.testnet.arc.network'),
});

export const JOB_STATUS = {
  0: 'Open',
  1: 'ProviderSelected',
  2: 'BudgetSet',
  3: 'Funded',
  4: 'Submitted',
  5: 'Completed',
  6: 'Rejected',
  7: 'Expired',
} as const;

export const CATEGORIES = [
  'Design',
  'Development',
  'Writing',
  'Architecture',
  'Marketing',
  'Video',
  'Music',
  'Other',
] as const;

export const STATUS_COLORS = {
  Open: 'bg-blue-500',
  ProviderSelected: 'bg-orange-400',
  BudgetSet: 'bg-indigo-500',
  Funded: 'bg-yellow-500',
  Submitted: 'bg-purple-500',
  Completed: 'bg-green-500',
  Rejected: 'bg-red-500',
  Expired: 'bg-gray-500',
} as const;