import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Generate Report Assets', () => {
  const assetDir = path.join(__dirname, '..', 'report_assets');
  const testEmail = `report_user_${Date.now()}@example.com`;
  const testPass  = 'TestReport123!';

  test.beforeAll(async () => {
    if (!fs.existsSync(assetDir)) {
      fs.mkdirSync(assetDir);
    }
  });

  test('capture all major pages for final report', async ({ page }) => {
    // 1. Registration
    await page.goto('/register');
    await page.getByPlaceholder('Jane Doe').fill('Report Generator');
    await page.getByPlaceholder('jane@school.edu').fill(testEmail);
    await page.getByPlaceholder('Create a strong password').fill(testPass);
    await page.getByPlaceholder('Re-enter your password').fill(testPass);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*login/);
    await page.screenshot({ path: path.join(assetDir, '00_registration.png'), fullPage: true });

    // 2. Login
    await page.getByPlaceholder('you@school.edu').fill(testEmail);
    await page.getByPlaceholder('••••••••').fill(testPass);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*dashboard/);
    await page.waitForTimeout(2000); 
    await page.screenshot({ path: path.join(assetDir, '01_dashboard.png'), fullPage: true });

    // 3. Student Management (Label: "Student List")
    await page.getByRole('link', { name: 'Student List' }).click();
    await page.waitForTimeout(1500);
    await expect(page.locator('h1')).toContainText('Student roster');
    await page.screenshot({ path: path.join(assetDir, '02_student_management.png'), fullPage: true });

    // 4. Analytics (Label: "Analytics")
    await page.getByRole('link', { name: 'Analytics' }).click();
    await page.waitForTimeout(3000); // Wait for charts
    await expect(page.locator('h1')).toContainText('Analytics & Progress');
    await page.screenshot({ path: path.join(assetDir, '03_analytics.png'), fullPage: true });

    // 5. Interventions (Label: "Interventions")
    await page.getByRole('link', { name: 'Interventions' }).click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(assetDir, '04_interventions.png'), fullPage: true });

    // 6. Screening Setup
    await page.goto('/screening/adaptive');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(assetDir, '05_screening_setup.png'), fullPage: true });
    
    console.log(`Successfully generated report assets in: ${assetDir}`);
  });
});
