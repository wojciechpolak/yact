/**
 * src/components/CountdownTimer.test.tsx
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

import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import CountdownTimer from './CountdownTimer';

const openEditor = vi.fn();
const closeEditor = vi.fn();
const playSound = vi.fn();
const initializeAudioContext = vi.fn();
const unlockAudioContext = vi.fn();
const preloadSounds = vi.fn();

vi.mock('@/context/SettingsContext', () => ({
  useSettings: () => ({
    showNotifications: false,
    updateTitle: false,
  }),
}));

vi.mock('@/hooks/useAudioManager', () => ({
  useAudioManager: () => ({
    initializeAudioContext,
    unlockAudioContext,
    preloadSounds,
    playSound,
  }),
}));

vi.mock('@/hooks/useCountdownTimer', () => ({
  useCountdownTimer: () => ({
    timeLeft: -5,
    setTimeLeft: vi.fn(),
    isEditing: false,
    openEditor,
    closeEditor,
    h: 0,
    m: 0,
    s: 5,
  }),
}));

test('CountdownTimer formats negative time and opens the editor from keyboard or click', () => {
  render(
    <CountdownTimer
      countUp={false}
      countToTime={false}
      initialTime={5}
      isActive={false}
      onActiveChange={vi.fn()}
      onSetTargetTime={vi.fn()}
      playEndSound={false}
      playLastTenSecondsSound={false}
      repeat={false}
      targetTime={null}
    />,
  );

  const timer = screen.getByRole('timer');
  expect(timer.textContent).toBe('+00:00:05');
  expect(timer.getAttribute('aria-label')).toBe('Countdown Timer: 0 hours, 0 minutes, 5 seconds');

  fireEvent.click(timer);
  fireEvent.keyDown(timer, { key: 'Enter' });

  expect(openEditor).toHaveBeenCalledTimes(2);
});
