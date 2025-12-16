import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Sparkles, Scroll, ShieldCheck, Flame, ArrowRight } from 'lucide-react';
import { CultivationPath } from '../types';

const WelcomeModal: React.FC = () => {
  const { state, dispatch } = useGame();
  
  // Check if this is a legacy user (has name but no path)
  const isLegacyUser = state.playerName !== 'Đạo Hữu Vô Danh';

  // If user already has a name, skip directly to step 2 (Choose Path)
  const [step, setStep] = useState<1 | 2>(isLegacyUser ? 2 : 1);
  const [name, setName] = useState(isLegacyUser ? state.playerName : '');
  const [selectedPath, setSelectedPath] = useState<CultivationPath>('none');

  const handleNextStep = () => {
    if (name.trim()) {
      setName(name.trim());
      setStep(2);
    }
  };

  const handleStartGame = () => {
    if (selectedPath !== 'none') {
        // Only update name if it was the default one (new player)
        if (!isLegacyUser) {
            dispatch({ type: 'SET_PLAYER_NAME', payload: name });
        }
        dispatch({ type: 'CHOOSE_PATH', payload: selectedPath });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-ink-900 border-2 border-slate-600 rounded-2xl p-6 md:p-8 max-w-2xl w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center relative overflow-hidden">
        
        {/* Step Indicator */}
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
            <div 
                className="h-full bg-jade-500 transition-all duration-500" 
                style={{ width: step === 1 ? '50%' : '100%' }}
            ></div>
        </div>

        <div className="mb-6 flex justify-center mt-4">
            <div className="bg-slate-800 p-4 rounded-full border border-slate-700 shadow-xl">
                <Sparkles size={48} className="text-jade-400 animate-pulse" />
            </div>
        </div>

        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-jade-400 to-spirit-gold font-serif mb-2">
          {isLegacyUser ? 'Cập Nhật Đạo Tâm' : 'Cửu Giới Bất Hủ'}
        </h1>
        <p className="text-slate-400 text-sm mb-8 italic">
          {isLegacyUser 
            ? `Chào mừng đạo hữu ${state.playerName} trở lại. Xin hãy định hình Đạo Tâm.` 
            : "Đại đạo vô hình, sinh dục thiên địa..."}
        </p>

        {/* STEP 1: ENTER NAME (Hidden for legacy users) */}
        {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
                <div className="text-left text-sm font-bold text-slate-300 ml-1">
                    Nhập Đạo Hiệu (Tên Nhân Vật):
                </div>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Vd: Hàn Lập, Tiêu Viêm..."
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-jade-500 focus:ring-1 focus:ring-jade-500 transition-all placeholder:text-slate-600"
                    autoFocus
                    maxLength={18}
                    onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
                />
                
                <button
                    onClick={handleNextStep}
                    disabled={!name.trim()}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg shadow-lg transform transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                    <span>Tiếp Tục</span>
                    <ArrowRight size={18} />
                </button>
            </div>
        )}

        {/* STEP 2: CHOOSE PATH */}
        {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
                <div className="text-center text-sm font-bold text-slate-300 mb-4">
                    Chọn Con Đường Tu Luyện (Đạo Tâm):
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Righteous Path */}
                    <button
                        onClick={() => setSelectedPath('righteous')}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 relative overflow-hidden group
                            ${selectedPath === 'righteous' 
                                ? 'bg-indigo-900/40 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)]' 
                                : 'bg-slate-800 border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/80'}`}
                    >
                        <ShieldCheck size={32} className={`mb-2 ${selectedPath === 'righteous' ? 'text-indigo-400' : 'text-slate-500 group-hover:text-indigo-400'}`} />
                        <h3 className={`font-bold text-lg ${selectedPath === 'righteous' ? 'text-indigo-300' : 'text-slate-300'}`}>Chính Đạo</h3>
                        <div className="text-xs text-slate-400 space-y-1">
                            <p className="text-green-400">+20% Tụ Khí Tự Động</p>
                            <p className="text-green-400">+30% Phòng Thủ</p>
                            <p className="italic mt-2 text-slate-500">"Tâm như chỉ thủy, vạn pháp bất xâm."</p>
                        </div>
                    </button>

                    {/* Devil Path */}
                    <button
                        onClick={() => setSelectedPath('devil')}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 relative overflow-hidden group
                            ${selectedPath === 'devil' 
                                ? 'bg-red-900/40 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
                                : 'bg-slate-800 border-slate-700 hover:border-red-500/50 hover:bg-slate-800/80'}`}
                    >
                        <Flame size={32} className={`mb-2 ${selectedPath === 'devil' ? 'text-red-500' : 'text-slate-500 group-hover:text-red-500'}`} />
                        <h3 className={`font-bold text-lg ${selectedPath === 'devil' ? 'text-red-400' : 'text-slate-300'}`}>Ma Đạo</h3>
                        <div className="text-xs text-slate-400 space-y-1">
                            <p className="text-green-400">+20% Tụ Khí Khi Click</p>
                            <p className="text-green-400">+20% Tỷ Lệ Rơi Đồ</p>
                            <p className="italic mt-2 text-slate-500">"Ngã mệnh do ngã bất do thiên."</p>
                        </div>
                    </button>
                </div>

                <button
                    onClick={handleStartGame}
                    disabled={selectedPath === 'none'}
                    className={`w-full font-bold py-3 rounded-lg shadow-lg transform transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2
                        ${selectedPath === 'righteous' ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 
                          selectedPath === 'devil' ? 'bg-red-700 hover:bg-red-600 text-white' : 
                          'bg-slate-700 text-slate-400'}`}
                >
                    <Scroll size={20} />
                    <span>{isLegacyUser ? 'Xác Nhận Đạo Tâm' : 'Bước Vào Tu Tiên Giới'}</span>
                </button>
            </div>
        )}

        <div className="mt-6 text-xs text-slate-600">
          *Dữ liệu game sẽ được lưu tự động trên trình duyệt này.
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;