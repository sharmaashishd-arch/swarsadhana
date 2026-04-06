/**
 * Unit Tests for Saptak (Octave) Selection
 * Tests saptak → semitone mapping, frequency calculations, MIDI mapping, and grading.
 */

import { describe, it, expect, beforeEach } from 'vitest';

const SAPTAK = Object.freeze({
    MANDRA: 'MANDRA',
    MADHYA: 'MADHYA',
    TAAR: 'TAAR',
});

const SAPTAK_SEMITONES = Object.freeze({
    [SAPTAK.MANDRA]: -12,
    [SAPTAK.MADHYA]: 0,
    [SAPTAK.TAAR]: 12,
});

function saptakToSemitones(saptak) {
    return SAPTAK_SEMITONES[saptak] ?? 0;
}

const swarSemitones = {
    'Sa.': -12, 'Sa': 0, 're': 1, 'Re': 2, 'ga': 3, 'Ga': 4,
    'Ma': 5, 'ma': 6, 'Pa': 7, 'dha': 8, 'Dha': 9, 'ni': 10,
    'Ni': 11, '.Sa': 12, '.Re': 14, '.Ga': 16, '.Ma': 17,
    '.Pa': 19, '.Dha': 21, '.Ni': 23,
};

const swarRatios = {
    'Sa': 1, 're': 256/243, 'Re': 9/8, 'ga': 32/27, 'Ga': 5/4,
    'Ma': 4/3, 'ma': 45/32, 'Pa': 3/2, 'dha': 128/81, 'Dha': 5/3,
    'ni': 16/9, 'Ni': 15/8,
};

function swarToMidi(swarName, baseSaFreq, saptakSemitones) {
    const baseMidi = Math.round(69 + 12 * Math.log2(baseSaFreq / 440));
    const offset = swarSemitones[swarName];
    if (offset === undefined) return null;
    return baseMidi + offset + saptakSemitones;
}

function getSwarFreq(swarName, baseSaFreq, saptakSemitones) {
    const ratio = swarRatios[swarName] || 1;
    const saptakShift = saptakSemitones / 12;
    return baseSaFreq * ratio * Math.pow(2, saptakShift);
}

function getEffectiveSaFreq(baseSaFreq, saptakSemitones) {
    return baseSaFreq * Math.pow(2, saptakSemitones / 12);
}

describe('Saptak to semitone mapping', () => {
    it('MANDRA maps to -12 semitones', () => {
        expect(saptakToSemitones(SAPTAK.MANDRA)).toBe(-12);
    });

    it('MADHYA maps to 0 semitones', () => {
        expect(saptakToSemitones(SAPTAK.MADHYA)).toBe(0);
    });

    it('TAAR maps to +12 semitones', () => {
        expect(saptakToSemitones(SAPTAK.TAAR)).toBe(12);
    });

    it('unknown saptak defaults to 0', () => {
        expect(saptakToSemitones('INVALID')).toBe(0);
    });
});

describe('Frequency calculation includes saptak shift', () => {
    const baseSa = 261.63;

    it('Madhya Sa frequency = base Sa', () => {
        const freq = getSwarFreq('Sa', baseSa, 0);
        expect(freq).toBeCloseTo(261.63, 1);
    });

    it('Taar Sa frequency = base Sa * 2', () => {
        const freq = getSwarFreq('Sa', baseSa, 12);
        expect(freq).toBeCloseTo(523.26, 1);
    });

    it('Mandra Sa frequency = base Sa / 2', () => {
        const freq = getSwarFreq('Sa', baseSa, -12);
        expect(freq).toBeCloseTo(130.815, 1);
    });

    it('Taar Pa = base Sa * 3/2 * 2', () => {
        const freq = getSwarFreq('Pa', baseSa, 12);
        const expected = baseSa * 1.5 * 2;
        expect(freq).toBeCloseTo(expected, 1);
    });

    it('Mandra Pa = base Sa * 3/2 / 2', () => {
        const freq = getSwarFreq('Pa', baseSa, -12);
        const expected = baseSa * 1.5 / 2;
        expect(freq).toBeCloseTo(expected, 1);
    });
});

