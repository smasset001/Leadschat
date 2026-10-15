import React, { useState, useEffect } from 'react';
import { Check, Sparkles, Shield, ArrowRight, Zap, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getApplicationSettings } from '../../services/adminService';
import { ApplicationSettings } from '../../types';

export const UpgradeSection: React.FC = () => {
  const { isPro, userProfile } = useAuth();
  const [settings, setSettings] = useState<ApplicationSettings | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    getApplicationSettings().then((s) => setSettings(s || null));
  }, []);

  const monthlyPrice = settings?.proMonthlyINR || 99;
  const yearlyPrice = settings?.proYearlyINR || 999;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#ff4545]/20 text-[#ff4545] border border-[#ff4545]/30 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Professional Affiliate Suite</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white light:text-slate-900">
          Supercharge Your Sales & Lead Conversions
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 light:text-slate-500">
          Unlock the Lead Bank allocation pool, automated campaign tracking links, and CRM follow-up management.
        </p>

        {/* Billing cycle tabs */}
        <div className="inline-flex items-center gap-1 p-1 bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-slate-100 rounded-2xl mt-4 border border-white/5 light:border-slate-200">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-gradient-to-tr from-[#ff3e3e] to-[#ff5c5c] text-white shadow-xs neu-coral-glow'
                : 'text-slate-400 light:text-slate-600 hover:text-white'
            }`}
          >
            Monthly Cadence
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
              billingCycle === 'yearly'
                ? 'bg-gradient-to-tr from-[#ff3e3e] to-[#ff5c5c] text-white shadow-xs neu-coral-glow'
                : 'text-slate-400 light:text-slate-600 hover:text-white'
            }`}
          >
            Annual (Save 16%)
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between max-w-lg mx-auto">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="font-bold text-amber-400 hover:text-white ml-2">
            &times;
          </button>
        </div>
      )}

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Free Plan */}
        <div className="p-6 rounded-3xl bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white border border-[#26282f] dark:border-[#26282f] light:border-slate-200 shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 light:text-slate-500">
                Community Free
              </span>
              <div className="text-3xl font-extrabold text-white light:text-slate-900 font-mono tabular-nums mt-1">
                ₹0 <span className="text-xs font-medium text-slate-400">/ forever</span>
              </div>
              <p className="text-xs text-slate-400 light:text-slate-500 mt-1">
                Basic personal messaging and community webinar viewing.
              </p>
            </div>

            <div className="pt-4 border-t border-white/5 light:border-slate-100 space-y-2.5 text-xs text-slate-300 light:text-slate-700">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 light:text-emerald-600 shrink-0" />
                <span>One-to-one business messaging</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 light:text-emerald-600 shrink-0" />
                <span>Authorized group chats</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 light:text-emerald-600 shrink-0" />
                <span>Watch administrator-curated Reels</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 light:text-emerald-600 shrink-0" />
                <span>Attend live webinar masterclasses</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <span className="w-4 h-4 text-center">&times;</span>
                <span className="line-through">Lead Bank purchasing access</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <span className="w-4 h-4 text-center">&times;</span>
                <span className="line-through">Lead CRM dialer & follow-up tools</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <span className="w-4 h-4 text-center">&times;</span>
                <span className="line-through">Campaign link attribution analytics</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 light:border-slate-100">
            <div className="w-full py-2.5 text-center text-xs font-semibold text-slate-400 light:text-slate-600 bg-[#141518] dark:bg-[#141518] light:bg-slate-100 rounded-2xl">
              Current Included Plan
            </div>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="p-6 rounded-3xl bg-[#18191d] text-white border-2 border-[#ff4545] shadow-2xl neu-coral-glow flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-gradient-to-tr from-[#ff3e3e] to-[#ff5c5c] text-white text-[10px] font-black uppercase tracking-wider shadow-md">
            Most Popular
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#ff4545]">
                Pro Business Affiliate
              </span>
              <div className="text-3xl font-extrabold text-white font-mono tabular-nums mt-1">
                ₹{billingCycle === 'monthly' ? monthlyPrice : yearlyPrice}{' '}
                <span className="text-xs font-medium text-slate-400">
                  / {billingCycle === 'monthly' ? 'month' : 'year'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Complete customer acquisition suite with distributor lead allocations.
              </p>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-2.5 text-xs text-slate-200">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#ff4545] shrink-0" />
                <span className="font-semibold text-white">Full Lead Bank buying privilege</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#ff4545] shrink-0" />
                <span>Admin manual lead allocation delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#ff4545] shrink-0" />
                <span>Lead CRM with 1-tap dialer & remarks</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#ff4545] shrink-0" />
                <span>Custom campaign tracking links (FB, IG, YouTube)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#ff4545] shrink-0" />
                <span>Conversion analytics & source distribution</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#ff4545] shrink-0" />
                <span>Broadcasts to client conversation threads</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            {isPro ? (
              <div className="w-full py-2.5 text-center text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 rounded-2xl">
                Active Pro Subscription
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() =>
                    setNotice(
                      'Live payment gateway integration will be active soon! To request manual Pro activation, submit a payment reference in the Lead Bank or contact the administrator.'
                    )
                  }
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-tr from-[#ff3e3e] to-[#ff5c5c] text-white font-bold text-xs shadow-md neu-coral-glow hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Upgrade to Pro</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[10px] text-slate-400 text-center">
                  Manual admin verification active during launch phase.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
