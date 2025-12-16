import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { GameState, GameAction, LogEntry, Realm, Item } from '../types';
import { REALMS, INITIAL_STATE, CRAFTABLE_ITEMS, ENCOUNTERS } from '../constants';

// --- Reducer Logic ---

const gameReducer = (state: GameState, action: GameAction): GameState => {
  const currentRealm = REALMS[state.realmIndex];

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
      if (state.cultivationPath === 'righteous') passiveMultiplier = RIGHTEOUS_PASSIVE_BONUS;

      const qiGain = (currentRealm.baseQiGeneration * passiveMultiplier) * deltaSeconds;
      
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
      
      if (state.isExploring) {
        // Heal slowly if not dead
        if (state.hp > 0) {
            // Base encounter chance 50%
            let encounterChance = 0.50;
            if (state.cultivationPath === 'devil') encounterChance += DEVIL_LOOT_BONUS;

            if (Math.random() < encounterChance) { 
                const monsterPower = Math.floor(currentRealm.attack * (0.6 + Math.random() * 0.3));
                
                let playerDef = currentRealm.defense;
                if (state.cultivationPath === 'righteous') playerDef *= RIGHTEOUS_DEF_BONUS;

                const damageTaken = Math.max(1, (monsterPower + (currentRealm.id * 2)) - playerDef);
                newHp = Math.max(0, state.hp - damageTaken);
                
                const herbsFound = Math.floor(Math.random() * 3) + 1 + currentRealm.id;
                const oreChance = 0.3 + (currentRealm.id * 0.01);
                let oresFound = 0;
                if (Math.random() < oreChance) {
                    oresFound = Math.floor(Math.random() * 2) + 1 + Math.floor(currentRealm.id / 3);
                }
                const stonesFound = Math.floor(Math.random() * 10) + 1 + (currentRealm.id * 8);

                newState.resources.herbs += herbsFound;
                newState.resources.ores += oresFound;
                newState.resources.spiritStones += stonesFound;

                newLogs.unshift({
                    id: Date.now(),
                    timestamp: Date.now(),
                    type: 'combat',
                    message: `Gặp yêu thú! Chịu ${Math.floor(damageTaken)} sát thương. Thu được: ${herbsFound} Thảo, ${oresFound} Khoáng, ${stonesFound} Linh Thạch.`
                });
            }
        } else {
            newLogs.unshift({
                id: Date.now(),
                timestamp: Date.now(),
                type: 'danger',
                message: `Bạn đã trọng thương! Chuyến du ngoạn kết thúc.`
            });
            return {
                ...newState,
                isExploring: false,
                logs: newLogs.slice(0, 50),
                hp: 1, 
            }
        }
      } else {
        // Regen HP when idle (5% max HP per second)
        newHp = Math.min(state.maxHp, state.hp + (state.maxHp * 0.05 * deltaSeconds));
      }

      newState.hp = newHp;
      newState.logs = newLogs.slice(0, 50);

      // 3. Random Encounter Check (Every Tick)
      // Condition: Not currently in an encounter, and cooldown passed (e.g. 60 seconds)
      const now = Date.now();
      const cooldown = 60000; // 1 minute
      if (!newState.activeEncounterId && (now - (state.lastEncounterTime || 0) > cooldown)) {
          // 0.5% chance per tick (assuming tick is 1s) -> avg every 3-4 mins
          if (Math.random() < 0.005) {
              const randomEncounter = ENCOUNTERS[Math.floor(Math.random() * ENCOUNTERS.length)];
              newState.activeEncounterId = randomEncounter.id;
          }
      }

      return newState;
    }

    case 'GATHER_QI': {
      let clickMultiplier = state.clickMultiplier;
      if (state.cultivationPath === 'devil') clickMultiplier *= DEVIL_CLICK_BONUS;

      const gain = (1 + currentRealm.baseQiGeneration) * clickMultiplier;
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

      const success = Math.random() < currentRealm.breakthroughChance;
      
      if (success) {
        const nextRealmIndex = state.realmIndex + 1;
        if (nextRealmIndex >= REALMS.length) return state; 

        return {
          ...state,
          realmIndex: nextRealmIndex,
          resources: { ...state.resources, qi: 0, maxQi: REALMS[nextRealmIndex].maxQiCap },
          hp: state.maxHp * 1.5,
          maxHp: state.maxHp * 1.5,
          logs: [{ id: Date.now(), timestamp: Date.now(), type: 'success', message: `Đột phá thành công! Bước vào cảnh giới ${REALMS[nextRealmIndex].name}!` }, ...state.logs]
        };
      } else {
         const lostQi = state.resources.qi * 0.3;
         return {
            ...state,
            resources: { ...state.resources, qi: state.resources.qi - lostQi },
            logs: [{ id: Date.now(), timestamp: Date.now(), type: 'danger', message: `Đột phá thất bại! Tâm ma quấy nhiễu, tổn thất ${Math.floor(lostQi)} Linh Khí.` }, ...state.logs]
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
      return { ...state, isExploring: true, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'info', message: 'Bắt đầu rời động phủ du ngoạn...' }, ...state.logs] };

    case 'STOP_EXPLORATION':
      return { ...state, isExploring: false, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'info', message: 'Thu hồi thần thức, quay về động phủ.' }, ...state.logs] };

    case 'CRAFT_ITEM': {
      const { itemId, cost } = action.payload;
      const itemDef = CRAFTABLE_ITEMS.find(i => i.id === itemId);
      if (!itemDef) return state;

      if ((state.resources.herbs < (cost.herbs || 0)) || (state.resources.ores < (cost.ores || 0))) {
         return { ...state, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'warning', message: 'Không đủ nguyên liệu!' }, ...state.logs] };
      }

      const newResources = {
          ...state.resources,
          herbs: state.resources.herbs - (cost.herbs || 0),
          ores: state.resources.ores - (cost.ores || 0),
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
        let msg = '';

        if (itemId === 'pill_small_qi') {
            newQi = Math.min(currentRealm.maxQiCap, newQi + 100);
            msg = 'Sử dụng Tiểu Linh Đan, tăng 100 Linh Khí.';
        }

        if (newInventory[itemIndex].quantity > 1) {
            newInventory[itemIndex].quantity -= 1;
        } else {
            newInventory.splice(itemIndex, 1);
        }

        return {
            ...state,
            resources: { ...state.resources, qi: newQi },
            inventory: newInventory,
            logs: [{ id: Date.now(), timestamp: Date.now(), type: 'info', message: msg }, ...state.logs]
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
        // This is simplified hardcoded logic for the specific encounter IDs
        // In a bigger app, we'd use a strategy pattern or specific handlers.
        
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
                if (Math.random() > 0.4) {
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