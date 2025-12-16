import { GameState, CultivationPath } from '../types';
import { INITIAL_STATE } from '../constants';

/**
 * Xử lý logic Reset game khi Phi Thăng.
 * Giữ lại: Tinh Hoa, Thiên Phú, Nghề Nghiệp, Kho Chứa, Tông Môn, Linh Căn.
 * Reset: Cảnh giới, Tài nguyên, Túi đồ (Inventory), Trang bị đang mặc.
 */
export const performAscension = (currentState: GameState, newPath: CultivationPath): GameState => {
    
    // 1. Tính toán Tinh Hoa Thiên Đạo nhận được
    // Base: 100
    // Bonus theo Stats: +1 cho mỗi 20 điểm stats bồi dưỡng thêm (ngoài base)
    const totalStatBonuses = (currentState.statBonuses.attack || 0) + (currentState.statBonuses.defense || 0) + ((currentState.statBonuses.hp - 100) / 10 || 0);
    const essenceReward = 100 + Math.floor(totalStatBonuses / 20);

    // 2. Tính toán Phẩm chất Linh Căn mới (Tăng nhẹ sau mỗi lần phi thăng)
    // Tối đa 100. Mỗi lần phi thăng +5 -> +10 ngẫu nhiên.
    const currentRoot = currentState.prestige?.spiritRootQuality || 10;
    const rootGain = Math.floor(Math.random() * 6) + 5; // 5-10
    const newRootQuality = Math.min(100, currentRoot + rootGain);

    // 3. Chuẩn bị thông báo Log
    const logMessage = newPath === 'righteous' 
        ? `Phi Thăng Tiên Giới thành công! Nhận ${essenceReward} Tinh Hoa. Linh Căn thăng cấp: ${currentRoot} -> ${newRootQuality}.` 
        : `Chuyển Sinh Ma Vương thành công! Nhận ${essenceReward} Tinh Hoa. Ma Căn thăng cấp: ${currentRoot} -> ${newRootQuality}.`;

    // 4. Tạo State Mới (Reset) nhưng giữ lại các trường Vĩnh Viễn
    const newState: GameState = {
        ...INITIAL_STATE, // Reset về mặc định
        
        // --- GIỮ LẠI THÔNG TIN CƠ BẢN ---
        playerName: currentState.playerName,
        avatarUrl: currentState.avatarUrl,
        nameChangeCount: currentState.nameChangeCount,
        lastNameChangeTime: currentState.lastNameChangeTime,
        
        // --- CHUYỂN CON ĐƯỜNG MỚI ---
        cultivationPath: newPath,

        // --- BẢO TOÀN VĨNH VIỄN (PERMANENT) ---
        
        // 1. Hệ thống Prestige & Talent
        prestige: {
            currency: (currentState.prestige?.currency || 0) + essenceReward,
            ascensionCount: (currentState.prestige?.ascensionCount || 0) + 1,
            talents: currentState.prestige?.talents || {},
            spiritRootQuality: newRootQuality
        },

        // 2. Hệ thống Nghề Nghiệp (Alchemy/Blacksmithing)
        professions: currentState.professions || INITIAL_STATE.professions,

        // 3. Kho Chứa Đồ (Stash) - QUAN TRỌNG: Inventory mất, Stash còn.
        stash: currentState.stash || [],

        // 4. Tông Môn (Vẫn giữ tư cách đệ tử)
        sectId: currentState.sectId, 
        
        // 5. Danh Hiệu / Achievements (Nếu có sau này, sẽ giữ ở đây)
        // titles: currentState.titles 

        // Add log
        logs: [{ id: Date.now(), timestamp: Date.now(), type: 'success', message: logMessage }]
    };

    return newState;
};