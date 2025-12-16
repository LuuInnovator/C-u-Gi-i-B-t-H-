import { Item } from '../types';

export const GAME_ITEMS: Item[] = [
  // --- NGUYÊN LIỆU / TIÊU HAO ---
  { id: 'pill_small_qi', name: 'Tiểu Linh Đan', description: 'Tăng 100 Linh Khí.', quantity: 1, type: 'consumable', price: 50, rarity: 'common' },
  { id: 'pill_breakthrough', name: 'Trúc Cơ Đan', description: '+20% Tỷ lệ đột phá.', quantity: 1, type: 'consumable', price: 500, rarity: 'uncommon' },
  { id: 'pill_protection', name: 'Hộ Mệnh Đan', description: 'Chống One-Hit trong 5 phút.', quantity: 1, type: 'consumable', price: 1500, rarity: 'rare' },
  { id: 'ore_iron', name: 'Quặng Thiết', description: 'Nguyên liệu chế tạo cơ bản.', quantity: 1, type: 'material', price: 10, rarity: 'common' },
  { id: 'wood_spirit', name: 'Gỗ Linh Mộc', description: 'Gỗ chứa linh khí.', quantity: 1, type: 'material', price: 20, rarity: 'common' },
  { id: 'ore_fire', name: 'Hỏa Tinh Thạch', description: 'Đá nóng bỏng tay.', quantity: 1, type: 'material', price: 50, rarity: 'uncommon' },
  { id: 'ore_ice', name: 'Hàn Thiết', description: 'Sắt lạnh thấu xương.', quantity: 1, type: 'material', price: 50, rarity: 'uncommon' },
  { id: 'ore_gold', name: 'Kim Nguyên Thạch', description: 'Tinh hoa kim loại.', quantity: 1, type: 'material', price: 100, rarity: 'rare' },

  // --- TRANG BỊ: CẢNH GIỚI LUYỆN KHÍ ---
  {
    id: 'sword_black_iron',
    name: 'Hắc Thiết Kiếm',
    description: 'Kiếm rèn từ sắt đen thô.',
    quantity: 1, type: 'equipment', slot: 'weapon', element: 'metal', rarity: 'common', price: 200,
    stats: { strength: 15, spirit: 5, physPenetration: 5, effectDescription: 'Đâm Xuyên: +5% Xuyên Giáp Vật Lý.' }
  },
  {
    id: 'armor_wood',
    name: 'Hộ Giáp Mộc Giáp',
    description: 'Giáp làm từ gỗ ngàn năm.',
    quantity: 1, type: 'equipment', slot: 'armor', element: 'wood', rarity: 'common', price: 250,
    stats: { constitution: 30, defense: 10, effectDescription: 'Dẻo Dai: Tăng hiệu quả hồi phục HP.' }
  },
  {
    id: 'ring_rock',
    name: 'Thạch Thủ Hoàn',
    description: 'Vòng tay bằng đá nặng trịch.',
    quantity: 1, type: 'equipment', slot: 'artifact', element: 'earth', rarity: 'common', price: 180,
    stats: { defense: 12, effectDescription: 'Trấn Hộ: Giảm 10% sát thương khi HP < 20%.' }
  },

  // --- TRANG BỊ: CẢNH GIỚI TRÚC CƠ ---
  {
    id: 'shield_ice',
    name: 'Huyền Băng Thuẫn',
    description: 'Khiên băng tỏa ra hàn khí.',
    quantity: 1, type: 'equipment', slot: 'armor', element: 'water', rarity: 'uncommon', price: 1200,
    stats: { spirit: 45, fireRes: 30, effectDescription: 'Hàn Khí: Giảm 15% Sát Thương từ hệ Hỏa.' }
  },
  {
    id: 'talisman_fire',
    name: 'Liệt Hỏa Phù',
    description: 'Lá bùa cháy mãi không tắt.',
    quantity: 1, type: 'equipment', slot: 'weapon', element: 'fire', rarity: 'uncommon', price: 1500,
    stats: { spirit: 50, strength: 15, effectDescription: 'Gia Cường: Tăng 15% Sát thương Hỏa gây ra.' }
  },
  {
    id: 'bracelet_wood',
    name: 'Thái Ất Vòng Tay',
    description: 'Vòng tay kết từ dây leo cổ.',
    quantity: 1, type: 'equipment', slot: 'artifact', element: 'wood', rarity: 'uncommon', price: 1300,
    stats: { spirit: 20, poisonRes: 20, effectDescription: 'Liên Kết: Đòn hệ Mộc gây thêm 5% sát thương lan.' }
  },

  // --- TRANG BỊ: CẢNH GIỚI KIM ĐAN / NGUYÊN ANH ---
  {
    id: 'sword_breaker',
    name: 'Phá Giới Kiếm',
    description: 'Kiếm chuyên dùng phá vỡ kết giới.',
    quantity: 1, type: 'equipment', slot: 'weapon', element: 'metal', rarity: 'rare', price: 5000,
    stats: { spirit: 100, strength: 50, magicPenetration: 10, effectDescription: 'Xuyên Giới: +10% Xuyên Phá Linh Lực.' }
  },
  {
    id: 'artifact_soul',
    name: 'Hộ Hồn Pháp Bảo',
    description: 'Bảo vệ tâm trí khỏi tà ma.',
    quantity: 1, type: 'equipment', slot: 'armor', element: 'illusion', rarity: 'rare', price: 6000,
    stats: { willpower: 50, allRes: 40, effectDescription: 'Trấn Hồn: Kháng mạnh hiệu ứng Tinh Thần.' }
  },
  {
    id: 'cauldron_earth',
    name: 'Nguyên Anh Đan Lô',
    description: 'Lò luyện đan thu nhỏ.',
    quantity: 1, type: 'equipment', slot: 'artifact', element: 'earth', rarity: 'rare', price: 5500,
    stats: { spirit: 150, defense: 10, effectDescription: 'Tái Tạo: Linh Lực < 30% tăng 3% hồi phục.' }
  },
];

export const CRAFTABLE_ITEMS = [
  { id: 'sword_black_iron', cost: { ores: 20, spiritStones: 50 }, ...GAME_ITEMS.find(i => i.id === 'sword_black_iron')! },
  { id: 'armor_wood', cost: { herbs: 30, spiritStones: 50 }, ...GAME_ITEMS.find(i => i.id === 'armor_wood')! },
  { id: 'pill_protection', cost: { herbs: 100, spiritStones: 500 }, ...GAME_ITEMS.find(i => i.id === 'pill_protection')! },
  { id: 'talisman_fire', cost: { ores: 50, spiritStones: 1000 }, ...GAME_ITEMS.find(i => i.id === 'talisman_fire')! },
];