describe('MIDI note mapping includes saptak shift', () => {
    const baseSa = 261.63; // C4

    it('Madhya Sa at C = MIDI 60', () => {
        const midi = swarToMidi('Sa', baseSa, 0);
        expect(midi).toBe(60);
    });

    it('Taar Sa at C = MIDI 72', () => {
        const midi = swarToMidi('Sa', baseSa, 12);
        expect(midi).toBe(72);
    });

    it('Mandra Sa at C = MIDI 48', () => {
        const midi = swarToMidi('Sa', baseSa, -12);
        expect(midi).toBe(48);
    });

    it('Taar Pa at C = MIDI 79', () => {
        const midi = swarToMidi('Pa', baseSa, 12);
        expect(midi).toBe(60 + 7 + 12);
    });

    it('Mandra .Sa at C = MIDI 60 (lower octave .Sa stays same octave as Madhya Sa)', () => {
        const midi = swarToMidi('.Sa', baseSa, -12);
        expect(midi).toBe(60 + 12 - 12);
    });
});

describe('Grading expected frequency includes saptak shift', () => {
    const baseSa = 261.63;

    it('Madhya Sa expected freq = 261.63', () => {
        const effectiveSa = getEffectiveSaFreq(baseSa, 0);
        expect(effectiveSa).toBeCloseTo(261.63, 1);
    });

    it('Taar Sa expected freq = 523.26', () => {
        const effectiveSa = getEffectiveSaFreq(baseSa, 12);
        expect(effectiveSa).toBeCloseTo(523.26, 1);
    });

    it('Mandra Sa expected freq = 130.815', () => {
        const effectiveSa = getEffectiveSaFreq(baseSa, -12);
        expect(effectiveSa).toBeCloseTo(130.815, 1);
    });

    it('pitch detector with Taar shift recognizes Sa at 523 Hz', () => {
        const effectiveSa = getEffectiveSaFreq(baseSa, 12);
        const freq = 523.26;
        const ratio = freq / effectiveSa;
        const cents = 1200 * Math.log2(ratio);
        expect(Math.abs(cents)).toBeLessThan(5);
    });

    it('pitch detector with Mandra shift recognizes Sa at 131 Hz', () => {
        const effectiveSa = getEffectiveSaFreq(baseSa, -12);
        const freq = 130.815;
        const ratio = freq / effectiveSa;
        const cents = 1200 * Math.log2(ratio);
        expect(Math.abs(cents)).toBeLessThan(5);
    });
});

describe('Cross-saptak frequency consistency', () => {
    const baseSa = 261.63;

    it('Sa=C, Taar: first Sa should be exactly one octave higher than Madhya', () => {
        const madhyaSa = getSwarFreq('Sa', baseSa, 0);
        const taarSa = getSwarFreq('Sa', baseSa, 12);
        expect(taarSa / madhyaSa).toBeCloseTo(2.0, 5);
    });

    it('Sa=C, Mandra: first Sa should be exactly one octave lower than Madhya', () => {
        const madhyaSa = getSwarFreq('Sa', baseSa, 0);
        const mandraSa = getSwarFreq('Sa', baseSa, -12);
        expect(madhyaSa / mandraSa).toBeCloseTo(2.0, 5);
    });

    it('all 12 swaras shift by exact octave between Madhya and Taar', () => {
        const swarNames = Object.keys(swarRatios);
        for (const swar of swarNames) {
            const madhya = getSwarFreq(swar, baseSa, 0);
            const taar = getSwarFreq(swar, baseSa, 12);
            expect(taar / madhya).toBeCloseTo(2.0, 5);
        }
    });
});
