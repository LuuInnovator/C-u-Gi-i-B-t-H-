import { GameState } from './types';

// Xuất khẩu lại từ các module con
export * from './data/realms';
export * from './data/items';
export * from './data/traits';
export * from './data/sects';
export * from './data/dungeons';
export * from './data/encounters';
export * from './data/talents'; // Export Talents

// Khởi tạo trạng thái ban đầu của game
export const INITIAL_STATE: GameState = {
  playerName: 'Đạo Hữu Vô Danh',
  avatarUrl: undefined, // Mặc định chưa có ảnh
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
  activeBuffs: [],
  
  // Rate limiting click
  lastClickTime: 0,

  // Renaming
  nameChangeCount: 0,
  lastNameChangeTime: 0,

  // Prestige
  prestige: {
      currency: 0,
      ascensionCount: 0,
      talents: {},
      spiritRootQuality: 0 // Bắt đầu từ 0 (Phế phẩm/Tạp căn cực hạn)
  },

  // Permanent Systems
  professions: {
      alchemyLevel: 1,
      blacksmithLevel: 1,
      alchemyExp: 0,
      blacksmithExp: 0
  },
  stash: []
};