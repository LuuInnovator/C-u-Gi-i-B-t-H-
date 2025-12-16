import React from 'react';
import { useGame } from '../context/GameContext';
import { Archive, Package, ArrowRight, ArrowLeft } from 'lucide-react';

const StashPanel: React.FC = () => {
  const { state, dispatch } = useGame();

  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
       <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg mb-6 flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-spirit-gold flex items-center gap-2">
                    <Archive size={24} /> Tàng Bảo Các (Kho Vĩnh Viễn)
                </h2>
                <p className="text-xs text-slate-400">Vật phẩm trong kho sẽ <span className="text-jade-400 font-bold">không bị mất</span> khi Phi Thăng.</p>
            </div>
            <div className="text-right">
                <span className="text-sm bg-slate-900 px-3 py-1 rounded border border-slate-600">
                    Sức chứa: {state.stash.length} / ∞
                </span>
            </div>
       </div>

       <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
            {/* INVENTORY (LEFT) */}
            <div className="flex flex-col bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden">
                <div className="p-3 bg-slate-800 border-b border-slate-700 font-bold text-slate-300 flex items-center gap-2">
                    <Package size={16}/> Túi Đồ (Sẽ bị Reset)
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {state.inventory.length === 0 && <p className="text-center text-slate-500 italic text-sm mt-4">Túi trống.</p>}
                    {state.inventory.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-slate-800 p-2 rounded border border-slate-700/50">
                            <div>
                                <div className="text-sm font-bold text-slate-300">{item.name}</div>
                                <div className="text-xs text-slate-500">x{item.quantity}</div>
                            </div>
                            <button 
                                onClick={() => dispatch({ type: 'DEPOSIT_STASH', payload: { itemId: item.id, amount: 1 } })}
                                className="bg-indigo-900 hover:bg-indigo-800 text-indigo-200 p-1.5 rounded transition-colors"
                                title="Cất vào kho"
                            >
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* STASH (RIGHT) */}
            <div className="flex flex-col bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden">
                <div className="p-3 bg-slate-800 border-b border-slate-700 font-bold text-spirit-gold flex items-center gap-2">
                    <Archive size={16}/> Kho Chứa
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {state.stash.length === 0 && <p className="text-center text-slate-500 italic text-sm mt-4">Kho trống.</p>}
                    {state.stash.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-slate-800 p-2 rounded border border-spirit-gold/20">
                            <div>
                                <div className="text-sm font-bold text-spirit-gold">{item.name}</div>
                                <div className="text-xs text-slate-500">x{item.quantity}</div>
                            </div>
                            <button 
                                onClick={() => dispatch({ type: 'WITHDRAW_STASH', payload: { itemId: item.id, amount: 1 } })}
                                className="bg-slate-700 hover:bg-slate-600 text-slate-200 p-1.5 rounded transition-colors"
                                title="Lấy ra"
                            >
                                <ArrowLeft size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
       </div>
    </div>
  );
};

export default StashPanel;