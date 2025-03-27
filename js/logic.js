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
 * Determines the damage the player takes based on the opponent's assumed card
 * AND whether the player attacked when facing Iron Wall.
 * @param {string} enemyCardName - The name of the card the opponent played.
 * @param {boolean|null} playerAttackedAgainstIronWall - Did player attack? (true/false/null).
 * @returns {number} The amount of damage taken by the player.
 */
export function calculateDamageTaken(enemyCardName, playerAttackedAgainstIronWall) {
    let damage = cardDamage[enemyCardName] || 0; // Base damage from enemy card

    // Add Iron Wall deflection damage IF opponent used Iron Wall AND player confirmed they attacked
    if (enemyCardName === 'Iron Wall' && playerAttackedAgainstIronWall === true) {
        damage += 1; // Player takes 1 damage from deflection
    }

    return damage;
}