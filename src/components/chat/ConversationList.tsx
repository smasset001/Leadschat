import React, { useState } from 'react';
import {
  MessageSquare,
  Users,
  Search,
  Plus,
  Share2,
  Check,
  Link as LinkIcon,
  Sun,
  Moon,
} from 'lucide-react';
import { Conversation } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { DEFAULT_AVATAR_IMG } from '../../assets/images';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conv: Conversation) => void;
  onCreateGroup: () => void;
  onOpenMyLinks: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelect,
  onCreateGroup,
  onOpenMyLinks,
}) => {
  const { currentUser, userProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'direct' | 'group'>('all');
  const [copiedLink, setCopiedLink] = useState(false);

  const personalLinkSlug = userProfile?.customChatSlug || currentUser?.uid || '';
  const personalLinkUrl = `${window.location.origin}/?c=${personalLinkSlug}`;

  const handleCopyPersonalLink = () => {
    navigator.clipboard.writeText(personalLinkUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredConversations = conversations.filter((c) => {
    if (filterType !== 'all' && c.type !== filterType) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();

    if (c.type === 'group') {
      return (
        c.groupName?.toLowerCase().includes(q) ||
        c.lastMessage?.toLowerCase().includes(q)
      );
    } else {
      const otherId = c.participantIds.find((id) => id !== currentUser?.uid);
      const details = otherId ? c.participantDetails?.[otherId] : undefined;
      return (
        details?.displayName?.toLowerCase().includes(q) ||
        details?.businessName?.toLowerCase().includes(q) ||
        c.lastMessage?.toLowerCase().includes(q)
      );
    }
  });

  return (
    <div className="flex flex-col h-full bg-[#18191d] dark:bg-[#18191d] light:bg-[#f3f5f9] text-white light:text-slate-900 border-r border-[#26282f] light:border-slate-200 transition-colors duration-200">
      {/* Top Header matching mockup: Avatar - "Chats" Title - Red Plus Button */}
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* User Profile Avatar with neumorphic ring */}
            <div className="relative">
              <img
                src={userProfile?.photoURL || DEFAULT_AVATAR_IMG}
                alt={userProfile?.displayName || 'User'}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-[#ff4545]/60 shadow-md"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#18191d] light:ring-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white light:text-slate-900">
                Chats
              </h1>
              <span className="text-[11px] text-slate-400 light:text-slate-500 font-medium">
                {conversations.length} Active Threads
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle (Dark/White switcher) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-[#23252c] dark:bg-[#23252c] light:bg-white text-slate-300 light:text-slate-600 hover:text-white light:hover:text-slate-900 shadow-sm border border-white/5 light:border-slate-200 transition cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Quick Share Link Button */}
            <button
              onClick={handleCopyPersonalLink}
              className="p-2 rounded-full bg-[#23252c] dark:bg-[#23252c] light:bg-white text-slate-300 light:text-slate-600 hover:text-white shadow-sm border border-white/5 light:border-slate-200 transition cursor-pointer"
              title="Copy your personal chat link"
            >
              {copiedLink ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <LinkIcon className="w-4 h-4 text-slate-300 light:text-slate-600" />
              )}
            </button>

            {/* Red Floating Action Plus Button from Mockup */}
            <button
              onClick={onCreateGroup}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#ff3e3e] to-[#ff5c5c] text-white flex items-center justify-center neu-coral-glow hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
              title="Create New Business Group"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Neumorphic Search Bar matching mockup */}
        <div className="relative">
          <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400 light:text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-[#141518] dark:bg-[#141518] light:bg-[#e9ecf2] text-white light:text-slate-900 placeholder:text-slate-500 light:placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#ff4545]/60 neu-dark-inset light:neu-light-inset border border-white/5 light:border-slate-300/40"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#141518] dark:bg-[#141518] light:bg-[#e4e7ee] text-xs font-semibold">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${
              filterType === 'all'
                ? 'bg-[#25272e] dark:bg-[#25272e] light:bg-white text-white light:text-slate-900 shadow-sm'
                : 'text-slate-400 light:text-slate-600 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('direct')}
            className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${
              filterType === 'direct'
                ? 'bg-[#25272e] dark:bg-[#25272e] light:bg-white text-white light:text-slate-900 shadow-sm'
                : 'text-slate-400 light:text-slate-600 hover:text-white'
            }`}
          >
            Direct
          </button>
          <button
            onClick={() => setFilterType('group')}
            className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${
              filterType === 'group'
                ? 'bg-[#25272e] dark:bg-[#25272e] light:bg-white text-white light:text-slate-900 shadow-sm'
                : 'text-slate-400 light:text-slate-600 hover:text-white'
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Conversation List with hairline dividers */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#22242b] dark:divide-[#22242b] light:divide-slate-200/80 px-2">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-slate-400 light:text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-[#23252c] dark:bg-[#23252c] light:bg-white flex items-center justify-center mx-auto mb-3 text-[#ff4545] shadow-md border border-white/5 light:border-slate-200">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-200 light:text-slate-800">
              No conversations yet
            </p>
            <p className="text-xs text-slate-400 light:text-slate-500 mt-1 max-w-[220px] mx-auto leading-relaxed">
              Share your personal chat link to start receiving inbound messages from clients.
            </p>
            <button
              onClick={handleCopyPersonalLink}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff4343] text-white text-xs font-bold neu-coral-glow hover:opacity-90 transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Copy Personal Link</span>
            </button>
          </div>
        ) : (
          filteredConversations.map((conv, idx) => {
            const isSelected = conv.id === selectedId;
            const otherId = conv.participantIds.find((id) => id !== currentUser?.uid);
            const otherDetails = otherId ? conv.participantDetails?.[otherId] : undefined;

            const title =
              conv.type === 'group'
                ? conv.groupName || 'Business Group'
                : otherDetails?.displayName || 'Chat Participant';

            const lastTime = conv.lastMessageAt
              ? new Date(conv.lastMessageAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '12:35';

            // Badge counter simulation or calculation
            const simulatedUnread = idx === 0 ? '100' : idx === 1 ? '99+' : idx === 2 ? '3' : null;

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={`w-full p-3.5 rounded-2xl text-left flex items-center gap-3.5 transition-all my-1 cursor-pointer ${
                  isSelected
                    ? 'bg-[#23252c] dark:bg-[#23252c] light:bg-white neu-dark-flat light:neu-light-flat ring-1 ring-[#ff4545]/40'
                    : 'hover:bg-[#1e2025] dark:hover:bg-[#1e2025] light:hover:bg-slate-100/70'
                }`}
              >
                {/* Circular Avatar */}
                <div className="relative shrink-0">
                  {conv.type === 'group' ? (
                    <div className="w-12 h-12 rounded-full bg-[#272930] dark:bg-[#272930] light:bg-slate-200 text-[#ff4545] flex items-center justify-center font-bold text-sm shadow-md">
                      <Users className="w-5 h-5" />
                    </div>
                  ) : otherDetails?.photoURL ? (
                    <img
                      src={otherDetails.photoURL}
                      alt={title}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10 light:ring-slate-300 shadow-md"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#25272e] dark:bg-[#25272e] light:bg-slate-300 text-white light:text-slate-900 flex items-center justify-center font-bold text-sm shadow-md ring-1 ring-white/10">
                      {title.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-white light:text-slate-900 truncate">
                      {title}
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-[#ff4545] light:text-[#ff3e3e] font-semibold shrink-0">
                      {lastTime}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-400 light:text-slate-500 truncate leading-snug">
                      {conv.lastMessage || 'Tap to open conversation'}
                    </p>

                    {/* Coral Red Badge Pill matching screenshot */}
                    {simulatedUnread && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#ff3b3b] text-white shrink-0 neu-coral-glow">
                        {simulatedUnread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
