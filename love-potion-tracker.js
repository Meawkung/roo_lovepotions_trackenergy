// love-potion-tracker.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Global Variables ---
    let currentRound = 1;
    let opponentEnergy = 2; // Starting Energy
    let selectedCardData = null; // Data of the card selected by the user for the opponent
    let gameHistory = []; // Array to store round history {round, cardPlayed, energyAfterRound}

    // --- DOM References ---
    const roundDisplay = document.getElementById('current-round');
    const energyDisplay = document.getElementById('opponent-energy');
    const statusMessage = document.getElementById('status-message');
    const cardSelector = document.getElementById('card-selector');
    const cardButtons = cardSelector.querySelectorAll('button');
    const nextRoundButton = document.getElementById('next-round-button');
    const resetButton = document.getElementById('reset-button');
    const historyLog = document.getElementById('history-log');

    // --- Core Functions ---

    /**
     * Updates the Enable/Disable state of card buttons based on estimated opponent energy
     * for the current round, including the bonus energy for special rounds.
     */
    function updateCardButtonStates() {
        // Calculate the energy the opponent *should* have at the START of this round
        let availableEnergyForThisRound = opponentEnergy;
        if (currentRound === 3 || currentRound === 6 || currentRound === 9) {
            availableEnergyForThisRound += 1;
        }

        // Ensure energy display reflects the potential bonus for this round's start
        // (Optional: you might want a separate display for "starting energy this round")
        energyDisplay.textContent = availableEnergyForThisRound; // Uncomment if you want to show energy *with* bonus before calculation

        cardButtons.forEach(button => {
            const cardCost = parseInt(button.dataset.cost) || 0;
            const isMagicBoost = button.dataset.card === 'Magic Boost';

            // Magic Boost (Cost 0) is always playable
            if (isMagicBoost) {
                button.disabled = false;
            } else {
                // Disable other cards if the calculated available energy is less than the cost
                button.disabled = availableEnergyForThisRound < cardCost;
            }
        });
    }

    /**
     * Updates the main display elements (Round number and *current* opponent energy).
     */
    function updateMainDisplay() {
        roundDisplay.textContent = currentRound;
        // Display the energy opponent *will start the NEXT round with* or *currently has*
        energyDisplay.textContent = opponentEnergy;
    }

    /**
     * Clears and redraws the history log list based on the gameHistory array.
     */
    function updateHistoryDisplay() {
        historyLog.innerHTML = ''; // Clear previous entries
        gameHistory.forEach(entry => {
            const listItem = document.createElement('li');
            // Format: "Round X: Played '[Card Name]' -> Y Energy Left"
            listItem.textContent = `รอบ ${entry.round}: คาดว่าเล่น '${entry.cardPlayed}' -> เหลือ ${entry.energyAfterRound} Energy`;
            historyLog.appendChild(listItem);
        });
        // Auto-scroll to the bottom of the history list
        historyLog.scrollTop = historyLog.scrollHeight;
    }

    /**
     * Resets the game state to its initial values and updates the UI.
     */
    function initializeGame() {
        currentRound = 1;
        opponentEnergy = 2;
        selectedCardData = null;
        gameHistory = [];

        updateMainDisplay(); // Update round/energy display
        updateHistoryDisplay(); // Clear history display
        updateCardButtonStates(); // Enable/disable buttons based on starting energy

        // Clear visual selection and disable confirm button
        cardButtons.forEach(btn => btn.classList.remove('selected'));
        nextRoundButton.disabled = true;
        statusMessage.textContent = `เริ่มเกมใหม่! เลือกการ์ดที่ศัตรูเล่นในรอบที่ 1`;
    }

    // --- Event Listeners ---

    /**
     * Handles clicks on the card selection buttons.
     * Uses event delegation on the parent container.
     */
    cardSelector.addEventListener('click', (event) => {
        const clickedElement = event.target;

        // Check if the clicked element is a BUTTON and is NOT disabled
        if (clickedElement.tagName === 'BUTTON' && !clickedElement.disabled) {
            // Clear previous visual selection
            cardButtons.forEach(btn => btn.classList.remove('selected'));
            // Apply visual selection to the clicked button
            clickedElement.classList.add('selected');

            // Store the data of the selected card
            selectedCardData = {
                name: clickedElement.dataset.card,
                cost: parseInt(clickedElement.dataset.cost) || 0,
                gain: parseInt(clickedElement.dataset.gain) || 0
            };

            // Update status message and enable the confirm button
            statusMessage.textContent = `การ์ด '${selectedCardData.name}' ถูกเลือกสำหรับรอบ ${currentRound}. กด 'ยืนยัน' เพื่อไปต่อ`;
            nextRoundButton.disabled = false;

        } else if (clickedElement.tagName === 'BUTTON' && clickedElement.disabled) {
            // Optional: Provide feedback if a disabled button is clicked
            statusMessage.textContent = `Energy ไม่พอที่จะเล่น '${clickedElement.dataset.card}' ในรอบนี้ (ต้องการ ${clickedElement.dataset.cost})`;
        }
    });

    /**
     * Handles the click on the "Confirm / Next Round" button.
     * Calculates energy changes, updates history, and prepares for the next round.
     */
    nextRoundButton.addEventListener('click', () => {
        if (!selectedCardData) {
            statusMessage.textContent = "ข้อผิดพลาด: กรุณาเลือกการ์ดก่อน!";
            return; // Stop if no card is selected
        }

        // --- Calculate Energy Changes for the *Current* Round ---

        // 1. Determine the energy available at the START of the round just played
        let energyBeforeThisRoundEffect = opponentEnergy;
        if (currentRound === 3 || currentRound === 6 || currentRound === 9) {
            energyBeforeThisRoundEffect += 1; // Apply bonus for special rounds
        }

        // 2. Calculate energy AFTER the selected card's effect
        let energyAfterEffect;
        if (selectedCardData.name === 'Magic Boost') {
            energyAfterEffect = energyBeforeThisRoundEffect + selectedCardData.gain;
        } else {
            // Double-check sufficiency (should be prevented by button disabling, but good failsafe)
            if (energyBeforeThisRoundEffect < selectedCardData.cost) {
                 console.error("Logic Error: Attempted to play card with insufficient energy despite UI lock.");
                 statusMessage.textContent = "เกิดข้อผิดพลาด: พลังงานไม่พอ! กรุณารีเซ็ต";
                 // Optionally disable the button permanently here or just stop
                 return;
            }
            energyAfterEffect = energyBeforeThisRoundEffect - selectedCardData.cost;
        }

        // 3. Ensure energy doesn't drop below zero
        if (energyAfterEffect < 0) {
            energyAfterEffect = 0;
        }

        // --- Record History ---
        const historyEntry = {
            round: currentRound,
            cardPlayed: selectedCardData.name,
            energyAfterRound: energyAfterEffect // This is the energy opponent has AFTER the round ends
        };
        gameHistory.push(historyEntry);

        // --- Update State for the *Next* Round ---
        opponentEnergy = energyAfterEffect; // This becomes the starting energy for the next round
        currentRound += 1;

        // --- Reset UI for the Next Round ---
        selectedCardData = null; // Clear the selection
        cardButtons.forEach(btn => btn.classList.remove('selected')); // Clear visual selection
        nextRoundButton.disabled = true; // Disable confirm button until next selection

        // --- Update Displays ---
        updateMainDisplay();       // Show new round number and the updated opponentEnergy
        updateHistoryDisplay();    // Show the updated history log
        updateCardButtonStates();  // Enable/disable buttons based on the new opponentEnergy for the upcoming round
        
        statusMessage.textContent = `เลือกการ์ดที่ศัตรูเล่นในรอบที่ ${currentRound}`; // Prompt for next input
    });

    /**
     * Handles the click on the "Reset Game" button.
     */
    resetButton.addEventListener('click', initializeGame);

    // --- Initial Game Setup ---
    initializeGame(); // Set up the initial state when the page loads

}); // End of DOMContentLoaded