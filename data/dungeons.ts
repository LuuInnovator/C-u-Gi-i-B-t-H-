import { SecretRealm } from '../types';

export const SECRET_REALMS: SecretRealm[] = [
    // --- CẢNH GIỚI LUYỆN KHÍ ---
    {
        id: 'thu_cot_son',
        name: 'Thú Cốt Sơn Mạch',
        description: 'Dãy núi chất đầy xương cốt yêu thú. Địa hình hiểm trở.',
        reqRealmIndex: 1, 
        riskLevel: 'Thấp',
        dropInfo: 'Hắc Thiết Kiếm (5%), Giáp Vật Lý.',
        difficultyMod: 0.8,
        dropRateMod: 1.0, // Chỉ số cơ bản cho việc tính toán rơi đồ
        damageDistribution: { physical: 1.0, elemental: 0, mental: 0 },
        element: 'earth',
        bossName: 'Hắc Hùng Cự Lực',
        tacticTip: 'Boss thuần Vật Lý. Dùng Xuyên Giáp.',
        lootTable: [
            { itemId: 'ore_iron', rate: 0.3, min: 1, max: 3 },
            { itemId: 'pill_small_qi', rate: 0.1, min: 1, max: 1 },
            { itemId: 'sword_black_iron', rate: 0.05, min: 1, max: 1 }, // Tỷ lệ rơi 5%
            { itemId: 'ring_rock', rate: 0.03, min: 1, max: 1 }
        ]
    },
    {
        id: 'thanh_moc_lam',
        name: 'Thanh Mộc Lâm',
        description: 'Rừng rậm nguyên sinh, nơi ẩn náu của yêu thú mang độc tố.',
        reqRealmIndex: 3, 
        riskLevel: 'Trung Bình',
        dropInfo: 'Hộ Giáp Mộc (5%), Thảo Dược.',
        difficultyMod: 1.0,
        dropRateMod: 1.0,
        damageDistribution: { physical: 0.7, elemental: 0.3, mental: 0 }, 
        element: 'wood',
        bossName: 'Mãng Xà Độc Dịch',
        tacticTip: 'Boss có Độc. Cần kháng độc.',
        lootTable: [
            { itemId: 'wood_spirit', rate: 0.3, min: 1, max: 3 },
            { itemId: 'pill_small_qi', rate: 0.15, min: 1, max: 2 },
            { itemId: 'armor_wood', rate: 0.05, min: 1, max: 1 }, // Tỷ lệ rơi 5%
            { itemId: 'bracelet_wood', rate: 0.01, min: 1, max: 1 } // Rất hiếm ở giai đoạn đầu
        ]
    },
    {
        id: 'yeu_ho_dong',
        name: 'Yêu Hồ Động',
        description: 'Hang động ẩm ướt sâu trong lòng đất, nơi Yêu Hồ tu luyện.',
        reqRealmIndex: 5,
        riskLevel: 'Cao',
        dropInfo: 'Hàn Thiết, Vũ Khí Thủy.',
        difficultyMod: 1.2,
        dropRateMod: 1.0,
        damageDistribution: { physical: 0.6, elemental: 0.4, mental: 0 },
        element: 'water',
        bossName: 'Thủy Tinh Khôi Lỗi',
        tacticTip: 'Boss hồi máu. Cần dồn sát thương.',
        lootTable: [
            { itemId: 'ore_ice', rate: 0.2, min: 1, max: 2 },
            { itemId: 'pill_breakthrough', rate: 0.05, min: 1, max: 1 },
            { itemId: 'shield_ice', rate: 0.02, min: 1, max: 1 } // Đồ hiếm giai đoạn đầu
        ]
    },

    // --- CẢNH GIỚI TRÚC CƠ ---
    {
        id: 'dung_nham_dia',
        name: 'Dung Nham Luyện Địa',
        description: 'Khu vực núi lửa nóng bỏng, đầy Hỏa Khí.',
        reqRealmIndex: 6,
        riskLevel: 'Rất Cao',
        dropInfo: 'Liệt Hỏa Phù (4%), Hỏa Tinh Thạch.',
        difficultyMod: 1.5,
        dropRateMod: 1.0,
        damageDistribution: { physical: 0.3, elemental: 0.7, mental: 0 },
        element: 'fire',
        bossName: 'Hỏa Diễm Quỷ Vương',
        tacticTip: 'Cần Huyền Băng Thuẫn để kháng Hỏa.',
        lootTable: [
            { itemId: 'ore_fire', rate: 0.3, min: 1, max: 3 },
            { itemId: 'talisman_fire', rate: 0.04, min: 1, max: 1 }, // Tỷ lệ 4%
            { itemId: 'pill_breakthrough', rate: 0.1, min: 1, max: 1 }
        ]
    },
    {
        id: 'cuu_cung_tran',
        name: 'Cửu Cung Trận',
        description: 'Một trận pháp cổ xưa còn sót lại, bảo vệ tàn phách pháp khí.',
        reqRealmIndex: 7, 
        riskLevel: 'Nguy Hiểm',
        dropInfo: 'Pháp Bảo, Kim Nguyên Thạch.',
        difficultyMod: 1.8,
        dropRateMod: 1.0,
        damageDistribution: { physical: 0.5, elemental: 0.3, mental: 0.2 },
        element: 'metal',
        bossName: 'Trận Linh Thủ Vệ',
        tacticTip: 'Boss phản đòn vật lý.',
        lootTable: [
            { itemId: 'ore_gold', rate: 0.25, min: 1, max: 2 },
            { itemId: 'sword_breaker', rate: 0.01, min: 1, max: 1 }, // Cực hiếm ở đây
            { itemId: 'pill_protection', rate: 0.05, min: 1, max: 1 }
        ]
    },
    {
        id: 'am_phong_coc',
        name: 'Âm Phong Cốc',
        description: 'Thung lũng gió lùa quanh năm, chứa đầy oán khí.',
        reqRealmIndex: 8,
        riskLevel: 'Tử Vong',
        dropInfo: 'Thái Ất Vòng Tay (5%).',
        difficultyMod: 2.0,
        dropRateMod: 1.0,
        damageDistribution: { physical: 0.2, elemental: 0.4, mental: 0.4 }, 
        element: 'dark',
        bossName: 'Vô Diện U Minh',
        tacticTip: 'Giảm hồi phục Linh Khí. Đánh nhanh thắng nhanh.',
        lootTable: [
            { itemId: 'bracelet_wood', rate: 0.05, min: 1, max: 1 }, // Tỷ lệ 5%
            { itemId: 'pill_small_qi', rate: 0.2, min: 2, max: 5 }
        ]
    },

    // --- CẢNH GIỚI KIM ĐAN & NGUYÊN ANH ---
    {
        id: 'thuc_hai_ao',
        name: 'Thức Hải Ảo Cảnh',
        description: 'Không gian tinh thần kỳ bí, thực thực ảo ảo.',
        reqRealmIndex: 9, 
        riskLevel: 'Tâm Ma',
        dropInfo: 'Hộ Hồn Pháp Bảo (3%).',
        difficultyMod: 2.5,
        dropRateMod: 1.0,
        damageDistribution: { physical: 0, elemental: 0.2, mental: 0.8 },
        element: 'illusion',
        bossName: 'Tâm Ma Lão Tổ',
        tacticTip: 'Bắt buộc trang bị Hộ Hồn Pháp Bảo.',
        lootTable: [
            { itemId: 'artifact_soul', rate: 0.03, min: 1, max: 1 }, // Tỷ lệ 3%
            { itemId: 'pill_protection', rate: 0.1, min: 1, max: 1 }
        ]
    },
    {
        id: 'bich_hai',
        name: 'Bích Hải Vô Ngân',
        description: 'Đáy biển sâu thẳm, áp lực nước kinh người.',
        reqRealmIndex: 12,
        riskLevel: 'Thảm Họa',
        dropInfo: 'Huyền Băng Thuẫn Cao Cấp.',
        difficultyMod: 3.5,
        dropRateMod: 1.0,
        damageDistribution: { physical: 0.4, elemental: 0.6, mental: 0 },
        element: 'water',
        bossName: 'Giao Long Thủy Hoàng',
        tacticTip: 'Linh Lực Hộ Thể cực dày.',
        lootTable: [
            { itemId: 'shield_ice', rate: 0.1, min: 1, max: 1 }, // Tỷ lệ cao hơn cho đồ cấp thấp
            { itemId: 'ore_ice', rate: 0.4, min: 2, max: 5 }
        ]
    },
    {
        id: 'thien_kiem_trung',
        name: 'Thiên Kiếm Trủng',
        description: 'Mộ kiếm của các Kiếm Tiên thượng cổ. Kiếm khí xé trời.',
        reqRealmIndex: 14,
        riskLevel: 'Hủy Diệt',
        dropInfo: 'Phá Giới Kiếm (3%).',
        difficultyMod: 4.0,
        dropRateMod: 1.0,
        damageDistribution: { physical: 0.8, elemental: 0.2, mental: 0 }, 
        element: 'metal',
        bossName: 'Kiếm Linh Phản Phệ',
        tacticTip: 'Sát thương và Chí mạng cực cao.',
        lootTable: [
            { itemId: 'sword_breaker', rate: 0.03, min: 1, max: 1 }, // Tỷ lệ 3%
            { itemId: 'ore_gold', rate: 0.3, min: 2, max: 5 }
        ]
    },

    // --- CẢNH GIỚI HÓA THẦN ---
    {
        id: 'hon_don_hai',
        name: 'Hỗn Độn Chi Hải',
        description: 'Vùng đất nơi quy tắc thiên địa bị phá vỡ.',
        reqRealmIndex: 15,
        riskLevel: 'Truyền Thuyết',
        dropInfo: 'Nguyên Anh Đan Lô (2%).',
        difficultyMod: 6.0,
        dropRateMod: 1.0,
        damageDistribution: { physical: 0.3, elemental: 0.3, mental: 0.4 }, 
        element: 'chaos',
        bossName: 'Cổ Thần Tàn Niệm',
        tacticTip: 'Cần Sát Thương Tuyệt Đối.',
        lootTable: [
            { itemId: 'cauldron_earth', rate: 0.02, min: 1, max: 1 }, // Tỷ lệ 2%
            { itemId: 'pill_protection', rate: 0.2, min: 1, max: 2 }
        ]
    }
];