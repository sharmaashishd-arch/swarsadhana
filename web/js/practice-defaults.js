/**
 * Practice Defaults — Single source of truth for all default settings.
 *
 * Every JS module, UI initializer, and fallback must reference
 * PRACTICE_DEFAULTS instead of hardcoding values.
 */

const PRACTICE_DEFAULTS = Object.freeze({
    key: 'C#',
    baseSaFreq: 277.18,
    tempo: 90,
    saptak: 'MADHYA',

    minTempo: 30,
    maxTempo: 200,

    tanpuraVolume: 0.25,
    tablaVolume: 0.25,
    tanpuraEnabled: true,
    tablaEnabled: true,
    tanpuraPattern: 'PaSa',

    countInAvartans: 1,
    demoAvartans: 1,
    practiceAvartans: 2,
    swarPerMatra: 1,

    recommendedSaptak: 'MADHYA',
});

const STORAGE_KEYS = Object.freeze({
    TANPURA_VOLUME: 'ss_tanpura_volume',
    TABLA_VOLUME: 'ss_tabla_volume',
    SAPTAK: 'ss_saptak',
    KEY: 'ss_key',
    TEMPO: 'ss_tempo',
});

if (typeof window !== 'undefined') {
    window.PRACTICE_DEFAULTS = PRACTICE_DEFAULTS;
    window.STORAGE_KEYS = STORAGE_KEYS;
}
