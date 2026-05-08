'use client';

import Link from 'next/link';
import { Zap, GitBranch, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white">
                Arc<span className="text-blue-500">Pact</span>
              </span>
            </Link>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
              Decentralized freelance escrow platform built on Arc.
              Secure payments in USDC and EURC, powered by smart contracts.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <button
                onClick={() => window.open('https://twitter.com', '_blank')}
                className="text-gray-400 hover:text-blue-500 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => window.open('https://github.com', '_blank')}
                className="text-gray-400 hover:text-blue-500 transition-colors"
              >
                <GitBranch className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Platform</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/app/jobs" className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link href="/app/jobs/new" className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link href="/app/dashboard" className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => window.open('https://docs.arc.network', '_blank')}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors text-left"
                >
                  Arc Docs
                </button>
              </li>
              <li>
                <button
                  onClick={() => window.open('https://testnet.arcscan.app', '_blank')}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors text-left"
                >
                  Arc Explorer
                </button>
              </li>
              <li>
                <button
                  onClick={() => window.open('https://faucet.circle.com', '_blank')}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors text-left"
                >
                  Get Test USDC
                </button>
              </li>
              <li>
                <button
                  onClick={() => window.open('https://docs.arc.network/build', '_blank')}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors text-left"
                >
                  ERC-8183 Standard
                </button>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            2025 ArcPact. Built on Arc Testnet.
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Powered by</span>
            <button
              onClick={() => window.open('https://arc.network', '_blank')}
              className="text-blue-500 hover:underline"
            >
              Arc
            </button>
            <span>and</span>
            <button
              onClick={() => window.open('https://circle.com', '_blank')}
              className="text-blue-500 hover:underline"
            >
              Circle
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}