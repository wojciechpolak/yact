/**
 * src/lib/useHashParams.test.tsx
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
import { expect, test } from 'vitest';
import { useHashParams } from './useHashParams';

test('useHashParams reads the current hash on mount', () => {
  window.location.hash = '#hours=1&minutes=2&seconds=3';

  const { result } = renderHook(() => useHashParams());

  expect(result.current.get('hours')).toBe('1');
  expect(result.current.get('minutes')).toBe('2');
  expect(result.current.get('seconds')).toBe('3');
});

test('useHashParams updates when the hash changes', () => {
  window.location.hash = '#hours=4';

  const { result } = renderHook(() => useHashParams());

  act(() => {
    window.location.hash = '#hours=7&repeat=true';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });

  expect(result.current.get('hours')).toBe('7');
  expect(result.current.get('repeat')).toBe('true');
});
