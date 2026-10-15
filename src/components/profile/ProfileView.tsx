import React, { useState } from 'react';
import {
  User,
  Building,
  FileText,
  Link as LinkIcon,
  Bell,
  LogOut,
  Shield,
  Sparkles,
  Check,
  Download,
  Moon,
  Sun,
  Database,
  CheckCircle2,
  ExternalLink,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { requestWebPushPermission } from '../../services/notificationService';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { FirebaseStatusModal } from '../common/FirebaseStatusModal';
import { DEFAULT_AVATAR_IMG } from '../../assets/images';
import firebaseConfig from '../../../firebase-applet-config.json';

export const ProfileView: React.FC<{ onOpenUpgrade: () => void }> = ({ onOpenUpgrade }) => {
  const { currentUser, userProfile, userPrivate, isAdmin, isPro, updateUserProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [businessName, setBusinessName] = useState(userProfile?.businessName || '');
  const [businessDescription, setBusinessDescription] = useState(userProfile?.businessDescription || '');
  const [customChatSlug, setCustomChatSlug] = useState(userProfile?.customChatSlug || '');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedNotice(false);
    try {
      await updateUserProfile({
        displayName: displayName.trim(),
        businessName: businessName.trim(),
        businessDescription: businessDescription.trim(),
        customChatSlug: customChatSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEnablePush = async () => {
    const res = await requestWebPushPermission();
    if (res === 'granted') {
      setPushStatus('Push Notifications Enabled! Real-time alerts active.');
    } else if (res === 'denied') {
      setPushStatus('Notification permission was blocked in your browser settings.');
    } else {
      setPushStatus('Push notifications are not supported in this browser.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Account Status Card */}
      <div className="p-6 rounded-3xl bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white border border-[#26282f] dark:border-[#26282f] light:border-slate-200 neu-dark-card light:neu-light-card shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <img
            src={userProfile?.photoURL || DEFAULT_AVATAR_IMG}
            alt={userProfile?.displayName}
            className="w-16 h-16 rounded-full object-cover ring-2 ring-[#ff4545]/60 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white light:text-slate-900">{userProfile?.displayName}</h2>
              {isAdmin && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Admin
                </span>
              )}
              {isPro && !isAdmin && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ff4545]/20 text-[#ff4545] border border-[#ff4545]/30 uppercase tracking-wider">
                  Pro
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5 font-mono">{currentUser?.email}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-300 light:text-slate-600">
              <span>
                Lead Balance:{' '}
                <strong className="text-[#ff4545] font-mono tabular-nums">
                  {userPrivate?.leadBalance || 0}
                </strong>
              </span>
              <span>&bull;</span>
              <span>
                Delivered:{' '}
                <strong className="text-white light:text-slate-800 font-mono tabular-nums">
                  {userPrivate?.leadsDelivered || 0}
                </strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!isPro && (
            <button
              onClick={onOpenUpgrade}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-tr from-[#ff3e3e] to-[#ff5c5c] text-white shadow-md neu-coral-glow hover:opacity-95 transition cursor-pointer"
            >
              Upgrade to Pro
            </button>
          )}
          <button
            onClick={logout}
            className="p-2.5 text-slate-400 hover:text-rose-400 bg-[#25272e] dark:bg-[#25272e] light:bg-slate-100 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Theme Selection: Black Theme vs White Theme */}
      <div className="p-6 rounded-3xl bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white border border-[#26282f] dark:border-[#26282f] light:border-slate-200 neu-dark-card light:neu-light-card shadow-xl space-y-4 transition-colors">
        <div>
          <h3 className="text-base font-bold text-white light:text-slate-900 flex items-center gap-2">
            <span>Theme & Display Appearance</span>
          </h3>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
            Choose your preferred interface theme. Switch instantly between Black (Dark Neumorphic) and White (Clean Modern SaaS).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Black / Dark Theme Option */}
          <div
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
              theme === 'dark'
                ? 'bg-[#141518] border-[#ff4545] shadow-lg ring-1 ring-[#ff4545]/40'
                : 'bg-[#141518] border-white/10 hover:border-white/20'
            }`}
          >
            {theme === 'dark' && (
              <span className="absolute top-3 right-3 flex items-center justify-center w-6 h-6 rounded-full bg-[#ff4545] text-white text-xs font-bold shadow-md">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
            )}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">Black Theme (Dark)</span>
                <span className="text-[11px] text-slate-400">Obsidian & Neumorphic</span>
              </div>
            </div>
            {/* Visual Mini Mockup */}
            <div className="mt-3 p-2.5 rounded-xl bg-[#1d1e23] border border-white/5 space-y-1.5 pointer-events-none">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff4545]" />
                <div className="h-2 w-16 bg-white/20 rounded-sm" />
              </div>
              <div className="h-2 w-full bg-white/10 rounded-sm" />
              <div className="h-2 w-2/3 bg-white/5 rounded-sm" />
            </div>
          </div>

          {/* White / Light Theme Option */}
          <div
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
              theme === 'light'
                ? 'bg-white border-[#ff4545] shadow-lg ring-1 ring-[#ff4545]/40'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            {theme === 'light' && (
              <span className="absolute top-3 right-3 flex items-center justify-center w-6 h-6 rounded-full bg-[#ff4545] text-white text-xs font-bold shadow-md">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
            )}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block">White Theme (Light)</span>
                <span className="text-[11px] text-slate-500">Clean Crisp SaaS</span>
              </div>
            </div>
            {/* Visual Mini Mockup */}
            <div className="mt-3 p-2.5 rounded-xl bg-slate-100 border border-slate-200 space-y-1.5 pointer-events-none">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff4545]" />
                <div className="h-2 w-16 bg-slate-300 rounded-sm" />
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-sm" />
              <div className="h-2 w-2/3 bg-slate-200 rounded-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Firebase Cloud Database & Live Status */}
      <div className="p-6 rounded-3xl bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white border border-[#26282f] dark:border-[#26282f] light:border-slate-200 neu-dark-card light:neu-light-card shadow-xl space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white light:text-slate-900">
                Firebase Cloud Integration
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-500">
                Real-time connection with Cloud Firestore & Firebase Authentication
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowFirebaseModal(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 light:text-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition border border-emerald-500/20 cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Diagnostics</span>
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-[#141518] dark:bg-[#141518] light:bg-emerald-50/50 border border-emerald-500/20 light:border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <span className="text-xs font-bold text-emerald-400 light:text-emerald-800 block">
                LeadsChat is Connected to Firebase
              </span>
              <span className="text-[11px] text-slate-400 light:text-emerald-700">
                Project ID: <span className="font-mono text-slate-300 light:text-slate-700">{firebaseConfig.projectId}</span>
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowFirebaseModal(true)}
            className="text-xs font-bold text-[#ff4545] hover:opacity-80 transition cursor-pointer self-start sm:self-auto"
          >
            View Live Details &rarr;
          </button>
        </div>
      </div>

      {/* Profile Form */}
      <div className="p-6 rounded-3xl bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white border border-[#26282f] dark:border-[#26282f] light:border-slate-200 neu-dark-card light:neu-light-card shadow-xl space-y-4 transition-colors">
        <h3 className="text-base font-bold text-white light:text-slate-900">Public Business Profile</h3>
        <p className="text-xs text-slate-400 light:text-slate-500">
          This information is displayed when prospects click your personal chat link. Your email and mobile numbers remain completely private.
        </p>

        {savedNotice && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 light:text-emerald-800 light:bg-emerald-50 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#141518] dark:bg-[#141518] light:bg-slate-50 text-white light:text-slate-900 border border-white/10 light:border-slate-300 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#ff4545]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1">
                Business / Brand Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Apex Sales Consulting"
                className="w-full px-3.5 py-2.5 text-sm bg-[#141518] dark:bg-[#141518] light:bg-slate-50 text-white light:text-slate-900 border border-white/10 light:border-slate-300 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#ff4545]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1">
              Custom Permanent Chat Slug
            </label>
            <div className="flex items-center rounded-2xl border border-white/10 light:border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-[#ff4545] bg-[#141518] dark:bg-[#141518] light:bg-slate-50">
              <span className="px-3.5 py-2.5 bg-white/5 light:bg-slate-200 text-slate-400 light:text-slate-600 text-xs font-mono shrink-0">
                /?c=
              </span>
              <input
                type="text"
                value={customChatSlug}
                onChange={(e) => setCustomChatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'))}
                placeholder="my-personal-chat"
                className="w-full px-3.5 py-2.5 text-sm bg-transparent text-white light:text-slate-900 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1">
              Business Bio / Value Proposition
            </label>
            <textarea
              rows={3}
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="Helping business professionals scale client acquisition..."
              className="w-full px-3.5 py-2.5 text-sm bg-[#141518] dark:bg-[#141518] light:bg-slate-50 text-white light:text-slate-900 border border-white/10 light:border-slate-300 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#ff4545] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-tr from-[#ff3e3e] to-[#ff5c5c] text-white font-bold text-xs shadow-md neu-coral-glow hover:opacity-95 transition cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* Device & PWA Settings */}
      <div className="p-6 rounded-3xl bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white border border-[#26282f] dark:border-[#26282f] light:border-slate-200 neu-dark-card light:neu-light-card shadow-xl space-y-4 transition-colors">
        <h3 className="text-base font-bold text-white light:text-slate-900">App Preferences & PWA</h3>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#141518] dark:bg-[#141518] light:bg-slate-50 border border-white/5 light:border-slate-200">
            <div>
              <span className="text-xs font-semibold text-white light:text-slate-900 block">Web Push Notifications</span>
              <span className="text-[11px] text-slate-400 light:text-slate-500">
                Receive instant browser alerts when new messages or lead allocations arrive.
              </span>
              {pushStatus && (
                <span className="text-[11px] text-[#ff4545] block mt-1 font-medium">{pushStatus}</span>
              )}
            </div>
            <button
              onClick={handleEnablePush}
              className="px-3.5 py-1.5 rounded-xl bg-[#23252c] dark:bg-[#23252c] light:bg-white border border-white/10 light:border-slate-200 hover:opacity-90 text-slate-200 light:text-slate-700 text-xs font-semibold transition cursor-pointer shrink-0 self-start sm:self-auto"
            >
              Enable Notifications
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#141518] dark:bg-[#141518] light:bg-slate-50 border border-white/5 light:border-slate-200">
            <div>
              <span className="text-xs font-semibold text-white light:text-slate-900 block">Install PWA on Device</span>
              <span className="text-[11px] text-slate-400 light:text-slate-500">
                Install Leads Chat to your desktop or mobile home screen for standalone performance.
              </span>
            </div>
            <PWAInstallButton />
          </div>
        </div>
      </div>

      <FirebaseStatusModal
        isOpen={showFirebaseModal}
        onClose={() => setShowFirebaseModal(false)}
      />
    </div>
  );
};
