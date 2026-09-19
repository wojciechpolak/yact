/**
 * src/components/TimerDisplay.tsx
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

import { padClockUnit } from '@/lib/clockTime';

interface TimerDisplayProps {
  h: number;
  m: number;
  s: number;
  /** True once the timer has passed zero and is counting up. */
  isNegative: boolean;
  isBreakPhase: boolean;
  /** Colour to tint the clock with during a break. */
  breakColor: string;
  /** Live-region text, refreshed less often than the clock itself. */
  ariaTimer: string;
  onOpenEditor: () => void;
}

export default function TimerDisplay({
  h,
  m,
  s,
  isNegative,
  isBreakPhase,
  breakColor,
  ariaTimer,
  onOpenEditor,
}: TimerDisplayProps) {
  const phaseLabel = isBreakPhase ? 'Break' : '';
  const timerStyle = isBreakPhase ? { color: breakColor } : undefined;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpenEditor();
    }
  };

  return (
    <>
      {/* Timer Display */}
      <div
        className="text-[15vw] font-mono cursor-pointer select-none text-center leading-none"
        role="timer"
        tabIndex={0}
        aria-label={`${isBreakPhase ? 'Break ' : ''}Countdown Timer: ${h} hours, ${m} minutes, ${s} seconds`}
        style={timerStyle}
        onClick={onOpenEditor}
        onKeyDown={handleKeyDown}
      >
        {isNegative && '+'}
        {padClockUnit(h)}:{padClockUnit(m)}:{padClockUnit(s)}
      </div>
      <div
        className="mt-2 h-8 text-sm uppercase tracking-[0.35em] text-gray-500 dark:text-gray-400"
        style={timerStyle}
        aria-hidden="true"
      >
        {phaseLabel || ' '}
      </div>

      <div id="screen-reader-update" aria-live="polite">
        {ariaTimer}
      </div>
    </>
  );
}
