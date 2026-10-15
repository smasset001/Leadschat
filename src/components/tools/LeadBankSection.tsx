import React, { useState, useEffect } from 'react';
import {
  Layers,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  History,
  Info,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getLeadPackages,
  submitPurchaseRequest,
  getAffiliatePurchaseRequests,
  getAffiliateLedger,
} from '../../services/leadService';
import { getApplicationSettings } from '../../services/adminService';
import {
  LeadPackage,
  LeadPurchaseRequest,
  LeadLedgerEntry,
  ApplicationSettings,
} from '../../types';

export const LeadBankSection: React.FC = () => {
  const { currentUser, userProfile, userPrivate } = useAuth();
  const [packages, setPackages] = useState<LeadPackage[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<LeadPurchaseRequest[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LeadLedgerEntry[]>([]);
  const [settings, setSettings] = useState<ApplicationSettings | null>(null);

  const [selectedPackage, setSelectedPackage] = useState<LeadPackage | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const [pkgs, setts] = await Promise.all([
          getLeadPackages(),
          getApplicationSettings(),
        ]);
        setPackages(pkgs || []);
        setSettings(setts || null);

        if (currentUser) {
          const [reqs, ledg] = await Promise.all([
            getAffiliatePurchaseRequests(currentUser.uid),
            getAffiliateLedger(currentUser.uid),
          ]);
          setPurchaseRequests(reqs || []);
          setLedgerEntries(ledg || []);
        }
      } catch (err) {
        console.error('Failed to load lead bank data:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [currentUser]);

  const handleOpenPurchase = (pkg: LeadPackage) => {
    setSelectedPackage(pkg);
    setPaymentReference('');
    setPaymentNotes('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage || !currentUser) return;
    if (!paymentReference.trim()) {
      setErrorMsg('Transaction reference ID / UTR is required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await submitPurchaseRequest({
        affiliateId: currentUser.uid,
        affiliateName: userProfile?.displayName || 'Affiliate',
        affiliateEmail: currentUser.email || '',
        packageId: selectedPackage.id,
        leadsCount: selectedPackage.leadsCount,
        amountINR: selectedPackage.priceINR,
        paymentMethod: 'UPI / Manual Transfer',
        paymentReference: paymentReference.trim(),
        notes: paymentNotes.trim(),
      });

      setSuccessMsg('Purchase request submitted successfully! Awaiting administrator verification.');
      setSelectedPackage(null);

      // Refresh list
      const updatedReqs = await getAffiliatePurchaseRequests(currentUser.uid);
      setPurchaseRequests(updatedReqs || []);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const approvedTotal = userPrivate?.approvedEntitlement || 0;
  const remainingBalance = userPrivate?.leadBalance || 0;
  const leadsDelivered = userPrivate?.leadsDelivered || 0;

  return (
    <div className="space-y-8">
      {/* Overview Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white border border-[#26282f] dark:border-[#26282f] light:border-slate-200 shadow-md">
          <span className="text-xs font-semibold text-slate-400 light:text-slate-500 uppercase tracking-wider block mb-1">
            Available Lead Credits
          </span>
          <div className="text-3xl font-extrabold text-[#ff4545] font-mono tabular-nums">
            {remainingBalance}
          </div>
          <p className="text-[11px] text-slate-400 light:text-slate-500 mt-1">
            Unallocated credits ready for administrator distribution
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white border border-[#26282f] dark:border-[#26282f] light:border-slate-200 shadow-md">
          <span className="text-xs font-semibold text-slate-400 light:text-slate-500 uppercase tracking-wider block mb-1">
            Total Leads Delivered
          </span>
          <div className="text-3xl font-extrabold text-white light:text-slate-900 font-mono tabular-nums">
            {leadsDelivered}
          </div>
          <p className="text-[11px] text-slate-400 light:text-slate-500 mt-1">
            Assigned leads currently active in your Lead CRM
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white border border-[#26282f] dark:border-[#26282f] light:border-slate-200 shadow-md">
          <span className="text-xs font-semibold text-slate-400 light:text-slate-500 uppercase tracking-wider block mb-1">
            Approved Entitlement
          </span>
          <div className="text-3xl font-extrabold text-slate-300 light:text-slate-700 font-mono tabular-nums">
            {approvedTotal}
          </div>
          <p className="text-[11px] text-slate-400 light:text-slate-500 mt-1">
            Total verified credits credited across all purchases
          </p>
        </div>
      </div>

      {/* Success notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 light:bg-emerald-50 light:border-emerald-200 light:text-emerald-800 text-xs flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 light:text-emerald-700 font-bold ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Available Lead Packages */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-white light:text-slate-900">Purchase Leads via Lead Bank</h3>
          <p className="text-xs text-slate-400 light:text-slate-500">
            Select a verified lead package, transfer payment manually, and receive distributor allocations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {packages.map((pkg) => {
            const unitPrice = (pkg.priceINR / pkg.leadsCount).toFixed(1);
            return (
              <div
                key={pkg.id}
                className="p-5 rounded-3xl bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white border border-[#26282f] dark:border-[#26282f] light:border-slate-200 hover:border-[#ff4545]/60 transition shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#ff4545]">
                      {pkg.name}
                    </span>
                    <span className="text-[11px] text-slate-400 light:text-slate-500 font-mono tabular-nums">
                      ₹{unitPrice}/lead
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white light:text-slate-900 font-mono tabular-nums mb-1">
                    {pkg.leadsCount} Leads
                  </div>
                  <div className="text-lg font-bold text-slate-300 light:text-slate-700 font-mono tabular-nums mb-3">
                    ₹{pkg.priceINR.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-400 light:text-slate-500 leading-relaxed mb-4">
                    {pkg.description}
                  </p>
                </div>

                <button
                  onClick={() => handleOpenPurchase(pkg)}
                  className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-tr from-[#ff3e3e] to-[#ff5c5c] text-white text-xs font-bold shadow-md neu-coral-glow hover:opacity-95 transition cursor-pointer"
                >
                  Buy Package
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Purchase Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white p-6 shadow-2xl border border-[#26282f] dark:border-[#26282f] light:border-slate-200 text-white light:text-slate-900">
            <h3 className="text-lg font-bold text-white light:text-slate-900 mb-1">
              Order {selectedPackage.leadsCount} Leads &bull; ₹{selectedPackage.priceINR}
            </h3>
            <p className="text-xs text-slate-400 light:text-slate-500 mb-4">
              Complete manual payment transfer and enter the transaction reference number below for administrative verification.
            </p>

            {/* Configured Payment Instructions */}
            <div className="p-4 rounded-2xl bg-[#141518] dark:bg-[#141518] light:bg-blue-50 border border-white/10 light:border-blue-200 text-slate-200 light:text-blue-950 text-xs mb-4 space-y-2">
              <div className="font-semibold flex items-center gap-1.5 text-[#ff4545] light:text-blue-900">
                <CreditCard className="w-4 h-4" />
                <span>Manual Payment Details</span>
              </div>
              <p className="leading-relaxed">
                {settings?.manualPaymentInstructions ||
                  'Transfer via UPI to: leadschat@upi. Ensure your registered email is mentioned in the payment remarks.'}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 light:bg-red-50 light:border-red-200 light:text-red-700 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitPurchase} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1">
                  Payment Reference / UTR Number *
                </label>
                <input
                  type="text"
                  required
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. UPI Ref: 328491829482"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#141518] dark:bg-[#141518] light:bg-slate-50 text-white light:text-slate-900 border border-white/10 light:border-slate-300 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#ff4545]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1">
                  Notes or Bank Name (Optional)
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Paid via HDFC Google Pay"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#141518] dark:bg-[#141518] light:bg-slate-50 text-white light:text-slate-900 border border-white/10 light:border-slate-300 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#ff4545]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPackage(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white light:text-slate-600 light:hover:text-slate-900 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-tr from-[#ff3e3e] to-[#ff5c5c] rounded-2xl shadow-md neu-coral-glow hover:opacity-95 transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit for Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Requests History */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white light:text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-[#ff4545]" />
          <span>Purchase Requests & Payment Status</span>
        </h3>

        {purchaseRequests.length === 0 ? (
          <div className="p-6 rounded-3xl bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white border border-[#26282f] dark:border-[#26282f] light:border-slate-200 text-center text-xs text-slate-400">
            No purchase requests submitted yet.
          </div>
        ) : (
          <div className="bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white rounded-3xl border border-[#26282f] dark:border-[#26282f] light:border-slate-200 overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141518] dark:bg-[#141518] light:bg-slate-50 border-b border-[#26282f] dark:border-[#26282f] light:border-slate-200 text-slate-400 light:text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Leads</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Payment Ref</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 light:divide-slate-100">
                  {purchaseRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-white/5 light:hover:bg-slate-50 transition">
                      <td className="px-4 py-3 text-slate-400 light:text-slate-600 font-mono tabular-nums">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white light:text-slate-900 font-mono tabular-nums">
                        {req.leadsCount}
                      </td>
                      <td className="px-4 py-3 text-slate-300 light:text-slate-700 font-mono tabular-nums">
                        ₹{req.amountINR}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400 light:text-slate-600">
                        {req.paymentReference}
                      </td>
                      <td className="px-4 py-3">
                        {req.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 light:bg-emerald-100 light:text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Approved
                          </span>
                        )}
                        {req.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 light:bg-amber-100 light:text-amber-800">
                            <Clock className="w-3 h-3" />
                            Pending Review
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/20 text-red-300 light:bg-red-100 light:text-red-800">
                            <XCircle className="w-3 h-3" />
                            Rejected
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
      </div>

      {/* Ledger History */}
      {ledgerEntries.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-base font-bold text-white light:text-slate-900">Balance Transaction Ledger</h3>
          <div className="bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white rounded-3xl border border-[#26282f] dark:border-[#26282f] light:border-slate-200 overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141518] dark:bg-[#141518] light:bg-slate-50 border-b border-[#26282f] dark:border-[#26282f] light:border-slate-200 text-slate-400 light:text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Adjustment</th>
                    <th className="px-4 py-2.5">Balance After</th>
                    <th className="px-4 py-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 light:divide-slate-100">
                  {ledgerEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-2.5 font-mono tabular-nums text-slate-400 light:text-slate-500">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-200 light:text-slate-800">
                        {entry.type === 'credit_purchase' && 'Credit (Purchase)'}
                        {entry.type === 'debit_allocation' && 'Debit (Allocated)'}
                        {entry.type === 'manual_adjustment' && 'Adjustment'}
                      </td>
                      <td
                        className={`px-4 py-2.5 font-bold font-mono tabular-nums ${
                          entry.amount > 0 ? 'text-emerald-400 light:text-emerald-600' : 'text-slate-300 light:text-slate-700'
                        }`}
                      >
                        {entry.amount > 0 ? `+${entry.amount}` : entry.amount}
                      </td>
                      <td className="px-4 py-2.5 font-mono tabular-nums font-semibold text-white light:text-slate-900">
                        {entry.balanceAfter}
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 light:text-slate-500 truncate max-w-xs">
                        {entry.notes || '-'}
                      </td>
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
