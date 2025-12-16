import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { SECRET_REALMS, REALMS } from '../constants';
import { Mountain, Skull, Heart, Gem, Leaf, Zap, Shield, Map, Ghost, Flame } from 'lucide-react';

const ExplorationPanel: React.FC = () => {
  const { state, dispatch, getCurrentRealm } = useGame();
  const realm = getCurrentRealm();
  const [activeTab, setActiveTab] = useState<'world' | 'dungeon'>('world');

  const hpPercent = (state.hp / state.maxHp) * 100;
  const isMortal = state.realmIndex === 0;

  const getButtonLabel = () => {
      if (isMortal) return "Cần Luyện Khí Tầng 1";
      if (state.hp < state.maxHp * 0.2) return "Cần Hồi Phục...";
      return "Xuất Sơn Du Ngoạn";
  };

  // Calculate Combat Stats
  const totalAttack = realm.attack + (state.equippedItems.weapon?.stats?.attack || 0);
  let totalDefense = realm.defense;
  if (state.cultivationPath === 'righteous') totalDefense = Math.floor(totalDefense * 1.3);
  totalDefense += (state.equippedItems.armor?.stats?.defense || 0);

  const activeDungeon = state.activeDungeonId ? SECRET_REALMS.find(d => d.id === state.activeDungeonId) : null;

  return (
    <div className="p-4 md:p-8 h-full flex flex-col space-y-6">
      {/* Status Bar */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
        <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-lg text-slate-200 flex items-center">
                <Mountain className="mr-2 text-indigo-400" /> 
                {activeDungeon ? `Bí Cảnh: ${activeDungeon.name}` : 'Du Ngoạn Cửu Giới'}
            </h2>
            <div className="text-sm text-slate-400">
                {state.isExploring ? <span className="text-green-400 animate-pulse">● Đang thám hiểm</span> : <span className="text-slate-500">● Đang nghỉ ngơi</span>}
            </div>
        </div>

        {/* HP Bar */}
        <div className="w-full bg-slate-900 rounded-full h-3 mb-2 relative overflow-hidden">
            <div 
                className="bg-red-600 h-full transition-all duration-500"
                style={{ width: `${hpPercent}%` }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md">
                {Math.ceil(state.hp)} / {Math.ceil(state.maxHp)} HP
            </div>
        </div>

        {/* Combat Stats Mini Display */}
        <div className="flex justify-center space-x-4 mb-3 text-xs text-slate-400">
             <span className="flex items-center gap-1"><Zap size={12} className="text-spirit-gold"/> Công: {totalAttack}</span>
             <span className="flex items-center gap-1"><Shield size={12} className="text-blue-400"/> Thủ: {totalDefense}</span>
        </div>
        
        <div className="flex justify-between text-xs text-slate-400 border-t border-slate-700 pt-2">
             <span>Linh Thảo: <span className="text-jade-400">{state.resources.herbs}</span></span>
             <span>Linh Thạch: <span className="text-spirit-gold">{state.resources.spiritStones}</span></span>
             <span>Khoáng: <span className="text-slate-300">{state.resources.ores}</span></span>
        </div>
      </div>

      {/* Main Action Area */}
      {state.isExploring ? (
           <div className="flex justify-center flex-col items-center">
                <button 
                    onClick={() => dispatch({ type: 'STOP_EXPLORATION' })}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 px-8 py-3 rounded-lg font-bold transition-all w-full max-w-sm"
                >
                    Thu Về Động Phủ
                </button>
                <p className="text-xs text-slate-500 mt-2 italic">Đang chiến đấu... HP tự hồi phục rất chậm (1%/s).</p>
           </div>
      ) : (
          <div className="flex-1 flex flex-col min-h-0">
             {/* Tabs */}
             <div className="flex space-x-4 mb-4 border-b border-slate-700 pb-2">
                <button 
                    onClick={() => setActiveTab('world')}
                    className={`flex items-center space-x-2 pb-2 px-2 ${activeTab === 'world' ? 'text-jade-400 border-b-2 border-jade-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <Map size={18} /> <span>Thế Giới</span>
                </button>
                <button 
                    onClick={() => setActiveTab('dungeon')}
                    className={`flex items-center space-x-2 pb-2 px-2 ${activeTab === 'dungeon' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <Ghost size={18} /> <span>Bí Cảnh</span>
                </button>
             </div>

             <div className="flex-1 overflow-y-auto pr-2">
                 {/* World Tab */}
                 {activeTab === 'world' && (
                     <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-center">
                         <h3 className="font-bold text-slate-200 mb-2">Thế Giới Hoang Dã</h3>
                         <p className="text-sm text-slate-400 mb-4">Du ngoạn khắp nơi, gặp gỡ kỳ ngộ, săn bắt yêu thú thông thường.</p>
                         <button 
                            onClick={() => dispatch({ type: 'START_EXPLORATION' })}
                            disabled={(state.hp < state.maxHp * 0.2) || isMortal}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-all w-full max-w-sm"
                        >
                            {getButtonLabel()}
                        </button>
                        {isMortal && <p className="text-xs text-red-400 mt-2">Cần Luyện Khí Kỳ.</p>}
                     </div>
                 )}

                 {/* Dungeon Tab */}
                 {activeTab === 'dungeon' && (
                     <div className="space-y-3">
                         {SECRET_REALMS.map(dungeon => {
                             const isLocked = state.realmIndex < dungeon.reqRealmIndex;
                             return (
                                 <div key={dungeon.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                     <div className="flex-1">
                                         <div className="flex items-center gap-2">
                                             <h3 className="font-bold text-purple-300">{dungeon.name}</h3>
                                             {isLocked && <span className="text-[10px] bg-slate-900 text-slate-500 px-2 rounded">Khóa</span>}
                                         </div>
                                         <p className="text-xs text-slate-400 mt-1">{dungeon.description}</p>
                                         <div className="flex flex-wrap gap-2 mt-2 text-[10px]">
                                             <span className="text-red-400 bg-red-900/20 px-1 rounded border border-red-900/50">Nguy Hiểm: {dungeon.riskLevel}</span>
                                             <span className="text-jade-400 bg-jade-900/20 px-1 rounded border border-jade-900/50">Drop: {dungeon.dropInfo}</span>
                                             <span className="text-spirit-gold bg-yellow-900/20 px-1 rounded border border-yellow-900/50">Yêu cầu: {REALMS[dungeon.reqRealmIndex].name}</span>
                                         </div>
                                     </div>
                                     <button 
                                        onClick={() => dispatch({ type: 'START_DUNGEON', payload: dungeon.id })}
                                        disabled={isLocked || state.hp < state.maxHp * 0.2}
                                        className={`px-4 py-2 rounded text-sm font-bold whitespace-nowrap
                                            ${isLocked 
                                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                                                : 'bg-purple-700 hover:bg-purple-600 text-white shadow-lg'}`}
                                     >
                                         {isLocked ? 'Chưa Đủ Tu Vi' : 'Tiến Vào'}
                                     </button>
                                 </div>
                             )
                         })}
                     </div>
                 )}
             </div>
          </div>
      )}

      {/* Log Feed */}
      <div className="h-1/3 bg-ink-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
        <div className="p-2 bg-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Nhật Ký Hành Trình
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm">
            {state.logs.length === 0 && (
                <div className="text-center text-slate-600 italic mt-10">Chưa có sự kiện nào...</div>
            )}
            {state.logs.map((log) => {
                let colorClass = 'text-slate-400';
                if (log.type === 'combat') colorClass = 'text-orange-400';
                if (log.type === 'success') colorClass = 'text-jade-400';
                if (log.type === 'danger') colorClass = 'text-red-400';
                if (log.type === 'warning') colorClass = 'text-yellow-400';

                return (
                    <div key={log.id} className="border-b border-slate-800/50 pb-1 last:border-0 animate-fadeIn">
                        <span className="text-slate-600 text-[10px] mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className={colorClass}>{log.message}</span>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default ExplorationPanel;