import React from 'react';
import { useGame } from '../context/GameContext';
import { ShieldCheck, Flame, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { CultivationPath } from '../types';

interface AscensionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AscensionModal: React.FC<AscensionModalProps> = ({ isOpen, onClose }) => {
    const { state, dispatch } = useGame();
    if (!isOpen) return null;

    // Tính toán Tinh Hoa nhận được
    const totalStatBonuses = (state.statBonuses.attack || 0) + (state.statBonuses.defense || 0) + ((state.statBonuses.hp - 100) / 10 || 0);
    const essenceReward = 100 + Math.floor(totalStatBonuses / 20);

    const handleAscend = (path: CultivationPath) => {
        if (window.confirm("BẠN CHẮC CHẮN CHỨ?\n\nToàn bộ Cảnh giới, Túi đồ, Tài nguyên sẽ bị RESET.\nChỉ giữ lại Tinh Hoa và Thiên Phú.\n\nHành động này không thể hoàn tác!")) {
            dispatch({ type: 'ASCEND', payload: { path } });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fadeIn">
            <div className="bg-ink-900 border-2 border-spirit-gold rounded-2xl max-w-3xl w-full shadow-[0_0_100px_rgba(245,158,11,0.3)] relative overflow-hidden flex flex-col md:flex-row">
                
                {/* Left Side: Info */}
                <div className="p-8 md:w-1/2 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-700 bg-slate-900/50">
                    <div className="flex justify-center mb-6">
                        <div className="bg-spirit-gold/20 p-6 rounded-full border-2 border-spirit-gold animate-pulse">
                            <Sparkles size={48} className="text-spirit-gold" />
                        </div>
                    </div>
                    
                    <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-spirit-gold to-yellow-200 font-serif mb-4">
                        Thiên Đạo Viên Mãn
                    </h2>
                    
                    <p className="text-slate-300 text-center text-sm mb-6 leading-relaxed">
                        Chúc mừng đạo hữu đã đạt tới đỉnh cao của thế giới này. 
                        Thiên Đạo cảm ứng, giáng xuống <span className="text-spirit-gold font-bold">Thần Phạt</span> để khảo nghiệm.
                        <br/><br/>
                        Vượt qua Thiên Môn, rũ bỏ phàm trần, bước vào luân hồi để đạt được sức mạnh vĩnh hằng.
                    </p>

                    <div className="bg-black/40 p-4 rounded-lg border border-slate-700 mb-6">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Phần thưởng Luân Hồi:</h3>
                        <div className="flex justify-between items-center text-sm">
                            <span>Tinh Hoa Thiên Đạo:</span>
                            <span className="text-spirit-gold font-bold text-xl">+{essenceReward}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 italic">*Dựa trên Chỉ số gốc đã bồi dưỡng.</p>
                    </div>

                    <div className="bg-red-900/20 p-3 rounded border border-red-500/30 flex items-start gap-2">
                        <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="text-[11px] text-red-300">
                            <span className="font-bold">CẢNH BÁO:</span> Phi thăng sẽ RESET Cảnh Giới, Tài Nguyên và Túi Đồ về trạng thái ban đầu. Chỉ giữ lại Thiên Phú.
                        </div>
                    </div>
                </div>

                {/* Right Side: Choice */}
                <div className="p-8 md:w-1/2 bg-gradient-to-br from-slate-900 to-ink-900 flex flex-col justify-center gap-4">
                    <h3 className="text-center text-lg font-bold text-slate-300 mb-2">Chọn Con Đường Kế Tiếp</h3>
                    
                    {/* Righteous Choice */}
                    <button 
                        onClick={() => handleAscend('righteous')}
                        className="group relative overflow-hidden bg-indigo-900/30 hover:bg-indigo-900/50 border border-indigo-500/50 hover:border-indigo-400 p-6 rounded-xl text-left transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                    >
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="bg-indigo-500/20 p-3 rounded-full group-hover:bg-indigo-500/40 transition-colors">
                                <ShieldCheck size={32} className="text-indigo-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-xl text-indigo-300">Phi Thăng Tiên Giới</h4>
                                <p className="text-xs text-indigo-200/70 mt-1">Tiếp tục Chính Đạo. Buff Tu Luyện & Phòng Thủ.</p>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="text-indigo-400" />
                        </div>
                    </button>

                    {/* Devil Choice */}
                    <button 
                        onClick={() => handleAscend('devil')}
                        className="group relative overflow-hidden bg-red-900/30 hover:bg-red-900/50 border border-red-500/50 hover:border-red-400 p-6 rounded-xl text-left transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                    >
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="bg-red-500/20 p-3 rounded-full group-hover:bg-red-500/40 transition-colors">
                                <Flame size={32} className="text-red-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-xl text-red-400">Chuyển Sinh Ma Vương</h4>
                                <p className="text-xs text-red-200/70 mt-1">Đọa nhập Ma Đạo. Buff Sát Thương & Tốc Độ.</p>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="text-red-400" />
                        </div>
                    </button>

                    <button onClick={onClose} className="mt-4 text-slate-500 hover:text-slate-300 text-sm underline">
                        Ta vẫn còn luyến tiếc hồng trần (Hủy)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AscensionModal;