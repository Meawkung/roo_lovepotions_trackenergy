// js/ui.js
import { cardNames } from './config.js'; // Import card names if needed

// --- DOM Element References ---
const roundDisplay = document.getElementById('current-round');
const playerHPDisplay = document.getElementById('player-hp'); // Reference for Player HP
const energyDisplay = document.getElementById('opponent-energy');
const statusMessage = document.getElementById('status-message');
const cardSelector = document.getElementById('card-selector');
const cardButtons = cardSelector ? cardSelector.querySelectorAll('button') : null; // Check if cardSelector exists
const nextRoundButton = document.getElementById('next-round-button');
const historyLog = document.getElementById('history-log');
const probabilityDisplay = document.getElementById('probability-display');
const conditionalProbDisplay = document.getElementById('conditional-probability-display');
const conditionalEnergyValue = document.getElementById('conditional-energy-value');
const resetButton = document.getElementById('reset-button');
const clearStatsButton = document.getElementById('clear-stats-button');

// Basic check for essential elements (more robust)
const essentialElements = { roundDisplay, playerHPDisplay, energyDisplay, statusMessage, cardSelector, cardButtons, nextRoundButton, historyLog, probabilityDisplay, conditionalProbDisplay, conditionalEnergyValue, resetButton };
for (const key in essentialElements) {
    if (!essentialElements[key]) {
        console.error(`Essential UI element "${key}" not found! Check your HTML IDs.`);
    }
}

// --- UI Update Functions ---

export function updateCardButtonStates(availableEnergy, isGameOver) {
    if (!cardButtons) return;
    cardButtons.forEach(button => {
        if (isGameOver) {
            button.disabled = true; // Disable all if game over
            return;
        }
        // Original logic if game is not over
        const cardCost = parseInt(button.dataset.cost) || 0;
        const isMagicBoost = button.dataset.card === 'Magic Boost';
        button.disabled = !isMagicBoost && availableEnergy < cardCost;
    });
}

export function updateMainDisplay(round, energyAvailable, currentHP) {
    if (roundDisplay) roundDisplay.textContent = round;
    if (playerHPDisplay) playerHPDisplay.textContent = currentHP; // Update Player HP
    if (energyDisplay) energyDisplay.textContent = energyAvailable; // Opponent Energy available at start of round
}

export function updateHistoryDisplay(history) {
    if (!historyLog) return;
    historyLog.innerHTML = '';
    history.forEach(entry => {
        const listItem = document.createElement('li');
        listItem.textContent = `รอบ ${entry.round}: เล่น '${entry.cardPlayed}' → เหลือ ${entry.energyAfterRound} E`;
        historyLog.appendChild(listItem);
    });
    if(history.length > 0) { // Scroll only if there's content
      historyLog.scrollTop = historyLog.scrollHeight;
    }
}

export function updateGlobalProbabilityDisplay(stats) {
    if (!probabilityDisplay) return;
    probabilityDisplay.innerHTML = '';
    if (stats.globalTotalPlays === 0) {
        probabilityDisplay.innerHTML = '<p>ยังไม่มีข้อมูลสถิติรวม</p>';
        return;
    }
    const probList = document.createElement('ul');
    const sortedNames = [...cardNames].sort();
    for (const cardName of sortedNames) {
        const count = stats.globalPlayCounts[cardName] || 0;
        const probability = (count / stats.globalTotalPlays) * 100;
        const listItem = document.createElement('li');
        listItem.textContent = `${cardName}: ${probability.toFixed(1)}% (${count} ครั้ง)`;
        probList.appendChild(listItem);
    }
    probabilityDisplay.appendChild(probList);
}

export function updateConditionalProbabilityDisplay(energyNow, stats) {
    if (!conditionalProbDisplay || !conditionalEnergyValue) return;
    conditionalProbDisplay.innerHTML = '';
    conditionalEnergyValue.textContent = energyNow;

    const energyKey = energyNow.toString();
    const occurrences = stats.energyOccurrences[energyKey] || 0;

    if (occurrences === 0) {
        conditionalProbDisplay.innerHTML = `<p>ยังไม่มีสถิติสำหรับ ${energyNow} Energy</p>`;
        return;
    }

    const countsForThisEnergy = stats.conditionalPlayCounts[energyKey] || {};
    const probList = document.createElement('ul');
    const sortedNames = [...cardNames].sort();

    for (const cardName of sortedNames) {
        const count = countsForThisEnergy[cardName] || 0;
        if (count > 0) {
            const probability = (count / occurrences) * 100;
            const listItem = document.createElement('li');
            listItem.innerHTML = `${cardName}: <strong>${probability.toFixed(1)}%</strong> (${count}/${occurrences} ครั้ง)`;
            probList.appendChild(listItem);
        }
    }

    if (probList.children.length === 0) {
         conditionalProbDisplay.innerHTML = `<p>ยังไม่มีสถิติการเล่นการ์ดสำหรับ ${energyNow} Energy</p>`;
    } else {
        conditionalProbDisplay.appendChild(probList);
    }
}

// --- Other UI Helpers ---

export function clearCardSelection() {
    if (!cardButtons) return;
    cardButtons.forEach(btn => btn.classList.remove('selected'));
}

export function enableNextButton(enable = true, isGameOver = false) {
    if (nextRoundButton) {
        nextRoundButton.disabled = isGameOver || !enable;
    }
}

export function updateStatusMessage(message) {
    if (statusMessage) statusMessage.textContent = message;
}

/**
 * Disables or enables card buttons and the next round button when game ends/resets.
 * Reset and Clear Stats buttons are assumed to remain enabled.
 * @param {boolean} disable - True to disable core game controls, false to enable.
 */
export function disableGameControls(disable = true) {
    if (cardButtons) {
        cardButtons.forEach(button => button.disabled = disable);
    }
    if (nextRoundButton) {
        nextRoundButton.disabled = disable;
    }
}

// --- Getters for DOM Elements needed by main.js ---
export const getCardSelector = () => cardSelector;
export const getNextRoundButton = () => nextRoundButton;
export const getResetButton = () => resetButton;
export const getClearStatsButton = () => clearStatsButton;