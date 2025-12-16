import React from 'react';
import { useGame } from '../context/GameContext';
import { Package, Heart, Zap, Swords } from 'lucide-react';

const InventoryPanel: React.FC = () => {
  const { state, dispatch } = useGame();

  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
           <Package className="text-jade-400" size={24} />
           <h2 className="text-xl font-bold text-slate-200">Túi Càn Khôn</h2>
           <span className="ml-auto text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
               {state.inventory.length} vật phẩm
           </span>
      </div>

      <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.inventory.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-600 opacity-50">
                        <Package size={48} className="mb-4" />
                        <p className="italic">Túi đồ trống rỗng...</p>
                    </div>
                ) : (
                    state.inventory.map((item, idx) => (
                        <div key={`${item.id}-${idx}`} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex justify-between items-start hover:border-slate-500 transition-colors group">
                            <div className="flex-1 pr-2">
                                <div className="flex justify-between items-start">
                                    <h3 className={`font-bold ${item.rarity === 'rare' ? 'text-purple-400' : item.rarity === 'uncommon' ? 'text-blue-400' : 'text-slate-200'}`}>{item.name}</h3>
                                    <span className="text-xs bg-black/40 px-2 py-0.5 rounded text-slate-300 font-mono">
                                        x{item.quantity}
                                    </span>
                                </div>
                                
                                <p className="text-xs text-slate-400 mt-1 h-8 line-clamp-2">{item.description}</p>
                                
                                {/* Show Stats for Equipment (Simplified) */}
                                {item.type === 'equipment' && item.stats && (
                                    <div className="mt-2 flex flex-wrap gap-1 text-[9px] text-slate-400">
                                        {item.stats.attack && <span className="bg-slate-900 px-1 rounded">Công:{item.stats.attack}</span>}
                                        {item.stats.defense && <span className="bg-slate-900 px-1 rounded">Thủ:{item.stats.defense}</span>}
                                        {item.stats.constitution && <span className="text-green-400 bg-green-900/10 px-1 rounded flex items-center"><Heart size={8} className="mr-0.5"/>{item.stats.constitution}</span>}
                                        {item.stats.strength && <span className="text-amber-400 bg-amber-900/10 px-1 rounded flex items-center"><Swords size={8} className="mr-0.5"/>{item.stats.strength}</span>}
                                        {item.stats.spirit && <span className="text-purple-400 bg-purple-900/10 px-1 rounded flex items-center"><Zap size={8} className="mr-0.5"/>{item.stats.spirit}</span>}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex flex-col gap-2 ml-2">
                                {item.type === 'consumable' && (
                                    <button 
                                        onClick={() => dispatch({ type: 'USE_ITEM', payload: item.id })}
                                        className="bg-slate-700 hover:bg-green-700 text-xs px-3 py-1.5 rounded text-white border border-slate-600 transition-colors shadow-sm whitespace-nowrap"
                                    >
                                        Dùng
                                    </button>
                                )}
                                {item.type === 'equipment' && (
                                    <button 
                                        onClick={() => dispatch({ type: 'EQUIP_ITEM', payload: item.id })}
                                        className="bg-indigo-700 hover:bg-indigo-600 text-xs px-3 py-1.5 rounded text-white border border-indigo-600 transition-colors shadow-sm whitespace-nowrap"
                                    >
                                        Trang bị
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
      </div>
    </div>
  );
};

export default InventoryPanel;