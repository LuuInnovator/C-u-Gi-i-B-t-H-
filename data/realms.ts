import { Realm } from '../types';

// Cảnh giới giờ chỉ đóng vai trò "Cấp độ" (Level) để mở khóa tính năng
export const REALMS: Realm[] = [
  { id: 0, name: 'Phàm Nhân', baseQiGeneration: 0, maxQiCap: 100, breakthroughChance: 1.0 },
  { id: 1, name: 'Luyện Khí - Tầng 1', baseQiGeneration: 1, maxQiCap: 200, breakthroughChance: 0.9 },
  { id: 2, name: 'Luyện Khí - Tầng 2', baseQiGeneration: 2, maxQiCap: 450, breakthroughChance: 0.85 },
  { id: 3, name: 'Luyện Khí - Tầng 3', baseQiGeneration: 4, maxQiCap: 1000, breakthroughChance: 0.8 },
  { id: 4, name: 'Luyện Khí - Tầng 4', baseQiGeneration: 8, maxQiCap: 2200, breakthroughChance: 0.75 },
  { id: 5, name: 'Luyện Khí - Tầng 5', baseQiGeneration: 15, maxQiCap: 5000, breakthroughChance: 0.7 },
  { id: 6, name: 'Trúc Cơ - Sơ Kỳ', baseQiGeneration: 30, maxQiCap: 12000, breakthroughChance: 0.5 },
  { id: 7, name: 'Trúc Cơ - Trung Kỳ', baseQiGeneration: 60, maxQiCap: 25000, breakthroughChance: 0.45 },
  { id: 8, name: 'Trúc Cơ - Hậu Kỳ', baseQiGeneration: 100, maxQiCap: 60000, breakthroughChance: 0.4 },
  { id: 9, name: 'Kim Đan - Sơ Kỳ', baseQiGeneration: 250, maxQiCap: 150000, breakthroughChance: 0.2 },
  { id: 10, name: 'Kim Đan - Trung Kỳ', baseQiGeneration: 500, maxQiCap: 350000, breakthroughChance: 0.18 },
  { id: 11, name: 'Kim Đan - Hậu Kỳ', baseQiGeneration: 1000, maxQiCap: 800000, breakthroughChance: 0.15 },
  { id: 12, name: 'Nguyên Anh - Sơ Kỳ', baseQiGeneration: 2500, maxQiCap: 2000000, breakthroughChance: 0.1 },
  { id: 13, name: 'Nguyên Anh - Trung Kỳ', baseQiGeneration: 5000, maxQiCap: 5000000, breakthroughChance: 0.08 },
  { id: 14, name: 'Nguyên Anh - Hậu Kỳ', baseQiGeneration: 10000, maxQiCap: 12000000, breakthroughChance: 0.05 },
  { id: 15, name: 'Hóa Thần - Sơ Kỳ', baseQiGeneration: 25000, maxQiCap: 30000000, breakthroughChance: 0.03 },
  { id: 16, name: 'Hóa Thần - Trung Kỳ', baseQiGeneration: 60000, maxQiCap: 80000000, breakthroughChance: 0.02 },
  { id: 17, name: 'Hóa Thần - Hậu Kỳ', baseQiGeneration: 150000, maxQiCap: 200000000, breakthroughChance: 0.01 },
];