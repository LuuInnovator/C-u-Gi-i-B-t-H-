import React, { useState, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { ScrollText, Trash2, Save, Download, Upload } from 'lucide-react';

const SettingsPanel: React.FC = () => {
  const { state, saveGame } = useGame();
  const [saveStatus, setSaveStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
      if (window.confirm("CẢNH BÁO: Bạn có chắc chắn muốn 'Trọng Sinh' (Xóa toàn bộ dữ liệu) không? Hành động này không thể hoàn tác!")) {
          localStorage.removeItem('cuu-gioi-bat-hu-save');
          window.location.reload();
      }
  };

  const handleManualSave = () => {
      saveGame();
      setSaveStatus('Đã lưu!');
      setTimeout(() => setSaveStatus(''), 2000);
  };

  // Export Save File
  const handleExport = () => {
      const dataStr = JSON.stringify(state);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `CuuGioiBatHu_Save_${new Date().toISOString().slice(0,10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
  };

  // Import Save File
  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const fileObj = event.target.files && event.target.files[0];
      if (!fileObj) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const jsonStr = e.target?.result as string;
              // Basic validation check
              const parsed = JSON.parse(jsonStr);
              if (!parsed.resources || !parsed.playerName) {
                  throw new Error("File không hợp lệ");
              }

              if (window.confirm("Bạn có chắc chắn muốn nạp dữ liệu từ file này? Dữ liệu hiện tại sẽ bị ghi đè.")) {
                  localStorage.setItem('cuu-gioi-bat-hu-save', jsonStr);
                  window.location.reload();
              }
          } catch (err) {
              alert("Lỗi: File lưu trữ bị hỏng hoặc không đúng định dạng.");
          }
      };
      reader.readAsText(fileObj);
      // Reset input value so same file can be selected again if needed
      event.target.value = '';
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
       <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col gap-6">
            <div className="text-sm text-slate-400 border-b border-slate-700 pb-4">
                <p>Đạo Hiệu: <span className="text-jade-400 font-bold text-lg">{state.playerName}</span></p>
                <p>Phiên bản: <span className="text-slate-500">Alpha 1.0.5 (Export/Import)</span></p>
                <p className="mt-2 text-xs text-slate-500 italic">Dữ liệu được lưu tại trình duyệt này.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Manual Save */}
                <button 
                    onClick={handleManualSave}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors text-sm shadow-lg font-bold"
                >
                    <Save size={18} />
                    <span>{saveStatus || "Lưu Thủ Công"}</span>
                </button>

                {/* Reset Data */}
                <button 
                    onClick={handleReset}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-900/30 border border-red-700/50 hover:bg-red-900/50 text-red-400 rounded transition-colors text-sm font-bold"
                >
                    <Trash2 size={18} />
                    <span>Trọng Sinh (Xóa Data)</span>
                </button>

                {/* Export Data */}
                <button 
                    onClick={handleExport}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-jade-400 border border-slate-600 rounded transition-colors text-sm font-bold"
                >
                    <Download size={18} />
                    <span>Xuất File Lưu</span>
                </button>

                {/* Import Data */}
                <button 
                    onClick={handleImportClick}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-spirit-gold border border-slate-600 rounded transition-colors text-sm font-bold"
                >
                    <Upload size={18} />
                    <span>Nhập File Lưu</span>
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".json" 
                    className="hidden" 
                />
            </div>
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