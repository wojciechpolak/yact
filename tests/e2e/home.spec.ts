/**
 * tests/e2e/home.spec.ts
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

test('home page loads with the default timer controls', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('timer')).toHaveText('00:01:00');
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();
  await expect(page.getByRole('switch', { name: 'Repeat' })).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByRole('link', { name: 'Settings' })).toHaveAttribute(
    'href',
    '/settings#hours=0&minutes=1&seconds=0&repeat=false&active=false',
  );
});

test('home page hydrates timer state from localStorage', async ({ page }) => {
  await seedLocalStorage(page, {
    hours: '0',
    minutes: '2',
    seconds: '5',
    repeat: 'true',
    active: 'false',
  });

  await page.goto('/');

  await expect(page.getByRole('timer')).toHaveText('00:02:05');
  await expect(page.getByRole('switch', { name: 'Repeat' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('link', { name: 'Settings' })).toHaveAttribute(
    'href',
    '/settings#hours=0&minutes=2&seconds=5&repeat=true&active=false',
  );
});

test('home page prefers hash parameters over localStorage', async ({ page }) => {
  await seedLocalStorage(page, {
    hours: '0',
    minutes: '9',
    seconds: '9',
    repeat: 'false',
    active: 'false',
  });

  await page.goto('/#hours=0&minutes=3&seconds=5&repeat=true&active=false');

  await expect(page.getByRole('timer')).toHaveText('00:03:05');
  await expect(page.getByRole('switch', { name: 'Repeat' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('link', { name: 'Settings' })).toHaveAttribute(
    'href',
    '/settings#hours=0&minutes=3&seconds=5&repeat=true&active=false',
  );
});

test('home page shows target mode in the settings link when count-to-time is enabled', async ({ page }) => {
  await freezeTime(page, new Date(2026, 0, 1, 10, 0, 0));
  await seedLocalStorage(page, {
    hours: '10',
    minutes: '5',
    seconds: '0',
    repeat: 'false',
    active: 'false',
    countToTime: 'true',
  });

  await page.goto('/');

  await expect(page.getByRole('timer')).toHaveText('00:05:00');
  await expect(page.getByRole('link', { name: 'Settings' })).toHaveAttribute(
    'href',
    '/settings#hours=10&minutes=5&seconds=0&repeat=false&active=false',
  );
});

test('repeat toggle updates the settings hash link', async ({ page }) => {
  await page.goto('/');

  const repeatSwitch = page.getByRole('switch', { name: 'Repeat' });
  await repeatSwitch.click();

  await expect(repeatSwitch).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('link', { name: 'Settings' })).toHaveAttribute(
    'href',
    '/settings#hours=0&minutes=1&seconds=0&repeat=true&active=false',
  );
});

test('space bar starts and pauses the timer', async ({ page }) => {
  await page.goto('/');

  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();

  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
});

test('enter key opens the timer editor', async ({ page }) => {
  await page.goto('/');

  const timer = page.getByRole('timer');
  await timer.focus();
  await timer.press('Enter');

  await expect(page.getByRole('heading', { name: 'Set Time' })).toBeVisible();
});

test('start, pause, and reset controls update the visible state', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();

  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();

  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('button', { name: 'Reset' }).click();

  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
});

test('a short running timer reaches zero and stops automatically', async ({ page }) => {
  await seedLocalStorage(page, {
    hours: '0',
    minutes: '0',
    seconds: '2',
    countUp: 'false',
    repeat: 'false',
    active: 'false',
    playEndSound: 'false',
    playLastTenSecondsSound: 'false',
  });

  await page.goto('/');

  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();

  await expect(page.getByRole('timer')).toHaveText('00:00:01', { timeout: 2500 });
  await expect(page.getByRole('timer')).toHaveText('00:00:00', { timeout: 3500 });
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
});

test('count-up mode continues counting past zero', async ({ page }) => {
  await seedLocalStorage(page, {
    hours: '0',
    minutes: '0',
    seconds: '1',
    countUp: 'true',
    repeat: 'false',
    active: 'false',
    playEndSound: 'false',
    playLastTenSecondsSound: 'false',
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Start' }).click();

  await expect(page.getByRole('timer')).toHaveText('+00:00:01', { timeout: 3500 });
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
});

test('repeat mode restarts a fixed-duration countdown automatically', async ({ page }) => {
  await seedLocalStorage(page, {
    hours: '0',
    minutes: '0',
    seconds: '1',
    countUp: 'false',
    repeat: 'true',
    active: 'false',
    playEndSound: 'false',
    playLastTenSecondsSound: 'false',
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Start' }).click();

  await expect(page.getByRole('timer')).toHaveText('00:00:01', { timeout: 2500 });
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
});

test('count-to-time mode counts down to the next clock occurrence', async ({ page }) => {
  await freezeTime(page, new Date(2026, 0, 1, 10, 0, 0));
  await seedLocalStorage(page, {
    hours: '10',
    minutes: '5',
    seconds: '0',
    repeat: 'false',
    active: 'false',
    countToTime: 'true',
    playEndSound: 'false',
    playLastTenSecondsSound: 'false',
  });

  await page.goto('/');

  await expect(page.getByRole('timer')).toHaveText('00:05:00');
});

test('opening the timer editor updates the saved timer duration', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('timer').click();
  await expect(page.getByRole('heading', { name: 'Set Time' })).toBeVisible();

  const inputs = page.getByRole('spinbutton');
  await inputs.nth(0).fill('0');
  await inputs.nth(1).fill('2');
  await inputs.nth(2).fill('30');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('timer')).toHaveText('00:02:30');
  await expect(page.getByRole('link', { name: 'Settings' })).toHaveAttribute(
    'href',
    '/settings#hours=0&minutes=2&seconds=30&repeat=false&active=false',
  );
});

test('saving a timer with title updates changes the document title and live region', async ({ page }) => {
  await seedLocalStorage(page, {
    updateTitle: 'true',
    countUp: 'true',
  });

  await page.goto('/');
  await page.getByRole('timer').click();

  const inputs = page.getByRole('spinbutton');
  await inputs.nth(0).fill('0');
  await inputs.nth(1).fill('2');
  await inputs.nth(2).fill('30');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page).toHaveTitle('02:30 Countdown | YACT');
  await expect(page.locator('#screen-reader-update')).toHaveText('02:30');
});

test('timer editor target-time mode persists in settings state', async ({ page }) => {
  await seedLocalStorage(page, {
    hours: '0',
    minutes: '1',
    seconds: '0',
    repeat: 'false',
    active: 'false',
    countToTime: 'false',
  });

  await page.goto('/');
  await page.getByRole('timer').click();

  const modeSwitch = page.getByRole('switch', { name: 'Toggle target time mode' });
  await modeSwitch.click();

  await expect(modeSwitch).toHaveAttribute('aria-checked', 'true');
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('countToTime'))).toBe('true');
});

test('timer editor cancel keeps the current timer value unchanged', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('timer').click();
  const inputs = page.getByRole('spinbutton');
  await inputs.nth(1).fill('9');
  await page.getByRole('button', { name: 'Cancel' }).click();

  await expect(page.getByRole('timer')).toHaveText('00:01:00');
});

test('timer editor uses the current value when reopened after a save', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('timer').click();
  let inputs = page.getByRole('spinbutton');
  await inputs.nth(0).fill('0');
  await inputs.nth(1).fill('4');
  await inputs.nth(2).fill('15');
  await page.getByRole('button', { name: 'Save' }).click();

  await page.getByRole('timer').click();
  inputs = page.getByRole('spinbutton');

  await expect(inputs.nth(0)).toHaveValue('0');
  await expect(inputs.nth(1)).toHaveValue('4');
  await expect(inputs.nth(2)).toHaveValue('15');
});

test('fullscreen button enters and exits fullscreen on desktop', async ({ page }) => {
  await page.goto('/');

  const fullscreenButton = page.getByRole('button', { name: 'Full Screen' });
  await expect(fullscreenButton).toBeVisible();

  await fullscreenButton.click();
  await expect.poll(async () => page.evaluate(() => document.fullscreenElement !== null)).toBe(true);

  await fullscreenButton.click();
  await expect.poll(async () => page.evaluate(() => document.fullscreenElement === null)).toBe(true);
});
