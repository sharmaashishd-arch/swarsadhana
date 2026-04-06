/**
 * Unit Tests for Taal Definitions Registry
 *
 * Validates taal structure, pattern length, marker indices,
 * and sequencing correctness for all registered taals.
 */

import { describe, it, expect } from 'vitest';
import { TAAL_DEFINITIONS, getTaalById, getAllTaalIds, validateTaal } from '../../js/taal-definitions.js';

function resolveBolName(bol) {
    const b = (bol || '').toLowerCase();
    const map = [
        [['धा', 'dha'],               'dha'],
        [['धिं', 'धी', 'dhin', 'dhi'], 'dhin'],
        [['तिं', 'tin'],              'tin'],
        [['ना', 'na', 'ne'],          'na'],
        [['ता', 'ta', 'te'],          'ta'],
        [['गे', 'घे', 'ge', 'ghe'],   'ge'],
        [['के', 'ke'],                'ke'],
    ];
    for (const [patterns, canonical] of map) {
        if (patterns.some(p => bol?.includes(p) || b.includes(p))) {
            return canonical;
        }
    }
    return 'na';
}

const allTaalEntries = Object.entries(TAAL_DEFINITIONS);

describe('Taal registry completeness', () => {
    const requiredTaals = ['teentaal', 'keharwa', 'dadra', 'rupak', 'jhaptaal'];

    it('contains all required taals', () => {
        const ids = getAllTaalIds();
        for (const taalId of requiredTaals) {
            expect(ids).toContain(taalId);
        }
    });

    it('has at least 5 taals', () => {
        expect(getAllTaalIds().length).toBeGreaterThanOrEqual(5);
    });
});

describe('Taal definitions structure', () => {
    it.each(allTaalEntries)('%s has all required fields', (id, taal) => {
        expect(taal).toHaveProperty('id');
        expect(taal).toHaveProperty('name');
        expect(taal).toHaveProperty('nameHindi');
        expect(taal).toHaveProperty('beats');
        expect(taal).toHaveProperty('vibhag');
        expect(taal).toHaveProperty('sam');
        expect(taal).toHaveProperty('talis');
        expect(taal).toHaveProperty('khalis');
        expect(taal).toHaveProperty('bols');
        expect(taal).toHaveProperty('theka');
    });
});

describe('Pattern length matches beats', () => {
    const taals = [
        ['teentaal', 16],
        ['keharwa', 8],
        ['dadra', 6],
        ['rupak', 7],
        ['jhaptaal', 10],
        ['ektaal', 12],
        ['deepchandi', 14],
        ['tilwada', 16],
    ];

    it.each(taals)('%s has %d bols matching beats', (id, expectedBeats) => {
        const taal = getTaalById(id);
        expect(taal.beats).toBe(expectedBeats);
        expect(taal.bols.length).toBe(expectedBeats);
    });
});

describe('Vibhag sum matches beats', () => {
    it.each(allTaalEntries)('%s vibhag sum == beats', (id, taal) => {
        const sum = taal.vibhag.reduce((a, b) => a + b, 0);
        expect(sum).toBe(taal.beats);
    });
});

describe('Sam/tali/khali indices valid within beat count', () => {
    it.each(allTaalEntries)('%s has valid marker indices', (id, taal) => {
        expect(taal.sam).toBe(1);

        for (const t of taal.talis) {
            expect(t).toBeGreaterThanOrEqual(1);
            expect(t).toBeLessThanOrEqual(taal.beats);
        }

        for (const k of taal.khalis) {
            expect(k).toBeGreaterThanOrEqual(1);
            expect(k).toBeLessThanOrEqual(taal.beats);
        }
    });

    it.each(allTaalEntries)('%s has no overlapping tali/khali', (id, taal) => {
        const overlap = taal.talis.filter(t => taal.khalis.includes(t));
        expect(overlap).toEqual([]);
    });
});

