import React, { useState, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { ScrollText, Trash2, Save, Download, Upload } from 'lucide-react';

const SettingsPanel: React.FC = () => {
  const { state, saveGame, resetGame, importSave } = useGame();
  const [saveStatus, setSaveStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
      if (window.confirm("CẢNH BÁO: Bạn có chắc chắn muốn 'Trọng Sinh' (Xóa toàn bộ dữ liệu) không? Hành động này không thể hoàn tác!")) {
          // Sử dụng hàm reset an toàn từ context
          resetGame();
      }
  };

  const handleManualSave = () => {
      saveGame();
      setSaveStatus('Đã lưu!');
      setTimeout(() => setSaveStatus(''), 2000);
  };

  // Xuất file lưu (Sử dụng Blob để tương thích tốt hơn)
  const handleExport = () => {
      try {
          // 1. Chuyển state thành chuỗi JSON
          const dataStr = JSON.stringify(state, null, 2);
          
          // 2. Tạo Blob (Binary Large Object)
          const blob = new Blob([dataStr], { type: 'application/json' });
          
          // 3. Tạo URL tạm thời
          const url = URL.createObjectURL(blob);
          
          // 4. Tạo link tải xuống và kích hoạt
          const linkElement = document.createElement('a');
          linkElement.href = url;
          linkElement.download = `CuuGioiBatHu_Save_${state.playerName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.json`;
          
          document.body.appendChild(linkElement);
          linkElement.click();
          
          // 5. Dọn dẹp
          document.body.removeChild(linkElement);
          URL.revokeObjectURL(url);
          
          setSaveStatus('Đã xuất file!');
          setTimeout(() => setSaveStatus(''), 2000);
      } catch (e) {
          alert("Lỗi khi xuất file: " + e);
      }
  };

  // Nhập file lưu
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
              // Kiểm tra cơ bản
              const parsed = JSON.parse(jsonStr);
              
              // Validate các trường quan trọng
              if (!parsed.resources || !parsed.playerName || typeof parsed.realmIndex === 'undefined') {
                  throw new Error("Cấu trúc file không hợp lệ (thiếu resources hoặc playerName)");
              }

              if (window.confirm(`Tìm thấy dữ liệu của: ${parsed.playerName} (Cảnh giới: Lv.${parsed.realmIndex}).\nBạn có muốn nạp dữ liệu này không?`)) {
                  // Sử dụng hàm import an toàn
                  importSave(jsonStr);
                  alert(`Chào mừng đạo hữu ${parsed.playerName} quay trở lại!`);
              }
          } catch (err) {
              console.error(err);
              alert("Lỗi: File lưu trữ bị hỏng, sai định dạng hoặc không phải file JSON của game.");
          }
      };
      reader.readAsText(fileObj);
      // Reset input để có thể chọn lại cùng 1 file
      event.target.value = '';
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col space-y-6">
       {/* Tiêu đề */}
       <div className="flex justify-between items-center border-b border-slate-700 pb-4">
            <h2 className="text-xl font-bold text-slate-200 flex items-center">
                <ScrollText className="mr-2 text-spirit-gold"/> Thiết Lập
            </h2>
       </div>

       {/* Thông tin Game / Hành động */}
       <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col gap-6">
            <div className="text-sm text-slate-400 border-b border-slate-700 pb-4">
                <div className="flex justify-between items-center mb-2">
                    <p>Đạo Hiệu: <span className="text-jade-400 font-bold text-lg">{state.playerName}</span></p>
                    <span className="text-xs bg-slate-900 px-2 py-1 rounded text-slate-500">v1.1.0</span>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lưu Thủ Công */}
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

                {/* Xuất Data */}
                <button 
                    onClick={handleExport}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-jade-400 border border-slate-600 rounded transition-colors text-sm font-bold"
                >
                    <Download size={18} />
                    <span>Xuất File Lưu</span>
                </button>

                {/* Nhập Data */}
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
                    accept=".json,application/json" 
                    className="hidden" 
                />
            </div>
       </div>
    </div>
  );
};

export default SettingsPanel;