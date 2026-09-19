/**
 * src/lib/clockTime.ts
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

/**
 * Timestamp of the next occurrence of a time of day, given as seconds since
 * midnight. When that clock time has already passed on `now`'s day, the next
 * day's occurrence is returned.
 */
export function nextClockOccurrence(secondsSinceMidnight: number, now: number) {
  const target = new Date(now);
  target.setHours(
    Math.floor(secondsSinceMidnight / 3600),
    Math.floor((secondsSinceMidnight % 3600) / 60),
    secondsSinceMidnight % 60,
    0,
  );
  if (target.getTime() <= now) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime();
}

/** Two-digit clock unit, e.g. 7 -> "07". */
export function padClockUnit(value: number) {
  return value.toString().padStart(2, '0');
}

/** "MM:SS" under an hour, "HH:MM:SS" above it, prefixed with `sign`. */
export function formatClock(h: number, m: number, s: number, sign: string) {
  const parts = h === 0 ? [m, s] : [h, m, s];
  return sign + parts.map(padClockUnit).join(':');
}
