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

import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import CountdownTimer from './CountdownTimer';

// Captures callbacks passed into useCountdownTimer so tests can invoke them
const capturedTimerOpts = vi.hoisted(() => ({
  onSendNotification: undefined as (() => void) | undefined,
}));

// Mutable mock state — updated per test in beforeEach / within tests
const timerMock = vi.hoisted(() => ({
  timeLeft: -5 as number,
  setTimeLeft: vi.fn<[number], void>(),
  isEditing: false,
  openEditor: vi.fn(),
  closeEditor: vi.fn(),
  h: 0,
  m: 0,
  s: 5,
}));

const settingsMock = vi.hoisted(() => ({
  showNotifications: false,
  updateTitle: false,
  keepAwake: false,
  countToTime: false,
  setCountToTime: vi.fn(),
}));

vi.mock('@/context/SettingsContext', () => ({
  useSettings: () => ({ ...settingsMock }),
}));

const audioMock = vi.hoisted(() => ({
  initializeAudioContext: vi.fn(),
  unlockAudioContext: vi.fn(),
  preloadSounds: vi.fn(),
  playSound: vi.fn(),
}));

vi.mock('@/hooks/useAudioManager', () => ({
  useAudioManager: () => audioMock,
}));

vi.mock('@/hooks/useCountdownTimer', () => ({
  useCountdownTimer: (opts: { onSendNotification: () => void }) => {
    capturedTimerOpts.onSendNotification = opts.onSendNotification;
    return { ...timerMock };
  },
}));

vi.mock('@/hooks/useScreenWakeLock', () => ({
  useScreenWakeLock: vi.fn(),
}));

const defaultProps = {
  countUp: false,
  countToTime: false,
  initialTime: 5,
  cooldownSeconds: 0,
  breakColor: null as string | null,
  cyclePhase: 'work' as const,
  isActive: false,
  onActiveChange: vi.fn(),
  onSetTargetTime: vi.fn(),
  onSetCyclePhase: vi.fn(),
  onSetBreakColor: vi.fn(),
  playEndSound: false,
  playLastTenSecondsSound: false,
  repeat: false,
  targetTime: null as number | null,
};

beforeEach(() => {
  timerMock.timeLeft = -5;
  timerMock.isEditing = false;
  timerMock.h = 0;
  timerMock.m = 0;
  timerMock.s = 5;
  timerMock.setTimeLeft.mockClear();
  timerMock.openEditor.mockClear();
  timerMock.closeEditor.mockClear();
  audioMock.initializeAudioContext.mockClear();
  audioMock.unlockAudioContext.mockClear();
  audioMock.preloadSounds.mockClear();
  settingsMock.countToTime = false;
  settingsMock.updateTitle = false;
  settingsMock.showNotifications = false;
  capturedTimerOpts.onSendNotification = undefined;
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});

test('CountdownTimer formats negative time and opens the editor from keyboard or click', () => {
  render(<CountdownTimer {...defaultProps} />);

  const timer = screen.getByRole('timer');
  expect(timer.textContent).toBe('+00:00:05');
  expect(timer.getAttribute('aria-label')).toBe('Countdown Timer: 0 hours, 0 minutes, 5 seconds');
  expect(screen.queryByText('Work')).toBeNull();
  expect(screen.queryByText('Break')).toBeNull();
  expect(timer.nextElementSibling?.textContent).toBe('\u00a0');

  fireEvent.click(timer);
  fireEvent.keyDown(timer, { key: 'Enter' });

  expect(timerMock.openEditor).toHaveBeenCalledTimes(2);
});

test('CountdownTimer Space key on the timer display opens the editor', () => {
  render(<CountdownTimer {...defaultProps} />);

  const timer = screen.getByRole('timer');
  fireEvent.keyDown(timer, { key: ' ' });

  expect(timerMock.openEditor).toHaveBeenCalledTimes(1);
});

test('CountdownTimer updates the document title when updateTitle is enabled', () => {
  settingsMock.updateTitle = true;
  timerMock.timeLeft = 65;
  timerMock.h = 0;
  timerMock.m = 1;
  timerMock.s = 5;

  render(<CountdownTimer {...defaultProps} initialTime={65} />);

  expect(document.title).toBe('01:05 Countdown | YACT');
});

test('CountdownTimer labels the rest phase when cooldown is active', () => {
  settingsMock.updateTitle = true;
  timerMock.timeLeft = 5;
  timerMock.h = 0;
  timerMock.m = 0;
  timerMock.s = 5;

  render(
    <CountdownTimer
      {...defaultProps}
      cyclePhase="rest"
      cooldownSeconds={10}
      initialTime={5}
      breakColor="#ff0000"
    />,
  );

  const timer = screen.getByRole('timer');
  expect(timer.getAttribute('aria-label')).toBe(
    'Break Countdown Timer: 0 hours, 0 minutes, 5 seconds',
  );
  expect(screen.getByText('Break')).toBeDefined();
  expect(document.title).toBe('Break 00:05 Countdown | YACT');
  expect(window.getComputedStyle(timer).color).toBe('rgb(255, 0, 0)');
});

test('CountdownTimer uses the default light blue break color when no override is set', () => {
  timerMock.timeLeft = 5;
  timerMock.h = 0;
  timerMock.m = 0;
  timerMock.s = 5;

  render(<CountdownTimer {...defaultProps} cyclePhase="rest" cooldownSeconds={10} />);

  const timer = screen.getByRole('timer');
  expect(window.getComputedStyle(timer).color).toBe('rgb(96, 165, 250)');
});

