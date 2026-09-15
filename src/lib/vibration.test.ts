/**
 * src/lib/vibration.test.ts
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

import { afterEach, expect, test, vi } from 'vitest';
import { END_VIBRATION_PATTERN, vibrate } from './vibration';

const setVibrate = (impl: ((pattern: number | number[]) => boolean) | undefined) => {
  Object.defineProperty(navigator, 'vibrate', {
    value: impl,
    configurable: true,
    writable: true,
  });
};

afterEach(() => {
  setVibrate(undefined);
  vi.restoreAllMocks();
});

test('vibrate is a no-op when the Vibration API is unavailable', () => {
  setVibrate(undefined);

  expect(vibrate()).toBe(false);
});

test('vibrate uses the end pattern by default', () => {
  const vibrateMock = vi.fn(() => true);
  setVibrate(vibrateMock);

  expect(vibrate()).toBe(true);
  expect(vibrateMock).toHaveBeenCalledWith(END_VIBRATION_PATTERN);
});

test('vibrate forwards a custom pattern', () => {
  const vibrateMock = vi.fn(() => true);
  setVibrate(vibrateMock);

  vibrate(150);

  expect(vibrateMock).toHaveBeenCalledWith(150);
});

test('vibrate reports failures instead of throwing', () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  setVibrate(() => {
    throw new Error('not allowed');
  });

  expect(vibrate()).toBe(false);
  expect(consoleError).toHaveBeenCalled();
});
