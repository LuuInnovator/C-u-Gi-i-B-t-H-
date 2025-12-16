import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { SECRET_REALMS, REALMS } from '../constants';
import { Mountain, Skull, Heart, Gem, Leaf, Zap, Shield, Map, Ghost, Flame, Search, Pickaxe, Hourglass, PlayCircle, StopCircle, PackageOpen, Sparkles, Droplets, Swords, Moon, Eye, HelpCircle } from 'lucide-react';
import { ElementType } from '../types';

const ExplorationPanel: React.FC = () => {
  const { state, dispatch, getCurrentRealm } = useGame();
  const realm = getCurrentRealm();
  const [activeTab, setActiveTab] = useState<'world' | 'dungeon'>('world');
  const [, setTick] = useState(0);

  // Tick for protection timer
  useEffect(() => {
      const t = setInterval(() => setTick(n => n + 1), 1000);
      return () => clearInterval(t);
  }, []);

  const hpPercent = state.maxHp > 0 ? (state.hp / state.maxHp) * 100 : 0;
  const isMortal = state.realmIndex === 0;

  // Protection Check
  const protectionLeft = Math.max(0, (state.protectionEndTime || 0) - Date.now());
  const protectionActive = protectionLeft > 0;

  // --- Element Helper ---
  const getElementIcon = (el: ElementType) => {
      switch(el) {
          case 'metal': return <span title="Hệ Kim"><Swords size={12} className="text-gray-300" /></span>;
          case 'wood': return <span title="Hệ Mộc"><Leaf size={12} className="text-green-500" /></span>;
          case 'water': return <span title="Hệ Thủy"><Droplets size={12} className="text-blue-500" /></span>;
          case 'fire': return <span title="Hệ Hỏa"><Flame size={12} className="text-red-500" /></span>;
          case 'earth': return <span title="Hệ Thổ"><Mountain size={12} className="text-yellow-600" /></span>;
          case 'dark': return <span title="Hệ Ám"><Moon size={12} className="text-purple-900" /></span>;
          case 'illusion': return <span title="Hệ Huyễn"><Eye size={12} className="text-pink-500" /></span>;
          case 'chaos': return <span title="Hỗn Độn"><Sparkles size={12} className="text-white" /></span>;
          default: return null;
      }
  };

  const getElementName = (el: ElementType) => {
      switch(el) {
          case 'metal': return 'Kim';
          case 'wood': return 'Mộc';
          case 'water': return 'Thủy';
          case 'fire': return 'Hỏa';
          case 'earth': return 'Thổ';
          case 'dark': return 'Ám';
          case 'illusion': return 'Huyễn';
          case 'chaos': return 'Hỗn Độn';
          default: return '';
      }
  }

  // --- Combat Stats Display ---
  const weaponStats = state.equippedItems.weapon?.stats || {};
  const weaponElem = state.equippedItems.weapon?.element || 'none';
  const equipAtk = weaponStats.attack || 0;
  const equipStr = weaponStats.strength || 0;
  const equipSpirit = weaponStats.spirit || 0;

  // Simplified display (Actual calculation is complex in Reducer)
  const totalAttack = realm.attack + equipAtk + equipStr + equipSpirit;
  let totalDefense = realm.defense;
  if (state.cultivationPath === 'righteous') totalDefense = Math.floor(totalDefense * 1.3);
  totalDefense += (state.equippedItems.armor?.stats?.defense || 0);

  const activeDungeon = state.activeDungeonId ? SECRET_REALMS.find(d => d.id === state.activeDungeonId) : null;
  
  // Level Gap Warning
  const levelGap = activeDungeon ? Math.max(0, activeDungeon.reqRealmIndex - state.realmIndex) : 0;
  const isHighGap = levelGap > 0;

  const renderStatus = () => {
      let title = 'Du Ngoạn Cửu Giới';
      if (activeDungeon) title = `Bí Cảnh: ${activeDungeon.name}`;
      else if (state.explorationType === 'adventure') title = 'Tìm Kiếm Cơ Duyên';

      return (
          <div className="flex justify-between items-center mb-2">
            <div>
                <h2 className="font-bold text-lg text-slate-200 flex items-center gap-2">
                    {activeDungeon && activeDungeon.element !== 'none' && (
                        <span className="bg-slate-900 p-1 rounded-full border border-slate-600">
                             {getElementIcon(activeDungeon.element)}
                        </span>
                    )}
                    {title}
                </h2>
                {activeDungeon && (
                     <div className="flex flex-col gap-1 mt-1">
                         <div className="flex gap-2 text-[10px]">
                             {activeDungeon.element !== 'none' && <span className="text-slate-400">Quái Hệ: {getElementName(activeDungeon.element)}</span>}
                             {isHighGap && <span className="text-red-400 font-bold bg-red-900/30 px-1 rounded">⚠️ Chênh lệch {levelGap} cấp (Bị áp chế)</span>}
                         </div>
                         <div className="text-[10px] text-yellow-500 italic">Boss: {activeDungeon.bossName}</div>
                         <div className="text-[9px] text-slate-500">Mẹo: {activeDungeon.tacticTip}</div>
                     </div>
                )}
            </div>
            <div className="text-sm text-slate-400 flex flex-col items-end">
                {state.isExploring ? <span className="text-green-400 animate-pulse">● Đang hoạt động</span> : 
                 <span className="text-slate-500">● Đang nghỉ ngơi</span>}
                {protectionActive && (
                    <span className="text-[10px] text-yellow-400 flex items-center gap-1 mt-1">
                        <Shield size={10} /> Hộ Mệnh ({Math.ceil(protectionLeft/1000)}s)
                    </span>
                )}
            </div>
        </div>
      )
  }

  return (
    <div className="p-4 md:p-8 h-full flex flex-col space-y-6">
      {/* Status Bar */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden">
        {/* Protection Effect Visual */}
        {protectionActive && <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none"></div>}
        
        {renderStatus()}

        {/* HP Bar */}
        <div className="w-full bg-slate-900 rounded-full h-3 mb-2 mt-2 relative overflow-hidden">
            <div 
                className="bg-red-600 h-full transition-all duration-500"
                style={{ width: `${hpPercent}%` }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md">
                {Math.ceil(state.hp)} / {Math.ceil(state.maxHp)} HP
            </div>
        </div>

        {/* Combat Stats Mini Display */}
        <div className="flex flex-col gap-1 mb-3">
             <div className="flex justify-between items-end">
                <span className="flex items-center gap-1 text-xs text-slate-400" title="Tổng lực chiến ước tính">
                    <Zap size={14} className="text-spirit-gold"/> Chiến Lực: <span className="text-white font-bold text-sm">{totalAttack}</span>
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400" title="Phòng thủ vật lý">
                    <Shield size={14} className="text-blue-400"/> Thủ: <span className="text-white font-bold text-sm">{totalDefense}</span>
                </span>
             </div>
             
             {weaponElem !== 'none' && (
                 <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                     Vũ khí: {getElementIcon(weaponElem)} <span className="text-slate-300">Hệ {getElementName(weaponElem)}</span>
                 </div>
             )}
        </div>
        
        <div className="flex justify-between text-xs text-slate-400 border-t border-slate-700 pt-2">
             <span>Linh Thảo: <span className="text-jade-400">{state.resources.herbs}</span></span>
             <span>Linh Thạch: <span className="text-spirit-gold">{state.resources.spiritStones}</span></span>
             <span>K.Thạch: <span className="text-slate-300">{state.resources.ores}</span></span>
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
                     <div className="space-y-4">
                         <h3 className="font-bold text-slate-300 mb-2 text-center">Chọn Hành Động</h3>
                         
                         {/* Action 1: Adventure */}
                         <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 hover:border-indigo-500 transition-all flex flex-col md:flex-row items-center gap-4 group cursor-pointer"
                              onClick={() => !isMortal && state.hp >= state.maxHp * 0.2 && dispatch({ type: 'START_EXPLORATION', payload: 'adventure' })}
                         >
                            <div className="bg-indigo-900/50 p-3 rounded-full group-hover:bg-indigo-900 transition-colors">
                                <Search size={24} className="text-indigo-400"/>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h4 className="font-bold text-indigo-300">Tìm Kiếm Cơ Duyên</h4>
                                <p className="text-xs text-slate-400">Du ngoạn cửu giới, tiêu diệt yêu thú trên đường, tìm kiếm kỳ ngộ và nhặt vật phẩm.</p>
                            </div>
                            <button disabled={isMortal || state.hp < state.maxHp * 0.2} className="px-6 py-2 bg-slate-700 group-hover:bg-indigo-600 rounded text-sm font-bold text-white transition-colors">
                                Xuất Phát
                            </button>
                         </div>

                        {isMortal && <p className="text-center text-xs text-red-400 mt-2">Cần đạt cảnh giới Luyện Khí để xuống núi.</p>}
                        {state.hp < state.maxHp * 0.2 && <p className="text-center text-xs text-red-400 mt-2">Đang trọng thương, cần hồi phục.</p>}
                     </div>
                 )}

                 {/* Dungeon Tab */}
                 {activeTab === 'dungeon' && (
                     <div className="space-y-3">
                         {SECRET_REALMS.map(dungeon => {
                             const isLocked = state.realmIndex < dungeon.reqRealmIndex;
                             return (
                                 <div key={dungeon.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col gap-3">
                                     <div className="flex justify-between items-start">
                                         <div className="flex items-center gap-2">
                                             <h3 className="font-bold text-purple-300">{dungeon.name}</h3>
                                             {isLocked && <span className="text-[10px] bg-slate-900 text-slate-500 px-2 rounded">Khóa</span>}
                                             {dungeon.element !== 'none' && (
                                                 <span className="text-[10px] bg-black/40 px-2 rounded border border-slate-700 flex items-center gap-1">
                                                     {getElementIcon(dungeon.element)} {getElementName(dungeon.element)}
                                                 </span>
                                             )}
                                         </div>
                                         <span className="text-[10px] text-red-400 bg-red-900/20 px-1 rounded border border-red-900/50 whitespace-nowrap">{dungeon.riskLevel}</span>
                                     </div>
                                     
                                     <p className="text-xs text-slate-400">{dungeon.description}</p>
                                     
                                     <div className="bg-black/20 p-2 rounded text-[10px] space-y-1 border border-white/5">
                                         <div className="text-yellow-500 font-bold flex items-center gap-1"><Skull size={10}/> Boss: {dungeon.bossName}</div>
                                         <div className="text-slate-400 italic">Chiến thuật: {dungeon.tacticTip}</div>
                                         <div className="text-jade-400">Rơi: {dungeon.dropInfo}</div>
                                     </div>

                                     <div className="flex justify-between items-center mt-1">
                                         <span className="text-[10px] text-spirit-gold bg-yellow-900/20 px-2 py-1 rounded border border-yellow-900/50">Yêu cầu: {REALMS[dungeon.reqRealmIndex].name}</span>
                                         <button 
                                            onClick={() => dispatch({ type: 'START_DUNGEON', payload: dungeon.id })}
                                            disabled={isLocked || state.hp < state.maxHp * 0.2}
                                            className={`px-4 py-1.5 rounded text-xs font-bold whitespace-nowrap
                                                ${isLocked 
                                                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                                                    : 'bg-purple-700 hover:bg-purple-600 text-white shadow-lg'}`}
                                         >
                                             {isLocked ? 'Chưa Đủ Tu Vi' : 'Khiêu Chiến'}
                                         </button>
                                     </div>
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