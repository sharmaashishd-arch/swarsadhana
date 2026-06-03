/**
 * E2E Tests for Alankar exercises (1–22).
 * Asserts each alankar appears in the Alankar category list and opens to a
 * detail view with rendered swar phrases.
 */
import { test, expect } from '@playwright/test';

const ALANKAR_NUMBERS = Array.from({ length: 22 }, (_, i) => i + 1);

test.describe('Alankars', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.click('#audio-status');
        await page.waitForSelector('.exercise-card', { timeout: 15000 });
        await page.click('text=Alankar');
        await page.waitForSelector('.exercise-card', { timeout: 5000 });
    });

    test('Alankar category lists at least 22 exercises', async ({ page }) => {
        const count = await page.locator('.exercise-card').count();
        expect(count).toBeGreaterThanOrEqual(22);
    });

    for (const n of ALANKAR_NUMBERS) {
        test(`Alankar ${n} is browsable and opens to detail`, async ({ page }) => {
            const card = page.locator('.exercise-card', { hasText: `Alankar ${n}:` }).first();
            await expect(card).toBeVisible();
            await card.click();
            await expect(page.locator('.exercise-detail')).toBeVisible();
            await expect(page.locator('.swar-phrases').first()).toBeVisible();
            const swarCount = await page.locator('.swar-phrases .swar').count();
            expect(swarCount).toBeGreaterThan(0);
        });
    }
});
