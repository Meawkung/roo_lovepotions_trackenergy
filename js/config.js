// js/config.js

// Local Storage Keys
export const GLOBAL_COUNTS_KEY = 'lovePotion_globalCounts_v1';
export const GLOBAL_TOTAL_KEY = 'lovePotion_globalTotal_v1';
export const CONDITIONAL_COUNTS_KEY = 'lovePotion_conditionalCounts_v1';
export const ENERGY_OCCURRENCES_KEY = 'lovePotion_energyOccurrences_v1';

// Default structures for stats
export const defaultGlobalPlayCounts = {
    'First Love': 0,
    'Deep Love': 0,
    'Cold Wall': 0,
    'Iron Wall': 0,
    'Magic Boost': 0
};
export const defaultConditionalCounts = {}; // { 'energyLevel': { 'CardName': count } }
export const defaultEnergyOccurrences = {}; // { 'energyLevel': count }

// Card Names (อาจมีประโยชน์ถ้าใช้หลายที่)
export const cardNames = Object.keys(defaultGlobalPlayCounts);