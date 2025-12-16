import { GameState, GameAction, LogEntry, ElementType, ActiveBuff } from '../types';
import { REALMS, INITIAL_STATE, CRAFTABLE_ITEMS, GAME_ITEMS, ENCOUNTERS, SECRET_REALMS, TALENTS } from '../constants';
import { performAscension } from '../utils/ascensionLogic'; // Import logic tách biệt

// --- Hàm Hỗ Trợ: Giảm hiệu quả khi chỉ số quá cao ---
const applyDiminishingReturns = (value: number, threshold: number = 500): number => {
    if (value <= threshold) return value;
    return threshold + (value - threshold) * 0.2;
};

// --- Hàm Hỗ Trợ: Tính giá nâng cấp Talent ---
const getTalentCost = (baseCost: number, multiplier: number, currentLevel: number) => {
    return Math.floor(baseCost * Math.pow(multiplier, currentLevel));
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
  const RIGHTEOUS_WILL_BONUS = 20; 

  // Đảm bảo dữ liệu tồn tại cho save cũ
  if (!state.statBonuses) state.statBonuses = { attack: 5, defense: 2, hp: 100 };
  if (!state.skillCooldowns) state.skillCooldowns = {};
  if (!state.activeBuffs) state.activeBuffs = [];
  if (state.nameChangeCount === undefined) state.nameChangeCount = 0;
  if (state.lastNameChangeTime === undefined) state.lastNameChangeTime = 0;
  if (!state.prestige) state.prestige = { currency: 0, ascensionCount: 0, talents: {}, spiritRootQuality: 0 };
  if (!state.professions) state.professions = { alchemyLevel: 1, blacksmithLevel: 1, alchemyExp: 0, blacksmithExp: 0 };
  if (!state.stash) state.stash = [];

  // --- TÍNH TOÁN TALENT BONUSES ---
  const getTalentLevel = (id: string) => state.prestige.talents[id] || 0;
  
  const talentQiBonus = getTalentLevel('heavenly_roots') * 0.1; // +10% per level
  const talentCraftCostReduction = getTalentLevel('pill_mastery') * 0.02; // -2% per level
  const talentStartStats = getTalentLevel('divine_body') * 5; // +5 stats per level
  const talentDmgBonus = getTalentLevel('sword_intent') * 0.05; // +5% dmg per level
  const talentDropRate = getTalentLevel('fortune_favour') * 0.05; // +5% drop

  // Bonus từ Linh Căn Vĩnh Viễn (Prestige)
  const rootBonus = (state.prestige.spiritRootQuality || 0) / 100; // 0% -> 100%

  switch (action.type) {
    case 'TICK': {
      const deltaSeconds = action.payload / 1000;
      
      // --- 1. XỬ LÝ HỒI LINH KHÍ ---
      let passiveMultiplier = 1;
      
      // Áp dụng Talent Bonus & Root Bonus
      passiveMultiplier += talentQiBonus;
      passiveMultiplier += rootBonus; // Linh căn càng cao, hấp thụ càng nhanh

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

      // ... (Giữ nguyên logic HP, Trauma, Tâm Ma) ...
      // Kiểm tra Tâm Ma
      if (state.traits.includes('great_enlightenment')) {
          if (Math.random() < 0.01) { 
              const loss = Math.floor(currentRealm.maxQiCap * 0.05);
              newQi = Math.max(0, newQi - loss);
          }
      }
      if (state.traits.includes('dao_injury') && state.hp > 0) {
          const burn = state.maxHp * 0.02 * deltaSeconds;
          newHp = Math.max(0, newHp - burn);
      }
      if (newQi > currentRealm.maxQiCap) newQi = currentRealm.maxQiCap;

      // --- 2. XỬ LÝ BUFFS TẠM THỜI (Kỹ năng) ---
      const activeBuffs = state.activeBuffs.filter(b => b.endTime > now);
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
      
      newState.maxHp = 100 + talentStartStats + (totalConstitution * 20) + (state.statBonuses.hp || 0); 
      if (state.traits.includes('body_demonization')) newState.maxHp *= 1.5;

      let newLogs = [...logsToAdd, ...state.logs];
      let newInventory = [...state.inventory];
      
      // --- 5. LOGIC THÁM HIỂM (COMBAT) ---
      if (state.isExploring) {
          // ... (Giữ nguyên toàn bộ logic Combat cũ, chỉ thay đổi phần Loot Rate) ...
          const activeDungeon = state.activeDungeonId ? SECRET_REALMS.find(d => d.id === state.activeDungeonId) : null;
          const difficultyMod = activeDungeon ? activeDungeon.difficultyMod : 1.0;

          if (state.hp > 0) {
              // ... Calc Stats ...
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

              // ... Calc Monster ...
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

              // ... Calc Player Dmg ...
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
              totalPlayerAtk *= (1 + talentDmgBonus); // Apply Talent Dmg
              const gapDmgOutputPenalty = Math.min(0.9, levelGap * 0.2); 
              totalPlayerAtk *= (1.0 - gapDmgOutputPenalty);
              if (Math.random() < gapHitPenalty) totalPlayerAtk = 0; 

              const monsterEstHP = monsterDefense * 15; 
              const killSpeedFactor = totalPlayerAtk > 0 ? Math.min(1.0, totalPlayerAtk / monsterEstHP) : 0; 
              const damageMitigation = Math.min(0.8, killSpeedFactor);

              // ... Calc Damage Taken ...
              let playerPhysDef = 0; 
              if (state.cultivationPath === 'righteous') playerPhysDef += 5; 
              if (state.traits.includes('body_demonization')) playerPhysDef += 10;
              playerPhysDef += talentStartStats; 
              playerPhysDef += (state.equippedItems.armor?.stats?.defense || 0);
              playerPhysDef += (state.statBonuses.defense || 0);
              playerPhysDef += buffDef;
              if (state.cultivationPath === 'righteous') playerPhysDef *= RIGHTEOUS_DEF_BONUS;

              let encounterChance = 0.50;
              if (activeDungeon) encounterChance += 0.2;

              if (Math.random() < encounterChance) { 
                  // ... (Giữ nguyên logic dmg taken) ...
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
                  const damageCap = newState.maxHp * 0.4; 
                  if (protectionActive) {
                      if (levelGap > 3) {
                          if (Math.random() < 0.3) { 
                              newLogs = [{ 
                                  id: Date.now(), timestamp: Date.now(), type: 'danger', 
                                  message: `⚠️ CẢNH GIỚI QUÁ THẤP! Hộ Mệnh Đan vỡ vụn trước sức mạnh tuyệt đối!` 
                              }, ...newLogs];
                          }
                          totalDamageTaken = totalDamageTaken * 2;
                      } else {
                          if (totalDamageTaken > damageCap) totalDamageTaken = damageCap;
                      }
                  }
                  newHp = Math.max(0, state.hp - totalDamageTaken);

                  // --- LOOT DROPS (Updated) ---
                  if (activeDungeon && activeDungeon.lootTable) {
                      const gapLootBonus = levelGap > 0 ? 1.0 + (levelGap * 0.1) : 1.0;
                      // Apply Talent + Root Quality to Drop Rate
                      const rootDropBonus = rootBonus * 0.5; // Linh căn tăng nhẹ drop
                      const dropMod = activeDungeon.dropRateMod * (state.cultivationPath === 'devil' ? 1.2 : 1.0) * gapLootBonus * (1 + talentDropRate + rootDropBonus);
                      
                      for (const loot of activeDungeon.lootTable) {
                          if (Math.random() < (loot.rate * dropMod)) {
                              const qty = Math.floor(Math.random() * (loot.max - loot.min + 1)) + loot.min;
                              const itemDef = GAME_ITEMS.find(i => i.id === loot.itemId);
                              if (itemDef) {
                                  // Auto-stack items
                                  const idx = newInventory.findIndex(i => i.id === loot.itemId);
                                  if (idx >= 0) newInventory[idx].quantity += qty;
                                  else newInventory.push({...itemDef, quantity: qty});
                                  
                                  // Update resource counters for materials
                                  if (itemDef.type === 'material') {
                                      if (loot.itemId === 'ore_iron' || loot.itemId.includes('ore')) newState.resources.ores += qty;
                                      if (loot.itemId === 'wood_spirit') newState.resources.herbs += qty; // Just simulating
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
              return { ...newState, isExploring: false, explorationType: 'none', activeDungeonId: null, logs: newLogs.slice(0, 50), hp: 1, inventory: newInventory }
          }
      } else {
        // Hồi phục HP
        let regenRate = 0.01;
        if (state.equippedItems.armor?.id === 'armor_wood') regenRate *= 1.15;
        newHp = Math.min(newState.maxHp, state.hp + (newState.maxHp * regenRate * deltaSeconds));
      }
      newState.hp = newHp;
      newState.logs = newLogs.slice(0, 50);
      newState.inventory = newInventory;

      // Event
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

    // --- CÁC ACTION CƠ BẢN (Use, Sell, Buy, Equip...) ---
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
             const currentBuffs = state.activeBuffs.filter(b => b.id !== skill.id);
             newState.activeBuffs = [...currentBuffs, buff];
             logMsg = `Kích hoạt ${skill.name}: Tăng ${skill.value} ${skill.type === 'buff_atk' ? 'Công' : 'Thủ'} trong ${skill.duration!/1000}s.`;
        }
        newState.skillCooldowns = { ...newState.skillCooldowns, [skillId]: now + skill.cooldown };
        newState.logs = [{ id: now, timestamp: now, type: 'combat', message: logMsg }, ...state.logs];
        return newState;
    }

    case 'GATHER_QI': {
      const CLICK_COOLDOWN = 125; 
      if (now - state.lastClickTime < CLICK_COOLDOWN) return state;
      let clickMultiplier = state.clickMultiplier;
      clickMultiplier *= (1 + talentQiBonus);
      if (state.cultivationPath === 'devil') clickMultiplier *= DEVIL_CLICK_BONUS;
      if (state.sectId === 'van_kiem') clickMultiplier *= 1.2;
      if (state.traitorDebuffEndTime > now) clickMultiplier *= 0.5;
      const artifactClickBonus = state.equippedItems.artifact?.stats?.clickBonus || 0;
      const gain = ((1 + currentRealm.baseQiGeneration) * clickMultiplier) + artifactClickBonus;
      let newQi = state.resources.qi + gain;
      if (newQi > currentRealm.maxQiCap) newQi = currentRealm.maxQiCap;
      return { ...state, lastClickTime: now, resources: { ...state.resources, qi: newQi } };
    }

    case 'CRAFT_ITEM': {
      const { itemId, cost, type } = action.payload;
      const itemDef = CRAFTABLE_ITEMS.find(i => i.id === itemId);
      if (!itemDef) return state;
      
      const costMultiplier = (1.0 - talentCraftCostReduction);
      const reqHerbs = Math.floor((cost.herbs || 0) * costMultiplier);
      const reqOres = Math.floor((cost.ores || 0) * costMultiplier);
      const reqStones = Math.floor((cost.spiritStones || 0) * costMultiplier);

      if ((state.resources.herbs < reqHerbs) || (state.resources.ores < reqOres) || (state.resources.spiritStones < reqStones)) return state;

      const newResources = { ...state.resources, herbs: state.resources.herbs - reqHerbs, ores: state.resources.ores - reqOres, spiritStones: state.resources.spiritStones - reqStones };
      let craftingChance = state.traits.includes('devil_pact') ? 0.7 : 1.0;
      
      // Update Profession XP
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

      if (Math.random() > craftingChance) return { ...state, resources: newResources, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'danger', message: `Chế tạo THẤT BẠI!` }, ...state.logs] };
      const existingItemIndex = state.inventory.findIndex(i => i.id === itemId);
      let newInventory = [...state.inventory];
      
      // FIX: Tạo bản sao object item thay vì mutate trực tiếp
      if (existingItemIndex >= 0) {
          newInventory[existingItemIndex] = { 
              ...newInventory[existingItemIndex], 
              quantity: newInventory[existingItemIndex].quantity + 1 
          };
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
    }

    // --- KHO CHỨA (STASH) LOGIC ---
    case 'DEPOSIT_STASH': {
        const { itemId, amount } = action.payload;
        const invIdx = state.inventory.findIndex(i => i.id === itemId);
        if (invIdx === -1) return state;
        
        const item = state.inventory[invIdx];
        const qtyToMove = Math.min(amount, item.quantity);
        if (qtyToMove <= 0) return state;

        // FIX: Copy mảng và object item an toàn
        let newInv = [...state.inventory];
        if (item.quantity === qtyToMove) {
            newInv.splice(invIdx, 1);
        } else {
            newInv[invIdx] = { ...item, quantity: item.quantity - qtyToMove };
        }

        let newStash = [...state.stash];
        const stashIdx = newStash.findIndex(i => i.id === itemId);
        if (stashIdx === -1) {
            newStash.push({ ...item, quantity: qtyToMove });
        } else {
            newStash[stashIdx] = { ...newStash[stashIdx], quantity: newStash[stashIdx].quantity + qtyToMove };
        }

        return {
            ...state,
            inventory: newInv,
            stash: newStash,
            logs: [{ id: Date.now(), timestamp: Date.now(), type: 'info', message: `Đã cất ${qtyToMove}x ${item.name} vào kho.` }, ...state.logs]
        };
    }

    case 'WITHDRAW_STASH': {
        const { itemId, amount } = action.payload;
        const stashIdx = state.stash.findIndex(i => i.id === itemId);
        if (stashIdx === -1) return state;
        
        const item = state.stash[stashIdx];
        const qtyToMove = Math.min(amount, item.quantity);
        if (qtyToMove <= 0) return state;

        // FIX: Copy mảng và object item an toàn
        let newStash = [...state.stash];
        if (item.quantity === qtyToMove) {
            newStash.splice(stashIdx, 1);
        } else {
            newStash[stashIdx] = { ...item, quantity: item.quantity - qtyToMove };
        }

        let newInv = [...state.inventory];
        const invIdx = newInv.findIndex(i => i.id === itemId);
        if (invIdx === -1) {
            newInv.push({ ...item, quantity: qtyToMove });
        } else {
            newInv[invIdx] = { ...newInv[invIdx], quantity: newInv[invIdx].quantity + qtyToMove };
        }

        return {
            ...state,
            inventory: newInv,
            stash: newStash,
            logs: [{ id: Date.now(), timestamp: Date.now(), type: 'info', message: `Đã lấy ${qtyToMove}x ${item.name} từ kho.` }, ...state.logs]
        };
    }

    // --- LOGIC PHI THĂNG (SỬ DỤNG UTILS) ---
    case 'ASCEND': {
        const { path } = action.payload;
        return performAscension(state, path);
    }

    case 'SET_PLAYER_NAME': return { ...state, playerName: action.payload };
    case 'SET_AVATAR': return { ...state, avatarUrl: action.payload };
    case 'RENAME_CHARACTER': {
         const newName = action.payload;
        if (!newName || newName.trim().length === 0) return state;
        const RENAME_COOLDOWN = 7 * 24 * 60 * 60 * 1000;
        const timeSinceLast = now - (state.lastNameChangeTime || 0);
        if (state.nameChangeCount > 0 && timeSinceLast < RENAME_COOLDOWN) {
             const daysLeft = Math.ceil((RENAME_COOLDOWN - timeSinceLast) / (24 * 60 * 60 * 1000));
             return { ...state, logs: [{ id: now, timestamp: now, type: 'warning', message: `Chưa thể đổi tên. Vui lòng đợi ${daysLeft} ngày nữa.` }, ...state.logs] };
        }
        let newState = { ...state };
        let logMsg = '';
        if (state.nameChangeCount === 0) {
            logMsg = `Cải danh thành công! Đạo hiệu mới: ${newName} (Lần đầu miễn phí)`;
        } else {
            const scrollIdx = state.inventory.findIndex(i => i.id === 'rename_scroll');
            if (scrollIdx === -1) return { ...state, logs: [{ id: now, timestamp: now, type: 'warning', message: `Cần "Phù Lục Cải Mệnh" để đổi tên lần thứ ${state.nameChangeCount + 1}.` }, ...state.logs] };
            let newInv = [...state.inventory];
            // FIX Mutation
            if (newInv[scrollIdx].quantity > 1) {
                newInv[scrollIdx] = { ...newInv[scrollIdx], quantity: newInv[scrollIdx].quantity - 1 };
            } else {
                newInv.splice(scrollIdx, 1);
            }
            newState.inventory = newInv;
            logMsg = `Đã dùng Phù Lục Cải Mệnh. Cải danh thành công: ${newName}`;
        }
        return {
            ...newState, playerName: newName, nameChangeCount: state.nameChangeCount + 1, lastNameChangeTime: now, logs: [{ id: now, timestamp: now, type: 'success', message: logMsg }, ...state.logs]
        };
    }
    case 'BUY_ITEM': {
        const { itemId, amount } = action.payload;
        const itemDef = GAME_ITEMS.find(i => i.id === itemId);
        if (!itemDef || state.resources.spiritStones < itemDef.price * amount) return state;
        const newResources = { ...state.resources, spiritStones: state.resources.spiritStones - (itemDef.price * amount) };
        const idx = state.inventory.findIndex(i => i.id === itemId);
        let newInv = [...state.inventory];
        // FIX Mutation
        if (idx >= 0) {
             newInv[idx] = { ...newInv[idx], quantity: newInv[idx].quantity + amount };
        } else {
             newInv.push({ ...itemDef, quantity: amount });
        }
        return { ...state, resources: newResources, inventory: newInv, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'success', message: `Mua thành công ${amount}x ${itemDef.name}.` }, ...state.logs] };
    }
    case 'SELL_ITEM': {
        const { itemId, amount } = action.payload;
        const item = state.inventory.find(i => i.id === itemId);
        if (!item || item.quantity < amount) return state;
        const sellPrice = Math.max(1, Math.floor(item.price * 0.5));
        let newInv = [...state.inventory];
        const idx = newInv.findIndex(i => i.id === itemId);
        // FIX Mutation
        if (newInv[idx].quantity === amount) {
            newInv.splice(idx, 1);
        } else {
            newInv[idx] = { ...newInv[idx], quantity: newInv[idx].quantity - amount };
        }
        return { ...state, inventory: newInv, resources: { ...state.resources, spiritStones: state.resources.spiritStones + (sellPrice * amount) }, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'success', message: `Bán ${amount}x ${item.name}.` }, ...state.logs] };
    }
    case 'USE_ITEM': {
        const idx = state.inventory.findIndex(i => i.id === action.payload);
        if (idx === -1) return state;
        const item = state.inventory[idx];
        let newInv = [...state.inventory];
        
        // FIX CRITICAL BUG: Dùng 2 vật phẩm do React StrictMode + Mutation
        // Thay vì newInv[idx].quantity -= 1, ta phải tạo object mới
        if (item.quantity > 1) {
            newInv[idx] = { ...item, quantity: item.quantity - 1 };
        } else {
            newInv.splice(idx, 1);
        }
        
        let logMsg = '';
        let newState = { ...state, inventory: newInv };
        
        // --- XỬ LÝ HIỆU ỨNG VẬT PHẨM ---
        if (item.id === 'pill_small_qi') {
            const qiGain = Math.floor(currentRealm.maxQiCap * 0.10);
            newState.resources = { ...state.resources, qi: Math.min(currentRealm.maxQiCap, state.resources.qi + qiGain) };
            logMsg = `Đã dùng Tiểu Linh Đan (Hồi phục ${qiGain} Linh Khí)`;
        } 
        // --- ĐAN DƯỢC ĐỘT PHÁ ---
        else if (item.id === 'pill_breakthrough') {
            // Trúc Cơ Đan: Dùng cho Luyện Khí (0-5)
            if (state.realmIndex >= 6) {
                logMsg = 'Cảnh giới quá cao, Trúc Cơ Đan không còn tác dụng!';
                // Hoàn trả vật phẩm nếu dùng sai (Optional)
                // return { ...state, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'warning', message: logMsg }, ...state.logs] };
            } else {
                newState.breakthroughSupportMod = 0.2;
                logMsg = 'Đã dùng Trúc Cơ Đan (Tăng 20% tỷ lệ đột phá)';
            }
        } 
        else if (item.id === 'pill_golden_core') {
            // Kết Kim Đan: Dùng cho Trúc Cơ (6-8)
            if (state.realmIndex < 6 || state.realmIndex >= 9) {
                 logMsg = 'Cảnh giới không phù hợp để dùng Kết Kim Đan (Chỉ dùng cho Trúc Cơ)!';
            } else {
                newState.breakthroughSupportMod = 0.15;
                logMsg = 'Dược lực lan tỏa! Đã dùng Kết Kim Đan (Tăng 15% tỷ lệ đột phá Kim Đan)';
            }
        }
        else if (item.id === 'pill_nascent_soul') {
            // Nguyên Anh Đan: Dùng cho Kim Đan (9-11)
            if (state.realmIndex < 9 || state.realmIndex >= 12) {
                 logMsg = 'Cảnh giới không phù hợp để dùng Nguyên Anh Đan (Chỉ dùng cho Kim Đan)!';
            } else {
                newState.breakthroughSupportMod = 0.10;
                logMsg = 'Linh hồn thăng hoa! Đã dùng Nguyên Anh Đan (Tăng 10% tỷ lệ đột phá Nguyên Anh)';
            }
        }
        else if (item.id === 'pill_divine_transformation') {
             // Hóa Thần Đan: Dùng cho Nguyên Anh (12-14)
            if (state.realmIndex < 12 || state.realmIndex >= 15) {
                 logMsg = 'Cảnh giới không phù hợp để dùng Hóa Thần Đan (Chỉ dùng cho Nguyên Anh)!';
            } else {
                newState.breakthroughSupportMod = 0.05;
                logMsg = 'Thiên địa rung chuyển! Đã dùng Hóa Thần Đan (Tăng 5% tỷ lệ đột phá Hóa Thần)';
            }
        }
        
        // --- VẬT PHẨM KHÁC ---
        else if (item.id === 'pill_protection') {
            newState.protectionEndTime = Date.now() + 300000;
            logMsg = 'Đã dùng Hộ Mệnh Đan (Bảo hộ 5 phút)';
        } else if (item.id === 'rename_scroll') {
             // Logic hoàn trả lại cuộn giấy vì đây chỉ là thông báo (Action thực sự nằm ở Settings)
             // Nhưng ở đây ta cứ để logic hiển thị, action RENAME_CHARACTER mới trừ item.
             // Tuy nhiên logic USE_ITEM ở trên đã trừ item rồi. Ta sẽ hoàn lại.
             if (newInv.length === state.inventory.length) {
                 newInv[idx] = { ...newInv[idx], quantity: newInv[idx].quantity + 1 };
             } else {
                 newInv.splice(idx, 0, item);
             }
             newState.inventory = newInv;
             logMsg = 'Hãy dùng vật phẩm này trong phần Thiết Lập -> Đổi Tên';
        } else if (item.id === 'pill_attack_permanent') {
            newState.statBonuses = { ...newState.statBonuses, attack: (newState.statBonuses.attack || 0) + 2 };
            logMsg = 'Cơ thể cường tráng! (+2 Tấn Công)';
        } else if (item.id === 'pill_defense_permanent') {
            newState.statBonuses = { ...newState.statBonuses, defense: (newState.statBonuses.defense || 0) + 2 };
            logMsg = 'Da thịt cứng rắn! (+2 Phòng Thủ)';
        } else if (item.id === 'pill_hp_permanent') {
            newState.statBonuses = { ...newState.statBonuses, hp: (newState.statBonuses.hp || 0) + 50 };
            logMsg = 'Khí huyết dồi dào! (+50 HP Tối Đa)';
        } else if (item.id === 'pill_spirit_root') {
            const currentRoot = state.prestige.spiritRootQuality || 0; // Default 0
            if (currentRoot >= 100) {
                 logMsg = 'Linh Căn đã đạt đến cảnh giới Hỗn Độn (Tối đa), không thể tăng thêm!';
                 // Hoàn trả vật phẩm
                 if (newInv.length === state.inventory.length) {
                    newInv[idx] = { ...newInv[idx], quantity: newInv[idx].quantity + 1 };
                 } else {
                    newInv.splice(idx, 0, item);
                 }
                 newState.inventory = newInv;
            } else {
                 const increase = Math.floor(Math.random() * 2) + 1; // +1 or +2
                 const newRoot = Math.min(100, currentRoot + increase);
                 newState.prestige = { ...state.prestige, spiritRootQuality: newRoot };
                 logMsg = `Tẩy kinh phạt tủy! Phẩm chất Linh Căn tăng: ${currentRoot} -> ${newRoot}`;
            }
        }
        
        if (logMsg) newState.logs = [{ id: Date.now(), timestamp: Date.now(), type: 'success', message: logMsg }, ...state.logs];
        return newState;
    }
    case 'EQUIP_ITEM': {
        const item = state.inventory.find(i => i.id === action.payload);
        if (!item || !item.slot) return state;
        let newInv = [...state.inventory];
        const idx = newInv.findIndex(i => i.id === action.payload);
        // FIX Mutation
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
    }
    case 'UNEQUIP_ITEM': {
        const item = state.equippedItems[action.payload];
        if (!item) return state;
        let newInv = [...state.inventory];
        const idx = newInv.findIndex(i => i.id === item.id);
        // FIX Mutation
        if (idx >= 0) {
            newInv[idx] = { ...newInv[idx], quantity: newInv[idx].quantity + 1 };
        } else {
            newInv.push({ ...item, quantity: 1 });
        }
        return { ...state, inventory: newInv, equippedItems: { ...state.equippedItems, [action.payload]: null } };
    }
    
    // ... (Giữ nguyên các action khác: ATTEMPT_BREAKTHROUGH, EXPLORATION...)
    case 'ATTEMPT_BREAKTHROUGH': {
      if (state.resources.qi < currentRealm.maxQiCap) return { ...state, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'warning', message: 'Linh khí chưa đủ viên mãn để đột phá!' }, ...state.logs] };
      if (state.traits.includes('body_demonization') && state.realmIndex >= 14) return { ...state, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'danger', message: 'Thân thể đã Ma Hóa, Thiên Đạo không dung! Không thể phi thăng Hóa Thần.' }, ...state.logs] }
      let totalChance = currentRealm.breakthroughChance + (state.breakthroughSupportMod || 0);
      if ((state.weaknessEndTime || 0) > now) totalChance -= 0.3;
      if (state.traits.includes('dao_injury')) totalChance += 0.1;
      if (state.traits.includes('heavenly_jealousy')) totalChance -= 0.1;
      
      // Bonus Linh Căn (1% -> 0.01)
      totalChance += (state.prestige.spiritRootQuality || 0) / 500; // 100 quality = +20%

      totalChance = Math.max(0.05, totalChance);
      if (Math.random() < totalChance) {
        const nextRealmIndex = state.realmIndex + 1;
        if (nextRealmIndex >= REALMS.length) return state; 
        const nextWeaknessEnd = Date.now() + 600000;
        return { ...state, realmIndex: nextRealmIndex, resources: { ...state.resources, qi: 0, maxQi: REALMS[nextRealmIndex].maxQiCap }, breakthroughSupportMod: 0, weaknessEndTime: nextWeaknessEnd, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'success', message: `Đột phá thành công! Bước vào cảnh giới ${REALMS[nextRealmIndex].name}!` }, ...state.logs] };
      } else {
         const lostQi = state.resources.qi * 0.3;
         return { ...state, resources: { ...state.resources, qi: state.resources.qi - lostQi }, breakthroughSupportMod: 0, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'danger', message: `Đột phá thất bại! Tổn thất ${Math.floor(lostQi)} Linh Khí.` }, ...state.logs] };
      }
    }
    case 'START_EXPLORATION': return { ...state, isExploring: true, explorationType: action.payload, activeDungeonId: null, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'info', message: 'Bắt đầu du ngoạn tìm kiếm cơ duyên...' }, ...state.logs] };
    case 'START_DUNGEON': {
      const dungeon = SECRET_REALMS.find(d => d.id === action.payload);
      if (!dungeon) return state;
      let logs = [...state.logs];
      if (state.realmIndex < dungeon.reqRealmIndex) logs = [{ id: Date.now(), timestamp: Date.now(), type: 'warning', message: `⚠️ CẢNH BÁO: Vượt cấp khiêu chiến ${dungeon.name}! Nguy cơ tử vong cao!` }, ...logs];
      return { ...state, isExploring: true, explorationType: 'dungeon', activeDungeonId: action.payload, logs: [{ id: Date.now() + 1, timestamp: Date.now(), type: 'info', message: `Tiến vào Bí Cảnh: ${dungeon.name}!` }, ...logs] };
    }
    case 'STOP_EXPLORATION': return { ...state, isExploring: false, explorationType: 'none', activeDungeonId: null, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'info', message: 'Thu hồi thần thức, quay về động phủ.' }, ...state.logs] };
    case 'CHOOSE_PATH': return { ...state, cultivationPath: action.payload };
    case 'JOIN_SECT': return { ...state, sectId: action.payload };
    case 'LEAVE_SECT': return { ...state, sectId: null, traitorDebuffEndTime: Date.now() + 5400000 };
    case 'TRIGGER_ENCOUNTER': return { ...state, activeEncounterId: action.payload, lastEncounterTime: Date.now() };
    
    // --- UPDATED RESOLVE ENCOUNTER LOGIC ---
    case 'RESOLVE_ENCOUNTER': {
        const { encounterId, optionIndex } = action.payload;
        const encounter = ENCOUNTERS.find(e => e.id === encounterId);
        if (!encounter) return { ...state, activeEncounterId: null };

        const option = encounter.options[optionIndex];
        let newState = { ...state, activeEncounterId: null };
        let logs: LogEntry[] = state.logs;

        // 1. Trừ Tài Nguyên
        if (option.resourceCost) {
            const cost = option.resourceCost;
            newState.resources = {
                ...state.resources,
                spiritStones: state.resources.spiritStones - (cost.spiritStones || 0),
                herbs: state.resources.herbs - (cost.herbs || 0),
                ores: state.resources.ores - (cost.ores || 0),
                qi: state.resources.qi - (cost.qi || 0)
            };
        }

        // 2. Nhận Trait (Thiên Phú/Debuff)
        if (option.gainTrait && !state.traits.includes(option.gainTrait)) {
             newState.traits = [...state.traits, option.gainTrait];
             logs = [{ id: Date.now(), timestamp: Date.now(), type: 'warning', message: `Đã nhận hiệu ứng: ${option.gainTrait}` }, ...logs];
        }

        // 3. Nhận Vật Phẩm (Mới)
        if (option.gainItem) {
             const { itemId, quantity } = option.gainItem;
             const itemDef = GAME_ITEMS.find(i => i.id === itemId);
             if (itemDef) {
                 const existingItemIndex = newState.inventory.findIndex(i => i.id === itemId);
                 let newInv = [...newState.inventory];
                 if (existingItemIndex >= 0) {
                     newInv[existingItemIndex] = { ...newInv[existingItemIndex], quantity: newInv[existingItemIndex].quantity + quantity };
                 } else {
                     newInv.push({ ...itemDef, quantity });
                 }
                 newState.inventory = newInv;
                 logs = [{ id: Date.now(), timestamp: Date.now(), type: 'success', message: `Cơ duyên nghịch thiên! Nhận được ${quantity}x ${itemDef.name}!` }, ...logs];
             }
        }

        // Log kết quả chung
        if (!option.gainItem && !option.gainTrait) {
             logs = [{ id: Date.now(), timestamp: Date.now(), type: 'info', message: `Đã chọn: ${option.label}. Sự việc kết thúc.` }, ...logs];
        }

        return { ...newState, logs };
    }

    case 'LOAD_GAME': return { ...INITIAL_STATE, ...action.payload, lastTick: Date.now(), isExploring: false };
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
            logs: [{ id: Date.now(), timestamp: Date.now(), type: 'success', message: `Đã lĩnh ngộ ${talent.name} tầng ${currentLevel + 1}.` }, ...state.logs]
        };
    }

    default:
      return state;
  }
};