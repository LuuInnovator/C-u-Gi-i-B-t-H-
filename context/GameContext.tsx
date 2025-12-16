import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { GameState, GameAction, LogEntry, Realm, Item, ElementType } from '../types';
import { REALMS, INITIAL_STATE, CRAFTABLE_ITEMS, GAME_ITEMS, ENCOUNTERS, SECTS, SECRET_REALMS, TRAITS } from '../constants';

// --- Helper Functions ---
const applyDiminishingReturns = (value: number, threshold: number = 500): number => {
    if (value <= threshold) return value;
    return threshold + (value - threshold) * 0.2;
};

const getElementMultiplier = (attacker: ElementType, defender: ElementType): number => {
    if (attacker === 'none' || defender === 'none') return 1.0;
    if (attacker === 'chaos' || defender === 'chaos') return 1.0; 
    
    const counterMap: Record<string, string> = {
        'metal': 'wood',
        'wood': 'earth',
        'earth': 'water',
        'water': 'fire',
        'fire': 'metal',
        'dark': 'illusion', 
        'illusion': 'human' 
    };

    if (counterMap[attacker] === defender) return 1.5; // Strong
    if (counterMap[defender] === attacker) return 0.6; // Weak (Resisted)
    return 1.0;
};

// --- Reducer Logic ---

