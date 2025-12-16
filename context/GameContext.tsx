import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { GameState, GameAction, LogEntry, Realm, Item } from '../types';
import { REALMS, INITIAL_STATE, CRAFTABLE_ITEMS, GAME_ITEMS, ENCOUNTERS, SECTS, SECRET_REALMS } from '../constants';

// --- Reducer Logic ---

const gameReducer = (state: GameState, action: GameAction): GameState => {
  const currentRealm = REALMS[state.realmIndex];
  const now = Date.now();

  // PATH BONUSES CONSTANTS
  const RIGHTEOUS_PASSIVE_BONUS = 1.2; // +20% Passive Qi
  const DEVIL_CLICK_BONUS = 1.2;       // +20% Click Qi
  const RIGHTEOUS_DEF_BONUS = 1.3;     // +30% Defense (Effective HP)
  const DEVIL_LOOT_BONUS = 0.2;        // +20% Encounter/Loot Rate

  switch (action.type) {
    case 'TICK': {
      // 1. Calculate Passive Qi Generation
      const deltaSeconds = action.payload / 1000;
      
      let passiveMultiplier = 1;
      if (state.cultivationPath === 'righteous') passiveMultiplier *= RIGHTEOUS_PASSIVE_BONUS;
      
      // SECT BONUS: Thai Thanh Mon (+15% Passive Qi)
      if (state.sectId === 'thai_thanh') passiveMultiplier *= 1.15;

      // TRAITOR DEBUFF CHECK: Reduce Qi by 50% if traitor
      if (state.traitorDebuffEndTime > now) {
          passiveMultiplier *= 0.5;
      }

      // ARTIFACT BONUS (Flat Increase)
      const artifactBonus = state.equippedItems.artifact?.stats?.qiRegen || 0;

      const qiGain = ((currentRealm.baseQiGeneration * passiveMultiplier) + artifactBonus) * deltaSeconds;
      
      let newQi = state.resources.qi + qiGain;
      if (newQi > currentRealm.maxQiCap) newQi = currentRealm.maxQiCap;

      let newState = {
        ...state,
        resources: { ...state.resources, qi: newQi },
        lastTick: Date.now(),
      };

      // 2. Handle Exploration Logic (Combat & Loot Loop)
      let newLogs = [...state.logs];
      let newHp = state.hp;
      let newInventory = [...state.inventory];
      
      if (state.isExploring) {
        // Determine Environment (Normal or Dungeon)
        const activeDungeon = state.activeDungeonId ? SECRET_REALMS.find(d => d.id === state.activeDungeonId) : null;
        const difficultyMod = activeDungeon ? activeDungeon.difficultyMod : 1.0;
        const dropRateMod = activeDungeon ? activeDungeon.dropRateMod : 1.0;

        // Heal slowly if not dead
        if (state.hp > 0) {
            // Base encounter chance 50%
            let encounterChance = 0.50;
            if (state.cultivationPath === 'devil') encounterChance += DEVIL_LOOT_BONUS;
            // SECT BONUS: Tieu Dao Phai (+10% Encounter Chance)
            if (state.sectId === 'tieu_dao') encounterChance += 0.1;
            
            // Dungeon usually has higher encounter rate (more monsters)
            if (activeDungeon) encounterChance += 0.2;

            if (Math.random() < encounterChance) { 
                const baseMonsterPower = Math.floor(currentRealm.attack * (0.6 + Math.random() * 0.3));
                const monsterPower = baseMonsterPower * difficultyMod;
                
                // PLAYER STATS CALCULATION
                let playerDef = currentRealm.defense;
                if (state.cultivationPath === 'righteous') playerDef *= RIGHTEOUS_DEF_BONUS;
                // Add Armor Defense
                playerDef += (state.equippedItems.armor?.stats?.defense || 0);

                let damageTaken = Math.max(1, (monsterPower + (currentRealm.id * 2)) - playerDef);
                
                // SECT BONUS: Thien Cang Tong (-15% Damage Taken)
                if (state.sectId === 'thien_cang') damageTaken = Math.floor(damageTaken * 0.85);
                
                newHp = Math.max(0, state.hp - damageTaken);
                
                const herbsFound = Math.floor((Math.random() * 3) + 1 + currentRealm.id) * dropRateMod;
                const oreChance = 0.3 + (currentRealm.id * 0.01);
                let oresFound = 0;
                if (Math.random() < oreChance) {
                    oresFound = Math.floor((Math.random() * 2) + 1 + Math.floor(currentRealm.id / 3)) * dropRateMod;
                }
                const stonesFound = Math.floor((Math.random() * 10) + 1 + (currentRealm.id * 8)) * dropRateMod;

                // SECT BONUS: Duoc Vuong Coc (+25% Herb Rate is simplified to +1 herb here roughly)
                let finalHerbs = Math.floor(herbsFound);
                if (state.sectId === 'duoc_vuong' && Math.random() < 0.25) finalHerbs += 1;

                // SECT BONUS: Huyet Sat Giao (+20% Stones, +5% HP Heal on win)
                let finalStones = Math.floor(stonesFound);
                if (state.sectId === 'huyet_sat') {
                    finalStones = Math.floor(finalStones * 1.2);
                    newHp = Math.min(state.maxHp, newHp + (state.maxHp * 0.05));
                }

                newState.resources.herbs += finalHerbs;
                newState.resources.ores += Math.floor(oresFound);
                newState.resources.spiritStones += finalStones;

                let prefix = activeDungeon ? `[${activeDungeon.name}] ` : '';
                let logMsg = `${prefix}Gặp yêu thú! Chịu ${Math.floor(damageTaken)} sát thương. Thu được: ${finalHerbs} Thảo, ${Math.floor(oresFound)} Khoáng, ${finalStones} Linh Thạch.`;

                // ITEM DROP LOGIC (Base 10% chance * dropRateMod)
                const itemDropChance = 0.10 * dropRateMod;

                if (Math.random() < itemDropChance) {
                    // Pool: Weapon (Low), Armor (Low), Small Pill (High), Breakthrough Pill (Medium)
                    const rand = Math.random();
                    let dropId = '';
                    if (rand < 0.4) dropId = 'pill_small_qi';
                    else if (rand < 0.6) dropId = 'pill_breakthrough';
                    else if (rand < 0.8) dropId = 'armor_leather';
                    else dropId = 'sword_iron';

                    const dropItemDef = GAME_ITEMS.find(i => i.id === dropId);
                    
                    if (dropItemDef) {
                        const existingItemIndex = newInventory.findIndex(i => i.id === dropId);
                        if (existingItemIndex >= 0) {
                            newInventory[existingItemIndex] = { 
                                ...newInventory[existingItemIndex], 
                                quantity: newInventory[existingItemIndex].quantity + 1 
                            };
                        } else {
                            newInventory.push({ ...dropItemDef, quantity: 1 });
                        }
                        logMsg += ` [NHẶT ĐƯỢC: ${dropItemDef.name}]`;
                    }
                }

                newLogs.unshift({
                    id: Date.now(),
                    timestamp: Date.now(),
                    type: 'combat',
                    message: logMsg
                });
            }
        } else {
            newLogs.unshift({
                id: Date.now(),
                timestamp: Date.now(),
                type: 'danger',
                message: `Bạn đã trọng thương! Bị trục xuất khỏi ${activeDungeon ? activeDungeon.name : 'nơi hoang dã'}.`
            });
            return {
                ...newState,
                isExploring: false,
                activeDungeonId: null, // Reset dungeon
                logs: newLogs.slice(0, 50),
                hp: 1, 
                inventory: newInventory
            }
        }
      } else {
        // Regen HP when idle (Reduced to 1% per second from 5%)
        newHp = Math.min(state.maxHp, state.hp + (state.maxHp * 0.01 * deltaSeconds));
      }

      newState.hp = newHp;
      newState.logs = newLogs.slice(0, 50);
      newState.inventory = newInventory;

      // 3. Random Encounter Check (Every Tick) - Only in Normal World
      const cooldown = 60000; // 1 minute
      if (!newState.activeEncounterId && !newState.activeDungeonId && (now - (state.lastEncounterTime || 0) > cooldown)) {
          // 0.5% chance per tick
          let encounterProb = 0.005;
          // SECT BONUS: Tieu Dao Phai (+Probability)
          if (state.sectId === 'tieu_dao') encounterProb = 0.008;

          if (Math.random() < encounterProb) {
              const randomEncounter = ENCOUNTERS[Math.floor(Math.random() * ENCOUNTERS.length)];
              newState.activeEncounterId = randomEncounter.id;
          }
      }

      return newState;
    }

    case 'GATHER_QI': {
      let clickMultiplier = state.clickMultiplier;
      if (state.cultivationPath === 'devil') clickMultiplier *= DEVIL_CLICK_BONUS;
      
      // SECT BONUS: Van Kiem Tong (+20% Click Qi)
      if (state.sectId === 'van_kiem') clickMultiplier *= 1.2;

      // TRAITOR DEBUFF CHECK: Reduce Click Qi by 50% if traitor (optional, but consistent)
      if (state.traitorDebuffEndTime > now) {
          clickMultiplier *= 0.5;
      }

      // ARTIFACT CLICK BONUS
      const artifactClickBonus = state.equippedItems.artifact?.stats?.clickBonus || 0;

      const gain = ((1 + currentRealm.baseQiGeneration) * clickMultiplier) + artifactClickBonus;
      let newQi = state.resources.qi + gain;
      if (newQi > currentRealm.maxQiCap) newQi = currentRealm.maxQiCap;
      return {
        ...state,
        resources: { ...state.resources, qi: newQi },
      };
    }

    case 'ATTEMPT_BREAKTHROUGH': {
      if (state.resources.qi < currentRealm.maxQiCap) {
        return {
          ...state,
          logs: [{ id: Date.now(), timestamp: Date.now(), type: 'warning', message: 'Linh khí chưa đủ viên mãn để đột phá!' }, ...state.logs]
        };
      }

      // Calculate total chance with mod
      const totalChance = currentRealm.breakthroughChance + (state.breakthroughSupportMod || 0);
      const success = Math.random() < totalChance;
      
      // Reset Mod after attempt regardless of result
      const newBreakthroughSupportMod = 0;
      
      if (success) {
        const nextRealmIndex = state.realmIndex + 1;
        if (nextRealmIndex >= REALMS.length) return state; 

        return {
          ...state,
          realmIndex: nextRealmIndex,
          resources: { ...state.resources, qi: 0, maxQi: REALMS[nextRealmIndex].maxQiCap },
          hp: state.maxHp * 1.5,
          maxHp: state.maxHp * 1.5,
          breakthroughSupportMod: newBreakthroughSupportMod,
          logs: [{ id: Date.now(), timestamp: Date.now(), type: 'success', message: `Đột phá thành công! Bước vào cảnh giới ${REALMS[nextRealmIndex].name}!` }, ...state.logs]
        };
      } else {
         const lostQi = state.resources.qi * 0.3;
         return {
            ...state,
            resources: { ...state.resources, qi: state.resources.qi - lostQi },
            breakthroughSupportMod: newBreakthroughSupportMod,
            logs: [{ id: Date.now(), timestamp: Date.now(), type: 'danger', message: `Đột phá thất bại! Tâm ma quấy nhiễu, tổn thất ${Math.floor(lostQi)} Linh Khí. Hiệu quả dược lực đã hết.` }, ...state.logs]
         };
      }
    }

    case 'START_EXPLORATION':
      if (state.realmIndex === 0) {
          return {
             ...state,
             logs: [{ id: Date.now(), timestamp: Date.now(), type: 'warning', message: 'Phàm nhân thân thể yếu đuối, không thể rời núi du ngoạn. Hãy đạt Luyện Khí!' }, ...state.logs] 
          };
      }
      return { ...state, isExploring: true, activeDungeonId: null, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'info', message: 'Bắt đầu rời động phủ du ngoạn...' }, ...state.logs] };

    case 'START_DUNGEON': {
      const dungeonId = action.payload;
      const dungeon = SECRET_REALMS.find(d => d.id === dungeonId);
      if (!dungeon) return state;

      if (state.realmIndex < dungeon.reqRealmIndex) {
          return {
             ...state,
             logs: [{ id: Date.now(), timestamp: Date.now(), type: 'warning', message: `Tu vi chưa đủ! Cần đạt ${REALMS[dungeon.reqRealmIndex].name} để vào ${dungeon.name}.` }, ...state.logs] 
          };
      }

      return {
          ...state,
          isExploring: true,
          activeDungeonId: dungeonId,
          logs: [{ id: Date.now(), timestamp: Date.now(), type: 'info', message: `Tiến vào Bí Cảnh: ${dungeon.name}!` }, ...state.logs]
      };
    }

    case 'STOP_EXPLORATION':
      return { 
          ...state, 
          isExploring: false, 
          activeDungeonId: null,
          logs: [{ id: Date.now(), timestamp: Date.now(), type: 'info', message: 'Thu hồi thần thức, quay về động phủ.' }, ...state.logs] 
      };

    case 'CRAFT_ITEM': {
      const { itemId, cost } = action.payload;
      const itemDef = CRAFTABLE_ITEMS.find(i => i.id === itemId);
      if (!itemDef) return state;

      if ((state.resources.herbs < (cost.herbs || 0)) || (state.resources.ores < (cost.ores || 0)) || (state.resources.spiritStones < (cost.spiritStones || 0))) {
         return { ...state, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'warning', message: 'Không đủ nguyên liệu!' }, ...state.logs] };
      }

      const newResources = {
          ...state.resources,
          herbs: state.resources.herbs - (cost.herbs || 0),
          ores: state.resources.ores - (cost.ores || 0),
          spiritStones: state.resources.spiritStones - (cost.spiritStones || 0),
      };

      const existingItemIndex = state.inventory.findIndex(i => i.id === itemId);
      let newInventory = [...state.inventory];
      if (existingItemIndex >= 0) {
          newInventory[existingItemIndex] = { 
              ...newInventory[existingItemIndex], 
              quantity: newInventory[existingItemIndex].quantity + 1 
          };
      } else {
          const newItem: Item = {
              id: itemDef.id,
              name: itemDef.name,
              description: itemDef.description,
              type: itemDef.type,
              slot: itemDef.slot,
              stats: itemDef.stats,
              quantity: 1
          };
          newInventory.push(newItem);
      }

      return {
          ...state,
          resources: newResources,
          inventory: newInventory,
          logs: [{ id: Date.now(), timestamp: Date.now(), type: 'success', message: `Luyện chế thành công ${itemDef.name}!` }, ...state.logs]
      };
    }
    
    case 'USE_ITEM': {
        const itemId = action.payload;
        const itemIndex = state.inventory.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return state;

        const newInventory = [...state.inventory];
        let newQi = state.resources.qi;
        let newBreakthroughMod = state.breakthroughSupportMod || 0;
        let msg = '';
        const item = newInventory[itemIndex];

        if (itemId === 'pill_small_qi') {
            newQi = Math.min(currentRealm.maxQiCap, newQi + 100);
            msg = 'Sử dụng Tiểu Linh Đan, tăng 100 Linh Khí.';
        } else if (itemId === 'pill_breakthrough') {
            newBreakthroughMod = 0.2; // Set 20% bonus
            msg = 'Dược lực của Trúc Cơ Đan lan tỏa toàn thân! Tỷ lệ đột phá lần tới tăng thêm 20%.';
        }

        if (item.quantity > 1) {
            item.quantity -= 1;
        } else {
            newInventory.splice(itemIndex, 1);
        }

        return {
            ...state,
            resources: { ...state.resources, qi: newQi },
            inventory: newInventory,
            breakthroughSupportMod: newBreakthroughMod,
            logs: [{ id: Date.now(), timestamp: Date.now(), type: 'info', message: msg }, ...state.logs]
        };
    }

    case 'EQUIP_ITEM': {
        const itemId = action.payload;
        const itemIndex = state.inventory.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return state;

        const itemToEquip = state.inventory[itemIndex];
        if (itemToEquip.type !== 'equipment' || !itemToEquip.slot) return state;

        const slot = itemToEquip.slot;
        const currentEquipped = state.equippedItems[slot];
        
        // Remove 1 from inventory
        let newInventory = [...state.inventory];
        if (itemToEquip.quantity > 1) {
            newInventory[itemIndex] = { ...itemToEquip, quantity: itemToEquip.quantity - 1 };
        } else {
            newInventory.splice(itemIndex, 1);
        }

        // If something was equipped, put it back in inventory
        if (currentEquipped) {
            // Check if existing item of same ID exists to stack
            const existingIndex = newInventory.findIndex(i => i.id === currentEquipped.id);
            if (existingIndex >= 0) {
                 newInventory[existingIndex] = { ...newInventory[existingIndex], quantity: newInventory[existingIndex].quantity + 1 };
            } else {
                 newInventory.push(currentEquipped);
            }
        }

        return {
            ...state,
            inventory: newInventory,
            equippedItems: {
                ...state.equippedItems,
                [slot]: itemToEquip // Equipped item conceptually has quantity 1 so we don't store quantity here usually, or rely on base obj
            },
            logs: [{ id: Date.now(), timestamp: Date.now(), type: 'info', message: `Đã trang bị ${itemToEquip.name}.` }, ...state.logs]
        };
    }

    case 'UNEQUIP_ITEM': {
        const slot = action.payload;
        const itemToUnequip = state.equippedItems[slot];
        if (!itemToUnequip) return state;

        let newInventory = [...state.inventory];
        // Stack check
        const existingIndex = newInventory.findIndex(i => i.id === itemToUnequip.id);
        if (existingIndex >= 0) {
             newInventory[existingIndex] = { ...newInventory[existingIndex], quantity: newInventory[existingIndex].quantity + 1 };
        } else {
             newInventory.push({ ...itemToUnequip, quantity: 1 });
        }

        return {
            ...state,
            inventory: newInventory,
            equippedItems: {
                ...state.equippedItems,
                [slot]: null
            },
            logs: [{ id: Date.now(), timestamp: Date.now(), type: 'info', message: `Đã tháo ${itemToUnequip.name}.` }, ...state.logs]
        };
    }

    case 'SET_PLAYER_NAME':
        return { ...state, playerName: action.payload };

    case 'CHOOSE_PATH':
        return { 
            ...state, 
            cultivationPath: action.payload,
            logs: [{ id: Date.now(), timestamp: Date.now(), type: 'info', message: `Đạo tâm đã định. Bạn đã chọn con đường: ${action.payload === 'righteous' ? 'Chính Đạo' : 'Ma Đạo'}.` }, ...state.logs]
        };

    case 'JOIN_SECT': {
        // Restriction: Must be Foundation Establishment (Level 6) or higher
        if (state.realmIndex < 6) {
             return {
                 ...state,
                 logs: [{ id: Date.now(), timestamp: Date.now(), type: 'warning', message: `Tu vi chưa đủ! Cần đạt cảnh giới Trúc Cơ để được các Tông Môn để mắt tới.` }, ...state.logs]
             }
        }

        // Prevent joining if traitor debuff is active
        if (state.traitorDebuffEndTime > now) {
             return {
                 ...state,
                 logs: [{ id: Date.now(), timestamp: Date.now(), type: 'danger', message: `Danh tiếng đã mất, không tông môn nào dám thu nhận bạn lúc này!` }, ...state.logs]
             }
        }

        const sectId = action.payload;
        const sect = SECTS.find(s => s.id === sectId);
        if (!sect) return state;
        return {
            ...state,
            sectId: sectId,
            logs: [{ id: Date.now(), timestamp: Date.now(), type: 'success', message: `Chúc mừng! Bạn đã gia nhập ${sect.name}.` }, ...state.logs]
        }
    }

    case 'LEAVE_SECT': {
        const penaltyDuration = 90 * 60 * 1000; // 90 minutes (1.5 hours)
        return {
            ...state,
            sectId: null,
            traitorDebuffEndTime: Date.now() + penaltyDuration,
            logs: [{ id: Date.now(), timestamp: Date.now(), type: 'warning', message: `Bạn đã phản bội tông môn! Bị phỉ nhổ trong 1 giờ 30 phút (-50% Linh Khí, Không thể gia nhập phái khác).` }, ...state.logs]
        }
    }

    case 'TRIGGER_ENCOUNTER':
        return {
            ...state,
            activeEncounterId: action.payload,
            lastEncounterTime: Date.now()
        };

    case 'RESOLVE_ENCOUNTER': {
        const { encounterId, optionIndex } = action.payload;
        const encounter = ENCOUNTERS.find(e => e.id === encounterId);
        if (!encounter) return { ...state, activeEncounterId: null };
        
        const option = encounter.options[optionIndex];
        let newState = { ...state, activeEncounterId: null };
        let msg = '';
        let type: LogEntry['type'] = 'info';

        // Check if user has cost resources
        if (option.resourceCost) {
            if (state.resources.spiritStones < (option.resourceCost.spiritStones || 0) || 
                state.resources.herbs < (option.resourceCost.herbs || 0)) {
                return { ...state, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'warning', message: 'Không đủ tài nguyên để thực hiện lựa chọn này.' }, ...state.logs] };
            }
            // Deduct
            newState.resources.spiritStones -= (option.resourceCost.spiritStones || 0);
            newState.resources.herbs -= (option.resourceCost.herbs || 0);
        }

        // --- ENCOUNTER LOGIC ---
        // (Existing Logic preserved)
        if (encounterId === 'beggar_mystery') {
            if (optionIndex === 0) { // Give stones
                const reward = Math.floor(Math.random() * 500) + 100;
                newState.resources.qi = Math.min(newState.resources.maxQi, newState.resources.qi + reward);
                msg = `Lão ăn mày cười lớn, vỗ vai ngươi truyền một luồng khí lạ. (+${reward} Linh Khí)`;
                type = 'success';
            } else if (optionIndex === 2) { // Rob (Devil)
                const stones = Math.floor(Math.random() * 100) + 50;
                newState.resources.spiritStones += stones;
                msg = `Ngươi cướp bình rượu, bên trong hóa ra chứa đầy Linh Thạch! (+${stones} Linh Thạch)`;
                type = 'success';
            } else {
                msg = 'Ngươi bỏ đi, lão ăn mày nhìn theo lắc đầu.';
            }
        }
        else if (encounterId === 'storm_qi') {
             if (optionIndex === 0) { // Risk
                 if (Math.random() > 0.5) {
                     const reward = currentRealm.maxQiCap * 0.2;
                     newState.resources.qi = Math.min(newState.resources.maxQi, newState.resources.qi + reward);
                     msg = `Đánh cược thành công! Cơ thể hấp thụ Thiên Lôi. (+${Math.floor(reward)} Linh Khí)`;
                     type = 'success';
                 } else {
                     const dmg = state.maxHp * 0.3;
                     newState.hp = Math.max(1, newState.hp - dmg);
                     msg = `Thất bại! Sấm sét đánh cháy đen cả người. (-${Math.floor(dmg)} HP)`;
                     type = 'danger';
                 }
             } else {
                 msg = 'Ngươi tìm được hang động trú ẩn, bình an vô sự.';
             }
        }
        else if (encounterId === 'ancient_ruin') {
            if (optionIndex === 0) { // Enter
                const roll = Math.random();
                if (roll < 0.3) {
                    const artifact = GAME_ITEMS.find(i => i.id === 'artifact_bead');
                    if (artifact) {
                         const existingIndex = newState.inventory.findIndex(i => i.id === 'artifact_bead');
                         if (existingIndex >= 0) {
                            newState.inventory[existingIndex].quantity += 1;
                         } else {
                            newState.inventory.push({...artifact, quantity: 1});
                         }
                         msg = 'CƠ DUYÊN! Tìm được Tụ Linh Châu trong di tích cổ!';
                         type = 'success';
                    }
                } else if (roll < 0.6) {
                    newState.resources.spiritStones += 100;
                    newState.resources.ores += 20;
                    msg = 'Bên trong là di tích của một Luyện Khí Sư! Thu hoạch lớn.';
                    type = 'success';
                } else {
                     newState.hp = Math.max(1, newState.hp - 50);
                     msg = 'Vừa bước vào liền kích hoạt bẫy rập! (-50 HP)';
                     type = 'danger';
                }
            } else if (optionIndex === 2) { // Blood Sacrifice
                newState.hp = Math.max(1, newState.hp - 30);
                newState.resources.spiritStones += 200;
                msg = 'Dùng máu mở lối đi tắt, tìm được kho báu ẩn. (-30 HP, +200 Linh Thạch)';
                type = 'success';
            } else {
                msg = 'Ngươi quyết định không mạo hiểm.';
            }
        }
        else if (encounterId === 'injured_beast') {
            if (optionIndex === 0) { // Heal
                const reward = 300;
                newState.resources.qi = Math.min(newState.resources.maxQi, newState.resources.qi + reward);
                msg = `Hồ ly cảm kích, nhả ra một viên nội đan tặng ngươi rồi biến mất. (+${reward} Linh Khí)`;
                type = 'success';
            } else { // Kill
                const stones = 50;
                newState.resources.spiritStones += stones;
                msg = `Ngươi ra tay tàn nhẫn, thu được yêu đan đem bán. (+${stones} Linh Thạch)`;
                type = 'combat';
            }
        }

        newState.logs = [{ id: Date.now(), timestamp: Date.now(), type: type, message: `[Cơ Duyên] ${msg}` }, ...newState.logs];
        return newState;
    }

    case 'LOAD_GAME':
        return {
            ...INITIAL_STATE,
            ...action.payload,
            lastTick: Date.now(),
            isExploring: false 
        };

    default:
      return state;
  }
};

