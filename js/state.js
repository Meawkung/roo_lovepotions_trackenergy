// js/state.js
import * as config from './config.js';

// Private state variables within this module
let currentRound = 1;
let opponentEnergy = 2;
let selectedCardData = null;
let gameHistory = []; // Current game history

// Persistent stats - initialized by storage module
let globalPlayCounts = {};
let globalTotalPlays = 0;
let conditionalPlayCounts = {};
let energyOccurrences = {};

// --- Getters (ให้เข้าถึง state จากภายนอก) ---
export const getGameState = () => ({
    currentRound,
    opponentEnergy,
    selectedCardData,
    gameHistory,
});

export const getStatsState = () => ({
    globalPlayCounts,
    globalTotalPlays,
    conditionalPlayCounts,
    energyOccurrences,
});

// --- Setters/Updaters (ให้เปลี่ยนแปลง state จากภายนอก) ---
export const setRound = (round) => { currentRound = round; };
export const nextRound = () => { currentRound++; };
export const setOpponentEnergy = (energy) => { opponentEnergy = Math.max(0, energy); }; // Ensure non-negative
export const setSelectedCard = (data) => { selectedCardData = data; };
export const addHistoryEntry = (entry) => { gameHistory.push(entry); };

// Functions to initialize/update stats (called by storage or main logic)
export const setLoadedStats = (stats) => {
    globalPlayCounts = stats.globalPlayCounts;
    globalTotalPlays = stats.globalTotalPlays;
    conditionalPlayCounts = stats.conditionalPlayCounts;
    energyOccurrences = stats.energyOccurrences;
};

export const resetCurrentGameState = () => {
    currentRound = 1;
    opponentEnergy = 2;
    selectedCardData = null;
    gameHistory = [];
};

// Function to update stats after a play
export const recordPlay = (cardName, energyKey) => {
    // Global
    globalPlayCounts[cardName] = (globalPlayCounts[cardName] || 0) + 1;
    globalTotalPlays++;

    // Conditional
    energyOccurrences[energyKey] = (energyOccurrences[energyKey] || 0) + 1;
    if (!conditionalPlayCounts[energyKey]) {
        conditionalPlayCounts[energyKey] = {};
    }
    conditionalPlayCounts[energyKey][cardName] = (conditionalPlayCounts[energyKey][cardName] || 0) + 1;
};

// Function to completely reset ALL persistent stats
export const resetAllPersistentStats = () => {
    globalPlayCounts = { ...config.defaultGlobalPlayCounts };
    globalTotalPlays = 0;
    conditionalPlayCounts = { ...config.defaultConditionalCounts };
    energyOccurrences = { ...config.defaultEnergyOccurrences };
};