import React, { useState, useEffect } from 'react';
import {
  Link as LinkIcon,
  Copy,
  Check,
  TrendingUp,
  BarChart2,
  Plus,
  Globe,
  MessageCircle,
  UserPlus,
  Share2,
  Trash2,
  Power,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ChatLink, LinkEvent } from '../../types';
import {
  getUserLinks,
  createChatLink,
  toggleChatLinkStatus,
  getAffiliateAnalytics,
} from '../../services/linksService';

export const LinksAndAnalyticsSection: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [links, setLinks] = useState<ChatLink[]>([]);
  const [analytics, setAnalytics] = useState<{
    events: LinkEvent[];
    totalClicks: number;
    totalSignups: number;
    totalChats: number;
    sourceMap: Record<string, number>;
    signupConversionRate: string;
    chatConversionRate: string;
  } | null>(null);

  // New Link modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [slug, setSlug] = useState('');
  const [linkName, setLinkName] = useState('');
  const [campaignName, setCampaignName] = useState('Meta Ads');
  const [source, setSource] = useState('Facebook');
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!currentUser) return;
      try {
        const [userLinks, affAnalytics] = await Promise.all([
          getUserLinks(currentUser.uid),
          getAffiliateAnalytics(currentUser.uid),
        ]);
        setLinks(userLinks || []);
        setAnalytics(affAnalytics || null);
      } catch (err) {
        console.error('Failed to load links data:', err);
      }
    }
    loadData();
  }, [currentUser]);

  const handleCopyLink = (slugToCopy: string) => {
    const fullUrl = `${window.location.origin}/?c=${slugToCopy}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slugToCopy);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setErrorMsg(null);
    setCreating(true);

    try {
      await createChatLink(currentUser.uid, {
        slug,
        linkName,
        campaignName,
        source,
      });

      setShowCreateModal(false);
      setSlug('');
      setLinkName('');

      const updated = await getUserLinks(currentUser.uid);
      setLinks(updated || []);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (linkId: string, currentActive: boolean) => {
    try {
      await toggleChatLinkStatus(linkId, !currentActive);
      setLinks((prev) =>
        prev.map((l) => (l.id === linkId ? { ...l, isActive: !currentActive } : l))
      );
    } catch (err) {
      console.error('Failed to toggle link:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Analytics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Link Clicks
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono tabular-nums">
            {analytics?.totalClicks || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Unique visitor clicks</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Signups Attributed
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
            {analytics?.totalSignups || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {analytics?.signupConversionRate || '0'}% click-to-signup
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Conversations Started
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono tabular-nums">
            {analytics?.totalChats || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {analytics?.chatConversionRate || '0'}% conversion rate
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Active Campaign Links
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 font-mono tabular-nums">
            {links.filter((l) => l.isActive).length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{links.length} total links</p>
        </div>
      </div>

      {/* Campaign Links Manager */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Campaign Tracking Links</h3>
            <p className="text-xs text-slate-500">
              Create individual links for Facebook Ads, Instagram, and YouTube descriptions to trace conversion source.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign Link</span>
          </button>
        </div>

        {links.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-400 text-xs">
            No campaign links created yet. Click 'Create Campaign Link' above to set up your first tracking link.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Link Name / URL</th>
                    <th className="px-4 py-3">Campaign</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Clicks</th>
                    <th className="px-4 py-3">Signups</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {links.map((link) => {
                    const isCopied = copiedSlug === link.slug;
                    return (
                      <tr key={link.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 leading-tight">
                            {link.linkName}
                          </div>
                          <span className="text-[11px] font-mono text-blue-600 block mt-0.5">
                            /?c={link.slug}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 font-medium text-slate-700">
                          {link.campaignName || 'Direct'}
                        </td>

                        <td className="px-4 py-3.5 text-slate-600">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                            {link.source || 'Organic'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 font-bold font-mono tabular-nums text-slate-900">
                          {link.clicks || 0}
                        </td>

                        <td className="px-4 py-3.5 font-bold font-mono tabular-nums text-emerald-600">
                          {link.signups || 0}
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              link.isActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {link.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleCopyLink(link.slug)}
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer"
                              title="Copy Link URL"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleToggle(link.id, link.isActive)}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                link.isActive
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                              }`}
                              title={link.isActive ? 'Disable link' : 'Enable link'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Traffic Source Breakdown */}
      {analytics && Object.keys(analytics.sourceMap).length > 0 && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">Traffic Source Distribution</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(analytics.sourceMap).map(([src, count]) => (
              <div key={src} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-600 block">{src}</span>
                <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                  {count} events
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Link Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Create Campaign Chat Link
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Visitors opening this link will land on your business profile and automatically open a conversation with you upon signup.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Link Slug (URL Path) *
                </label>
                <div className="flex items-center rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-600">
                  <span className="px-3 py-2 bg-slate-100 text-slate-500 text-xs font-mono shrink-0">
                    /?c=
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'))}
                    placeholder="my-fb-campaign"
                    className="w-full px-3 py-2 text-sm focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Link Title *
                </label>
                <input
                  type="text"
                  required
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  placeholder="e.g. Facebook Ads - Scale Offer"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campaign Tag
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Webinar Launch 2026"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Source Channel
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="Facebook">Facebook Ads</option>
                  <option value="Instagram">Instagram Bio / Story</option>
                  <option value="YouTube">YouTube Description</option>
                  <option value="WhatsApp">WhatsApp Community</option>
                  <option value="Direct">Direct Outreach</option>
                  <option value="Organic">Organic Search</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
