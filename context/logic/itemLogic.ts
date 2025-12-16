import { GameState } from '../../types';
import { CRAFTABLE_ITEMS, GAME_ITEMS, REALMS } from '../../constants';

// --- USE ITEM LOGIC ---
export const handleUseItem = (state: GameState, itemId: string): GameState => {
    const idx = state.inventory.findIndex(i => i.id === itemId);
    if (idx === -1) return state;
    
    const item = state.inventory[idx];
    let newInv = [...state.inventory];
    
    // Trừ số lượng
    if (item.quantity > 1) {
        newInv[idx] = { ...item, quantity: item.quantity - 1 };
    } else {
        newInv.splice(idx, 1);
    }
    
    let logMsg = '';
    let newState = { ...state, inventory: newInv };
    const currentRealm = REALMS[state.realmIndex];

    // --- HIỆU ỨNG VẬT PHẨM ---
    if (item.id === 'pill_small_qi') {
        const qiGain = Math.floor(currentRealm.maxQiCap * 0.10);
        newState.resources = { ...state.resources, qi: Math.min(currentRealm.maxQiCap, state.resources.qi + qiGain) };
        logMsg = `Đã dùng Tiểu Linh Đan (Hồi phục ${qiGain} Linh Khí)`;
    } 
    else if (item.id === 'pill_breakthrough') {
        if (state.realmIndex >= 6) {
            logMsg = 'Cảnh giới quá cao, Trúc Cơ Đan không còn tác dụng!';
        } else {
            newState.breakthroughSupportMod = 0.2;
            logMsg = 'Đã dùng Trúc Cơ Đan (Tăng 20% tỷ lệ đột phá)';
        }
    } 
    else if (item.id === 'pill_golden_core') {
        if (state.realmIndex < 6 || state.realmIndex >= 9) {
             logMsg = 'Cảnh giới không phù hợp (Chỉ dùng cho Trúc Cơ)!';
        } else {
            newState.breakthroughSupportMod = 0.15;
            logMsg = 'Đã dùng Kết Kim Đan (Tăng 15% tỷ lệ đột phá Kim Đan)';
        }
    }
    else if (item.id === 'pill_nascent_soul') {
        if (state.realmIndex < 9 || state.realmIndex >= 12) {
             logMsg = 'Cảnh giới không phù hợp (Chỉ dùng cho Kim Đan)!';
        } else {
            newState.breakthroughSupportMod = 0.10;
            logMsg = 'Đã dùng Nguyên Anh Đan (Tăng 10% tỷ lệ đột phá Nguyên Anh)';
        }
    }
    else if (item.id === 'pill_divine_transformation') {
        if (state.realmIndex < 12 || state.realmIndex >= 15) {
             logMsg = 'Cảnh giới không phù hợp (Chỉ dùng cho Nguyên Anh)!';
        } else {
            newState.breakthroughSupportMod = 0.05;
            logMsg = 'Đã dùng Hóa Thần Đan (Tăng 5% tỷ lệ đột phá Hóa Thần)';
        }
    }
    else if (item.id === 'pill_protection') {
        newState.protectionEndTime = Date.now() + 300000;
        logMsg = 'Đã dùng Hộ Mệnh Đan (Bảo hộ 5 phút)';
    } 
    else if (item.id === 'rename_scroll') {
         // Hoàn lại vật phẩm nếu dùng sai chỗ (Phải dùng ở Settings)
         if (newInv.length === state.inventory.length) {
             newInv[idx] = { ...newInv[idx], quantity: newInv[idx].quantity + 1 };
         } else {
             newInv.splice(idx, 0, item);
         }
         newState.inventory = newInv;
         logMsg = 'Hãy dùng vật phẩm này trong phần Thiết Lập -> Đổi Tên';
    } 
    else if (item.id === 'pill_attack_permanent') {
        newState.statBonuses = { ...newState.statBonuses, attack: (newState.statBonuses.attack || 0) + 2 };
        logMsg = 'Cơ thể cường tráng! (+2 Tấn Công)';
    } 
    else if (item.id === 'pill_defense_permanent') {
        newState.statBonuses = { ...newState.statBonuses, defense: (newState.statBonuses.defense || 0) + 2 };
        logMsg = 'Da thịt cứng rắn! (+2 Phòng Thủ)';
    } 
    else if (item.id === 'pill_hp_permanent') {
        newState.statBonuses = { ...newState.statBonuses, hp: (newState.statBonuses.hp || 0) + 50 };
        logMsg = 'Khí huyết dồi dào! (+50 HP Tối Đa)';
    } 
    else if (item.id === 'pill_spirit_root') {
        const currentRoot = state.prestige.spiritRootQuality || 0;
        if (currentRoot >= 100) {
             logMsg = 'Linh Căn đã đạt đến cảnh giới Hỗn Độn (Tối đa), không thể tăng thêm!';
             // Hoàn vật phẩm
             if (newInv.length === state.inventory.length) {
                newInv[idx] = { ...newInv[idx], quantity: newInv[idx].quantity + 1 };
             } else {
                newInv.splice(idx, 0, item);
             }
             newState.inventory = newInv;
        } else {
             const increase = Math.floor(Math.random() * 2) + 1;
             const newRoot = Math.min(100, currentRoot + increase);
             newState.prestige = { ...state.prestige, spiritRootQuality: newRoot };
             logMsg = `Tẩy kinh phạt tủy! Phẩm chất Linh Căn tăng: ${currentRoot} -> ${newRoot}`;
        }
    }
    
    if (logMsg) newState.logs = [{ id: Date.now(), timestamp: Date.now(), type: 'success', message: logMsg }, ...state.logs];
    return newState;
};

