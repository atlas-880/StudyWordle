/**
 * Game Logic
 */
import { state, setState, updateStats } from './state.js';
import * as UI from './ui.js';
import * as Storage from './storage.js';
import { getGameData, parseInputData } from './data.js';

const MAX_ATTEMPTS = 6;

export function initGame() {
    try {
        const savedStats = Storage.loadStats();
        if (savedStats) {
            setState({ stats: savedStats });
        }

        let savedData = Storage.loadData();
        // Validate data
        if (savedData && Array.isArray(savedData) && savedData.length > 0) {
            const isValid = savedData.every(item => item && item.word && item.def);
            if (!isValid) {
                console.warn("Saved data is invalid, reverting to default.");
                savedData = null;
            }
        } else {
            savedData = null;
        }

        if (savedData) {
            setState({ data: savedData });
        } else {
            setState({ data: getGameData() });
        }

        startNewRound();
    } catch (error) {
        console.error("Error initializing game:", error);
        UI.showToast("Error al iniciar. Restableciendo datos...");
        Storage.clearData();
        setState({ data: getGameData() });
        startNewRound();
    }
}

export function startNewRound() {
    const data = state.data.length > 0 ? state.data : getGameData();

    // Adaptive Selection
    const wordWeights = data.map(item => {
        const stats = state.stats.wordStats?.[item.word] || { success: 0, fail: 0 };
        // Higher weight if more fails. Base weight 1.
        // Formula: 1 + (fails * 3) - (success * 0.5). Min 1.
        let weight = 1 + (stats.fail * 3) - (stats.success * 0.5);
        return Math.max(1, weight);
    });

    const totalWeight = wordWeights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let selectedIndex = 0;

    for (let i = 0; i < data.length; i++) {
        random -= wordWeights[i];
        if (random <= 0) {
            selectedIndex = i;
            break;
        }
    }

    const item = data[selectedIndex];

    setState({
        currentWord: normalizeWord(item.word),
        currentDef: item.def,
        guesses: [],
        currentGuess: "",
        gameStatus: "playing",
        hintsUsed: 0
    });

    UI.hideGameOver();
    UI.updateDefinition(state.currentDef, item.image, item.audio);
    UI.initBoard(state.currentWord.length, MAX_ATTEMPTS);
    UI.initKeyboard(handleInput);
}

export function useHint() {
    if (state.gameStatus !== 'playing') return;

    // Find unrevealed indices
    const targetArr = state.currentWord.split('');
    const revealedIndices = new Set();

    state.guesses.forEach(guess => {
        guess.split('').forEach((char, i) => {
            if (char === targetArr[i]) revealedIndices.add(i);
        });
    });

    const unrevealed = targetArr.map((_, i) => i).filter(i => !revealedIndices.has(i));

    if (unrevealed.length === 0) {
        UI.showToast("¡Ya tienes todas las letras!");
        return;
    }

    const randomIndex = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    const letter = targetArr[randomIndex];

    setState({ hintsUsed: state.hintsUsed + 1 });
    UI.showToast(`Pista: La letra en la posición ${randomIndex + 1} es ${letter}`);

    // Visual hint on the current row (if empty) or just toast?
    // Let's fill it in the current guess if the slot is empty?
    // Or better: Just show a toast for now to keep it simple and not mess with input state logic too much.
    // Actually, users prefer visual. Let's highlight the key on keyboard.
    UI.highlightKey(letter);
}

function normalizeWord(word) {
    return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-ZÑ]/g, "");
}

export function handleInput(key) {
    if (state.gameStatus !== 'playing') return;

    if (key === 'ENTER') {
        submitGuess();
    } else if (key === 'BACKSPACE') {
        if (state.currentGuess.length > 0) {
            const newGuess = state.currentGuess.slice(0, -1);
            setState({ currentGuess: newGuess });
            // Update UI for the removed letter (clearing the tile)
            UI.updateTile(state.guesses.length, newGuess.length, '', false);
        }
    } else {
        if (state.currentGuess.length < state.currentWord.length) {
            const newGuess = state.currentGuess + key;
            setState({ currentGuess: newGuess });
            UI.updateTile(state.guesses.length, newGuess.length - 1, key, true);
        }
    }
}

