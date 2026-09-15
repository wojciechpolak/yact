/**
 * src/lib/vibration.ts
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

'use client';

// Three pulses, roughly as long as the end sound.
export const END_VIBRATION_PATTERN = [200, 100, 200, 100, 400];

export const supportsVibration = () =>
  typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

/**
 * Vibrate the device. A no-op on platforms without the Vibration API
 * (desktop browsers, iOS Safari). Browsers also require a prior user
 * interaction and a visible page, so this can silently do nothing.
 */
export function vibrate(pattern: number | number[] = END_VIBRATION_PATTERN): boolean {
  if (!supportsVibration()) {
    return false;
  }

  try {
    return navigator.vibrate(pattern);
  } catch (err) {
    console.error('Failed to vibrate', err);
    return false;
  }
}
