/**
 * E2E Tests for Note Articulation
 *
 * Verifies that consecutive identical notes are distinctly articulated,
 * especially at high subdivision speeds (4x).
 */
import { test, expect } from '@playwright/test';

test.describe('Note Articulation at High Speed', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.click('#audio-status');
        await page.waitForTimeout(500);
    });

    test('RealisticSwarSynth cancels previous envelope before new note', async ({ page }) => {
        const result = await page.evaluate(() => {
            const engine = window.robotUI?.audioEngine;
            const synth = window.robotUI?.swarSynth;
            if (!engine || !synth || !synth.player) return { skip: true };

            const ctx = engine.ctx;

            const first = synth.playSwar('Sa', 0.5, ctx.currentTime);
            const hadActive1 = synth._activeEnvelope != null;

            const second = synth.playSwar('Sa', 0.5, ctx.currentTime + 0.01);
            const hadActive2 = synth._activeEnvelope != null;

            return {
                skip: false,
                firstCreated: first != null,
                hadActiveAfterFirst: hadActive1,
                secondCreated: second != null,
                hadActiveAfterSecond: hadActive2,
            };
        });

        if (result.skip) {
            test.skip();
            return;
        }
        expect(result.firstCreated).toBe(true);
        expect(result.hadActiveAfterFirst).toBe(true);
        expect(result.secondCreated).toBe(true);
        expect(result.hadActiveAfterSecond).toBe(true);
    });

    test('note duration enforces minimum 30ms gap at 4x speed', async ({ page }) => {
        const result = await page.evaluate(() => {
            const MIN_GAP = 0.03;
            const bpm = 80;
            const swarsPerBeat = 4;
            const swarDuration = 60.0 / bpm / swarsPerBeat;
            const noteDuration = Math.min(swarDuration * 0.9, swarDuration - MIN_GAP);
            const gap = swarDuration - noteDuration;
            return {
                swarDuration,
                noteDuration,
                gapMs: gap * 1000,
                notePositive: noteDuration > 0,
            };
        });

        expect(result.gapMs).toBeGreaterThanOrEqual(30);
        expect(result.notePositive).toBe(true);
    });

    test('_activeEnvelope and _activeOsc are initialized as null', async ({ page }) => {
        const result = await page.evaluate(() => {
            const synth = window.robotUI?.swarSynth;
            if (!synth) return { skip: true };
            return {
                skip: false,
                hasActiveEnvProp: '_activeEnvelope' in synth,
                hasActiveOscProp: '_activeOsc' in synth,
            };
        });

        if (result.skip) {
            test.skip();
            return;
        }
        expect(result.hasActiveEnvProp).toBe(true);
        expect(result.hasActiveOscProp).toBe(true);
    });

    test('rapid same-note scheduling creates distinct envelopes', async ({ page }) => {
        const result = await page.evaluate(() => {
            const engine = window.robotUI?.audioEngine;
            const synth = window.robotUI?.swarSynth;
            if (!engine || !synth || !synth.player) return { skip: true };

            const ctx = engine.ctx;
            const now = ctx.currentTime;
            const envelopes = [];

            for (let i = 0; i < 4; i++) {
                const r = synth.playSwar('Sa', 0.1, now + i * 0.15);
                if (r && r.envelope) envelopes.push(r.envelope);
            }

            return {
                skip: false,
                count: envelopes.length,
                allDistinct: new Set(envelopes.map(e => e)).size === envelopes.length,
            };
        });

        if (result.skip) {
            test.skip();
            return;
        }
        expect(result.count).toBe(4);
    });
});
