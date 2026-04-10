/**
 * src/app/page.test.tsx
 *
 * YACT Copyright (C) 2024-2026 Wojciech Polak
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

import { act, fireEvent, render, waitFor, within, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { Provider } from 'react-redux';
import { makeStore } from '@/store/store';
import Page from './page';

const settingsState = vi.hoisted(() => ({
  countUp: true,
  countToTime: false,
  playEndSound: true,
  playLastTenSecondsSound: true,
  showNotifications: false,
  updateTitle: false,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

vi.mock('@/context/SettingsContext', () => ({
  useSettings: () => settingsState,
}));

vi.mock('@/components/CountdownTimer', () => ({
  default: ({
    onTimeUpdate,
    onSetTargetTime,
    onActiveChange,
  }: {
    onTimeUpdate: (h: number, m: number, s: number) => void;
    onSetTargetTime: (t: number | null) => void;
    onActiveChange: (active: boolean) => void;
  }) => (
    <div data-testid="countdown-timer">
      <button onClick={() => onTimeUpdate(1, 30, 0)}>trigger-time-update</button>
      <button onClick={() => onSetTargetTime(9999)}>trigger-set-target</button>
      <button onClick={() => onActiveChange(false)}>trigger-active-change</button>
    </div>
  ),
}));

vi.mock('@/components/TimerSync', () => ({
  default: () => null,
}));

const renderPage = () => {
  const store = makeStore();
  const view = render(
    <Provider store={store}>
      <Page />
    </Provider>,
  );
  return { store, ...view };
};

beforeEach(() => {
  settingsState.countUp = true;
  settingsState.countToTime = false;
  settingsState.playEndSound = true;
  settingsState.playLastTenSecondsSound = true;
  settingsState.showNotifications = false;
  settingsState.updateTitle = false;
});

afterEach(() => {
  cleanup();
});

test('Page renders the timer controls and settings link', () => {
  const { container } = renderPage();

  expect(within(container).getByTestId('countdown-timer')).toBeDefined();
  expect(within(container).getByRole('button', { name: 'Start' })).toBeDefined();
  expect(within(container).getByRole('button', { name: 'Reset' })).toBeDefined();

  const settingsLink = within(container).getByRole('link', { name: 'Settings' });
  expect(settingsLink.getAttribute('href')).toContain('/settings#');
  expect(settingsLink.getAttribute('href')).toContain('hours=0');
  expect(settingsLink.getAttribute('href')).toContain('minutes=1');
  expect(settingsLink.getAttribute('href')).toContain('seconds=0');
});

test('Page repeat switch updates the settings link query string', async () => {
  const { container } = renderPage();

  const repeatSwitch = within(container).getByRole('switch', { name: 'Repeat' });
  fireEvent.click(repeatSwitch);

  await waitFor(() => {
    expect(
      within(container).getByRole('link', { name: 'Settings' }).getAttribute('href'),
    ).toContain('repeat=true');
  });
});

test('Page start, pause, and reset controls update the visible state', () => {
  const { container } = renderPage();

  fireEvent.click(within(container).getByRole('button', { name: 'Start' }));
  expect(within(container).getByRole('button', { name: 'Pause' })).toBeDefined();

  fireEvent.click(within(container).getByRole('button', { name: 'Pause' }));
  expect(within(container).getByRole('button', { name: 'Start' })).toBeDefined();

  fireEvent.click(within(container).getByRole('button', { name: 'Start' }));
  fireEvent.click(within(container).getByRole('button', { name: 'Reset' }));

  expect(within(container).getByRole('button', { name: 'Start' })).toBeDefined();
});

test('Page spacebar starts and pauses the timer', () => {
  const { store } = renderPage();

  expect(store.getState().timer.isActive).toBe(false);

  act(() => {
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true }),
    );
  });
  expect(store.getState().timer.isActive).toBe(true);

  act(() => {
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true }),
    );
  });
  expect(store.getState().timer.isActive).toBe(false);
});

test('Page onTimeUpdate dispatches updated time to the store', () => {
  const { store, container } = renderPage();

  fireEvent.click(within(container).getByRole('button', { name: 'trigger-time-update' }));

  // 1h 30m 0s = 5400 seconds
  expect(store.getState().timer.initialTime).toBe(5400);
  expect(store.getState().timer.savedInitialTime).toBe(5400);
});

test('Page onSetTargetTime dispatches the target time to the store', () => {
  const { store, container } = renderPage();

  fireEvent.click(within(container).getByRole('button', { name: 'trigger-set-target' }));

  expect(store.getState().timer.targetTime).toBe(9999);
});

test('Page onActiveChange dispatches the active state to the store', () => {
  const { store, container } = renderPage();

  // Start the timer first
  fireEvent.click(within(container).getByRole('button', { name: 'Start' }));
  expect(store.getState().timer.isActive).toBe(true);

  // CountdownTimer signals it should stop (e.g. countdown finished)
  fireEvent.click(within(container).getByRole('button', { name: 'trigger-active-change' }));
  expect(store.getState().timer.isActive).toBe(false);
});
