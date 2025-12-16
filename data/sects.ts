import { Sect } from '../types';

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