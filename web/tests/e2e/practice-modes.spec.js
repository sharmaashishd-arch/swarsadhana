/**
 * E2E Tests for Practice Modes
 */
import { test, expect } from '@playwright/test';

test.describe('Practice Modes', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.click('#audio-status');
        await page.waitForSelector('.exercise-card', { timeout: 15000 });
        await page.click('text=Exercise 1 - Aaroh/Avaroh');
    });

    test('Sing Along is selected by default', async ({ page }) => {
        const activeMode = page.locator('.mode-btn.active');
        await expect(activeMode).toHaveAttribute('data-mode', 'singAlong');
        await expect(activeMode).toContainText('Sing Along');
    });

    test('mode selector has 3 modes', async ({ page }) => {
        const modeButtons = page.locator('.mode-btn');
        await expect(modeButtons).toHaveCount(3);
    });

    test('can switch to Guided Practice', async ({ page }) => {
        await page.locator('.mode-btn[data-mode="guidedPractice"]').click();
        const activeMode = page.locator('.mode-btn.active');
        await expect(activeMode).toHaveAttribute('data-mode', 'guidedPractice');
    });

    test('can switch to Self Practice', async ({ page }) => {
        await page.locator('.mode-btn[data-mode="selfPractice"]').click();
        const activeMode = page.locator('.mode-btn.active');
        await expect(activeMode).toHaveAttribute('data-mode', 'selfPractice');
    });

    test('old Watch Demo button is not visible', async ({ page }) => {
        const demoBtn = page.locator('button', { hasText: 'Watch Demo' });
        await expect(demoBtn).toHaveCount(0);
    });

    test('old Practice with Robot button is not visible', async ({ page }) => {
        const practiceBtn = page.locator('button', { hasText: 'Practice with Robot' });
        await expect(practiceBtn).toHaveCount(0);
    });

    test('old Guruji Tutor Mode section is not visible', async ({ page }) => {
        const tutorSection = page.locator('.tutor-mode-section');
        await expect(tutorSection).toHaveCount(0);
    });

    test('has single Start button', async ({ page }) => {
        const startBtn = page.locator('.btn-start');
        await expect(startBtn).toBeVisible();
        await expect(startBtn).toContainText('Start');
    });

    test('accompaniment toggles are visible', async ({ page }) => {
        const tanpuraToggle = page.locator('#tanpura-toggle');
        const tablaToggle = page.locator('#tabla-toggle');
        await expect(tanpuraToggle).toBeVisible();
        await expect(tablaToggle).toBeVisible();
    });

    test('tanpura toggle starts as ON', async ({ page }) => {
        const tanpuraToggle = page.locator('#tanpura-toggle');
        await expect(tanpuraToggle).toHaveClass(/on/);
        await expect(tanpuraToggle).toContainText('ON');
    });

    test('tabla toggle starts as ON', async ({ page }) => {
        const tablaToggle = page.locator('#tabla-toggle');
        await expect(tablaToggle).toHaveClass(/on/);
        await expect(tablaToggle).toContainText('ON');
    });

    test('clicking tanpura toggle switches to OFF', async ({ page }) => {
        const tanpuraToggle = page.locator('#tanpura-toggle');
        await tanpuraToggle.click();
        await expect(tanpuraToggle).toHaveClass(/off/);
        await expect(tanpuraToggle).toContainText('OFF');
    });

    test('clicking tabla toggle switches to OFF', async ({ page }) => {
        const tablaToggle = page.locator('#tabla-toggle');
        await tablaToggle.click();
        await expect(tablaToggle).toHaveClass(/off/);
        await expect(tablaToggle).toContainText('OFF');
    });

    test('exercise displays BPM 80', async ({ page }) => {
        const tempoValue = page.locator('#session-tempo-value');
        await expect(tempoValue).toContainText('80');
    });

    test('start Sing Along shows session view', async ({ page }) => {
        await page.locator('.btn-start').click();
        await page.waitForSelector('.robot-session', { timeout: 5000 });
        const session = page.locator('.robot-session');
        await expect(session).toBeVisible();
    });

    test('Sing Along session shows correct status', async ({ page }) => {
        await page.locator('.btn-start').click();
        await page.waitForSelector('.robot-session', { timeout: 5000 });
        await page.waitForTimeout(500);
        const statusText = page.locator('.status-text');
        const text = await statusText.textContent();
        expect(['Count in...', 'Sing Along...'].some(s => text.includes(s))).toBeTruthy();
    });

    test('Guided Practice shows demoPhase status', async ({ page }) => {
        await page.locator('.mode-btn[data-mode="guidedPractice"]').click();
        await page.locator('.btn-start').click();
        await page.waitForSelector('.robot-session', { timeout: 5000 });
        await page.waitForTimeout(500);
        const statusText = page.locator('.status-text');
        const text = await statusText.textContent();
        expect(['Count in...', 'Watch & Listen...'].some(s => text.includes(s))).toBeTruthy();
    });

    test('Self Practice shows correct status', async ({ page }) => {
        await page.locator('.mode-btn[data-mode="selfPractice"]').click();
        await page.locator('.btn-start').click();
        await page.waitForSelector('.robot-session', { timeout: 5000 });
        await page.waitForTimeout(500);
        const statusText = page.locator('.status-text');
        const text = await statusText.textContent();
        expect(['Count in...', 'Self Practice...'].some(s => text.includes(s))).toBeTruthy();
    });
});
