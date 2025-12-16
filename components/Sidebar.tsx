import React from 'react';
import { Sparkles, Mountain, Backpack, Swords, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'cultivation', label: 'Tu Luyện', icon: Sparkles },
    { id: 'inventory', label: 'Túi Đồ', icon: Backpack },
    { id: 'exploration', label: 'Du Ngoạn', icon: Mountain },
    { id: 'sect', label: 'Tông Môn', icon: Swords }, 
    { id: 'settings', label: 'Thiết Lập', icon: Settings },
  ];

  return (
    <aside className="fixed bottom-0 left-0 w-full md:w-64 md:relative md:h-screen bg-ink-900 border-t md:border-t-0 md:border-r border-slate-700 z-50 flex md:flex-col items-center md:items-stretch overflow-x-auto md:overflow-visible p-2 md:p-4 gap-2 md:gap-0">
        <div className="hidden md:block mb-8 text-center">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-jade-500 to-spirit-gold font-serif">
                Cửu Giới<br/>Bất Hủ
            </h1>
            <p className="text-xs text-slate-400 mt-2 italic">Đạo Khả Đạo, Phi Thường Đạo</p>
        </div>
        
        {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex flex-col md:flex-row items-center justify-center md:justify-start md:space-x-3 p-2 md:px-4 md:py-3 rounded-lg transition-all duration-200 min-w-[60px] md:min-w-0 flex-1 md:flex-none
                        ${isActive 
                            ? 'bg-slate-800 text-jade-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                >
                    <Icon className={`w-5 h-5 md:w-6 md:h-6 ${isActive ? 'animate-pulse' : ''}`} />
                    <span className="text-[10px] md:text-sm font-medium mt-1 md:mt-0 whitespace-nowrap">{item.label}</span>
                </button>
            );
        })}
    </aside>
  );
};

export default Sidebar;