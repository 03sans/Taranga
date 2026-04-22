import { test, expect } from '@playwright/test';

test('setup test user via registration', async ({ page }) => {
  await page.goto('/register');
  
  const uniqueEmail = `test_teacher_${Date.now()}@example.com`;
  
  await page.getByPlaceholder('Jane Doe').fill('E2E Test Teacher');
  await page.getByPlaceholder('jane@school.edu').fill(uniqueEmail);
  await page.getByPlaceholder('Create a strong password').fill('TestPass123!');
  await page.getByPlaceholder('Re-enter your password').fill('TestPass123!');
  await page.selectOption('select[name="role"]', 'teacher');
  
  await page.locator('button[type="submit"]').click();
  
  // Should redirect to login with success message
  await expect(page).toHaveURL(/.*login/);
  await expect(page.getByText('Account created! Please sign in.', { exact: false })).toBeVisible();
  
  // Log the email so we can use it in subsequent tests if needed
  console.log(`REGISTERED_TEST_USER: ${uniqueEmail}`);
});
