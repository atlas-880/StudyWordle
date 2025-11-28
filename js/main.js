/**
 * Main Entry Point
 */
import { initGame, handleInput, startNewRound, saveSettings, useHint } from './game.js';
import * as UI from './ui.js';
import * as Storage from './storage.js';
import { state, setState } from './state.js';
import { PREDEFINED_PACKS } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Game
    initGame();

    // Global Event Listeners
    document.addEventListener('keydown', (e) => {
        if (state.gameStatus !== 'playing') return;

        if (e.key === 'Enter') {
            handleInput('ENTER');
        } else if (e.key === 'Backspace') {
            handleInput('BACKSPACE');
        } else if (/^[a-zA-ZñÑ]$/.test(e.key)) {
            handleInput(e.key.toUpperCase());
        }
    });

    // Button Listeners
    const helpBtn = document.getElementById('help-btn');
    const infoDropdown = document.getElementById('info-dropdown');

    helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        infoDropdown.classList.toggle('hidden');
        infoDropdown.classList.toggle('flex');
    });

    document.addEventListener('click', (e) => {
        if (!infoDropdown.classList.contains('hidden') && !infoDropdown.contains(e.target) && e.target !== helpBtn) {
            infoDropdown.classList.add('hidden');
            infoDropdown.classList.remove('flex');
        }
    });

    document.getElementById('settings-btn').addEventListener('click', () => {
        UI.toggleSettings(true, Storage.loadRawData());
    });

    document.getElementById('close-settings').addEventListener('click', () => {
        UI.toggleSettings(false);
    });

    document.getElementById('save-settings').addEventListener('click', saveSettings);

    document.getElementById('next-word-btn').addEventListener('click', startNewRound);

    document.getElementById('hint-btn').addEventListener('click', useHint);

    document.getElementById('stats-btn').addEventListener('click', () => {
        UI.showToast(`Racha: ${state.stats.streak} | Jugadas: ${state.stats.played}`, 3000);
    });

    // --- New Feature Listeners ---

    // Study Packs
    document.getElementById('pack-tech-drawing').addEventListener('click', () => {
        UI.setSettingsInput(JSON.stringify(PREDEFINED_PACKS.technical_drawing, null, 2));
        UI.showToast("Pack Dibujo Técnico cargado (Guarda para aplicar)");
    });

    document.getElementById('pack-chemistry').addEventListener('click', () => {
        UI.setSettingsInput(JSON.stringify(PREDEFINED_PACKS.chemistry, null, 2));
        UI.showToast("Pack Química cargado (Guarda para aplicar)");
    });

    // Share Result
    document.getElementById('share-btn').addEventListener('click', () => {
        const grid = UI.generateEmojiGrid(state.guesses, state.results);
        const shareText = `StudyWordle 🧪 ${state.currentRow}/${state.maxAttempts}\n\n${grid}`;
        UI.copyToClipboard(shareText);
    });
});
