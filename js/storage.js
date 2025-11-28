/**
 * Storage Management
 */
const STATS_KEY = 'studywordle_stats';
const DATA_KEY = 'studywordle_data';
const RAW_DATA_KEY = 'studywordle_raw_data';

export function saveStats(stats) {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function loadStats() {
    const saved = localStorage.getItem(STATS_KEY);
    return saved ? JSON.parse(saved) : null;
}

export function saveData(data) {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

export function loadData() {
    const saved = localStorage.getItem(DATA_KEY);
    return saved ? JSON.parse(saved) : null;
}

export function saveRawData(rawData) {
    localStorage.setItem(RAW_DATA_KEY, rawData);
}

export function loadRawData() {
    return localStorage.getItem(RAW_DATA_KEY) || '';
}

export function clearData() {
    localStorage.removeItem(DATA_KEY);
    localStorage.removeItem(RAW_DATA_KEY);
}
