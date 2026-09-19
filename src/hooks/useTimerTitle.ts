/**
 * src/hooks/useTimerTitle.ts
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

'use client';

import { useEffect, useState } from 'react';
import { formatClock } from '@/lib/clockTime';

interface UseTimerTitleOptions {
  h: number;
  m: number;
  s: number;
  isBreakPhase: boolean;
  /** True once the timer has passed zero and is counting up. */
  isNegative: boolean;
  updateTitle: boolean;
}

/**
 * Mirrors the running timer into the document title, and returns the value for
 * the screen-reader live region, refreshed every five seconds so it is not
 * announced on every tick.
 */
export function useTimerTitle({
  h,
  m,
  s,
  isBreakPhase,
  isNegative,
  updateTitle,
}: UseTimerTitleOptions) {
  const [ariaTimer, setAriaTimer] = useState('');

  useEffect(() => {
    const formattedTime = formatClock(h, m, s, isNegative ? '+' : '');
    if (updateTitle) {
      document.title = `${isBreakPhase ? 'Break ' : ''}${formattedTime} Countdown | YACT`;
    }
    if (s % 5 === 0) {
      setAriaTimer(formattedTime);
    }
  }, [h, m, s, isBreakPhase, isNegative, updateTitle]);

  return ariaTimer;
}
