import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import CultivationPanel from './components/CultivationPanel';
import InventoryPanel from './components/InventoryPanel';
import ExplorationPanel from './components/ExplorationPanel';
import SettingsPanel from './components/SettingsPanel';
import WelcomeModal from './components/WelcomeModal';
import { useGame } from './context/GameContext';
import { Info } from 'lucide-react';

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
      case 'settings':
        return <SettingsPanel />;
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
      {/* Show Welcome Screen if player name is default */}
      {state.playerName === 'Đạo Hữu Vô Danh' && <WelcomeModal />}

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Content Area with Thematic Background */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-gradient-to-br from-slate-900 via-ink-900 to-black pb-[80px] md:pb-0">
        
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