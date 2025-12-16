import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { Zap, Shield, ArrowUpCircle, Flame, ShieldCheck, Skull, Sword, Sparkles, Gem, AlertTriangle, Infinity } from 'lucide-react';
import { TRAITS, REALMS } from '../constants';
import AscensionModal from './AscensionModal';

const CultivationPanel: React.FC = () => {
  const { state, dispatch, getCurrentRealm } = useGame();
  const realm = getCurrentRealm();
  
  // Re-render periodically for timer update
  const [, setTick] = useState(0);
  const [showAscension, setShowAscension] = useState(false);

  useEffect(() => {
     const t = setInterval(() => setTick(n => n + 1), 1000);
     return () => clearInterval(t);
  }, []);

  const progressPercent = Math.min(100, (state.resources.qi / realm.maxQiCap) * 100);
  const canBreakthrough = state.resources.qi >= realm.maxQiCap;
  const isTraitor = state.traitorDebuffEndTime > Date.now();
  
  // Weakness Calculation
  const weaknessLeft = Math.max(0, (state.weaknessEndTime || 0) - Date.now());
  const isWeakened = weaknessLeft > 0;

  // Max Level Check
  const isMaxLevel = state.realmIndex >= REALMS.length - 1;

  // Render Path Icon
  const PathIcon = state.cultivationPath === 'devil' ? Flame : ShieldCheck;
  const pathColor = state.cultivationPath === 'devil' ? 'text-red-500' : 'text-indigo-400';
  const pathName = state.cultivationPath === 'devil' ? 'Ma Đạo' : 'Chính Đạo';
  const pathBg = state.cultivationPath === 'devil' ? 'bg-red-900/30 border-red-900' : 'bg-indigo-900/30 border-indigo-900';

  // Calculate Display Stats (Base 5 + Pills + Gear)
  const weaponStats = state.equippedItems.weapon?.stats || {};
  let totalAttack = 5 + (weaponStats.attack || 0) + (state.statBonuses?.attack || 0); // 5 là base
  let totalStr = weaponStats.strength || 0;
  let totalSpirit = weaponStats.spirit || 0;

  // Visual adjustment for Traits
  if (state.traits.includes('devil_pact')) {
      totalStr = Math.max(totalStr, 10) * 2;
  }

  let totalDefense = (state.statBonuses?.defense || 0);
  if (state.cultivationPath === 'righteous') totalDefense += 5; // Base righteous bonus
  if (state.cultivationPath === 'righteous') totalDefense = Math.floor(totalDefense * 1.3);
  totalDefense += (state.equippedItems.armor?.stats?.defense || 0);
  
  if (state.traits.includes('body_demonization')) {
      totalDefense = Math.floor(totalDefense * 1.5);
  }

  // Bonus from Talents (Visual only here, logic in reducer)
  const talentStartStats = (state.prestige?.talents?.['divine_body'] || 0) * 5;
  totalAttack += talentStartStats;
  totalDefense += talentStartStats;

  const artifactPassive = state.equippedItems.artifact?.stats?.qiRegen || 0;
  let baseRegen = realm.baseQiGeneration;
  
  // Apply Talent Qi Bonus (Visual)
  const talentQiBonus = (state.prestige?.talents?.['heavenly_roots'] || 0) * 0.1;
  const rootQuality = state.prestige.spiritRootQuality || 0;
  const rootBonus = rootQuality / 100;
  
  baseRegen *= (1 + talentQiBonus + rootBonus);

  if (state.cultivationPath === 'righteous') baseRegen *= 1.2;
  if (state.traits.includes('great_enlightenment')) baseRegen *= 1.5;
  if (state.traits.includes('life_absorption')) baseRegen *= 1.3;

  if (isTraitor) baseRegen *= 0.5;
  const totalRegen = baseRegen + artifactPassive;

  let clickPower = (1 + realm.baseQiGeneration) * (state.cultivationPath === 'devil' ? 1.2 : 1);
  clickPower *= (1 + talentQiBonus); // Talent Click Bonus

  if (isTraitor) clickPower *= 0.5;
  const totalClick = clickPower;
  
  // Calculate total breakthrough chance for display
  const pillBonus = state.breakthroughSupportMod || 0;
  let finalBreakthroughChance = (realm.breakthroughChance + pillBonus);
  if (state.traits.includes('dao_injury')) finalBreakthroughChance += 0.1;
  if (state.traits.includes('heavenly_jealousy')) finalBreakthroughChance -= 0.1;
  finalBreakthroughChance += rootBonus / 5; // Root bonus to visual (divided by 5 for balance in display, similar to reducer logic)

  if (isWeakened) finalBreakthroughChance -= 0.3; // Show Weakness penalty
  
  const displayChance = Math.max(0, Math.min(100, Math.floor(finalBreakthroughChance * 100)));

  // Determine Realm Trait
  let realmTrait = { title: "Cường Hóa Thể Chất", desc: "Ưu tiên Sức Mạnh & Dmg Vật Lý", icon: <Sword size={16}/>, color: "text-amber-400" };
  if (state.realmIndex >= 6) realmTrait = { title: "Linh Khí Hộ Thể", desc: "Cân bằng Vật Lý & Phép Thuật", icon: <ShieldCheck size={16}/>, color: "text-blue-400" };
  if (state.realmIndex >= 9) realmTrait = { title: "Linh Lực Tinh Thuần", desc: "Ưu tiên Linh Lực & Dmg Phép", icon: <Zap size={16}/>, color: "text-purple-400" };
  if (state.realmIndex >= 12) realmTrait = { title: "Nguyên Thần Xuất Khiếu", desc: "Xuyên thấu & Sát thương Tinh Thần", icon: <Sparkles size={16}/>, color: "text-pink-400" };

  // Helper to get Spirit Root Name
  const getSpiritRootInfo = (quality: number) => {
      if (quality >= 100) return { name: 'Hỗn Độn Linh Căn', color: 'text-red-500', tier: 'Tối Thượng' };
      if (quality >= 80) return { name: 'Tiên Thiên Linh Căn', color: 'text-spirit-gold', tier: 'Cực Phẩm' };
      if (quality >= 60) return { name: 'Thiên Linh Căn', color: 'text-purple-400', tier: 'Thượng Phẩm' };
      if (quality >= 40) return { name: 'Địa Linh Căn', color: 'text-blue-400', tier: 'Trung Phẩm' };
      if (quality >= 20) return { name: 'Chân Linh Căn', color: 'text-green-400', tier: 'Hạ Phẩm' };
      if (quality > 0) return { name: 'Tạp Linh Căn', color: 'text-slate-400', tier: 'Phàm Phẩm' };
      return { name: 'Phế Linh Căn', color: 'text-gray-500', tier: 'Vô Dụng' };
  };

  const rootInfo = getSpiritRootInfo(rootQuality);

  return (
    <div className="h-full flex flex-col items-center justify-start p-4 md:p-8 space-y-6 animate-fadeIn overflow-y-auto">
      <AscensionModal isOpen={showAscension} onClose={() => setShowAscension(false)} />

      {/* Realm Badge */}
      <div className="relative group mt-4 flex-shrink-0">
        <div className={`absolute -inset-1 bg-gradient-to-r ${state.cultivationPath === 'devil' ? 'from-red-600 to-orange-600' : 'from-jade-500 to-indigo-500'} rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200`}></div>
        <div className="relative bg-ink-800 rounded-full w-52 h-52 flex flex-col items-center justify-center border-4 border-slate-700 shadow-2xl">
            {state.cultivationPath !== 'none' && (
                <div className={`absolute -top-4 px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 shadow-lg ${pathBg} ${pathColor}`}>
                    <PathIcon size={12} /> {pathName}
                </div>
            )}
            
            <span className="text-slate-400 text-sm font-serif mb-1 mt-2">Cảnh Giới</span>
            <span className="text-2xl font-bold text-white text-center px-2">{realm.name}</span>
            <div className="mt-3 flex space-x-3 text-xs text-slate-400">
                <span className="flex items-center gap-1" title="Tấn công">
                    <Sword size={14} className="text-slate-400"/> 
                    {totalAttack}
                </span>
                <span className="flex items-center gap-1" title="Phòng thủ">
                    <Shield size={14} className="text-blue-400"/> 
                    {totalDefense}
                </span>
            </div>
             {/* Extended Stats */}
            <div className="mt-1 flex space-x-3 text-[10px] text-slate-500">
                 {totalStr > 0 && <span title="Sức Mạnh thêm">+ {totalStr} STR</span>}
                 {totalSpirit > 0 && <span title="Linh Lực thêm">+ {totalSpirit} SPI</span>}
            </div>
        </div>
      </div>

      {/* Realm Trait & Spirit Root Box */}
      <div className="flex gap-2 justify-center flex-wrap">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 flex items-center gap-3 flex-shrink-0">
                <div className={`p-2 rounded-full bg-slate-900 border border-slate-600 ${realmTrait.color}`}>
                    {realmTrait.icon}
                </div>
                <div>
                    <h4 className={`text-sm font-bold ${realmTrait.color}`}>{realmTrait.title}</h4>
                    <p className="text-[10px] text-slate-400">{realmTrait.desc}</p>
                </div>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 flex items-center gap-3 flex-shrink-0">
                <div className={`p-2 rounded-full bg-slate-900 border border-slate-600 ${rootInfo.color}`}>
                    <Gem size={16} />
                </div>
                <div>
                    <h4 className={`text-sm font-bold ${rootInfo.color}`}>{rootInfo.name}</h4>
                    <p className="text-[10px] text-slate-400">
                        {rootInfo.tier} ({rootQuality}/100) • Hấp thụ +{(rootBonus * 100).toFixed(0)}%
                    </p>
                </div>
          </div>
      </div>

      {/* WEAKNESS WARNING */}
      {isWeakened && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-2 flex items-center gap-2 animate-pulse">
              <AlertTriangle size={16} className="text-red-400" />
              <div className="text-xs">
                  <span className="text-red-300 font-bold">Căn Cơ Bất Ổn:</span> 
                  <span className="text-red-200"> Tỷ lệ đột phá giảm 30% ({Math.ceil(weaknessLeft/60000)}p)</span>
              </div>
          </div>
      )}

      {/* TRAIT DISPLAY */}
      {state.traits && state.traits.length > 0 && (
          <div className="w-full max-w-md bg-ink-900/50 p-2 rounded-lg border border-slate-800 flex flex-wrap justify-center gap-2">
              {state.traits.map(traitId => {
                  const t = TRAITS[traitId];
                  if (!t) return null;
                  return (
                      <div key={traitId} className="group relative">
                          <span className="text-[10px] px-2 py-1 rounded border bg-slate-800 border-slate-600 text-spirit-gold cursor-help flex items-center gap-1">
                              <Gem size={10} /> {t.name}
                          </span>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-black/90 text-slate-200 text-xs p-2 rounded hidden group-hover:block z-50 border border-slate-700 text-center">
                              {t.description}
                          </div>
                      </div>
                  )
              })}
          </div>
      )}

      {/* Progress Bar */}
      <div className="w-full max-w-md space-y-2 flex-shrink-0">
        <div className="flex justify-between text-sm text-slate-300">
            <span>Linh Khí</span>
            <span className="flex items-center gap-2">
                {isTraitor && <span className="text-[10px] text-red-500 bg-red-900/20 px-1 border border-red-900 rounded flex items-center gap-1"><Skull size={10}/> -50%</span>}
                {Math.floor(state.resources.qi).toLocaleString()} / {realm.maxQiCap.toLocaleString()}
            </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-4 border border-slate-700 overflow-hidden relative">
            <div 
                className={`h-4 rounded-full transition-all duration-300 ease-out bg-gradient-to-r ${state.cultivationPath === 'devil' ? 'from-red-700 to-orange-600' : 'from-jade-700 to-jade-500'} ${isTraitor ? 'opacity-50 grayscale' : ''}`}
                style={{ width: `${progressPercent}%` }}
            ></div>
            {/* Shimmer effect */}
            {!isTraitor && <div className="absolute top-0 left-0 w-full h-full bg-white opacity-5 animate-[shimmer_2s_infinite]"></div>}
        </div>
        <div className="text-xs text-center text-slate-500">
            {isTraitor ? (
                <span className="text-red-400 font-bold">Trạng thái Phản Phái: Tốc độ hấp thụ giảm 50%</span>
            ) : (
                <span>Tự động hấp thụ: +{totalRegen.toFixed(1)}/s {artifactPassive > 0 && <span className="text-spirit-gold">(+{artifactPassive} PB)</span>}</span>
            )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col space-y-4 w-full max-w-xs flex-shrink-0">
        {canBreakthrough ? (
             <div className="space-y-2">
                {isMaxLevel ? (
                    <button 
                        onClick={() => setShowAscension(true)}
                        className="w-full py-4 rounded-xl font-bold text-white shadow-lg transform transition-all duration-200 flex items-center justify-center space-x-2 border-2 bg-gradient-to-r from-spirit-gold via-purple-600 to-spirit-gold border-purple-400 animate-pulse hover:scale-105"
                    >
                        <Infinity size={24} className="text-white" />
                        <span>Phi Thăng / Chuyển Sinh</span>
                    </button>
                ) : (
                     <button 
                        onClick={() => dispatch({ type: 'ATTEMPT_BREAKTHROUGH' })}
                        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transform transition-all duration-200 flex items-center justify-center space-x-2 border-2 
                            ${isWeakened 
                                ? 'bg-gradient-to-r from-red-900 to-slate-700 border-red-500/50 cursor-pointer hover:scale-100' 
                                : 'bg-gradient-to-r from-spirit-gold to-yellow-600 border-yellow-400 hover:scale-105 animate-pulse'}`}
                    >
                        <ArrowUpCircle size={24} className={isWeakened ? 'text-red-400' : 'text-white'} />
                        <span>Đột Phá ({displayChance}%)</span>
                    </button>
                )}
                {pillBonus > 0 && !isMaxLevel && (
                    <p className="text-center text-xs text-jade-400 animate-pulse">
                        Đang áp dụng hiệu ứng Đan Dược (+{(pillBonus * 100).toFixed(0)}%)
                    </p>
                )}
            </div>
        ) : (
            <button 
                onClick={() => dispatch({ type: 'GATHER_QI' })}
                className="w-full py-4 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 rounded-xl font-bold text-jade-400 shadow-lg transform hover:-translate-y-1 active:translate-y-0 transition-all duration-100 flex items-center justify-center space-x-2 border border-slate-600"
            >
                <Zap size={20} />
                <span>Tụ Khí (+{totalClick.toFixed(1)})</span>
            </button>
        )}
      </div>

      {/* Flavor Text */}
      <div className="max-w-md text-center text-slate-500 text-sm italic font-serif pb-4 flex flex-col gap-2">
         <p>
            {state.cultivationPath === 'devil' 
                ? "\"Muốn thành đại đạo, phải dám đi ngược ý trời, đạp lên xương máu mà đi.\"" 
                : "\"Người tu tiên phải nghịch thiên cải mệnh, nhưng tâm phải sáng, chí phải bền.\""}
         </p>
         <p className="text-[10px] text-slate-600 not-italic font-sans">
            *Nhớ lưu game thường xuyên tại phần Thiết Lập để tránh mất dữ liệu.
         </p>
      </div>
    </div>
  );
};

export default CultivationPanel;