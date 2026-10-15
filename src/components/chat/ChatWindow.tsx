import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Users, Shield, Check, CheckCheck } from 'lucide-react';
import { Conversation, Message } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { listenToMessages, sendMessage } from '../../services/chatService';

interface ChatWindowProps {
  conversation: Conversation;
  onBack: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, onBack }) => {
  const { currentUser, userProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen to real-time messages
  useEffect(() => {
    const unsubscribe = listenToMessages(conversation.id, (msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [conversation.id]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || sending || !currentUser) return;

    const text = inputText;
    setInputText('');
    setSending(true);

    try {
      await sendMessage(
        conversation.id,
        currentUser.uid,
        userProfile?.displayName || 'User',
        text
      );
    } catch (err) {
      console.error('Failed to send message:', err);
      // restore text if failed
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Determine conversation title
  const otherParticipantId = conversation.participantIds.find((id) => id !== currentUser?.uid);
  const otherDetails = otherParticipantId
    ? conversation.participantDetails?.[otherParticipantId]
    : undefined;

  const chatTitle =
    conversation.type === 'group'
      ? conversation.groupName || 'Business Group'
      : otherDetails?.displayName || 'Chat Participant';

  const chatSubtitle =
    conversation.type === 'group'
      ? `${conversation.participantIds.length} members`
      : otherDetails?.businessName || 'Business Contact';

  return (
    <div className="flex flex-col h-full bg-slate-100/70 relative">
      {/* Top Header */}
      <div className="shrink-0 h-16 px-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
            title="Back to conversation list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative">
            {conversation.type === 'group' ? (
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            ) : otherDetails?.photoURL ? (
              <img
                src={otherDetails.photoURL}
                alt={chatTitle}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-semibold text-sm">
                {chatTitle.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight truncate max-w-[200px] sm:max-w-xs">
              {chatTitle}
            </h3>
            <span className="text-[11px] text-slate-500 block truncate">
              {chatSubtitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400 text-xs">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline text-[11px] text-slate-500">End-to-End Private</span>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-3 text-slate-300 shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-700">Encrypted Conversation Started</h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Send a message to introduce yourself, discuss webinar questions, or review lead requirements.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.uid;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {/* Sender name for group chats */}
                {!isMe && conversation.type === 'group' && (
                  <span className="text-[10px] font-semibold text-slate-500 mb-0.5 ml-1">
                    {msg.senderName}
                  </span>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-md px-3.5 py-2.5 rounded-2xl shadow-2xs text-sm leading-relaxed break-words ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-900 border border-slate-200/80 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <div
                    className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-mono tabular-nums ${
                      isMe ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMe && <CheckCheck className="w-3 h-3 text-blue-200" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 p-3 bg-white border-t border-slate-200">
        <form onSubmit={handleSend} className="flex items-end gap-2 max-w-4xl mx-auto">
          <div className="relative flex-1">
            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a business message..."
              maxLength={4000}
              className="w-full px-3.5 py-2.5 max-h-32 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white resize-none"
            />
            {inputText.length > 3000 && (
              <span className="absolute right-2 bottom-1.5 text-[9px] font-mono text-slate-400">
                {4000 - inputText.length}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition cursor-pointer shadow-xs shrink-0"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
