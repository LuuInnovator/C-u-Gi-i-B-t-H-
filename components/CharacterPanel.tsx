import React from 'react';
import { useGame } from '../context/GameContext';
import { Shield, Swords, Sparkles, X, Heart, Zap, User, Skull, Droplets, Flame, Mountain, Eye, Moon, Pill, Lock } from 'lucide-react';
import { EquipmentSlot, ElementType, ItemStats } from '../types';

const CharacterPanel: React.FC = () => {
  const { state, dispatch, getCurrentRealm } = useGame();
  const realm = getCurrentRealm();

  // Logic Mở khóa Pháp Bảo: Yêu cầu Kim Đan (Realm Index >= 9)
  const isGoldenCore = state.realmIndex >= 9;

  // --- Helpers for Stats Calculation ---
  const weaponStats = state.equippedItems.weapon?.stats || {};
  const armorStats = state.equippedItems.armor?.stats || {};
  const artifactStats = state.equippedItems.artifact?.stats || {};
  const pillStats = state.statBonuses || { attack: 0, defense: 0, hp: 0 };

  // Sum stats from all equipment
  const getStatSum = (key: keyof Omit<ItemStats, 'effectDescription'>) => {
      return (weaponStats[key] || 0) + (armorStats[key] || 0) + (artifactStats[key] || 0);
  };

  const totalStr = getStatSum('strength');
  const totalSpi = getStatSum('spirit');
  const totalCon = getStatSum('constitution');
  const totalWill = getStatSum('willpower');

  // Apply Trait Modifiers
  let displayStr = totalStr;
  if (state.traits.includes('devil_pact')) displayStr = Math.max(displayStr, 10) * 2;

  // Final Stats (Base 5 + Gear + Pills)
  const finalAttack = 5 + getStatSum('attack') + displayStr + pillStats.attack;
  
  let finalDefense = getStatSum('defense');
  if (state.cultivationPath === 'righteous') finalDefense += 5; // Base righteous bonus
  if (state.cultivationPath === 'righteous') finalDefense = Math.floor(finalDefense * 1.3);
  if (state.traits.includes('body_demonization')) finalDefense = Math.floor(finalDefense * 1.5);
  finalDefense += pillStats.defense;

  const physPen = getStatSum('physPenetration');
  const magicPen = getStatSum('magicPenetration');
  const fireRes = getStatSum('fireRes') + getStatSum('allRes');
  const poisonRes = getStatSum('poisonRes') + getStatSum('allRes');
  const mentalRes = getStatSum('mentalRes') + getStatSum('allRes');

  const renderEquippedItem = (slot: EquipmentSlot, icon: React.ReactNode, label: string, locked: boolean = false) => {
      const item = state.equippedItems[slot];
      const getBorderColor = () => {
          if (locked) return 'border-red-900/50 border-dashed';
          if (!item) return 'border-slate-700';
          switch (item.rarity) {
              case 'rare': return 'border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]';
              case 'uncommon': return 'border-blue-500';
              default: return 'border-slate-500';
          }
      };

      return (
          <div className="flex flex-col items-center gap-2 relative group">
              <div className="text-xs text-slate-500 uppercase tracking-widest">{label}</div>
              <div className={`relative w-20 h-20 bg-slate-800 rounded-xl border-2 flex items-center justify-center transition-all ${getBorderColor()}`}>
                  {locked ? (
                      <div className="flex flex-col items-center text-slate-600">
                          <Lock size={20} />
                          <span className="text-[9px] mt-1">Kim Đan</span>
                      </div>
                  ) : item ? (
                      <>
                          {icon}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl flex flex-col justify-end p-1">
                              <p className={`text-[10px] font-bold text-center truncate ${item.rarity === 'rare' ? 'text-purple-300' : 'text-slate-200'}`}>
                                  {item.name}
                              </p>
                          </div>
                          {/* Unequip Button */}
                          <button 
                            onClick={() => dispatch({ type: 'UNEQUIP_ITEM', payload: slot })}
                            className="absolute -top-2 -right-2 bg-slate-900 border border-slate-600 rounded-full p-1 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Tháo trang bị"
                          >
                              <X size={12} />
                          </button>
                      </>
                  ) : (
                      <div className="opacity-20">{icon}</div>
                  )}
              </div>
          </div>
      );
  };

  const StatRow = ({ label, value, icon, color = "text-slate-300", subValue = "" }: any) => (
      <div className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
              {icon}
              <span>{label}</span>
          </div>
          <div className="text-right">
              <span className={`font-bold font-mono ${color}`}>{value}</span>
              {subValue && <span className="text-xs text-slate-500 ml-1">{subValue}</span>}
          </div>
      </div>
  );

  return (
    <div className="p-4 md:p-8 h-full flex flex-col md:flex-row gap-6">
        {/* Left Column: Avatar & Equipment */}
        <div className="w-full md:w-1/3 flex flex-col gap-6">
             <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col items-center">
                 {/* Avatar Placeholder */}
                 <div className="w-32 h-32 rounded-full bg-gradient-to-br from-slate-700 to-ink-900 border-4 border-slate-600 flex items-center justify-center mb-4 shadow-inner relative">
                      <User size={64} className="text-slate-500" />
                      {/* Path Badge */}
                      {state.cultivationPath !== 'none' && (
                          <div className={`absolute bottom-0 right-0 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-ink-900 ${state.cultivationPath === 'devil' ? 'text-red-500 border-red-500' : 'text-indigo-400 border-indigo-400'}`}>
                              {state.cultivationPath === 'devil' ? 'Ma Đạo' : 'Chính Đạo'}
                          </div>
                      )}
                 </div>
                 
                 <h2 className="text-xl font-bold text-spirit-gold font-serif">{state.playerName}</h2>
                 <p className="text-sm text-jade-400">{realm.name}</p>
                 
                 {/* Equipment Slots */}
                 <div className="flex gap-4 mt-8">
                     {renderEquippedItem('weapon', <Swords size={32} className="text-slate-200" />, 'Vũ Khí')}
                     {renderEquippedItem('armor', <Shield size={32} className="text-slate-200" />, 'Y Phục')}
                     
                     {/* Artifact Slot - Locked until Golden Core */}
                     {renderEquippedItem('artifact', <Sparkles size={32} className="text-slate-200" />, 'Pháp Bảo', !isGoldenCore)}
                 </div>
             </div>
             
             {/* Character Attributes (Primary) */}
             <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Chỉ Số Cơ Bản</h3>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                         <div className="text-[10px] text-slate-500 uppercase">Thể Lực (Con)</div>
                         <div className="text-lg font-bold text-green-400">{totalCon}</div>
                     </div>
                     <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                         <div className="text-[10px] text-slate-500 uppercase">Sức Mạnh (Str)</div>
                         <div className="text-lg font-bold text-amber-400">{displayStr}</div>
                     </div>
                     <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                         <div className="text-[10px] text-slate-500 uppercase">Linh Lực (Spi)</div>
                         <div className="text-lg font-bold text-purple-400">{totalSpi}</div>
                     </div>
                     <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                         <div className="text-[10px] text-slate-500 uppercase">Ý Chí (Wil)</div>
                         <div className="text-lg font-bold text-blue-300">{totalWill}</div>
                     </div>
                 </div>
             </div>
        </div>

        {/* Right Column: Detailed Stats */}
        <div className="w-full md:w-2/3 bg-slate-800 rounded-2xl border border-slate-700 flex flex-col overflow-hidden">
             <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                 <h3 className="font-bold text-slate-200 flex items-center gap-2">
                     <Sparkles size={18} className="text-jade-400"/> Thông Tin Chi Tiết
                 </h3>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                 {/* Combat Stats */}
                 <div>
                     <h4 className="text-xs font-bold text-spirit-gold uppercase mb-3 border-b border-spirit-gold/20 pb-1">Chiến Đấu</h4>
                     <StatRow 
                        label="Sinh Lực (HP)" 
                        value={`${Math.ceil(state.hp)} / ${Math.ceil(state.maxHp)}`} 
                        icon={<Heart size={14} className="text-red-500"/>} 
                        color="text-red-400"
                        subValue={pillStats.hp > 0 ? `(+${pillStats.hp} Thuốc)` : ''}
                     />
                     <StatRow 
                        label="Tấn Công" 
                        value={finalAttack} 
                        icon={<Swords size={14} className="text-orange-400"/>} 
                        color="text-orange-300"
                        subValue={pillStats.attack > 0 ? `(+${pillStats.attack} Thuốc)` : ''}
                     />
                     <StatRow 
                        label="Phòng Thủ" 
                        value={finalDefense} 
                        icon={<Shield size={14} className="text-slate-400"/>} 
                        color="text-slate-300"
                        subValue={pillStats.defense > 0 ? `(+${pillStats.defense} Thuốc)` : ''}
                     />
                     <StatRow 
                        label="Xuyên Giáp (VL)" 
                        value={`${physPen}%`} 
                        icon={<Swords size={14} className="text-pink-400"/>} 
                        color="text-pink-400"
                     />
                     <StatRow 
                        label="Xuyên Phép" 
                        value={`${magicPen}%`} 
                        icon={<Zap size={14} className="text-purple-400"/>} 
                        color="text-purple-400"
                     />
                 </div>

                 {/* Resistance Stats */}
                 <div>
                     <h4 className="text-xs font-bold text-blue-400 uppercase mb-3 border-b border-blue-400/20 pb-1">Kháng Nguyên Tố</h4>
                     <StatRow 
                        label="Kháng Hỏa" 
                        value={`${fireRes}%`} 
                        icon={<Flame size={14} className="text-red-500"/>} 
                        color="text-red-400"
                     />
                     <StatRow 
                        label="Kháng Độc (Mộc)" 
                        value={`${poisonRes}%`} 
                        icon={<Skull size={14} className="text-green-500"/>} 
                        color="text-green-400"
                     />
                     <StatRow 
                        label="Kháng Tinh Thần" 
                        value={`${mentalRes}%`} 
                        icon={<Eye size={14} className="text-purple-400"/>} 
                        color="text-purple-300"
                        subValue={`+${Math.floor(totalWill*0.5)}% Wil`}
                     />
                 </div>
                 
                 {/* Pill Stats Summary (New Section) */}
                 <div className="md:col-span-2">
                     <h4 className="text-xs font-bold text-green-400 uppercase mb-3 border-b border-green-900/50 pb-1 flex items-center gap-2">
                         <Pill size={14} /> Dược Lực Tích Lũy
                     </h4>
                     <div className="grid grid-cols-3 gap-2 text-xs">
                         <div className="bg-slate-900 p-2 rounded border border-slate-700 text-center">
                             <span className="text-slate-500 block mb-1">Tấn Công</span>
                             <span className="text-orange-400 font-bold">+{pillStats.attack}</span>
                         </div>
                         <div className="bg-slate-900 p-2 rounded border border-slate-700 text-center">
                             <span className="text-slate-500 block mb-1">Phòng Thủ</span>
                             <span className="text-blue-400 font-bold">+{pillStats.defense}</span>
                         </div>
                         <div className="bg-slate-900 p-2 rounded border border-slate-700 text-center">
                             <span className="text-slate-500 block mb-1">Sinh Lực</span>
                             <span className="text-red-400 font-bold">+{pillStats.hp}</span>
                         </div>
                     </div>
                 </div>
             </div>
        </div>
    </div>
  );
};

export default CharacterPanel;