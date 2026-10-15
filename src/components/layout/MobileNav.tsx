import React from 'react';
import { MessageSquare, Film, Calendar, Briefcase, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onSelectTab }) => {
  const { isPro } = useAuth();

  const tabs = [
    { id: 'chats', label: 'Chats', icon: MessageSquare },
    { id: 'reels', label: 'Reels', icon: Film },
    { id: 'webinars', label: 'Events', icon: Calendar },
    { id: 'tools', label: isPro ? 'Pro' : 'Tools', icon: Briefcase },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-3 left-4 right-4 z-40 pointer-events-none">
      <nav className="pointer-events-auto max-w-sm mx-auto px-3 py-2 rounded-3xl bg-[#1b1c21]/95 dark:bg-[#1b1c21]/95 light:bg-white/95 backdrop-blur-md border border-white/10 light:border-slate-300/80 shadow-2xl flex items-center justify-around neu-dark-flat light:neu-light-flat">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all cursor-pointer relative ${
                isActive
                  ? 'text-[#ff4545] font-bold scale-105'
                  : 'text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-[#25272e] dark:bg-[#25272e] light:bg-slate-100 neu-dark-btn-active light:neu-light-btn-active text-[#ff4545] shadow-inner'
                    : 'neu-dark-btn light:neu-light-btn'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'text-[#ff4545] fill-current/20 stroke-[2.2]' : 'stroke-[1.8]'
                  }`}
                />
              </div>
              <span className="text-[10px] mt-1 font-semibold tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
