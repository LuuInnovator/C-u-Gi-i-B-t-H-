import React from 'react';
import { useGame } from '../context/GameContext';
import { Mountain, Skull, Heart, Gem, Leaf } from 'lucide-react';

const ExplorationPanel: React.FC = () => {
  const { state, dispatch, getCurrentRealm } = useGame();
  const realm = getCurrentRealm();

  const hpPercent = (state.hp / state.maxHp) * 100;

  return (
    <div className="p-4 md:p-8 h-full flex flex-col space-y-6">
      {/* Status Bar */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
        <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-lg text-slate-200 flex items-center">
                <Mountain className="mr-2 text-indigo-400" /> Thám Hiểm
            </h2>
            <div className="text-sm text-slate-400">
                {state.isExploring ? <span className="text-green-400 animate-pulse">● Đang thám hiểm</span> : <span className="text-slate-500">● Đang nghỉ ngơi</span>}
            </div>
        </div>

        {/* HP Bar */}
        <div className="w-full bg-slate-900 rounded-full h-3 mb-4 relative overflow-hidden">
            <div 
                className="bg-red-600 h-full transition-all duration-500"
                style={{ width: `${hpPercent}%` }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md">
                {Math.ceil(state.hp)} / {Math.ceil(state.maxHp)} HP
            </div>
        </div>
        
        <div className="flex justify-between text-xs text-slate-400">
             <span>Linh Thảo: <span className="text-jade-400">{state.resources.herbs}</span></span>
             <span>Linh Thạch: <span className="text-spirit-gold">{state.resources.spiritStones}</span></span>
             <span>Khoáng: <span className="text-slate-300">{state.resources.ores}</span></span>
        </div>
      </div>

      {/* Main Action */}
      <div className="flex justify-center">
        {state.isExploring ? (
            <button 
                onClick={() => dispatch({ type: 'STOP_EXPLORATION' })}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 px-8 py-3 rounded-lg font-bold transition-all w-full max-w-sm"
            >
                Thu Về Động Phủ
            </button>
        ) : (
            <button 
                onClick={() => dispatch({ type: 'START_EXPLORATION' })}
                disabled={state.hp < state.maxHp * 0.2}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-all w-full max-w-sm"
            >
                {state.hp < state.maxHp * 0.2 ? "Cần Hồi Phục..." : "Xuất Sơn Thám Hiểm"}
            </button>
        )}
      </div>

      {/* Log Feed */}
      <div className="flex-1 bg-ink-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
        <div className="p-2 bg-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Nhật Ký Hành Trình
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm">
            {state.logs.length === 0 && (
                <div className="text-center text-slate-600 italic mt-10">Chưa có sự kiện nào...</div>
            )}
            {state.logs.map((log) => {
                let colorClass = 'text-slate-400';
                if (log.type === 'combat') colorClass = 'text-orange-400';
                if (log.type === 'success') colorClass = 'text-jade-400';
                if (log.type === 'danger') colorClass = 'text-red-400';
                if (log.type === 'warning') colorClass = 'text-yellow-400';

                return (
                    <div key={log.id} className="border-b border-slate-800/50 pb-1 last:border-0 animate-fadeIn">
                        <span className="text-slate-600 text-[10px] mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className={colorClass}>{log.message}</span>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default ExplorationPanel;