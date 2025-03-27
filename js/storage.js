// js/storage.js
import * as config from './config.js';

export function loadPersistentStats() {
    const storedGlobalCounts = localStorage.getItem(config.GLOBAL_COUNTS_KEY);
    const storedGlobalTotal = localStorage.getItem(config.GLOBAL_TOTAL_KEY);
    const storedConditionalCounts = localStorage.getItem(config.CONDITIONAL_COUNTS_KEY);
    const storedEnergyOccurrences = localStorage.getItem(config.ENERGY_OCCURRENCES_KEY);

    let loadedStats = {
        globalPlayCounts: { ...config.defaultGlobalPlayCounts },
        globalTotalPlays: 0,
        conditionalPlayCounts: { ...config.defaultConditionalCounts },
        energyOccurrences: { ...config.defaultEnergyOccurrences }
    };

    try {
        if (storedGlobalCounts) {
            const parsed = JSON.parse(storedGlobalCounts);
            if (typeof parsed === 'object' && parsed !== null && Object.keys(config.defaultGlobalPlayCounts).every(key => key in parsed)) {
                loadedStats.globalPlayCounts = parsed;
            } else throw new Error("Invalid global counts");
        }
    } catch (e) { console.error("Error loading global counts:", e); }

    if (storedGlobalTotal) {
        const parsed = parseInt(storedGlobalTotal, 10);
        loadedStats.globalTotalPlays = !isNaN(parsed) && parsed >= 0 ? parsed : 0;
    }
     // Validate global counts vs total
     let sumGlobalCounts = Object.values(loadedStats.globalPlayCounts).reduce((sum, count) => sum + (Number.isInteger(count) ? count : 0), 0);
     if (loadedStats.globalTotalPlays !== sumGlobalCounts && sumGlobalCounts > 0) {
         console.warn(`Adjusting loaded global total plays from ${loadedStats.globalTotalPlays} to ${sumGlobalCounts}`);
         loadedStats.globalTotalPlays = sumGlobalCounts;
     } else if (loadedStats.globalTotalPlays < 0) { loadedStats.globalTotalPlays = 0; }


    try {
        if (storedConditionalCounts) {
            const parsed = JSON.parse(storedConditionalCounts);
            if (typeof parsed === 'object' && parsed !== null) {
                loadedStats.conditionalPlayCounts = parsed;
            } else throw new Error("Invalid conditional counts");
        }
    } catch (e) { console.error("Error loading conditional counts:", e); }

    try {
        if (storedEnergyOccurrences) {
            const parsed = JSON.parse(storedEnergyOccurrences);
            if (typeof parsed === 'object' && parsed !== null) {
                loadedStats.energyOccurrences = parsed;
            } else throw new Error("Invalid energy occurrences");
        }
    } catch (e) { console.error("Error loading energy occurrences:", e); }

    return loadedStats; // Return the loaded data object
}

export function savePersistentStats(stats) {
    try {
        localStorage.setItem(config.GLOBAL_COUNTS_KEY, JSON.stringify(stats.globalPlayCounts));
        localStorage.setItem(config.GLOBAL_TOTAL_KEY, stats.globalTotalPlays.toString());
        localStorage.setItem(config.CONDITIONAL_COUNTS_KEY, JSON.stringify(stats.conditionalPlayCounts));
        localStorage.setItem(config.ENERGY_OCCURRENCES_KEY, JSON.stringify(stats.energyOccurrences));
        return true; // Indicate success
    } catch (error) {
        console.error("Error saving stats to localStorage:", error);
        // Consider notifying the user via the UI module if save fails
        return false; // Indicate failure
    }
}