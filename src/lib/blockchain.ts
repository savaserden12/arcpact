import { createWalletClient, custom, parseUnits, formatUnits, keccak256, toBytes } from 'viem';
import { publicClient, arcTestnet, ERC8183_ADDRESS, USDC_ADDRESS, EURC_ADDRESS } from './config';
import { ERC8183_ABI, USDC_ABI } from './erc8183.abi';

const ARC_CHAIN_ID = arcTestnet.id;

function getWalletClient() {
  if (typeof window === 'undefined' || !window.ethereum) return null;
  return createWalletClient({
    chain: arcTestnet,
    transport: custom(window.ethereum),
  });
}

async function getAccount() {
  const wc = getWalletClient();
  if (!wc) throw new Error('No wallet');
  const [account] = await wc.getAddresses();
  return { wc, account };
}

// Her işlem öncesi çağır — ağ yanlışsa switch yapar
async function ensureArcNetwork() {
  const wc = getWalletClient();
  if (!wc) throw new Error('No wallet');
  try { await wc.addChain({ chain: arcTestnet }); } catch {}
  try { await wc.switchChain({ id: ARC_CHAIN_ID }); } catch {}
}

export async function connectWallet(): Promise<`0x${string}`> {
  if (!window.ethereum) throw new Error('MetaMask not found');
  const wc = getWalletClient();
  if (!wc) throw new Error('No wallet client');
  const addresses = await wc.requestAddresses();
  await ensureArcNetwork();
  return addresses[0];
}

export async function getTokenBalance(address: `0x${string}`, tokenAddress: `0x${string}`): Promise<string> {
  try {
    const balance = await publicClient.readContract({
      address: tokenAddress,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [address],
    });
    return formatUnits(balance as bigint, 6);
  } catch {
    return '0';
  }
}

export async function getUSDCBalance(address: `0x${string}`): Promise<string> {
  return getTokenBalance(address, USDC_ADDRESS);
}

export async function getEURCBalance(address: `0x${string}`): Promise<string> {
  return getTokenBalance(address, EURC_ADDRESS);
}

export async function createJobOnChain(
  providerAddress: `0x${string}`,
  evaluatorAddress: `0x${string}`,
  deadlineTimestamp: bigint,
  description: string,
) {
  await ensureArcNetwork();
  const { wc, account } = await getAccount();
  const hash = await wc.writeContract({
    address: ERC8183_ADDRESS,
    abi: ERC8183_ABI,
    functionName: 'createJob',
    args: [
      providerAddress,
      evaluatorAddress,
      deadlineTimestamp,
      description,
      '0x0000000000000000000000000000000000000000' as `0x${string}`,
    ],
    account,
  });
  return publicClient.waitForTransactionReceipt({ hash });
}

export async function providerSetBudgetOnChain(jobId: bigint, amountUSDC: string) {
  await ensureArcNetwork();
  const { wc, account } = await getAccount();
  const amount = parseUnits(amountUSDC, 6);
  const hash = await wc.writeContract({
    address: ERC8183_ADDRESS,
    abi: ERC8183_ABI,
    functionName: 'setBudget',
    args: [jobId, amount, '0x' as `0x${string}`],
    account,
  });
  return publicClient.waitForTransactionReceipt({ hash });
}