describe('Sequencing produces correct events per avartan', () => {
    it.each(allTaalEntries)('%s: one event per matra for one avartan', (id, taal) => {
        const events = [];
        let matra = 0;
        const totalBeats = taal.beats;

        for (let i = 0; i < totalBeats; i++) {
            const bol = taal.bols[matra];
            const beatNum = matra + 1;
            const isSam = matra === 0;
            const isTali = !isSam && taal.talis.includes(beatNum);
            const isKhali = taal.khalis.includes(beatNum);

            events.push({ matra, bol, isSam, isTali, isKhali });
            matra = (matra + 1) % totalBeats;
        }

        expect(events.length).toBe(totalBeats);
        expect(matra).toBe(0);
        expect(events[0].isSam).toBe(true);
    });
});

describe('All theka bols resolve to valid sample names', () => {
    const validSamples = new Set(['dha', 'dhin', 'tin', 'na', 'ta', 'ge', 'ke']);

    it.each(allTaalEntries)('%s: every bol resolves to a valid sample', (id, taal) => {
        for (const bol of taal.bols) {
            const resolved = resolveBolName(bol);
            expect(validSamples.has(resolved)).toBe(true);
        }
    });
});

describe('validateTaal utility', () => {
    it('returns no errors for valid taals', () => {
        for (const [id, taal] of allTaalEntries) {
            const errors = validateTaal(taal);
            expect(errors).toEqual([]);
        }
    });

    it('detects bols/beats mismatch', () => {
        const bad = { ...TAAL_DEFINITIONS.teentaal, bols: ['धा', 'धिं'], beats: 16, vibhag: [16] };
        const errors = validateTaal(bad);
        expect(errors.some(e => e.includes('bols length'))).toBe(true);
    });

    it('detects vibhag sum mismatch', () => {
        const bad = { ...TAAL_DEFINITIONS.teentaal, vibhag: [4, 4] };
        const errors = validateTaal(bad);
        expect(errors.some(e => e.includes('vibhag sum'))).toBe(true);
    });

    it('detects out-of-range tali', () => {
        const bad = { ...TAAL_DEFINITIONS.dadra, talis: [1, 99] };
        const errors = validateTaal(bad);
        expect(errors.some(e => e.includes('tali 99'))).toBe(true);
    });
});

describe('getTaalById', () => {
    it('returns requested taal', () => {
        expect(getTaalById('dadra').name).toBe('Dadra');
    });

    it('falls back to teentaal for unknown id', () => {
        expect(getTaalById('unknown').name).toBe('Teentaal');
    });
});

describe('Specific taal definitions', () => {
    it('Teentaal: 16 beats, vibhag [4,4,4,4], sam=1, tali=[1,5,13], khali=[9]', () => {
        const t = getTaalById('teentaal');
        expect(t.beats).toBe(16);
        expect(t.vibhag).toEqual([4, 4, 4, 4]);
        expect(t.sam).toBe(1);
        expect(t.talis).toEqual([1, 5, 13]);
        expect(t.khalis).toEqual([9]);
    });

    it('Keharwa: 8 beats, vibhag [4,4], sam=1, tali=[1], khali=[5]', () => {
        const t = getTaalById('keharwa');
        expect(t.beats).toBe(8);
        expect(t.vibhag).toEqual([4, 4]);
        expect(t.talis).toEqual([1]);
        expect(t.khalis).toEqual([5]);
    });

    it('Dadra: 6 beats, vibhag [3,3], sam=1, tali=[1], khali=[4]', () => {
        const t = getTaalById('dadra');
        expect(t.beats).toBe(6);
        expect(t.vibhag).toEqual([3, 3]);
        expect(t.talis).toEqual([1]);
        expect(t.khalis).toEqual([4]);
    });

    it('Rupak: 7 beats, vibhag [3,2,2], sam=1, tali=[4,6], khali=[1]', () => {
        const t = getTaalById('rupak');
        expect(t.beats).toBe(7);
        expect(t.vibhag).toEqual([3, 2, 2]);
        expect(t.talis).toEqual([4, 6]);
        expect(t.khalis).toEqual([1]);
    });

    it('Jhaptaal: 10 beats, vibhag [2,3,2,3], sam=1, tali=[1,3,8], khali=[6]', () => {
        const t = getTaalById('jhaptaal');
        expect(t.beats).toBe(10);
        expect(t.vibhag).toEqual([2, 3, 2, 3]);
        expect(t.talis).toEqual([1, 3, 8]);
        expect(t.khalis).toEqual([6]);
    });
});
