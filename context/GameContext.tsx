import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { GameState, GameAction, LogEntry, Realm, Item } from '../types';
import { REALMS, INITIAL_STATE, CRAFTABLE_ITEMS } from '../constants';

// --- Reducer Logic ---

const gameReducer = (state: GameState, action: GameAction): GameState => {
  const currentRealm = REALMS[state.realmIndex];

  switch (action.type) {
    case 'TICK': {
      // 1. Calculate Passive Qi Generation
      const deltaSeconds = action.payload / 1000;
      const qiGain = currentRealm.baseQiGeneration * deltaSeconds;
      
      let newQi = state.resources.qi + qiGain;
      if (newQi > currentRealm.maxQiCap) newQi = currentRealm.maxQiCap;

      // 2. Handle Exploration Logic (Simple Combat Loop)
      let newLogs = [...state.logs];
      let newResources = { ...state.resources, qi: newQi };
      let newHp = state.hp;
      
      if (state.isExploring) {
        // Heal slowly if not dead
        if (state.hp > 0) {
            // Encounter chance per tick
            if (Math.random() < 0.05) { // 5% chance per tick approx
                const monsterDmg = Math.max(1, Math.floor(currentRealm.id * 2 * Math.random()));
                const playerDmg = currentRealm.attack;
                
                // Player takes damage
                newHp = Math.max(0, state.hp - Math.max(0, monsterDmg - currentRealm.defense));
                
                // Loot logic
                const herbsFound = Math.floor(Math.random() * 2) + 1;
                const oresFound = Math.random() < 0.3 ? 1 : 0;
                newResources.herbs += herbsFound;
                newResources.ores += oresFound;
                newResources.spiritStones += Math.floor(Math.random() * 3);

                newLogs.unshift({
                    id: Date.now(),
                    timestamp: Date.now(),
                    type: 'combat',
                    message: `Gặp yêu thú! Nhận ${monsterDmg} sát thương. Thu được ${herbsFound} Linh Thảo.`
                });
            }
        } else {
            // Player died
            newLogs.unshift({
                id: Date.now(),
                timestamp: Date.now(),
                type: 'danger',
                message: `Bạn đã trọng thương! Thám hiểm kết thúc.`
            });
            return {
                ...state,
                isExploring: false,
                logs: newLogs.slice(0, 50),
                hp: 1, // Revive at 1 hp
                lastTick: Date.now(),
            }
        }
      } else {
        // Regen HP when idle
        newHp = Math.min(state.maxHp, state.hp + (state.maxHp * 0.05 * deltaSeconds));
      }

      return {
        ...state,
        resources: newResources,
        hp: newHp,
        logs: newLogs.slice(0, 50), // Keep log size manageable
        lastTick: Date.now(),
      };
    }

    case 'GATHER_QI': {
      const gain = (1 + currentRealm.baseQiGeneration) * state.clickMultiplier;
      let newQi = state.resources.qi + gain;
      if (newQi > currentRealm.maxQiCap) newQi = currentRealm.maxQiCap;
      return {
        ...state,
        resources: { ...state.resources, qi: newQi },
      };
    }

    case 'ATTEMPT_BREAKTHROUGH': {
      // Check if enough Qi
      if (state.resources.qi < currentRealm.maxQiCap) {
        return {
          ...state,
          logs: [{ id: Date.now(), timestamp: Date.now(), type: 'warning', message: 'Linh khí chưa đủ viên mãn để đột phá!' }, ...state.logs]
        };
      }

      const success = Math.random() < currentRealm.breakthroughChance;
      
      if (success) {
        const nextRealmIndex = state.realmIndex + 1;
        if (nextRealmIndex >= REALMS.length) return state; // Max level

        return {
          ...state,
          realmIndex: nextRealmIndex,
          resources: { ...state.resources, qi: 0, maxQi: REALMS[nextRealmIndex].maxQiCap },
          hp: state.maxHp * 1.5, // Heal and boost
          maxHp: state.maxHp * 1.5,
          logs: [{ id: Date.now(), timestamp: Date.now(), type: 'success', message: `Đột phá thành công! Bước vào cảnh giới ${REALMS[nextRealmIndex].name}!` }, ...state.logs]
        };
      } else {
         // Failure penalty: lose 30% current Qi
         const lostQi = state.resources.qi * 0.3;
         return {
            ...state,
            resources: { ...state.resources, qi: state.resources.qi - lostQi },
            logs: [{ id: Date.now(), timestamp: Date.now(), type: 'danger', message: `Đột phá thất bại! Tâm ma quấy nhiễu, tổn thất ${Math.floor(lostQi)} Linh Khí.` }, ...state.logs]
         };
      }
    }

    case 'START_EXPLORATION':
      return { ...state, isExploring: true, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'info', message: 'Bắt đầu rời động phủ thám hiểm...' }, ...state.logs] };

    case 'STOP_EXPLORATION':
      return { ...state, isExploring: false, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'info', message: 'Thu hồi thần thức, quay về động phủ.' }, ...state.logs] };

    case 'CRAFT_ITEM': {
      const { itemId, cost } = action.payload;
      const itemDef = CRAFTABLE_ITEMS.find(i => i.id === itemId);
      if (!itemDef) return state;

      // Check costs
      if ((state.resources.herbs < (cost.herbs || 0)) || (state.resources.ores < (cost.ores || 0))) {
         return { ...state, logs: [{ id: Date.now(), timestamp: Date.now(), type: 'warning', message: 'Không đủ nguyên liệu!' }, ...state.logs] };
      }

      // Deduct resources
      const newResources = {
          ...state.resources,
          herbs: state.resources.herbs - (cost.herbs || 0),
          ores: state.resources.ores - (cost.ores || 0),
      };

      // Add to inventory
      const existingItemIndex = state.inventory.findIndex(i => i.id === itemId);
      let newInventory = [...state.inventory];
      if (existingItemIndex >= 0) {
          newInventory[existingItemIndex] = { 
              ...newInventory[existingItemIndex], 
              quantity: newInventory[existingItemIndex].quantity + 1 
          };
      } else {
          // Explicitly creating Item to ensure type safety and remove 'cost' property
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

        const item = state.inventory[itemIndex];
        let newState = { ...state };
        let msg = '';

        // Hardcoded effects for MVP
        if (itemId === 'pill_small_qi') {
            newState.resources.qi = Math.min(currentRealm.maxQiCap, newState.resources.qi + 100);
            msg = 'Sử dụng Tiểu Linh Đan, tăng 100 Linh Khí.';
        }

        // Reduce quantity
        const newInventory = [...state.inventory];
        if (newInventory[itemIndex].quantity > 1) {
            newInventory[itemIndex].quantity -= 1;
        } else {
            newInventory.splice(itemIndex, 1);
        }
        newState.inventory = newInventory;
        newState.logs = [{ id: Date.now(), timestamp: Date.now(), type: 'info', message: msg }, ...newState.logs];

        return newState;
    }

    default:
      return state;
  }
};

// --- Context & Provider ---

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  getCurrentRealm: () => Realm;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE, (initial) => {
     // Try to load from local storage
     const saved = localStorage.getItem('cuu-gioi-bat-hu-save');
     if (saved) {
         try {
             const parsed = JSON.parse(saved);
             // Merge with initial to ensure new fields exist if schema updated
             return { ...initial, ...parsed };
         } catch (e) {
             console.error("Failed to load save", e);
             return initial;
         }
     }
     return initial;
  });

  // Game Loop
  useEffect(() => {
    const tickRate = 1000; // 1 second
    const interval = setInterval(() => {
      dispatch({ type: 'TICK', payload: tickRate });
    }, tickRate);
    return () => clearInterval(interval);
  }, []);

  // Auto-Save
  useEffect(() => {
      const saveInterval = setInterval(() => {
          localStorage.setItem('cuu-gioi-bat-hu-save', JSON.stringify(state));
      }, 5000);
      return () => clearInterval(saveInterval);
  }, [state]);

  const getCurrentRealm = useCallback(() => {
      return REALMS[state.realmIndex];
  }, [state.realmIndex]);

  return (
    <GameContext.Provider value={{ state, dispatch, getCurrentRealm }}>
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