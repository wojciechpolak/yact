/**
 * src/store/timerSlice.test.tsx
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

import { expect, test } from 'vitest';
import {
  setCooldownSeconds,
  setBreakColor,
  setCyclePhase,
  resetTimer,
  setInitialTime,
  setIsActive,
  setRepeat,
  setSavedInitialTime,
  setTargetTime,
  timerReducer,
} from './timerSlice';

test('timerReducer returns the initial state', () => {
  expect(timerReducer(undefined, { type: 'unknown' })).toEqual({
    initialTime: 60,
    savedInitialTime: 60,
    isActive: false,
    repeat: false,
    cooldownSeconds: 0,
    breakColor: null,
    cyclePhase: 'work',
    targetTime: null,
  });
});

test('setInitialTime updates the timer duration', () => {
  expect(timerReducer(undefined, setInitialTime(125)).initialTime).toBe(125);
});

test('setSavedInitialTime updates the reset baseline', () => {
  expect(timerReducer(undefined, setSavedInitialTime(321)).savedInitialTime).toBe(321);
});

test('setIsActive toggles active state', () => {
  expect(timerReducer(undefined, setIsActive(true)).isActive).toBe(true);
});

test('setRepeat toggles repeat state', () => {
  expect(timerReducer(undefined, setRepeat(true)).repeat).toBe(true);
});

test('setCooldownSeconds updates the rest duration', () => {
  expect(timerReducer(undefined, setCooldownSeconds(15)).cooldownSeconds).toBe(15);
});

test('setBreakColor updates the break font color', () => {
  expect(timerReducer(undefined, setBreakColor('#ff0000')).breakColor).toBe('#ff0000');
});

test('setCyclePhase updates the current cycle phase', () => {
  expect(timerReducer(undefined, setCyclePhase('rest')).cyclePhase).toBe('rest');
});

test('setTargetTime stores the target timestamp', () => {
  expect(timerReducer(undefined, setTargetTime(123456789)).targetTime).toBe(123456789);
});

test('resetTimer restores the saved initial time and clears active flags', () => {
  const state = timerReducer(
    {
      initialTime: 10,
      savedInitialTime: 42,
      isActive: true,
      repeat: true,
      cooldownSeconds: 9,
      breakColor: '#ff0000',
      cyclePhase: 'rest',
      targetTime: 123,
    },
    resetTimer(),
  );

  expect(state).toEqual({
    initialTime: 42,
    savedInitialTime: 42,
    isActive: false,
    repeat: true,
    cooldownSeconds: 9,
    breakColor: '#ff0000',
    cyclePhase: 'work',
    targetTime: null,
  });
});
