/**
 * src/hooks/useCountdownTimer.test.tsx
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

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useCountdownTimer } from './useCountdownTimer';

type TimerOptions = Parameters<typeof useCountdownTimer>[0];

const createOptions = (overrides: Partial<TimerOptions> = {}): TimerOptions => ({
  countUp: false,
  countToTime: false,
  initialTime: 60,
  isActive: false,
  onActiveChange: vi.fn(),
  onPlaySound: vi.fn(),
  onSendNotification: vi.fn(),
  onSetTargetTime: vi.fn(),
  playEndSound: true,
  playLastTenSecondsSound: true,
  repeat: false,
  showNotifications: false,
  targetTime: null,
  ...overrides,
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 0, 1, 10, 0, 0));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

test('keeps timeLeft in sync when initialTime changes', () => {
  const { result, rerender } = renderHook((props: TimerOptions) => useCountdownTimer(props), {
    initialProps: createOptions({ initialTime: 12 }),
  });

  expect(result.current.timeLeft).toBe(12);

  act(() => {
    rerender(createOptions({ initialTime: 42 }));
  });

  expect(result.current.timeLeft).toBe(42);
});

test('count-to-time mode computes the next occurrence of the target clock time', () => {
  const { result } = renderHook((props: TimerOptions) => useCountdownTimer(props), {
    initialProps: createOptions({
      countToTime: true,
      initialTime: 10 * 3600 + 5 * 60,
    }),
  });

  expect(result.current.timeLeft).toBe(300);
});

test('count-to-time mode rolls over to tomorrow after the target time has passed', () => {
  vi.setSystemTime(new Date(2026, 0, 1, 10, 10, 0));

  const { result } = renderHook((props: TimerOptions) => useCountdownTimer(props), {
    initialProps: createOptions({
      countToTime: true,
      initialTime: 10 * 3600 + 5 * 60,
    }),
  });

  expect(result.current.timeLeft).toBe(23 * 3600 + 55 * 60);
});

test('openEditor pauses the timer and closeEditor exits editing mode', () => {
  const onActiveChange = vi.fn();
  const { result } = renderHook((props: TimerOptions) => useCountdownTimer(props), {
    initialProps: createOptions({ onActiveChange }),
  });

  act(() => {
    result.current.openEditor();
  });

  expect(result.current.isEditing).toBe(true);
  expect(onActiveChange).toHaveBeenCalledWith(false);

  act(() => {
    result.current.closeEditor();
  });

  expect(result.current.isEditing).toBe(false);
});

test('a completed countdown stops the timer and plays completion side effects', () => {
  const onActiveChange = vi.fn();
  const onPlaySound = vi.fn();
  const onSendNotification = vi.fn();

  const { result } = renderHook((props: TimerOptions) => useCountdownTimer(props), {
    initialProps: createOptions({
      initialTime: 1,
      isActive: true,
      onActiveChange,
      onPlaySound,
      onSendNotification,
      playEndSound: true,
      showNotifications: true,
    }),
  });

  act(() => {
    vi.advanceTimersByTime(1000);
  });

  expect(result.current.timeLeft).toBe(0);
  expect(onPlaySound).toHaveBeenCalledWith('/audio/end.mp3');
  expect(onSendNotification).toHaveBeenCalledTimes(1);
  expect(onActiveChange).toHaveBeenCalledWith(false);
});

test('repeat restarts a fixed-duration countdown instead of stopping it', () => {
  const onActiveChange = vi.fn();
  const onSetTargetTime = vi.fn();

  const { result } = renderHook((props: TimerOptions) => useCountdownTimer(props), {
    initialProps: createOptions({
      initialTime: 1,
      isActive: true,
      onActiveChange,
      onSetTargetTime,
      repeat: true,
      playEndSound: false,
    }),
  });

  act(() => {
    vi.advanceTimersByTime(1000);
  });

  expect(result.current.timeLeft).toBe(1);
  expect(onActiveChange).not.toHaveBeenCalledWith(false);
  expect(onSetTargetTime).toHaveBeenCalledTimes(2);
});

test('count-up mode keeps counting below zero', () => {
  const onActiveChange = vi.fn();
  const onPlaySound = vi.fn();

  const { result } = renderHook((props: TimerOptions) => useCountdownTimer(props), {
    initialProps: createOptions({
      initialTime: 1,
      isActive: true,
      countUp: true,
      onActiveChange,
      onPlaySound,
      playEndSound: false,
      playLastTenSecondsSound: false,
    }),
  });

  act(() => {
    vi.advanceTimersByTime(2000);
  });

  expect(result.current.timeLeft).toBe(-1);
  expect(onActiveChange).not.toHaveBeenCalledWith(false);
  expect(onPlaySound).not.toHaveBeenCalled();
});

test('plays the last ten seconds sound once the countdown reaches ten seconds', () => {
  const onPlaySound = vi.fn();

  const { result } = renderHook((props: TimerOptions) => useCountdownTimer(props), {
    initialProps: createOptions({
      initialTime: 11,
      isActive: true,
      onPlaySound,
      playEndSound: false,
      playLastTenSecondsSound: true,
    }),
  });

  act(() => {
    vi.advanceTimersByTime(1000);
  });

  expect(result.current.timeLeft).toBe(10);
  expect(onPlaySound).toHaveBeenCalledWith('/audio/tick.mp3');
});
