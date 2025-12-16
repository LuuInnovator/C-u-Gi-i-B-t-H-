import React from 'react';
import { useGame } from '../context/GameContext';
import { TALENTS } from '../constants';
import { Star, Zap, Shield, Leaf, Coins, ArrowUp } from 'lucide-react';

const TalentTreePanel: React.FC = () => {
  const { state, dispatch } = useGame();
  const prestige = state.prestige;

  // Helper to calculate cost
  const getCost = (base: number, mult: number, level: number) => {
      return Math.floor(base * Math.pow(mult, level));
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
       {/* Header */}
       <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg mb-6 flex flex-col md:flex-row justify-between items-center text-center md:text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div>
                <h2 className="text-2xl font-bold text-spirit-gold flex items-center gap-2 justify-center md:justify-start">
                    <Star size={28} className="animate-spin-slow" /> Thiên Đạo Luân Hồi
                </h2>
                <p className="text-sm text-slate-400 mt-1">Sử dụng Tinh Hoa tích lũy từ các kiếp trước để cường hóa vĩnh viễn.</p>
            </div>

            <div className="mt-4 md:mt-0 bg-black/40 px-6 py-3 rounded-lg border border-spirit-gold/30">
                <p className="text-xs text-slate-400 uppercase tracking-widest">Tinh Hoa Thiên Đạo</p>
                <p className="text-3xl font-bold text-spirit-gold text-center">{prestige.currency}</p>
                <p className="text-[10px] text-slate-500 text-center">Đã Luân Hồi: {prestige.ascensionCount} lần</p>
            </div>
       </div>

       {/* Talent Grid */}
       <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                {TALENTS.map(talent => {
                    const level = prestige.talents[talent.id] || 0;
                    const isMaxed = level >= talent.maxLevel;
                    const cost = getCost(talent.baseCost, talent.costMultiplier, level);
                    const canAfford = prestige.currency >= cost;

                    let Icon = Star;
                    let color = 'text-yellow-400';
                    if (talent.type === 'combat') { Icon = Shield; color = 'text-red-400'; }
                    if (talent.type === 'cultivation') { Icon = Zap; color = 'text-blue-400'; }
                    if (talent.type === 'economy') { Icon = Coins; color = 'text-green-400'; }

                    return (
                        <div key={talent.id} className={`bg-slate-800 rounded-lg border flex flex-col relative overflow-hidden transition-all group
                            ${isMaxed ? 'border-spirit-gold shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-slate-700 hover:border-slate-500'}`}>
                            
                            {/* Background Progress Bar (Visual flair) */}
                            <div className="absolute bottom-0 left-0 h-1 bg-slate-700 w-full">
                                <div className="h-full bg-spirit-gold" style={{ width: `${(level/talent.maxLevel)*100}%` }}></div>
                            </div>

                            <div className="p-5 flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <div className={`p-2 rounded-lg bg-slate-900 border border-slate-700 ${color}`}>
                                        <Icon size={24} />
                                    </div>
                                    <span className="text-xs font-mono bg-black/40 px-2 py-1 rounded text-slate-400">
                                        Lv. {level} / {talent.maxLevel}
                                    </span>
                                </div>

                                <h3 className="font-bold text-lg text-slate-200 group-hover:text-white transition-colors">{talent.name}</h3>
                                <p className="text-xs text-slate-400 mt-2 h-10">{talent.description}</p>
                                
                                <div className="mt-3 text-xs text-jade-400 font-bold bg-jade-900/10 px-2 py-1 rounded inline-block border border-jade-500/20">
                                    Hiệu quả: +{Math.round(level * talent.effectPerLevel * (talent.id === 'divine_body' ? 1 : 100))}% 
                                    {talent.id === 'divine_body' ? ' Stats' : ''}
                                </div>
                            </div>

                            <div className="p-4 border-t border-slate-700 bg-slate-800/50">
                                {isMaxed ? (
                                    <div className="w-full py-2 text-center text-sm font-bold text-spirit-gold bg-spirit-gold/10 rounded border border-spirit-gold/30">
                                        Đại Viên Mãn
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => dispatch({ type: 'UPGRADE_TALENT', payload: talent.id })}
                                        disabled={!canAfford}
                                        className={`w-full py-2 rounded flex items-center justify-center gap-2 text-sm font-bold transition-all
                                            ${canAfford 
                                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg active:scale-95' 
                                                : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                                    >
                                        <span>Nâng Cấp</span>
                                        <span className={`text-xs font-normal ${canAfford ? 'text-indigo-200' : 'text-slate-500'}`}>
                                            ({cost} Tinh Hoa)
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
       </div>
    </div>
  );
};

export default TalentTreePanel;