/**
 * src/context/SettingsContext.test.tsx
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

import { render, screen, waitFor, fireEvent, renderHook, cleanup } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { SettingsProvider, useSettings } from './SettingsContext';

const storage = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => storage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    storage.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    storage.delete(key);
  }),
  clear: vi.fn(() => {
    storage.clear();
  }),
  key: vi.fn((index: number) => Array.from(storage.keys())[index] ?? null),
  get length() {
    return storage.size;
  },
} as Storage;

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  configurable: true,
});
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  configurable: true,
});

const SettingsProbe = () => {
  const settings = useSettings();

  return (
    <div>
      <div data-testid="settings-values">
        {[
          `countUp=${settings.countUp}`,
          `countToTime=${settings.countToTime}`,
          `playEndSound=${settings.playEndSound}`,
          `playLastTenSecondsSound=${settings.playLastTenSecondsSound}`,
          `showNotifications=${settings.showNotifications}`,
          `updateTitle=${settings.updateTitle}`,
        ].join(',')}
      </div>
      <button type="button" onClick={() => settings.setCountUp(!settings.countUp)}>
        toggle-count-up
      </button>
      <button type="button" onClick={() => settings.setUpdateTitle(!settings.updateTitle)}>
        toggle-title
      </button>
    </div>
  );
};

afterEach(() => {
  localStorage.clear();
  cleanup();
});

test('useSettings throws outside the provider', () => {
  expect(() => renderHook(() => useSettings())).toThrow('useSettings must be used within a SettingsProvider');
});

test('SettingsProvider loads defaults when localStorage is empty', async () => {
  render(
    <SettingsProvider>
      <SettingsProbe />
    </SettingsProvider>,
  );

  await waitFor(() => {
    expect(screen.getByTestId('settings-values').textContent).toBe(
      'countUp=true,countToTime=false,playEndSound=true,playLastTenSecondsSound=true,showNotifications=false,updateTitle=true',
    );
  });
});

test('SettingsProvider restores saved settings and persists updates', async () => {
  localStorage.setItem('countUp', 'false');
  localStorage.setItem('countToTime', 'true');
  localStorage.setItem('playEndSound', 'false');
  localStorage.setItem('playLastTenSecondsSound', 'false');
  localStorage.setItem('showNotifications', 'true');
  localStorage.setItem('updateTitle', 'false');

  render(
    <SettingsProvider>
      <SettingsProbe />
    </SettingsProvider>,
  );

  await waitFor(() => {
    expect(screen.getByTestId('settings-values').textContent).toBe(
      'countUp=false,countToTime=true,playEndSound=false,playLastTenSecondsSound=false,showNotifications=true,updateTitle=false',
    );
  });

  fireEvent.click(screen.getByRole('button', { name: 'toggle-count-up' }));
  fireEvent.click(screen.getByRole('button', { name: 'toggle-title' }));

  await waitFor(() => {
    expect(localStorage.getItem('countUp')).toBe('true');
    expect(localStorage.getItem('updateTitle')).toBe('true');
    expect(localStorage.getItem('countToTime')).toBe('true');
  });
});