// --- Context & Provider ---

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  getCurrentRealm: () => Realm;
  saveGame: () => void;
  resetGame: () => void;
  importSave: (data: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE, (initial) => {
     const saved = localStorage.getItem('cuu-gioi-bat-hu-save');
     if (saved) {
         try {
             const parsed = JSON.parse(saved);
             // Ensure legacy fields exist
             if (parsed.sectId === undefined) parsed.sectId = null;
             if (parsed.traitorDebuffEndTime === undefined) parsed.traitorDebuffEndTime = 0;
             if (parsed.equippedItems === undefined) parsed.equippedItems = INITIAL_STATE.equippedItems;
             if (parsed.breakthroughSupportMod === undefined) parsed.breakthroughSupportMod = 0;
             if (parsed.activeDungeonId === undefined) parsed.activeDungeonId = null;
             return { ...initial, ...parsed };
         } catch (e) {
             console.error("Failed to load save", e);
             return initial;
         }
     }
     return initial;
  });

  const stateRef = useRef(state);
  const isResettingRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const tickRate = 1000; 
    const interval = setInterval(() => {
      dispatch({ type: 'TICK', payload: tickRate });
    }, tickRate);
    return () => clearInterval(interval);
  }, []);

  const saveGame = useCallback(() => {
      if (isResettingRef.current) return; 
      try {
        localStorage.setItem('cuu-gioi-bat-hu-save', JSON.stringify(stateRef.current));
      } catch (e) {
        console.error("Save failed", e);
      }
  }, []);

  const resetGame = useCallback(() => {
      isResettingRef.current = true; 
      localStorage.removeItem('cuu-gioi-bat-hu-save');
      window.location.reload();
  }, []);

  const importSave = useCallback((data: string) => {
      try {
          const parsed = JSON.parse(data);
          dispatch({ type: 'LOAD_GAME', payload: parsed });
          localStorage.setItem('cuu-gioi-bat-hu-save', data);
      } catch(e) {
          alert("Lỗi khi nạp dữ liệu: " + e);
      }
  }, []);

  useEffect(() => {
      const handleSave = () => {
          if (isResettingRef.current) return; 
          localStorage.setItem('cuu-gioi-bat-hu-save', JSON.stringify(stateRef.current));
      };
      const saveInterval = setInterval(handleSave, 5000); 
      window.addEventListener('beforeunload', handleSave);
      return () => {
          clearInterval(saveInterval);
          window.removeEventListener('beforeunload', handleSave);
          if (!isResettingRef.current) {
             handleSave(); 
          }
      };
  }, []);

  const getCurrentRealm = useCallback(() => {
      return REALMS[state.realmIndex];
  }, [state.realmIndex]);

  return (
    <GameContext.Provider value={{ state, dispatch, getCurrentRealm, saveGame, resetGame, importSave }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};