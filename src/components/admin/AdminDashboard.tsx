import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  XCircle,
  Upload,
  Layers,
  Film,
  Calendar,
  Settings,
  FileText,
  Search,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getAllUsersAdmin,
  adminUpdateUserRole,
  getAdminAuditLogs,
  getAdminPlatformMetrics,
  getApplicationSettings,
  updateApplicationSettings,
} from '../../services/adminService';
import {
  getAllPurchaseRequestsAdmin,
  adminApprovePurchase,
  adminRejectPurchase,
  adminImportLeads,
  getLeadInventoryStats,
  adminAllocateLeads,
} from '../../services/leadService';
import {
  getAllReelsAdmin,
  createReel,
  updateReel,
  deleteReel,
} from '../../services/reelsService';
import {
  getWebinars,
  createWebinar,
  toggleWebinarCancel,
  getAnnouncements,
  createAnnouncement,
} from '../../services/webinarService';
import {
  UserProfile,
  LeadPurchaseRequest,
  AdminAuditLog,
  ApplicationSettings,
  Reel,
  Webinar,
  Announcement,
} from '../../types';

export const AdminDashboard: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'requests'
    | 'inventory'
    | 'distribution'
    | 'users'
    | 'reels'
    | 'webinars'
    | 'settings'
    | 'logs'
  >('overview');

  // Metrics
  const [metrics, setMetrics] = useState<{
    totalUsers: number;
    proUsers: number;
    pendingRequests: number;
    availableLeads: number;
    assignedLeads: number;
    totalClicks: number;
    totalSignups: number;
    totalLinks: number;
  } | null>(null);

  // Users
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Purchase Requests
  const [requests, setRequests] = useState<LeadPurchaseRequest[]>([]);
  const [rejectModalReq, setRejectModalReq] = useState<LeadPurchaseRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Inventory & CSV Import
  const [inventoryStats, setInventoryStats] = useState<any>(null);
  const [csvText, setCsvText] = useState('');
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // Lead Distribution
  const [selectedAffiliateId, setSelectedAffiliateId] = useState('');
  const [allocateQty, setAllocateQty] = useState(10);
  const [distributeMsg, setDistributeMsg] = useState<string | null>(null);

  // Reels
  const [adminReels, setAdminReels] = useState<Reel[]>([]);
  const [showAddReel, setShowAddReel] = useState(false);
  const [newReelTitle, setNewReelTitle] = useState('');
  const [newReelUrl, setNewReelUrl] = useState('');
  const [newReelDesc, setNewReelDesc] = useState('');
  const [newReelCategory, setNewReelCategory] = useState('Sales Strategy');

  // Webinars & Announcements
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newWebinarTitle, setNewWebinarTitle] = useState('');
  const [newWebinarDate, setNewWebinarDate] = useState('');
  const [newWebinarUrl, setNewWebinarUrl] = useState('');
  const [newWebinarDesc, setNewWebinarDesc] = useState('');

  // Settings
  const [settings, setSettings] = useState<ApplicationSettings | null>(null);
  const [proMonthly, setProMonthly] = useState(99);
  const [proYearly, setProYearly] = useState(999);
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  const [loading, setLoading] = useState(true);

  const loadAllData = async () => {
    try {
      const [m, u, r, inv, reels, w, a, s, l] = await Promise.all([
        getAdminPlatformMetrics(),
        getAllUsersAdmin(),
        getAllPurchaseRequestsAdmin(),
        getLeadInventoryStats(),
        getAllReelsAdmin(),
        getWebinars(),
        getAnnouncements(),
        getApplicationSettings(),
        getAdminAuditLogs(40),
      ]);
      setMetrics(m || null);
      setUsersList(u || []);
      setRequests(r || []);
      setInventoryStats(inv || null);
      setAdminReels(reels || []);
      setWebinars(w || []);
      setAnnouncements(a || []);
      if (s) {
        setSettings(s);
        setProMonthly(s.proMonthlyINR || 99);
        setProYearly(s.proYearlyINR || 999);
        setPaymentInstructions(s.manualPaymentInstructions || '');
      }
      setAuditLogs(l || []);
    } catch (err) {
      console.error('Failed to load admin panel data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadAllData();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-2xl bg-white border border-red-200 text-center text-slate-800 shadow-md">
        <ShieldAlert className="w-12 h-12 text-red-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold">Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-2">
          Administrator privileges are required to access this dashboard.
        </p>
      </div>
    );
  }

  // --- ACTIONS ---

  const handleApprove = async (reqId: string) => {
    if (!currentUser) return;
    try {
      await adminApprovePurchase(reqId, currentUser.uid, currentUser.email || 'Admin');
      await loadAllData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleReject = async () => {
    if (!rejectModalReq || !currentUser) return;
    try {
      await adminRejectPurchase(
        rejectModalReq.id,
        currentUser.uid,
        currentUser.email || 'Admin',
        rejectReason || 'Payment could not be verified.'
      );
      setRejectModalReq(null);
      setRejectReason('');
      await loadAllData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim() || !currentUser) return;

    try {
      const lines = csvText.trim().split('\n');
      const parsed: Array<{ name: string; phone: string; email?: string; notes?: string }> = [];

      lines.forEach((line) => {
        const parts = line.split(',').map((p) => p.trim());
        if (parts.length >= 2) {
          parsed.push({
            name: parts[0],
            phone: parts[1],
            email: parts[2] || '',
            notes: parts[3] || 'Imported via CSV',
          });
        }
      });

      if (parsed.length === 0) {
        throw new Error('No valid rows found. Format: Name, Phone, Email, Notes');
      }

      const res = await adminImportLeads(parsed, currentUser.uid, currentUser.email || 'Admin');
      setImportNotice(`Imported ${res.imported} leads! (Skipped ${res.duplicates} duplicates)`);
      setCsvText('');
      await loadAllData();
    } catch (err: unknown) {
      setImportNotice(err instanceof Error ? err.message : String(err));
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAffiliateId || !currentUser) return;

    const affiliate = usersList.find((u) => u.uid === selectedAffiliateId);
    if (!affiliate) return;

    try {
      await adminAllocateLeads({
        affiliateId: selectedAffiliateId,
        affiliateName: affiliate.displayName || 'Affiliate',
        quantity: Number(allocateQty),
        adminUid: currentUser.uid,
        adminEmail: currentUser.email || 'Admin',
      });

      setDistributeMsg(`Successfully allocated ${allocateQty} leads to ${affiliate.displayName}!`);
      await loadAllData();
    } catch (err: unknown) {
      setDistributeMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      await updateApplicationSettings(currentUser.uid, currentUser.email || 'Admin', {
        proMonthlyINR: Number(proMonthly),
        proYearlyINR: Number(proYearly),
        manualPaymentInstructions: paymentInstructions.trim(),
      });
      setSettingsNotice('Application settings updated successfully.');
      setTimeout(() => setSettingsNotice(null), 3000);
    } catch (err: unknown) {
      setSettingsNotice(err instanceof Error ? err.message : String(err));
    }
  };

  const handleAddReel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newReelUrl.trim()) return;
    try {
      await createReel(currentUser.uid, currentUser.email || 'Admin', {
        title: newReelTitle.trim() || 'Business Strategy Video',
        description: newReelDesc.trim(),
        category: newReelCategory,
        videoUrl: newReelUrl.trim(),
        isFeatured: false,
        isPublished: true,
        order: (adminReels.length || 0) + 1,
      });
      setShowAddReel(false);
      setNewReelTitle('');
      setNewReelUrl('');
      setNewReelDesc('');
      await loadAllData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDeleteReel = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reel?')) return;
    if (!currentUser) return;
    try {
      await deleteReel(currentUser.uid, currentUser.email || 'Admin', id);
      await loadAllData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleAddWebinar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newWebinarTitle.trim()) return;
    try {
      await createWebinar(currentUser.uid, currentUser.email || 'Admin', {
        title: newWebinarTitle.trim(),
        description: newWebinarDesc.trim(),
        scheduledAt: new Date(newWebinarDate).toISOString(),
        timezone: 'IST',
        joinUrl: newWebinarUrl.trim() || 'https://meet.google.com/new',
      });
      setNewWebinarTitle('');
      setNewWebinarDesc('');
      setNewWebinarUrl('');
      await loadAllData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const navTabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'requests', label: `Purchase Requests (${metrics?.pendingRequests || 0})`, icon: DollarSign },
    { id: 'inventory', label: 'Lead Inventory', icon: Layers },
    { id: 'distribution', label: 'Distribute Leads', icon: Upload },
    { id: 'users', label: 'Users & Roles', icon: Users },
    { id: 'reels', label: 'Reels Manager', icon: Film },
    { id: 'webinars', label: 'Webinars & Updates', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'logs', label: 'Audit Logs', icon: FileText },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Admin Operations Panel
            </h1>
            <p className="text-xs text-slate-500">
              Verify lead payments, import raw lead inventory, allocate leads, and manage business content.
            </p>
          </div>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 no-scrollbar">
        {navTabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Total Users
              </span>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {metrics?.totalUsers || 0}
              </div>
              <span className="text-[10px] text-slate-400">
                {metrics?.proUsers || 0} Pro Affiliates
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Pending Purchases
              </span>
              <div className="text-2xl font-bold text-amber-600 font-mono tabular-nums">
                {metrics?.pendingRequests || 0}
              </div>
              <span className="text-[10px] text-slate-400">Requires verification</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Available Lead Pool
              </span>
              <div className="text-2xl font-bold text-blue-600 font-mono tabular-nums">
                {inventoryStats?.available || 0}
              </div>
              <span className="text-[10px] text-slate-400">
                {inventoryStats?.assigned || 0} Allocated
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Campaign Clicks
              </span>
              <div className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">
                {metrics?.totalClicks || 0}
              </div>
              <span className="text-[10px] text-slate-400">
                Across {metrics?.totalLinks || 0} links
              </span>
            </div>
          </div>

          {/* Quick Pending Purchases Preview */}
          {requests.filter((r) => r.status === 'pending').length > 0 && (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
              <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>
                  Action Required: {requests.filter((r) => r.status === 'pending').length} Pending Lead Purchase Orders
                </span>
              </h3>
              <p className="text-xs text-amber-800">
                Switch to the "Purchase Requests" tab to verify payment references and credit affiliate entitlements.
              </p>
              <button
                onClick={() => setActiveTab('requests')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition cursor-pointer"
              >
                Review Requests Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PURCHASE REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Affiliate Lead Purchase Requests</h2>
          {requests.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
              No purchase requests found.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Affiliate</th>
                      <th className="px-4 py-3">Leads</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Payment Ref</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono tabular-nums text-slate-500">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{req.affiliateName}</div>
                          <div className="text-[11px] text-slate-500">{req.affiliateEmail}</div>
                        </td>
                        <td className="px-4 py-3 font-bold font-mono tabular-nums text-slate-900">
                          {req.leadsCount}
                        </td>
                        <td className="px-4 py-3 font-bold font-mono tabular-nums text-slate-800">
                          ₹{req.amountINR}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700">
                          {req.paymentReference}
                          {req.notes && (
                            <div className="text-[10px] text-slate-400 mt-0.5">{req.notes}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              req.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : req.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {req.status === 'pending' ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleApprove(req.id)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-xs"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectModalReq(req)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              Verified by {req.reviewedBy || 'Admin'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rejection Modal */}
          {rejectModalReq && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
              <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Reject Purchase Request
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Provide reason for rejecting payment reference: {rejectModalReq.paymentReference}
                </p>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. UTR not found in bank statement"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl mb-4 focus:outline-hidden focus:ring-2 focus:ring-red-600 resize-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setRejectModalReq(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition cursor-pointer"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LEAD INVENTORY & CSV IMPORT */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <span>Import Leads from CSV</span>
            </h2>
            <p className="text-xs text-slate-500">
              Paste CSV rows or upload lead batches. Format: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">Name, Phone, Email, Notes</code>. Duplicate phone numbers will be automatically filtered out.
            </p>

            {importNotice && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                {importNotice}
              </div>
            )}

            <form onSubmit={handleCsvImport} className="space-y-3">
              <textarea
                rows={5}
                required
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Vikram Malhotra, +919811223344, vikram@domain.com, Real Estate Investor&#10;Pooja Verma, +919822334455, pooja@agency.com, Digital Marketing Agency"
                className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Import Leads Batch
              </button>
            </form>
          </div>

          {/* Lead inventory summary */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-base font-bold text-slate-900">Current Raw Lead Pool</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-500">Total Ingested</span>
                <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                  {inventoryStats?.total || 0}
                </div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <span className="text-xs text-emerald-700">Available to Distribute</span>
                <div className="text-xl font-bold text-emerald-700 font-mono tabular-nums">
                  {inventoryStats?.available || 0}
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <span className="text-xs text-blue-700">Assigned to Affiliates</span>
                <div className="text-xl font-bold text-blue-700 font-mono tabular-nums">
                  {inventoryStats?.assigned || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MANUAL LEAD DISTRIBUTION */}
      {activeTab === 'distribution' && (
        <div className="space-y-6 max-w-xl">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Distribute Leads to Affiliate</h2>
            <p className="text-xs text-slate-500">
              Select an affiliate with active purchased lead entitlement. Assigned leads are moved transactionally from the inventory into the affiliate's CRM.
            </p>

            {distributeMsg && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                {distributeMsg}
              </div>
            )}

            <form onSubmit={handleAllocate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Affiliate
                </label>
                <select
                  required
                  value={selectedAffiliateId}
                  onChange={(e) => setSelectedAffiliateId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">-- Choose Affiliate --</option>
                  {usersList.map((u) => (
                    <option key={u.uid} value={u.uid}>
                      {u.displayName || u.email} &bull; Balance: {u.leadBalance || 0} credits
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity to Distribute
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  required
                  value={allocateQty}
                  onChange={(e) => setAllocateQty(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
              >
                Distribute Leads Now
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: USERS & ROLES */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Registered Accounts</h2>
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search user..."
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Mobile</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Lead Balance</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList
                    .filter((u) =>
                      u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
                      u.email?.toLowerCase().includes(userSearch.toLowerCase())
                    )
                    .map((user) => (
                      <tr key={user.uid} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-900">{user.displayName}</td>
                        <td className="px-4 py-3 text-slate-600">{user.email || '-'}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{user.mobile || '-'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              user.role === 'admin'
                                ? 'bg-amber-100 text-amber-800'
                                : user.isPro
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold tabular-nums text-slate-900">
                          {user.leadBalance || 0}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={async () => {
                              if (!currentUser) return;
                              const newProState = !user.isPro;
                              await adminUpdateUserRole(
                                currentUser.uid,
                                currentUser.email || 'Admin',
                                user.uid,
                                user.email || '',
                                user.role === 'admin' ? 'admin' : newProState ? 'pro' : 'free',
                                newProState
                              );
                              await loadAllData();
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                          >
                            {user.isPro ? 'Revoke Pro' : 'Grant Pro'}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: REELS MANAGER */}
      {activeTab === 'reels' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Admin Reels Management</h2>
            <button
              onClick={() => setShowAddReel(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Reel URL</span>
            </button>
          </div>

          {/* Add Reel Modal */}
          {showAddReel && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
              <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
                <h3 className="text-base font-bold text-slate-900 mb-1">Add Video Reel</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Provide an external video URL (YouTube Shorts, YouTube, or Vimeo).
                </p>
                <form onSubmit={handleAddReel} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Video Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={newReelTitle}
                      onChange={(e) => setNewReelTitle(e.target.value)}
                      placeholder="e.g. 3 Keys to High-Converting Cold Calls"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      External Video URL (YouTube / Shorts) *
                    </label>
                    <input
                      type="url"
                      required
                      value={newReelUrl}
                      onChange={(e) => setNewReelUrl(e.target.value)}
                      placeholder="https://www.youtube.com/shorts/..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={newReelCategory}
                      onChange={(e) => setNewReelCategory(e.target.value)}
                      placeholder="Sales Strategy"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={newReelDesc}
                      onChange={(e) => setNewReelDesc(e.target.value)}
                      placeholder="Brief overview..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl resize-none"
                    />
                  </div>
                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddReel(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg cursor-pointer"
                    >
                      Publish Reel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {adminReels.map((reel) => (
              <div
                key={reel.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      {reel.category}
                    </span>
                    <span className="text-[10px] font-mono tabular-nums text-slate-400">
                      Order: {reel.order}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{reel.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{reel.description}</p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href={reel.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View Source
                  </a>
                  <button
                    onClick={() => handleDeleteReel(reel.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    title="Delete Reel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: WEBINARS & ANNOUNCEMENTS */}
      {activeTab === 'webinars' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Schedule New Webinar</h3>
            <form onSubmit={handleAddWebinar} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={newWebinarTitle}
                    onChange={(e) => setNewWebinarTitle(e.target.value)}
                    placeholder="Weekly Masterclass..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newWebinarDate}
                    onChange={(e) => setNewWebinarDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Meeting Join URL
                </label>
                <input
                  type="url"
                  required
                  value={newWebinarUrl}
                  onChange={(e) => setNewWebinarUrl(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newWebinarDesc}
                  onChange={(e) => setNewWebinarDesc(e.target.value)}
                  placeholder="Topics covered..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl resize-none"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
              >
                Schedule Webinar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 8: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="max-w-xl p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Application Pricing & Payments</h2>
          {settingsNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              {settingsNotice}
            </div>
          )}
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pro Monthly (₹ INR)
                </label>
                <input
                  type="number"
                  required
                  value={proMonthly}
                  onChange={(e) => setProMonthly(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pro Annual (₹ INR)
                </label>
                <input
                  type="number"
                  required
                  value={proYearly}
                  onChange={(e) => setProYearly(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Manual Payment UPI / Banking Instructions
              </label>
              <textarea
                rows={4}
                required
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl resize-none"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              Save Application Settings
            </button>
          </form>
        </div>
      )}

      {/* TAB 9: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Administrative Audit Trail</h2>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Admin</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Entity</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{log.actorEmail}</td>
                      <td className="px-4 py-3 font-mono text-[11px] font-semibold text-blue-600">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{log.targetEntity}</td>
                      <td className="px-4 py-3 text-slate-700 max-w-sm truncate">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
