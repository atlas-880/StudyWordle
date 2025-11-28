/**
 * Data Management
 */
import { loadData as loadStoredData } from './storage.js';

export const DEFAULT_DATA = [
    { word: "HIDROGENO", def: "Elemento químico más ligero, número atómico 1.", related: ["HELIO", "OXIGENO"], image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Electron_shell_001_Hydrogen_-_no_label.svg/200px-Electron_shell_001_Hydrogen_-_no_label.svg.png" },
    { word: "HELIO", def: "Gas noble, segundo elemento más ligero.", related: ["HIDROGENO", "NEON"] },
    { word: "LITIO", def: "Metal alcalino, número atómico 3, usado en baterías.", related: ["SODIO", "POTASIO"] },
    { word: "CARBONO", def: "Elemento base de la química orgánica y la vida.", related: ["OXIGENO", "HIDROGENO"] },
    { word: "OXIGENO", def: "Esencial para la respiración, número atómico 8.", related: ["CARBONO", "HIDROGENO"] },
    { word: "HIERRO", def: "Metal de transición, fundamental para la hemoglobina.", related: ["OXIGENO", "SANGRE"] },
    { word: "MITOCONDRIA", def: "Orgánulo celular encargado de la respiración celular." },
    { word: "GRAVEDAD", def: "Fuerza que atrae los objetos hacia el centro de la Tierra." },
    { word: "ORO", def: "Metal precioso, símbolo Au.", related: ["PLATA", "COBRE"] },
    { word: "URANIO", def: "Elemento radiactivo usado en energía nuclear.", related: ["PLUTONIO", "ENERGIA"] },
    { word: "NEON", def: "Gas noble usado en letreros luminosos.", related: ["HELIO", "ARGON"] },
    { word: "SODIO", def: "Metal alcalino, componente de la sal común.", related: ["CLORO", "LITIO"] }
];

export const PREDEFINED_PACKS = {
    technical_drawing: [
        { word: "ORTOGONAL", def: "Proyección donde los rayos son perpendiculares al plano." },
        { word: "PLANTA", def: "Vista superior de un objeto.", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/First_angle_projection.svg/1200px-First_angle_projection.svg.png" },
        { word: "ALZADO", def: "Vista frontal o principal de un objeto." },
        { word: "TANGENTE", def: "Recta que toca una curva en un solo punto sin cortarla." },
        { word: "COTA", def: "Cifra que indica una dimensión en un plano." },
        { word: "DIEDRICO", def: "Sistema de representación que utiliza dos planos de proyección." }
    ],
    chemistry: [
        { word: "ATOMO", def: "Unidad básica de la materia." },
        { word: "ENLACE", def: "Fuerza que mantiene unidos a los átomos." },
        { word: "PROTON", def: "Partícula subatómica con carga positiva." },
        { word: "MOL", def: "Unidad de cantidad de sustancia." },
        { word: "PH", def: "Medida de acidez o alcalinidad de una disolución." }
    ]
};

export function getGameData() {
    const stored = loadStoredData();
    if (stored && Array.isArray(stored) && stored.length > 0) {
        return stored;
    }
    return DEFAULT_DATA;
}

export function parseInputData(rawInput) {
    if (!rawInput.trim()) return null;

    const parsedData = parseData(rawInput);

    if (parsedData && Array.isArray(parsedData) && parsedData.length > 0) {
        // Basic validation for parsed data structure
        if (parsedData[0].word && parsedData[0].def) {
            return parsedData;
        }
    }
    throw new Error("Formato inválido");
}

export function parseData(input) {
    try {
        // Try JSON first
        if (input.trim().startsWith('[')) {
            return JSON.parse(input);
        }

        // Try CSV
        return parseCSV(input);
    } catch (e) {
        console.error("Error parsing data:", e);
        return null;
    }
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const result = [];

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // Simple CSV parse: WORD,Definition,ImageURL(optional)
        // Handle quotes if necessary, but for now simple split by comma
        // A more robust regex or library could be used for complex CSVs
        const parts = line.split(',');
        if (parts.length >= 2) {
            const word = parts[0].trim().toUpperCase();
            const def = parts[1].trim();
            const img = parts[2] ? parts[2].trim() : null;

            if (word && def) {
                const entry = { word, def };
                if (img) entry.img = img;
                result.push(entry);
            }
        }
    }

    return result.length > 0 ? result : null;
}
