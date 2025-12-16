import { GameState, ElementType, LogEntry } from '../../types';
import { GAME_ITEMS, SECRET_REALMS, REALMS } from '../../constants';
import { applyDiminishingReturns, getElementMultiplier } from '../../utils/formulas';

export const processCombatRound = (state: GameState): GameState => {
    if (state.hp <= 0) return state;

    let newState = { ...state };
    let newLogs: LogEntry[] = [...state.logs];
    let newInventory = [...state.inventory];

    const currentRealm = REALMS[state.realmIndex];
    const activeDungeon = state.activeDungeonId ? SECRET_REALMS.find(d => d.id === state.activeDungeonId) : null;
    const difficultyMod = activeDungeon ? activeDungeon.difficultyMod : 1.0;

    // --- 1. TÍNH TOÁN CHỈ SỐ NGƯỜI CHƠI ---
    const weaponStats = state.equippedItems.weapon?.stats || {};
    const armorStats = state.equippedItems.armor?.stats || {};
    const artifactStats = state.equippedItems.artifact?.stats || {};
    
    // Talent & Buffs
    const talentStartStats = (state.prestige.talents['divine_body'] || 0) * 5;
    const talentDmgBonus = (state.prestige.talents['sword_intent'] || 0) * 0.05;
    const talentDropRate = (state.prestige.talents['fortune_favour'] || 0) * 0.05;
    const rootBonus = (state.prestige.spiritRootQuality || 0) / 100;

    const now = Date.now();
    let buffAtk = 0;
    let buffDef = 0;
    state.activeBuffs.forEach(buff => {
        if (buff.endTime > now) {
            if (buff.type === 'buff_atk') buffAtk += buff.value;
            if (buff.type === 'buff_def') buffDef += buff.value;
        }
    });

    const totalStr = (weaponStats.strength || 0) + (armorStats.strength || 0) + (artifactStats.strength || 0);
    const totalSpi = (weaponStats.spirit || 0) + (armorStats.spirit || 0) + (artifactStats.spirit || 0);
    // Righteous Will Bonus
    const righteousWillBonus = state.cultivationPath === 'righteous' ? 20 : 0;
    const totalWill = (weaponStats.willpower || 0) + (armorStats.willpower || 0) + (artifactStats.willpower || 0) + righteousWillBonus;
    
    const physPen = (weaponStats.physPenetration || 0);
    const magicPen = (weaponStats.magicPenetration || 0);
    
    const fireRes = (armorStats.fireRes || 0) + (artifactStats.allRes || 0);
    const poisonRes = (armorStats.poisonRes || 0) + (artifactStats.allRes || 0);
    // Item specific bonuses
    const fireDmgBonus = state.equippedItems.weapon?.id === 'talisman_fire' ? 0.15 : 0;
    const spreadDmg = state.equippedItems.artifact?.id === 'bracelet_wood' ? 0.05 : 0;
    const lowHpDef = state.equippedItems.artifact?.id === 'ring_rock' && (state.hp / state.maxHp < 0.2) ? 0.1 : 0;
    const iceShieldBonus = state.equippedItems.armor?.id === 'shield_ice' ? 0.15 : 0;

    // --- 2. TÍNH TOÁN QUÁI VẬT ---
    let monsterLevelIndex = state.realmIndex;
    if (activeDungeon) monsterLevelIndex = activeDungeon.reqRealmIndex;
    const levelGap = activeDungeon ? Math.max(0, activeDungeon.reqRealmIndex - state.realmIndex) : 0;
    
    const baseMonsterAtkVal = 10 + (monsterLevelIndex * 15);
    const baseMonsterDefVal = 5 + (monsterLevelIndex * 8);
    
    let explorationNerf = 1.0; 
    let damageDist = { physical: 0.9, elemental: 0.1, mental: 0 }; 
    let monsterElement: ElementType = 'none';
    
    if (activeDungeon) {
        damageDist = activeDungeon.damageDistribution;
        monsterElement = activeDungeon.element;
    } else if (state.explorationType === 'adventure') {
        explorationNerf = 0.3; 
    }

    const gapStatsMultiplier = 1 + (levelGap * 0.5); 
    const gapHitPenalty = levelGap * 0.10; 
    const randomizedAtk = Math.floor(baseMonsterAtkVal * explorationNerf * (0.8 + Math.random() * 0.4));
    
    const monsterAttack = Math.max(1, randomizedAtk * difficultyMod * gapStatsMultiplier);
    const monsterDefense = Math.floor(baseMonsterDefVal * explorationNerf * difficultyMod * gapStatsMultiplier);

    // --- 3. TÍNH SÁT THƯƠNG NGƯỜI CHƠI GÂY RA ---
    let physRatio = 0.7; let spiritRatio = 0.3; let spiritScaling = 500; 
    if (state.realmIndex >= 6) { physRatio = 0.5; spiritRatio = 0.5; }
    if (state.realmIndex >= 9) { physRatio = 0.3; spiritRatio = 0.7; spiritScaling = 400; }
    if (state.realmIndex >= 12) { physRatio = 0.1; spiritRatio = 0.9; spiritScaling = 300; }

    const effectiveStr = applyDiminishingReturns(totalStr);
    const effectiveSpi = applyDiminishingReturns(totalSpi);
    const basePlayerAtkVal = 5 + talentStartStats; 
    
    const playerBaseDmg = (basePlayerAtkVal + (weaponStats.attack || 0) + effectiveStr + (state.statBonuses.attack || 0) + buffAtk);
    const playerSpiritDmg = (basePlayerAtkVal * 1.5) + effectiveSpi + (state.resources.qi / spiritScaling);
    
    const playerElement = state.equippedItems.weapon?.element || 'none';
    let elementMult = getElementMultiplier(playerElement, monsterElement);
    if (playerElement === 'fire') elementMult += fireDmgBonus;

    const armorIgnored = Math.min(0.8, physPen / 100);
    const magicResIgnored = Math.min(0.8, magicPen / 100);
    const monsterPhysDef = monsterDefense * (1 - armorIgnored);
    const monsterMagicDef = monsterDefense * (1 - magicResIgnored); 

    let totalPlayerAtk = (Math.max(0, playerBaseDmg - monsterPhysDef) * physRatio) + 
                         (Math.max(0, playerSpiritDmg - monsterMagicDef) * spiritRatio);
    
    if (spreadDmg > 0 && playerElement === 'wood') totalPlayerAtk *= (1 + spreadDmg);
    totalPlayerAtk *= elementMult;
    totalPlayerAtk *= (1 + talentDmgBonus); 
    
    const gapDmgOutputPenalty = Math.min(0.9, levelGap * 0.2); 
    totalPlayerAtk *= (1.0 - gapDmgOutputPenalty);
    if (Math.random() < gapHitPenalty) totalPlayerAtk = 0; 

    const monsterEstHP = monsterDefense * 15; 
    const killSpeedFactor = totalPlayerAtk > 0 ? Math.min(1.0, totalPlayerAtk / monsterEstHP) : 0; 
    const damageMitigation = Math.min(0.8, killSpeedFactor);

    // --- 4. TÍNH SÁT THƯƠNG NHẬN VÀO ---
    let playerPhysDef = 0; 
    if (state.cultivationPath === 'righteous') playerPhysDef += 5; 
    if (state.traits.includes('body_demonization')) playerPhysDef += 10;
    playerPhysDef += talentStartStats; 
    playerPhysDef += (state.equippedItems.armor?.stats?.defense || 0);
    playerPhysDef += (state.statBonuses.defense || 0);
    playerPhysDef += buffDef;
    if (state.cultivationPath === 'righteous') playerPhysDef *= 1.3; // Righteous Bonus

    let encounterChance = 0.50;
    if (activeDungeon) encounterChance += 0.2;

    if (Math.random() < encounterChance) { 
        const rawPhys = monsterAttack * damageDist.physical;
        const takenPhys = Math.max(0, rawPhys - playerPhysDef);
        
        let rawElem = monsterAttack * damageDist.elemental;
        let resPercent = 0;
        if (monsterElement === 'fire') resPercent = Math.min(0.8, (fireRes + (iceShieldBonus * 100)) / 100);
        if (monsterElement === 'wood') resPercent = Math.min(0.8, poisonRes / 100);
        resPercent = Math.max(resPercent, (state.equippedItems.artifact?.stats?.allRes || 0) / 100);
        const takenElem = Math.max(0, rawElem * (1 - resPercent));
        
        let rawMental = monsterAttack * damageDist.mental;
        const mentalReduction = Math.min(0.8, totalWill / 100); 
        const takenMental = Math.max(0, rawMental * (1 - mentalReduction));
        
        let totalDamageTaken = takenPhys + takenElem + takenMental;
        
        if (lowHpDef > 0) totalDamageTaken *= (1 - lowHpDef);
        if (state.traits.includes('life_absorption')) totalDamageTaken *= 1.2;
        
        totalDamageTaken = totalDamageTaken * (1 - damageMitigation);
        if (totalDamageTaken < 1) totalDamageTaken = 1;
        if (state.sectId === 'thien_cang') totalDamageTaken = Math.floor(totalDamageTaken * 0.85);
        
        const protectionActive = state.protectionEndTime > now;
        const damageCap = state.maxHp * 0.4; 
        
        if (protectionActive) {
            if (levelGap > 3) {
                if (Math.random() < 0.3) { 
                    newLogs = [{ 
                        id: Date.now(), timestamp: Date.now(), type: 'danger' as const, 
                        message: `⚠️ CẢNH GIỚI QUÁ THẤP! Hộ Mệnh Đan vỡ vụn trước sức mạnh tuyệt đối!` 
                    }, ...newLogs];
                }
                totalDamageTaken = totalDamageTaken * 2;
            } else {
                if (totalDamageTaken > damageCap) totalDamageTaken = damageCap;
            }
        }
        
        newState.hp = Math.max(0, state.hp - totalDamageTaken);

        // --- 5. XỬ LÝ LOOT DROPS & HỒI MÁU CƠ DUYÊN ---
        if (activeDungeon && activeDungeon.lootTable) {
            const gapLootBonus = levelGap > 0 ? 1.0 + (levelGap * 0.1) : 1.0;
            const rootDropBonus = rootBonus * 0.5; 
            const dropMod = activeDungeon.dropRateMod * (state.cultivationPath === 'devil' ? 1.2 : 1.0) * gapLootBonus * (1 + talentDropRate + rootDropBonus);
            
            for (const loot of activeDungeon.lootTable) {
                if (Math.random() < (loot.rate * dropMod)) {
                    const qty = Math.floor(Math.random() * (loot.max - loot.min + 1)) + loot.min;
                    const itemDef = GAME_ITEMS.find(i => i.id === loot.itemId);
                    if (itemDef) {
                        const idx = newInventory.findIndex(i => i.id === loot.itemId);
                        if (idx >= 0) newInventory[idx] = { ...newInventory[idx], quantity: newInventory[idx].quantity + qty };
                        else newInventory.push({...itemDef, quantity: qty});
                        
                        if (itemDef.type === 'material') {
                            if (loot.itemId.includes('ore')) newState.resources = {...newState.resources, ores: newState.resources.ores + qty};
                            if (loot.itemId === 'wood_spirit') newState.resources = {...newState.resources, herbs: newState.resources.herbs + qty};
                        }
                    }
                }
            }
        } else if (state.explorationType === 'adventure') {
            // Cập nhật tỷ lệ rơi đồ khi Du Ngoạn
            if (Math.random() < 0.25) newState.resources = { ...newState.resources, herbs: newState.resources.herbs + 1 }; // Tăng 15% -> 25%
            if (Math.random() < 0.25) newState.resources = { ...newState.resources, spiritStones: newState.resources.spiritStones + Math.floor(Math.random() * 6) + 5 }; // Tăng 15% -> 25%, số lượng tăng
            if (Math.random() < 0.12) newState.resources = { ...newState.resources, ores: newState.resources.ores + 1 }; // Tăng 5% -> 12%
            
            // Hồi phục nhẹ khi tìm thấy cơ duyên (Linh quả, suối tiên...)
            if (Math.random() < 0.15) {
                const healVal = Math.floor(newState.maxHp * 0.05); // Hồi 5% MaxHP
                newState.hp = Math.min(newState.maxHp, newState.hp + healVal);
            }
        }
        
        if (state.sectId === 'duoc_vuong') newState.resources = { ...newState.resources, herbs: newState.resources.herbs + 1 };
        if (state.sectId === 'huyet_sat') newState.hp = Math.min(state.maxHp, newState.hp + (state.maxHp * 0.05));
    }

    // --- 6. XỬ LÝ CHẾT ---
    if (newState.hp <= 0) {
        return { 
            ...newState, 
            isExploring: false, 
            explorationType: 'none', 
            activeDungeonId: null, 
            logs: [{ id: Date.now(), timestamp: Date.now(), type: 'danger' as const, message: 'Bạn đã bị trọng thương và được đưa về động phủ!' }, ...newLogs].slice(0, 50), 
            hp: 1, 
            inventory: newInventory 
        };
    }

    newState.logs = newLogs.slice(0, 50);
    newState.inventory = newInventory;
    return newState;
};