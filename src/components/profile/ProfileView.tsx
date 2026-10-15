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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { requestWebPushPermission } from '../../services/notificationService';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { DEFAULT_AVATAR_IMG } from '../../assets/images';

export const ProfileView: React.FC<{ onOpenUpgrade: () => void }> = ({ onOpenUpgrade }) => {
  const { currentUser, userProfile, userPrivate, isAdmin, isPro, updateUserProfile, logout } = useAuth();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [businessName, setBusinessName] = useState(userProfile?.businessName || '');
  const [businessDescription, setBusinessDescription] = useState(userProfile?.businessDescription || '');
  const [customChatSlug, setCustomChatSlug] = useState(userProfile?.customChatSlug || '');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);

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
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={userProfile?.photoURL || DEFAULT_AVATAR_IMG}
            alt={userProfile?.displayName}
            className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 shadow-xs"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{userProfile?.displayName}</h2>
              {isAdmin && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                  Admin
                </span>
              )}
              {isPro && !isAdmin && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                  Pro
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">{currentUser?.email}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-600">
              <span>
                Lead Balance:{' '}
                <strong className="text-blue-600 font-mono tabular-nums">
                  {userPrivate?.leadBalance || 0}
                </strong>
              </span>
              <span>&bull;</span>
              <span>
                Delivered:{' '}
                <strong className="text-slate-800 font-mono tabular-nums">
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
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs hover:opacity-95 transition cursor-pointer"
            >
              Upgrade to Pro
            </button>
          )}
          <button
            onClick={logout}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Profile Form */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">Public Business Profile</h3>
        <p className="text-xs text-slate-500">
          This information is displayed when prospects click your personal chat link. Your email and mobile numbers remain completely private.
        </p>

        {savedNotice && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Business / Brand Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Apex Sales Consulting"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Custom Permanent Chat Slug
            </label>
            <div className="flex items-center rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-600">
              <span className="px-3 py-2 bg-slate-100 text-slate-500 text-xs font-mono shrink-0">
                /?c=
              </span>
              <input
                type="text"
                value={customChatSlug}
                onChange={(e) => setCustomChatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'))}
                placeholder="my-personal-chat"
                className="w-full px-3 py-2 text-sm focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Business Bio / Value Proposition
            </label>
            <textarea
              rows={3}
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="Helping business professionals scale client acquisition..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* Device & PWA Settings */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">App Preferences & PWA</h3>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <span className="text-xs font-semibold text-slate-900 block">Web Push Notifications</span>
              <span className="text-[11px] text-slate-500">
                Receive instant browser alerts when new messages or lead allocations arrive.
              </span>
              {pushStatus && (
                <span className="text-[11px] text-blue-600 block mt-1 font-medium">{pushStatus}</span>
              )}
            </div>
            <button
              onClick={handleEnablePush}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer shrink-0 self-start sm:self-auto"
            >
              Enable Notifications
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <span className="text-xs font-semibold text-slate-900 block">Install PWA on Device</span>
              <span className="text-[11px] text-slate-500">
                Install Leads Chat to your desktop or mobile home screen for standalone performance.
              </span>
            </div>
            <PWAInstallButton />
          </div>
        </div>
      </div>
    </div>
  );
};
