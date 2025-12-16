import { Realm, Item, GameState, Encounter, Sect, SecretRealm } from './types';

export const REALMS: Realm[] = [
  { id: 0, name: 'Phàm Nhân', baseQiGeneration: 0, maxQiCap: 100, breakthroughChance: 1.0, attack: 3, defense: 0 },
  { id: 1, name: 'Luyện Khí - Tầng 1', baseQiGeneration: 1, maxQiCap: 200, breakthroughChance: 0.9, attack: 15, defense: 1 },
  { id: 2, name: 'Luyện Khí - Tầng 2', baseQiGeneration: 2, maxQiCap: 450, breakthroughChance: 0.85, attack: 25, defense: 2 },
  { id: 3, name: 'Luyện Khí - Tầng 3', baseQiGeneration: 4, maxQiCap: 1000, breakthroughChance: 0.8, attack: 40, defense: 4 },
  { id: 4, name: 'Luyện Khí - Tầng 4', baseQiGeneration: 8, maxQiCap: 2200, breakthroughChance: 0.75, attack: 60, defense: 7 },
  { id: 5, name: 'Luyện Khí - Tầng 5', baseQiGeneration: 15, maxQiCap: 5000, breakthroughChance: 0.7, attack: 90, defense: 10 },
  { id: 6, name: 'Trúc Cơ - Sơ Kỳ', baseQiGeneration: 30, maxQiCap: 12000, breakthroughChance: 0.5, attack: 180, defense: 25 },
  { id: 7, name: 'Trúc Cơ - Trung Kỳ', baseQiGeneration: 60, maxQiCap: 25000, breakthroughChance: 0.45, attack: 280, defense: 40 },
  { id: 8, name: 'Trúc Cơ - Hậu Kỳ', baseQiGeneration: 100, maxQiCap: 60000, breakthroughChance: 0.4, attack: 400, defense: 60 },
  { id: 9, name: 'Kim Đan - Sơ Kỳ', baseQiGeneration: 250, maxQiCap: 150000, breakthroughChance: 0.2, attack: 1000, defense: 150 },
  { id: 10, name: 'Kim Đan - Trung Kỳ', baseQiGeneration: 500, maxQiCap: 350000, breakthroughChance: 0.18, attack: 1800, defense: 300 },
  { id: 11, name: 'Kim Đan - Hậu Kỳ', baseQiGeneration: 1000, maxQiCap: 800000, breakthroughChance: 0.15, attack: 2800, defense: 500 },
  { id: 12, name: 'Nguyên Anh - Sơ Kỳ', baseQiGeneration: 2500, maxQiCap: 2000000, breakthroughChance: 0.1, attack: 7000, defense: 1200 },
  { id: 13, name: 'Nguyên Anh - Trung Kỳ', baseQiGeneration: 5000, maxQiCap: 5000000, breakthroughChance: 0.08, attack: 15000, defense: 2500 },
  { id: 14, name: 'Nguyên Anh - Hậu Kỳ', baseQiGeneration: 10000, maxQiCap: 12000000, breakthroughChance: 0.05, attack: 30000, defense: 5000 },
  { id: 15, name: 'Hóa Thần - Sơ Kỳ', baseQiGeneration: 25000, maxQiCap: 30000000, breakthroughChance: 0.03, attack: 70000, defense: 15000 },
  { id: 16, name: 'Hóa Thần - Trung Kỳ', baseQiGeneration: 60000, maxQiCap: 80000000, breakthroughChance: 0.02, attack: 180000, defense: 40000 },
  { id: 17, name: 'Hóa Thần - Hậu Kỳ', baseQiGeneration: 150000, maxQiCap: 200000000, breakthroughChance: 0.01, attack: 400000, defense: 100000 },
];

