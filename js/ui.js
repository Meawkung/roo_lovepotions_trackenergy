// js/ui.js
import { cardNames } from './config.js'; // Import card names if needed

// --- DOM Element References (keep them together here) ---
const roundDisplay = document.getElementById('current-round');
const energyDisplay = document.getElementById('opponent-energy');
const statusMessage = document.getElementById('status-message');
const cardSelector = document.getElementById('card-selector');
const cardButtons = cardSelector.querySelectorAll('button');
const nextRoundButton = document.getElementById('next-round-button');
const historyLog = document.getElementById('history-log');
const probabilityDisplay = document.getElementById('probability-display');
const conditionalProbDisplay = document.getElementById('conditional-probability-display');
const conditionalEnergyValue = document.getElementById('conditional-energy-value');

// Ensure elements exist before trying to use them (basic check)
if (!roundDisplay || !energyDisplay || !statusMessage || !cardSelector || !historyLog || !probabilityDisplay || !conditionalProbDisplay || !conditionalEnergyValue) {
    console.error("One or more essential UI elements not found!");
}

// --- UI Update Functions ---

export function updateCardButtonStates(availableEnergy) {
    if (!cardButtons) return;
    cardButtons.forEach(button => {
        const cardCost = parseInt(button.dataset.cost) || 0;
        const isMagicBoost = button.dataset.card === 'Magic Boost';
        button.disabled = !isMagicBoost && availableEnergy < cardCost;
    });
}

export function updateMainDisplay(round, energyAvailable) {
    if (roundDisplay) roundDisplay.textContent = round;
    // Display the energy available *at the start* of this round
    if (energyDisplay) energyDisplay.textContent = energyAvailable;
}

export function updateHistoryDisplay(history) {
    if (!historyLog) return;
    historyLog.innerHTML = '';
    history.forEach(entry => {
        const listItem = document.createElement('li');
        listItem.textContent = `รอบ ${entry.round}: เล่น '${entry.cardPlayed}' → เหลือ ${entry.energyAfterRound} E`;
        historyLog.appendChild(listItem);
    });
    historyLog.scrollTop = historyLog.scrollHeight;
}

export function updateGlobalProbabilityDisplay(stats) {
    if (!probabilityDisplay) return;
    probabilityDisplay.innerHTML = '';
    if (stats.globalTotalPlays === 0) {
        probabilityDisplay.innerHTML = '<p>ยังไม่มีข้อมูลสถิติรวม</p>';
        return;
    }
    const probList = document.createElement('ul');
    const sortedNames = [...cardNames].sort(); // Use cardNames from config
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
    const sortedNames = [...cardNames].sort(); // Use cardNames from config

    for (const cardName of sortedNames) {
        const count = countsForThisEnergy[cardName] || 0;
        if (count > 0) { // Only show cards played at this energy level
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

export function enableNextButton(enable = true) {
    if (nextRoundButton) nextRoundButton.disabled = !enable;
}

export function updateStatusMessage(message) {
    if (statusMessage) statusMessage.textContent = message;
}

// --- Getters for DOM Elements needed by main.js for listeners ---
// It's often better to keep listener setup in main.js
export const getCardSelector = () => cardSelector;
export const getNextRoundButton = () => nextRoundButton;
export const getResetButton = () => document.getElementById('reset-button'); // Assuming it exists
export const getClearStatsButton = () => document.getElementById('clear-stats-button'); // Assuming it exists