# ArcPact — Decentralized Freelance Escrow Platform

ArcPact is a Web3 freelance marketplace built on the **Arc Network** (testnet). Clients post jobs, providers apply, and payments are locked in smart contract escrow — no middlemen, no trust issues.

## Features

- Post and manage freelance jobs on-chain
- Smart contract escrow via ERC-8183
- USDC / EURC payment support
- AI-powered dispute resolution (Claude AI)
- Real-time messaging between client and provider
- IPFS deliverable uploads via Pinata
- Wallet connect (MetaMask / Arc Wallet)
- Supabase-backed job and application storage

## Tech Stack

- **Frontend:** Next.js 16, TypeScript, Tailwind CSS
- **Blockchain:** Arc Network Testnet, Viem, ERC-8183
- **Backend:** Supabase (PostgreSQL + Realtime)
- **Storage:** IPFS via Pinata
- **AI:** Anthropic Claude API
- **Deploy:** Netlify

## Smart Contract

- **ERC-8183 Address:** `0x0747EEf0706327138c69792bF28Cd525089e4583`
- **Network:** Arc Testnet (Chain ID: 5042002)
- **Explorer:** [testnet.arcscan.app](https://testnet.arcscan.app)

## Getting Started

```bash
npm install
npm run dev
```

Set up `.env.local` with your Supabase, Pinata, and Anthropic API keys.

## License

MIT