export const SECTS: Sect[] = [
    {
        id: 'thai_thanh',
        name: 'Thái Thanh Môn',
        description: 'Đệ nhất danh môn chính phái, chú trọng tu tâm dưỡng tính, hòa hợp với thiên địa.',
        bonusDescription: '+15% Tốc độ hồi Linh Khí tự nhiên.',
    },
    {
        id: 'van_kiem',
        name: 'Vạn Kiếm Tông',
        description: 'Tông môn chuyên về kiếm đạo, lấy sát phạt làm gốc để chứng đạo.',
        bonusDescription: '+20% Linh khí khi Tụ Khí (Click).',
    },
    {
        id: 'duoc_vuong',
        name: 'Dược Vương Cốc',
        description: 'Ẩn cư nơi thâm sơn cùng cốc, tinh thông y thuật và luyện đan.',
        bonusDescription: '+25% Tỉ lệ tìm thấy Linh Thảo khi du ngoạn.',
    },
    {
        id: 'thien_cang',
        name: 'Thiên Cang Tông',
        description: 'Rèn luyện thân thể cứng như sắt thép, lấy lực phá xảo.',
        bonusDescription: 'Giảm 15% sát thương nhận vào khi gặp yêu thú.',
    },
    {
        id: 'tieu_dao',
        name: 'Tiêu Dao Phái',
        description: 'Hành tung bí ẩn, tự do tự tại, không màng thế sự.',
        bonusDescription: '+10% Tỉ lệ gặp Cơ Duyên (Kỳ Ngộ).',
    },
    {
        id: 'huyet_sat',
        name: 'Huyết Sát Giáo',
        description: 'Tà giáo khét tiếng, sử dụng máu tươi để tu luyện, tàn nhẫn vô cùng.',
        bonusDescription: 'Hồi 5% HP mỗi khi chiến thắng yêu thú. +20% Linh Thạch.',
        reqPath: 'devil'
    }
];

export const SECRET_REALMS: SecretRealm[] = [
    {
        id: 'duoc_son',
        name: 'Bách Thảo Viên',
        description: 'Vườn thuốc hoang phế của một tông môn cổ đại. Quái vật yếu nhưng nhiều linh thảo.',
        reqRealmIndex: 2, // Luyen Khi 2
        riskLevel: 'Thấp',
        dropInfo: 'Nhiều Linh Thảo, Ít Khoáng.',
        difficultyMod: 0.8,
        dropRateMod: 1.5
    },
    {
        id: 'co_mo',
        name: 'Kiếm Tiên Cổ Mộ',
        description: 'Nơi chôn cất của một vị Kiếm Tiên. Oán khí nặng nề, quái vật hung hãn.',
        reqRealmIndex: 6, // Truc Co
        riskLevel: 'Cao',
        dropInfo: 'Tỷ lệ rơi Trang Bị & Đan Dược cao.',
        difficultyMod: 1.5,
        dropRateMod: 2.0
    },
    {
        id: 'hoa_diem',
        name: 'Hỏa Diệm Sơn',
        description: 'Vùng đất dung nham nóng chảy quanh năm. Nơi ở của Hỏa Tinh Thú.',
        reqRealmIndex: 9, // Kim Dan
        riskLevel: 'Rất Cao',
        dropInfo: 'Nhiều Khoáng Thạch, Linh Thạch. Rơi vật phẩm hiếm.',
        difficultyMod: 2.5,
        dropRateMod: 3.0
    }
];

// Define all items here
export const GAME_ITEMS: Item[] = [
  {
    id: 'pill_small_qi',
    name: 'Tiểu Linh Đan',
    description: 'Tăng ngay lập tức 100 Linh Khí.',
    quantity: 1,
    type: 'consumable',
  },
  {
    id: 'pill_breakthrough',
    name: 'Trúc Cơ Đan',
    description: 'Dùng để gia tăng 20% tỷ lệ thành công cho lần đột phá cảnh giới tiếp theo.',
    quantity: 1,
    type: 'consumable', // Changed from material to consumable
  },
  {
    id: 'sword_iron',
    name: 'Thanh Phong Kiếm',
    description: 'Vũ khí cơ bản của đệ tử ngoại môn. Tăng 10 Tấn Công.',
    quantity: 1,
    type: 'equipment',
    slot: 'weapon',
    stats: { attack: 10 }
  },
  {
    id: 'armor_leather',
    name: 'Hộ Tâm Kính',
    description: 'Làm bằng da thú và đồng thau. Tăng 5 Phòng Thủ.',
    quantity: 1,
    type: 'equipment',
    slot: 'armor',
    stats: { defense: 5 }
  },
  {
    id: 'artifact_bead',
    name: 'Tụ Linh Châu',
    description: 'Pháp bảo sơ cấp, giúp hội tụ linh khí. Tăng 2 Linh Khí/giây.',
    quantity: 1,
    type: 'equipment',
    slot: 'artifact',
    stats: { qiRegen: 2 }
  }
];

