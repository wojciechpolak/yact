/**
 * src/components/TimerSync.test.tsx
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

import { Provider } from 'react-redux';
import { render, waitFor, cleanup } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { makeStore } from '@/store/store';
import { setInitialTime, setIsActive, setTargetTime } from '@/store/timerSlice';
import TimerSync from './TimerSync';

const state = vi.hoisted(() => ({
  hashParams: new URLSearchParams(),
  countToTime: false,
  setCountToTime: vi.fn(),
}));

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

vi.mock('@/lib/useHashParams', () => ({
  useHashParams: () => state.hashParams,
}));

vi.mock('@/context/SettingsContext', () => ({
  useSettings: () => ({
    countToTime: state.countToTime,
    setCountToTime: state.setCountToTime,
  }),
}));

const renderTimerSync = () => {
  const store = makeStore();

  return {
    store,
    ...render(
      <Provider store={store}>
        <TimerSync />
      </Provider>,
    ),
  };
};

afterEach(() => {
  localStorage.clear();
  state.hashParams = new URLSearchParams();
  state.countToTime = false;
  state.setCountToTime.mockClear();
  cleanup();
});

test('TimerSync hydrates the store from hash parameters', async () => {
  const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
  state.hashParams = new URLSearchParams(
    'hours=1&minutes=2&seconds=3&repeat=true&active=true&targetTime=12345&cooldownSeconds=9&breakColor=%23ff0000&cyclePhase=rest&mode=target',
  );

  const { store } = renderTimerSync();

  await waitFor(() => {
    expect(store.getState().timer).toMatchObject({
      initialTime: 3723,
      savedInitialTime: 3723,
      isActive: true,
      repeat: true,
      cooldownSeconds: 9,
      breakColor: '#ff0000',
      cyclePhase: 'rest',
      targetTime: 12345,
    });
  });

  expect(state.setCountToTime).toHaveBeenCalledWith(true);
  expect(localStorage.getItem('hours')).toBe('1');
  expect(localStorage.getItem('minutes')).toBe('2');
  expect(localStorage.getItem('seconds')).toBe('3');
  expect(replaceStateSpy.mock.calls.at(-1)?.[2]).toContain('breakColor=%23ff0000');
  expect(replaceStateSpy.mock.calls.at(-1)?.[2]).toContain('cyclePhase=rest');
  expect(replaceStateSpy.mock.calls.at(-1)?.[2]).toContain('targetTime=12345');
});

test('TimerSync falls back to localStorage when the hash is empty', async () => {
  const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
  localStorage.setItem('hours', '4');
  localStorage.setItem('minutes', '5');
  localStorage.setItem('seconds', '6');
  localStorage.setItem('repeat', 'true');
  localStorage.setItem('active', 'false');
  localStorage.setItem('countToTime', 'true');
  localStorage.setItem('breakColor', '#123456');

  const { store } = renderTimerSync();

  await waitFor(() => {
    expect(store.getState().timer.initialTime).toBe(4 * 3600 + 5 * 60 + 6);
  });

  expect(state.setCountToTime).toHaveBeenCalledWith(true);
  expect(store.getState().timer.breakColor).toBe('#123456');
  expect(replaceStateSpy.mock.calls.at(-1)?.[2]).toContain('breakColor=%23123456');
});

test('TimerSync includes mode=target in the URL when countToTime is true', async () => {
  const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
  state.countToTime = true;

  renderTimerSync();

  await waitFor(() => {
    const url = replaceStateSpy.mock.calls.at(-1)?.[2] as string;
    expect(url).toContain('mode=target');
  });
});

test('TimerSync mirrors store updates into localStorage and the URL hash', async () => {
  const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
  const { store } = renderTimerSync();

  await waitFor(() => {
    expect(replaceStateSpy).toHaveBeenCalled();
  });

  replaceStateSpy.mockClear();

  store.dispatch(setInitialTime(3723));
  store.dispatch(setIsActive(true));
  store.dispatch(setTargetTime(999));

  await waitFor(() => {
    expect(replaceStateSpy).toHaveBeenCalledWith(
      null,
      '',
      '/#hours=1&minutes=2&seconds=3&repeat=false&active=true&cooldownSeconds=0&cyclePhase=work&targetTime=999',
    );
  });

  expect(localStorage.getItem('hours')).toBe('1');
  expect(localStorage.getItem('minutes')).toBe('2');
  expect(localStorage.getItem('seconds')).toBe('3');
  expect(localStorage.getItem('targetTime')).toBe('999');
  expect(localStorage.getItem('cooldownSeconds')).toBe('0');
  expect(localStorage.getItem('cyclePhase')).toBe('work');
});
