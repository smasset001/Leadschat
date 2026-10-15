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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { InAppNotification } from '../../types';
import { listenToNotifications, markNotificationAsRead } from '../../services/notificationService';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, onOpenAuth }) => {
  const { currentUser, userProfile, isAdmin, isPro, logout } = useAuth();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

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
    <header className="sticky top-0 z-40 w-full bg-slate-900 border-b border-slate-800 text-white shadow-xs">
      {/* 3-Zone Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: 1-line Brand wordmark */}
        <button
          onClick={() => onSelectTab('chats')}
          className="flex items-center gap-2.5 text-left shrink-0 cursor-pointer focus:outline-hidden"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm font-bold text-sm tracking-tight">
            LC
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
              Leads Chat
            </span>
          </div>
        </button>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => onSelectTab('chats')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap cursor-pointer ${
              currentTab === 'chats'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chats</span>
          </button>

          <button
            onClick={() => onSelectTab('reels')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap cursor-pointer ${
              currentTab === 'reels'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Reels</span>
          </button>

          <button
            onClick={() => onSelectTab('webinars')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap cursor-pointer ${
              currentTab === 'webinars'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Webinars</span>
          </button>

          <button
            onClick={() => onSelectTab('tools')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap cursor-pointer ${
              currentTab === 'tools'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Briefcase className="w-4 h-4 text-blue-400" />
            <span>Business Tools</span>
            {isPro && (
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider ml-0.5">
                PRO
              </span>
            )}
          </button>

          {isAdmin && (
            <button
              onClick={() => onSelectTab('admin')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap cursor-pointer ${
                currentTab === 'admin'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-amber-400/80 hover:text-amber-300 hover:bg-slate-800/60'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Admin Panel</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <PWAInstallButton className="hidden sm:inline-flex" />

          {currentUser ? (
            <div className="flex items-center gap-2 relative">
              {/* Notifications Toggle */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto rounded-xl bg-white border border-slate-200 text-slate-900 shadow-xl z-50 p-3">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                      In-App Notifications
                    </span>
                    <span className="text-[11px] text-slate-500">{notifications.length} total</span>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
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
                          className={`p-2.5 rounded-lg text-left text-xs transition cursor-pointer ${
                            n.isRead ? 'bg-slate-50 text-slate-600' : 'bg-blue-50/80 text-blue-900 font-medium border-l-2 border-blue-600'
                          }`}
                        >
                          <div className="font-semibold text-slate-900 mb-0.5">{n.title}</div>
                          <p className="text-slate-600 leading-relaxed">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
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
                className={`flex items-center gap-2 p-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                  currentTab === 'profile' ? 'bg-slate-800 ring-1 ring-slate-700' : 'hover:bg-slate-800'
                }`}
              >
                {userProfile?.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.displayName}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300">
                    {(userProfile?.displayName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden lg:inline text-xs font-medium text-slate-200 max-w-[120px] truncate">
                  {userProfile?.displayName || 'Profile'}
                </span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition whitespace-nowrap cursor-pointer shadow-xs"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