const gameReducer = (state: GameState, action: GameAction): GameState => {
  const currentRealm = REALMS[state.realmIndex];
  const now = Date.now();

  const RIGHTEOUS_PASSIVE_BONUS = 1.2; 
  const DEVIL_CLICK_BONUS = 1.2;       
  const RIGHTEOUS_DEF_BONUS = 1.3;     
  const RIGHTEOUS_WILL_BONUS = 20; // Changed to Flat Willpower bonus

  switch (action.type) {
    case 'TICK': {
      const deltaSeconds = action.payload / 1000;
      
      let passiveMultiplier = 1;
      if (state.cultivationPath === 'righteous') passiveMultiplier *= RIGHTEOUS_PASSIVE_BONUS;
      
      if (state.sectId === 'thai_thanh') passiveMultiplier *= 1.15;
      if (state.traits.includes('great_enlightenment')) passiveMultiplier *= 1.5;
      if (state.traits.includes('life_absorption')) passiveMultiplier *= 1.3;

      if (state.traitorDebuffEndTime > now) {
          passiveMultiplier *= 0.5;
      }

      // Unique Effect: "Cauldron" (Tái Tạo) - Increased Regen when Qi low
      const artifact = state.equippedItems.artifact;
      if (artifact?.id === 'cauldron_earth' && state.resources.qi < (state.resources.maxQi * 0.3)) {
          passiveMultiplier += 0.03; // +3% regen speed
      }

      const artifactBonus = artifact?.stats?.qiRegen || 0;
      const qiGain = ((currentRealm.baseQiGeneration * passiveMultiplier) + artifactBonus) * deltaSeconds;
      
      let newQi = state.resources.qi + qiGain;
      let logsToAdd: LogEntry[] = [];
      let newHp = state.hp;

      // Heart Demon Check
      if (state.traits.includes('great_enlightenment')) {
          if (Math.random() < 0.01) { 
              const loss = Math.floor(currentRealm.maxQiCap * 0.05);
              newQi = Math.max(0, newQi - loss);
              logsToAdd.push({
                  id: Date.now(),
                  timestamp: Date.now(),
                  type: 'danger',
                  message: `Tâm Ma bùng phát! Bạn bị tẩu hỏa nhập ma, mất ${loss} Linh Khí.`
              });
          }
      }

      // Dao Injury Burn
      if (state.traits.includes('dao_injury') && state.hp > 0) {
          const burn = state.maxHp * 0.02 * deltaSeconds;
          newHp = Math.max(0, newHp - burn);
      }

      if (newQi > currentRealm.maxQiCap) newQi = currentRealm.maxQiCap;

      let newState = {
        ...state,
        resources: { ...state.resources, qi: newQi },
        lastTick: Date.now(),
      };

      if (isNaN(newState.resources.spiritStones)) newState.resources.spiritStones = 0;
      if (isNaN(newState.resources.herbs)) newState.resources.herbs = 0;
      if (isNaN(newState.resources.ores)) newState.resources.ores = 0;

      // Calculate Dynamic Max HP based on Constitution
      const weaponCon = state.equippedItems.weapon?.stats?.constitution || 0;
      const armorCon = state.equippedItems.armor?.stats?.constitution || 0;
      const artifactCon = state.equippedItems.artifact?.stats?.constitution || 0;
      const totalConstitution = weaponCon + armorCon + artifactCon;
      // Base HP scaling with Realm + Constitution * Multiplier
      newState.maxHp = currentRealm.baseHp + (totalConstitution * 20); 
      if (state.traits.includes('body_demonization')) newState.maxHp *= 1.5;

      let newLogs = [...logsToAdd, ...state.logs];
      let newInventory = [...state.inventory];
      
      if (state.isExploring) {
        const activeDungeon = state.activeDungeonId ? SECRET_REALMS.find(d => d.id === state.activeDungeonId) : null;
        const difficultyMod = activeDungeon ? activeDungeon.difficultyMod : 1.0;
        
        if (state.hp > 0) {
            // --- COMBAT STATS PREPARATION ---
            
            // Player Stats
            const weaponStats = state.equippedItems.weapon?.stats || {};
            const armorStats = state.equippedItems.armor?.stats || {};
            const artifactStats = state.equippedItems.artifact?.stats || {};

            const totalStr = (weaponStats.strength || 0) + (armorStats.strength || 0) + (artifactStats.strength || 0);
            const totalSpi = (weaponStats.spirit || 0) + (armorStats.spirit || 0) + (artifactStats.spirit || 0);
            const totalWill = (weaponStats.willpower || 0) + (armorStats.willpower || 0) + (artifactStats.willpower || 0) + (state.cultivationPath === 'righteous' ? RIGHTEOUS_WILL_BONUS : 0);
            
            const physPen = (weaponStats.physPenetration || 0);
            const magicPen = (weaponStats.magicPenetration || 0);

            // Resistances
            const fireRes = (armorStats.fireRes || 0) + (artifactStats.allRes || 0);
            const poisonRes = (armorStats.poisonRes || 0) + (artifactStats.allRes || 0);
            const mentalRes = (armorStats.mentalRes || 0) + (artifactStats.allRes || 0);

            // Unique Effects Logic
            const fireDmgBonus = state.equippedItems.weapon?.id === 'talisman_fire' ? 0.15 : 0;
            const spreadDmg = state.equippedItems.artifact?.id === 'bracelet_wood' ? 0.05 : 0;
            const lowHpDef = state.equippedItems.artifact?.id === 'ring_rock' && (state.hp / newState.maxHp < 0.2) ? 0.1 : 0;
            const iceShieldBonus = state.equippedItems.armor?.id === 'shield_ice' ? 0.15 : 0; // vs Fire

            // Monster Stats
            let monsterBaseStats = currentRealm; 
            let explorationNerf = 1.0; 
            let damageDist = { physical: 0.9, elemental: 0.1, mental: 0 }; 
            let monsterElement: ElementType = 'none';

            if (activeDungeon) {
                monsterBaseStats = REALMS[activeDungeon.reqRealmIndex]; 
                damageDist = activeDungeon.damageDistribution;
                monsterElement = activeDungeon.element;
            } else if (state.explorationType === 'adventure') {
                explorationNerf = 0.3; 
            }

            const levelGap = Math.max(0, (activeDungeon ? activeDungeon.reqRealmIndex : state.realmIndex) - state.realmIndex);
            const gapHitPenalty = levelGap * 0.15; 
            const gapDmgPenalty = levelGap * 0.10; 

            const baseMonsterAttack = Math.floor(monsterBaseStats.attack * explorationNerf * (0.8 + Math.random() * 0.4));
            const monsterAttack = Math.max(1, baseMonsterAttack * difficultyMod);
            const monsterDefense = Math.floor(monsterBaseStats.defense * explorationNerf * difficultyMod);

            // --- PLAYER DAMAGE CALCULATION ---
            let physRatio = 0.7; 
            let spiritRatio = 0.3;
            let spiritScaling = 500; 

            if (state.realmIndex >= 6) { physRatio = 0.5; spiritRatio = 0.5; }
            if (state.realmIndex >= 9) { physRatio = 0.3; spiritRatio = 0.7; spiritScaling = 400; }
            if (state.realmIndex >= 12) { physRatio = 0.1; spiritRatio = 0.9; spiritScaling = 300; }

            const effectiveStr = applyDiminishingReturns(totalStr);
            const effectiveSpi = applyDiminishingReturns(totalSpi);

            const playerBaseDmg = (currentRealm.attack + (weaponStats.attack || 0) + effectiveStr);
            const playerSpiritDmg = (currentRealm.attack * 1.5) + effectiveSpi + (state.resources.qi / spiritScaling);

            // Apply Element Bonus (Fire Talisman)
            const playerElement = state.equippedItems.weapon?.element || 'none';
            let elementMult = getElementMultiplier(playerElement, monsterElement);
            if (playerElement === 'fire') elementMult += fireDmgBonus;

            // Effective Monster Defense (Penetration)
            const armorIgnored = Math.min(0.8, physPen / 100);
            const magicResIgnored = Math.min(0.8, magicPen / 100);
            
            // Simplified: Monster defense is a mix of Phys/Magic resist
            const monsterPhysDef = monsterDefense * (1 - armorIgnored);
            const monsterMagicDef = monsterDefense * (1 - magicResIgnored); // Assume magic def ~ phys def for generic monsters

            let totalPlayerAtk = (Math.max(0, playerBaseDmg - monsterPhysDef) * physRatio) + 
                                 (Math.max(0, playerSpiritDmg - monsterMagicDef) * spiritRatio);
            
            // Spread damage (Wood Bracelet)
            if (spreadDmg > 0 && playerElement === 'wood') totalPlayerAtk *= (1 + spreadDmg);

            totalPlayerAtk *= elementMult;
            totalPlayerAtk *= (1.0 - Math.min(0.9, gapDmgPenalty));

            if (Math.random() < gapHitPenalty) totalPlayerAtk = 0; 

            const monsterEstHP = monsterDefense * 15; // Beefier monsters
            const killSpeedFactor = totalPlayerAtk > 0 ? Math.min(1.0, totalPlayerAtk / monsterEstHP) : 0; 
            const damageMitigation = Math.min(0.8, killSpeedFactor);

            // --- INCOMING DAMAGE CALCULATION ---
            let playerPhysDef = currentRealm.defense;
            if (state.cultivationPath === 'righteous') playerPhysDef *= RIGHTEOUS_DEF_BONUS;
            if (state.traits.includes('body_demonization')) playerPhysDef *= 1.5;
            playerPhysDef += (state.equippedItems.armor?.stats?.defense || 0);

            // Encounter Chance
            let encounterChance = 0.50;
            if (activeDungeon) encounterChance += 0.2;

            if (Math.random() < encounterChance) { 
                const rawPhys = monsterAttack * damageDist.physical;
                const takenPhys = Math.max(0, rawPhys - playerPhysDef);

                let rawElem = monsterAttack * damageDist.elemental;
                // Apply Resistance (Fire/Poison/All)
                let resPercent = 0;
                if (monsterElement === 'fire') resPercent = Math.min(0.8, (fireRes + (iceShieldBonus * 100)) / 100);
                if (monsterElement === 'wood') resPercent = Math.min(0.8, poisonRes / 100);
                // General Element Res logic
                resPercent = Math.max(resPercent, (state.equippedItems.artifact?.stats?.allRes || 0) / 100);

                const takenElem = Math.max(0, rawElem * (1 - resPercent));

                // Mental Damage
                let rawMental = monsterAttack * damageDist.mental;
                // Mental Defense Formula: 1 Willpower = 1% Reduction (Cap at 80%)
                const mentalReduction = Math.min(0.8, totalWill / 100); 
                const takenMental = Math.max(0, rawMental * (1 - mentalReduction));

                let totalDamageTaken = takenPhys + takenElem + takenMental;
                
                // Low HP Defense Buff
                if (lowHpDef > 0) totalDamageTaken *= (1 - lowHpDef);

                if (state.traits.includes('life_absorption')) totalDamageTaken *= 1.2;
                
                // Quick Kill Mitigation
                totalDamageTaken = totalDamageTaken * (1 - damageMitigation);

                if (totalDamageTaken < 1) totalDamageTaken = 1;
                if (state.sectId === 'thien_cang') totalDamageTaken = Math.floor(totalDamageTaken * 0.85);

                const protectionActive = state.protectionEndTime > now;
                const damageCap = newState.maxHp * 0.4;
                if (protectionActive && totalDamageTaken > damageCap) totalDamageTaken = damageCap;
                
                newHp = Math.max(0, state.hp - totalDamageTaken);

                // --- DROP LOGIC (Using Loot Tables) ---
                let dropMsg = '';
                
                if (activeDungeon && activeDungeon.lootTable) {
                    const dropMod = activeDungeon.dropRateMod * (state.cultivationPath === 'devil' ? 1.2 : 1.0);
                    
                    for (const loot of activeDungeon.lootTable) {
                        if (Math.random() < (loot.rate * dropMod)) {
                            const qty = Math.floor(Math.random() * (loot.max - loot.min + 1)) + loot.min;
                            const itemDef = GAME_ITEMS.find(i => i.id === loot.itemId);
                            
                            if (itemDef) {
                                // Add to Resources or Inventory
                                if (loot.itemId === 'ore_iron' || loot.itemId === 'wood_spirit' || loot.itemId.startsWith('ore_')) {
                                    // Treat as Ores for simplicity in UI, or add to inventory if material type
                                    if (itemDef.type === 'material') {
                                         // Special handling for legacy counters? No, put in inventory for crafting
                                         const idx = newInventory.findIndex(i => i.id === loot.itemId);
                                         if (idx >= 0) newInventory[idx].quantity += qty;
                                         else newInventory.push({...itemDef, quantity: qty});
                                         
                                         // Also increment legacy counters for crafting panel logic (backward compat)
                                         if (itemDef.id === 'ore_iron' || itemDef.id.includes('ore')) newState.resources.ores += qty;
                                    }
                                } else {
                                    const idx = newInventory.findIndex(i => i.id === loot.itemId);
                                    if (idx >= 0) newInventory[idx].quantity += qty;
                                    else newInventory.push({...itemDef, quantity: qty});
                                }
                                dropMsg += ` [${itemDef.name} x${qty}]`;
                            }
                        }
                    }
                } else if (state.explorationType === 'adventure') {
                    // Basic drops for Adventure
                    if (Math.random() < 0.03) {
                        newState.resources.herbs += 1;
                        dropMsg += ' [1 Thảo]';
                    }
                    if (Math.random() < 0.03) {
                        newState.resources.spiritStones += 2;
                        dropMsg += ' [2 L.Thạch]';
                    }
                }

                if (state.sectId === 'duoc_vuong') newState.resources.herbs += 1;
                if (state.sectId === 'huyet_sat') {
                    newHp = Math.min(newState.maxHp, newHp + (newState.maxHp * 0.05));
                }

                let prefix = activeDungeon ? `[${activeDungeon.name}] ` : '';
                let logMsg = '';
                if (totalPlayerAtk === 0) {
                     logMsg = `${prefix}Bị áp chế! Mất ${Math.floor(totalDamageTaken)} HP.`;
                } else {
                     logMsg = `${prefix}Giao chiến! Mất ${Math.floor(totalDamageTaken)} HP.`;
                     if (dropMsg) logMsg += ` Thu: ${dropMsg}`;
                }

                newLogs.unshift({ id: Date.now(), timestamp: Date.now(), type: 'combat', message: logMsg });
            }
        } else {
            newLogs.unshift({
                id: Date.now(),
                timestamp: Date.now(),
                type: 'danger',
                message: `Bạn đã trọng thương! Bị trục xuất khỏi ${activeDungeon ? activeDungeon.name : 'vùng hoang dã'}.`
            });
            return {
                ...newState,
                isExploring: false,
                explorationType: 'none',
                activeDungeonId: null,
                logs: newLogs.slice(0, 50),
                hp: 1, 
                inventory: newInventory
            }
        }
      } else {
        // Passive Regen
        let regenRate = 0.01;
        // Wood Armor: Unique Effect (Simulate regen efficiency)
        if (state.equippedItems.armor?.id === 'armor_wood') regenRate *= 1.15;
        
        newHp = Math.min(newState.maxHp, state.hp + (newState.maxHp * regenRate * deltaSeconds));
      }

      newState.hp = newHp;
      newState.logs = newLogs.slice(0, 50);
      newState.inventory = newInventory;

      const cooldown = 30 * 60 * 1000; 
      if (state.explorationType === 'adventure' && !newState.activeEncounterId && !newState.activeDungeonId && (now - (state.lastEncounterTime || 0) > cooldown)) {
          let encounterProb = 0.005; 
          if (state.sectId === 'tieu_dao') encounterProb = 0.008;

          if (Math.random() < encounterProb) {
              const randomEncounter = ENCOUNTERS[Math.floor(Math.random() * ENCOUNTERS.length)];
              newState.activeEncounterId = randomEncounter.id;
          }
      }

      return newState;
    }

    // ... (Keep existing handlers for GATHER_QI, BREAKTHROUGH, etc.) ...
    case 'GATHER_QI': {
      let clickMultiplier = state.clickMultiplier;
      if (state.cultivationPath === 'devil') clickMultiplier *= DEVIL_CLICK_BONUS;
      if (state.sectId === 'van_kiem') clickMultiplier *= 1.2;
      if (state.traitorDebuffEndTime > now) clickMultiplier *= 0.5;
      const artifactClickBonus = state.equippedItems.artifact?.stats?.clickBonus || 0;
      const gain = ((1 + currentRealm.baseQiGeneration) * clickMultiplier) + artifactClickBonus;
      let newQi = state.resources.qi + gain;
      if (newQi > currentRealm.maxQiCap) newQi = currentRealm.maxQiCap;
      return { ...state, resources: { ...state.resources, qi: newQi } };
    }

    case 'ATTEMPT_BREAKTHROUGH': {
      if (state.resources.qi < currentRealm.maxQiCap) {
        return { ...state, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'warning', message: 'Linh khí chưa đủ viên mãn để đột phá!' }, ...state.logs] };
      }
      if (state.traits.includes('body_demonization') && state.realmIndex >= 14) {
           return { ...state, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'danger', message: 'Thân thể đã Ma Hóa, Thiên Đạo không dung! Không thể phi thăng Hóa Thần.' }, ...state.logs] }
      }
      let totalChance = currentRealm.breakthroughChance + (state.breakthroughSupportMod || 0);
      if ((state.weaknessEndTime || 0) > now) totalChance -= 0.3;
      if (state.traits.includes('dao_injury')) totalChance += 0.1;
      if (state.traits.includes('heavenly_jealousy')) totalChance -= 0.1;
      totalChance = Math.max(0.05, totalChance);

      if (Math.random() < totalChance) {
        const nextRealmIndex = state.realmIndex + 1;
        if (nextRealmIndex >= REALMS.length) return state; 
        const nextWeaknessEnd = Date.now() + 600000;
        return {
          ...state,
          realmIndex: nextRealmIndex,
          resources: { ...state.resources, qi: 0, maxQi: REALMS[nextRealmIndex].maxQiCap },
          breakthroughSupportMod: 0,
          weaknessEndTime: nextWeaknessEnd,
          logs: [{ id: Date.now(), timestamp: Date.now(), type: 'success', message: `Đột phá thành công! Bước vào cảnh giới ${REALMS[nextRealmIndex].name}!` }, ...state.logs]
        };
      } else {
         const lostQi = state.resources.qi * 0.3;
         return {
            ...state,
            resources: { ...state.resources, qi: state.resources.qi - lostQi },
            breakthroughSupportMod: 0,
            logs: [{ id: Date.now(), timestamp: Date.now(), type: 'danger', message: `Đột phá thất bại! Tổn thất ${Math.floor(lostQi)} Linh Khí.` }, ...state.logs]
         };
      }
    }

    case 'START_EXPLORATION':
      if (state.realmIndex === 0) return { ...state, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'warning', message: 'Phàm nhân thân thể yếu đuối, không thể rời núi.' }, ...state.logs] };
      let msg = 'Bắt đầu du ngoạn tìm kiếm cơ duyên...';
      return { ...state, isExploring: true, explorationType: action.payload, activeDungeonId: null, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'info', message: msg }, ...state.logs] };

    case 'START_DUNGEON': {
      const dungeon = SECRET_REALMS.find(d => d.id === action.payload);
      if (!dungeon || state.realmIndex < dungeon.reqRealmIndex) return state;
      return { ...state, isExploring: true, explorationType: 'dungeon', activeDungeonId: action.payload, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'info', message: `Tiến vào Bí Cảnh: ${dungeon.name}!` }, ...state.logs] };
    }

    case 'STOP_EXPLORATION':
      return { ...state, isExploring: false, explorationType: 'none', activeDungeonId: null, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'info', message: 'Thu hồi thần thức, quay về động phủ.' }, ...state.logs] };

    case 'CRAFT_ITEM': {
      const { itemId, cost } = action.payload;
      const itemDef = CRAFTABLE_ITEMS.find(i => i.id === itemId);
      if (!itemDef) return state;
      if ((state.resources.herbs < (cost.herbs || 0)) || (state.resources.ores < (cost.ores || 0)) || (state.resources.spiritStones < (cost.spiritStones || 0))) return state;

      const newResources = { ...state.resources, herbs: state.resources.herbs - (cost.herbs || 0), ores: state.resources.ores - (cost.ores || 0), spiritStones: state.resources.spiritStones - (cost.spiritStones || 0) };
      let craftingChance = state.traits.includes('devil_pact') ? 0.7 : 1.0;

      if (Math.random() > craftingChance) return { ...state, resources: newResources, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'danger', message: `Chế tạo THẤT BẠI!` }, ...state.logs] };

      const existingItemIndex = state.inventory.findIndex(i => i.id === itemId);
      let newInventory = [...state.inventory];
      if (existingItemIndex >= 0) newInventory[existingItemIndex].quantity += 1;
      else newInventory.push({ ...itemDef, quantity: 1 });

      return { ...state, resources: newResources, inventory: newInventory, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'success', message: `Luyện chế thành công ${itemDef.name}!` }, ...state.logs] };
    }

    case 'BUY_ITEM': {
        const { itemId, amount } = action.payload;
        const itemDef = GAME_ITEMS.find(i => i.id === itemId);
        if (!itemDef || state.resources.spiritStones < itemDef.price * amount) return state;
        const newResources = { ...state.resources, spiritStones: state.resources.spiritStones - (itemDef.price * amount) };
        const idx = state.inventory.findIndex(i => i.id === itemId);
        let newInv = [...state.inventory];
        if (idx >= 0) newInv[idx].quantity += amount; else newInv.push({ ...itemDef, quantity: amount });
        return { ...state, resources: newResources, inventory: newInv, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'success', message: `Mua thành công ${amount}x ${itemDef.name}.` }, ...state.logs] };
    }

    case 'SELL_ITEM': {
        const { itemId, amount } = action.payload;
        const item = state.inventory.find(i => i.id === itemId);
        if (!item || item.quantity < amount) return state;
        const sellPrice = Math.max(1, Math.floor(item.price * 0.5));
        let newInv = [...state.inventory];
        const idx = newInv.findIndex(i => i.id === itemId);
        if (newInv[idx].quantity === amount) newInv.splice(idx, 1); else newInv[idx].quantity -= amount;
        return { ...state, inventory: newInv, resources: { ...state.resources, spiritStones: state.resources.spiritStones + (sellPrice * amount) }, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'success', message: `Bán ${amount}x ${item.name}.` }, ...state.logs] };
    }
    
    case 'USE_ITEM': {
        const idx = state.inventory.findIndex(i => i.id === action.payload);
        if (idx === -1) return state;
        const item = state.inventory[idx];
        let newInv = [...state.inventory];
        if (item.quantity > 1) newInv[idx].quantity -= 1; else newInv.splice(idx, 1);
        
        if (item.id === 'pill_small_qi') return { ...state, inventory: newInv, resources: { ...state.resources, qi: Math.min(currentRealm.maxQiCap, state.resources.qi + 100) } };
        if (item.id === 'pill_breakthrough') return { ...state, inventory: newInv, breakthroughSupportMod: 0.2 };
        if (item.id === 'pill_protection') return { ...state, inventory: newInv, protectionEndTime: Date.now() + 300000 };
        return { ...state, inventory: newInv };
    }

    case 'EQUIP_ITEM': {
        const item = state.inventory.find(i => i.id === action.payload);
        if (!item || !item.slot) return state;
        let newInv = [...state.inventory];
        const idx = newInv.findIndex(i => i.id === action.payload);
        if (newInv[idx].quantity > 1) newInv[idx].quantity -= 1; else newInv.splice(idx, 1);
        const currentEquipped = state.equippedItems[item.slot];
        if (currentEquipped) {
            const eIdx = newInv.findIndex(i => i.id === currentEquipped.id);
            if (eIdx >= 0) newInv[eIdx].quantity += 1; else newInv.push(currentEquipped);
        }
        return { ...state, inventory: newInv, equippedItems: { ...state.equippedItems, [item.slot]: item } };
    }

    case 'UNEQUIP_ITEM': {
        const item = state.equippedItems[action.payload];
        if (!item) return state;
        let newInv = [...state.inventory];
        const idx = newInv.findIndex(i => i.id === item.id);
        if (idx >= 0) newInv[idx].quantity += 1; else newInv.push({ ...item, quantity: 1 });
        return { ...state, inventory: newInv, equippedItems: { ...state.equippedItems, [action.payload]: null } };
    }

    case 'SET_PLAYER_NAME': return { ...state, playerName: action.payload };
    case 'CHOOSE_PATH': return { ...state, cultivationPath: action.payload };
    case 'JOIN_SECT': return { ...state, sectId: action.payload };
    case 'LEAVE_SECT': return { ...state, sectId: null, traitorDebuffEndTime: Date.now() + 5400000 };
    case 'TRIGGER_ENCOUNTER': return { ...state, activeEncounterId: action.payload, lastEncounterTime: Date.now() };
    case 'RESOLVE_ENCOUNTER': return { ...state, activeEncounterId: null }; // Simplified logic handled in UI/Modal mostly for cost
    case 'LOAD_GAME': return { ...INITIAL_STATE, ...action.payload, lastTick: Date.now(), isExploring: false };

    default:
      return state;
  }
};

// Define GameContextType here
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
             return { ...initial, ...JSON.parse(saved) };
         } catch { return initial; }
     }
     return initial;
  });
  const stateRef = useRef(state);
  const isResettingRef = useRef(false);

  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => {
    const interval = setInterval(() => dispatch({ type: 'TICK', payload: 1000 }), 1000);
    return () => clearInterval(interval);
  }, []);

  const saveGame = useCallback(() => { localStorage.setItem('cuu-gioi-bat-hu-save', JSON.stringify(stateRef.current)); }, []);
  const resetGame = useCallback(() => { localStorage.removeItem('cuu-gioi-bat-hu-save'); window.location.reload(); }, []);
  const importSave = useCallback((data: string) => { dispatch({ type: 'LOAD_GAME', payload: JSON.parse(data) }); }, []);
  const getCurrentRealm = useCallback(() => REALMS[state.realmIndex], [state.realmIndex]);

  useEffect(() => {
      const saveInterval = setInterval(saveGame, 5000); 
      return () => clearInterval(saveInterval);
  }, [saveGame]);

  return (
    <GameContext.Provider value={{ state, dispatch, getCurrentRealm, saveGame, resetGame, importSave }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame error');
  return context;
};