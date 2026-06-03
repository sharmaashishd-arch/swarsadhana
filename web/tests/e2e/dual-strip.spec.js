/**
 * E2E Tests for Dual Strip (Beat + Swar)
 * Tests: detail page subdivision control, session view dual strip rendering,
 *        demo playback with both strips, and subdivision changes.
 */

import { test, expect } from '@playwright/test';

test.describe('Dual Strip - Detail Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.click('#audio-status');
        await page.waitForSelector('.exercise-card', { timeout: 15000 });
        await page.click('text=Exercise 1 - Aaroh/Avaroh');
    });

    test('should show subdivision control on detail page', async ({ page }) => {
        await expect(page.locator('.subdivision-control label')).toContainText('Speed');
        await expect(page.locator('#subdivision-selector')).toBeVisible();
    });

    test('should show 1x/2x/4x subdivision buttons', async ({ page }) => {
        const buttons = page.locator('#subdivision-selector button');
        await expect(buttons).toHaveCount(3);
        await expect(buttons.nth(0)).toContainText('1x');
        await expect(buttons.nth(1)).toContainText('2x');
        await expect(buttons.nth(2)).toContainText('4x');
    });

    test('should default subdivision to exercise swars_per_beat', async ({ page }) => {
        const activeBtn = page.locator('#subdivision-selector button.active');
        await expect(activeBtn).toContainText('1x');
    });

    test('should update active subdivision button on click', async ({ page }) => {
        await page.click('#subdivision-selector button:has-text("2x")');
        const activeBtn = page.locator('#subdivision-selector button.active');
        await expect(activeBtn).toContainText('2x');
    });

    test('tempo is configured via Practice Setup, not detail page', async ({ page }) => {
        await expect(page.locator('#session-tempo-slider')).toHaveCount(0);
        await expect(page.locator('text=Tempo:')).toHaveCount(0);
    });
});

test.describe('Dual Strip - Session View Rendering', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.click('#audio-status');
        await page.waitForSelector('.exercise-card', { timeout: 15000 });
        await page.click('text=Exercise 1 - Aaroh/Avaroh');
    });

    test('should render dual strip container with labels on demo start', async ({ page }) => {
        await page.click('.btn-start');
        await expect(page.locator('.dual-strip-container')).toBeVisible();
        await expect(page.locator('.strip-label:has-text("Taal")')).toBeVisible();
        await expect(page.locator('.strip-label:has-text("Swar")')).toBeVisible();
    });

    test('should render beat cells with Sam/Tali/Khali markers', async ({ page }) => {
        await page.click('.btn-start');
        await expect(page.locator('.dual-strip-container')).toBeVisible();

        const beatColumns = page.locator('.beat-column');
        const count = await beatColumns.count();
        expect(count).toBeGreaterThanOrEqual(1);

        const samCol = page.locator('.beat-column.sam');
        await expect(samCol.first()).toBeVisible();
        const samMarker = samCol.first().locator('.beat-marker');
        await expect(samMarker).toContainText('X');
    });

    test('should render beat numbers starting from 1', async ({ page }) => {
        await page.click('.btn-start');
        const firstBeatNum = page.locator('.beat-column .beat-num').first();
        await expect(firstBeatNum).toContainText('1');
    });

    test('should render bol labels from taal data', async ({ page }) => {
        await page.click('.btn-start');
        const firstBol = page.locator('.beat-column .beat-bol').first();
        await expect(firstBol).toContainText('धा');
    });

    test('should render swar subcells inside swar groups', async ({ page }) => {
        await page.click('.btn-start');
        const swarGroups = page.locator('.swar-group');
        const groupCount = await swarGroups.count();
        expect(groupCount).toBeGreaterThanOrEqual(1);

        const firstGroupSubcells = swarGroups.first().locator('.swar-subcell');
        const subcellCount = await firstGroupSubcells.count();
        expect(subcellCount).toBeGreaterThanOrEqual(1);
    });

    test('should show swar labels in Devanagari', async ({ page }) => {
        await page.click('.btn-start');
        const firstSwar = page.locator('.swar-subcell .subcell-swar').first();
        await expect(firstSwar).toContainText('सा');
    });

    test('should show session controls bar with subdivision', async ({ page }) => {
        await page.click('.btn-start');
        await expect(page.locator('.session-controls-bar')).toBeVisible();
        await expect(page.locator('#session-subdivision-selector')).toBeVisible();
    });
});

test.describe('Dual Strip - Demo Playback', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.click('#audio-status');
        await page.waitForSelector('.exercise-card', { timeout: 15000 });
        await page.click('text=Exercise 1 - Aaroh/Avaroh');
    });

    test('should highlight active swar subcell during demo', async ({ page }) => {
        await page.click('.btn-start');
        await expect(page.locator('.swar-subcell.active')).toBeVisible({ timeout: 15000 });
    });

    test('should highlight current beat column during demo', async ({ page }) => {
        await page.click('.btn-start');
        await expect(page.locator('.beat-column.current')).toBeVisible({ timeout: 15000 });
    });

    test('should update current swar display during demo', async ({ page }) => {
        await page.click('.btn-start');
        await expect(async () => {
            const text = await page.locator('#current-swar').textContent();
            expect(text).not.toBe('-');
        }).toPass({ timeout: 15000 });
    });

    test('should update progress bar during demo', async ({ page }) => {
        await page.click('.btn-start');
        await expect(async () => {
            const width = await page.locator('#swar-progress').evaluate(
                el => parseFloat(el.style.width)
            );
            expect(width).toBeGreaterThan(0);
        }).toPass({ timeout: 15000 });
    });

    test('should stop demo and return to detail view', async ({ page }) => {
        await page.click('.btn-start');
        await expect(page.locator('.robot-session')).toBeVisible();
        await page.click('.stop-btn');
        await expect(page.locator('.exercise-detail')).toBeVisible();
    });
});

test.describe('Dual Strip - Subdivision Changes', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.click('#audio-status');
        await page.waitForSelector('.exercise-card', { timeout: 15000 });
    });

    test('should show 2 subcells per beat after switching to 2x subdivision', async ({ page }) => {
        await page.click('text=Janti Swaras');
        await page.click('.exercise-card >> nth=0');

        await page.click('#subdivision-selector button:has-text("2x")');
        const activeBtn = page.locator('#subdivision-selector button.active');
        await expect(activeBtn).toContainText('2x');

        await page.click('.btn-start');
        await expect(page.locator('.dual-strip-container')).toBeVisible();

        const firstGroup = page.locator('.swar-group').first();
        const subcellCount = await firstGroup.locator('.swar-subcell').count();
        expect(subcellCount).toBe(2);
    });

    test('changing subdivision on detail page should affect session strip', async ({ page }) => {
        await page.click('text=Exercise 1 - Aaroh/Avaroh');

        await page.click('#subdivision-selector button:has-text("2x")');

        await page.click('.btn-start');
        await expect(page.locator('.dual-strip-container')).toBeVisible();

        const firstGroup = page.locator('.swar-group').first();
        const subcellCount = await firstGroup.locator('.swar-subcell').count();
        expect(subcellCount).toBe(2);
    });

    test('beat strip should not show unified-chip (old strip is gone)', async ({ page }) => {
        await page.click('text=Exercise 1 - Aaroh/Avaroh');
        await page.click('.btn-start');
        await expect(page.locator('.unified-chip')).toHaveCount(0);
    });
});
