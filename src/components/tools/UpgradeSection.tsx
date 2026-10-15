import React, { useState, useEffect } from 'react';
import { Check, Sparkles, Shield, ArrowRight, Zap, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getApplicationSettings } from '../../services/adminService';
import { ApplicationSettings } from '../../types';

export const UpgradeSection: React.FC = () => {
  const { isPro, userProfile } = useAuth();
  const [settings, setSettings] = useState<ApplicationSettings | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    getApplicationSettings().then((s) => setSettings(s || null));
  }, []);

  const monthlyPrice = settings?.proMonthlyINR || 99;
  const yearlyPrice = settings?.proYearlyINR || 999;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Professional Affiliate Suite</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Supercharge Your Sales & Lead Conversions
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Unlock the Lead Bank allocation pool, automated campaign tracking links, and CRM follow-up management.
        </p>

        {/* Billing cycle tabs */}
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl mt-4">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Monthly Cadence
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              billingCycle === 'yearly' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Annual (Save 16%)
          </button>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Free Plan */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Community Free
              </span>
              <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums mt-1">
                ₹0 <span className="text-xs font-medium text-slate-400">/ forever</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Basic personal messaging and community webinar viewing.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>One-to-one business messaging</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Authorized group chats</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Watch administrator-curated Reels</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Attend live webinar masterclasses</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="w-4 h-4 text-center">&times;</span>
                <span className="line-through">Lead Bank purchasing access</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="w-4 h-4 text-center">&times;</span>
                <span className="line-through">Lead CRM dialer & follow-up tools</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="w-4 h-4 text-center">&times;</span>
                <span className="line-through">Campaign link attribution analytics</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="w-full py-2.5 text-center text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl">
              Current Included Plan
            </div>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="p-6 rounded-2xl bg-slate-900 text-white border-2 border-blue-500 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider">
            Most Popular
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
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

            <div className="pt-4 border-t border-slate-800 space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="font-semibold text-white">Full Lead Bank buying privilege</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Admin manual lead allocation delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Lead CRM with 1-tap dialer & remarks</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Custom campaign tracking links (FB, IG, YouTube)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Conversion analytics & source distribution</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Broadcasts to client conversation threads</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            {isPro ? (
              <div className="w-full py-2.5 text-center text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 rounded-xl">
                Active Pro Subscription
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() =>
                    alert(
                      'Live payment gateway integration will be active soon! To request manual Pro activation, contact the platform administrator or submit a payment reference in the Lead Bank.'
                    )
                  }
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
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
