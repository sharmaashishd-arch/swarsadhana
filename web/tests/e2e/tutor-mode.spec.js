/**
 * E2E Tests for Sadhana Exercise Flow
 * Tests the full user flow: browse -> select -> modes -> self-test
 */

import { test, expect } from '@playwright/test';

test.describe('Exercise Browser', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.click('#audio-status');
        await page.waitForSelector('.exercise-card', { timeout: 15000 });
    });

    test('landing page shows exercises directly', async ({ page }) => {
        await expect(page.locator('.exercise-browser')).toBeVisible();
        await expect(page.locator('text=Exercise Library')).toBeVisible();
    });

    test('Instruments tab is not visible', async ({ page }) => {
        await expect(page.locator('.main-nav')).toHaveCount(0);
        await expect(page.locator('.nav-tab')).toHaveCount(0);
    });

    test('should display exercise categories', async ({ page }) => {
        await expect(page.locator('text=Basic Sargam')).toBeVisible();
        await expect(page.locator('text=Janti Swaras')).toBeVisible();
        await expect(page.locator('text=Alankar')).toBeVisible();
    });

    test('should open exercise detail view', async ({ page }) => {
        await page.click('text=Exercise 1 - Aaroh/Avaroh');
        await expect(page.locator('text=Back to Exercises')).toBeVisible();
        await expect(page.locator('text=Swar Pattern')).toBeVisible();
    });

    test('should display practice mode controls', async ({ page }) => {
        await page.click('text=Exercise 1 - Aaroh/Avaroh');
        await expect(page.locator('.mode-selector')).toBeVisible();
        await expect(page.locator('.btn-start')).toBeVisible();
        await expect(page.locator('#tanpura-toggle')).toBeVisible();
        await expect(page.locator('#tabla-toggle')).toBeVisible();
    });

    test('should show demo and practice buttons', async ({ page }) => {
        await page.click('text=Exercise 1 - Aaroh/Avaroh');
        await expect(page.locator('.mode-selector')).toBeVisible();
        await expect(page.locator('.btn-start')).toBeVisible();
    });

    test('should show speed (subdivision) controls', async ({ page }) => {
        await page.click('text=Exercise 1 - Aaroh/Avaroh');
        await expect(page.locator('.subdivision-control label')).toContainText('Speed');
        const buttons = page.locator('#subdivision-selector button');
        await expect(buttons).toHaveCount(3);
    });

    test('should run self-test programmatically and show results', async ({ page }) => {
        await page.click('text=Exercise 1 - Aaroh/Avaroh');
        await page.waitForFunction(() => window.robotGurujiUI, { timeout: 10000 });
        await page.evaluate(() => window.robotUI.runSelfTest());

        await page.waitForSelector('.self-test-results', { timeout: 30000 });

        const resultHeader = page.locator('.self-test-results h2');
        await expect(resultHeader).toBeVisible();

        const resultText = await resultHeader.textContent();
        expect(resultText).toMatch(/Self-Test (PASSED|FAILED)/);

        await expect(page.locator('.test-score')).toBeVisible();
    });

    test('should show taal grid for Teentaal exercise', async ({ page }) => {
        await page.click('text=Exercise 1 - Aaroh/Avaroh');
        await expect(page.getByRole('heading', { name: /Teentaal/ })).toBeVisible();
        const beatElements = page.locator('.taal-beat');
        await expect(beatElements.first()).toBeVisible();
    });

    test('should switch between exercise categories', async ({ page }) => {
        await expect(page.locator('.category-tab.active')).toContainText('Basic Sargam');
        await page.click('text=Janti Swaras');
        await expect(page.locator('.category-tab.active')).toContainText('Janti Swaras');
    });

    test('should show exercises for all categories', async ({ page }) => {
        await expect(page.locator('.exercise-card').first()).toBeVisible();
        const basicCount = await page.locator('.exercise-card').count();
        expect(basicCount).toBeGreaterThanOrEqual(5);

        await page.click('text=Janti Swaras');
        await expect(page.locator('.exercise-card').first()).toBeVisible();
        const jantiCount = await page.locator('.exercise-card').count();
        expect(jantiCount).toBeGreaterThanOrEqual(3);

        await page.click('text=Alankar');
        await expect(page.locator('.exercise-card').first()).toBeVisible();
        const alankarCount = await page.locator('.exercise-card').count();
        expect(alankarCount).toBeGreaterThanOrEqual(3);

        await expect(page.locator('.no-exercises')).not.toBeVisible();
    });

    test('should navigate back from exercise detail', async ({ page }) => {
        await page.click('text=Exercise 1 - Aaroh/Avaroh');
        await page.click('text=Back to Exercises');
        await expect(page.locator('.exercise-browser')).toBeVisible();
    });
});

