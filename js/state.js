
/**
 * State Management
 */
export const state = {
    data: [],
    currentIndex: 0,
    currentWord: "",
    currentDef: "",
    guesses: [],
    currentGuess: "",
    gameStatus: "playing", // playing, won, lost
    stats: {
        played: 0,
        streak: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
        lastPlayed: null,
        wordStats: {}, // { "WORD": { success: 0, fail: 0 } }
        achievements: [] // ['first_win', 'streak_3']
    },
    hintsUsed: 0
};

const listeners = [];

export function subscribe(listener) {
    listeners.push(listener);
}

export function notify() {
    listeners.forEach(listener => listener(state));
}

export function setState(newState) {
    Object.assign(state, newState);
    notify();
}

export function updateStats(won, attemptCount, word) {
    state.stats.played++;
    state.stats.lastPlayed = Date.now();

    // Update Word Stats
    if (!state.stats.wordStats) state.stats.wordStats = {};
    if (!state.stats.wordStats[word]) state.stats.wordStats[word] = { success: 0, fail: 0 };

    if (won) {
        state.stats.streak++;
        state.stats.wordStats[word].success++;
        if (attemptCount >= 1 && attemptCount <= 6) {
            state.stats.distribution[attemptCount] = (state.stats.distribution[attemptCount] || 0) + 1;
        }
    } else {
        state.stats.streak = 0;
        state.stats.wordStats[word].fail++;
    }
    notify();
}
