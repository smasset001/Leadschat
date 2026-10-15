/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { MobileNav } from './components/layout/MobileNav';
import { ChatsView } from './components/chat/ChatsView';
import { ReelsFeed } from './components/reels/ReelsFeed';
import { WebinarsSection } from './components/webinars/WebinarsSection';
import { BusinessToolsView } from './components/tools/BusinessToolsView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ProfileView } from './components/profile/ProfileView';
import { PublicLinkLanding } from './components/public/PublicLinkLanding';
import { AuthModal } from './components/auth/AuthModal';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { getOrCreateDirectConversation } from './services/chatService';

import { ThemeProvider, useTheme } from './context/ThemeContext';

function AppContent() {
  const { currentUser, userProfile, isAdmin, loading } = useAuth();
  const { theme } = useTheme();
  const [currentTab, setCurrentTab] = useState<string>('chats');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [publicSlug, setPublicSlug] = useState<string | null>(null);
  const [targetConversationId, setTargetConversationId] = useState<string | null>(null);

  // Parse initial URL query or path for public link: ?c=slug or /c/slug
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const querySlug = params.get('c');
    const pathMatch = window.location.pathname.match(/^\/c\/([a-zA-Z0-9_-]+)/);

    if (querySlug) {
      setPublicSlug(querySlug);
    } else if (pathMatch && pathMatch[1]) {
      setPublicSlug(pathMatch[1]);
    }
  }, []);

  // Post-authentication resumption for pending chat links
  useEffect(() => {
    async function resumePendingChat() {
      if (!currentUser) return;
      const pendingTargetUid = localStorage.getItem('leads_chat_target_chat_uid');
      if (pendingTargetUid && pendingTargetUid !== currentUser.uid) {
        localStorage.removeItem('leads_chat_target_chat_uid');
        try {
          const convId = await getOrCreateDirectConversation(
            {
              uid: currentUser.uid,
              displayName: userProfile?.displayName || currentUser.email || 'You',
              photoURL: userProfile?.photoURL,
            },
            {
              uid: pendingTargetUid,
              displayName: 'Affiliate Partner',
            }
          );
          setTargetConversationId(convId);
          setPublicSlug(null);
          setCurrentTab('chats');
        } catch (err) {
          console.error('Failed to resume pending chat:', err);
        }
      }
    }
    resumePendingChat();
  }, [currentUser, userProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121316] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#ff3e3e] to-[#ff5c5c] flex items-center justify-center text-white font-black text-xl neu-coral-glow shadow-xl">
            LC
          </div>
          <span className="text-xs font-semibold text-slate-400">Loading Leads Chat...</span>
        </div>
      </div>
    );
  }

  // If viewing a public link destination
  if (publicSlug) {
    return (
      <div className="min-h-screen bg-[#121316] dark:bg-[#121316] light:bg-[#f0f2f7] text-white light:text-slate-900 flex flex-col justify-between transition-colors">
        <header className="px-6 py-4 bg-[#18191d] dark:bg-[#18191d] light:bg-white border-b border-[#25272e] light:border-slate-200 text-white light:text-slate-900 flex items-center justify-between">
          <button
            onClick={() => setPublicSlug(null)}
            className="flex items-center gap-2 font-bold tracking-tight text-white light:text-slate-900 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#ff3e3e] to-[#ff5c5c] flex items-center justify-center text-white text-xs font-black neu-coral-glow">
              LC
            </div>
            <span>Leads Chat</span>
          </button>
          {!currentUser && (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#ff4545] hover:opacity-90 text-white text-xs font-bold neu-coral-glow transition"
            >
              Sign In
            </button>
          )}
        </header>

        <PublicLinkLanding
          slug={publicSlug}
          onOpenChat={(convId) => {
            setTargetConversationId(convId);
            setPublicSlug(null);
            setCurrentTab('chats');
          }}
          onOpenAuth={() => setAuthModalOpen(true)}
        />

        <footer className="py-4 text-center text-xs text-slate-500 border-t border-[#25272e] light:border-slate-200 bg-[#18191d] dark:bg-[#18191d] light:bg-white">
          Leads Chat &bull; Business Messaging & Customer Relationship Platform
        </footer>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => setAuthModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121316] dark:bg-[#121316] light:bg-[#f0f2f7] text-white light:text-slate-900 flex flex-col pb-20 md:pb-0 transition-colors">
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      <main className="flex-1">
        {currentTab === 'chats' && (
          <ChatsView
            initialConversationId={targetConversationId}
            onOpenMyLinks={() => setCurrentTab('tools')}
          />
        )}
        {currentTab === 'reels' && (
          <ReelsFeed onOpenAdminReels={() => setCurrentTab('admin')} />
        )}
        {currentTab === 'webinars' && <WebinarsSection />}
        {currentTab === 'tools' && <BusinessToolsView />}
        {currentTab === 'admin' && <AdminDashboard />}
        {currentTab === 'profile' && (
          <ProfileView onOpenUpgrade={() => setCurrentTab('tools')} />
        )}
      </main>

      <MobileNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
      />

      <OfflineIndicator />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
