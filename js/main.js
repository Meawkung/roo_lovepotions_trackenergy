// js/main.js
import * as state from './state.js';
import * as ui from './ui.js';
import * as storage from './storage.js';
import * as logic from './logic.js';
import { STARTING_HP } from './config.js'; // Import STARTING_HP if needed elsewhere

// --- Initialization Function ---
function initializeGame() {
    state.resetCurrentGameState(); // Resets game state including HP and game over status

    const gameState = state.getGameState();
    const statsState = state.getStatsState();
    // Calculate energy for the initial state (Round 1)
    const energyAvailable = logic.getAvailableEnergyForRound(gameState.currentRound, gameState.opponentEnergy);

    // Update UI including HP and initial energy
    ui.updateMainDisplay(gameState.currentRound, energyAvailable, gameState.playerHP);
    ui.updateHistoryDisplay(gameState.gameHistory);
    // Pass game over status (false initially)
    ui.updateCardButtonStates(energyAvailable, gameState.isGameOver);
    ui.updateGlobalProbabilityDisplay(statsState);
    ui.updateConditionalProbabilityDisplay(energyAvailable, statsState);

    ui.clearCardSelection();
    // Pass game over status (false initially)
    ui.enableNextButton(false, gameState.isGameOver);
    ui.updateStatusMessage(`เริ่มเกมใหม่! เลือกการ์ดที่ศัตรูเล่นในรอบที่ 1`);

    // Ensure controls are explicitly enabled after reset
    ui.disableGameControls(false);
}

// --- Event Handlers ---

function handleCardSelection(event) {
    // Prevent selection if game is over
    if (state.getGameState().isGameOver) return;

    const clickedElement = event.target.closest('button');
    if (clickedElement && !clickedElement.disabled) {
        ui.clearCardSelection();
        clickedElement.classList.add('selected');

        const cardData = {
            name: clickedElement.dataset.card,
            cost: parseInt(clickedElement.dataset.cost) || 0,
            gain: parseInt(clickedElement.dataset.gain) || 0
        };
        state.setSelectedCard(cardData); // Update state with selected card

        const currentRound = state.getGameState().currentRound;
        ui.updateStatusMessage(`การ์ด '${cardData.name}' ถูกเลือกสำหรับรอบ ${currentRound}. กด 'ยืนยัน' เพื่อไปต่อ`);
        ui.enableNextButton(true, false); // Enable next, game isn't over yet
    } else if (clickedElement && clickedElement.disabled) {
         ui.updateStatusMessage(`Energy ไม่พอที่จะเล่น '${clickedElement.dataset.card}' (ต้องการ ${clickedElement.dataset.cost})`);
    }
}

function handleNextRound() {
    // Prevent action if game is over
    if (state.getGameState().isGameOver) {
        ui.updateStatusMessage("Game Over! กด Reset เพื่อเริ่มใหม่");
        return;
    }

    const gameState = state.getGameState();
    if (!gameState.selectedCardData) {
        ui.updateStatusMessage("ข้อผิดพลาด: กรุณาเลือกการ์ดก่อน!");
        return;
    }

    // --- Calculations for the round being processed ---
    const energyAvailableThisRound = logic.getAvailableEnergyForRound(gameState.currentRound, gameState.opponentEnergy);
    const energyKey = energyAvailableThisRound.toString();
    const energyAfterEffect = logic.calculateEnergyAfterPlay(energyAvailableThisRound, gameState.selectedCardData);

    if (energyAfterEffect === null) {
        ui.updateStatusMessage("เกิดข้อผิดพลาด: พลังงานไม่พอ!"); // Should be rare
        return;
    }
    const finalEnergyAfterEffect = Math.max(0, energyAfterEffect);

    // --- Calculate Player Damage and Update HP ---
    const damageTaken = logic.calculateDamageTaken(gameState.selectedCardData.name);
    const newPlayerHP = gameState.playerHP - damageTaken;
    state.setPlayerHP(newPlayerHP); // Update HP in state

    // --- Record History & Stats (Before checking game over for this action) ---
    const historyEntry = {
        round: gameState.currentRound,
        cardPlayed: gameState.selectedCardData.name,
        energyAfterRound: finalEnergyAfterEffect // Energy opponent will have next round
    };
    state.addHistoryEntry(historyEntry);
    state.recordPlay(gameState.selectedCardData.name, energyKey); // Record stats based on energy *before* play

    // --- Save Stats ---
    if (!storage.savePersistentStats(state.getStatsState())) {
        ui.updateStatusMessage("ข้อผิดพลาด: ไม่สามารถบันทึกสถิติได้!");
        // Decide whether to proceed or stop
    }

    // --- Update State for the *Next* Round ---
    state.setOpponentEnergy(finalEnergyAfterEffect); // Set opponent's energy for the start of next round
    state.nextRound(); // Increment round number
    state.setSelectedCard(null); // Clear selection for next round

    // --- Check for Game Over ---
    let gameJustEnded = false;
    if (newPlayerHP <= 0) {
        state.setGameOver(true);
        gameJustEnded = true;
    }

    // --- Update UI based on new state (next round or game over) ---
    const newGameState = state.getGameState(); // Get state again, includes updated HP and possibly isGameOver
    const statsState = state.getStatsState();
    // Calculate energy available for the *start* of the now current (next) round
    const nextEnergyAvailable = logic.getAvailableEnergyForRound(newGameState.currentRound, newGameState.opponentEnergy);

    ui.updateMainDisplay(newGameState.currentRound, nextEnergyAvailable, newGameState.playerHP); // Show updated round, energy, HP
    ui.updateHistoryDisplay(newGameState.gameHistory);
    ui.updateCardButtonStates(nextEnergyAvailable, newGameState.isGameOver); // Update buttons based on new energy/game over state
    ui.updateGlobalProbabilityDisplay(statsState);
    ui.updateConditionalProbabilityDisplay(nextEnergyAvailable, statsState); // Update conditional stats for the new round's energy

    ui.clearCardSelection();
    ui.enableNextButton(false, newGameState.isGameOver); // Disable next button, considering game over

    // Final status message
    if (gameJustEnded) {
        ui.updateStatusMessage("Game Over! HP เหลือ 0 กด Reset เพื่อเริ่มใหม่");
        ui.disableGameControls(true); // Explicitly disable card/next buttons
    } else {
        ui.updateStatusMessage(`เลือกการ์ดที่ศัตรูเล่นในรอบที่ ${newGameState.currentRound}`);
    }
}

function handleResetGame() {
    initializeGame(); // Re-initializes the game board, keeps persistent stats
}

function handleClearStats() {
     if (confirm("คุณต้องการล้างสถิติการเล่น *ทั้งหมด* (รวมและตามเงื่อนไข) หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้")) {
        state.resetAllPersistentStats(); // Reset stats in state
        if (storage.savePersistentStats(state.getStatsState())) { // Save cleared state
             // Update UI immediately to reflect cleared stats
             const gameState = state.getGameState(); // Get current state after reset potentially
             const currentEnergy = logic.getAvailableEnergyForRound(gameState.currentRound, gameState.opponentEnergy);
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

    // Add listeners only if elements exist
    if (cardSelector) cardSelector.addEventListener('click', handleCardSelection);
    if (nextRoundButton) nextRoundButton.addEventListener('click', handleNextRound);
    if (resetButton) resetButton.addEventListener('click', handleResetGame);
    if (clearStatsButton) clearStatsButton.addEventListener('click', handleClearStats);

    // Initialize the game display
    initializeGame();
});