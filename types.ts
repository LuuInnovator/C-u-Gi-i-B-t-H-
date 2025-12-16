export enum ResourceType {
  QI = 'Linh Khí',
  SPIRIT_STONES = 'Linh Thạch',
  HERBS = 'Linh Thảo',
  ORES = 'Khoáng Thạch',
}

export type CultivationPath = 'none' | 'righteous' | 'devil';

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

export interface Sect {
  id: string;
  name: string;
  description: string;
  bonusDescription: string;
  reqPath?: CultivationPath; // 'devil' means only devil can join/see
}

export interface SecretRealm {
  id: string;
  name: string;
  description: string;
  reqRealmIndex: number; // Minimum realm required
  riskLevel: string; // Text description
  dropInfo: string;
  difficultyMod: number; // Multiplier for monster stats
  dropRateMod: number; // Multiplier for drop rates
}

export interface ItemStats {
  attack?: number;
  defense?: number;
  qiRegen?: number; // Passive Qi per second
  clickBonus?: number; // Bonus per click
}

export type EquipmentSlot = 'weapon' | 'armor' | 'artifact';

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'consumable' | 'material' | 'equipment';
  slot?: EquipmentSlot; // Only for type 'equipment'
  stats?: ItemStats;    // Only for type 'equipment'
  effect?: (state: GameState) => Partial<GameState>;
  quantity: number;
}

export interface LogEntry {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger' | 'combat' | 'encounter';
  timestamp: number;
}

// Definition for a Random Encounter
export interface EncounterOption {
  label: string;
  description?: string;
  type: 'normal' | 'risky' | 'righteous' | 'devil';
  reqPath?: CultivationPath; // Only available for specific path
  resourceCost?: Partial<Resources>; // Cost to choose this option
}

export interface Encounter {
  id: string;
  title: string;
  description: string;
  image?: string; // Placeholder for icon name
  options: EncounterOption[];
}

export interface EquippedItems {
  weapon: Item | null;
  armor: Item | null;
  artifact: Item | null;
}

export interface GameState {
  playerName: string;
  cultivationPath: CultivationPath;
  sectId: string | null; // New field for Sect
  resources: Resources;
  realmIndex: number;
  clickMultiplier: number;
  autoGatherRate: number;
  inventory: Item[];
  equippedItems: EquippedItems; // New field for Equipment
  logs: LogEntry[];
  isExploring: boolean;
  activeDungeonId: string | null; // If not null, player is in a secret realm
  hp: number;
  maxHp: number;
  lastTick: number;
  activeEncounterId: string | null;
  lastEncounterTime: number;
  traitorDebuffEndTime: number; // Timestamp when the betrayal debuff ends
  breakthroughSupportMod: number; // Added: Bonus chance for breakthrough (0.0 to 1.0)
}

export type GameAction =
  | { type: 'TICK'; payload: number } 
  | { type: 'GATHER_QI' }
  | { type: 'ATTEMPT_BREAKTHROUGH' }
  | { type: 'START_EXPLORATION' }
  | { type: 'START_DUNGEON'; payload: string } // dungeonId
  | { type: 'STOP_EXPLORATION' }
  | { type: 'CRAFT_ITEM'; payload: { itemId: string; cost: Partial<Resources> } }
  | { type: 'USE_ITEM'; payload: string }
  | { type: 'EQUIP_ITEM'; payload: string } // itemId
  | { type: 'UNEQUIP_ITEM'; payload: EquipmentSlot }
  | { type: 'ADD_LOG'; payload: Omit<LogEntry, 'id' | 'timestamp'> }
  | { type: 'SET_PLAYER_NAME'; payload: string }
  | { type: 'CHOOSE_PATH'; payload: CultivationPath } 
  | { type: 'JOIN_SECT'; payload: string } // Payload is Sect ID
  | { type: 'LEAVE_SECT' }
  | { type: 'TRIGGER_ENCOUNTER'; payload: string } 
  | { type: 'RESOLVE_ENCOUNTER'; payload: { encounterId: string; optionIndex: number } }
  | { type: 'LOAD_GAME'; payload: GameState };