import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { GameState, GameAction, Realm } from '../types';
import { REALMS, INITIAL_STATE } from '../constants';
import { gameReducer } from './gameReducer';

// Định nghĩa Interface Context
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
  if (!context) throw new Error('Lỗi useGame: Phải sử dụng trong GameProvider');
  return context;
};