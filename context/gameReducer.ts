import { GameState, GameAction, LogEntry, ElementType, ActiveBuff } from '../types';
import { REALMS, INITIAL_STATE, CRAFTABLE_ITEMS, GAME_ITEMS, ENCOUNTERS, SECRET_REALMS } from '../constants';

// --- Hàm Hỗ Trợ: Giảm hiệu quả khi chỉ số quá cao ---
const applyDiminishingReturns = (value: number, threshold: number = 500): number => {
    if (value <= threshold) return value;
    return threshold + (value - threshold) * 0.2;
};

// --- Hàm Hỗ Trợ: Tính khắc chế hệ ---
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

    if (counterMap[attacker] === defender) return 1.5; // Khắc chế mạnh
    if (counterMap[defender] === attacker) return 0.6; // Bị khắc chế (Giảm sát thương)
    return 1.0;
};

// --- REDUCER CHÍNH ---
export const gameReducer = (state: GameState, action: GameAction): GameState => {
  const currentRealm = REALMS[state.realmIndex];
  const now = Date.now();

  const RIGHTEOUS_PASSIVE_BONUS = 1.2; 
  const DEVIL_CLICK_BONUS = 1.2;       
  const RIGHTEOUS_DEF_BONUS = 1.3;     
  const RIGHTEOUS_WILL_BONUS = 20; // Cộng thẳng chỉ số Ý chí

  // Đảm bảo dữ liệu tồn tại cho save cũ
  if (!state.statBonuses) state.statBonuses = { attack: 5, defense: 2, hp: 100 };
  if (!state.skillCooldowns) state.skillCooldowns = {};
  if (!state.activeBuffs) state.activeBuffs = [];

  switch (action.type) {
    case 'TICK': {
      const deltaSeconds = action.payload / 1000;
      
      // --- 1. XỬ LÝ HỒI LINH KHÍ ---
      let passiveMultiplier = 1;
      if (state.cultivationPath === 'righteous') passiveMultiplier *= RIGHTEOUS_PASSIVE_BONUS;
      
      if (state.sectId === 'thai_thanh') passiveMultiplier *= 1.15;
      if (state.traits.includes('great_enlightenment')) passiveMultiplier *= 1.5;
      if (state.traits.includes('life_absorption')) passiveMultiplier *= 1.3;

      if (state.traitorDebuffEndTime > now) {
          passiveMultiplier *= 0.5;
      }

      // Hiệu ứng: "Đan Lô"
      const artifact = state.equippedItems.artifact;
      if (artifact?.id === 'cauldron_earth' && state.resources.qi < (state.resources.maxQi * 0.3)) {
          passiveMultiplier += 0.03; 
      }

      const artifactBonus = artifact?.stats?.qiRegen || 0;
      const qiGain = ((currentRealm.baseQiGeneration * passiveMultiplier) + artifactBonus) * deltaSeconds;
      
      let newQi = state.resources.qi + qiGain;
      let logsToAdd: LogEntry[] = [];
      let newHp = state.hp;

      // Kiểm tra Tâm Ma
      if (state.traits.includes('great_enlightenment')) {
          if (Math.random() < 0.01) { 
              const loss = Math.floor(currentRealm.maxQiCap * 0.05);
              newQi = Math.max(0, newQi - loss);
          }
      }

      // Vết Thương Thiên Đạo
      if (state.traits.includes('dao_injury') && state.hp > 0) {
          const burn = state.maxHp * 0.02 * deltaSeconds;
          newHp = Math.max(0, newHp - burn);
      }

      if (newQi > currentRealm.maxQiCap) newQi = currentRealm.maxQiCap;

      // --- 2. XỬ LÝ BUFFS TẠM THỜI (Kỹ năng) ---
      // Lọc bỏ buff đã hết hạn
      const activeBuffs = state.activeBuffs.filter(b => b.endTime > now);
      
      // Tính tổng buff đang có
      let buffAtk = 0;
      let buffDef = 0;
      
      activeBuffs.forEach(buff => {
          if (buff.type === 'buff_atk') buffAtk += buff.value;
          if (buff.type === 'buff_def') buffDef += buff.value;
      });

      // --- 3. CẬP NHẬT TRẠNG THÁI ---
      let newState = {
        ...state,
        resources: { ...state.resources, qi: newQi },
        lastTick: Date.now(),
        activeBuffs: activeBuffs
      };

      if (isNaN(newState.resources.spiritStones)) newState.resources.spiritStones = 0;
      if (isNaN(newState.resources.herbs)) newState.resources.herbs = 0;
      if (isNaN(newState.resources.ores)) newState.resources.ores = 0;

      // --- 4. TÍNH TOÁN HP MAX ---
      const weaponCon = state.equippedItems.weapon?.stats?.constitution || 0;
      const armorCon = state.equippedItems.armor?.stats?.constitution || 0;
      const artifactCon = state.equippedItems.artifact?.stats?.constitution || 0;
      const totalConstitution = weaponCon + armorCon + artifactCon;
      
      newState.maxHp = 100 + (totalConstitution * 20) + (state.statBonuses.hp || 0); 
      
      if (state.traits.includes('body_demonization')) newState.maxHp *= 1.5;

      let newLogs = [...logsToAdd, ...state.logs];
      let newInventory = [...state.inventory];
      
      // --- 5. LOGIC THÁM HIỂM (COMBAT) ---
      if (state.isExploring) {
        const activeDungeon = state.activeDungeonId ? SECRET_REALMS.find(d => d.id === state.activeDungeonId) : null;
        const difficultyMod = activeDungeon ? activeDungeon.difficultyMod : 1.0;
        
        if (state.hp > 0) {
            // Chuẩn bị chỉ số người chơi
            const weaponStats = state.equippedItems.weapon?.stats || {};
            const armorStats = state.equippedItems.armor?.stats || {};
            const artifactStats = state.equippedItems.artifact?.stats || {};

            const totalStr = (weaponStats.strength || 0) + (armorStats.strength || 0) + (artifactStats.strength || 0);
            const totalSpi = (weaponStats.spirit || 0) + (armorStats.spirit || 0) + (artifactStats.spirit || 0);
            const totalWill = (weaponStats.willpower || 0) + (armorStats.willpower || 0) + (artifactStats.willpower || 0) + (state.cultivationPath === 'righteous' ? RIGHTEOUS_WILL_BONUS : 0);
            
            const physPen = (weaponStats.physPenetration || 0);
            const magicPen = (weaponStats.magicPenetration || 0);

            const fireRes = (armorStats.fireRes || 0) + (artifactStats.allRes || 0);
            const poisonRes = (armorStats.poisonRes || 0) + (artifactStats.allRes || 0);
            const mentalRes = (armorStats.mentalRes || 0) + (artifactStats.allRes || 0);

            const fireDmgBonus = state.equippedItems.weapon?.id === 'talisman_fire' ? 0.15 : 0;
            const spreadDmg = state.equippedItems.artifact?.id === 'bracelet_wood' ? 0.05 : 0;
            const lowHpDef = state.equippedItems.artifact?.id === 'ring_rock' && (state.hp / newState.maxHp < 0.2) ? 0.1 : 0;
            const iceShieldBonus = state.equippedItems.armor?.id === 'shield_ice' ? 0.15 : 0;

            // Tính toán quái vật
            let monsterLevelIndex = state.realmIndex;
            if (activeDungeon) {
                monsterLevelIndex = activeDungeon.reqRealmIndex;
            }

            // Tính chênh lệch cấp độ (Level Gap)
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

            // Phạt chênh lệch cấp độ (Cực mạnh)
            // Cứ mỗi 1 level chênh lệch, quái mạnh lên 50%
            const gapStatsMultiplier = 1 + (levelGap * 0.5); 
            
            // Tỷ lệ đánh hụt khi vượt cấp (Mỗi cấp -10% chính xác)
            const gapHitPenalty = levelGap * 0.10; 

            const randomizedAtk = Math.floor(baseMonsterAtkVal * explorationNerf * (0.8 + Math.random() * 0.4));
            
            // Áp dụng multiplier chênh lệch
            const monsterAttack = Math.max(1, randomizedAtk * difficultyMod * gapStatsMultiplier);
            const monsterDefense = Math.floor(baseMonsterDefVal * explorationNerf * difficultyMod * gapStatsMultiplier);

            // Tính sát thương Người chơi
            let physRatio = 0.7; 
            let spiritRatio = 0.3;
            let spiritScaling = 500; 

            if (state.realmIndex >= 6) { physRatio = 0.5; spiritRatio = 0.5; }
            if (state.realmIndex >= 9) { physRatio = 0.3; spiritRatio = 0.7; spiritScaling = 400; }
            if (state.realmIndex >= 12) { physRatio = 0.1; spiritRatio = 0.9; spiritScaling = 300; }

            const effectiveStr = applyDiminishingReturns(totalStr);
            const effectiveSpi = applyDiminishingReturns(totalSpi);

            const basePlayerAtkVal = 5; 
            // CỘNG BUFF TẤN CÔNG
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
            
            // Giảm sát thương gây ra nếu chênh lệch cấp
            const gapDmgOutputPenalty = Math.min(0.9, levelGap * 0.2); // Mỗi cấp giảm 20% sát thương gây ra
            totalPlayerAtk *= (1.0 - gapDmgOutputPenalty);

            if (Math.random() < gapHitPenalty) totalPlayerAtk = 0; // Đánh trượt do chênh lệch

            const monsterEstHP = monsterDefense * 15; 
            const killSpeedFactor = totalPlayerAtk > 0 ? Math.min(1.0, totalPlayerAtk / monsterEstHP) : 0; 
            const damageMitigation = Math.min(0.8, killSpeedFactor);

            // Tính sát thương nhận vào
            let playerPhysDef = 0; 
            if (state.cultivationPath === 'righteous') playerPhysDef += 5; 
            if (state.traits.includes('body_demonization')) playerPhysDef += 10;
            playerPhysDef += (state.equippedItems.armor?.stats?.defense || 0);
            
            playerPhysDef += (state.statBonuses.defense || 0);
            
            // CỘNG BUFF PHÒNG THỦ
            playerPhysDef += buffDef;

            if (state.cultivationPath === 'righteous') playerPhysDef *= RIGHTEOUS_DEF_BONUS;

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

                // --- XỬ LÝ HỘ MỆNH ĐAN VÀ MIỂU SÁT ---
                const protectionActive = state.protectionEndTime > now;
                const damageCap = newState.maxHp * 0.4; // Mặc định không quá 40% máu 1 hit

                if (protectionActive) {
                    if (levelGap > 3) {
                        // Nếu chênh lệch quá lớn (> 3 cấp), Hộ Mệnh Đan vô dụng
                        if (Math.random() < 0.3) { // 30% tỷ lệ hiện log cảnh báo mỗi hit
                            newLogs = [{ 
                                id: Date.now(), timestamp: Date.now(), type: 'danger', 
                                message: `⚠️ CẢNH GIỚI QUÁ THẤP! Hộ Mệnh Đan vỡ vụn trước sức mạnh tuyệt đối!` 
                            }, ...newLogs];
                        }
                        // Sát thương nhân đôi, không có cap -> Miểu sát
                        totalDamageTaken = totalDamageTaken * 2;
                    } else {
                        // Chênh lệch chấp nhận được, Hộ Mệnh Đan hoạt động
                        if (totalDamageTaken > damageCap) totalDamageTaken = damageCap;
                    }
                }
                
                newHp = Math.max(0, state.hp - totalDamageTaken);

                // --- LOOT DROPS ---
                if (activeDungeon && activeDungeon.lootTable) {
                    // Nếu vượt cấp thành công, tăng tỷ lệ rơi đồ
                    const gapLootBonus = levelGap > 0 ? 1.0 + (levelGap * 0.1) : 1.0;
                    const dropMod = activeDungeon.dropRateMod * (state.cultivationPath === 'devil' ? 1.2 : 1.0) * gapLootBonus;
                    
                    for (const loot of activeDungeon.lootTable) {
                        if (Math.random() < (loot.rate * dropMod)) {
                            const qty = Math.floor(Math.random() * (loot.max - loot.min + 1)) + loot.min;
                            const itemDef = GAME_ITEMS.find(i => i.id === loot.itemId);
                            
                            if (itemDef) {
                                if (loot.itemId === 'ore_iron' || loot.itemId === 'wood_spirit' || loot.itemId.startsWith('ore_')) {
                                    if (itemDef.type === 'material') {
                                         const idx = newInventory.findIndex(i => i.id === loot.itemId);
                                         if (idx >= 0) newInventory[idx].quantity += qty;
                                         else newInventory.push({...itemDef, quantity: qty});
                                         
                                         if (itemDef.id === 'ore_iron' || itemDef.id.includes('ore')) newState.resources.ores += qty;
                                    }
                                } else {
                                    const idx = newInventory.findIndex(i => i.id === loot.itemId);
                                    if (idx >= 0) newInventory[idx].quantity += qty;
                                    else newInventory.push({...itemDef, quantity: qty});
                                }
                            }
                        }
                    }
                } else if (state.explorationType === 'adventure') {
                    if (Math.random() < 0.15) newState.resources.herbs += 1; 
                    if (Math.random() < 0.15) newState.resources.spiritStones += Math.floor(Math.random() * 4) + 2; 
                    if (Math.random() < 0.05) newState.resources.ores += 1; 
                }

                if (state.sectId === 'duoc_vuong') newState.resources.herbs += 1;
                if (state.sectId === 'huyet_sat') newHp = Math.min(newState.maxHp, newHp + (newState.maxHp * 0.05));
            }
        } else {
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
        // Hồi phục
        let regenRate = 0.01;
        if (state.equippedItems.armor?.id === 'armor_wood') regenRate *= 1.15;
        newHp = Math.min(newState.maxHp, state.hp + (newState.maxHp * regenRate * deltaSeconds));
      }

      newState.hp = newHp;
      newState.logs = newLogs.slice(0, 50);
      newState.inventory = newInventory;

      // Event ngẫu nhiên
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

    // --- 6. XỬ LÝ KÍCH HOẠT KỸ NĂNG (MỚI) ---
    case 'ACTIVATE_SKILL': {
        const skillId = action.payload;
        
        // Tìm skill trong trang bị
        let skill = null;
        Object.values(state.equippedItems).forEach(item => {
            if (item && item.activeSkill && item.activeSkill.id === skillId) {
                skill = item.activeSkill;
            }
        });

        if (!skill) return state;

        // Kiểm tra Hồi chiêu
        const lastUsed = state.skillCooldowns[skillId] || 0;
        if (now < lastUsed) return state; // Chưa hồi xong

        // Áp dụng Hiệu ứng
        let newState = { ...state };
        let logMsg = '';

        if (skill.type === 'heal') {
            newState.hp = Math.min(state.maxHp, state.hp + skill.value);
            logMsg = `Kích hoạt ${skill.name}: Hồi phục ${skill.value} HP.`;
        } else if (skill.type === 'dmg_burst') {
             // Logic dmg burst đơn giản
             logMsg = `Kích hoạt ${skill.name}: Gây sát thương lớn lên kẻ địch!`;
        } else if (skill.type === 'buff_atk' || skill.type === 'buff_def') {
             const buff: ActiveBuff = {
                 id: skill.id,
                 name: skill.name,
                 type: skill.type,
                 value: skill.value,
                 endTime: now + (skill.duration || 0)
             };
             // Xóa buff cũ cùng id nếu có
             const currentBuffs = state.activeBuffs.filter(b => b.id !== skill.id);
             newState.activeBuffs = [...currentBuffs, buff];
             logMsg = `Kích hoạt ${skill.name}: Tăng ${skill.value} ${skill.type === 'buff_atk' ? 'Công' : 'Thủ'} trong ${skill.duration!/1000}s.`;
        }

        // Cập nhật Cooldown
        newState.skillCooldowns = {
            ...newState.skillCooldowns,
            [skillId]: now + skill.cooldown
        };

        newState.logs = [{ id: now, timestamp: now, type: 'combat', message: logMsg }, ...state.logs];
        return newState;
    }

    // Các case khác giữ nguyên...
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
      // Cập nhật: Cho phép vào dungeon cấp cao, nhưng cảnh báo
      if (!dungeon) return state;
      
      let logs = [...state.logs];
      if (state.realmIndex < dungeon.reqRealmIndex) {
          logs = [{ 
              id: Date.now(), timestamp: Date.now(), type: 'warning', 
              message: `⚠️ CẢNH BÁO: Đạo hữu đang vượt cấp khiêu chiến ${dungeon.name}! Nguy cơ tử vong cực cao!` 
          }, ...logs];
      }

      return { 
          ...state, 
          isExploring: true, 
          explorationType: 'dungeon', 
          activeDungeonId: action.payload, 
          logs: [{ id: Date.now() + 1, timestamp: Date.now(), type: 'info', message: `Tiến vào Bí Cảnh: ${dungeon.name}!` }, ...logs] 
      };
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
        
        let logMsg = '';
        let newState = { ...state, inventory: newInv };

        // Xử lý Vật phẩm tiêu hao
        if (item.id === 'pill_small_qi') {
            const qiGain = Math.floor(currentRealm.maxQiCap * 0.10);
            newState.resources = { ...state.resources, qi: Math.min(currentRealm.maxQiCap, state.resources.qi + qiGain) };
            logMsg = `Đã dùng Tiểu Linh Đan (Hồi phục ${qiGain} Linh Khí)`;
        }
        else if (item.id === 'pill_breakthrough') {
            newState.breakthroughSupportMod = 0.2;
            logMsg = 'Đã dùng Trúc Cơ Đan (Tăng tỷ lệ đột phá)';
        }
        else if (item.id === 'pill_protection') {
            newState.protectionEndTime = Date.now() + 300000;
            logMsg = 'Đã dùng Hộ Mệnh Đan (Bảo hộ 5 phút)';
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

        if (logMsg) {
             newState.logs = [{ id: Date.now(), timestamp: Date.now(), type: 'success', message: logMsg }, ...state.logs];
        }

        return newState;
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
    case 'RESOLVE_ENCOUNTER': return { ...state, activeEncounterId: null };
    case 'LOAD_GAME': return { ...INITIAL_STATE, ...action.payload, lastTick: Date.now(), isExploring: false };

    default:
      return state;
  }
};