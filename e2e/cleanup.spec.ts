import { expect, test, type Page } from '@playwright/test';

// All tests run against the in-memory mock calendar (src/google/mockApi.ts).

async function scan(page: Page) {
  await page.goto('./?mock');
  await page.getByRole('button', { name: 'Sign in (mock)' }).click();
  await page.getByRole('button', { name: 'Scan calendar' }).click();
  await expect(page.getByText(/entries loaded/)).toBeVisible();
}

test('US-1: removes duplicate entries and keeps one copy', async ({ page }) => {
  await scan(page);
  const panel = page.getByTestId('duplicates-panel');
  await expect(panel.getByText('2 groups, 3 duplicates.')).toBeVisible();
  await expect(panel.getByTestId('selected-count')).toHaveText('3');

  await panel.getByRole('button', { name: 'Delete selected' }).click();
  await panel.getByRole('button', { name: /Really delete 3/ }).click();

  await expect(panel.getByRole('status')).toHaveText('Deleted 3 events.');
  await expect(panel.getByTestId('empty')).toBeVisible();
});

test('US-1: deselected duplicates are not deleted', async ({ page }) => {
  await scan(page);
  const panel = page.getByTestId('duplicates-panel');
  await panel.getByRole('button', { name: 'Select none' }).click();
  await panel.getByRole('checkbox', { name: 'Select Dentist' }).check();
  await panel.getByRole('button', { name: 'Delete selected' }).click();
  await panel.getByRole('button', { name: /Really delete 1/ }).click();
  await expect(panel.getByText('1 group, 2 duplicates.')).toBeVisible();
});

test('US-2: removes expired entries but keeps running and infinite series', async ({ page }) => {
  await scan(page);
  await page.getByRole('tab', { name: 'Expired' }).click();
  const panel = page.getByTestId('expired-panel');

  // 2× Dentist, Old conference, Old trip, finished Weekly standup series
  await expect(panel.getByText('5 expired entries.')).toBeVisible();
  await expect(panel.getByText('Forever weekly')).toHaveCount(0);
  await expect(panel.getByText('Future party')).toHaveCount(0);

  await panel.getByRole('button', { name: 'Delete selected' }).click();
  await panel.getByRole('button', { name: /Really delete 5/ }).click();
  await expect(panel.getByTestId('empty')).toBeVisible();
});

test('US-2: a backup can be downloaded before deleting', async ({ page }) => {
  await scan(page);
  await page.getByRole('tab', { name: 'Expired' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download backup' }).click();
  expect((await download).suggestedFilename()).toMatch(/^calendar-cleaner-backup-.*\.json$/);
});

test('cancelling the confirmation deletes nothing', async ({ page }) => {
  await scan(page);
  const panel = page.getByTestId('duplicates-panel');
  await panel.getByRole('button', { name: 'Delete selected' }).click();
  await panel.getByRole('button', { name: 'Cancel' }).click();
  await expect(panel.getByText('2 groups, 3 duplicates.')).toBeVisible();
});
