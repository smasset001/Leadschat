import React, { useState, useEffect } from 'react';
import {
  Phone,
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  Search,
  MessageSquare,
  Edit3,
  UserCheck,
  AlertCircle,
  X,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LeadAssignment, LeadStatus } from '../../types';
import {
  getAffiliateLeadAssignments,
  updateLeadAssignmentStatus,
} from '../../services/leadService';

const STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; bg: string; text: string }
> = {
  new: { label: 'New Lead', bg: 'bg-blue-50', text: 'text-blue-700' },
  called: { label: 'Called', bg: 'bg-slate-100', text: 'text-slate-700' },
  not_reachable: { label: 'Not Reachable', bg: 'bg-amber-50', text: 'text-amber-700' },
  interested: { label: 'Interested', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  follow_up_required: { label: 'Follow-Up Due', bg: 'bg-purple-50', text: 'text-purple-700' },
  converted: { label: 'Converted Client', bg: 'bg-green-100', text: 'text-green-800' },
  not_interested: { label: 'Not Interested', bg: 'bg-rose-50', text: 'text-rose-700' },
  invalid_number: { label: 'Invalid Number', bg: 'bg-red-50', text: 'text-red-700' },
};

export const LeadCRMSection: React.FC = () => {
  const { currentUser } = useAuth();
  const [leads, setLeads] = useState<LeadAssignment[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit / Remarks modal state
  const [activeLead, setActiveLead] = useState<LeadAssignment | null>(null);
  const [editStatus, setEditStatus] = useState<LeadStatus>('new');
  const [editRemarks, setEditRemarks] = useState('');
  const [editFollowUpDate, setEditFollowUpDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadLeads() {
      if (!currentUser) return;
      try {
        const list = await getAffiliateLeadAssignments(currentUser.uid);
        setLeads(list || []);
      } catch (err) {
        console.error('Failed to load lead assignments:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLeads();
  }, [currentUser]);

  const handleOpenEdit = (lead: LeadAssignment) => {
    setActiveLead(lead);
    setEditStatus(lead.status);
    setEditRemarks(lead.remarks || '');
    setEditFollowUpDate(lead.nextFollowUpDate ? lead.nextFollowUpDate.split('T')[0] : '');
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead) return;

    setSaving(true);
    try {
      await updateLeadAssignmentStatus(activeLead.id, {
        status: editStatus,
        remarks: editRemarks.trim(),
        nextFollowUpDate: editFollowUpDate ? new Date(editFollowUpDate).toISOString() : undefined,
      });

      // Update local state
      setLeads((prev) =>
        prev.map((l) =>
          l.id === activeLead.id
            ? {
                ...l,
                status: editStatus,
                remarks: editRemarks.trim(),
                nextFollowUpDate: editFollowUpDate ? new Date(editFollowUpDate).toISOString() : undefined,
                lastContactedAt: new Date().toISOString(),
              }
            : l
        )
      );
      setActiveLead(null);
    } catch (err) {
      console.error('Failed to update lead:', err);
    } finally {
      setSaving(false);
    }
  };

  // Follow-up dashboard metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todayDueCount = leads.filter(
    (l) => l.nextFollowUpDate && l.nextFollowUpDate.startsWith(todayStr)
  ).length;
  const interestedCount = leads.filter((l) => l.status === 'interested').length;
  const convertedCount = leads.filter((l) => l.status === 'converted').length;
  const newLeadsCount = leads.filter((l) => l.status === 'new').length;

  const filteredLeads = leads.filter((lead) => {
    if (selectedStatus !== 'all' && lead.status !== selectedStatus) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      lead.name.toLowerCase().includes(q) ||
      lead.phone.includes(q) ||
      lead.remarks?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Follow-up Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white border border-[#26282f] dark:border-[#26282f] light:border-slate-200 shadow-md">
          <span className="text-[11px] font-semibold text-slate-400 light:text-slate-500 uppercase tracking-wider block mb-1">
            New Leads
          </span>
          <div className="text-2xl font-bold text-[#ff4545] font-mono tabular-nums">
            {newLeadsCount}
          </div>
          <span className="text-[10px] text-slate-500">Awaiting initial call</span>
        </div>

        <div className="p-4 rounded-3xl bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white border border-[#26282f] dark:border-[#26282f] light:border-slate-200 shadow-md">
          <span className="text-[11px] font-semibold text-slate-400 light:text-slate-500 uppercase tracking-wider block mb-1">
            Follow-Ups Today
          </span>
          <div className="text-2xl font-bold text-purple-400 light:text-purple-600 font-mono tabular-nums">
            {todayDueCount}
          </div>
          <span className="text-[10px] text-slate-500">Scheduled for today</span>
        </div>

        <div className="p-4 rounded-3xl bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white border border-[#26282f] dark:border-[#26282f] light:border-slate-200 shadow-md">
          <span className="text-[11px] font-semibold text-slate-400 light:text-slate-500 uppercase tracking-wider block mb-1">
            Interested
          </span>
          <div className="text-2xl font-bold text-emerald-400 light:text-emerald-600 font-mono tabular-nums">
            {interestedCount}
          </div>
          <span className="text-[10px] text-slate-500">Hot sales prospects</span>
        </div>

        <div className="p-4 rounded-3xl bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white border border-[#26282f] dark:border-[#26282f] light:border-slate-200 shadow-md">
          <span className="text-[11px] font-semibold text-slate-400 light:text-slate-500 uppercase tracking-wider block mb-1">
            Converted
          </span>
          <div className="text-2xl font-bold text-white light:text-slate-900 font-mono tabular-nums">
            {convertedCount}
          </div>
          <span className="text-[10px] text-slate-500">Closed business deals</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white border border-[#26282f] dark:border-[#26282f] light:border-slate-200 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads by name, phone, or remarks..."
              className="w-full pl-10 pr-3.5 py-2 text-xs bg-[#141518] dark:bg-[#141518] light:bg-slate-50 text-white light:text-slate-900 border border-white/10 light:border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#ff4545]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs text-slate-300 light:text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs bg-[#141518] dark:bg-[#141518] light:bg-slate-50 text-white light:text-slate-900 border border-white/10 light:border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#ff4545] cursor-pointer"
            >
              <option value="all">All Statuses ({leads.length})</option>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table / Cards */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading your leads...</div>
      ) : filteredLeads.length === 0 ? (
        <div className="p-10 rounded-3xl bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white border border-[#26282f] dark:border-[#26282f] light:border-slate-200 text-center text-slate-400">
          <UserCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-white light:text-slate-700">No leads found in this view</h4>
          <p className="text-xs text-slate-400 light:text-slate-500 max-w-sm mx-auto mt-1">
            Purchase leads in the Lead Bank tab to receive administrator distribution directly into your CRM.
          </p>
        </div>
      ) : (
        <div className="bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white rounded-3xl border border-[#26282f] dark:border-[#26282f] light:border-slate-200 overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141518] dark:bg-[#141518] light:bg-slate-50 border-b border-[#26282f] dark:border-[#26282f] light:border-slate-200 text-slate-400 light:text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Lead Contact</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned</th>
                  <th className="px-4 py-3">Next Follow-Up</th>
                  <th className="px-4 py-3">Remarks</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 light:divide-slate-100">
                {filteredLeads.map((lead) => {
                  const statusInfo = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
                  return (
                    <tr key={lead.id} className="hover:bg-white/5 light:hover:bg-slate-50 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white light:text-slate-900 text-sm leading-tight">
                          {lead.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <a
                            href={`tel:${lead.phone}`}
                            className="inline-flex items-center gap-1 font-mono tabular-nums text-[#ff4545] light:text-blue-600 font-medium"
                            title="Click to dial lead"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{lead.phone}</span>
                          </a>
                          {lead.email && (
                            <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                              {lead.email}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusInfo.bg} ${statusInfo.text}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono tabular-nums text-slate-400 light:text-slate-500">
                        {new Date(lead.assignedAt).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3.5">
                        {lead.nextFollowUpDate ? (
                          <div className="flex items-center gap-1 text-purple-400 light:text-purple-700 font-medium font-mono tabular-nums">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(lead.nextFollowUpDate).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">Not set</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-slate-300 light:text-slate-600 max-w-xs truncate">
                        {lead.remarks || <span className="text-slate-500">No remarks yet</span>}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <a
                            href={`tel:${lead.phone}`}
                            className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 light:text-emerald-700 light:bg-emerald-50 transition cursor-pointer"
                            title="Call Lead"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleOpenEdit(lead)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 light:text-slate-700 light:bg-slate-100 transition cursor-pointer"
                            title="Update Status & Remarks"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
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

      {/* Edit Lead Status & Remarks Modal */}
      {activeLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white p-6 shadow-2xl border border-[#26282f] dark:border-[#26282f] light:border-slate-200 text-white light:text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 light:border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-white light:text-slate-900">Update Lead Outcome</h3>
                <p className="text-xs text-slate-400 light:text-slate-500">{activeLead.name} &bull; {activeLead.phone}</p>
              </div>
              <button
                onClick={() => setActiveLead(null)}
                className="p-1.5 text-slate-400 hover:text-white light:hover:text-slate-600 rounded-lg hover:bg-white/10 light:hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1">
                  Lead Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as LeadStatus)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#141518] dark:bg-[#141518] light:bg-slate-50 text-white light:text-slate-900 border border-white/10 light:border-slate-300 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#ff4545]"
                >
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key} className="bg-[#1c1d22] light:bg-white text-white light:text-slate-900">
                      {cfg.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1">
                  Next Follow-Up Date (Optional)
                </label>
                <input
                  type="date"
                  value={editFollowUpDate}
                  onChange={(e) => setEditFollowUpDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#141518] dark:bg-[#141518] light:bg-slate-50 text-white light:text-slate-900 border border-white/10 light:border-slate-300 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#ff4545]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1">
                  Call Remarks & Customer Objections
                </label>
                <textarea
                  rows={3}
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="e.g. Discussed pricing; interested in webinar attendance this Friday."
                  className="w-full px-3.5 py-2.5 text-sm bg-[#141518] dark:bg-[#141518] light:bg-slate-50 text-white light:text-slate-900 border border-white/10 light:border-slate-300 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#ff4545] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveLead(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white light:text-slate-600 light:hover:text-slate-900 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-tr from-[#ff3e3e] to-[#ff5c5c] rounded-2xl shadow-md neu-coral-glow hover:opacity-95 transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Remarks'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