test('handleSaveEditor saves fixed-duration time and calls onTimeUpdate', () => {
  const onTimeUpdate = vi.fn();
  timerMock.isEditing = true;
  timerMock.h = 1;
  timerMock.m = 30;
  timerMock.s = 0;

  render(<CountdownTimer {...defaultProps} initialTime={5400} onTimeUpdate={onTimeUpdate} />);

  fireEvent.click(screen.getByRole('button', { name: 'Save' }));

  // 1h 30m 0s = 5400 seconds
  expect(timerMock.setTimeLeft).toHaveBeenCalledWith(5400);
  expect(timerMock.closeEditor).toHaveBeenCalled();
  expect(onTimeUpdate).toHaveBeenCalledWith(1, 30, 0, 0, null);
  expect(localStorage.getItem('hours')).toBe('1');
  expect(localStorage.getItem('minutes')).toBe('30');
  expect(localStorage.getItem('seconds')).toBe('0');
  expect(localStorage.getItem('cooldownSeconds')).toBe('0');
});

test('handleSaveEditor computes a diff from now in count-to-time mode', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 0, 1, 10, 0, 0));

  settingsMock.countToTime = true;
  timerMock.isEditing = true;
  timerMock.h = 10;
  timerMock.m = 30;
  timerMock.s = 0;

  render(<CountdownTimer {...defaultProps} countToTime initialTime={10 * 3600 + 30 * 60} />);

  fireEvent.click(screen.getByRole('button', { name: 'Save' }));

  // 10:30 is 30 minutes from the faked 10:00:00 → 1800 seconds
  expect(timerMock.setTimeLeft).toHaveBeenCalledWith(1800);
  expect(timerMock.closeEditor).toHaveBeenCalled();

  vi.useRealTimers();
});

test('editorTime in count-to-time mode uses initialTime when targetTime is absent', () => {
  settingsMock.countToTime = true;
  timerMock.isEditing = true;
  // initialTime = 14:30:00
  const initialTime = 14 * 3600 + 30 * 60;

  render(
    <CountdownTimer {...defaultProps} countToTime initialTime={initialTime} targetTime={null} />,
  );

  const inputs = screen.getAllByRole('spinbutton');
  expect((inputs[0] as HTMLInputElement).value).toBe('14');
  expect((inputs[1] as HTMLInputElement).value).toBe('30');
  expect((inputs[2] as HTMLInputElement).value).toBe('0');
});

test('editorTime in count-to-time mode uses targetTime when it is provided', () => {
  settingsMock.countToTime = true;
  timerMock.isEditing = true;
  // targetTime corresponds to 15:45:30 on 2026-01-01
  const targetTime = new Date(2026, 0, 1, 15, 45, 30).getTime();

  render(<CountdownTimer {...defaultProps} countToTime initialTime={0} targetTime={targetTime} />);

  const inputs = screen.getAllByRole('spinbutton');
  expect((inputs[0] as HTMLInputElement).value).toBe('15');
  expect((inputs[1] as HTMLInputElement).value).toBe('45');
  expect((inputs[2] as HTMLInputElement).value).toBe('30');
});

test('CountdownTimer preloads audio when isActive becomes true', () => {
  render(<CountdownTimer {...defaultProps} isActive />);

  expect(audioMock.initializeAudioContext).toHaveBeenCalled();
  expect(audioMock.unlockAudioContext).toHaveBeenCalled();
  expect(audioMock.preloadSounds).toHaveBeenCalledWith(['/audio/end.mp3', '/audio/tick.mp3']);
});

test('sendNotification shows a Notification when permission is granted', () => {
  const NotificationSpy = vi.fn();
  Object.defineProperty(window, 'Notification', {
    value: Object.assign(NotificationSpy, { permission: 'granted', requestPermission: vi.fn() }),
    configurable: true,
  });

  render(<CountdownTimer {...defaultProps} />);
  capturedTimerOpts.onSendNotification?.();

  expect(NotificationSpy).toHaveBeenCalledWith('Timer Finished', expect.any(Object));
});

test('sendNotification requests permission when not yet granted', async () => {
  const NotificationSpy = vi.fn();
  const requestPermissionMock = vi.fn(async () => 'granted' as NotificationPermission);
  Object.defineProperty(window, 'Notification', {
    value: Object.assign(NotificationSpy, {
      permission: 'default',
      requestPermission: requestPermissionMock,
    }),
    configurable: true,
  });

  render(<CountdownTimer {...defaultProps} />);
  capturedTimerOpts.onSendNotification?.();

  expect(requestPermissionMock).toHaveBeenCalled();
  await vi.waitFor(() => expect(NotificationSpy).toHaveBeenCalledTimes(1));
});

test('handleSaveEditor in count-to-time mode rolls over to next day when target has passed', () => {
  vi.useFakeTimers();
  // Set clock to 10:30:00 — a target of 10:00:00 has already passed today
  vi.setSystemTime(new Date(2026, 0, 1, 10, 30, 0));

  settingsMock.countToTime = true;
  timerMock.isEditing = true;
  timerMock.h = 10;
  timerMock.m = 0;
  timerMock.s = 0;

  render(<CountdownTimer {...defaultProps} countToTime initialTime={10 * 3600} />);

  fireEvent.click(screen.getByRole('button', { name: 'Save' }));

  // Target 10:00:00 has passed; diff should be ~23.5 hours (84600 s)
  const called = timerMock.setTimeLeft.mock.calls[0][0] as number;
  expect(called).toBeGreaterThan(23 * 3600);

  vi.useRealTimers();
});
