import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { CRAFTABLE_ITEMS } from '../constants';
import { Package, Hammer, Beaker } from 'lucide-react';

const InventoryPanel: React.FC = () => {
  const { state, dispatch } = useGame();
  const [activeTab, setActiveTab] = useState<'items' | 'crafting'>('items');

  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
      <div className="flex space-x-4 mb-6 border-b border-slate-700 pb-2">
        <button 
            onClick={() => setActiveTab('items')}
            className={`flex items-center space-x-2 pb-2 px-2 ${activeTab === 'items' ? 'text-jade-400 border-b-2 border-jade-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
            <Package size={18} /> <span>Túi Đồ</span>
        </button>
        <button 
            onClick={() => setActiveTab('crafting')}
            className={`flex items-center space-x-2 pb-2 px-2 ${activeTab === 'crafting' ? 'text-spirit-gold border-b-2 border-spirit-gold' : 'text-slate-400 hover:text-slate-200'}`}
        >
            <Beaker size={18} /> <span>Luyện Đan</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'items' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.inventory.length === 0 ? (
                    <div className="col-span-full text-center text-slate-500 py-10 italic">
                        Túi đồ trống rỗng...
                    </div>
                ) : (
                    state.inventory.map((item, idx) => (
                        <div key={`${item.id}-${idx}`} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-jade-300">{item.name}</h3>
                                <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                                <span className="text-xs bg-slate-900 px-2 py-0.5 rounded mt-2 inline-block text-slate-300">
                                    Số lượng: {item.quantity}
                                </span>
                            </div>
                            {item.type === 'consumable' && (
                                <button 
                                    onClick={() => dispatch({ type: 'USE_ITEM', payload: item.id })}
                                    className="bg-slate-700 hover:bg-slate-600 text-xs px-3 py-1 rounded text-white"
                                >
                                    Dùng
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        )}

        {activeTab === 'crafting' && (
             <div className="space-y-4">
                 <div className="bg-ink-800 p-4 rounded border border-slate-700 mb-4">
                     <h3 className="text-sm font-bold text-slate-300 mb-2">Tài Nguyên Hiện Có</h3>
                     <div className="flex space-x-4 text-sm">
                         <span className="text-jade-400">Linh Thảo: {state.resources.herbs}</span>
                         <span className="text-slate-400">Khoáng Thạch: {state.resources.ores}</span>
                     </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {CRAFTABLE_ITEMS.map((item) => {
                        const canCraft = 
                            state.resources.herbs >= (item.cost.herbs || 0) &&
                            state.resources.ores >= (item.cost.ores || 0);

                        return (
                            <div key={item.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-spirit-gold">{item.name}</h3>
                                        {item.type === 'consumable' && <span className="text-[10px] uppercase bg-jade-900 text-jade-300 px-1 rounded">Tiêu thụ</span>}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                                    <div className="mt-3 text-xs space-y-1">
                                        {item.cost.herbs && <div className={state.resources.herbs < item.cost.herbs ? 'text-red-400' : 'text-slate-300'}>- {item.cost.herbs} Linh Thảo</div>}
                                        {item.cost.ores && <div className={state.resources.ores < item.cost.ores ? 'text-red-400' : 'text-slate-300'}>- {item.cost.ores} Khoáng Thạch</div>}
                                    </div>
                                </div>
                                <button 
                                    disabled={!canCraft}
                                    onClick={() => dispatch({ type: 'CRAFT_ITEM', payload: { itemId: item.id, cost: item.cost } })}
                                    className={`mt-4 w-full py-2 rounded flex items-center justify-center space-x-2 text-sm font-bold transition-colors
                                        ${canCraft 
                                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg' 
                                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                                >
                                    <Hammer size={16} /> <span>Chế Tạo</span>
                                </button>
                            </div>
                        );
                    })}
                 </div>
             </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPanel;