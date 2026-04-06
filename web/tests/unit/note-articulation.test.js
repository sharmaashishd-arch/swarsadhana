/**
 * Unit tests for note articulation gap logic.
 * Verifies that consecutive notes have a minimum silence gap for clear re-attack,
 * especially important for repeated identical notes (e.g., Sa Sa) at high speeds.
 */

import { describe, it, expect } from 'vitest';

const MIN_GAP_SEC = 0.03;

function computeNoteDuration(swarDurationSec) {
    return Math.min(swarDurationSec * 0.9, swarDurationSec - MIN_GAP_SEC);
}

function swarDuration(bpm, swarsPerBeat) {
    return 60.0 / bpm / swarsPerBeat;
}

describe('Note Articulation Gap', () => {
    describe('computeNoteDuration guarantees minimum gap', () => {
        const cases = [
            { bpm: 80,  spb: 1, label: '80 BPM, 1x' },
            { bpm: 80,  spb: 2, label: '80 BPM, 2x' },
            { bpm: 80,  spb: 4, label: '80 BPM, 4x' },
            { bpm: 120, spb: 2, label: '120 BPM, 2x' },
            { bpm: 120, spb: 4, label: '120 BPM, 4x' },
            { bpm: 160, spb: 4, label: '160 BPM, 4x' },
            { bpm: 200, spb: 4, label: '200 BPM, 4x (extreme)' },
        ];

        for (const { bpm, spb, label } of cases) {
            it(`${label}: gap >= ${MIN_GAP_SEC * 1000}ms`, () => {
                const sd = swarDuration(bpm, spb);
                const nd = computeNoteDuration(sd);
                const gap = sd - nd;
                expect(gap).toBeGreaterThanOrEqual(MIN_GAP_SEC);
                expect(nd).toBeGreaterThan(0);
            });
        }
    });

    describe('at slow speeds, uses 0.9 factor (10% gap)', () => {
        it('80 BPM, 1x: note duration = 0.9 * swarDuration', () => {
            const sd = swarDuration(80, 1);
            const nd = computeNoteDuration(sd);
            expect(nd).toBeCloseTo(sd * 0.9, 6);
        });

        it('60 BPM, 1x: note duration = 0.9 * swarDuration', () => {
            const sd = swarDuration(60, 1);
            const nd = computeNoteDuration(sd);
            expect(nd).toBeCloseTo(sd * 0.9, 6);
        });
    });

    describe('at fast speeds, clamps to minimum gap', () => {
        it('80 BPM, 4x: gap exactly 30ms', () => {
            const sd = swarDuration(80, 4);
            const nd = computeNoteDuration(sd);
            const gap = sd - nd;
            expect(gap).toBeCloseTo(MIN_GAP_SEC, 6);
        });

        it('120 BPM, 4x: gap exactly 30ms', () => {
            const sd = swarDuration(120, 4);
            const nd = computeNoteDuration(sd);
            const gap = sd - nd;
            expect(gap).toBeCloseTo(MIN_GAP_SEC, 6);
        });
    });

    describe('crossover point: where 0.9 factor gap < MIN_GAP', () => {
        it('gap from 0.9 factor equals MIN_GAP at swarDuration = 0.3s', () => {
            const crossover = MIN_GAP_SEC / 0.1;
            expect(crossover).toBeCloseTo(0.3, 6);
            const nd = computeNoteDuration(crossover);
            expect(nd).toBeCloseTo(crossover * 0.9, 6);
            expect(crossover - nd).toBeCloseTo(MIN_GAP_SEC, 6);
        });

        it('above crossover, uses proportional gap', () => {
            const sd = 0.5;
            const nd = computeNoteDuration(sd);
            expect(nd).toBeCloseTo(sd * 0.9, 6);
        });

        it('below crossover, clamps to MIN_GAP', () => {
            const sd = 0.15;
            const nd = computeNoteDuration(sd);
            expect(sd - nd).toBeCloseTo(MIN_GAP_SEC, 6);
        });
    });

    describe('Janti Pattern 4 specific scenario', () => {
        it('at 80 BPM, 4x: Sa Sa are distinct (30ms gap between them)', () => {
            const sd = swarDuration(80, 4);
            const nd = computeNoteDuration(sd);
            const gapMs = (sd - nd) * 1000;
            expect(gapMs).toBeGreaterThanOrEqual(30);
            expect(nd).toBeGreaterThan(0.05);
        });

        it('at 120 BPM, 4x: each note plays for > 50ms', () => {
            const sd = swarDuration(120, 4);
            const nd = computeNoteDuration(sd);
            expect(nd).toBeGreaterThan(0.05);
        });
    });
});
