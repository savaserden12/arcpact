import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ToastContainer } from '@/components/ui/Toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ArcPact — Decentralized Freelance Escrow on Arc',
  description:
    'Hire talent and pay securely in USDC. Smart contract escrow, IPFS file delivery, and AI-powered dispute resolution on Arc blockchain.',
  keywords: ['Arc', 'USDC', 'freelance', 'escrow', 'blockchain', 'Web3'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white min-h-screen`}>
        <Navbar />
        <main className="pt-16">
          {children}
        </main>
        <Footer />
        <ToastContainer />
      </body>
    </html>
  );
}