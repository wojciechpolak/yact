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

import { fireEvent, render, waitFor, within, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { StoreProvider } from '@/context/StoreProvider';
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
  default: () => <div data-testid="countdown-timer" />,
}));

vi.mock('@/components/TimerSync', () => ({
  default: () => null,
}));

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
  const view = render(
    <StoreProvider>
      <Page />
    </StoreProvider>,
  );

  expect(within(view.container).getByTestId('countdown-timer')).toBeDefined();
  expect(within(view.container).getByRole('button', { name: 'Start' })).toBeDefined();
  expect(within(view.container).getByRole('button', { name: 'Reset' })).toBeDefined();

  const settingsLink = within(view.container).getByRole('link', { name: 'Settings' });
  expect(settingsLink.getAttribute('href')).toContain('/settings#');
  expect(settingsLink.getAttribute('href')).toContain('hours=0');
  expect(settingsLink.getAttribute('href')).toContain('minutes=1');
  expect(settingsLink.getAttribute('href')).toContain('seconds=0');
});

test('Page repeat switch updates the settings link query string', async () => {
  const view = render(
    <StoreProvider>
      <Page />
    </StoreProvider>,
  );

  const repeatSwitch = within(view.container).getByRole('switch', { name: 'Repeat' });
  fireEvent.click(repeatSwitch);

  await waitFor(() => {
    expect(within(view.container).getByRole('link', { name: 'Settings' })
      .getAttribute('href')).toContain('repeat=true');
  });
});

test('Page start, pause, and reset controls update the visible state', () => {
  const view = render(
    <StoreProvider>
      <Page />
    </StoreProvider>,
  );

  fireEvent.click(within(view.container).getByRole('button', { name: 'Start' }));
  expect(within(view.container).getByRole('button', { name: 'Pause' })).toBeDefined();

  fireEvent.click(within(view.container).getByRole('button', { name: 'Pause' }));
  expect(within(view.container).getByRole('button', { name: 'Start' })).toBeDefined();

  fireEvent.click(within(view.container).getByRole('button', { name: 'Start' }));
  fireEvent.click(within(view.container).getByRole('button', { name: 'Reset' }));

  expect(within(view.container).getByRole('button', { name: 'Start' })).toBeDefined();
});
