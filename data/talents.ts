import { Talent } from '../types';

export const TALENTS: Talent[] = [
    {
        id: 'heavenly_roots',
        name: 'Tiên Thiên Linh Căn',
        description: 'Tăng tốc độ hấp thụ Linh Khí cơ bản.',
        maxLevel: 50,
        baseCost: 10,
        costMultiplier: 1.5,
        effectPerLevel: 0.1, // +10% mỗi cấp
        type: 'cultivation'
    },
    {
        id: 'pill_mastery',
        name: 'Đan Đạo Tông Sư',
        description: 'Giảm tiêu hao Linh Thảo khi chế tạo đan dược.',
        maxLevel: 20,
        baseCost: 15,
        costMultiplier: 1.4,
        effectPerLevel: 0.02, // -2% mỗi cấp
        type: 'economy'
    },
    {
        id: 'divine_body',
        name: 'Bất Diệt Kim Thân',
        description: 'Tăng chỉ số HP và Phòng Thủ cơ bản khởi đầu.',
        maxLevel: 100,
        baseCost: 5,
        costMultiplier: 1.2,
        effectPerLevel: 5, // +5 chỉ số thẳng mỗi cấp
        type: 'combat'
    },
    {
        id: 'sword_intent',
        name: 'Vô Thượng Kiếm Ý',
        description: 'Tăng Sát Thương gây ra lên quái vật.',
        maxLevel: 30,
        baseCost: 20,
        costMultiplier: 1.6,
        effectPerLevel: 0.05, // +5% dmg mỗi cấp
        type: 'combat'
    },
    {
        id: 'fortune_favour',
        name: 'Khí Vận Chi Tử',
        description: 'Tăng tỷ lệ rơi vật phẩm hiếm khi thám hiểm.',
        maxLevel: 10,
        baseCost: 50,
        costMultiplier: 2.0,
        effectPerLevel: 0.05, // +5% drop rate mỗi cấp
        type: 'economy'
    }
];