import { GameState } from './types';

// Xuất khẩu lại từ các module con
export * from './data/realms';
export * from './data/items';
export * from './data/traits';
export * from './data/sects';
export * from './data/dungeons';
export * from './data/encounters';

// Khởi tạo trạng thái ban đầu của game
export const INITIAL_STATE: GameState = {
  playerName: 'Đạo Hữu Vô Danh',
  cultivationPath: 'none',
  sectId: null,
  resources: {
    qi: 0,
    maxQi: 100,
    spiritStones: 0,
    herbs: 0,
    ores: 0,
  },
  realmIndex: 0,
  clickMultiplier: 1,
  autoGatherRate: 0,
  inventory: [],
  equippedItems: {
    weapon: null,
    armor: null,
    artifact: null,
  },
  logs: [],
  isExploring: false,
  explorationType: 'none',
  activeDungeonId: null,
  hp: 100,
  maxHp: 100,
  lastTick: Date.now(),
  activeEncounterId: null,
  lastEncounterTime: Date.now(),
  traitorDebuffEndTime: 0,
  breakthroughSupportMod: 0,
  traits: [],
  protectionEndTime: 0,
  weaknessEndTime: 0,
  statBonuses: {
      // Chỉ số khởi đầu cơ bản
      attack: 5,
      defense: 2,
      hp: 100 
  },
  // Khởi tạo hệ thống kỹ năng
  skillCooldowns: {},
  activeBuffs: []
};