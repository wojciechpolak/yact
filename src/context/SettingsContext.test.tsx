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
          `keepAwake=${settings.keepAwake}`,
          `countToTime=${settings.countToTime}`,
          `playEndSound=${settings.playEndSound}`,
          `playLastTenSecondsSound=${settings.playLastTenSecondsSound}`,
          `minCooldownForTickSound=${settings.minCooldownForTickSound}`,
          `showNotifications=${settings.showNotifications}`,
          `updateTitle=${settings.updateTitle}`,
          `vibrateOnEnd=${settings.vibrateOnEnd}`,
        ].join(',')}
      </div>
      <button type="button" onClick={() => settings.setCountUp(!settings.countUp)}>
        toggle-count-up
      </button>
      <button type="button" onClick={() => settings.setUpdateTitle(!settings.updateTitle)}>
        toggle-title
      </button>
      <button type="button" onClick={() => settings.setKeepAwake(!settings.keepAwake)}>
        toggle-keep-awake
      </button>
      <button type="button" onClick={() => settings.setMinCooldownForTickSound(45)}>
        set-min-cooldown
      </button>
      <button type="button" onClick={() => settings.setVibrateOnEnd(!settings.vibrateOnEnd)}>
        toggle-vibrate
      </button>
    </div>
  );
};

afterEach(() => {
  localStorage.clear();
  cleanup();
});

test('useSettings throws outside the provider', () => {
  expect(() => renderHook(() => useSettings())).toThrow(
    'useSettings must be used within a SettingsProvider',
  );
});

test('SettingsProvider loads defaults when localStorage is empty', async () => {
  render(
    <SettingsProvider>
      <SettingsProbe />
    </SettingsProvider>,
  );

  await waitFor(() => {
    expect(screen.getByTestId('settings-values').textContent).toBe(
      'countUp=true,keepAwake=false,countToTime=false,playEndSound=true,playLastTenSecondsSound=true,minCooldownForTickSound=30,showNotifications=false,updateTitle=true,vibrateOnEnd=false',
    );
  });
});

test('SettingsProvider exposes setPlayLastTenSecondsSound and setShowNotifications', async () => {
  const Probe = () => {
    const {
      playLastTenSecondsSound,
      showNotifications,
      setPlayLastTenSecondsSound,
      setShowNotifications,
    } = useSettings();
    return (
      <div>
        <span data-testid="last-ten">{String(playLastTenSecondsSound)}</span>
        <span data-testid="notifications">{String(showNotifications)}</span>
        <button type="button" onClick={() => setPlayLastTenSecondsSound(false)}>
          toggle-last-ten
        </button>
        <button type="button" onClick={() => setShowNotifications(true)}>
          toggle-notifications
        </button>
      </div>
    );
  };

  render(
    <SettingsProvider>
      <Probe />
    </SettingsProvider>,
  );

  await waitFor(() => {
    expect(screen.getByTestId('last-ten').textContent).toBe('true');
    expect(screen.getByTestId('notifications').textContent).toBe('false');
  });

  fireEvent.click(screen.getByRole('button', { name: 'toggle-last-ten' }));
  fireEvent.click(screen.getByRole('button', { name: 'toggle-notifications' }));

  await waitFor(() => {
    expect(localStorage.getItem('playLastTenSecondsSound')).toBe('false');
    expect(localStorage.getItem('showNotifications')).toBe('true');
  });
});

test('SettingsProvider restores saved settings and persists updates', async () => {
  localStorage.setItem('countUp', 'false');
  localStorage.setItem('keepAwake', 'true');
  localStorage.setItem('countToTime', 'true');
  localStorage.setItem('playEndSound', 'false');
  localStorage.setItem('playLastTenSecondsSound', 'false');
  localStorage.setItem('minCooldownForTickSound', '45');
  localStorage.setItem('showNotifications', 'true');
  localStorage.setItem('updateTitle', 'false');
  localStorage.setItem('vibrateOnEnd', 'true');

  render(
    <SettingsProvider>
      <SettingsProbe />
    </SettingsProvider>,
  );

  await waitFor(() => {
    expect(screen.getByTestId('settings-values').textContent).toBe(
      'countUp=false,keepAwake=true,countToTime=true,playEndSound=false,playLastTenSecondsSound=false,minCooldownForTickSound=45,showNotifications=true,updateTitle=false,vibrateOnEnd=true',
    );
  });

  fireEvent.click(screen.getByRole('button', { name: 'toggle-count-up' }));
  fireEvent.click(screen.getByRole('button', { name: 'toggle-title' }));
  fireEvent.click(screen.getByRole('button', { name: 'toggle-keep-awake' }));
  fireEvent.click(screen.getByRole('button', { name: 'toggle-vibrate' }));

  await waitFor(() => {
    expect(localStorage.getItem('countUp')).toBe('true');
    expect(localStorage.getItem('updateTitle')).toBe('true');
    expect(localStorage.getItem('keepAwake')).toBe('false');
    expect(localStorage.getItem('countToTime')).toBe('true');
    expect(localStorage.getItem('vibrateOnEnd')).toBe('false');
  });
});

test('SettingsProvider falls back to the default minimum cooldown for a garbage value', async () => {
  localStorage.setItem('minCooldownForTickSound', 'not-a-number');

  render(
    <SettingsProvider>
      <SettingsProbe />
    </SettingsProvider>,
  );

  await waitFor(() => {
    expect(screen.getByTestId('settings-values').textContent).toContain(
      'minCooldownForTickSound=30',
    );
  });
});

test('SettingsProvider persists the minimum cooldown for the tick sound', async () => {
  render(
    <SettingsProvider>
      <SettingsProbe />
    </SettingsProvider>,
  );

  await waitFor(() => {
    expect(localStorage.getItem('minCooldownForTickSound')).toBe('30');
  });

  fireEvent.click(screen.getByRole('button', { name: 'set-min-cooldown' }));

  await waitFor(() => {
    expect(screen.getByTestId('settings-values').textContent).toContain(
      'minCooldownForTickSound=45',
    );
    expect(localStorage.getItem('minCooldownForTickSound')).toBe('45');
  });
});