function submitGuess() {
    if (state.currentGuess.length !== state.currentWord.length) {
        UI.showToast("La palabra es demasiado corta");
        UI.shakeRow(state.guesses.length, state.currentWord.length);
        return;
    }

    const guess = state.currentGuess;
    const newGuesses = [...state.guesses, guess];
    setState({ guesses: newGuesses, currentGuess: "" });

    const results = checkGuess(guess, state.currentWord);
    UI.revealRow(newGuesses.length - 1, guess, results);

    setTimeout(() => {
        if (guess === state.currentWord) {
            setState({ gameStatus: 'won' });
            updateStats(true, newGuesses.length, state.currentWord);
            checkAchievements();
            Storage.saveStats(state.stats);
            const currentItem = state.data.find(item => normalizeWord(item.word) === state.currentWord);
            UI.showGameOver(true, state.currentWord, state.stats.streak, state.stats.played, state.stats.distribution, currentItem?.related);
            UI.triggerConfetti();
        } else if (newGuesses.length >= MAX_ATTEMPTS) {
            setState({ gameStatus: 'lost' });
            updateStats(false, newGuesses.length, state.currentWord);
            Storage.saveStats(state.stats);
            const currentItem = state.data.find(item => normalizeWord(item.word) === state.currentWord);
            UI.showGameOver(false, state.currentWord, state.stats.streak, state.stats.played, state.stats.distribution, currentItem?.related);
        }
    }, guess.length * 200 + 500);
}

function checkGuess(guess, target) {
    const guessArr = guess.split('');
    const targetArr = target.split('');
    const results = new Array(guess.length).fill('absent');
    const letterCounts = {};

    targetArr.forEach(l => letterCounts[l] = (letterCounts[l] || 0) + 1);

    // Greens
    guessArr.forEach((letter, i) => {
        if (letter === targetArr[i]) {
            results[i] = 'correct';
            letterCounts[letter]--;
        }
    });

    // Yellows
    guessArr.forEach((letter, i) => {
        if (results[i] !== 'correct' && letterCounts[letter] > 0) {
            results[i] = 'present';
            letterCounts[letter]--;
        }
    });

    return results;
}

function checkAchievements() {
    const stats = state.stats;
    const newAchievements = [];
    const current = new Set(stats.achievements || []);

    if (stats.played >= 1 && stats.streak >= 1 && !current.has('first_win')) {
        newAchievements.push({ id: 'first_win', title: '¡Primera Victoria!', icon: '🏆' });
    }
    if (stats.streak >= 3 && !current.has('streak_3')) {
        newAchievements.push({ id: 'streak_3', title: 'Racha de 3', icon: '🔥' });
    }
    if (stats.streak >= 7 && !current.has('streak_7')) {
        newAchievements.push({ id: 'streak_7', title: 'Imparable (7)', icon: '🚀' });
    }
    if (stats.played >= 10 && !current.has('played_10')) {
        newAchievements.push({ id: 'played_10', title: 'Estudiante Dedicado', icon: '📚' });
    }

    if (newAchievements.length > 0) {
        const updatedAchievements = [...(stats.achievements || []), ...newAchievements.map(a => a.id)];
        state.stats.achievements = updatedAchievements;

        newAchievements.forEach((ach, index) => {
            setTimeout(() => {
                UI.showToast(`${ach.icon} Logro desbloqueado: ${ach.title}`, 4000);
                UI.triggerConfetti();
            }, index * 2000 + 1000);
        });
    }
}

export function saveSettings() {
    const rawInput = UI.getSettingsInput();
    if (!rawInput) {
        Storage.clearData();
        setState({ data: getGameData() });
        UI.showToast("Datos restablecidos");
    } else {
        try {
            const parsed = parseInputData(rawInput);
            setState({ data: parsed });
            Storage.saveData(parsed);
            Storage.saveRawData(rawInput);
            UI.showToast("Datos guardados");
        } catch (e) {
            UI.showToast("Error en el formato");
            return;
        }
    }
    UI.toggleSettings(false);
    startNewRound();
}
