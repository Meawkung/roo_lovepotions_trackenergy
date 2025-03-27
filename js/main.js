// js/main.js
import * as state from './state.js';
import * as ui from './ui.js';
import * as storage from './storage.js';
import * as logic from './logic.js';
import { STARTING_HP } from './config.js'; // Import STARTING_HP if needed elsewhere

// --- Initialization Function ---
function initializeGame() {
    state.resetCurrentGameState(); // Resets game state including HP, game over, and attack status

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
        // Update state, this also resets playerAttacked status if not Iron Wall
        state.setSelectedCard(cardData);

        let allowNext = true; // Assume we can proceed unless prompt is needed and cancelled (confirm() doesn't really cancel flow here)

        // Ask about player attack only if Iron Wall is selected AND we haven't answered yet
        if (cardData.name === 'Iron Wall' && state.didPlayerAttack() === null) {
            // Using confirm() directly. User clicking Cancel means 'false'.
            const didAttack = confirm("Iron Wall ถูกเลือก! คุณได้ใช้การ์ดโจมตีในรอบนี้หรือไม่?\n(OK = ใช่, Cancel = ไม่ใช่)");
            state.setPlayerAttackStatus(didAttack); // Store the answer (true/false)
            // No need to set allowNext = false with confirm() as it blocks execution
        }

        // Update status message based on selection and potential Iron Wall answer
        if (cardData.name === 'Iron Wall') {
             const attackStatusMsg = state.didPlayerAttack() ? "(คุณโจมตี)" : "(คุณไม่โจมตี)";
             ui.updateStatusMessage(`การ์ด '${cardData.name}' ${attackStatusMsg} ถูกเลือก. กด 'ยืนยัน' เพื่อไปต่อ`);
        } else {
             const currentRound = state.getGameState().currentRound;
             ui.updateStatusMessage(`การ์ด '${cardData.name}' ถูกเลือกสำหรับรอบ ${currentRound}. กด 'ยืนยัน' เพื่อไปต่อ`);
        }

        // Enable Next button (game isn't over yet)
        ui.enableNextButton(true, false);

    } else if (clickedElement && clickedElement.disabled) {
         // Display message if clicking a disabled button
         const neededCost = clickedElement.dataset.cost;
         ui.updateStatusMessage(`Energy ไม่พอที่จะเล่น '${clickedElement.dataset.card}' (ต้องการ ${neededCost})`);
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

    // Re-check if Iron Wall requires an answer that wasn't given
    // (Shouldn't happen with confirm(), but good as a safeguard)
    if (gameState.selectedCardData.name === 'Iron Wall' && state.didPlayerAttack() === null) {
         ui.updateStatusMessage("ข้อผิดพลาด: ไม่ได้ระบุว่าโจมตี Iron Wall หรือไม่ กรุณาเลือกการ์ดใหม่");
         state.setSelectedCard(null); // Force re-selection
         ui.clearCardSelection();
         ui.enableNextButton(false, false);
         return;
    }

    // --- Calculations for the round being processed ---
    const energyAvailableThisRound = logic.getAvailableEnergyForRound(gameState.currentRound, gameState.opponentEnergy);
    const energyKey = energyAvailableThisRound.toString();
    const energyAfterEffect = logic.calculateEnergyAfterPlay(energyAvailableThisRound, gameState.selectedCardData);

    if (energyAfterEffect === null) {
        // This case implies insufficient energy, though button disable should prevent it.
        ui.updateStatusMessage("เกิดข้อผิดพลาด: พลังงานไม่พอ!");
        return;
    }
    const finalEnergyAfterEffect = Math.max(0, energyAfterEffect);

    // --- Calculate Player Damage (Pass player attack status for Iron Wall) ---
    const damageTaken = logic.calculateDamageTaken(
        gameState.selectedCardData.name,
        state.didPlayerAttack() // Pass the stored true/false/null status
    );
    const newPlayerHP = gameState.playerHP - damageTaken;
    state.setPlayerHP(newPlayerHP); // Update HP in state

    // --- Record History & Stats (Based on energy *before* play) ---
    const historyEntry = {
        round: gameState.currentRound,
        cardPlayed: gameState.selectedCardData.name,
        energyAfterRound: finalEnergyAfterEffect // Opponent energy for next round
    };
    state.addHistoryEntry(historyEntry);
    state.recordPlay(gameState.selectedCardData.name, energyKey);

    // --- Save Stats ---
    if (!storage.savePersistentStats(state.getStatsState())) {
        ui.updateStatusMessage("ข้อผิดพลาด: ไม่สามารถบันทึกสถิติได้!");
        // Consider whether to halt execution or just warn
    }

    // --- Update State for the *Next* Round ---
    state.setOpponentEnergy(finalEnergyAfterEffect); // Set energy for the start of the next round
    state.nextRound(); // Increment round number
    state.setSelectedCard(null); // Clear selection (this also resets Iron Wall attack status via its setter)

    // --- Check for Game Over ---
    let gameJustEnded = false;
    if (newPlayerHP <= 0) {
        state.setGameOver(true);
        gameJustEnded = true;
    }

    // --- Update UI based on new state (next round or game over) ---
    const newGameState = state.getGameState(); // Get state again (includes updated HP, round, game over status)
    const statsState = state.getStatsState();
    // Calculate energy available for the *start* of the now current (next) round
    const nextEnergyAvailable = logic.getAvailableEnergyForRound(newGameState.currentRound, newGameState.opponentEnergy);

    // Update main display with new round, energy, HP
    ui.updateMainDisplay(newGameState.currentRound, nextEnergyAvailable, newGameState.playerHP);
    ui.updateHistoryDisplay(newGameState.gameHistory);
    // Update buttons based on new energy and game over status
    ui.updateCardButtonStates(nextEnergyAvailable, newGameState.isGameOver);
    ui.updateGlobalProbabilityDisplay(statsState);
    // Update conditional stats for the new round's starting energy
    ui.updateConditionalProbabilityDisplay(nextEnergyAvailable, statsState);

    ui.clearCardSelection();
    // Disable next button, respecting game over status
    ui.enableNextButton(false, newGameState.isGameOver);

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
     // Check if the clearStatsButton exists before adding listener logic
     const clearButton = ui.getClearStatsButton();
     if (!clearButton) return; // Exit if button not found

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