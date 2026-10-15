import React, { useState, useEffect } from 'react';
import { Conversation } from '../../types';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { CreateGroupModal } from './CreateGroupModal';
import { useAuth } from '../../context/AuthContext';
import { listenToConversations } from '../../services/chatService';
import { MessageSquare } from 'lucide-react';

interface ChatsViewProps {
  initialConversationId?: string | null;
  onOpenMyLinks: () => void;
}

export const ChatsView: React.FC<ChatsViewProps> = ({
  initialConversationId,
  onOpenMyLinks,
}) => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setConversations([]);
      setSelectedConversation(null);
      return;
    }

    const unsub = listenToConversations(currentUser.uid, (convs) => {
      setConversations(convs);

      if (initialConversationId) {
        const found = convs.find((c) => c.id === initialConversationId);
        if (found) setSelectedConversation(found);
      } else if (!selectedConversation && convs.length > 0 && window.innerWidth >= 768) {
        setSelectedConversation(convs[0]);
      }
    });

    return () => unsub();
  }, [currentUser, initialConversationId]);

  return (
    <div className="h-[calc(100vh-4rem)] max-w-7xl mx-auto md:p-4">
      <div className="h-full bg-[#18191d] dark:bg-[#18191d] light:bg-white md:rounded-3xl md:border md:border-[#25272e] light:md:border-slate-200 neu-dark-flat light:neu-light-flat shadow-2xl overflow-hidden flex flex-col md:flex-row transition-colors">
        {/* Left Column: Conversation List */}
        <div
          className={`w-full md:w-80 lg:w-96 h-full flex-col ${
            selectedConversation ? 'hidden md:flex' : 'flex'
          }`}
        >
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversation?.id || null}
            onSelect={(conv) => setSelectedConversation(conv)}
            onCreateGroup={() => setShowGroupModal(true)}
            onOpenMyLinks={onOpenMyLinks}
          />
        </div>

        {/* Right Column: Chat Window or Empty State */}
        <div
          className={`flex-1 h-full flex-col ${
            selectedConversation ? 'flex' : 'hidden md:flex'
          }`}
        >
          {selectedConversation ? (
            <ChatWindow
              conversation={selectedConversation}
              onBack={() => setSelectedConversation(null)}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#141518] dark:bg-[#141518] light:bg-[#f6f8fb]">
              <div className="w-16 h-16 rounded-full bg-[#23252c] dark:bg-[#23252c] light:bg-white flex items-center justify-center mb-4 text-[#ff4545] shadow-xl border border-white/5 light:border-slate-200">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white light:text-slate-900">
                No Chat Selected
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-500 max-w-sm mt-1 leading-relaxed">
                Choose a conversation from the left to start messaging, or copy your personal link to invite new clients.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onCreated={(id) => {
          const found = conversations.find((c) => c.id === id);
          if (found) setSelectedConversation(found);
        }}
      />
    </div>
  );
};
