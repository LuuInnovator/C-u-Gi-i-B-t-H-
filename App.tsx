import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import CultivationPanel from './components/CultivationPanel';
import InventoryPanel from './components/InventoryPanel';
import ExplorationPanel from './components/ExplorationPanel';
import { useGame } from './context/GameContext';
import { ScrollText, Info } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('cultivation');
  const { state } = useGame();

  const renderContent = () => {
    switch (activeTab) {
      case 'cultivation':
        return <CultivationPanel />;
      case 'inventory':
        return <InventoryPanel />;
      case 'exploration':
        return <ExplorationPanel />;
      case 'logs':
        return (
             <div className="p-8 h-full flex flex-col">
                <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center"><ScrollText className="mr-2"/> Toàn Bộ Nhật Ký</h2>
                <div className="flex-1 overflow-y-auto space-y-2 bg-ink-800 p-4 rounded-lg border border-slate-700 font-mono text-sm">
                    {state.logs.map((log) => (
                        <div key={log.id} className="border-b border-slate-700/50 pb-1">
                            <span className="text-slate-500 text-xs">[{new Date(log.timestamp).toLocaleTimeString()}]</span> 
                            <span className={log.type === 'combat' ? 'text-orange-300' : log.type === 'success' ? 'text-jade-400' : log.type === 'danger' ? 'text-red-400' : 'text-slate-300'}> {log.message}</span>
                        </div>
                    ))}
                </div>
             </div>
        );
      default:
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Info size={48} className="mb-4 opacity-50"/>
                <p>Tính năng này đang được phát triển bởi các vị Tiên Sư...</p>
                <button 
                    onClick={() => setActiveTab('cultivation')}
                    className="mt-4 text-jade-500 hover:underline"
                >
                    Quay lại Tu Luyện
                </button>
            </div>
        );
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-ink-900 text-slate-200 overflow-hidden font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Content Area with Thematic Background */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-gradient-to-br from-slate-900 via-ink-900 to-black">
        
        {/* Decorative ambient glowing orbs (Qi/Linh Khí effect) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-jade-700/10 blur-[120px] mix-blend-screen"></div>
            <div className="absolute top-[40%] -left-[10%] w-[400px] h-[400px] rounded-full bg-mystic-purple/10 blur-[100px] mix-blend-screen"></div>
            <div className="absolute -bottom-[20%] right-[20%] w-[500px] h-[500px] rounded-full bg-indigo-900/20 blur-[120px] mix-blend-screen"></div>
        </div>
        
        {/* Content Container */}
        <div className="relative z-10 flex-1 overflow-hidden">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;