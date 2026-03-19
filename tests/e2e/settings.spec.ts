/**
 * tests/e2e/settings.spec.ts
 *
 * YACT Copyright (C) 2026 Wojciech Polak
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 3 of the License, or (at your
 * option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { expect, test } from '@playwright/test';
import { freezeTime, seedLocalStorage } from './helpers';

test('settings page shows the toggles and returns to the home route with the same hash', async ({
  page,
}) => {
  await seedLocalStorage(page, {
    hours: '1',
    minutes: '2',
    seconds: '3',
    repeat: 'true',
    active: 'false',
    countUp: 'true',
    countToTime: 'false',
    playEndSound: 'true',
    playLastTenSecondsSound: 'true',
    showNotifications: 'false',
    updateTitle: 'true',
  });

  await page.goto('/settings#hours=1&minutes=2&seconds=3&repeat=true&active=false');

  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await expect(page.getByRole('switch', { name: 'Count up when timer ends' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(
    page.getByRole('switch', { name: 'Show notifications when timer ends' }),
  ).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByRole('switch', { name: 'Play sound when timer ends' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(
    page.getByRole('switch', { name: 'Play sound at each of the last 10 seconds' }),
  ).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('switch', { name: 'Update title' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.getByRole('link', { name: 'Back' })).toHaveAttribute(
    'href',
    '/#hours=1&minutes=2&seconds=3&repeat=true&active=false',
  );

  await page.getByRole('switch', { name: 'Show notifications when timer ends' }).click();

  await expect
    .poll(async () => page.evaluate(() => window.localStorage.getItem('showNotifications')))
    .toBe('true');

  await page.getByRole('link', { name: 'Back' }).click();
  await expect(page).toHaveURL(/\/#hours=1&minutes=2&seconds=3&repeat=true&active=false$/);
});

test('settings back link preserves target mode when count-to-time is enabled', async ({ page }) => {
  await freezeTime(page, new Date(2026, 0, 1, 10, 0, 0));
  await seedLocalStorage(page, {
    hours: '10',
    minutes: '5',
    seconds: '0',
    repeat: 'false',
    active: 'false',
    countToTime: 'true',
    countUp: 'true',
    playEndSound: 'true',
    playLastTenSecondsSound: 'true',
    showNotifications: 'false',
    updateTitle: 'true',
  });

  await page.goto('/settings#hours=10&minutes=5&seconds=0&repeat=false&active=false');

  await expect(page.getByRole('link', { name: 'Back' })).toHaveAttribute(
    'href',
    '/#hours=10&minutes=5&seconds=0&repeat=false&active=false&mode=target',
  );
});

test('settings page persists multiple preference switches and theme state', async ({ page }) => {
  await seedLocalStorage(page, {
    hours: '0',
    minutes: '1',
    seconds: '0',
    repeat: 'false',
    active: 'false',
    countUp: 'true',
    countToTime: 'false',
    playEndSound: 'true',
    playLastTenSecondsSound: 'true',
    showNotifications: 'false',
    updateTitle: 'true',
  });

  await page.goto('/settings');

  await page.getByRole('switch', { name: 'Count up when timer ends' }).click();
  await page.getByRole('switch', { name: 'Play sound when timer ends' }).click();
  await page.getByRole('switch', { name: 'Update title' }).click();
  await page.getByRole('switch', { name: 'Use dark theme' }).click();

  await expect
    .poll(async () => page.evaluate(() => window.localStorage.getItem('countUp')))
    .toBe('false');
  await expect
    .poll(async () => page.evaluate(() => window.localStorage.getItem('playEndSound')))
    .toBe('false');
  await expect
    .poll(async () => page.evaluate(() => window.localStorage.getItem('updateTitle')))
    .toBe('false');
  await expect(page.locator('html')).toHaveClass(/dark/);
});

test('settings page can toggle every app preference switch', async ({ page }) => {
  await seedLocalStorage(page, {
    hours: '0',
    minutes: '1',
    seconds: '0',
    repeat: 'false',
    active: 'false',
    countUp: 'true',
    countToTime: 'false',
    playEndSound: 'true',
    playLastTenSecondsSound: 'true',
    showNotifications: 'false',
    updateTitle: 'true',
  });

  await page.goto('/settings');

  const countUp = page.getByRole('switch', { name: 'Count up when timer ends' });
  const notifications = page.getByRole('switch', { name: 'Show notifications when timer ends' });
  const endSound = page.getByRole('switch', { name: 'Play sound when timer ends' });
  const lastTen = page.getByRole('switch', { name: 'Play sound at each of the last 10 seconds' });
  const updateTitle = page.getByRole('switch', { name: 'Update title' });

  await countUp.click();
  await notifications.click();
  await endSound.click();
  await lastTen.click();
  await updateTitle.click();

  await expect(countUp).toHaveAttribute('aria-checked', 'false');
  await expect(notifications).toHaveAttribute('aria-checked', 'true');
  await expect(endSound).toHaveAttribute('aria-checked', 'false');
  await expect(lastTen).toHaveAttribute('aria-checked', 'false');
  await expect(updateTitle).toHaveAttribute('aria-checked', 'false');

  await expect
    .poll(async () => page.evaluate(() => window.localStorage.getItem('countUp')))
    .toBe('false');
  await expect
    .poll(async () => page.evaluate(() => window.localStorage.getItem('showNotifications')))
    .toBe('true');
  await expect
    .poll(async () => page.evaluate(() => window.localStorage.getItem('playEndSound')))
    .toBe('false');
  await expect
    .poll(async () => page.evaluate(() => window.localStorage.getItem('playLastTenSecondsSound')))
    .toBe('false');
  await expect
    .poll(async () => page.evaluate(() => window.localStorage.getItem('updateTitle')))
    .toBe('false');
});

test('settings page can toggle the dark theme switch', async ({ page }) => {
  await page.goto('/settings');

  const darkThemeSwitch = page.getByRole('switch', { name: 'Use dark theme' });
  await darkThemeSwitch.click();

  await expect(darkThemeSwitch).toHaveAttribute('aria-checked', 'true');
});

test('settings page can switch between system and dark themes', async ({ page }) => {
  await seedLocalStorage(page, {
    theme: 'system',
    hours: '0',
    minutes: '1',
    seconds: '0',
    repeat: 'false',
    active: 'false',
    countUp: 'true',
    countToTime: 'false',
    playEndSound: 'true',
    playLastTenSecondsSound: 'true',
    showNotifications: 'false',
    updateTitle: 'true',
  });

  await page.goto('/settings');

  const systemThemeSwitch = page.getByRole('switch', { name: 'Use system theme' });
  const darkThemeSwitch = page.getByRole('switch', { name: 'Use dark theme' });

  await expect(systemThemeSwitch).toHaveAttribute('aria-checked', 'true');

  await darkThemeSwitch.click();
  await expect(darkThemeSwitch).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('html')).toHaveClass(/dark/);
});
