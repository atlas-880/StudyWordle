/**
 * UI Management
 */
const boardEl = document.getElementById('game-board');
const keyboardEl = document.getElementById('keyboard');
const definitionEl = document.getElementById('definition-display');
const toastContainer = document.getElementById('toast-container');
const settingsModal = document.getElementById('settings-modal');
const gameOverModal = document.getElementById('game-over-modal');
const dataInput = document.getElementById('data-input');

// --- Board & Keyboard ---

export function initBoard(wordLength, maxAttempts) {
    boardEl.innerHTML = '';

    // Calculate optimal tile size based on viewport
    const tileSize = Math.min(
        Math.floor((window.innerWidth - 32) / wordLength) - 6,
        Math.floor((window.innerHeight * 0.5) / maxAttempts) - 6,
        70 // Max tile size in pixels
    );

    // Set grid to use fixed pixel dimensions
    boardEl.style.gridTemplateColumns = `repeat(${wordLength}, ${tileSize}px)`;
    boardEl.style.gridTemplateRows = `repeat(${maxAttempts}, ${tileSize}px)`;
    boardEl.style.gap = '6px';

    // Center the board and constrain its size
    boardEl.className = 'grid mx-auto';
    boardEl.style.width = `${wordLength * tileSize + (wordLength - 1) * 6}px`;
    boardEl.style.height = `${maxAttempts * tileSize + (maxAttempts - 1) * 6}px`;

    for (let i = 0; i < maxAttempts; i++) {
        for (let j = 0; j < wordLength; j++) {
            const tile = document.createElement('div');
            // Fixed size tiles with responsive font size
            const fontSize = Math.max(Math.floor(tileSize * 0.5), 16);
            tile.className = 'border-2 border-slate-700/50 bg-slate-800/30 flex items-center justify-center font-bold text-white rounded-lg transition-all duration-300';
            tile.style.width = `${tileSize}px`;
            tile.style.height = `${tileSize}px`;
            tile.style.fontSize = `${fontSize}px`;
            tile.id = `tile-${i}-${j}`;
            boardEl.appendChild(tile);
        }
    }
}

export function initKeyboard(onKeyClick) {
    keyboardEl.innerHTML = '';
    const rows = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
        ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
    ];

    rows.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'flex justify-center gap-1.5 w-full';

        row.forEach(key => {
            const btn = document.createElement('button');
            btn.textContent = key === 'BACKSPACE' ? '⌫' : key;
            btn.dataset.key = key;

            let widthClass = 'flex-1';
            let textClass = 'text-sm md:text-base';

            if (key === 'ENTER' || key === 'BACKSPACE') {
                widthClass = 'flex-[1.5] text-xs md:text-sm';
            }

            btn.className = `${widthClass} h-12 md:h-14 rounded-lg bg-slate-700/50 hover:bg-slate-600/80 active:bg-slate-600 text-white font-bold transition-all shadow-sm flex items-center justify-center select-none touch-manipulation`;
            btn.id = `key-${key}`;

            btn.addEventListener('click', () => onKeyClick(key));

            rowDiv.appendChild(btn);
        });

        keyboardEl.appendChild(rowDiv);
    });
}

export function updateDefinition(text, image, audio) {
    definitionEl.innerHTML = '';

    const textNode = document.createElement('div');
    textNode.textContent = text;
    definitionEl.appendChild(textNode);

    // Image hint restored
    if (image) {
        const img = document.createElement('img');
        img.src = image;
        img.className = 'mt-4 max-h-40 mx-auto rounded-lg border border-slate-600 shadow-md object-contain';
        img.alt = 'Pista visual';
        definitionEl.appendChild(img);
    }

    if (audio) {
        const audioEl = document.createElement('audio');
        audioEl.controls = true;
        audioEl.src = audio;
        audioEl.className = 'mt-4 mx-auto w-full max-w-xs h-8';
        definitionEl.appendChild(audioEl);
    }
}

export function updateTile(row, col, letter, active) {
    const tile = document.getElementById(`tile-${row}-${col}`);
    if (!tile) return;

    tile.textContent = letter;
    if (active) {
        tile.classList.add('border-slate-400');
        tile.classList.remove('border-slate-700');

        // Pop animation
        tile.classList.remove('tile-pop');
        void tile.offsetWidth; // Trigger reflow
        tile.classList.add('tile-pop');
    } else {
        tile.classList.remove('border-slate-400');
        tile.classList.add('border-slate-700');
    }
}

export function shakeRow(row, length) {
    for (let i = 0; i < length; i++) {
        const tile = document.getElementById(`tile-${row}-${i}`);
        if (tile) {
            tile.classList.remove('row-shake');
            void tile.offsetWidth;
            tile.classList.add('row-shake');
        }
    }
}

export function revealRow(row, guess, results) {
    guess.split('').forEach((letter, i) => {
        const tile = document.getElementById(`tile-${row}-${i}`);
        if (!tile) return;

        setTimeout(() => {
            tile.classList.add('tile-flip-in');

            setTimeout(() => {
                tile.classList.remove('tile-flip-in');
                tile.classList.add('tile-flip-out');

                tile.classList.remove('border-slate-400', 'bg-transparent');
                tile.classList.add('border-transparent', 'text-white');

                if (results[i] === 'correct') tile.classList.add('bg-correct');
                else if (results[i] === 'present') tile.classList.add('bg-present');
                else tile.classList.add('bg-absent');

                updateKeyboardKey(letter, results[i]);

            }, 250);
        }, i * 200);
    });
}