export async function fundJobOnChain(jobId: bigint, amountUSDC: string, tokenAddress: `0x${string}`) {
  await ensureArcNetwork();
  const { wc, account } = await getAccount();
  const amount = parseUnits(amountUSDC, 6);

  const approveTx = await wc.writeContract({
    address: tokenAddress,
    abi: USDC_ABI,
    functionName: 'approve',
    args: [ERC8183_ADDRESS, amount],
    account,
  });
  await publicClient.waitForTransactionReceipt({ hash: approveTx });
  console.log('approve done:', approveTx);

  const hash = await wc.writeContract({
    address: ERC8183_ADDRESS,
    abi: ERC8183_ABI,
    functionName: 'fund',
    args: [jobId, '0x' as `0x${string}`],
    account,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('fund done:', hash);
  return receipt;
}

export async function submitJobOnChain(jobId: bigint, ipfsHash: string) {
  await ensureArcNetwork();
  const { wc, account } = await getAccount();
  const deliverable = keccak256(toBytes(ipfsHash)) as `0x${string}`;
  const hash = await wc.writeContract({
    address: ERC8183_ADDRESS,
    abi: ERC8183_ABI,
    functionName: 'submit',
    args: [jobId, deliverable, '0x' as `0x${string}`],
    account,
  });
  return publicClient.waitForTransactionReceipt({ hash });
}

export async function completeJobOnChain(jobId: bigint) {
  await ensureArcNetwork();
  const { wc, account } = await getAccount();
  const reason = keccak256(toBytes('approved')) as `0x${string}`;
  const hash = await wc.writeContract({
    address: ERC8183_ADDRESS,
    abi: ERC8183_ABI,
    functionName: 'complete',
    args: [jobId, reason, '0x' as `0x${string}`],
    account,
  });
  return publicClient.waitForTransactionReceipt({ hash });
}

export async function rejectJobOnChain(jobId: bigint, reason: string) {
  await ensureArcNetwork();
  const { wc, account } = await getAccount();
  const reasonHash = keccak256(toBytes(reason)) as `0x${string}`;
  const hash = await wc.writeContract({
    address: ERC8183_ADDRESS,
    abi: ERC8183_ABI,
    functionName: 'reject',
    args: [jobId, reasonHash, '0x' as `0x${string}`],
    account,
  });
  return publicClient.waitForTransactionReceipt({ hash });
}

export async function claimRefundOnChain(jobId: bigint) {
  await ensureArcNetwork();
  const { wc, account } = await getAccount();
  const hash = await wc.writeContract({
    address: ERC8183_ADDRESS,
    abi: ERC8183_ABI,
    functionName: 'claimRefund',
    args: [jobId],
    account,
  });
  return publicClient.waitForTransactionReceipt({ hash });
}

export async function setProviderOnChain(jobId: bigint, provider: `0x${string}`) {
  await ensureArcNetwork();
  const { wc, account } = await getAccount();
  const hash = await wc.writeContract({
    address: ERC8183_ADDRESS,
    abi: ERC8183_ABI,
    functionName: 'setProvider',
    args: [jobId, provider],
    account,
  });
  return publicClient.waitForTransactionReceipt({ hash });
}

export async function getJobFromChain(jobId: bigint) {
  try {
    const job = await publicClient.readContract({
      address: ERC8183_ADDRESS,
      abi: ERC8183_ABI,
      functionName: 'getJob',
      args: [jobId],
    });
    return job;
  } catch {
    return null;
  }
}

export async function getAllJobsFromChain(): Promise<{
  jobId: bigint;
  client: string;
  txHash: string;
}[]> {
  try {
    const blockNumber = await publicClient.getBlockNumber();
    const fromBlock = blockNumber > BigInt(9000) ? blockNumber - BigInt(9000) : BigInt(0);

    const logs = await publicClient.getLogs({
      address: ERC8183_ADDRESS,
      fromBlock,
      toBlock: 'latest',
    });

    const results: { jobId: bigint; client: string; txHash: string }[] = [];

    for (const log of logs) {
      try {
        if (!log.transactionHash) continue;
        const jobId = log.topics[1] ? BigInt(log.topics[1]) : BigInt(0);
        const client = log.topics[2]
          ? ('0x' + log.topics[2].slice(26)) as `0x${string}`
          : '0x0000000000000000000000000000000000000000' as `0x${string}`;
        results.push({ jobId, client, txHash: log.transactionHash });
      } catch { continue; }
    }

    return results;
  } catch (err) {
    console.error('getAllJobsFromChain error:', err);
    return [];
  }
}