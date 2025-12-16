import React from 'react';
import { useGame } from '../context/GameContext';
import { ENCOUNTERS } from '../constants';
import { Star, ShieldAlert, Skull, Gem } from 'lucide-react';

const EncounterModal: React.FC = () => {
  const { state, dispatch } = useGame();

  if (!state.activeEncounterId) return null;

  const encounter = ENCOUNTERS.find(e => e.id === state.activeEncounterId);
  if (!encounter) return null;

  const handleChoose = (index: number) => {
    dispatch({ 
        type: 'RESOLVE_ENCOUNTER', 
        payload: { encounterId: encounter.id, optionIndex: index } 
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-ink-900 border-2 border-spirit-gold/50 rounded-2xl max-w-lg w-full shadow-[0_0_50px_rgba(245,158,11,0.2)] relative overflow-hidden flex flex-col">
        
        {/* Header decoration */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-spirit-gold to-transparent"></div>
        
        <div className="p-6 md:p-8 text-center space-y-4">
            <div className="flex justify-center mb-4">
                <div className="bg-ink-800 p-4 rounded-full border border-spirit-gold shadow-lg relative">
                    <Star size={40} className="text-spirit-gold animate-spin-slow" />
                    <div className="absolute inset-0 bg-spirit-gold/20 rounded-full blur-xl animate-pulse"></div>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-spirit-gold font-serif">{encounter.title}</h2>
            
            <p className="text-slate-300 italic leading-relaxed text-sm md:text-base border-t border-b border-slate-700 py-4 my-4">
                "{encounter.description}"
            </p>

            <div className="grid gap-3 mt-6">
                {encounter.options.map((option, idx) => {
                    // Check availability based on path
                    if (option.reqPath && state.cultivationPath !== option.reqPath) {
                        return null;
                    }

                    // Check availability based on cost
                    const canAfford = (!option.resourceCost?.spiritStones || state.resources.spiritStones >= option.resourceCost.spiritStones) &&
                                      (!option.resourceCost?.herbs || state.resources.herbs >= option.resourceCost.herbs);

                    let btnColor = "bg-slate-700 hover:bg-slate-600 border-slate-600";
                    let icon = null;

                    if (option.type === 'risky') {
                        btnColor = "bg-orange-900/40 hover:bg-orange-900/60 border-orange-700 text-orange-200";
                        icon = <ShieldAlert size={16} className="text-orange-500"/>;
                    } else if (option.type === 'devil') {
                        btnColor = "bg-red-900/40 hover:bg-red-900/60 border-red-700 text-red-200";
                        icon = <Skull size={16} className="text-red-500"/>;
                    } else if (option.type === 'righteous') {
                        btnColor = "bg-indigo-900/40 hover:bg-indigo-900/60 border-indigo-700 text-indigo-200";
                        icon = <Gem size={16} className="text-indigo-400"/>;
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => handleChoose(idx)}
                            disabled={!canAfford}
                            className={`w-full p-3 rounded-lg border text-left flex flex-col transition-all active:scale-[0.98]
                                ${btnColor} ${!canAfford ? 'opacity-50 cursor-not-allowed grayscale' : 'shadow-md hover:shadow-lg'}`}
                        >
                            <div className="flex items-center gap-2 font-bold text-sm">
                                {icon} {option.label}
                                {option.resourceCost?.spiritStones && <span className="text-xs font-normal text-spirit-gold ml-auto">-{option.resourceCost.spiritStones} L.Thạch</span>}
                                {option.resourceCost?.herbs && <span className="text-xs font-normal text-jade-400 ml-auto">-{option.resourceCost.herbs} L.Thảo</span>}
                            </div>
                            {option.description && (
                                <span className="text-xs text-slate-400 mt-1 block">{option.description}</span>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default EncounterModal;