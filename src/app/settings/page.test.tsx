/**
 * src/app/settings/page.test.tsx
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

import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import SettingsPage from './page';

const requestNotificationPermissionMock = vi.fn();
const settingsMock = vi.hoisted(() => ({
  countUp: true,
  setCountUp: vi.fn(),
  keepAwake: false,
  setKeepAwake: vi.fn(),
  countToTime: false,
  playEndSound: true,
  setPlayEndSound: vi.fn(),
  playLastTenSecondsSound: true,
  setPlayLastTenSecondsSound: vi.fn(),
  minCooldownForTickSound: 30,
  setMinCooldownForTickSound: vi.fn(),
  showNotifications: false,
  setShowNotifications: vi.fn(),
  updateTitle: true,
  setUpdateTitle: vi.fn(),
  vibrateOnEnd: false,
  setVibrateOnEnd: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: { pathname: string } }) => (
    <a href={href.pathname}>{children}</a>
  ),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));

vi.mock('@/lib/useHashParams', () => ({
  useHashParams: () => new URLSearchParams(),
}));

vi.mock('@/context/SettingsContext', () => ({
  useSettings: () => settingsMock,
}));

vi.mock('@/lib/notifications', () => ({
  requestNotificationPermission: (...args: unknown[]) => requestNotificationPermissionMock(...args),
}));

beforeEach(() => {
  requestNotificationPermissionMock.mockReset();
  settingsMock.showNotifications = false;
  settingsMock.setShowNotifications.mockReset();
  settingsMock.playLastTenSecondsSound = true;
  settingsMock.minCooldownForTickSound = 30;
  settingsMock.setMinCooldownForTickSound.mockReset();
  settingsMock.vibrateOnEnd = false;
  settingsMock.setVibrateOnEnd.mockReset();
  localStorage.clear();
});

afterEach(() => {
  setNavigatorVibrate(undefined);
  cleanup();
});

test('enabling end notifications requests permission and persists only when granted', async () => {
  requestNotificationPermissionMock.mockResolvedValue('granted');

  render(<SettingsPage />);
  fireEvent.click(screen.getByRole('switch', { name: 'Show notifications when timer ends' }));

  await waitFor(() => {
    expect(requestNotificationPermissionMock).toHaveBeenCalledTimes(1);
    expect(settingsMock.setShowNotifications).toHaveBeenCalledWith(true);
  });
});

test('denied notification permission leaves the setting disabled', async () => {
  requestNotificationPermissionMock.mockResolvedValue('denied');

  render(<SettingsPage />);
  fireEvent.click(screen.getByRole('switch', { name: 'Show notifications when timer ends' }));

  await waitFor(() => {
    expect(settingsMock.setShowNotifications).toHaveBeenCalledWith(false);
  });
});

test('disabling end notifications does not request permission', () => {
  settingsMock.showNotifications = true;

  render(<SettingsPage />);
  fireEvent.click(screen.getByRole('switch', { name: 'Show notifications when timer ends' }));

  expect(requestNotificationPermissionMock).not.toHaveBeenCalled();
  expect(settingsMock.setShowNotifications).toHaveBeenCalledWith(false);
});

const setNavigatorVibrate = (impl: ((pattern: number | number[]) => boolean) | undefined) => {
  Object.defineProperty(navigator, 'vibrate', {
    value: impl,
    configurable: true,
    writable: true,
  });
};

test('the vibration switch reflects and updates the setting', async () => {
  setNavigatorVibrate(() => true);

  const { rerender } = render(<SettingsPage />);

  const toggle = await screen.findByRole('switch', { name: 'Vibrate when timer ends' });
  expect(toggle.getAttribute('aria-checked')).toBe('false');

  fireEvent.click(toggle);
  expect(settingsMock.setVibrateOnEnd).toHaveBeenCalledWith(true);

  settingsMock.vibrateOnEnd = true;
  rerender(<SettingsPage />);

  expect(
    screen.getByRole('switch', { name: 'Vibrate when timer ends' }).getAttribute('aria-checked'),
  ).toBe('true');
});

test('the vibration switch is hidden without the Vibration API', async () => {
  setNavigatorVibrate(undefined);

  render(<SettingsPage />);

  // The rest of the page renders, so this is not just an empty tree
  expect(screen.getByRole('switch', { name: 'Play sound when timer ends' })).toBeDefined();
  expect(screen.queryByRole('switch', { name: 'Vibrate when timer ends' })).toBeNull();
});

test('the minimum break length field shows the current setting and saves edits', () => {
  render(<SettingsPage />);

  const field = screen.getByLabelText('Skip it for breaks up to (seconds)') as HTMLInputElement;
  expect(field.value).toBe('30');

  fireEvent.change(field, { target: { value: '45' } });

  expect(settingsMock.setMinCooldownForTickSound).toHaveBeenCalledWith(45);
});

test('clearing the minimum break length falls back to zero on blur', () => {
  render(<SettingsPage />);

  const field = screen.getByLabelText('Skip it for breaks up to (seconds)') as HTMLInputElement;
  fireEvent.change(field, { target: { value: '' } });
  fireEvent.blur(field);

  expect(field.value).toBe('0');
  expect(settingsMock.setMinCooldownForTickSound).toHaveBeenLastCalledWith(0);
});

test('the minimum break length field is hidden when the tick sound is off', () => {
  settingsMock.playLastTenSecondsSound = false;

  render(<SettingsPage />);

  expect(screen.queryByLabelText('Skip it for breaks up to (seconds)')).toBeNull();
});
