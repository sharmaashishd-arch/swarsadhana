/**
 * Music Constants — shared tables and helpers for all web audio modules.
 *
 * Single source of truth for swar ratios, semitone mappings,
 * MIDI helpers, and note articulation parameters.
 */

const SWAR_RATIOS = Object.freeze({
    'Sa': 1, 'Sa.': 0.5, '.Sa': 2,
    're': 256/243, 'Re': 9/8,
    'ga': 32/27,  'Ga': 5/4,
    'Ma': 4/3,    'ma': 45/32,
    'Pa': 3/2,
    'dha': 128/81, 'Dha': 5/3,
    'ni': 16/9,    'Ni': 15/8,
    '.Re': 9/4, '.Ga': 5/2, '.Ma': 8/3,
    '.Pa': 3, '.Dha': 10/3, '.Ni': 15/4,
});

const SWAR_SEMITONES = Object.freeze({
    'Sa.': -12, 'Sa': 0, 're': 1, 'Re': 2, 'ga': 3, 'Ga': 4,
    'Ma': 5, 'ma': 6, 'Pa': 7, 'dha': 8, 'Dha': 9, 'ni': 10,
    'Ni': 11, '.Sa': 12, '.Re': 14, '.Ga': 16, '.Ma': 17,
    '.Pa': 19, '.Dha': 21, '.Ni': 23,
});

const SWAR_LIST = Object.freeze([
    'Sa', 're', 'Re', 'ga', 'Ga', 'Ma', 'ma', 'Pa', 'dha', 'Dha', 'ni', 'Ni',
]);

const NOTE_ARTICULATION = Object.freeze({
    MIN_GAP_SEC: 0.03,
    NOTE_FRACTION: 0.9,
    ATTACK_SEC: 0.02,
    RELEASE_SEC: 0.05,
    CANCEL_TIME_CONSTANT: 0.005,
    GAIN_SMOOTH_SEC: 0.05,
});

function freqToMidi(freq) {
    return Math.round(69 + 12 * Math.log2(freq / 440));
}

function computeNoteDuration(slotDuration) {
    return Math.min(
        slotDuration * NOTE_ARTICULATION.NOTE_FRACTION,
        slotDuration - NOTE_ARTICULATION.MIN_GAP_SEC,
    );
}

/**
 * Cancel an actively playing WebAudioFont envelope or fallback oscillator.
 * Used by both RealisticSwarSynth and SampleSwarSynth.
 */
function cancelActiveNote(envelope, osc, fadeTime) {
    if (envelope && envelope.cancel) {
        try {
            envelope.gain.cancelScheduledValues(0);
            envelope.gain.setTargetAtTime(0.00001, fadeTime, NOTE_ARTICULATION.CANCEL_TIME_CONSTANT);
            envelope.when = fadeTime + 0.01;
        } catch (_) {}
    }
    if (osc) {
        try {
            osc.gain.cancelScheduledValues(0);
            osc.gain.setTargetAtTime(0, fadeTime, NOTE_ARTICULATION.CANCEL_TIME_CONSTANT);
        } catch (_) {}
    }
}

/**
 * Returns the display label for a swara based on the current notation setting.
 *
 * In Hindi mode  → swarInfo.hindi (Devanagari script, e.g. "सा", "रे॒")
 * In English mode → swarCode itself, which already IS the English label
 *                   (e.g. "Sa", "re", "Re", "Ga", ".Sa", "Sa.")
 *
 * @param {string}  swarCode  The canonical swar key (e.g. 'Sa', 're', '.Sa')
 * @param {object}  swarInfo  Object from exerciseManager.getSwarInfo(), may have .hindi
 * @returns {string}
 */
function getSwarLabel(swarCode, swarInfo) {
    if (window.globalSwarNotation === 'english') return swarCode;
    return (swarInfo && swarInfo.hindi) || swarCode;
}

/** Transliteration map for tabla bols (Devanagari → Latin). */
const BOL_TRANSLITERATION = Object.freeze({
    'धा': 'Dha', 'धिं': 'Dhin', 'धी': 'Dhi', 'धिन': 'Dhin',
    'ता': 'Ta',  'तिं': 'Tin',  'ती': 'Ti',
    'ना': 'Na',  'गे': 'Ge',   'क': 'Ka',
    'धागे': 'Dhage', 'तिरकिट': 'Tirkita', 'कत': 'Kata', 'तू': 'Tu',
});

/**
 * Returns the display label for a tabla bol based on the current notation setting.
 * @param {string} hindiBol  Devanagari bol string (e.g. 'धा', 'धिं')
 * @returns {string}
 */
function getBolLabel(hindiBol) {
    if (window.globalSwarNotation === 'english') {
        return BOL_TRANSLITERATION[hindiBol] || hindiBol;
    }
    return hindiBol;
}

if (typeof window !== 'undefined') {
    window.SWAR_RATIOS = SWAR_RATIOS;
    window.SWAR_SEMITONES = SWAR_SEMITONES;
    window.SWAR_LIST = SWAR_LIST;
    window.NOTE_ARTICULATION = NOTE_ARTICULATION;
    window.freqToMidi = freqToMidi;
    window.computeNoteDuration = computeNoteDuration;
    window.cancelActiveNote = cancelActiveNote;
    window.getSwarLabel = getSwarLabel;
    window.getBolLabel = getBolLabel;
    window.BOL_TRANSLITERATION = BOL_TRANSLITERATION;
}
