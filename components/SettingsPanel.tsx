import React from 'react';
import { useGame } from '../context/GameContext';
import { ScrollText, Trash2 } from 'lucide-react';

const SettingsPanel: React.FC = () => {
  const { state } = useGame();

  const handleReset = () => {
      if (window.confirm("CẢNH BÁO: Bạn có chắc chắn muốn 'Trọng Sinh' (Xóa toàn bộ dữ liệu) không? Hành động này không thể hoàn tác!")) {
          localStorage.removeItem('cuu-gioi-bat-hu-save');
          window.location.reload();
      }
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col space-y-6">
       {/* Header */}
       <div className="flex justify-between items-center border-b border-slate-700 pb-4">
            <h2 className="text-xl font-bold text-slate-200 flex items-center">
                <ScrollText className="mr-2 text-spirit-gold"/> Thiết Lập & Nhật Ký
            </h2>
       </div>

       {/* Game Info / Actions */}
       <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-400">
                <p>Đạo Hiệu: <span className="text-jade-400 font-bold">{state.playerName}</span></p>
                <p>Phiên bản: <span className="text-slate-500">Alpha 1.0.3</span></p>
            </div>
            <button 
                onClick={handleReset}
                className="flex items-center space-x-2 px-4 py-2 bg-red-900/30 border border-red-700/50 hover:bg-red-900/50 text-red-400 rounded transition-colors text-sm"
            >
                <Trash2 size={16} />
                <span>Trọng Sinh (Xóa Data)</span>
            </button>
       </div>

       {/* Logs Area */}
       <div className="flex-1 flex flex-col min-h-0">
            <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Nhật Ký Hệ Thống</h3>
            <div className="flex-1 overflow-y-auto space-y-2 bg-ink-800 p-4 rounded-lg border border-slate-700 font-mono text-sm shadow-inner">
                {state.logs.length === 0 ? (
                    <div className="text-center text-slate-600 italic py-10">Chưa có ghi chép nào...</div>
                ) : (
                    state.logs.map((log) => (
                        <div key={log.id} className="border-b border-slate-700/50 pb-2 last:border-0 hover:bg-slate-800/30 px-2 rounded">
                            <span className="text-slate-500 text-[10px] block mb-0.5">[{new Date(log.timestamp).toLocaleTimeString()}]</span> 
                            <span className={log.type === 'combat' ? 'text-orange-300' : log.type === 'success' ? 'text-jade-400' : log.type === 'danger' ? 'text-red-400' : 'text-slate-300'}>
                                {log.message}
                            </span>
                        </div>
                    ))
                )}
            </div>
       </div>
    </div>
  );
};

export default SettingsPanel;