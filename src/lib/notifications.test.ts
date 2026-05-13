/**
 * src/lib/notifications.test.ts
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

import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { requestNotificationPermission, showTimerNotification } from './notifications';

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('requestNotificationPermission returns the existing permission when already decided', async () => {
  Object.defineProperty(window, 'Notification', {
    value: Object.assign(vi.fn(), {
      permission: 'granted',
      requestPermission: vi.fn(),
    }),
    configurable: true,
  });

  await expect(requestNotificationPermission()).resolves.toBe('granted');
});

test('requestNotificationPermission supports the promise form', async () => {
  const requestPermissionMock = vi.fn(async () => 'granted' as NotificationPermission);
  Object.defineProperty(window, 'Notification', {
    value: Object.assign(vi.fn(), {
      permission: 'default',
      requestPermission: requestPermissionMock,
    }),
    configurable: true,
  });

  await expect(requestNotificationPermission()).resolves.toBe('granted');
  expect(requestPermissionMock).toHaveBeenCalledTimes(1);
});

test('showTimerNotification prefers the service worker registration when available', async () => {
  const showNotification = vi.fn(async () => undefined);
  Object.defineProperty(window, 'Notification', {
    value: Object.assign(vi.fn(), {
      permission: 'granted',
      requestPermission: vi.fn(),
    }),
    configurable: true,
  });
  Object.defineProperty(window.navigator, 'serviceWorker', {
    value: {
      getRegistration: vi.fn(async () => ({ showNotification })),
    },
    configurable: true,
  });

  await expect(
    showTimerNotification({
      title: 'Timer Finished',
      body: 'Your countdown timer has ended.',
      icon: '/icon.png',
    }),
  ).resolves.toBe(true);

  expect(showNotification).toHaveBeenCalledWith('Timer Finished', {
    body: 'Your countdown timer has ended.',
    icon: '/icon.png',
  });
});

test('showTimerNotification falls back to the Notification constructor', async () => {
  const NotificationSpy = vi.fn();
  Object.defineProperty(window, 'Notification', {
    value: Object.assign(NotificationSpy, {
      permission: 'granted',
      requestPermission: vi.fn(),
    }),
    configurable: true,
  });
  Object.defineProperty(window.navigator, 'serviceWorker', {
    value: {
      getRegistration: vi.fn(async () => null),
    },
    configurable: true,
  });

  await expect(
    showTimerNotification({
      title: 'Timer Finished',
      body: 'Your countdown timer has ended.',
      icon: '/icon.png',
    }),
  ).resolves.toBe(true);

  expect(NotificationSpy).toHaveBeenCalledWith('Timer Finished', {
    body: 'Your countdown timer has ended.',
    icon: '/icon.png',
  });
});
