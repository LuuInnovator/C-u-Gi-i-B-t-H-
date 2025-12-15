export enum ResourceType {
  QI = 'Linh Khí',
  SPIRIT_STONES = 'Linh Thạch',
  HERBS = 'Linh Thảo',
  ORES = 'Khoáng Thạch',
}

export interface Resources {
  qi: number;
  maxQi: number;
  spiritStones: number;
  herbs: number;
  ores: number;
}

export interface Realm {
  id: number;
  name: string; // e.g., "Luyện Khí Tầng 1"
  baseQiGeneration: number;
  maxQiCap: number;
  breakthroughChance: number; // 0.0 to 1.0
  defense: number;
  attack: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'consumable' | 'material' | 'equipment';
  effect?: (state: GameState) => Partial<GameState>;
  quantity: number;
}

export interface LogEntry {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger' | 'combat';
  timestamp: number;
}

export interface GameState {
  playerName: string;
  resources: Resources;
  realmIndex: number;
  clickMultiplier: number;
  autoGatherRate: number;
  inventory: Item[];
  logs: LogEntry[];
  isExploring: boolean;
  hp: number;
  maxHp: number;
  lastTick: number;
}

export type GameAction =
  | { type: 'TICK'; payload: number } // payload is delta time in ms
  | { type: 'GATHER_QI' }
  | { type: 'ATTEMPT_BREAKTHROUGH' }
  | { type: 'START_EXPLORATION' }
  | { type: 'STOP_EXPLORATION' }
  | { type: 'CRAFT_ITEM'; payload: { itemId: string; cost: Partial<Resources> } }
  | { type: 'USE_ITEM'; payload: string }
  | { type: 'ADD_LOG'; payload: Omit<LogEntry, 'id' | 'timestamp'> }
  | { type: 'SET_PLAYER_NAME'; payload: string }
  | { type: 'LOAD_GAME'; payload: GameState };