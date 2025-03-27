// js/state.js
import * as config from './config.js';

// Private state variables within this module
let currentRound = 1;
let opponentEnergy = 2;
let selectedCardData = null;
let gameHistory = []; // Current game history
let playerHP = config.STARTING_HP; // Player HP
let isGameOver = false; // Game Over status

// Persistent stats - initialized by storage module
let globalPlayCounts = {};
let globalTotalPlays = 0;
let conditionalPlayCounts = {};
let energyOccurrences = {};

// --- Getters ---
export const getGameState = () => ({
    currentRound,
    opponentEnergy,
    selectedCardData,
    gameHistory,
    playerHP,      // Expose playerHP
    isGameOver,    // Expose isGameOver
});

export const getStatsState = () => ({
    globalPlayCounts,
    globalTotalPlays,
    conditionalPlayCounts,
    energyOccurrences,
});

// --- Setters/Updaters ---
export const setRound = (round) => { currentRound = round; };
export const nextRound = () => { currentRound++; };
export const setOpponentEnergy = (energy) => { opponentEnergy = Math.max(0, energy); };
export const setSelectedCard = (data) => { selectedCardData = data; };
export const addHistoryEntry = (entry) => { gameHistory.push(entry); };
export const setPlayerHP = (hp) => { playerHP = Math.max(0, hp); }; // Update player HP, ensure non-negative
export const setGameOver = (status) => { isGameOver = status; }; // Update game over status

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
    playerHP = config.STARTING_HP; // Reset HP on new game
    isGameOver = false;         // Reset Game Over status
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