function updateKeyboardKey(letter, status) {
    const btn = document.getElementById(`key-${letter}`);
    if (!btn) return;

    if (status === 'correct') {
        btn.classList.remove('bg-slate-600', 'bg-present', 'bg-absent');
        btn.classList.add('bg-correct');
    } else if (status === 'present' && !btn.classList.contains('bg-correct')) {
        btn.classList.remove('bg-slate-600', 'bg-absent');
        btn.classList.add('bg-present');
    } else if (status === 'absent' && !btn.classList.contains('bg-correct') && !btn.classList.contains('bg-present')) {
        btn.classList.remove('bg-slate-600');
        btn.classList.add('bg-absent');
    }
}

export function highlightKey(letter) {
    const btn = document.getElementById(`key-${letter}`);
    if (!btn) return;

    // Flash effect
    const originalClass = btn.className;
    btn.classList.add('ring-2', 'ring-yellow-400', 'ring-offset-2', 'ring-offset-slate-800');

    setTimeout(() => {
        btn.classList.remove('ring-2', 'ring-yellow-400', 'ring-offset-2', 'ring-offset-slate-800');
    }, 1000);
}

// --- Modals & Toasts ---

export function showToast(message, duration = 2000) {
    const toast = document.createElement('div');
    toast.className = 'bg-white text-black px-4 py-2 rounded font-bold shadow-lg transition-opacity duration-300 opacity-0';
    toast.textContent = message;
    toastContainer.appendChild(toast);
    void toast.offsetWidth;
    toast.classList.remove('opacity-0');
    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

export function toggleSettings(show, rawData = '') {
    if (show) {
        dataInput.value = rawData;
        settingsModal.classList.remove('hidden');
        settingsModal.classList.add('flex');
    } else {
        settingsModal.classList.add('hidden');
        settingsModal.classList.remove('flex');
    }
}

export function showGameOver(won, word, streak, played, distribution, related) {
    const title = document.getElementById('modal-title');
    const correctWordEl = document.getElementById('correct-word');
    const streakEl = document.getElementById('streak-display');
    const playedEl = document.getElementById('total-played-display');

    title.textContent = won ? "¡Excelente!" : "¡Inténtalo de nuevo!";
    correctWordEl.textContent = word;
    streakEl.textContent = streak;
    playedEl.textContent = played;

    // Distribution Graph
    const graphContainer = document.createElement('div');
    graphContainer.className = 'mb-6 text-left text-sm';

    if (distribution) {
        const maxVal = Math.max(...Object.values(distribution), 1);

        Object.keys(distribution).forEach(attempt => {
            const count = distribution[attempt];
            const percent = (count / maxVal) * 100;

            const row = document.createElement('div');
            row.className = 'flex items-center gap-2 mb-1';
            row.innerHTML = `
                <div class="w-3 text-slate-400">${attempt}</div>
                <div class="flex-grow bg-slate-700 rounded-sm h-5 overflow-hidden relative">
                    <div class="bg-emerald-500 h-full transition-all duration-500" style="width: ${percent}%"></div>
                    <div class="absolute inset-0 flex items-center justify-end px-2 font-bold text-xs">${count > 0 ? count : ''}</div>
                </div>
            `;
            graphContainer.appendChild(row);
        });
    }

    // Insert graph before buttons
    const modalContent = document.querySelector('#game-over-modal > div');
    const buttonsContainer = modalContent.querySelector('.flex.flex-col.gap-3');

    // Remove existing graph if any
    const existingGraph = modalContent.querySelector('.graph-container');
    if (existingGraph) existingGraph.remove();

    if (distribution) {
        graphContainer.classList.add('graph-container');
        modalContent.insertBefore(graphContainer, buttonsContainer);
    }

    gameOverModal.classList.remove('hidden');
    gameOverModal.classList.add('flex');
}

export function triggerConfetti() {
    if (window.confetti) {
        window.confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}

export function hideGameOver() {
    gameOverModal.classList.add('hidden');
    gameOverModal.classList.remove('flex');
}

export function getSettingsInput() {
    return dataInput.value;
}

export function setSettingsInput(value) {
    dataInput.value = value;
}

export function generateEmojiGrid(guesses, results) {
    let grid = "";
    results.forEach(row => {
        row.forEach(status => {
            if (status === 'correct') grid += "🟩";
            else if (status === 'present') grid += "🟨";
            else grid += "⬛";
        });
        grid += "\n";
    });
    return grid;
}

export async function shareResult(text) {
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'StudyWordle Result',
                text: text
            });
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error sharing:', err);
                fallbackCopyToClipboard(text);
            }
        }
    } else {
        fallbackCopyToClipboard(text);
    }
}

async function fallbackCopyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast("¡Copiado al portapapeles!");
    } catch (err) {
        console.error('Error al copiar:', err);
        showToast("Error al copiar");
    }
}
