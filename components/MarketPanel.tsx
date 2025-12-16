import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { GAME_ITEMS } from '../constants';
import { Store, Coins, ShoppingBag, ArrowRightLeft } from 'lucide-react';

const MarketPanel: React.FC = () => {
  const { state, dispatch } = useGame();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState<number>(1);

  // Filter items that can be bought (have a price)
  const buyableItems = GAME_ITEMS.filter(item => item.price > 0);

  // Filter items in inventory that can be sold
  const sellableItems = state.inventory.filter(item => {
     // Check if item definition exists and has price
     const def = GAME_ITEMS.find(i => i.id === item.id);
     return def && def.price > 0;
  });

  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
       <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg mb-6 flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-spirit-gold flex items-center">
                    <Store className="mr-2" /> Linh Thạch Phường
                </h2>
                <p className="text-xs text-slate-400">Nơi giao dịch vật phẩm bằng Linh Thạch.</p>
            </div>
            <div className="text-right">
                <p className="text-sm text-slate-400">Tài sản hiện có</p>
                <p className="text-xl font-bold text-spirit-gold flex items-center justify-end">
                    <Coins size={20} className="mr-1"/> {isNaN(state.resources.spiritStones) ? 0 : state.resources.spiritStones.toLocaleString()}
                </p>
            </div>
       </div>

       {/* Tabs */}
       <div className="flex space-x-4 mb-4 border-b border-slate-700 pb-2">
            <button 
                onClick={() => setActiveTab('buy')}
                className={`flex items-center space-x-2 pb-2 px-2 ${activeTab === 'buy' ? 'text-green-400 border-b-2 border-green-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
                <ShoppingBag size={18} /> <span>Mua Vật Phẩm</span>
            </button>
            <button 
                onClick={() => setActiveTab('sell')}
                className={`flex items-center space-x-2 pb-2 px-2 ${activeTab === 'sell' ? 'text-red-400 border-b-2 border-red-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
                <ArrowRightLeft size={18} /> <span>Bán Vật Phẩm</span>
            </button>
       </div>

       <div className="flex-1 overflow-y-auto">
           {activeTab === 'buy' && (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {buyableItems.map(item => (
                       <div key={item.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col justify-between">
                           <div>
                               <h3 className="font-bold text-white">{item.name}</h3>
                               <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                               <p className="mt-2 text-spirit-gold font-bold text-sm">Giá: {item.price} Linh Thạch</p>
                           </div>
                           <button 
                                onClick={() => dispatch({ type: 'BUY_ITEM', payload: { itemId: item.id, amount: 1 } })}
                                disabled={state.resources.spiritStones < item.price}
                                className={`mt-4 w-full py-2 rounded text-sm font-bold transition-colors
                                    ${state.resources.spiritStones < item.price 
                                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                                        : 'bg-green-700 hover:bg-green-600 text-white shadow-lg'}`}
                           >
                               Mua (1)
                           </button>
                       </div>
                   ))}
               </div>
           )}

           {activeTab === 'sell' && (
               <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sellableItems.length === 0 && (
                            <div className="col-span-full text-center text-slate-500 italic py-10">Không có vật phẩm nào để bán.</div>
                        )}
                        {sellableItems.map(item => {
                             const itemDef = GAME_ITEMS.find(i => i.id === item.id);
                             const sellPrice = Math.floor((itemDef?.price || 0) * 0.5);
                             return (
                                <div key={item.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between">
                                            <h3 className="font-bold text-white">{item.name}</h3>
                                            <span className="text-xs bg-slate-900 px-2 py-1 rounded">x{item.quantity}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                                        <p className="mt-2 text-slate-300 text-sm">Giá thu mua: <span className="text-spirit-gold font-bold">{sellPrice}</span> / cái</p>
                                    </div>
                                    <button 
                                            onClick={() => dispatch({ type: 'SELL_ITEM', payload: { itemId: item.id, amount: 1 } })}
                                            className="mt-4 w-full py-2 rounded text-sm font-bold bg-slate-700 hover:bg-red-900/50 text-red-300 border border-slate-600 hover:border-red-500 transition-colors"
                                    >
                                        Bán (1)
                                    </button>
                                </div>
                             )
                        })}
                    </div>
               </div>
           )}
       </div>
    </div>
  );
};

export default MarketPanel;