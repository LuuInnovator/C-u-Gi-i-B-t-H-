import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { SECTS } from '../constants';
import { Swords, Shield, Zap, Heart, Leaf, Skull, Ban, Clock, Lock } from 'lucide-react';

const SectPanel: React.FC = () => {
  const { state, dispatch } = useGame();
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Calculate remaining debuff time
  useEffect(() => {
    const timer = setInterval(() => {
        const remaining = Math.max(0, state.traitorDebuffEndTime - Date.now());
        setTimeLeft(remaining);
    }, 1000);
    return () => clearInterval(timer);
  }, [state.traitorDebuffEndTime]);

  const isTraitor = timeLeft > 0;
  const isWeak = state.realmIndex < 6; // Level 6 is Truc Co
  
  // Ma đạo thấy 6 phái (gồm Huyết Sát), Chính đạo thấy 5 phái thường
  const availableSects = SECTS.filter(sect => 
    !sect.reqPath || sect.reqPath === state.cultivationPath
  );

  const currentSect = SECTS.find(s => s.id === state.sectId);

  const formatTime = (ms: number) => {
      const mins = Math.floor(ms / 60000);
      const secs = Math.floor((ms % 60000) / 1000);
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getSectIcon = (id: string) => {
      switch(id) {
          case 'thai_thanh': return <Leaf className="text-green-400" size={32} />;
          case 'van_kiem': return <Swords className="text-sky-400" size={32} />;
          case 'duoc_vuong': return <Heart className="text-pink-400" size={32} />;
          case 'thien_cang': return <Shield className="text-yellow-400" size={32} />;
          case 'tieu_dao': return <Zap className="text-purple-400" size={32} />;
          case 'huyet_sat': return <Skull className="text-red-500" size={32} />;
          default: return <Shield size={32} />;
      }
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col space-y-6">
      
      {/* Status Card */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg text-center relative overflow-hidden">
        {/* Traitor Overlay if active */}
        {isTraitor && (
             <div className="absolute inset-0 bg-red-900/80 z-10 flex flex-col items-center justify-center backdrop-blur-sm animate-fadeIn">
                 <Ban size={48} className="text-red-400 mb-2" />
                 <h2 className="text-xl font-bold text-red-200">Tội Đồ Phản Phái</h2>
                 <p className="text-red-300 text-sm mt-1">Bị thế nhân phỉ nhổ, không thể gia nhập môn phái khác.</p>
                 <div className="mt-3 bg-black/40 px-4 py-2 rounded-full flex items-center gap-2 text-white font-mono">
                     <Clock size={16} /> {formatTime(timeLeft)}
                 </div>
             </div>
        )}

        {/* Realm Requirement Overlay */}
        {isWeak && !currentSect && (
             <div className="absolute inset-0 bg-slate-900/80 z-10 flex flex-col items-center justify-center backdrop-blur-sm animate-fadeIn px-6">
                 <Lock size={48} className="text-slate-500 mb-2" />
                 <h2 className="text-xl font-bold text-slate-300">Chưa Đủ Tư Cách</h2>
                 <p className="text-slate-400 text-sm mt-1">Thân phận thấp kém, các Tông Môn chưa để mắt tới.</p>
                 <p className="text-spirit-gold text-sm font-bold mt-2">Yêu cầu: Cảnh giới Trúc Cơ</p>
             </div>
        )}

        <h2 className="text-xl font-bold text-spirit-gold mb-2 font-serif">Tông Môn Lệnh Bài</h2>
        {currentSect ? (
            <div>
                <div className="flex justify-center my-4">{getSectIcon(currentSect.id)}</div>
                <p className="text-lg font-bold text-white">Đệ tử của <span className="text-jade-400">{currentSect.name}</span></p>
                <p className="text-sm text-slate-400 mt-2 italic">"{currentSect.bonusDescription}"</p>
                <button 
                    onClick={() => {
                        if(window.confirm('CẢNH BÁO: Phản bội tông môn sẽ bị TRỪNG PHẠT:\n\n- Giảm 50% tốc độ tu luyện trong 1 giờ 30 phút.\n- Không thể gia nhập phái khác trong 1 giờ 30 phút.\n\nBạn có chắc chắn muốn làm Phản Đồ?')) {
                            dispatch({ type: 'LEAVE_SECT' });
                        }
                    }}
                    className="mt-6 px-4 py-2 bg-red-900/40 hover:bg-red-900/60 border border-red-700 text-red-300 rounded text-sm transition-colors"
                >
                    Phản Bội Tông Môn
                </button>
            </div>
        ) : (
            <div>
                <p className="text-slate-400">Bạn hiện là một Tán Tu vô gia cư.</p>
                <p className="text-xs text-slate-500 mt-1">Hãy chọn một bến đỗ để phát triển con đường tu tiên.</p>
            </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Danh Sách Tông Môn</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
            {availableSects.map(sect => {
                const isCurrent = state.sectId === sect.id;
                return (
                    <div 
                        key={sect.id} 
                        className={`p-4 rounded-lg border transition-all duration-300 relative overflow-hidden group
                            ${isCurrent 
                                ? 'bg-indigo-900/30 border-jade-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                                : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="bg-slate-900 p-2 rounded-lg border border-slate-700">
                                {getSectIcon(sect.id)}
                            </div>
                            {isCurrent && <span className="text-[10px] bg-jade-900 text-jade-300 px-2 py-1 rounded-full border border-jade-700">Đang gia nhập</span>}
                        </div>
                        
                        <h4 className={`font-bold text-lg ${sect.id === 'huyet_sat' ? 'text-red-400' : 'text-slate-200'}`}>{sect.name}</h4>
                        <p className="text-xs text-slate-400 mt-1 h-10 line-clamp-2">{sect.description}</p>
                        
                        <div className="mt-4 bg-black/20 p-2 rounded border border-white/5">
                            <p className="text-xs font-bold text-spirit-gold">Nội tại tông môn:</p>
                            <p className="text-xs text-slate-300">{sect.bonusDescription}</p>
                        </div>

                        {!isCurrent && !state.sectId && (
                            <button 
                                onClick={() => dispatch({ type: 'JOIN_SECT', payload: sect.id })}
                                disabled={isTraitor || isWeak}
                                className={`mt-4 w-full py-2 text-sm rounded transition-colors
                                    ${isTraitor || isWeak
                                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700' 
                                        : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                            >
                                {isTraitor ? 'Đang Bị Truy Nã' : isWeak ? 'Cần Trúc Cơ' : 'Bái Nhập Tông Môn'}
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default SectPanel;