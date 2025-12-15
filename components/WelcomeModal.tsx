import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Sparkles, Scroll } from 'lucide-react';

const WelcomeModal: React.FC = () => {
  const { dispatch } = useGame();
  const [name, setName] = useState('');

  const handleStart = () => {
    if (name.trim()) {
      dispatch({ type: 'SET_PLAYER_NAME', payload: name.trim() });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-ink-900 border-2 border-jade-600 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(16,185,129,0.2)] text-center relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-jade-500 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-jade-500 to-transparent"></div>
        
        <div className="mb-6 flex justify-center">
            <div className="bg-slate-800 p-4 rounded-full border border-slate-700 shadow-xl">
                <Sparkles size={48} className="text-jade-400 animate-pulse" />
            </div>
        </div>

        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-jade-400 to-spirit-gold font-serif mb-2">
          Cửu Giới Bất Hủ
        </h1>
        <p className="text-slate-400 text-sm mb-8 italic">
          "Đại đạo vô hình, sinh dục thiên địa..."
        </p>

        <div className="space-y-4">
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
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
          />
          
          <button
            onClick={handleStart}
            disabled={!name.trim()}
            className="w-full bg-gradient-to-r from-jade-700 to-jade-500 hover:from-jade-600 hover:to-jade-400 text-white font-bold py-3 rounded-lg shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Scroll size={20} />
            <span>Bước Vào Tu Tiên Giới</span>
          </button>
        </div>

        <div className="mt-6 text-xs text-slate-600">
          *Dữ liệu game sẽ được lưu tự động trên trình duyệt này.
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;