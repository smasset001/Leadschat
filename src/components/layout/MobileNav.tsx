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
    { id: 'webinars', label: 'Webinars', icon: Calendar },
    { id: 'tools', label: isPro ? 'Pro Tools' : 'Tools', icon: Briefcase },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 text-slate-400 py-1 px-2 safe-area-pb shadow-lg">
      <div className="grid grid-cols-5 gap-1 items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[11px] font-medium transition cursor-pointer min-h-[48px] ${
                isActive
                  ? 'text-blue-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-blue-400 stroke-[2.2]' : 'stroke-[1.8]'}`} />
              <span className="truncate max-w-[56px]">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
