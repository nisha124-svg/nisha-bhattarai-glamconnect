import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Loader2, ArrowLeft, User, Search, RefreshCw } from 'lucide-react';
import { chat } from '../../api/client';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../../api/config';

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  salonId: string;
  createdAt: string;
}

interface Conversation {
  customerId: string;
  customerName: string;
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
}

export const ChatManagement: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [salonName, setSalonName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active chat state
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const currentUser = (() => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch { return null; }
  })();

  // Fetch conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  // Socket connection
  useEffect(() => {
    if (!salonId || !currentUser?.id) return;

    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.emit('join_user', currentUser.id);
    socket.emit('join_salon_chat', salonId);

    socket.on('new_chat_message', (message: ChatMessage) => {
      if (message.salonId === salonId && message.senderId !== currentUser.id) {
        // If active conversation matches, add to messages
        if (activeConversation && message.senderId === activeConversation.customerId) {
          setMessages(prev => [...prev, message]);
        }
        // Update conversations list
        setConversations(prev => {
          const existing = prev.find(c => c.customerId === message.senderId);
          if (existing) {
            return prev.map(c =>
              c.customerId === message.senderId
                ? { ...c, lastMessage: message.content, lastMessageAt: message.createdAt, messageCount: c.messageCount + 1 }
                : c
            );
          } else {
            return [{
              customerId: message.senderId,
              customerName: message.senderName,
              lastMessage: message.content,
              lastMessageAt: message.createdAt,
              messageCount: 1,
            }, ...prev];
          }
        });
      }
    });

    return () => {
      socket.emit('leave_salon_chat', salonId);
      socket.disconnect();
    };
  }, [salonId, currentUser?.id, activeConversation?.customerId]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const fetchConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await chat.getConversations();
      setConversations(response.data.conversations || []);
      setSalonId(response.data.salonId);
      setSalonName(response.data.salonName);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err.response?.data?.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const openConversation = async (conv: Conversation) => {
    setActiveConversation(conv);
    setMessagesLoading(true);
    try {
      if (!salonId) return;
      const response = await chat.getMessages(salonId, 100);
      // Filter messages for this customer's conversation (sent by customer or replies from owner)
      const allMessages: ChatMessage[] = response.data;
      const filtered = allMessages.filter(
        (m: ChatMessage) => m.senderId === conv.customerId || m.senderId === currentUser?.id
      );
      setMessages(filtered);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending || !salonId) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistic add
    const optimisticMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      content,
      senderId: currentUser?.id || '',
      senderName: currentUser?.name || 'Salon',
      senderRole: 'SALON_OWNER',
      salonId,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const response = await chat.sendMessage(salonId, content, activeConversation?.customerId);
      setMessages(prev =>
        prev.map(m => m.id === optimisticMsg.id ? response.data : m)
      );
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatMessageTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const isOwnMessage = (msg: ChatMessage) => msg.senderId === currentUser?.id;

  const filteredConversations = conversations.filter(c =>
    c.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
        <span className="ml-3 text-gray-500">Loading conversations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={fetchConversations} className="text-pink-600 hover:text-pink-700 font-medium text-sm">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: '70vh' }}>
      <div className="flex h-full">
        {/* Conversations List */}
        <div className={`w-full md:w-80 border-r border-gray-100 flex flex-col ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-lg">Messages</h3>
              <button onClick={fetchConversations} className="p-1.5 hover:bg-gray-100 rounded-lg transition" title="Refresh">
                <RefreshCw className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <MessageCircle className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Customer messages will appear here</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.customerId}
                  onClick={() => openConversation(conv)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition border-b border-gray-50 text-left ${
                    activeConversation?.customerId === conv.customerId ? 'bg-pink-50' : ''
                  }`}
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {conv.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-gray-900 text-sm truncate">{conv.customerName}</p>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{formatTime(conv.lastMessageAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{conv.messageCount} message{conv.messageCount !== 1 ? 's' : ''}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white">
                <button
                  onClick={() => setActiveConversation(null)}
                  className="md:hidden p-1 hover:bg-gray-100 rounded-full transition"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-semibold text-sm">
                  {activeConversation.customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{activeConversation.customerName}</p>
                  <p className="text-xs text-gray-500">Customer</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <MessageCircle className="h-10 w-10 mb-2 text-gray-300" />
                    <p className="text-sm">No messages in this conversation</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                        isOwnMessage(msg)
                          ? 'bg-pink-500 text-white rounded-br-md'
                          : 'bg-white text-gray-900 border border-gray-100 rounded-bl-md shadow-sm'
                      }`}>
                        {!isOwnMessage(msg) && (
                          <p className="text-xs font-semibold text-blue-600 mb-1">
                            {msg.senderName}
                          </p>
                        )}
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isOwnMessage(msg) ? 'text-pink-200' : 'text-gray-400'}`}>
                          {formatMessageTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-100 bg-white p-3 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Type a reply..."
                  className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending}
                  className="bg-pink-500 text-white p-2.5 rounded-full hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageCircle className="h-14 w-14 mb-4 text-gray-300" />
              <p className="font-medium text-gray-600">Select a conversation</p>
              <p className="text-sm mt-1">Choose a customer to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
