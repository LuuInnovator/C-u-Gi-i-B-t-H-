import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { CRAFTABLE_ITEMS } from '../constants';
import { Package, Hammer, Shield, Swords, Sparkles, X, Heart, Brain, Zap, Flame, Droplets, Mountain } from 'lucide-react';
import { Item, EquipmentSlot } from '../types';

const InventoryPanel: React.FC = () => {
  const { state, dispatch } = useGame();
  const [activeTab, setActiveTab] = useState<'items' | 'crafting'>('items');

  const renderEquippedItem = (slot: EquipmentSlot, icon: React.ReactNode, label: string) => {
      const item = state.equippedItems[slot];
      return (
          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex items-center space-x-3 relative group">
              <div className={`p-2 rounded bg-slate-900 border ${item ? 'border-jade-500' : 'border-slate-700'}`}>
                  {icon}
              </div>
              <div className="flex-1">
                  <p className="text-xs text-slate-500 uppercase">{label}</p>
                  {item ? (
                      <div>
                          <p className={`text-sm font-bold ${item.rarity === 'rare' ? 'text-purple-400' : item.rarity === 'uncommon' ? 'text-blue-400' : 'text-slate-200'}`}>{item.name}</p>
                          <div className="text-[10px] text-slate-400 grid grid-cols-2 gap-x-2">
                             {item.stats?.attack && <span>Công:{item.stats.attack}</span>}
                             {item.stats?.defense && <span>Thủ:{item.stats.defense}</span>}
                             {item.stats?.constitution && <span className="text-green-400">Thể:{item.stats.constitution}</span>}
                             {item.stats?.strength && <span className="text-amber-400">Lực:{item.stats.strength}</span>}
                             {item.stats?.spirit && <span className="text-purple-400">Linh:{item.stats.spirit}</span>}
                             {item.stats?.physPenetration && <span className="text-pink-400">XuyênVL:{item.stats.physPenetration}%</span>}
                             {item.stats?.fireRes && <span className="text-red-400">K.Hỏa:{item.stats.fireRes}</span>}
                             {item.stats?.willpower && <span className="text-blue-300">Ý Chí:{item.stats.willpower}</span>}
                          </div>
                          {item.stats?.effectDescription && (
                              <p className="text-[9px] text-yellow-500 mt-1 italic">{item.stats.effectDescription}</p>
                          )}
                      </div>
                  ) : (
                      <p className="text-sm text-slate-600 italic">Trống</p>
                  )}
              </div>
              {item && (
                  <button 
                    onClick={() => dispatch({ type: 'UNEQUIP_ITEM', payload: slot })}
                    className="absolute top-2 right-2 text-slate-500 hover:text-red-400"
                    title="Tháo trang bị"
                  >
                      <X size={16} />
                  </button>
              )}
          </div>
      );
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
      {/* EQUIPMENT SECTION */}
      <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
              <Shield size={16} /> Trang Bị & Pháp Bảo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {renderEquippedItem('weapon', <Swords size={20} className="text-slate-400" />, 'Vũ Khí')}
              {renderEquippedItem('armor', <Shield size={20} className="text-slate-400" />, 'Y Phục')}
              {renderEquippedItem('artifact', <Sparkles size={20} className="text-slate-400" />, 'Pháp Bảo')}
          </div>
      </div>

      {/* TABS */}
      <div className="flex space-x-4 mb-4 border-b border-slate-700 pb-2">
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
            <Hammer size={18} /> <span>Chế Tạo</span>
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
                            <div className="flex-1 pr-2">
                                <h3 className={`font-bold ${item.rarity === 'rare' ? 'text-purple-400' : item.rarity === 'uncommon' ? 'text-blue-400' : 'text-slate-200'}`}>{item.name}</h3>
                                <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                                {/* Show Stats for Equipment in Inventory */}
                                {item.type === 'equipment' && item.stats && (
                                    <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-indigo-300 bg-indigo-900/20 px-1 py-0.5 rounded w-fit">
                                        {item.stats.attack && <span>Công:{item.stats.attack}</span>}
                                        {item.stats.defense && <span>Thủ:{item.stats.defense}</span>}
                                        {item.stats.constitution && <span className="text-green-400 flex items-center"><Heart size={8} className="mr-0.5"/>{item.stats.constitution}</span>}
                                        {item.stats.strength && <span className="text-amber-400 flex items-center"><Swords size={8} className="mr-0.5"/>{item.stats.strength}</span>}
                                        {item.stats.spirit && <span className="text-purple-400 flex items-center"><Zap size={8} className="mr-0.5"/>{item.stats.spirit}</span>}
                                    </div>
                                )}
                                <span className="text-xs bg-slate-900 px-2 py-0.5 rounded mt-2 inline-block text-slate-300">
                                    Số lượng: {item.quantity}
                                </span>
                            </div>
                            <div className="flex flex-col gap-2">
                                {item.type === 'consumable' && (
                                    <button 
                                        onClick={() => dispatch({ type: 'USE_ITEM', payload: item.id })}
                                        className="bg-slate-700 hover:bg-slate-600 text-xs px-3 py-1 rounded text-white border border-slate-600"
                                    >
                                        Dùng
                                    </button>
                                )}
                                {item.type === 'equipment' && (
                                    <button 
                                        onClick={() => dispatch({ type: 'EQUIP_ITEM', payload: item.id })}
                                        className="bg-indigo-700 hover:bg-indigo-600 text-xs px-3 py-1 rounded text-white border border-indigo-600"
                                    >
                                        Trang bị
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}

        {activeTab === 'crafting' && (
             <div className="space-y-4">
                 <div className="bg-ink-800 p-4 rounded border border-slate-700 mb-4 sticky top-0 z-10 shadow-lg">
                     <h3 className="text-sm font-bold text-slate-300 mb-2">Tài Nguyên Hiện Có</h3>
                     <div className="flex space-x-4 text-sm flex-wrap gap-y-2">
                         <span className="text-jade-400">Linh Thảo: {state.resources.herbs}</span>
                         <span className="text-slate-400">Khoáng Thạch: {state.resources.ores}</span>
                         <span className="text-spirit-gold">Linh Thạch: {state.resources.spiritStones}</span>
                     </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                    {CRAFTABLE_ITEMS.map((item) => {
                        const canCraft = 
                            state.resources.herbs >= (item.cost?.herbs || 0) &&
                            state.resources.ores >= (item.cost?.ores || 0) &&
                            state.resources.spiritStones >= (item.cost?.spiritStones || 0);

                        return (
                            <div key={item.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className={`font-bold ${item.type === 'equipment' ? 'text-spirit-gold' : 'text-jade-300'}`}>{item.name}</h3>
                                        {item.type === 'equipment' && <span className="text-[10px] uppercase bg-indigo-900 text-indigo-300 px-1 rounded">Trang bị</span>}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                                    
                                    <div className="mt-3 text-xs space-y-1">
                                        {item.cost?.herbs && <div className={state.resources.herbs < item.cost.herbs ? 'text-red-400' : 'text-slate-300'}>- {item.cost.herbs} Linh Thảo</div>}
                                        {item.cost?.ores && <div className={state.resources.ores < item.cost.ores ? 'text-red-400' : 'text-slate-300'}>- {item.cost.ores} Khoáng Thạch</div>}
                                        {item.cost?.spiritStones && <div className={state.resources.spiritStones < item.cost.spiritStones ? 'text-red-400' : 'text-slate-300'}>- {item.cost.spiritStones} Linh Thạch</div>}
                                    </div>
                                </div>
                                <button 
                                    disabled={!canCraft}
                                    onClick={() => dispatch({ type: 'CRAFT_ITEM', payload: { itemId: item.id, cost: item.cost || {} } })}
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