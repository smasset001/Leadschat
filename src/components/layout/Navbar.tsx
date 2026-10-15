import React, { useState } from 'react';
import {
  MessageSquare,
  Film,
  Calendar,
  Briefcase,
  Bell,
  User,
  ShieldAlert,
  LogOut,
  Sparkles,
  Sun,
  Moon,
  Database,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { FirebaseStatusModal } from '../common/FirebaseStatusModal';
import { InAppNotification } from '../../types';
import { listenToNotifications, markNotificationAsRead } from '../../services/notificationService';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, onOpenAuth }) => {
  const { currentUser, userProfile, isAdmin, isPro, logout } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);

  React.useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }
    const unsub = listenToNotifications(currentUser.uid, (list) => {
      setNotifications(list);
    });
    return () => unsub();
  }, [currentUser]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#18191d] dark:bg-[#18191d] light:bg-white border-b border-[#25272e] light:border-slate-200 text-white light:text-slate-900 shadow-sm transition-colors duration-200">
      {/* 3-Zone Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: 1-line Brand wordmark */}
        <button
          onClick={() => onSelectTab('chats')}
          className="flex items-center gap-2.5 text-left shrink-0 cursor-pointer focus:outline-hidden"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#ff3e3e] to-[#ff5c5c] flex items-center justify-center text-white neu-coral-glow font-black text-sm tracking-tight shadow-md">
            LC
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white light:text-slate-900 whitespace-nowrap">
              Leads Chat
            </span>
          </div>
        </button>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => onSelectTab('chats')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              currentTab === 'chats'
                ? 'bg-[#25272e] dark:bg-[#25272e] light:bg-slate-100 text-[#ff4545] shadow-xs'
                : 'text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chats</span>
          </button>

          <button
            onClick={() => onSelectTab('reels')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              currentTab === 'reels'
                ? 'bg-[#25272e] dark:bg-[#25272e] light:bg-slate-100 text-[#ff4545] shadow-xs'
                : 'text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Reels</span>
          </button>

          <button
            onClick={() => onSelectTab('webinars')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              currentTab === 'webinars'
                ? 'bg-[#25272e] dark:bg-[#25272e] light:bg-slate-100 text-[#ff4545] shadow-xs'
                : 'text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Events</span>
          </button>

          <button
            onClick={() => onSelectTab('tools')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              currentTab === 'tools'
                ? 'bg-[#25272e] dark:bg-[#25272e] light:bg-slate-100 text-[#ff4545] shadow-xs'
                : 'text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Lead Hub</span>
            {isPro && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#ff4545]/20 text-[#ff4545] uppercase tracking-wider ml-0.5">
                PRO
              </span>
            )}
          </button>

          {isAdmin && (
            <button
              onClick={() => onSelectTab('admin')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                currentTab === 'admin'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-amber-400/80 hover:text-amber-300'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Admin</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Firebase Connection Live Badge */}
          <button
            onClick={() => setShowFirebaseModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 light:bg-emerald-50 border border-emerald-500/30 light:border-emerald-200 text-emerald-400 light:text-emerald-700 text-[11px] font-semibold cursor-pointer hover:bg-emerald-500/20 transition shadow-2xs"
            title="Firebase Firestore & Auth Connected (Click for Live Diagnostics)"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline">Firebase Live</span>
          </button>

          {/* Dedicated Black / White Theme Dual Toggle */}
          <div className="flex items-center p-0.5 rounded-xl bg-[#23252c] dark:bg-[#23252c] light:bg-slate-100 border border-white/5 light:border-slate-200 shadow-inner">
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[#18191d] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Black Theme (Dark Mode)"
            >
              <Moon className="w-3.5 h-3.5 text-slate-200" />
              <span className="hidden md:inline text-[11px]">Black</span>
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                theme === 'light'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-400 light:text-slate-600 hover:text-slate-900'
              }`}
              title="White Theme (Light Mode)"
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden md:inline text-[11px]">White</span>
            </button>
          </div>

          <PWAInstallButton className="hidden sm:inline-flex" />

          {currentUser ? (
            <div className="flex items-center gap-2 relative">
              {/* Notifications Toggle */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full bg-[#23252c] dark:bg-[#23252c] light:bg-slate-100 text-slate-300 light:text-slate-600 hover:text-white light:hover:text-slate-900 transition shadow-sm border border-white/5 light:border-slate-200 cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#ff3b3b] text-[9px] font-bold text-white neu-coral-glow">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto rounded-2xl bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white border border-[#26282f] light:border-slate-200 text-white light:text-slate-900 shadow-2xl z-50 p-3">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 light:border-slate-100">
                    <span className="text-xs font-bold text-slate-300 light:text-slate-800 uppercase tracking-wider">
                      In-App Notifications
                    </span>
                    <span className="text-[11px] text-slate-500">{notifications.length} total</span>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      No notifications yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.isRead) markNotificationAsRead(n.id);
                          }}
                          className={`p-2.5 rounded-xl text-left text-xs transition cursor-pointer ${
                            n.isRead
                              ? 'bg-[#16171a] dark:bg-[#16171a] light:bg-slate-50 text-slate-400'
                              : 'bg-[#24262d] dark:bg-[#24262d] light:bg-red-50/60 text-white light:text-slate-900 font-medium border-l-2 border-[#ff4545]'
                          }`}
                        >
                          <div className="font-semibold text-white light:text-slate-900 mb-0.5">
                            {n.title}
                          </div>
                          <p className="text-slate-400 light:text-slate-600 leading-relaxed">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Profile Avatar / Tab */}
              <button
                onClick={() => onSelectTab('profile')}
                className={`flex items-center gap-2 p-1 rounded-full transition cursor-pointer ${
                  currentTab === 'profile' ? 'ring-2 ring-[#ff4545]' : 'hover:opacity-80'
                }`}
              >
                {userProfile?.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.displayName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#25272e] dark:bg-[#25272e] light:bg-slate-200 flex items-center justify-center text-xs font-bold text-white light:text-slate-800">
                    {(userProfile?.displayName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-tr from-[#ff3e3e] to-[#ff5c5c] rounded-xl neu-coral-glow hover:opacity-95 transition whitespace-nowrap cursor-pointer shadow-md"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      <FirebaseStatusModal
        isOpen={showFirebaseModal}
        onClose={() => setShowFirebaseModal(false)}
      />
    </header>
  );
};