// --- CRAFT ITEM LOGIC ---
export const handleCraftItem = (state: GameState, payload: { itemId: string; cost: any; type: string }): GameState => {
    const { itemId, cost, type } = payload;
    const itemDef = CRAFTABLE_ITEMS.find(i => i.id === itemId);
    if (!itemDef) return state;
    
    const talentCraftCostReduction = (state.prestige.talents['pill_mastery'] || 0) * 0.02;
    const costMultiplier = (1.0 - talentCraftCostReduction);
    
    const reqHerbs = Math.floor((cost.herbs || 0) * costMultiplier);
    const reqOres = Math.floor((cost.ores || 0) * costMultiplier);
    const reqStones = Math.floor((cost.spiritStones || 0) * costMultiplier);

    if ((state.resources.herbs < reqHerbs) || (state.resources.ores < reqOres) || (state.resources.spiritStones < reqStones)) return state;

    const newResources = { 
        ...state.resources, 
        herbs: state.resources.herbs - reqHerbs, 
        ores: state.resources.ores - reqOres, 
        spiritStones: state.resources.spiritStones - reqStones 
    };
    
    let craftingChance = state.traits.includes('devil_pact') ? 0.7 : 1.0;
    
    // Profession XP
    let newProfessions = { ...state.professions };
    if (type === 'consumable') {
        newProfessions.alchemyExp += 10; 
        if (newProfessions.alchemyExp >= newProfessions.alchemyLevel * 100) {
            newProfessions.alchemyExp = 0;
            newProfessions.alchemyLevel += 1;
        }
    } else {
        newProfessions.blacksmithExp += 10;
        if (newProfessions.blacksmithExp >= newProfessions.blacksmithLevel * 100) {
            newProfessions.blacksmithExp = 0;
            newProfessions.blacksmithLevel += 1;
        }
    }

    if (Math.random() > craftingChance) {
        return { ...state, resources: newResources, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'danger', message: `Chế tạo THẤT BẠI!` }, ...state.logs] };
    }

    const existingItemIndex = state.inventory.findIndex(i => i.id === itemId);
    let newInventory = [...state.inventory];
    
    if (existingItemIndex >= 0) {
        newInventory[existingItemIndex] = { ...newInventory[existingItemIndex], quantity: newInventory[existingItemIndex].quantity + 1 };
    } else {
        newInventory.push({ ...itemDef, quantity: 1 });
    }
    
    return { 
        ...state, 
        resources: newResources, 
        inventory: newInventory, 
        professions: newProfessions, 
        logs: [{ id: Date.now(), timestamp: Date.now(), type: 'success', message: `Luyện chế thành công ${itemDef.name}!` }, ...state.logs] 
    };
};

// --- EQUIP ITEM LOGIC ---
export const handleEquipItem = (state: GameState, itemId: string): GameState => {
    const item = state.inventory.find(i => i.id === itemId);
    if (!item || !item.slot) return state;
    
    let newInv = [...state.inventory];
    const idx = newInv.findIndex(i => i.id === itemId);
    
    if (newInv[idx].quantity > 1) {
        newInv[idx] = { ...newInv[idx], quantity: newInv[idx].quantity - 1 };
    } else {
        newInv.splice(idx, 1);
    }
    
    const currentEquipped = state.equippedItems[item.slot];
    if (currentEquipped) {
        const eIdx = newInv.findIndex(i => i.id === currentEquipped.id);
        if (eIdx >= 0) {
             newInv[eIdx] = { ...newInv[eIdx], quantity: newInv[eIdx].quantity + 1 };
        } else {
             newInv.push(currentEquipped);
        }
    }
    return { ...state, inventory: newInv, equippedItems: { ...state.equippedItems, [item.slot]: item } };
};

// --- UNEQUIP ITEM LOGIC ---
export const handleUnequipItem = (state: GameState, slot: string): GameState => {
    const item = state.equippedItems[slot as keyof typeof state.equippedItems];
    if (!item) return state;
    
    let newInv = [...state.inventory];
    const idx = newInv.findIndex(i => i.id === item.id);
    
    if (idx >= 0) {
        newInv[idx] = { ...newInv[idx], quantity: newInv[idx].quantity + 1 };
    } else {
        newInv.push({ ...item, quantity: 1 });
    }
    return { ...state, inventory: newInv, equippedItems: { ...state.equippedItems, [slot]: null } };
};
