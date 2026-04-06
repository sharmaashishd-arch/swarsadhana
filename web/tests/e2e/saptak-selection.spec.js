/**
 * E2E Tests for Saptak (Octave) Selection
 *
 * Verifies saptak selector UI, frequency computation, and persistence.
 */
import { test, expect } from '@playwright/test';

test.describe('Saptak globals available', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.click('#audio-status');
        await page.waitForTimeout(500);
    });

    test('SAPTAK constants available on window', async ({ page }) => {
        const has = await page.evaluate(() => {
            return typeof window.SAPTAK === 'object' &&
                   typeof window.SAPTAK_SEMITONES === 'object' &&
                   typeof window.saptakToSemitones === 'function';
        });
        expect(has).toBe(true);
    });

    test('SAPTAK has MANDRA, MADHYA, TAAR', async ({ page }) => {
        const keys = await page.evaluate(() => Object.keys(window.SAPTAK));
        expect(keys).toContain('MANDRA');
        expect(keys).toContain('MADHYA');
        expect(keys).toContain('TAAR');
    });

    test('saptakToSemitones returns correct values', async ({ page }) => {
        const values = await page.evaluate(() => ({
            mandra: window.saptakToSemitones('MANDRA'),
            madhya: window.saptakToSemitones('MADHYA'),
            taar: window.saptakToSemitones('TAAR'),
        }));
        expect(values.mandra).toBe(-12);
        expect(values.madhya).toBe(0);
        expect(values.taar).toBe(12);
    });
});

test.describe('Saptak selector UI', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.click('#audio-status');
        await page.waitForTimeout(500);
    });

    test('settings summary visible in header with default saptak', async ({ page }) => {
        const summary = page.locator('#settings-summary');
        await expect(summary).toBeVisible();
        await expect(summary).toContainText('Madhya');
    });

    test('practice setup modal has saptak selector', async ({ page }) => {
        await page.click('text=⚙️');
        await page.waitForTimeout(300);
        const selector = page.locator('#saptak-selector');
        await expect(selector).toBeVisible();
        const buttons = selector.locator('.saptak-btn');
        await expect(buttons).toHaveCount(3);
    });

    test('clicking Taar updates settings summary and engine', async ({ page }) => {
        await page.click('text=⚙️');
        await page.waitForTimeout(300);
        await page.click('.saptak-btn[data-saptak="TAAR"]');
        await page.waitForTimeout(200);

        const summary = page.locator('#settings-summary');
        await expect(summary).toContainText('Taar');

        const engineSaptak = await page.evaluate(() => {
            return window.realisticAudioEngine?.currentSaptak;
        });
        expect(engineSaptak).toBe('TAAR');
    });

    test('clicking Mandra updates settings summary and engine', async ({ page }) => {
        await page.click('text=⚙️');
        await page.waitForTimeout(300);
        await page.click('.saptak-btn[data-saptak="MANDRA"]');
        await page.waitForTimeout(200);

        const summary = page.locator('#settings-summary');
        await expect(summary).toContainText('Mandra');

        const engineSaptak = await page.evaluate(() => {
            return window.realisticAudioEngine?.currentSaptak;
        });
        expect(engineSaptak).toBe('MANDRA');
    });

    test('saptak persists in localStorage', async ({ page }) => {
        await page.click('text=⚙️');
        await page.waitForTimeout(300);
        await page.click('.saptak-btn[data-saptak="TAAR"]');
        await page.waitForTimeout(200);

        const stored = await page.evaluate(() => localStorage.getItem('ss_saptak'));
        expect(stored).toBe('TAAR');
    });
});

test.describe('Saptak frequency verification', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.click('#audio-status');
        await page.waitForTimeout(1000);
    });

    test('Sa=C, Madhya: Sa freq ~261 Hz', async ({ page }) => {
        const freq = await page.evaluate(() => {
            if (!window.realisticAudioEngine) return null;
            window.realisticAudioEngine.setSaptak('MADHYA');
            return window.realisticAudioEngine.getSwarFreq('Sa');
        });
        expect(freq).toBeCloseTo(261.63, 0);
    });

    test('Sa=C, Taar: Sa freq ~523 Hz (one octave higher)', async ({ page }) => {
        const freq = await page.evaluate(() => {
            if (!window.realisticAudioEngine) return null;
            window.realisticAudioEngine.setSaptak('TAAR');
            return window.realisticAudioEngine.getSwarFreq('Sa');
        });
        expect(freq).toBeCloseTo(523.26, 0);
    });

    test('Sa=C, Mandra: Sa freq ~131 Hz (one octave lower)', async ({ page }) => {
        const freq = await page.evaluate(() => {
            if (!window.realisticAudioEngine) return null;
            window.realisticAudioEngine.setSaptak('MANDRA');
            return window.realisticAudioEngine.getSwarFreq('Sa');
        });
        expect(freq).toBeCloseTo(130.815, 0);
    });

    test('Taar Sa is exactly 2x Madhya Sa', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.realisticAudioEngine) return null;
            window.realisticAudioEngine.setSaptak('MADHYA');
            const madhya = window.realisticAudioEngine.getSwarFreq('Sa');
            window.realisticAudioEngine.setSaptak('TAAR');
            const taar = window.realisticAudioEngine.getSwarFreq('Sa');
            return { ratio: taar / madhya };
        });
        expect(result.ratio).toBeCloseTo(2.0, 4);
    });

    test('Mandra Sa is exactly 0.5x Madhya Sa', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.realisticAudioEngine) return null;
            window.realisticAudioEngine.setSaptak('MADHYA');
            const madhya = window.realisticAudioEngine.getSwarFreq('Sa');
            window.realisticAudioEngine.setSaptak('MANDRA');
            const mandra = window.realisticAudioEngine.getSwarFreq('Sa');
            return { ratio: mandra / madhya };
        });
        expect(result.ratio).toBeCloseTo(0.5, 4);
    });
});

test.describe('Saptak in exercise detail', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.click('#audio-status');
        await page.waitForTimeout(1000);
    });

    test('exercise detail shows saptak in accompaniment badges', async ({ page }) => {
        const exerciseCard = page.locator('.exercise-card').first();
        await expect(exerciseCard).toBeVisible({ timeout: 10000 });
        await exerciseCard.click();
        await page.waitForTimeout(500);

        const saptakBadge = page.locator('.acc-badge', { hasText: 'Saptak' });
        await expect(saptakBadge).toBeVisible();
        await expect(saptakBadge).toContainText('Madhya');
    });
});
