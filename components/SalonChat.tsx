import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Loader2, ArrowLeft } from 'lucide-react';
import { chat } from '../api/client';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  salonId: string;
  createdAt: string;
}

interface SalonChatProps {
  salonId: string;
  salonName: string;
  onClose: () => void;
}

export const SalonChat: React.FC<SalonChatProps> = ({ salonId, salonName, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentUser = (() => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch { return null; }
  })();

  useEffect(() => {
    // Connect socket
    socketRef.current = io('http://localhost:5000');
    const socket = socketRef.current;

    // Join rooms
    if (currentUser?.id) {
      socket.emit('join_user', currentUser.id);
    }
    socket.emit('join_salon_chat', salonId);

    // Listen for new messages
    socket.on('new_chat_message', (message: ChatMessage) => {
      if (message.salonId === salonId && message.senderId !== currentUser?.id) {
        setMessages(prev => [...prev, message]);
      }
    });

    // Typing indicator
    socket.on('user_typing', (data: { userName: string; salonId: string }) => {
      if (data.salonId === salonId) {
        setTypingUser(data.userName);
      }
    });

    socket.on('user_stop_typing', (data: { salonId: string }) => {
      if (data.salonId === salonId) {
        setTypingUser(null);
      }
    });

    // Fetch initial messages
    fetchMessages();

    return () => {
      socket.emit('leave_salon_chat', salonId);
      socket.disconnect();
    };
  }, [salonId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await chat.getMessages(salonId, 50);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistic add
    const optimisticMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      content,
      senderId: currentUser?.id || '',
      senderName: currentUser?.name || 'You',
      senderRole: currentUser?.role || 'USER',
      salonId,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const response = await chat.sendMessage(salonId, content);
      // Replace optimistic message with real one
      setMessages(prev =>
        prev.map(m => m.id === optimisticMsg.id ? response.data : m)
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      setNewMessage(content); // restore input
    } finally {
      setSending(false);
    }

    // Stop typing
    socketRef.current?.emit('stop_typing', { salonId });
  };

  const handleTyping = () => {
    socketRef.current?.emit('typing', { salonId, userName: currentUser?.name });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('stop_typing', { salonId });
    }, 2000);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const isOwnMessage = (msg: ChatMessage) => msg.senderId === currentUser?.id;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg h-[85vh] sm:h-[600px] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-400 text-white p-4 flex items-center gap-3">
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h3 className="font-bold text-lg">{salonName}</h3>
            <p className="text-pink-100 text-xs">
              {typingUser ? `${typingUser} is typing...` : 'Live Chat'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageCircle className="h-12 w-12 mb-3 text-gray-300" />
              <p className="font-medium">No messages yet</p>
              <p className="text-sm">Start a conversation with {salonName}!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  isOwnMessage(msg)
                    ? 'bg-pink-500 text-white rounded-br-md'
                    : 'bg-white text-gray-900 border border-gray-100 rounded-bl-md shadow-sm'
                }`}>
                  {!isOwnMessage(msg) && (
                    <p className={`text-xs font-semibold mb-1 ${
                      msg.senderRole === 'SALON_OWNER' ? 'text-pink-600' : 'text-blue-600'
                    }`}>
                      {msg.senderName}
                      {msg.senderRole === 'SALON_OWNER' && (
                        <span className="ml-1 bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded-full text-[10px]">Salon</span>
                      )}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isOwnMessage(msg) ? 'text-pink-200' : 'text-gray-400'}`}>
                    {formatTime(msg.createdAt)}
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
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type a message..."
            className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
            disabled={!currentUser}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending || !currentUser}
            className="bg-pink-500 text-white p-2.5 rounded-full hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>

        {!currentUser && (
          <div className="bg-amber-50 border-t border-amber-200 p-3 text-center text-amber-700 text-sm">
            Please sign in to send messages
          </div>
        )}
      </div>
    </div>
  );
};
