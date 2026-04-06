/**
 * E2E Tests for Taal Pattern Packs
 *
 * Verifies taal registry availability and taal grid in the Sadhana UI.
 */
import { test, expect } from '@playwright/test';

test.describe('Taal definitions registry loaded', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.click('#audio-status');
        await page.waitForTimeout(500);
    });

    test('TAAL_DEFINITIONS available on window', async ({ page }) => {
        const hasTaalDefs = await page.evaluate(() => {
            return typeof window.TAAL_DEFINITIONS === 'object' && window.TAAL_DEFINITIONS !== null;
        });
        expect(hasTaalDefs).toBe(true);
    });

    test('registry contains all 5 required taals', async ({ page }) => {
        const ids = await page.evaluate(() => Object.keys(window.TAAL_DEFINITIONS));
        expect(ids).toContain('teentaal');
        expect(ids).toContain('keharwa');
        expect(ids).toContain('dadra');
        expect(ids).toContain('rupak');
        expect(ids).toContain('jhaptaal');
    });

    test('each taal has correct beat count', async ({ page }) => {
        const checks = await page.evaluate(() => {
            const defs = window.TAAL_DEFINITIONS;
            return {
                teentaal: defs.teentaal.beats === 16 && defs.teentaal.bols.length === 16,
                keharwa: defs.keharwa.beats === 8 && defs.keharwa.bols.length === 8,
                dadra: defs.dadra.beats === 6 && defs.dadra.bols.length === 6,
                rupak: defs.rupak.beats === 7 && defs.rupak.bols.length === 7,
                jhaptaal: defs.jhaptaal.beats === 10 && defs.jhaptaal.bols.length === 10,
            };
        });

        expect(checks.teentaal).toBe(true);
        expect(checks.keharwa).toBe(true);
        expect(checks.dadra).toBe(true);
        expect(checks.rupak).toBe(true);
        expect(checks.jhaptaal).toBe(true);
    });

    test('validateTaal returns no errors for all taals', async ({ page }) => {
        const allValid = await page.evaluate(() => {
            const results = {};
            for (const [id, taal] of Object.entries(window.TAAL_DEFINITIONS)) {
                results[id] = window.validateTaal(taal);
            }
            return results;
        });

        for (const [id, errors] of Object.entries(allValid)) {
            expect(errors).toEqual([]);
        }
    });

    test('getTaalById helper works', async ({ page }) => {
        const name = await page.evaluate(() => window.getTaalById('dadra').name);
        expect(name).toBe('Dadra');
    });

    test('getTaalById falls back to teentaal', async ({ page }) => {
        const name = await page.evaluate(() => window.getTaalById('nonexistent').name);
        expect(name).toBe('Teentaal');
    });

    test('each taal has vibhag, talis, khalis fields', async ({ page }) => {
        const result = await page.evaluate(() => {
            const defs = window.TAAL_DEFINITIONS;
            const issues = [];
            for (const [id, t] of Object.entries(defs)) {
                if (!Array.isArray(t.vibhag)) issues.push(`${id}: missing vibhag`);
                if (!Array.isArray(t.talis)) issues.push(`${id}: missing talis`);
                if (!Array.isArray(t.khalis)) issues.push(`${id}: missing khalis`);
                if (typeof t.sam !== 'number') issues.push(`${id}: missing sam`);
            }
            return issues;
        });
        expect(result).toEqual([]);
    });
});

test.describe('Taal Pattern Packs in exercise UI', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.click('#audio-status');
        await page.waitForSelector('.exercise-card', { timeout: 30000 });
        await page.click('text=Exercise 1 - Aaroh/Avaroh');
    });

    test('exercise detail shows taal grid with beat markers', async ({ page }) => {
        await page.waitForSelector('.taal-display-section', { timeout: 5000 });

        const taalGrid = page.locator('#taal-grid');
        await expect(taalGrid).toBeVisible();

        const beats = taalGrid.locator('.taal-beat');
        const count = await beats.count();
        expect(count).toBeGreaterThan(0);
    });

    test('taal grid marks sam beat', async ({ page }) => {
        await page.waitForSelector('#taal-grid', { timeout: 5000 });
        const samBeat = page.locator('.taal-beat.sam');
        await expect(samBeat).toHaveCount(1);
    });

    test('taal grid marks khali beats', async ({ page }) => {
        await page.waitForSelector('#taal-grid', { timeout: 5000 });
        const khaliBeat = page.locator('.taal-beat.khali');
        const count = await khaliBeat.count();
        expect(count).toBeGreaterThanOrEqual(1);
    });

    test('taal grid shows bol text for each beat', async ({ page }) => {
        await page.waitForSelector('#taal-grid', { timeout: 5000 });
        const bolCells = page.locator('.taal-beat .beat-bol');
        const count = await bolCells.count();
        expect(count).toBeGreaterThan(0);

        const firstBol = await bolCells.first().textContent();
        expect(firstBol.trim().length).toBeGreaterThan(0);
    });

    test('tabla toggle shows taal name', async ({ page }) => {
        await page.waitForSelector('#tabla-toggle', { timeout: 5000 });
        const tablaToggle = page.locator('#tabla-toggle');
        const text = await tablaToggle.textContent();
        expect(text).toContain('ON');
    });

    test('session view shows beat columns with sam marker', async ({ page }) => {
        await page.waitForSelector('.btn-start', { timeout: 5000 });
        await page.click('.btn-start');
        await page.waitForSelector('.robot-session', { timeout: 5000 });

        const beatColumns = page.locator('.beat-column');
        const count = await beatColumns.count();
        expect(count).toBeGreaterThan(0);

        const samColumn = page.locator('.beat-column.sam');
        await expect(samColumn).toHaveCount(1);
    });
});
