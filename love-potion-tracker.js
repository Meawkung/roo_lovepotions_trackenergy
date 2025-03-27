// love-potion-tracker.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Global Variables ---
    let currentRound = 1;
    let opponentEnergy = 2;
    let selectedCardData = null;
    let gameHistory = []; // History for the *current* game only
    let playCounts = {};  // Initialized in loadPersistentStats
    let totalPlays = 0;   // Initialized in loadPersistentStats

    // --- Constants for localStorage Keys ---
    const COUNTS_STORAGE_KEY = 'lovePotionPlayCounts_v1'; // Added versioning
    const TOTAL_PLAYS_STORAGE_KEY = 'lovePotionTotalPlays_v1'; // Added versioning

    // --- Default structure for playCounts ---
    const defaultPlayCounts = {
        'First Love': 0,
        'Deep Love': 0,
        'Cold Wall': 0,
        'Iron Wall': 0,
        'Magic Boost': 0
    };

    // --- DOM References ---
    const roundDisplay = document.getElementById('current-round');
    const energyDisplay = document.getElementById('opponent-energy');
    const statusMessage = document.getElementById('status-message');
    const cardSelector = document.getElementById('card-selector');
    const cardButtons = cardSelector.querySelectorAll('button');
    const nextRoundButton = document.getElementById('next-round-button');
    const resetButton = document.getElementById('reset-button');
    const historyLog = document.getElementById('history-log');
    const probabilityDisplay = document.getElementById('probability-display');
    // Optional: Add reference if you included the clear stats button
    clearStatsButton = document.getElementById('clear-stats-button');

    // --- Load Persistent Stats Function ---
    function loadPersistentStats() {
        const storedCounts = localStorage.getItem(COUNTS_STORAGE_KEY);
        const storedTotalPlays = localStorage.getItem(TOTAL_PLAYS_STORAGE_KEY);
        let loadedCounts = null;

        if (storedCounts) {
            try {
                loadedCounts = JSON.parse(storedCounts);
                // Basic validation: check if it's an object and has expected keys
                if (typeof loadedCounts !== 'object' || loadedCounts === null || !Object.keys(defaultPlayCounts).every(key => key in loadedCounts)) {
                     throw new Error("Invalid or outdated counts data structure in localStorage");
                }
                 playCounts = loadedCounts; // Use loaded data
            } catch (error) {
                console.error("Error parsing playCounts from localStorage:", error);
                // Reset to default if data is corrupt or outdated
                playCounts = { ...defaultPlayCounts }; // Use spread for a fresh copy
                // Optionally clear bad data from localStorage
                // localStorage.removeItem(COUNTS_STORAGE_KEY);
            }
        } else {
            // Initialize if nothing is stored
            playCounts = { ...defaultPlayCounts }; // Use spread for a fresh copy
        }

        if (storedTotalPlays) {
            const parsedTotal = parseInt(storedTotalPlays, 10);
            totalPlays = !isNaN(parsedTotal) && parsedTotal >= 0 ? parsedTotal : 0;
        } else {
            totalPlays = 0;
        }

        // Ensure totalPlays matches the sum of counts if counts were loaded/reset
        // This helps recover from potential inconsistencies
        let sumOfCounts = 0;
        for(const key in playCounts) {
            if (typeof playCounts[key] === 'number' && playCounts[key] >= 0) {
                sumOfCounts += playCounts[key];
            } else {
                // If any count is invalid, reset all might be safer
                console.warn(`Invalid count found for ${key}. Resetting stats might be needed.`);
                playCounts[key] = 0; // Reset invalid count
            }
        }
        // Only force update totalPlays if it clearly doesn't match and isn't zero
        if (totalPlays !== sumOfCounts && sumOfCounts > 0) {
             console.warn(`Total plays (${totalPlays}) did not match sum of counts (${sumOfCounts}). Adjusting totalPlays.`);
             totalPlays = sumOfCounts;
        } else if (totalPlays < 0) { // Ensure totalPlays is never negative
            totalPlays = 0;
        }


    }

    // --- Save Persistent Stats Function ---
    function savePersistentStats() {
        try {
            localStorage.setItem(COUNTS_STORAGE_KEY, JSON.stringify(playCounts));
            localStorage.setItem(TOTAL_PLAYS_STORAGE_KEY, totalPlays.toString());
        } catch (error) {
            console.error("Error saving stats to localStorage:", error);
            statusMessage.textContent = "ข้อผิดพลาด: ไม่สามารถบันทึกสถิติได้ (พื้นที่อาจเต็ม)";
        }
    }

    // --- Core Gameplay Functions ---

    function updateCardButtonStates() {
        let availableEnergyForThisRound = opponentEnergy;
        if (currentRound === 3 || currentRound === 6 || currentRound === 9 || currentRound === 12 || currentRound === 15) {
            availableEnergyForThisRound += 1;
        }
        energyDisplay.textContent = availableEnergyForThisRound;
        cardButtons.forEach(button => {
            const cardCost = parseInt(button.dataset.cost) || 0;
            const isMagicBoost = button.dataset.card === 'Magic Boost';
            button.disabled = !isMagicBoost && availableEnergyForThisRound < cardCost;
        });
    }

    function updateMainDisplay() {
        roundDisplay.textContent = currentRound;
        energyDisplay.textContent = opponentEnergy;
    }

    function updateHistoryDisplay() {
        historyLog.innerHTML = ''; // Clear previous game history
        // Only display history for the current session
        gameHistory.forEach(entry => {
            const listItem = document.createElement('li');
            listItem.textContent = `รอบ ${entry.round}: คาดว่าเล่น '${entry.cardPlayed}' -> เหลือ ${entry.energyAfterRound} Energy`;
            historyLog.appendChild(listItem);
        });
        historyLog.scrollTop = historyLog.scrollHeight;
    }

    function updateProbabilityDisplay() {
        if (!probabilityDisplay) return;
        probabilityDisplay.innerHTML = '';

        if (totalPlays === 0) {
            probabilityDisplay.innerHTML = '<p>ยังไม่มีข้อมูลสถิติ</p>';
            return;
        }

        const probabilityList = document.createElement('ul');
        // Sort cards (optional, e.g., alphabetically or by probability)
         const sortedCardNames = Object.keys(playCounts).sort(); // Alphabetical sort

        // for (const cardName in playCounts) { // Original order
        for (const cardName of sortedCardNames) { // Sorted order
            const count = playCounts[cardName];
            // Ensure count is a valid number before calculation
            const validCount = (typeof count === 'number' && count >= 0) ? count : 0;
            const probability = (validCount / totalPlays) * 100;

            const listItem = document.createElement('li');
            listItem.textContent = `${cardName}: ${probability.toFixed(1)}% (${validCount} ครั้ง)`; // Show count too
            probabilityList.appendChild(listItem);
        }
        probabilityDisplay.appendChild(probabilityList);
    }

    function initializeGame() {
        // Resets only the current game state
        currentRound = 1;
        opponentEnergy = 2;
        selectedCardData = null;
        gameHistory = []; // Clear current game history

        // --- Persisted stats (playCounts, totalPlays) are NOT reset here ---

        updateMainDisplay();
        updateHistoryDisplay(); // Clears the visual history log
        updateCardButtonStates();
        updateProbabilityDisplay(); // Update display with existing persistent stats

        cardButtons.forEach(btn => btn.classList.remove('selected'));
        nextRoundButton.disabled = true;
        statusMessage.textContent = `เริ่มเกมใหม่! เลือกการ์ดที่ศัตรูเล่นในรอบที่ 1`;
    }

    // --- Event Listeners ---

    cardSelector.addEventListener('click', (event) => {
        const clickedElement = event.target.closest('button'); // Find the closest button parent

        if (clickedElement && !clickedElement.disabled) {
            cardButtons.forEach(btn => btn.classList.remove('selected'));
            clickedElement.classList.add('selected');

            selectedCardData = {
                name: clickedElement.dataset.card,
                cost: parseInt(clickedElement.dataset.cost) || 0,
                gain: parseInt(clickedElement.dataset.gain) || 0
            };

            statusMessage.textContent = `การ์ด '${selectedCardData.name}' ถูกเลือกสำหรับรอบ ${currentRound}. กด 'ยืนยัน' เพื่อไปต่อ`;
            nextRoundButton.disabled = false;
        } else if (clickedElement && clickedElement.disabled) {
            statusMessage.textContent = `Energy ไม่พอที่จะเล่น '${clickedElement.dataset.card}' (ต้องการ ${clickedElement.dataset.cost})`;
        }
    });

    nextRoundButton.addEventListener('click', () => {
        if (!selectedCardData) {
            statusMessage.textContent = "ข้อผิดพลาด: กรุณาเลือกการ์ดก่อน!";
            return;
        }

        // --- Calculate Energy ---
        let energyBeforeThisRoundEffect = opponentEnergy;
        if (currentRound === 3 || currentRound === 6 || currentRound === 9 || currentRound === 12 || currentRound === 15) {
            energyBeforeThisRoundEffect += 1;
        }
        let energyAfterEffect;
        if (selectedCardData.name === 'Magic Boost') {
            energyAfterEffect = energyBeforeThisRoundEffect + selectedCardData.gain;
        } else {
            if (energyBeforeThisRoundEffect < selectedCardData.cost) {
                 console.error("Logic Error: Insufficient energy.");
                 statusMessage.textContent = "เกิดข้อผิดพลาด: พลังงานไม่พอ!";
                 return;
            }
            energyAfterEffect = energyBeforeThisRoundEffect - selectedCardData.cost;
        }
        if (energyAfterEffect < 0) { energyAfterEffect = 0; }

        // --- Record History (Current Game) ---
        const historyEntry = {
            round: currentRound,
            cardPlayed: selectedCardData.name,
            energyAfterRound: energyAfterEffect
        };
        gameHistory.push(historyEntry);

        // --- Update Persistent Stats ---
        if (playCounts[selectedCardData.name] !== undefined) {
             playCounts[selectedCardData.name]++;
        } else {
            // Should not happen if initialized correctly, but as a fallback
            console.warn(`Card name ${selectedCardData.name} not found in playCounts. Initializing.`);
            playCounts[selectedCardData.name] = 1;
        }
        totalPlays++;

        // --- Save Stats ---
        savePersistentStats();

        // --- Update State for Next Round ---
        opponentEnergy = energyAfterEffect;
        currentRound += 1;

        // --- Reset UI for Next Round ---
        selectedCardData = null;
        cardButtons.forEach(btn => btn.classList.remove('selected'));
        nextRoundButton.disabled = true;

        // --- Update Displays ---
        updateMainDisplay();
        updateHistoryDisplay(); // Update current game history
        updateCardButtonStates();
        updateProbabilityDisplay(); // Update persistent stats display
        statusMessage.textContent = `เลือกการ์ดที่ศัตรูเล่นในรอบที่ ${currentRound}`;
    });

    resetButton.addEventListener('click', initializeGame); // Resets current game, keeps stats

    
    // --- Optional: Clear Stats Button Listener ---
    if (clearStatsButton) {
        clearStatsButton.addEventListener('click', () => {
            if (confirm("คุณต้องการล้างสถิติการเล่นที่บันทึกไว้ทั้งหมดหรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้")) {
                playCounts = { ...defaultPlayCounts }; // Reset to defaults
                totalPlays = 0;
                savePersistentStats(); // Save the cleared stats
                updateProbabilityDisplay(); // Update display to show empty stats
                statusMessage.textContent = "ล้างสถิติทั้งหมดเรียบร้อยแล้ว";
            }
        });
    }
    

    // --- Initial Game Setup ---
    loadPersistentStats(); // Load saved stats first
    initializeGame();    // Then initialize the game interface

}); // End of DOMContentLoaded