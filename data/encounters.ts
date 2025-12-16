import { Encounter } from '../types';

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
    },
    // --- CƠ DUYÊN CHÍNH ĐẠO MỚI ---
    {
        id: 'enlightenment',
        title: 'Cơ Duyên: Ngộ Đạo Lớn',
        description: 'Ngươi vô tình lạc vào một sơn động, nhìn thấy vách đá ghi lại những dòng chữ cổ xưa chứa đựng đạo lý thâm sâu. Đọc nó có thể giúp tu vi tiến triển thần tốc, nhưng cũng dễ sinh Tâm Ma.',
        options: [
            {
                label: 'Khắc ghi Đạo Pháp',
                description: 'Nhận "Đại Triệt Đại Ngộ" (+50% Tốc độ tu luyện, dính Tâm Ma).',
                type: 'righteous',
                gainTrait: 'great_enlightenment',
                reqPath: 'righteous'
            },
            {
                label: 'Rời đi',
                description: 'Cẩn tắc vô áy náy, Đạo phải tự mình ngộ.',
                type: 'normal'
            }
        ]
    },
    {
        id: 'forbidden_technique',
        title: 'Cấm Thuật Huyết Tế',
        description: 'Một cuốn sách da người trôi sông đến trước mặt ngươi. Đây là cấm thuật "Thiên Đố Anh Tài", cho sức mạnh kinh thiên nhưng sẽ bị Trời Đất ghen ghét.',
        options: [
            {
                label: 'Tu luyện Cấm Thuật',
                description: 'Nhận "Thiên Đố Anh Tài" (+Dmg Linh Lực, -Tỷ lệ Đột Phá).',
                type: 'righteous',
                gainTrait: 'heavenly_jealousy',
                reqPath: 'righteous'
            },
            {
                label: 'Đốt sách',
                description: 'Tà đạo không thể tồn tại.',
                type: 'normal'
            }
        ]
    },
    // --- CƠ DUYÊN MA ĐẠO MỚI ---
    {
        id: 'demon_pact',
        title: 'Giao Dịch Với Ma Thần',
        description: 'Trong giấc mộng, một bóng đen khổng lồ hiện ra, hứa ban cho ngươi sức mạnh vô địch để nghiền nát kẻ thù, đổi lại hắn muốn một phần linh hồn ngươi.',
        options: [
            {
                label: 'Ký Khế Ước',
                description: 'Nhận "Khế Ước Ma Thần" (+100% Strength, Giảm tỷ lệ Chế Tạo).',
                type: 'devil',
                gainTrait: 'devil_pact',
                reqPath: 'devil'
            },
            {
                label: 'Cự tuyệt',
                description: 'Ta không làm nô lệ cho ai cả.',
                type: 'normal'
            }
        ]
    },
    {
        id: 'body_transformation',
        title: 'Ma Hóa Thân Thể',
        description: 'Ngươi tìm thấy một bể máu cổ đại. Ngâm mình trong đó sẽ giúp cơ thể đao thương bất nhập, nhưng vĩnh viễn không thể phi thăng thành Tiên.',
        options: [
            {
                label: 'Nhảy vào Huyết Trì',
                description: 'Nhận "Ma Hóa Thân Thể" (+HP/Def, Giới hạn Cảnh Giới: Nguyên Anh).',
                type: 'devil',
                gainTrait: 'body_demonization',
                reqPath: 'devil'
            },
            {
                label: 'Quay đầu',
                description: 'Cơ thể cha mẹ ban cho không thể hủy hoại.',
                type: 'normal'
            }
        ]
    },
    // --- CƠ DUYÊN NHẬN TẨY TỦY ĐAN ---
    {
        id: 'ancient_remnant',
        title: 'Kỳ Ngộ: Di Tích Cổ Tiên',
        description: 'Ngươi lạc vào một vườn thuốc bỏ hoang từ thượng cổ. Ở trung tâm có một lò luyện đan vẫn đang cháy âm ỉ, bên trong tỏa ra mùi hương lạ lùng.',
        options: [
            {
                label: 'Mở lò lấy thuốc',
                description: 'Cần tiêu hao 1000 Linh Thạch để phá giải trận pháp bảo vệ lò.',
                type: 'righteous',
                resourceCost: { spiritStones: 1000 },
                gainItem: { itemId: 'pill_spirit_root', quantity: 1 }
            },
            {
                label: 'Tìm kiếm xung quanh',
                description: 'Có thể nhặt được một ít thảo dược.',
                type: 'normal',
                resourceCost: {},
                gainItem: { itemId: 'wood_spirit', quantity: 5 }
            }
        ]
    }
];