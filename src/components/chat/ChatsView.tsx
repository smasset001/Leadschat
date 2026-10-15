import React, { useState, useEffect } from 'react';
import { Conversation } from '../../types';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { CreateGroupModal } from './CreateGroupModal';
import { useAuth } from '../../context/AuthContext';
import { listenToConversations } from '../../services/chatService';
import { MessageSquare, Share2 } from 'lucide-react';

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

      // If initial conversation ID specified, auto-select it
      if (initialConversationId) {
        const found = convs.find((c) => c.id === initialConversationId);
        if (found) setSelectedConversation(found);
      } else if (!selectedConversation && convs.length > 0 && window.innerWidth >= 768) {
        // Desktop default select first conversation
        setSelectedConversation(convs[0]);
      }
    });

    return () => unsub();
  }, [currentUser, initialConversationId]);

  return (
    <div className="h-[calc(100vh-4rem)] max-w-7xl mx-auto md:p-4">
      <div className="h-full bg-white md:rounded-2xl md:border md:border-slate-200 shadow-xs overflow-hidden flex flex-col md:flex-row">
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
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-4 text-slate-300 shadow-2xs">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Chat Selected</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Select an active conversation on the left, or share your campaign links with clients to receive inbound business leads.
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
