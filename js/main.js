// js/main.js
import * as state from './state.js';
import * as ui from './ui.js';
import * as storage from './storage.js';
import * as logic from './logic.js';

// --- Initialization Function ---
function initializeGame() {
    state.resetCurrentGameState(); // Reset only game state, not stats

    const gameState = state.getGameState();
    const statsState = state.getStatsState();
    const energyAvailable = logic.getAvailableEnergyForRound(gameState.currentRound, gameState.opponentEnergy);

    ui.updateMainDisplay(gameState.currentRound, energyAvailable);
    ui.updateHistoryDisplay(gameState.gameHistory); // Clears visual history
    ui.updateCardButtonStates(energyAvailable);
    ui.updateGlobalProbabilityDisplay(statsState);
    ui.updateConditionalProbabilityDisplay(energyAvailable, statsState);

    ui.clearCardSelection();
    ui.enableNextButton(false);
    ui.updateStatusMessage(`เริ่มเกมใหม่! เลือกการ์ดที่ศัตรูเล่นในรอบที่ 1`);
}

// --- Event Handlers ---

function handleCardSelection(event) {
    const clickedElement = event.target.closest('button');
    if (clickedElement && !clickedElement.disabled) {
        ui.clearCardSelection(); // Clear previous visual selection via UI module
        clickedElement.classList.add('selected'); // Add selection class directly

        const cardData = {
            name: clickedElement.dataset.card,
            cost: parseInt(clickedElement.dataset.cost) || 0,
            gain: parseInt(clickedElement.dataset.gain) || 0
        };
        state.setSelectedCard(cardData); // Update state

        const currentRound = state.getGameState().currentRound;
        ui.updateStatusMessage(`การ์ด '${cardData.name}' ถูกเลือกสำหรับรอบ ${currentRound}. กด 'ยืนยัน' เพื่อไปต่อ`);
        ui.enableNextButton(true);
    } else if (clickedElement && clickedElement.disabled) {
         ui.updateStatusMessage(`Energy ไม่พอที่จะเล่น '${clickedElement.dataset.card}' (ต้องการ ${clickedElement.dataset.cost})`);
    }
}

function handleNextRound() {
    const gameState = state.getGameState();
    if (!gameState.selectedCardData) {
        ui.updateStatusMessage("ข้อผิดพลาด: กรุณาเลือกการ์ดก่อน!");
        return;
    }

    // Calculate energy available at the START of the round being processed
    const energyAvailableThisRound = logic.getAvailableEnergyForRound(gameState.currentRound, gameState.opponentEnergy);
    const energyKey = energyAvailableThisRound.toString();

    // Calculate energy AFTER the play
    const energyAfterEffect = logic.calculateEnergyAfterPlay(energyAvailableThisRound, gameState.selectedCardData);

    if (energyAfterEffect === null) { // Check if calculation indicated insufficient energy (should be rare)
        ui.updateStatusMessage("เกิดข้อผิดพลาด: พลังงานไม่พอ!");
        return;
    }
    const finalEnergyAfterEffect = Math.max(0, energyAfterEffect); // Ensure non-negative

    // Record history for the current game
    const historyEntry = {
        round: gameState.currentRound,
        cardPlayed: gameState.selectedCardData.name,
        energyAfterRound: finalEnergyAfterEffect
    };
    state.addHistoryEntry(historyEntry);

    // Update persistent stats in state
    state.recordPlay(gameState.selectedCardData.name, energyKey);

    // Save stats to localStorage
    if (!storage.savePersistentStats(state.getStatsState())) {
        ui.updateStatusMessage("ข้อผิดพลาด: ไม่สามารถบันทึกสถิติได้!");
        // Decide if you want to stop the game or just warn
    }

    // Update state for the *next* round
    state.setOpponentEnergy(finalEnergyAfterEffect);
    state.nextRound();
    state.setSelectedCard(null); // Clear selected card from state

    // --- Update UI for the *new* current round ---
    const newGameState = state.getGameState();
    const statsState = state.getStatsState();
    const nextEnergyAvailable = logic.getAvailableEnergyForRound(newGameState.currentRound, newGameState.opponentEnergy);

    ui.updateMainDisplay(newGameState.currentRound, nextEnergyAvailable);
    ui.updateHistoryDisplay(newGameState.gameHistory);
    ui.updateCardButtonStates(nextEnergyAvailable);
    ui.updateGlobalProbabilityDisplay(statsState);
    ui.updateConditionalProbabilityDisplay(nextEnergyAvailable, statsState);

    ui.clearCardSelection();
    ui.enableNextButton(false);
    ui.updateStatusMessage(`เลือกการ์ดที่ศัตรูเล่นในรอบที่ ${newGameState.currentRound}`);
}

function handleResetGame() {
    initializeGame(); // Re-initializes the game board but keeps stats
}

function handleClearStats() {
     if (confirm("คุณต้องการล้างสถิติการเล่น *ทั้งหมด* (รวมและตามเงื่อนไข) หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้")) {
        state.resetAllPersistentStats(); // Reset stats in state
        if (storage.savePersistentStats(state.getStatsState())) { // Save cleared state
             // Update UI immediately
             const currentEnergy = logic.getAvailableEnergyForRound(state.getGameState().currentRound, state.getGameState().opponentEnergy);
             ui.updateGlobalProbabilityDisplay(state.getStatsState());
             ui.updateConditionalProbabilityDisplay(currentEnergy, state.getStatsState());
             ui.updateStatusMessage("ล้างสถิติทั้งหมดเรียบร้อยแล้ว");
        } else {
            ui.updateStatusMessage("ข้อผิดพลาด: ไม่สามารถบันทึกการล้างสถิติได้!");
        }
    }
}


// --- Main Execution ---
document.addEventListener('DOMContentLoaded', () => {
    // Load stats and apply them to the state module
    const loadedStats = storage.loadPersistentStats();
    state.setLoadedStats(loadedStats);

    // Setup Event Listeners using elements obtained from ui.js
    const cardSelector = ui.getCardSelector();
    const nextRoundButton = ui.getNextRoundButton();
    const resetButton = ui.getResetButton();
    const clearStatsButton = ui.getClearStatsButton(); // Optional

    if (cardSelector) cardSelector.addEventListener('click', handleCardSelection);
    if (nextRoundButton) nextRoundButton.addEventListener('click', handleNextRound);
    if (resetButton) resetButton.addEventListener('click', handleResetGame);
    if (clearStatsButton) clearStatsButton.addEventListener('click', handleClearStats);

    // Initialize the game display
    initializeGame();
});