const { test, expect } = require('@playwright/test');

test.describe('Home Page Tests', () => {
  test('should load home page successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check that the body is visible
    await expect(page.locator('body')).toBeVisible();
    
    // Check that the page has a title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});
