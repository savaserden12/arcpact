'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  getAllMessages, sendMessage, getConversations,
  getMessagesByJob, markMessagesRead, getUnreadCount,
  Message
} from '@/lib/store';
import { getJobById, getAllJobs } from '@/lib/store';
import { Job } from '@/types';
import { Send, MessageSquare, Clock, Briefcase } from 'lucide-react';

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const [userAddress, setUserAddress] = useState('');
  const [conversations, setConversations] = useState<ReturnType<typeof getConversations>>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(searchParams.get('jobId') || '');
  const [selectedOther, setSelectedOther] = useState<string>(searchParams.get('with') || '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [job, setJob] = useState<Job | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const addr = localStorage.getItem('walletAddress') || '';
    setUserAddress(addr);
    if (addr) {
      const convs = getConversations(addr);
      setConversations(convs);

      if (searchParams.get('jobId') && searchParams.get('with')) {
        loadChat(searchParams.get('jobId')!, searchParams.get('with')!, addr);
      } else if (convs.length > 0) {
        loadChat(convs[0].jobId, convs[0].other, addr);
      }
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function loadChat(jobId: string, other: string, addr?: string) {
    const address = addr || userAddress;
    setSelectedJobId(jobId);
    setSelectedOther(other);
    const msgs = getMessagesByJob(jobId).filter(m =>
      (m.from.toLowerCase() === address.toLowerCase() && m.to.toLowerCase() === other.toLowerCase()) ||
      (m.from.toLowerCase() === other.toLowerCase() && m.to.toLowerCase() === address.toLowerCase())
    );
    setMessages(msgs.reverse());
    markMessagesRead(jobId, address);
    const j = getJobById(jobId);
    setJob(j);
    const convs = getConversations(address);
    setConversations(convs);
  }

  async function handleSend() {
    if (!newMessage.trim() || !userAddress || !selectedJobId || !selectedOther) return;
    setSending(true);
    try {
      sendMessage({
        jobId: selectedJobId,
        from: userAddress as `0x${string}`,
        to: selectedOther as `0x${string}`,
        content: newMessage.trim(),
      });
      setNewMessage('');
      loadChat(selectedJobId, selectedOther);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function shortAddr(addr: string) {
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  if (!userAddress) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-gray-400">Connect your wallet to view messages.</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Messages</h1>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden flex" style={{ height: '70vh' }}>

        {/* Conversation List */}
        <div className="w-72 shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Conversations ({conversations.length})
            </p>
          </div>
          <div className="overflow-y-auto flex-1">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 p-6 text-center">
                <MessageSquare className="w-8 h-8 text-gray-300" />
                <p className="text-sm text-gray-400">No conversations yet.</p>
                <p className="text-xs text-gray-400">Apply to a job to start chatting.</p>
              </div>
            ) : (
              conversations.map((conv, i) => {
                const isSelected = conv.jobId === selectedJobId &&
                  conv.other.toLowerCase() === selectedOther.toLowerCase();
                const convJob = getJobById(conv.jobId);
                return (
                  <button
                    key={i}
                    onClick={() => loadChat(conv.jobId, conv.other)}
                    className={`w-full text-left p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isSelected ? 'bg-blue-500/10 border-l-2 border-l-blue-500' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {shortAddr(conv.other)}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    {convJob && (
                      <p className="text-xs text-blue-500 mb-1 flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {convJob.title.slice(0, 25)}...
                      </p>
                    )}
                    <p className="text-xs text-gray-400 truncate">
                      {conv.lastMessage.content}
                    </p>
                    <p className="text-xs text-gray-300 mt-1">
                      {timeAgo(conv.lastMessage.createdAt)}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {!selectedJobId ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">Select a conversation</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {selectedOther.slice(2, 4).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {shortAddr(selectedOther)}
                  </p>
                  {job && (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      {job.title}
                    </p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400 text-sm">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.from.toLowerCase() === userAddress.toLowerCase();
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                          isMe
                            ? 'bg-blue-500 text-white rounded-br-sm'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                        }`}>
                          <p className="break-words">{msg.content}</p>
                          <p className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                            {timeAgo(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-3 items-end">
                  <textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={2}
                    placeholder="Type a message... (Enter to send)"
                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !newMessage.trim()}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-xl transition-colors disabled:opacity-50 shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}