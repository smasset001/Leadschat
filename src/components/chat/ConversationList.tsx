import React, { useState } from 'react';
import {
  MessageSquare,
  Users,
  Search,
  Plus,
  Share2,
  Check,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';
import { Conversation } from '../../types';
import { useAuth } from '../../context/AuthContext';

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
      // Find other participant's name
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
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Top Header & Actions */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Conversations</h2>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onCreateGroup}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              title="Create Group Chat"
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopyPersonalLink}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition cursor-pointer"
              title="Copy your personal chat link to share with prospects"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Share Link'}</span>
            </button>
          </div>
        </div>

        {/* Search within authorized conversations */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>

        {/* Filter Segmented Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
              filterType === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('direct')}
            className={`flex-1 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
              filterType === 'direct'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Direct
          </button>
          <button
            onClick={() => setFilterType('group')}
            className={`flex-1 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
              filterType === 'group'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Conversation List Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mx-auto mb-2 text-slate-300">
              <MessageSquare className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-600">No conversations yet</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto leading-normal">
              Share your personal link to start receiving inbound business messages from customers.
            </p>
            <button
              onClick={handleCopyPersonalLink}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Copy Chat Link</span>
            </button>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = conv.id === selectedId;
            const otherId = conv.participantIds.find((id) => id !== currentUser?.uid);
            const otherDetails = otherId ? conv.participantDetails?.[otherId] : undefined;

            const title =
              conv.type === 'group'
                ? conv.groupName || 'Business Group'
                : otherDetails?.displayName || 'Chat Participant';

            const subtitle =
              conv.type === 'group'
                ? `${conv.participantIds.length} members`
                : otherDetails?.businessName || '';

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={`w-full p-3.5 text-left flex items-start gap-3 transition cursor-pointer ${
                  isSelected ? 'bg-blue-50/80 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {conv.type === 'group' ? (
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      <Users className="w-5 h-5" />
                    </div>
                  ) : otherDetails?.photoURL ? (
                    <img
                      src={otherDetails.photoURL}
                      alt={title}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                      {title.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[150px]">
                      {title}
                    </span>
                    {conv.lastMessageAt && (
                      <span className="text-[10px] font-mono tabular-nums text-slate-400 shrink-0">
                        {new Date(conv.lastMessageAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>

                  {subtitle && (
                    <span className="text-[10px] font-medium text-blue-600 block truncate mb-0.5">
                      {subtitle}
                    </span>
                  )}

                  <p className="text-xs text-slate-500 truncate leading-tight">
                    {conv.lastMessage || 'No messages yet'}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
