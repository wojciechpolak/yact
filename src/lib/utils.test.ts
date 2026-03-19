/**
 * src/lib/utils.test.tsx
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
import { cn } from './utils';

test('cn merges conflicting tailwind classes', () => {
  expect(cn('px-2', 'px-4', 'text-sm')).toBe('px-4 text-sm');
});

test('cn ignores falsy values', () => {
  expect(cn('alpha', null, undefined, false, 'beta')).toBe('alpha beta');
});
