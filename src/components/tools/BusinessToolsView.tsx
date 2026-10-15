import React, { useState } from 'react';
import {
  Layers,
  PhoneCall,
  Link as LinkIcon,
  Radio,
  Sparkles,
  CreditCard,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LeadBankSection } from './LeadBankSection';
import { LeadCRMSection } from './LeadCRMSection';
import { LinksAndAnalyticsSection } from './LinksAndAnalyticsSection';
import { BroadcastSection } from './BroadcastSection';
import { UpgradeSection } from './UpgradeSection';

export const BusinessToolsView: React.FC = () => {
  const { isPro, userProfile } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<
    'lead_bank' | 'lead_crm' | 'my_links' | 'broadcasts' | 'pricing'
  >('lead_bank');

  const subTabs = [
    { id: 'lead_bank', label: 'Lead Bank', icon: Layers },
    { id: 'lead_crm', label: 'Lead CRM & Dialer', icon: PhoneCall },
    { id: 'my_links', label: 'My Links & Analytics', icon: LinkIcon },
    { id: 'broadcasts', label: 'Broadcasts', icon: Radio },
    { id: 'pricing', label: 'Plans & Pricing', icon: CreditCard },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#26282f] dark:border-[#26282f] light:border-slate-200 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#ff4545]">
              Affiliate Operations
            </span>
            {isPro && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#ff4545]/20 text-[#ff4545] border border-[#ff4545]/30 uppercase tracking-wider">
                Pro Activated
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white dark:text-white light:text-slate-900">
            Business Suite & Lead Hub
          </h1>
        </div>

        {/* Pro status banner if free */}
        {!isPro && (
          <button
            onClick={() => setActiveSubTab('pricing')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-tr from-[#ff3e3e] to-[#ff5c5c] text-white text-xs font-bold shadow-md neu-coral-glow hover:opacity-95 transition cursor-pointer self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4" />
            <span>Unlock Pro Features</span>
          </button>
        )}
      </div>

      {/* Subtab Segmented Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#26282f] dark:border-[#26282f] light:border-slate-200 no-scrollbar">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-tr from-[#ff3e3e] to-[#ff5c5c] text-white shadow-md neu-coral-glow'
                  : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 hover:bg-[#23252c] dark:hover:bg-[#23252c] light:hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Render active subtab */}
      <div className="mt-4">
        {activeSubTab === 'lead_bank' && <LeadBankSection />}
        {activeSubTab === 'lead_crm' && <LeadCRMSection />}
        {activeSubTab === 'my_links' && <LinksAndAnalyticsSection />}
        {activeSubTab === 'broadcasts' && <BroadcastSection />}
        {activeSubTab === 'pricing' && <UpgradeSection />}
      </div>
    </div>
  );
};
