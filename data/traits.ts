import { Trait } from '../types';

export const TRAITS: Record<string, Trait> = {
    // --- THIÊN PHÚ CHÍNH ĐẠO ---
    'great_enlightenment': {
        id: 'great_enlightenment',
        name: 'Đại Triệt Đại Ngộ',
        description: '+50% Tốc độ tu luyện, nhưng Tâm Ma quấy nhiễu (mất Linh Khí ngẫu nhiên).',
        type: 'mixed'
    },
    'dao_injury': {
        id: 'dao_injury',
        name: 'Vết Thương Thiên Đạo',
        description: 'Tăng 10% Tỷ lệ đột phá, nhưng HP bị đốt cháy liên tục (2% HP/giây).',
        type: 'mixed'
    },
    'heavenly_jealousy': {
        id: 'heavenly_jealousy',
        name: 'Thiên Đố Anh Tài',
        description: 'Nhận được Kỹ Năng bí truyền (Tăng 20% Dmg Linh Lực), nhưng Thiên Kiếp khó khăn hơn (-10% tỷ lệ đột phá).',
        type: 'mixed'
    },
    
    // --- THIÊN PHÚ MA ĐẠO ---
    'devil_pact': {
        id: 'devil_pact',
        name: 'Khế Ước Ma Thần',
        description: 'Tăng 100% Sức Mạnh (Str), nhưng Linh Căn bị vấy bẩn (-30% Tỷ lệ Chế Tạo thành công).',
        type: 'mixed'
    },
    'life_absorption': {
        id: 'life_absorption',
        name: 'Thôn Phệ Sinh Mệnh',
        description: 'Tăng 30% Tốc độ tu luyện, nhưng Thiên Kiếp mang theo Lôi Hỏa (+20% Dmg nhận vào).',
        type: 'mixed'
    },
    'body_demonization': {
        id: 'body_demonization',
        name: 'Ma Hóa Thân Thể',
        description: 'Tăng 50% HP và Phòng Thủ, nhưng bị Thiên Đạo bài xích (Không thể đột phá quá Nguyên Anh).',
        type: 'mixed'
    }
};