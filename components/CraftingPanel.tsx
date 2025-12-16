import React from 'react';
import { useGame } from '../context/GameContext';
import { CRAFTABLE_ITEMS } from '../constants';
import { Hammer } from 'lucide-react';

const CraftingPanel: React.FC = () => {
  const { state, dispatch } = useGame();

  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
         {/* Header / Resource Summary */}
         <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div>
                 <h2 className="text-xl font-bold text-spirit-gold flex items-center gap-2">
                     <Hammer size={24} /> Lò Luyện Khí
                 </h2>
                 <p className="text-xs text-slate-400">Chế tạo đan dược và pháp bảo.</p>
             </div>
             <div className="flex space-x-4 text-sm flex-wrap gap-y-2 bg-black/20 p-2 rounded-lg border border-slate-700/50">
                 <span className="text-jade-400 font-mono">Thảo: {state.resources.herbs}</span>
                 <span className="text-slate-300 font-mono">Khoáng: {state.resources.ores}</span>
                 <span className="text-spirit-gold font-mono">Linh Thạch: {state.resources.spiritStones}</span>
             </div>
         </div>

         <div className="flex-1 overflow-y-auto">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {CRAFTABLE_ITEMS.map((item) => {
                    const canCraft = 
                        state.resources.herbs >= (item.cost?.herbs || 0) &&
                        state.resources.ores >= (item.cost?.ores || 0) &&
                        state.resources.spiritStones >= (item.cost?.spiritStones || 0);

                    return (
                        <div key={item.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col justify-between hover:border-slate-500 transition-colors">
                            <div>
                                <div className="flex justify-between items-start">
                                    <h3 className={`font-bold ${item.type === 'equipment' ? 'text-spirit-gold' : 'text-jade-300'}`}>{item.name}</h3>
                                    {item.type === 'equipment' && <span className="text-[10px] uppercase bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700">Trang bị</span>}
                                    {item.type === 'consumable' && <span className="text-[10px] uppercase bg-green-900 text-green-300 px-2 py-0.5 rounded border border-green-700">Đan Dược</span>}
                                </div>
                                <p className="text-xs text-slate-400 mt-2 h-10 line-clamp-2">{item.description}</p>
                                
                                <div className="mt-3 text-xs space-y-1 bg-black/20 p-2 rounded border border-slate-700/30">
                                    <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Nguyên liệu:</p>
                                    {item.cost?.herbs && <div className={`flex justify-between ${state.resources.herbs < item.cost.herbs ? 'text-red-400' : 'text-slate-300'}`}><span>Linh Thảo</span> <span>{item.cost.herbs}</span></div>}
                                    {item.cost?.ores && <div className={`flex justify-between ${state.resources.ores < item.cost.ores ? 'text-red-400' : 'text-slate-300'}`}><span>Khoáng Thạch</span> <span>{item.cost.ores}</span></div>}
                                    {item.cost?.spiritStones && <div className={`flex justify-between ${state.resources.spiritStones < item.cost.spiritStones ? 'text-red-400' : 'text-slate-300'}`}><span>Linh Thạch</span> <span>{item.cost.spiritStones}</span></div>}
                                </div>
                            </div>
                            <button 
                                disabled={!canCraft}
                                onClick={() => dispatch({ type: 'CRAFT_ITEM', payload: { itemId: item.id, cost: item.cost || {} } })}
                                className={`mt-4 w-full py-2 rounded flex items-center justify-center space-x-2 text-sm font-bold transition-all active:scale-95
                                    ${canCraft 
                                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg' 
                                        : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-70'}`}
                            >
                                <Hammer size={16} /> <span>Chế Tạo</span>
                            </button>
                        </div>
                    );
                })}
             </div>
         </div>
    </div>
  );
};

export default CraftingPanel;