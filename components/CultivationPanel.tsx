import React from 'react';
import { useGame } from '../context/GameContext';
import { Zap, Shield, ArrowUpCircle, Flame, ShieldCheck } from 'lucide-react';

const CultivationPanel: React.FC = () => {
  const { state, dispatch, getCurrentRealm } = useGame();
  const realm = getCurrentRealm();
  
  const progressPercent = Math.min(100, (state.resources.qi / realm.maxQiCap) * 100);
  const canBreakthrough = state.resources.qi >= realm.maxQiCap;

  // Render Path Icon
  const PathIcon = state.cultivationPath === 'devil' ? Flame : ShieldCheck;
  const pathColor = state.cultivationPath === 'devil' ? 'text-red-500' : 'text-indigo-400';
  const pathName = state.cultivationPath === 'devil' ? 'Ma Đạo' : 'Chính Đạo';
  const pathBg = state.cultivationPath === 'devil' ? 'bg-red-900/30 border-red-900' : 'bg-indigo-900/30 border-indigo-900';

  return (
    <div className="h-full flex flex-col items-center justify-start p-4 md:p-8 space-y-8 animate-fadeIn">
      {/* Realm Badge */}
      <div className="relative group mt-4">
        <div className={`absolute -inset-1 bg-gradient-to-r ${state.cultivationPath === 'devil' ? 'from-red-600 to-orange-600' : 'from-jade-500 to-indigo-500'} rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200`}></div>
        <div className="relative bg-ink-800 rounded-full w-52 h-52 flex flex-col items-center justify-center border-4 border-slate-700 shadow-2xl">
            {state.cultivationPath !== 'none' && (
                <div className={`absolute -top-4 px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 shadow-lg ${pathBg} ${pathColor}`}>
                    <PathIcon size={12} /> {pathName}
                </div>
            )}
            
            <span className="text-slate-400 text-sm font-serif mb-1 mt-2">Cảnh Giới</span>
            <span className="text-2xl font-bold text-white text-center px-2">{realm.name}</span>
            <div className="mt-3 flex space-x-4 text-xs text-slate-400">
                <span className="flex items-center gap-1" title="Tấn công">
                    <Zap size={14} className="text-spirit-gold"/> 
                    {realm.attack}
                </span>
                <span className="flex items-center gap-1" title="Phòng thủ">
                    <Shield size={14} className="text-blue-400"/> 
                    {/* Visual fix: show modified def if righteous */}
                    {state.cultivationPath === 'righteous' 
                        ? <span className="text-indigo-300">{Math.floor(realm.defense * 1.3)}</span> 
                        : realm.defense
                    }
                </span>
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
                className={`h-4 rounded-full transition-all duration-300 ease-out bg-gradient-to-r ${state.cultivationPath === 'devil' ? 'from-red-700 to-orange-600' : 'from-jade-700 to-jade-500'}`}
                style={{ width: `${progressPercent}%` }}
            ></div>
            {/* Shimmer effect */}
            <div className="absolute top-0 left-0 w-full h-full bg-white opacity-5 animate-[shimmer_2s_infinite]"></div>
        </div>
        <div className="text-xs text-center text-slate-500">
            Tự động hấp thụ: +{realm.baseQiGeneration * (state.cultivationPath === 'righteous' ? 1.2 : 1)}/s
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
                <span>Tụ Khí (+{(1 + realm.baseQiGeneration) * (state.cultivationPath === 'devil' ? 1.2 : 1)})</span>
            </button>
        )}
      </div>

      {/* Flavor Text */}
      <div className="max-w-md text-center text-slate-500 text-sm italic font-serif">
         {state.cultivationPath === 'devil' 
            ? "\"Muốn thành đại đạo, phải dám đi ngược ý trời, đạp lên xương máu mà đi.\"" 
            : "\"Người tu tiên phải nghịch thiên cải mệnh, nhưng tâm phải sáng, chí phải bền.\""}
      </div>
    </div>
  );
};

export default CultivationPanel;