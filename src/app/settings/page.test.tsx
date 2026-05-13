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
  showNotifications: false,
  setShowNotifications: vi.fn(),
  updateTitle: true,
  setUpdateTitle: vi.fn(),
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
  localStorage.clear();
});

afterEach(() => {
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
