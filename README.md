# ArcPact — Decentralized Freelance Escrow Platform

> A trustless Web3 freelance marketplace powered by Arc Network smart contracts, AI dispute resolution, and real-time communication.

![Arc Network](https://img.shields.io/badge/Network-Arc%20Testnet-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## What is ArcPact?

ArcPact eliminates the need for centralized freelance platforms. Clients post jobs, providers apply, and all payments are locked in a smart contract escrow. Funds are only released when work is approved — no middlemen, no chargebacks, no trust issues.

---

## Core Features

### For Clients
- Post freelance jobs with title, description, category, budget and deadline
- Browse and filter applications by price and message
- Select a provider and lock funds in smart contract escrow (ERC-8183)
- Review submitted deliverables stored on IPFS
- Approve work to release payment or open a dispute
- Delete jobs (cascades through all related data)

### For Providers
- Browse open jobs filtered by category, budget, status and token
- Submit applications with custom price and pitch
- Withdraw applications before selection
- Accept job offers and confirm budget on-chain
- Upload deliverables to IPFS and submit for review
- Real-time chat with the client after selection

### Dispute Resolution
- AI-powered verdict system using Claude (Anthropic)
- Either party can open a dispute on submitted jobs
- Claude analyzes the job description and deliverable
- Automatic resolution recommendation with reasoning

### Payments & Escrow
- USDC and EURC token support
- Full escrow flow: Approve token → Lock funds → Release on completion
- Refund mechanism for expired jobs
- All transactions visible on Arc Explorer

### Real-time Features
- Live messaging between client and provider via Supabase Realtime
- Unread message badge notifications
- Application and job status updates in real-time
- Countdown timer for job deadlines

### Job Lifecycle
---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Blockchain | Arc Network Testnet, Viem, ERC-8183 |
| Database | Supabase (PostgreSQL + Realtime) |
| File Storage | IPFS via Pinata |
| AI | Anthropic Claude API |
| Payments | USDC, EURC (Circle) |
| Deploy | Netlify |

---

## Smart Contract

- **Standard:** ERC-8183 (Job Escrow)
- **Address:** `0x0747EEf0706327138c69792bF28Cd525089e4583`
- **Network:** Arc Testnet
- **Chain ID:** `5042002`
- **RPC:** `https://rpc.testnet.arc.network`
- **Explorer:** [testnet.arcscan.app](https://testnet.arcscan.app)

---

## Job Categories

Design · Development · Marketing · Writing · Video · Music · Data · Other

---

## Getting Started

```bash
git clone https://github.com/savaserden12/arcpact.git
cd arcpact
npm install
npm run dev
```

Create `.env.local`:

```env
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_ERC8183_ADDRESS=0x0747EEf0706327138c69792bF28Cd525089e4583
NEXT_PUBLIC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_KEY=your_pinata_secret
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud
ANTHROPIC_API_KEY=your_anthropic_key
```

---

## License

MIT © 2026 ArcPact