test.describe('Practice Setup (Settings)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.click('#audio-status');
        await page.waitForSelector('.exercise-card', { timeout: 15000 });
    });

    test('gear icon opens Practice Setup modal', async ({ page }) => {
        await page.click('button:has-text("⚙️")');
        await expect(page.locator('#practice-setup-overlay')).toBeVisible();
        await expect(page.locator('text=Practice Setup')).toBeVisible();
    });

    test('Practice Setup has Sa key picker', async ({ page }) => {
        await page.click('button:has-text("⚙️")');
        await expect(page.locator('#key-select')).toBeVisible();
    });

    test('Practice Setup has BPM slider defaulting to 90', async ({ page }) => {
        await page.click('button:has-text("⚙️")');
        await expect(page.locator('#settings-tempo-slider')).toBeVisible();
        await expect(page.locator('#settings-tempo-value')).toContainText('90');
    });

    test('Practice Setup has tanpura pattern controls', async ({ page }) => {
        await page.click('button:has-text("⚙️")');
        await expect(page.locator('.string-btn:has-text("Pa-Sa")')).toBeVisible();
        await expect(page.locator('.string-btn:has-text("Ma-Sa")')).toBeVisible();
    });

    test('Practice Setup has tabla taal controls', async ({ page }) => {
        await page.click('button:has-text("⚙️")');
        await expect(page.locator('#settings-taal-options')).toBeVisible();
    });

    test('Practice Setup has collapsed Diagnostics section', async ({ page }) => {
        await page.click('button:has-text("⚙️")');
        await expect(page.locator('.diagnostics-toggle')).toBeVisible();
        await expect(page.locator('#diagnostics-panel')).not.toBeVisible();
    });

    test('Diagnostics section expands to show Test Audio', async ({ page }) => {
        await page.click('button:has-text("⚙️")');
        await page.click('.diagnostics-toggle');
        await expect(page.locator('#diagnostics-panel')).toBeVisible();
        await expect(page.locator('button:has-text("Play Test Tone")')).toBeVisible();
    });

    test('closing Practice Setup returns to exercises', async ({ page }) => {
        await page.click('button:has-text("⚙️")');
        await expect(page.locator('#practice-setup-overlay')).toBeVisible();
        await page.click('.settings-close-btn');
        await expect(page.locator('#practice-setup-overlay')).not.toBeVisible();
        await expect(page.locator('.exercise-browser')).toBeVisible();
    });
});

test.describe('Self-Test Validation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.click('#audio-status');
        await page.waitForSelector('.exercise-card', { timeout: 15000 });
    });

    test('should pass self-test with acceptable score', async ({ page }) => {
        await page.click('text=Exercise 1 - Aaroh/Avaroh');
        await page.waitForFunction(() => window.robotGurujiUI, { timeout: 10000 });
        await page.evaluate(() => window.robotUI.runSelfTest());

        await page.waitForSelector('.self-test-results', { timeout: 30000 });

        const scoreElement = page.locator('.test-score .score');
        const scoreText = await scoreElement.textContent();
        const score = parseInt(scoreText.replace('%', ''));

        expect(score).toBeGreaterThanOrEqual(50);
    });

    test('should display detection summary in self-test', async ({ page }) => {
        await page.click('text=Exercise 1 - Aaroh/Avaroh');
        await page.waitForFunction(() => window.robotGurujiUI, { timeout: 10000 });
        await page.evaluate(() => window.robotUI.runSelfTest());

        await page.waitForSelector('.self-test-results', { timeout: 30000 });

        await expect(page.locator('text=Detection Summary')).toBeVisible();
        await expect(page.locator('text=Expected swars:')).toBeVisible();
        await expect(page.locator('text=Detected pitches:')).toBeVisible();
        await expect(page.locator('text=Matched:')).toBeVisible();
    });

    test('should show score breakdown in self-test', async ({ page }) => {
        await page.click('text=Exercise 1 - Aaroh/Avaroh');
        await page.waitForFunction(() => window.robotGurujiUI, { timeout: 10000 });
        await page.evaluate(() => window.robotUI.runSelfTest());

        await page.waitForSelector('.self-test-results', { timeout: 30000 });

        await expect(page.locator('.score-breakdown')).toBeVisible();
        await expect(page.locator('text=Pitch:')).toBeVisible();
        await expect(page.locator('text=Timing:')).toBeVisible();
    });
});
