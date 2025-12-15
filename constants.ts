import { Realm, Item } from './types';

export const REALMS: Realm[] = [
  { id: 0, name: 'Phàm Nhân', baseQiGeneration: 0, maxQiCap: 100, breakthroughChance: 1.0, attack: 1, defense: 0 },
  { id: 1, name: 'Luyện Khí - Tầng 1', baseQiGeneration: 1, maxQiCap: 200, breakthroughChance: 0.9, attack: 5, defense: 1 },
  { id: 2, name: 'Luyện Khí - Tầng 2', baseQiGeneration: 2, maxQiCap: 450, breakthroughChance: 0.85, attack: 8, defense: 2 },
  { id: 3, name: 'Luyện Khí - Tầng 3', baseQiGeneration: 4, maxQiCap: 1000, breakthroughChance: 0.8, attack: 12, defense: 4 },
  { id: 4, name: 'Luyện Khí - Tầng 4', baseQiGeneration: 8, maxQiCap: 2200, breakthroughChance: 0.75, attack: 18, defense: 7 },
  { id: 5, name: 'Luyện Khí - Tầng 5', baseQiGeneration: 15, maxQiCap: 5000, breakthroughChance: 0.7, attack: 25, defense: 10 },
  { id: 6, name: 'Trúc Cơ - Sơ Kỳ', baseQiGeneration: 30, maxQiCap: 12000, breakthroughChance: 0.5, attack: 50, defense: 25 },
  { id: 7, name: 'Trúc Cơ - Trung Kỳ', baseQiGeneration: 60, maxQiCap: 25000, breakthroughChance: 0.45, attack: 80, defense: 40 },
  { id: 8, name: 'Trúc Cơ - Hậu Kỳ', baseQiGeneration: 100, maxQiCap: 60000, breakthroughChance: 0.4, attack: 120, defense: 60 },
  { id: 9, name: 'Kim Đan - Sơ Kỳ', baseQiGeneration: 250, maxQiCap: 150000, breakthroughChance: 0.2, attack: 300, defense: 150 },
  { id: 10, name: 'Kim Đan - Trung Kỳ', baseQiGeneration: 500, maxQiCap: 350000, breakthroughChance: 0.18, attack: 500, defense: 300 },
  { id: 11, name: 'Kim Đan - Hậu Kỳ', baseQiGeneration: 1000, maxQiCap: 800000, breakthroughChance: 0.15, attack: 800, defense: 500 },
  { id: 12, name: 'Nguyên Anh - Sơ Kỳ', baseQiGeneration: 2500, maxQiCap: 2000000, breakthroughChance: 0.1, attack: 2000, defense: 1200 },
  { id: 13, name: 'Nguyên Anh - Trung Kỳ', baseQiGeneration: 5000, maxQiCap: 5000000, breakthroughChance: 0.08, attack: 4000, defense: 2500 },
  { id: 14, name: 'Nguyên Anh - Hậu Kỳ', baseQiGeneration: 10000, maxQiCap: 12000000, breakthroughChance: 0.05, attack: 8000, defense: 5000 },
  { id: 15, name: 'Hóa Thần - Sơ Kỳ', baseQiGeneration: 25000, maxQiCap: 30000000, breakthroughChance: 0.03, attack: 20000, defense: 15000 },
  { id: 16, name: 'Hóa Thần - Trung Kỳ', baseQiGeneration: 60000, maxQiCap: 80000000, breakthroughChance: 0.02, attack: 50000, defense: 40000 },
  { id: 17, name: 'Hóa Thần - Hậu Kỳ', baseQiGeneration: 150000, maxQiCap: 200000000, breakthroughChance: 0.01, attack: 120000, defense: 100000 },
];

export const CRAFTABLE_ITEMS = [
  {
    id: 'pill_small_qi',
    name: 'Tiểu Linh Đan',
    description: 'Tăng ngay lập tức 100 Linh Khí.',
    cost: { herbs: 10 },
    type: 'consumable' as const,
  },
  {
    id: 'pill_breakthrough',
    name: 'Trúc Cơ Đan',
    description: 'Vật phẩm hỗ trợ đột phá cảnh giới (Tạm thời chỉ để bán lấy Linh Thạch).',
    cost: { herbs: 50, ores: 10 },
    type: 'material' as const,
  }
];

export const INITIAL_STATE = {
  playerName: 'Đạo Hữu Vô Danh',
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
  logs: [],
  isExploring: false,
  hp: 100,
  maxHp: 100,
  lastTick: Date.now(),
};