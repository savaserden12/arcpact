'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Zap, Shield, Bot, FileCheck, ArrowRight,
  Star, DollarSign, Clock, Users
} from 'lucide-react';
import StatsBar from '@/components/ui/StatsBar';

const steps = [
  { icon: <Zap className="w-6 h-6" />, title: 'Post a Job', desc: 'Describe your project, set a budget in USDC, and publish your listing.' },
  { icon: <Users className="w-6 h-6" />, title: 'Receive Applications', desc: 'Talented providers apply with their price and proposal.' },
  { icon: <Shield className="w-6 h-6" />, title: 'Funds in Escrow', desc: 'Select a provider and lock USDC in a smart contract. Fully secured.' },
  { icon: <FileCheck className="w-6 h-6" />, title: 'Approve & Pay', desc: 'Review the delivery. Approve to release funds or open a dispute.' },
];

const features = [
  {
    icon: <Shield className="w-6 h-6 text-blue-500" />,
    title: 'Smart Contract Escrow',
    desc: 'Funds are locked in ERC-8183 contracts on Arc. No middleman, no risk.',
  },
  {
    icon: <Bot className="w-6 h-6 text-purple-500" />,
    title: 'AI Dispute Resolution',
    desc: 'Disputes are analyzed by Claude AI for fair, unbiased verdicts.',
  },
  {
    icon: <FileCheck className="w-6 h-6 text-green-500" />,
    title: 'IPFS File Delivery',
    desc: 'Deliverables are stored on IPFS — decentralized and permanent.',
  },
  {
    icon: <DollarSign className="w-6 h-6 text-yellow-500" />,
    title: 'USDC Payments',
    desc: 'Pay and earn in USDC. No volatility, no conversion, just dollars.',
  },
  {
    icon: <Zap className="w-6 h-6 text-pink-500" />,
    title: 'Instant Settlement',
    desc: 'Arc\'s sub-second finality means payments clear immediately.',
  },
  {
    icon: <Star className="w-6 h-6 text-orange-500" />,
    title: 'Reputation System',
    desc: 'Build your onchain reputation with verified job completions.',
  },
];

const categories = [
  'Design', 'Development', 'Writing', 'Architecture',
  'Marketing', 'Video', 'Music', 'Other',
];

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Zap className="w-3.5 h-3.5" />
              Built on Arc Testnet · Powered by USDC
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight"
          >
            Freelance Work,{' '}
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              Secured Onchain
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto"
          >
            Post jobs, hire talent, and pay in USDC — all secured by smart contracts.
            No banks, no delays, no disputes without resolution.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/app/jobs"
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 shadow-lg shadow-blue-500/25"
            >
              Launch App
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/app/jobs/new"
              className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105"
            >
              Post a Job
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <StatsBar />
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            How ArcPact Works
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Four simple steps from posting a job to getting paid — all onchain.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6"
            >
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-4">
                {step.icon}
              </div>
              <span className="absolute top-4 right-4 text-4xl font-bold text-gray-100 dark:text-gray-700">
                {i + 1}
              </span>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-100 dark:bg-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why ArcPact?
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Everything a modern freelance platform needs, built on trustless infrastructure.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6"
              >
                <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Browse by Category
          </h2>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/app/jobs?category=${cat}`}
              className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-blue-500 hover:text-blue-500 transition-all"
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-12 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            Join the first decentralized freelance platform on Arc. 
            Post your first job or find your next client today.
          </p>
          <Link
            href="/app/jobs"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:scale-105 transition-all shadow-lg"
          >
            Launch App
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}