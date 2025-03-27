// js/logic.js
import { cardDamage } from './config.js'; // Import damage config

/**
 * Calculates the energy available at the start of a given round, including bonus.
 * @param {number} round - The current round number.
 * @param {number} energyAtStartOfRound - Energy carried over from the previous round.
 * @returns {number} Energy available for the current round.
 */
export function getAvailableEnergyForRound(round, energyAtStartOfRound) {
    let energy = energyAtStartOfRound;
    // Bonus energy on rounds 3, 6, 9, 12, 15...
    if (round >= 3 && (round % 3 === 0)) {
         energy += 1;
    }
    return energy;
}

/**
 * Calculates the energy remaining after playing a card.
 * @param {number} energyAvailable - Energy available before playing the card.
 * @param {object} cardData - Object containing card cost/gain { name, cost, gain }.
 * @returns {number|null} Remaining energy, or null if play is invalid (insufficient energy).
 */
export function calculateEnergyAfterPlay(energyAvailable, cardData) {
    if (!cardData) return energyAvailable;

    if (cardData.name === 'Magic Boost') {
        return energyAvailable + cardData.gain;
    } else {
        if (energyAvailable < cardData.cost) {
             console.error("Logic Error: Attempted to calculate play with insufficient energy.");
             return null; // Indicate invalid play
        }
        return energyAvailable - cardData.cost;
    }
}

/**
 * Determines the damage the player takes based on the opponent's assumed card.
 * @param {string} enemyCardName - The name of the card the opponent is assumed to have played.
 * @returns {number} The amount of damage taken.
 */
export function calculateDamageTaken(enemyCardName) {
    // Return damage value from config, default to 0 if card not found
    return cardDamage[enemyCardName] || 0;
}