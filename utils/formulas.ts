import { ElementType } from '../types';

// Giảm hiệu quả khi chỉ số quá cao (Diminishing Returns)
export const applyDiminishingReturns = (value: number, threshold: number = 500): number => {
    if (value <= threshold) return value;
    return threshold + (value - threshold) * 0.2;
};

// Tính giá nâng cấp Talent
export const getTalentCost = (baseCost: number, multiplier: number, currentLevel: number) => {
    return Math.floor(baseCost * Math.pow(multiplier, currentLevel));
};

// Tính khắc chế hệ
export const getElementMultiplier = (attacker: ElementType, defender: ElementType): number => {
    if (attacker === 'none' || defender === 'none') return 1.0;
    if (attacker === 'chaos' || defender === 'chaos') return 1.0; 
    
    const counterMap: Record<string, string> = {
        'metal': 'wood',
        'wood': 'earth',
        'earth': 'water',
        'water': 'fire',
        'fire': 'metal',
        'dark': 'illusion', 
        'illusion': 'human' 
    };

    if (counterMap[attacker] === defender) return 1.5; // Khắc chế mạnh
    if (counterMap[defender] === attacker) return 0.6; // Bị khắc chế (Giảm sát thương)
    return 1.0;
};
