import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { SECRET_REALMS, REALMS } from '../constants';
import { Mountain, Skull, Heart, Gem, Leaf, Zap, Shield, Map, Ghost, Flame, Search, Pickaxe, Hourglass, PlayCircle, StopCircle, PackageOpen, Sparkles, Droplets, Swords, Moon, Eye, HelpCircle, AlertTriangle } from 'lucide-react';
import { ElementType, ActiveBuff } from '../types';

const ExplorationPanel: React.FC = () => {
  const { state, dispatch, getCurrentRealm } = useGame();
  const realm = getCurrentRealm();
  const [activeTab, setActiveTab] = useState<'world' | 'dungeon'>('world');
  const [, setTick] = useState(0);

  // Timer cập nhật mỗi 0.5s để UI hồi chiêu mượt mà
  useEffect(() => {
      const t = setInterval(() => setTick(n => n + 1), 500); 
      return () => clearInterval(t);
  }, []);

  const hpPercent = state.maxHp > 0 ? (state.hp / state.maxHp) * 100 : 0;
  const isMortal = state.realmIndex === 0;

  // Kiểm tra thời gian bảo hộ còn lại
  const protectionLeft = Math.max(0, (state.protectionEndTime || 0) - Date.now());
  const protectionActive = protectionLeft > 0;

  // --- Hỗ trợ hiển thị icon Nguyên tố ---
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

  // --- Tính toán Chỉ số Chiến đấu hiển thị ---
  const weaponStats = state.equippedItems.weapon?.stats || {};
  const weaponElem = state.equippedItems.weapon?.element || 'none';
  const equipAtk = weaponStats.attack || 0;
  const equipStr = weaponStats.strength || 0;
  const equipSpirit = weaponStats.spirit || 0;

  const totalAttack = 5 + equipAtk + equipStr + equipSpirit + (state.statBonuses?.attack || 0); 
  let totalDefense = (state.statBonuses?.defense || 0);
  if (state.cultivationPath === 'righteous') totalDefense += 5;
  if (state.cultivationPath === 'righteous') totalDefense = Math.floor(totalDefense * 1.3);
  totalDefense += (state.equippedItems.armor?.stats?.defense || 0);

  // Kiểm tra chênh lệch cấp độ
  const activeDungeon = state.activeDungeonId ? SECRET_REALMS.find(d => d.id === state.activeDungeonId) : null;
  const currentGap = activeDungeon ? Math.max(0, activeDungeon.reqRealmIndex - state.realmIndex) : 0;

  // --- Lấy danh sách Skill từ trang bị ---
  const equippedSkills = Object.values(state.equippedItems)
    .filter(item => item && item.activeSkill)
    .map(item => item!.activeSkill!);

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
                             {currentGap > 0 && (
                                 <span className={`font-bold px-1 rounded flex items-center gap-1 ${currentGap > 3 ? 'text-red-500 bg-red-900/30' : 'text-orange-400 bg-orange-900/30'}`}>
                                     <AlertTriangle size={10} /> 
                                     {currentGap > 3 ? `NGUY HIỂM TỬ VONG (+${currentGap} Cấp)` : `Vượt cấp (+${currentGap})`}
                                 </span>
                             )}
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
                    <span className="text-[10px] text-yellow-400 flex items-center gap-1 mt-1 border border-yellow-500/30 px-2 py-0.5 rounded bg-yellow-500/10">
                        <Shield size={10} /> Hộ Mệnh ({Math.ceil(protectionLeft/1000)}s)
                    </span>
                )}
            </div>
        </div>
      )
  }

  return (
    <div className="p-4 md:p-8 h-full flex flex-col space-y-6">
      {/* Thanh Trạng Thái (Status Bar) */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden flex-shrink-0">
        {/* Hiệu ứng nền khi có bảo hộ */}
        {protectionActive && <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none animate-pulse"></div>}
        
        {renderStatus()}

        {/* Thanh Máu (HP Bar) */}
        <div className="w-full bg-slate-900 rounded-full h-3 mb-2 mt-2 relative overflow-hidden border border-slate-700">
            <div 
                className="bg-red-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${hpPercent}%` }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md">
                {Math.ceil(state.hp)} / {Math.ceil(state.maxHp)} HP
            </div>
        </div>

        {/* Chỉ số Mini */}
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
        
        {/* Buffs đang hoạt động */}
        {state.activeBuffs && state.activeBuffs.length > 0 && (
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                {state.activeBuffs.map((buff, idx) => (
                    <div key={`${buff.id}-${idx}`} className="text-[9px] bg-green-900/50 text-green-300 px-2 py-0.5 rounded border border-green-700 flex items-center whitespace-nowrap">
                        {buff.name} (+{buff.value})
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Khu vực Hành động (Main Action Area) */}
      {state.isExploring ? (
           <div className="flex flex-col flex-1 gap-4">
                {/* THANH KỸ NĂNG (SKILL BAR) */}
                <div className="grid grid-cols-3 gap-2">
                    {equippedSkills.length > 0 ? equippedSkills.map(skill => {
                        const now = Date.now();
                        const readyAt = state.skillCooldowns[skill.id] || 0;
                        const remaining = Math.max(0, readyAt - now);
                        const isReady = remaining === 0;
                        const duration = skill.cooldown;
                        const progress = isReady ? 100 : 100 - (remaining / duration * 100);

                        return (
                            <button
                                key={skill.id}
                                onClick={() => dispatch({ type: 'ACTIVATE_SKILL', payload: skill.id })}
                                disabled={!isReady}
                                className={`relative h-12 rounded-lg border flex items-center justify-center overflow-hidden transition-all
                                    ${isReady 
                                        ? 'bg-slate-700 border-indigo-500 text-white shadow-lg hover:bg-slate-600 active:scale-95' 
                                        : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'}`}
                            >
                                {/* Cooldown Overlay */}
                                {!isReady && (
                                    <div 
                                        className="absolute bottom-0 left-0 w-full bg-indigo-500/20 transition-all duration-200"
                                        style={{ height: `${progress}%` }}
                                    ></div>
                                )}
                                
                                <div className="z-10 flex flex-col items-center leading-none">
                                    <span className="text-[10px] font-bold">{skill.name}</span>
                                    {!isReady && <span className="text-[9px] font-mono mt-0.5">{(remaining/1000).toFixed(1)}s</span>}
                                </div>
                            </button>
                        )
                    }) : (
                        <div className="col-span-3 text-center text-[10px] text-slate-600 italic border border-slate-700/50 rounded-lg p-3 bg-black/20">
                            Chưa trang bị Pháp Bảo kích hoạt (Trúc Cơ trở lên)
                        </div>
                    )}
                </div>

                <div className="flex-1 flex flex-col justify-center items-center">
                    <button 
                        onClick={() => dispatch({ type: 'STOP_EXPLORATION' })}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 px-8 py-3 rounded-lg font-bold transition-all w-full max-w-sm hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                    >
                        Thu Về Động Phủ
                    </button>
                    <p className="text-xs text-slate-500 mt-2 italic text-center px-4">
                        "Biết người biết ta, trăm trận trăm thắng. Thấy khó thì lui."
                    </p>
                </div>
           </div>
      ) : (
          <div className="flex-1 flex flex-col min-h-0">
             {/* Tabs Chuyển đổi Thế Giới / Bí Cảnh */}
             <div className="flex space-x-4 mb-4 border-b border-slate-700 pb-2">
                <button 
                    onClick={() => setActiveTab('world')}
                    className={`flex items-center space-x-2 pb-2 px-2 transition-colors ${activeTab === 'world' ? 'text-jade-400 border-b-2 border-jade-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <Map size={18} /> <span>Thế Giới</span>
                </button>
                <button 
                    onClick={() => setActiveTab('dungeon')}
                    className={`flex items-center space-x-2 pb-2 px-2 transition-colors ${activeTab === 'dungeon' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <Ghost size={18} /> <span>Bí Cảnh</span>
                </button>
             </div>

             <div className="flex-1 overflow-y-auto pr-2">
                 {/* --- TAB THẾ GIỚI --- */}
                 {activeTab === 'world' && (
                     <div className="space-y-4">
                         <h3 className="font-bold text-slate-300 mb-2 text-center text-sm uppercase tracking-widest">Khu Vực An Toàn</h3>
                         
                         {/* Hành động: Du Ngoạn */}
                         <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 hover:border-indigo-500 transition-all flex flex-col md:flex-row items-center gap-4 group cursor-pointer shadow-md"
                              onClick={() => !isMortal && state.hp >= state.maxHp * 0.2 && dispatch({ type: 'START_EXPLORATION', payload: 'adventure' })}
                         >
                            <div className="bg-indigo-900/50 p-3 rounded-full group-hover:bg-indigo-900 transition-colors border border-indigo-500/30">
                                <Search size={24} className="text-indigo-400"/>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h4 className="font-bold text-indigo-300 group-hover:text-indigo-200">Tìm Kiếm Cơ Duyên</h4>
                                <p className="text-xs text-slate-400 mt-1">Du ngoạn cửu giới, tiêu diệt yêu thú trên đường, tìm kiếm kỳ ngộ và nhặt vật phẩm rơi rớt.</p>
                            </div>
                            <button disabled={isMortal || state.hp < state.maxHp * 0.2} className="px-6 py-2 bg-slate-700 group-hover:bg-indigo-600 rounded text-sm font-bold text-white transition-colors">
                                Xuất Phát
                            </button>
                         </div>

                        {isMortal && <p className="text-center text-xs text-red-400 mt-2 bg-red-900/10 p-2 rounded border border-red-900/30">Cần đạt cảnh giới Luyện Khí để xuống núi.</p>}
                        {state.hp < state.maxHp * 0.2 && <p className="text-center text-xs text-red-400 mt-2 bg-red-900/10 p-2 rounded border border-red-900/30">Đang trọng thương, cần hồi phục ít nhất 20% HP.</p>}
                     </div>
                 )}

                 {/* --- TAB BÍ CẢNH --- */}
                 {activeTab === 'dungeon' && (
                     <div className="space-y-3">
                         {SECRET_REALMS.map(dungeon => {
                             const levelGap = Math.max(0, dungeon.reqRealmIndex - state.realmIndex);
                             const isUnderLeveled = levelGap > 0;
                             const isDeadly = levelGap > 3;

                             return (
                                 <div key={dungeon.id} className={`bg-slate-800 p-4 rounded-lg border flex flex-col gap-3 transition-colors
                                     ${isUnderLeveled ? 'border-orange-900/50 bg-orange-900/5' : 'border-slate-700'}`}>
                                     
                                     <div className="flex justify-between items-start">
                                         <div className="flex items-center gap-2">
                                             <h3 className={`font-bold ${isUnderLeveled ? 'text-orange-300' : 'text-purple-300'}`}>{dungeon.name}</h3>
                                             
                                             {/* Badges */}
                                             {dungeon.element !== 'none' && (
                                                 <span className="text-[10px] bg-black/40 px-2 rounded border border-slate-700 flex items-center gap-1 text-slate-300">
                                                     {getElementIcon(dungeon.element)} {getElementName(dungeon.element)}
                                                 </span>
                                             )}
                                             
                                             {isUnderLeveled && (
                                                 <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1
                                                    ${isDeadly ? 'bg-red-600 text-white' : 'bg-orange-600 text-white'}`}>
                                                    {isDeadly ? <Skull size={8} /> : <AlertTriangle size={8} />} 
                                                    {isDeadly ? 'Tử Vong' : 'Nguy Hiểm'}
                                                 </span>
                                             )}
                                         </div>
                                         <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-700 whitespace-nowrap">{dungeon.riskLevel}</span>
                                     </div>
                                     
                                     <p className="text-xs text-slate-400">{dungeon.description}</p>
                                     
                                     <div className="bg-black/20 p-2 rounded text-[10px] space-y-1 border border-white/5">
                                         <div className="text-yellow-500 font-bold flex items-center gap-1"><Skull size={10}/> Boss: {dungeon.bossName}</div>
                                         <div className="text-slate-400 italic">Chiến thuật: {dungeon.tacticTip}</div>
                                         <div className="text-jade-400">Rơi: {dungeon.dropInfo}</div>
                                     </div>

                                     <div className="flex justify-between items-center mt-1 pt-2 border-t border-slate-700/50">
                                         <span className={`text-[10px] px-2 py-1 rounded border ${isUnderLeveled ? 'text-orange-400 border-orange-900/50 bg-orange-900/10' : 'text-spirit-gold border-yellow-900/50 bg-yellow-900/10'}`}>
                                             Yêu cầu: {REALMS[dungeon.reqRealmIndex].name}
                                         </span>
                                         
                                         <button 
                                            onClick={() => dispatch({ type: 'START_DUNGEON', payload: dungeon.id })}
                                            disabled={state.hp < state.maxHp * 0.2}
                                            className={`px-4 py-1.5 rounded text-xs font-bold whitespace-nowrap transition-all shadow-md flex items-center gap-1
                                                ${state.hp < state.maxHp * 0.2
                                                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                                                    : isDeadly 
                                                        ? 'bg-red-800 hover:bg-red-700 text-white border border-red-500 animate-pulse'
                                                        : isUnderLeveled 
                                                            ? 'bg-orange-700 hover:bg-orange-600 text-white border border-orange-500'
                                                            : 'bg-purple-700 hover:bg-purple-600 text-white'}`}
                                            title={isDeadly ? 'Cần Hộ Mệnh Đan nếu không sẽ chết ngay lập tức!' : ''}
                                         >
                                             {isDeadly ? <Skull size={12}/> : null}
                                             {isUnderLeveled ? 'Vượt Cấp' : 'Khiêu Chiến'}
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
    </div>
  );
};

export default ExplorationPanel;