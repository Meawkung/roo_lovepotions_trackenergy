// js/state.js
import * as config from './config.js';

// Private state variables within this module
let currentRound = 1;
let opponentEnergy = 2;
let selectedCardData = null;
let gameHistory = []; // Current game history
let playerHP = config.STARTING_HP;
let isGameOver = false;
let playerAttackedAgainstIronWall = null; // null: not asked, true: yes, false: no

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
    playerHP,
    isGameOver,
    // playerAttackedAgainstIronWall // No need to expose directly, use specific getter
});

// Specific getter for attack status when Iron Wall is relevant
export const didPlayerAttack = () => playerAttackedAgainstIronWall;

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

// When setting the selected card, also handle resetting the Iron Wall attack status
export const setSelectedCard = (data) => {
    selectedCardData = data;
    // Reset attack status if the newly selected card is NOT Iron Wall
    // This handles changing selection away from Iron Wall as well
    if (data?.name !== 'Iron Wall') {
        playerAttackedAgainstIronWall = null;
    }
};

// Specific setter for the attack status
export const setPlayerAttackStatus = (didAttack) => {
    playerAttackedAgainstIronWall = didAttack;
};

export const addHistoryEntry = (entry) => { gameHistory.push(entry); };
export const setPlayerHP = (hp) => { playerHP = Math.max(0, hp); };
export const setGameOver = (status) => { isGameOver = status; };

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
    playerHP = config.STARTING_HP;
    isGameOver = false;
    playerAttackedAgainstIronWall = null; // Reset on new game
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