import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  ArrowLeft,
  Users,
  Phone,
  Smile,
  Paperclip,
  Camera,
  Mic,
  CheckCheck,
} from 'lucide-react';
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

  useEffect(() => {
    const unsubscribe = listenToMessages(conversation.id, (msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [conversation.id]);

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
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
      : otherDetails?.businessName || 'Typing...';

  return (
    <div className="flex flex-col h-full bg-[#141518] dark:bg-[#141518] light:bg-[#f0f2f7] text-white light:text-slate-900 transition-colors duration-200 relative overflow-hidden">
      {/* Top Header matching mockup */}
      <div className="shrink-0 h-18 px-4 sm:px-6 bg-[#18191d] dark:bg-[#18191d] light:bg-white border-b border-[#25272e] light:border-slate-200 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          {/* Circular Red/Dark Back Button */}
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-[#23252c] dark:bg-[#23252c] light:bg-slate-100 flex items-center justify-center text-[#ff4545] shadow-md border border-white/5 light:border-slate-200 hover:scale-105 transition cursor-pointer"
            title="Back to conversation list"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Contact Avatar */}
          <div className="relative">
            {conversation.type === 'group' ? (
              <div className="w-11 h-11 rounded-full bg-[#25272e] text-[#ff4545] flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            ) : otherDetails?.photoURL ? (
              <img
                src={otherDetails.photoURL}
                alt={chatTitle}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10 light:ring-slate-300 shadow-md"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-[#25272e] text-white light:text-slate-900 flex items-center justify-center font-bold text-sm shadow-md ring-1 ring-white/10">
                {chatTitle.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#18191d] light:ring-white" />
          </div>

          <div>
            <h2 className="text-sm sm:text-base font-bold text-white light:text-slate-900 leading-tight truncate max-w-[160px] sm:max-w-xs">
              {chatTitle}
            </h2>
            <span className="text-[11px] text-[#ff4545] light:text-[#ff3e3e] font-semibold block truncate">
              {chatSubtitle}
            </span>
          </div>
        </div>

        {/* Circular Call Button from Mockup */}
        <div className="flex items-center gap-2">
          <a
            href="tel:+918882432110"
            className="w-10 h-10 rounded-full bg-[#23252c] dark:bg-[#23252c] light:bg-slate-100 flex items-center justify-center text-[#ff4545] shadow-md border border-white/5 light:border-slate-200 hover:scale-105 active:scale-95 transition cursor-pointer"
            title="Direct Phone Call Dialer"
          >
            <Phone className="w-4 h-4 fill-current stroke-0" />
          </a>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* Date Divider matching mockup */}
        <div className="flex justify-center my-2">
          <span className="px-3.5 py-1 rounded-full text-[11px] font-semibold text-slate-400 light:text-slate-500 bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-slate-200/80 shadow-2xs">
            Today
          </span>
        </div>

        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-14 h-14 rounded-full bg-[#23252c] dark:bg-[#23252c] light:bg-white flex items-center justify-center mb-3 text-[#ff4545] shadow-lg border border-white/5 light:border-slate-200">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white light:text-slate-800">
              Direct Conversation Started
            </h4>
            <p className="text-xs text-slate-400 light:text-slate-500 max-w-xs mt-1">
              Send a business message to discuss webinar training, Lead Bank details, or client follow-ups.
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
                {!isMe && conversation.type === 'group' && (
                  <span className="text-[10px] font-semibold text-slate-400 light:text-slate-500 mb-1 ml-2">
                    {msg.senderName}
                  </span>
                )}

                {/* Message Bubble: Outgoing is Coral Red, Incoming is dark/white neumorphic pill */}
                <div
                  className={`max-w-[85%] sm:max-w-md px-4 py-3 rounded-2xl shadow-md text-sm leading-relaxed break-words transition-all ${
                    isMe
                      ? 'bg-gradient-to-r from-[#ff4747] to-[#f43f5e] text-white rounded-br-xs neu-coral-glow'
                      : 'bg-[#22242a] dark:bg-[#22242a] light:bg-white text-slate-100 light:text-slate-800 border border-white/5 light:border-slate-200 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <div
                    className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-mono tabular-nums ${
                      isMe ? 'text-white/80' : 'text-slate-400 light:text-slate-400'
                    }`}
                  >
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMe && <CheckCheck className="w-3.5 h-3.5 text-white/90" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Bottom Input Composer matching mockup */}
      <div className="shrink-0 p-3 sm:p-4 bg-[#18191d] dark:bg-[#18191d] light:bg-white border-t border-[#25272e] light:border-slate-200">
        <form onSubmit={handleSend} className="flex items-center gap-2 max-w-4xl mx-auto">
          {/* Main Input Pill Bar with Smile, Clip, Camera */}
          <div className="flex-1 flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#141518] dark:bg-[#141518] light:bg-[#edf0f6] neu-dark-inset light:neu-light-inset border border-white/5 light:border-slate-300/50">
            {/* Smile Emoji button in Coral */}
            <button
              type="button"
              className="text-[#ff4545] hover:opacity-80 transition cursor-pointer"
              title="Add Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message"
              maxLength={4000}
              className="flex-1 bg-transparent text-sm text-white light:text-slate-900 placeholder:text-slate-500 light:placeholder:text-slate-400 focus:outline-hidden"
            />

            {/* Attachment Paperclip */}
            <button
              type="button"
              className="text-slate-400 hover:text-white light:hover:text-slate-700 transition cursor-pointer"
              title="Attach File"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Camera icon in Coral */}
            <button
              type="button"
              className="text-[#ff4545] hover:opacity-80 transition cursor-pointer"
              title="Attach Image"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>

          {/* Circular Red Action Button (Send or Mic) */}
          <button
            type="submit"
            disabled={sending}
            className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#ff3e3e] to-[#ff5c5c] text-white flex items-center justify-center neu-coral-glow shadow-xl hover:scale-105 active:scale-95 transition cursor-pointer shrink-0 disabled:opacity-50"
            title={inputText.trim() ? 'Send Message' : 'Voice Message'}
          >
            {inputText.trim() ? (
              <Send className="w-5 h-5 -ml-0.5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
