/**
 * src/store/store.test.tsx
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
import { makeStore } from './store';
import { setInitialTime } from './timerSlice';

test('makeStore creates a store with the timer slice', () => {
  const store = makeStore();

  expect(store.getState().timer).toEqual({
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

test('makeStore returns isolated store instances', () => {
  const firstStore = makeStore();
  const secondStore = makeStore();

  firstStore.dispatch(setInitialTime(90));

  expect(firstStore.getState().timer.initialTime).toBe(90);
  expect(secondStore.getState().timer.initialTime).toBe(60);
});
