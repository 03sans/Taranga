import { test, expect } from '@playwright/test';

test.describe('Full Authentication & Onboarding Flow', () => {
  const testEmail = `e2e_${Date.now()}@example.com`;
  const testPass  = 'TestPass123!';

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', err => console.error('BROWSER_ERROR:', err.message));
  });

  test('should register and login as a new teacher', async ({ page }) => {
    // 1. Registration
    await page.goto('/register');
    await page.getByPlaceholder('Jane Doe').fill('E2E Test Teacher');
    await page.getByPlaceholder('jane@school.edu').fill(testEmail);
    await page.getByPlaceholder('Create a strong password').fill(testPass);
    await page.getByPlaceholder('Re-enter your password').fill(testPass);
    await page.selectOption('select[name="role"]', 'teacher');
    await page.locator('button[type="submit"]').click();

    // 2. Automated redirect to login
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByText('Account created! Please sign in.', { exact: false })).toBeVisible();

    // 3. Login with new credentials
    await page.getByPlaceholder('you@school.edu').fill(testEmail);
    await page.getByPlaceholder('••••••••').fill(testPass);
    await page.locator('button[type="submit"]').click();

    // 4. Verification
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('aside')).toBeVisible();
    
    console.log(`Verified new user: ${testEmail}`);
  });

  test('should load login page branding correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toHaveText('Taranga');
    await expect(page.locator('h2')).toContainText('Sign in');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('you@school.edu').fill('invalid@nonexistent.edu');
    await page.getByPlaceholder('••••••••').fill('WrongPassword123');
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText('Invalid credentials', { exact: false })).toBeVisible();
  });
});
