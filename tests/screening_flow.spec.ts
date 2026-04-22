import { test, expect } from '@playwright/test';

test.describe('Screening & Results Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByPlaceholder('you@school.edu').fill('sanskritiagrawale@gmail.com');
    await page.getByPlaceholder('••••••••').fill('Sanskriti@123');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should navigate to student management and start screening', async ({ page }) => {
    // Navigate to student management via sidebar
    await page.getByRole('link', { name: 'Student List' }).click();
    await expect(page.getByRole('heading', { name: 'Student roster' })).toBeVisible();
    
    // Find "Start Screening" button for a student (assuming there is one)
    // We'll target the first visible screening button
    const startBtn = page.getByRole('button', { name: 'Start Screening' }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await expect(page).toHaveURL(/.*adaptive-screening/);
      
      // Verify gateway question load
      await expect(page.locator('h2')).toContainText('Question 1 of 20');
      await expect(page.locator('div[style*="background: #EEF2FF"]')).toBeVisible(); // Domain indicator
    }
  });

  test('should verify dynamic analytics page', async ({ page }) => {
    await page.getByRole('link', { name: 'Analytics' }).click();
    await expect(page.getByRole('heading', { name: 'Analytics & Progress' })).toBeVisible();
    
    // Verify charts are rendered (canvases or svg)
    await expect(page.locator('canvas, svg').first()).toBeVisible();
    
    // Check for "Modern" stats section
    await expect(page.locator('div[style*="background: white"]')).toHaveCount(4); // Stat cards
  });
});
