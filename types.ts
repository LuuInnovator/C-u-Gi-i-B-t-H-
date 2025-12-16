export enum ResourceType {
  QI = 'Linh Khí',
  SPIRIT_STONES = 'Linh Thạch',
  HERBS = 'Linh Thảo',
  ORES = 'Khoáng Thạch',
}

export type CultivationPath = 'none' | 'righteous' | 'devil';
export type ExplorationType = 'none' | 'adventure' | 'dungeon'; 
export type ElementType = 'none' | 'metal' | 'wood' | 'water' | 'fire' | 'earth' | 'dark' | 'illusion' | 'chaos';

export interface Resources {
  qi: number;
  maxQi: number;
  spiritStones: number;
  herbs: number;
  ores: number;
}

export interface Realm {
  id: number;
  name: string; 
  baseQiGeneration: number;
  maxQiCap: number;
  breakthroughChance: number; 
}

export interface Sect {
  id: string;
  name: string;
  description: string;
  bonusDescription: string;
  reqPath?: CultivationPath; 
}

export interface DamageDistribution {
    physical: number; 
    elemental: number; 
    mental: number;   
}

export interface LootItem {
    itemId: string;
    rate: number; // 0.0 đến 1.0 (ví dụ 0.05 = 5%)
    min: number;
    max: number;
}

export interface SecretRealm {
  id: string;
  name: string;
  description: string;
  reqRealmIndex: number; 
  riskLevel: string; 
  dropInfo: string;
  difficultyMod: number; 
  damageDistribution: DamageDistribution; 
  element: ElementType; 
  bossName: string; 
  tacticTip: string; 
  lootTable: LootItem[]; 
  dropRateMod: number;
}

export interface ItemStats {
  attack?: number;       
  defense?: number;
  strength?: number;     
  spirit?: number;       
  constitution?: number; 
  willpower?: number;    

  qiRegen?: number;
  clickBonus?: number;
  
  physPenetration?: number;  
  magicPenetration?: number; 
  
  fireRes?: number;
  poisonRes?: number;
  mentalRes?: number;
  allRes?: number; 

  effectDescription?: string;
}

// --- HỆ THỐNG KỸ NĂNG (MỚI) ---
export type SkillType = 'buff_def' | 'buff_atk' | 'heal' | 'dmg_burst';

export interface ActiveSkill {
    id: string;
    name: string;
    description: string;
    cooldown: number; // Milliseconds
    duration?: number; // Milliseconds (nếu là buff)
    type: SkillType;
    value: number; // Giá trị (Sát thương, Giáp, HP hồi...)
}

export type EquipmentSlot = 'weapon' | 'armor' | 'artifact';

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'consumable' | 'material' | 'equipment';
  slot?: EquipmentSlot; 
  stats?: ItemStats;    
  element?: ElementType; 
  activeSkill?: ActiveSkill; // Item có thể có kỹ năng kích hoạt (Pháp Bảo)
  effect?: (state: GameState) => Partial<GameState>;
  quantity: number;
  price: number; 
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'; 
}

export interface LogEntry {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger' | 'combat' | 'encounter';
  timestamp: number;
}

export interface Trait {
    id: string;
    name: string;
    description: string;
    type: 'buff' | 'debuff' | 'mixed';
}

export interface EncounterOption {
  label: string;
  description?: string;
  type: 'normal' | 'risky' | 'righteous' | 'devil';
  reqPath?: CultivationPath; 
  resourceCost?: Partial<Resources>; 
  gainTrait?: string; 
}

export interface Encounter {
  id: string;
  title: string;
  description: string;
  image?: string; 
  options: EncounterOption[];
}

export interface EquippedItems {
  weapon: Item | null;
  armor: Item | null;
  artifact: Item | null;
}

export interface StatBonuses {
    attack: number;
    defense: number;
    hp: number;
}

// --- STATE QUẢN LÝ BUFF & COOLDOWN (MỚI) ---
export interface ActiveBuff {
    id: string; // skill id
    name: string;
    type: SkillType;
    value: number;
    endTime: number;
}

export interface GameState {
  playerName: string;
  cultivationPath: CultivationPath;
  sectId: string | null; 
  resources: Resources;
  realmIndex: number;
  clickMultiplier: number;
  autoGatherRate: number;
  inventory: Item[];
  equippedItems: EquippedItems;
  logs: LogEntry[];
  isExploring: boolean; 
  explorationType: ExplorationType; 
  activeDungeonId: string | null; 
  hp: number;
  maxHp: number;
  lastTick: number;
  activeEncounterId: string | null;
  lastEncounterTime: number;
  traitorDebuffEndTime: number; 
  breakthroughSupportMod: number;
  traits: string[]; 
  protectionEndTime: number; 
  weaknessEndTime: number;
  statBonuses: StatBonuses; 
  
  // Tính năng mới
  skillCooldowns: Record<string, number>; // Map skillId -> timestamp available
  activeBuffs: ActiveBuff[];
}

export type GameAction =
  | { type: 'TICK'; payload: number } 
  | { type: 'GATHER_QI' }
  | { type: 'ATTEMPT_BREAKTHROUGH' }
  | { type: 'START_EXPLORATION'; payload: ExplorationType } 
  | { type: 'START_DUNGEON'; payload: string } 
  | { type: 'STOP_EXPLORATION' }
  | { type: 'CRAFT_ITEM'; payload: { itemId: string; cost: Partial<Resources> } }
  | { type: 'USE_ITEM'; payload: string }
  | { type: 'EQUIP_ITEM'; payload: string } 
  | { type: 'UNEQUIP_ITEM'; payload: EquipmentSlot }
  | { type: 'BUY_ITEM'; payload: { itemId: string; amount: number } } 
  | { type: 'SELL_ITEM'; payload: { itemId: string; amount: number } } 
  | { type: 'ADD_LOG'; payload: Omit<LogEntry, 'id' | 'timestamp'> }
  | { type: 'SET_PLAYER_NAME'; payload: string }
  | { type: 'CHOOSE_PATH'; payload: CultivationPath } 
  | { type: 'JOIN_SECT'; payload: string } 
  | { type: 'LEAVE_SECT' }
  | { type: 'TRIGGER_ENCOUNTER'; payload: string } 
  | { type: 'RESOLVE_ENCOUNTER'; payload: { encounterId: string; optionIndex: number } }
  | { type: 'LOAD_GAME'; payload: GameState }
  | { type: 'ACTIVATE_SKILL'; payload: string }; // Payload là Skill ID