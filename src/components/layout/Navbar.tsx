'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getUSDCBalance } from '@/lib/blockchain';
import { getUnreadCount } from '@/lib/store';
import { Moon, Sun, Wallet, Menu, X, Zap, MessageSquare } from 'lucide-react';

export default function Navbar() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [darkMode, setDarkMode] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [unread, setUnread] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    const isDark = saved === null ? true : saved === 'true';
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);

    const savedAddress = localStorage.getItem('walletAddress');
    if (savedAddress) {
      setAddress(savedAddress);
      loadBalance(savedAddress);
      setUnread(getUnreadCount(savedAddress));
    }

    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          setAddress(null);
          localStorage.removeItem('walletAddress');
          setUnread(0);
        } else {
          setAddress(accounts[0]);
          localStorage.setItem('walletAddress', accounts[0]);
          loadBalance(accounts[0]);
          setUnread(getUnreadCount(accounts[0]));
        }
      });
      window.ethereum.on('chainChanged', () => window.location.reload());
    }

    // Unread badge her 5 saniyede güncelle
    const interval = setInterval(() => {
      const addr = localStorage.getItem('walletAddress');
      if (addr) setUnread(getUnreadCount(addr));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadBalance(addr: string) {
    try {
      const bal = await getUSDCBalance(addr as `0x${string}`);
      setBalance(parseFloat(bal).toFixed(2));
    } catch { setBalance('0'); }
  }

  async function handleConnect() {
    if (!window.ethereum) { alert('Please install MetaMask!'); return; }
    setConnecting(true);
    try {
      const accounts: string[] = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const addr = accounts[0];
      setAddress(addr);
      localStorage.setItem('walletAddress', addr);
      await loadBalance(addr);
      setUnread(getUnreadCount(addr));
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x4CD052',
            chainName: 'Arc Testnet',
            nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
            rpcUrls: ['https://rpc.testnet.arc.network'],
            blockExplorerUrls: ['https://testnet.arcscan.app'],
          }],
        });
      } catch {}
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x4CD052' }],
        });
      } catch {}
    } catch (err) {
      console.error(err);
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    setAddress(null);
    setBalance('0');
    setUnread(0);
    localStorage.removeItem('walletAddress');
  }

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', String(next));
    document.documentElement.classList.toggle('dark', next);
  }

  function shortAddress(addr: string) {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  const navLinks = [
    { href: '/app/jobs', label: 'Browse Jobs' },
    { href: '/app/jobs/new', label: 'Post a Job' },
    { href: '/app/dashboard', label: 'Dashboard' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white">
              Arc<span className="text-blue-500">Pact</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-blue-500'
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-500'
                }`}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleDark}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {address && (
              <Link href="/app/messages" className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <MessageSquare className="w-5 h-5" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
            )}

            {address ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{balance} USDC</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{shortAddress(address)}</span>
                </div>
                <Link href={`/app/profile/${address}`}
                  className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {address.slice(2, 4).toUpperCase()}
                </Link>
                <button onClick={handleDisconnect}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10">
                  Disconnect
                </button>
              </div>
            ) : (
              <button onClick={handleConnect} disabled={connecting}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                <Wallet className="w-4 h-4" />
                {connecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}

            <button onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                className="block py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-500">
                {link.label}
              </Link>
            ))}
            {address && (
              <Link href="/app/messages" onClick={() => setMenuOpen(false)}
                className="block py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-500">
                Messages {unread > 0 && `(${unread})`}
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}