import React from 'react';
import { useGame } from '../context/GameContext';
import { Zap, Shield, ArrowUpCircle } from 'lucide-react';

const CultivationPanel: React.FC = () => {
  const { state, dispatch, getCurrentRealm } = useGame();
  const realm = getCurrentRealm();
  
  const progressPercent = Math.min(100, (state.resources.qi / realm.maxQiCap) * 100);
  const canBreakthrough = state.resources.qi >= realm.maxQiCap;

  return (
    <div className="h-full flex flex-col items-center justify-start p-4 md:p-8 space-y-8 animate-fadeIn">
      {/* Realm Badge */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-jade-500 to-mystic-purple rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-ink-800 rounded-full w-48 h-48 flex flex-col items-center justify-center border-4 border-slate-700 shadow-2xl">
            <span className="text-slate-400 text-sm font-serif mb-1">Cảnh Giới</span>
            <span className="text-2xl font-bold text-white text-center px-2">{realm.name}</span>
            <div className="mt-2 flex space-x-2 text-xs text-slate-400">
                <span className="flex items-center"><Zap size={12} className="mr-1 text-spirit-gold"/> {realm.attack}</span>
                <span className="flex items-center"><Shield size={12} className="mr-1 text-blue-400"/> {realm.defense}</span>
            </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md space-y-2">
        <div className="flex justify-between text-sm text-slate-300">
            <span>Linh Khí</span>
            <span>{Math.floor(state.resources.qi).toLocaleString()} / {realm.maxQiCap.toLocaleString()}</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-4 border border-slate-700 overflow-hidden relative">
            <div 
                className="bg-gradient-to-r from-jade-700 to-jade-500 h-4 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
            ></div>
            {/* Shimmer effect */}
            <div className="absolute top-0 left-0 w-full h-full bg-white opacity-5 animate-[shimmer_2s_infinite]"></div>
        </div>
        <div className="text-xs text-center text-slate-500">
            Tự động hấp thụ: +{realm.baseQiGeneration}/s
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col space-y-4 w-full max-w-xs">
        {canBreakthrough ? (
             <button 
                onClick={() => dispatch({ type: 'ATTEMPT_BREAKTHROUGH' })}
                className="w-full py-4 bg-gradient-to-r from-spirit-gold to-yellow-600 rounded-xl font-bold text-white shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 border-2 border-yellow-400 animate-pulse"
            >
                <ArrowUpCircle size={24} />
                <span>Đột Phá ({Math.floor(realm.breakthroughChance * 100)}%)</span>
            </button>
        ) : (
            <button 
                onClick={() => dispatch({ type: 'GATHER_QI' })}
                className="w-full py-4 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 rounded-xl font-bold text-jade-400 shadow-lg transform hover:-translate-y-1 active:translate-y-0 transition-all duration-100 flex items-center justify-center space-x-2 border border-slate-600"
            >
                <Zap size={20} />
                <span>Tụ Khí (+{1 + realm.baseQiGeneration})</span>
            </button>
        )}
      </div>

      {/* Flavor Text */}
      <div className="max-w-md text-center text-slate-500 text-sm italic font-serif">
         "Người tu tiên phải nghịch thiên cải mệnh, mỗi bước đi đều gian nan trắc trở. Hãy kiên trì tịnh tâm."
      </div>
    </div>
  );
};

export default CultivationPanel;