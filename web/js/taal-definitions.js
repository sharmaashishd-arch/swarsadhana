/**
 * Taal Definitions Registry
 *
 * Single source of truth for all taal (rhythmic cycle) definitions
 * and theka (bol sequence) patterns used by the tabla engine.
 *
 * Each taal entry contains:
 *   - id: unique key
 *   - name / nameHindi: display names
 *   - beats: total matras in one avartan
 *   - vibhag: array of beat counts per vibhag (section)
 *   - sam: first beat index (always 1, 1-based)
 *   - talis: 1-based beat numbers where clap falls
 *   - khalis: 1-based beat numbers where wave falls
 *   - bols: ordered bol syllables per matra
 *   - theka: human-readable theka string with | separators
 */

const TAAL_DEFINITIONS = {
    teentaal: {
        id: 'teentaal',
        name: 'Teentaal',
        nameHindi: 'तीनताल',
        beats: 16,
        vibhag: [4, 4, 4, 4],
        sam: 1,
        talis: [1, 5, 13],
        khalis: [9],
        bols: ['धा', 'धिं', 'धिं', 'धा', 'धा', 'धिं', 'धिं', 'धा',
               'धा', 'तिं', 'तिं', 'ता', 'ता', 'धिं', 'धिं', 'धा'],
        theka: 'धा धिं धिं धा | धा धिं धिं धा | धा तिं तिं ता | ता धिं धिं धा'
    },

    keharwa: {
        id: 'keharwa',
        name: 'Keharwa',
        nameHindi: 'कहरवा',
        beats: 8,
        vibhag: [4, 4],
        sam: 1,
        talis: [1],
        khalis: [5],
        bols: ['धा', 'गे', 'ना', 'ती', 'ना', 'क', 'धी', 'ना'],
        theka: 'धा गे ना ती | ना क धी ना'
    },

    dadra: {
        id: 'dadra',
        name: 'Dadra',
        nameHindi: 'दादरा',
        beats: 6,
        vibhag: [3, 3],
        sam: 1,
        talis: [1],
        khalis: [4],
        bols: ['धा', 'धी', 'ना', 'ना', 'ती', 'ना'],
        theka: 'धा धी ना | ना ती ना'
    },

    rupak: {
        id: 'rupak',
        name: 'Rupak',
        nameHindi: 'रूपक',
        beats: 7,
        vibhag: [3, 2, 2],
        sam: 1,
        talis: [4, 6],
        khalis: [1],
        bols: ['ती', 'ती', 'ना', 'धी', 'ना', 'धी', 'ना'],
        theka: 'ती ती ना | धी ना | धी ना'
    },

    jhaptaal: {
        id: 'jhaptaal',
        name: 'Jhaptaal',
        nameHindi: 'झपताल',
        beats: 10,
        vibhag: [2, 3, 2, 3],
        sam: 1,
        talis: [1, 3, 8],
        khalis: [6],
        bols: ['धी', 'ना', 'धी', 'धी', 'ना', 'ती', 'ना', 'धी', 'धी', 'ना'],
        theka: 'धी ना | धी धी ना | ती ना | धी धी ना'
    },

    ektaal: {
        id: 'ektaal',
        name: 'Ektaal',
        nameHindi: 'एकताल',
        beats: 12,
        vibhag: [2, 2, 2, 2, 2, 2],
        sam: 1,
        talis: [1, 3, 7, 11],
        khalis: [5, 9],
        bols: ['धिं', 'धिं', 'धागे', 'तिरकिट', 'तू', 'ना',
               'कत', 'ता', 'धागे', 'तिरकिट', 'धी', 'ना'],
        theka: 'धिं धिं | धागे तिरकिट | तू ना | कत ता | धागे तिरकिट | धी ना'
    },

    deepchandi: {
        id: 'deepchandi',
        name: 'Deepchandi',
        nameHindi: 'दीपचंदी',
        beats: 14,
        vibhag: [3, 4, 3, 4],
        sam: 1,
        talis: [1, 4, 11],
        khalis: [8],
        bols: ['धा', 'धी', 'ना', 'धा', 'गे', 'तिरकिट', 'ना',
               'ता', 'ती', 'ना', 'धा', 'गे', 'तिरकिट', 'ना'],
        theka: 'धा धी ना | धा गे तिरकिट ना | ता ती ना | धा गे तिरकिट ना'
    },

    tilwada: {
        id: 'tilwada',
        name: 'Tilwada',
        nameHindi: 'तिलवाड़ा',
        beats: 16,
        vibhag: [4, 4, 4, 4],
        sam: 1,
        talis: [1, 5, 13],
        khalis: [9],
        bols: ['धा', 'तिरकिट', 'धी', 'ना', 'धा', 'ना', 'तिं', 'ना',
               'ता', 'तिरकिट', 'धी', 'ना', 'धा', 'धी', 'ना', 'धा'],
        theka: 'धा तिरकिट धी ना | धा ना तिं ना | ता तिरकिट धी ना | धा धी ना धा'
    }
};

/**
 * Get a taal by its id key.
 * Falls back to teentaal if not found.
 */
function getTaalById(id) {
    return TAAL_DEFINITIONS[id] || TAAL_DEFINITIONS.teentaal;
}

/**
 * List all taal ids.
 */
function getAllTaalIds() {
    return Object.keys(TAAL_DEFINITIONS);
}

/**
 * Validate a taal definition for internal consistency.
 * Returns an array of error strings (empty = valid).
 */
function validateTaal(taal) {
    const errors = [];
    if (!taal) { errors.push('taal is null'); return errors; }

    if (taal.bols.length !== taal.beats) {
        errors.push(`bols length (${taal.bols.length}) != beats (${taal.beats})`);
    }

    const vibhagSum = taal.vibhag.reduce((a, b) => a + b, 0);
    if (vibhagSum !== taal.beats) {
        errors.push(`vibhag sum (${vibhagSum}) != beats (${taal.beats})`);
    }

    for (const t of taal.talis) {
        if (t < 1 || t > taal.beats) {
            errors.push(`tali ${t} out of range [1, ${taal.beats}]`);
        }
    }
    for (const k of taal.khalis) {
        if (k < 1 || k > taal.beats) {
            errors.push(`khali ${k} out of range [1, ${taal.beats}]`);
        }
    }

    const overlap = taal.talis.filter(t => taal.khalis.includes(t));
    if (overlap.length > 0) {
        errors.push(`overlapping tali/khali beats: ${overlap}`);
    }

    return errors;
}

window.TAAL_DEFINITIONS = TAAL_DEFINITIONS;
window.getTaalById = getTaalById;
window.getAllTaalIds = getAllTaalIds;
window.validateTaal = validateTaal;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TAAL_DEFINITIONS, getTaalById, getAllTaalIds, validateTaal };
}