// Subset of items that can be crafted (Only Equipment now)
export const CRAFTABLE_ITEMS = [
  {
    id: 'sword_iron',
    cost: { ores: 50, spiritStones: 100 },
    ...GAME_ITEMS.find(i => i.id === 'sword_iron')!
  },
  {
    id: 'armor_leather',
    cost: { ores: 30, herbs: 20 },
    ...GAME_ITEMS.find(i => i.id === 'armor_leather')!
  }
];

export const ENCOUNTERS: Encounter[] = [
    {
        id: 'beggar_mystery',
        title: 'Lão Ăn Mày Bí Ẩn',
        description: 'Trên đường du ngoạn, ngươi gặp một lão già ăn mặc rách rưới, tay cầm bình rượu vỡ, miệng lẩm bẩm những lời khó hiểu về "Thiên Đạo". Lão nhìn ngươi và chìa tay ra.',
        options: [
            {
                label: 'Tặng 50 Linh Thạch',
                description: 'Kết thiện duyên, biết đâu là cao nhân ẩn thế?',
                type: 'normal',
                resourceCost: { spiritStones: 50 }
            },
            {
                label: 'Xua đuổi',
                description: 'Ta tu tiên nghịch thiên, không rảnh lo chuyện bao đồng.',
                type: 'normal'
            },
            {
                label: 'Cướp bình rượu',
                description: 'Cảm giác bình rượu này không tầm thường (Chỉ Ma Đạo).',
                type: 'devil',
                reqPath: 'devil'
            }
        ]
    },
    {
        id: 'storm_qi',
        title: 'Lôi Vân Tụ Hội',
        description: 'Bầu trời bỗng nhiên tối sầm, mây đen vần vũ, sấm chớp rền vang. Đây là dấu hiệu Linh Khí hội tụ cực mạnh, nhưng cũng vô cùng nguy hiểm.',
        options: [
            {
                label: 'Mạo hiểm hấp thụ',
                description: 'Dùng thân thể ngạnh kháng sấm sét để đoạt lấy Tiên Thiên Linh Khí. (Tỉ lệ 50/50)',
                type: 'risky'
            },
            {
                label: 'Tìm nơi trú ẩn',
                description: 'An toàn là trên hết.',
                type: 'normal'
            }
        ]
    },
    {
        id: 'ancient_ruin',
        title: 'Động Phủ Cổ Xưa',
        description: 'Ngươi phát hiện một cửa hang bị dây leo che khuất, bên trong tỏa ra dao động cấm chế yếu ớt. Có lời đồn đây là nơi tọa hóa của một vị Tiên Nhân.',
        options: [
            {
                label: 'Phá cấm chế tiến vào',
                description: 'Có cơ hội nhận được Pháp Bảo thất truyền, nhưng nguy hiểm trùng trùng.',
                type: 'risky'
            },
            {
                label: 'Bỏ qua',
                description: 'Cẩn tắc vô áy náy.',
                type: 'normal'
            },
            {
                label: 'Dùng Huyết Tế',
                description: 'Dùng máu bản thân để mở lối đi tắt (Mất máu, chắc chắn thành công).',
                type: 'devil',
                reqPath: 'devil'
            }
        ]
    },
    {
        id: 'injured_beast',
        title: 'Linh Thú Bị Thương',
        description: 'Một con Hỏa Hồ Ly đang nằm thoi thóp bên suối, chân bị dính bẫy săn.',
        options: [
            {
                label: 'Chữa trị',
                description: 'Tốn 5 Linh Thảo để cứu nó.',
                type: 'righteous',
                resourceCost: { herbs: 5 }
            },
            {
                label: 'Kết liễu lấy đan',
                description: 'Yêu đan của Hỏa Hồ Ly rất có giá trị.',
                type: 'devil'
            }
        ]
    }
];

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
  activeDungeonId: null,
  hp: 100,
  maxHp: 100,
  lastTick: Date.now(),
  activeEncounterId: null,
  lastEncounterTime: Date.now(),
  traitorDebuffEndTime: 0,
  breakthroughSupportMod: 0,
};