import { GameState, GameAction, LogEntry, ActiveBuff } from '../types';
import { REALMS, INITIAL_STATE, GAME_ITEMS, ENCOUNTERS, TALENTS, SECRET_REALMS } from '../constants';
import { performAscension } from '../utils/ascensionLogic';
import { getTalentCost } from '../utils/formulas';
import { processCombatRound } from './logic/combatLogic';
import { handleUseItem, handleCraftItem, handleEquipItem, handleUnequipItem } from './logic/itemLogic';

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  const currentRealm = REALMS[state.realmIndex];
  const now = Date.now();

  // Đảm bảo dữ liệu tồn tại cho save cũ (Migration)
  if (!state.statBonuses) state.statBonuses = { attack: 5, defense: 2, hp: 100 };
  if (!state.skillCooldowns) state.skillCooldowns = {};
  if (!state.activeBuffs) state.activeBuffs = [];
  if (state.nameChangeCount === undefined) state.nameChangeCount = 0;
  if (state.lastNameChangeTime === undefined) state.lastNameChangeTime = 0;
  if (!state.prestige) state.prestige = { currency: 0, ascensionCount: 0, talents: {}, spiritRootQuality: 0 };
  if (!state.professions) state.professions = { alchemyLevel: 1, blacksmithLevel: 1, alchemyExp: 0, blacksmithExp: 0 };
  if (!state.stash) state.stash = [];

  // Talent Bonuses Calculation
  const talentQiBonus = (state.prestige.talents['heavenly_roots'] || 0) * 0.1;
  const talentStartStats = (state.prestige.talents['divine_body'] || 0) * 5;
  const rootBonus = (state.prestige.spiritRootQuality || 0) / 100;

  switch (action.type) {
    case 'TICK': {
      const deltaSeconds = action.payload / 1000;
      
      // --- 1. HỒI LINH KHÍ (PASSIVE) ---
      let passiveMultiplier = 1;
      passiveMultiplier += talentQiBonus + rootBonus;

      if (state.cultivationPath === 'righteous') passiveMultiplier *= 1.2;
      if (state.sectId === 'thai_thanh') passiveMultiplier *= 1.15;
      if (state.traits.includes('great_enlightenment')) passiveMultiplier *= 1.5;
      if (state.traits.includes('life_absorption')) passiveMultiplier *= 1.3;
      if (state.traitorDebuffEndTime > now) passiveMultiplier *= 0.5;

      const artifact = state.equippedItems.artifact;
      // Hiệu ứng Đan Lô
      if (artifact?.id === 'cauldron_earth' && state.resources.qi < (state.resources.maxQi * 0.3)) {
          passiveMultiplier += 0.03; 
      }

      const artifactBonus = artifact?.stats?.qiRegen || 0;
      const qiGain = ((currentRealm.baseQiGeneration * passiveMultiplier) + artifactBonus) * deltaSeconds;
      
      let newQi = Math.min(currentRealm.maxQiCap, state.resources.qi + qiGain);
      let newHp = state.hp;

      // Xử lý Debuff Trait
      if (state.traits.includes('great_enlightenment') && Math.random() < 0.01) { 
          newQi = Math.max(0, newQi - Math.floor(currentRealm.maxQiCap * 0.05));
      }
      if (state.traits.includes('dao_injury') && state.hp > 0) {
          newHp = Math.max(0, newHp - (state.maxHp * 0.02 * deltaSeconds));
      }

      // --- 2. XỬ LÝ BUFFS ---
      const activeBuffs = state.activeBuffs.filter(b => b.endTime > now);

      let newState = {
        ...state,
        resources: { ...state.resources, qi: newQi },
        lastTick: now,
        activeBuffs: activeBuffs
      };

      // --- 3. CẬP NHẬT MAX HP ---
      const totalConstitution = (state.equippedItems.weapon?.stats?.constitution || 0) + 
                                (state.equippedItems.armor?.stats?.constitution || 0) + 
                                (state.equippedItems.artifact?.stats?.constitution || 0);
      
      newState.maxHp = 100 + talentStartStats + (totalConstitution * 20) + (state.statBonuses.hp || 0); 
      if (state.traits.includes('body_demonization')) newState.maxHp *= 1.5;

      // --- 4. XỬ LÝ CHIẾN ĐẤU (COMBAT) ---
      if (state.isExploring) {
          newState = processCombatRound(newState);
      } else {
          // Hồi phục HP khi không chiến đấu
          let regenRate = 0.03; // 3% mỗi giây (Tăng từ 1%)
          if (state.equippedItems.armor?.id === 'armor_wood') regenRate *= 1.15;
          newState.hp = Math.min(newState.maxHp, newHp + (newState.maxHp * regenRate * deltaSeconds));
      }

      // Event Random
      const cooldown = 30 * 60 * 1000; 
      if (state.explorationType === 'adventure' && !newState.activeEncounterId && !newState.activeDungeonId && (now - (state.lastEncounterTime || 0) > cooldown)) {
          const prob = state.sectId === 'tieu_dao' ? 0.008 : 0.005;
          if (Math.random() < prob) {
              const randomEncounter = ENCOUNTERS[Math.floor(Math.random() * ENCOUNTERS.length)];
              newState.activeEncounterId = randomEncounter.id;
          }
      }
      return newState;
    }

    // --- ITEM ACTIONS (DELEGATED) ---
    case 'USE_ITEM': return handleUseItem(state, action.payload);
    case 'CRAFT_ITEM': return handleCraftItem(state, action.payload);
    case 'EQUIP_ITEM': return handleEquipItem(state, action.payload);
    case 'UNEQUIP_ITEM': return handleUnequipItem(state, action.payload);

    case 'ACTIVATE_SKILL': {
        const skillId = action.payload;
        let skill = null;
        Object.values(state.equippedItems).forEach(item => {
            if (item && item.activeSkill && item.activeSkill.id === skillId) skill = item.activeSkill;
        });
        if (!skill) return state;
        const lastUsed = state.skillCooldowns[skillId] || 0;
        if (now < lastUsed) return state;
        
        let newState = { ...state };
        let logMsg = '';
        if (skill.type === 'heal') {
            newState.hp = Math.min(state.maxHp, state.hp + skill.value);
            logMsg = `Kích hoạt ${skill.name}: Hồi phục ${skill.value} HP.`;
        } else if (skill.type === 'dmg_burst') {
             logMsg = `Kích hoạt ${skill.name}: Gây sát thương lớn lên kẻ địch!`;
        } else if (skill.type === 'buff_atk' || skill.type === 'buff_def') {
             const buff: ActiveBuff = {
                 id: skill.id, name: skill.name, type: skill.type, value: skill.value, endTime: now + (skill.duration || 0)
             };
             newState.activeBuffs = [...state.activeBuffs.filter(b => b.id !== skill.id), buff];
             logMsg = `Kích hoạt ${skill.name}: Tăng ${skill.value} ${skill.type === 'buff_atk' ? 'Công' : 'Thủ'} trong ${skill.duration!/1000}s.`;
        }
        newState.skillCooldowns = { ...newState.skillCooldowns, [skillId]: now + skill.cooldown };
        newState.logs = [{ id: now, timestamp: now, type: 'combat', message: logMsg }, ...state.logs];
        return newState;
    }

    case 'GATHER_QI': {
      if (now - state.lastClickTime < 125) return state;
      let clickMultiplier = state.clickMultiplier * (1 + talentQiBonus);
      if (state.cultivationPath === 'devil') clickMultiplier *= 1.2;
      if (state.sectId === 'van_kiem') clickMultiplier *= 1.2;
      if (state.traitorDebuffEndTime > now) clickMultiplier *= 0.5;
      const artifactClickBonus = state.equippedItems.artifact?.stats?.clickBonus || 0;
      const gain = ((1 + currentRealm.baseQiGeneration) * clickMultiplier) + artifactClickBonus;
      let newQi = Math.min(currentRealm.maxQiCap, state.resources.qi + gain);
      return { ...state, lastClickTime: now, resources: { ...state.resources, qi: newQi } };
    }

    // --- MARKET ---
    case 'BUY_ITEM': {
        const { itemId, amount } = action.payload;
        const itemDef = GAME_ITEMS.find(i => i.id === itemId);
        if (!itemDef || state.resources.spiritStones < itemDef.price * amount) return state;
        const newResources = { ...state.resources, spiritStones: state.resources.spiritStones - (itemDef.price * amount) };
        const idx = state.inventory.findIndex(i => i.id === itemId);
        let newInv = [...state.inventory];
        if (idx >= 0) newInv[idx] = { ...newInv[idx], quantity: newInv[idx].quantity + amount };
        else newInv.push({ ...itemDef, quantity: amount });
        return { ...state, resources: newResources, inventory: newInv, logs: [{ id: now, timestamp: now, type: 'success', message: `Mua thành công ${amount}x ${itemDef.name}.` }, ...state.logs] };
    }
    case 'SELL_ITEM': {
        const { itemId, amount } = action.payload;
        const item = state.inventory.find(i => i.id === itemId);
        if (!item || item.quantity < amount) return state;
        const sellPrice = Math.max(1, Math.floor(item.price * 0.5));
        let newInv = [...state.inventory];
        const idx = newInv.findIndex(i => i.id === itemId);
        if (newInv[idx].quantity === amount) newInv.splice(idx, 1);
        else newInv[idx] = { ...newInv[idx], quantity: newInv[idx].quantity - amount };
        return { ...state, inventory: newInv, resources: { ...state.resources, spiritStones: state.resources.spiritStones + (sellPrice * amount) }, logs: [{ id: now, timestamp: now, type: 'success', message: `Bán ${amount}x ${item.name}.` }, ...state.logs] };
    }

    // --- STASH ---
    case 'DEPOSIT_STASH': {
        const { itemId, amount } = action.payload;
        const invIdx = state.inventory.findIndex(i => i.id === itemId);
        if (invIdx === -1) return state;
        const item = state.inventory[invIdx];
        const qtyToMove = Math.min(amount, item.quantity);
        if (qtyToMove <= 0) return state;
        let newInv = [...state.inventory];
        if (item.quantity === qtyToMove) newInv.splice(invIdx, 1);
        else newInv[invIdx] = { ...item, quantity: item.quantity - qtyToMove };
        let newStash = [...state.stash];
        const stashIdx = newStash.findIndex(i => i.id === itemId);
        if (stashIdx === -1) newStash.push({ ...item, quantity: qtyToMove });
        else newStash[stashIdx] = { ...newStash[stashIdx], quantity: newStash[stashIdx].quantity + qtyToMove };
        return { ...state, inventory: newInv, stash: newStash, logs: [{ id: now, timestamp: now, type: 'info', message: `Đã cất ${qtyToMove}x ${item.name} vào kho.` }, ...state.logs] };
    }
    case 'WITHDRAW_STASH': {
        const { itemId, amount } = action.payload;
        const stashIdx = state.stash.findIndex(i => i.id === itemId);
        if (stashIdx === -1) return state;
        const item = state.stash[stashIdx];
        const qtyToMove = Math.min(amount, item.quantity);
        if (qtyToMove <= 0) return state;
        let newStash = [...state.stash];
        if (item.quantity === qtyToMove) newStash.splice(stashIdx, 1);
        else newStash[stashIdx] = { ...item, quantity: item.quantity - qtyToMove };
        let newInv = [...state.inventory];
        const invIdx = newInv.findIndex(i => i.id === itemId);
        if (invIdx === -1) newInv.push({ ...item, quantity: qtyToMove });
        else newInv[invIdx] = { ...newInv[invIdx], quantity: newInv[invIdx].quantity + qtyToMove };
        return { ...state, inventory: newInv, stash: newStash, logs: [{ id: now, timestamp: now, type: 'info', message: `Đã lấy ${qtyToMove}x ${item.name} từ kho.` }, ...state.logs] };
    }

    // --- CULTIVATION ---
    case 'ATTEMPT_BREAKTHROUGH': {
      if (state.resources.qi < currentRealm.maxQiCap) return { ...state, logs: [{ id: now, timestamp: now, type: 'warning', message: 'Linh khí chưa đủ viên mãn để đột phá!' }, ...state.logs] };
      if (state.traits.includes('body_demonization') && state.realmIndex >= 14) return { ...state, logs: [{ id: now, timestamp: now, type: 'danger', message: 'Thân thể đã Ma Hóa, Thiên Đạo không dung! Không thể phi thăng Hóa Thần.' }, ...state.logs] }
      
      let totalChance = currentRealm.breakthroughChance + (state.breakthroughSupportMod || 0);
      if ((state.weaknessEndTime || 0) > now) totalChance -= 0.3;
      if (state.traits.includes('dao_injury')) totalChance += 0.1;
      if (state.traits.includes('heavenly_jealousy')) totalChance -= 0.1;
      totalChance += (state.prestige.spiritRootQuality || 0) / 500;
      totalChance = Math.max(0.05, totalChance);

      if (Math.random() < totalChance) {
        const nextRealmIndex = state.realmIndex + 1;
        if (nextRealmIndex >= REALMS.length) return state; 
        return { ...state, realmIndex: nextRealmIndex, resources: { ...state.resources, qi: 0, maxQi: REALMS[nextRealmIndex].maxQiCap }, breakthroughSupportMod: 0, weaknessEndTime: now + 600000, logs: [{ id: now, timestamp: now, type: 'success', message: `Đột phá thành công! Bước vào cảnh giới ${REALMS[nextRealmIndex].name}!` }, ...state.logs] };
      } else {
         return { ...state, resources: { ...state.resources, qi: state.resources.qi * 0.7 }, breakthroughSupportMod: 0, logs: [{ id: now, timestamp: now, type: 'danger', message: `Đột phá thất bại! Tổn thất Linh Khí.` }, ...state.logs] };
      }
    }

    // --- EXPLORATION & EVENTS ---
    case 'START_EXPLORATION': return { ...state, isExploring: true, explorationType: action.payload, activeDungeonId: null, logs: [{ id: now, timestamp: now, type: 'info', message: 'Bắt đầu du ngoạn tìm kiếm cơ duyên...' }, ...state.logs] };
    case 'START_DUNGEON': {
      const dungeon = SECRET_REALMS.find(d => d.id === action.payload);
      if (!dungeon) return state;
      let logs = [...state.logs];
      if (state.realmIndex < dungeon.reqRealmIndex) logs = [{ id: now, timestamp: now, type: 'warning', message: `⚠️ CẢNH BÁO: Vượt cấp khiêu chiến ${dungeon.name}!` }, ...logs];
      return { ...state, isExploring: true, explorationType: 'dungeon', activeDungeonId: action.payload, logs: [{ id: now + 1, timestamp: now, type: 'info', message: `Tiến vào Bí Cảnh: ${dungeon.name}!` }, ...logs] };
    }
    case 'STOP_EXPLORATION': return { ...state, isExploring: false, explorationType: 'none', activeDungeonId: null, logs: [{ id: now, timestamp: now, type: 'info', message: 'Thu hồi thần thức, quay về động phủ.' }, ...state.logs] };
    
    case 'RESOLVE_ENCOUNTER': {
        const { encounterId, optionIndex } = action.payload;
        const encounter = ENCOUNTERS.find(e => e.id === encounterId);
        if (!encounter) return { ...state, activeEncounterId: null };
        const option = encounter.options[optionIndex];
        
        let newState = { ...state, activeEncounterId: null };
        let logs = state.logs;

        // Trừ Tài Nguyên
        if (option.resourceCost) {
            newState.resources = {
                ...state.resources,
                spiritStones: state.resources.spiritStones - (option.resourceCost.spiritStones || 0),
                herbs: state.resources.herbs - (option.resourceCost.herbs || 0),
                ores: state.resources.ores - (option.resourceCost.ores || 0),
                qi: state.resources.qi - (option.resourceCost.qi || 0)
            };
        }
        // Nhận Trait
        if (option.gainTrait && !state.traits.includes(option.gainTrait)) {
             newState.traits = [...state.traits, option.gainTrait];
             logs = [{ id: now, timestamp: now, type: 'warning', message: `Đã nhận hiệu ứng: ${option.gainTrait}` }, ...logs];
        }
        // Nhận Item
        if (option.gainItem) {
             const { itemId, quantity } = option.gainItem;
             const itemDef = GAME_ITEMS.find(i => i.id === itemId);
             if (itemDef) {
                 const existingItemIndex = newState.inventory.findIndex(i => i.id === itemId);
                 let newInv = [...newState.inventory];
                 if (existingItemIndex >= 0) newInv[existingItemIndex] = { ...newInv[existingItemIndex], quantity: newInv[existingItemIndex].quantity + quantity };
                 else newInv.push({ ...itemDef, quantity });
                 newState.inventory = newInv;
                 logs = [{ id: now, timestamp: now, type: 'success', message: `Nhận được ${quantity}x ${itemDef.name}!` }, ...logs];
             }
        }
        if (!option.gainItem && !option.gainTrait) {
             logs = [{ id: now, timestamp: now, type: 'info', message: `Đã chọn: ${option.label}. Sự việc kết thúc.` }, ...logs];
        }
        return { ...newState, logs };
    }

    // --- SYSTEM ---
    case 'ASCEND': return performAscension(state, action.payload.path);
    case 'SET_PLAYER_NAME': return { ...state, playerName: action.payload };
    case 'SET_AVATAR': return { ...state, avatarUrl: action.payload };
    case 'CHOOSE_PATH': return { ...state, cultivationPath: action.payload };
    case 'JOIN_SECT': return { ...state, sectId: action.payload };
    case 'LEAVE_SECT': return { ...state, sectId: null, traitorDebuffEndTime: now + 5400000 };
    case 'TRIGGER_ENCOUNTER': return { ...state, activeEncounterId: action.payload, lastEncounterTime: now };
    case 'LOAD_GAME': return { ...INITIAL_STATE, ...action.payload, lastTick: now, isExploring: false };
    case 'RENAME_CHARACTER': {
         const newName = action.payload;
        if (!newName || newName.trim().length === 0) return state;
        const RENAME_COOLDOWN = 7 * 24 * 60 * 60 * 1000;
        const timeSinceLast = now - (state.lastNameChangeTime || 0);
        if (state.nameChangeCount > 0 && timeSinceLast < RENAME_COOLDOWN) return state; // Fail silently or handle UI warning elsewhere
        
        let newState = { ...state };
        let logMsg = '';
        if (state.nameChangeCount === 0) {
            logMsg = `Cải danh thành công! Đạo hiệu mới: ${newName}`;
        } else {
            const scrollIdx = state.inventory.findIndex(i => i.id === 'rename_scroll');
            if (scrollIdx === -1) return state;
            let newInv = [...state.inventory];
            if (newInv[scrollIdx].quantity > 1) newInv[scrollIdx] = { ...newInv[scrollIdx], quantity: newInv[scrollIdx].quantity - 1 };
            else newInv.splice(scrollIdx, 1);
            newState.inventory = newInv;
            logMsg = `Đã dùng Phù Lục Cải Mệnh. Cải danh thành công: ${newName}`;
        }
        return { ...newState, playerName: newName, nameChangeCount: state.nameChangeCount + 1, lastNameChangeTime: now, logs: [{ id: now, timestamp: now, type: 'success', message: logMsg }, ...state.logs] };
    }
    case 'UPGRADE_TALENT': {
        const talentId = action.payload;
        const talent = TALENTS.find(t => t.id === talentId);
        if (!talent) return state;
        const currentLevel = state.prestige.talents[talentId] || 0;
        if (currentLevel >= talent.maxLevel) return state;
        const cost = getTalentCost(talent.baseCost, talent.costMultiplier, currentLevel);
        if (state.prestige.currency < cost) return state;
        return {
            ...state,
            prestige: {
                ...state.prestige,
                currency: state.prestige.currency - cost,
                talents: { ...state.prestige.talents, [talentId]: currentLevel + 1 }
            },
            logs: [{ id: now, timestamp: now, type: 'success', message: `Đã lĩnh ngộ ${talent.name} tầng ${currentLevel + 1}.` }, ...state.logs]
        };
    }

    default:
      return state;
  }
};