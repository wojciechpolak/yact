/**
 * src/hooks/useTimerTarget.ts
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

import { useState, useEffect, useCallback } from 'react';
import { nextClockOccurrence } from '@/lib/clockTime';
import type { CyclePhase } from '@/store/timerSlice';

interface StartTarget {
  target: number;
  /** Whether the target should be persisted to the store/URL. */
  persist: boolean;
  /** Cycle phase to announce, or null to leave the phase untouched. */
  phase: CyclePhase | null;
}

interface StartTargetInput {
  now: number;
  countUp: boolean;
  countToTime: boolean;
  cooldownSeconds: number;
  cyclePhase: CyclePhase;
  initialTime: number;
  repeat: boolean;
  timeLeft: number;
}

function clockStartTarget({
  now,
  countUp,
  initialTime,
  repeat,
  timeLeft,
}: StartTargetInput): StartTarget {
  if (countUp && !repeat && timeLeft <= 0) {
    // Already past the target: resume counting up from a target in the past,
    // which must never reach the store or the URL.
    return { target: now + timeLeft * 1000, persist: false, phase: null };
  }
  return { target: nextClockOccurrence(initialTime, now), persist: true, phase: 'work' };
}

function durationStartTarget({
  now,
  countUp,
  cooldownSeconds,
  cyclePhase,
  initialTime,
  timeLeft,
}: StartTargetInput): StartTarget {
  const isRestWithCooldown = cyclePhase === 'rest' && cooldownSeconds > 0;
  const fallbackDuration = isRestWithCooldown ? cooldownSeconds : initialTime;
  const adjustedTime = timeLeft <= 0 && !countUp ? fallbackDuration : timeLeft;
  return {
    target: now + adjustedTime * 1000,
    persist: timeLeft > 0 || isRestWithCooldown,
    phase: null,
  };
}

function computeStartTarget(input: StartTargetInput): StartTarget {
  return input.countToTime ? clockStartTarget(input) : durationStartTarget(input);
}

interface UseTimerTargetOptions {
  countUp: boolean;
  countToTime: boolean;
  cooldownSeconds: number;
  cyclePhase: CyclePhase;
  initialTime: number;
  isActive: boolean;
  /** Called when the timer is paused or stopped, to drop tick bookkeeping. */
  onPause: () => void;
  onSetCyclePhase?: (phase: CyclePhase) => void;
  onSetTargetTime?: (targetTime: number | null) => void;
  repeat: boolean;
  /** A target time coming from the store/URL, adopted once if still ahead. */
  storedTargetTime?: number | null;
  timeLeft: number;
}

/**
 * Owns the timestamp the countdown is running towards.
 *  - If isActive goes from false → true, recalc a fresh target from current timeLeft
 *  - If isActive = false, nullify the target => "pause"
 */
export function useTimerTarget({
  countUp,
  countToTime,
  cooldownSeconds,
  cyclePhase,
  initialTime,
  isActive,
  onPause,
  onSetCyclePhase,
  onSetTargetTime,
  repeat,
  storedTargetTime,
  timeLeft,
}: UseTimerTargetOptions) {
  const [targetTime, setTargetTime] = useState<number | null>(null);
  const [isStoredTargetUsed, setIsStoredTargetUsed] = useState(false);

  /**
   * Adopts a still-valid target coming from the store, so a shared or reloaded
   * timer resumes where it left off. Returns true when it did.
   */
  const restoreStoredTarget = useCallback(
    (now: number) => {
      if (isStoredTargetUsed || targetTime || !storedTargetTime || storedTargetTime <= now) {
        return false;
      }
      setTargetTime(storedTargetTime);
      if (countToTime) {
        onSetCyclePhase?.('work');
      }
      return true;
    },
    [countToTime, isStoredTargetUsed, onSetCyclePhase, storedTargetTime, targetTime],
  );

  const applyStartTarget = useCallback(
    (now: number) => {
      const { target, persist, phase } = computeStartTarget({
        now,
        countUp,
        countToTime,
        cooldownSeconds,
        cyclePhase,
        initialTime,
        repeat,
        timeLeft,
      });
      setTargetTime(target);
      if (phase) {
        onSetCyclePhase?.(phase);
      }
      if (persist) {
        onSetTargetTime?.(target);
      }
    },
    [
      countUp,
      countToTime,
      cooldownSeconds,
      cyclePhase,
      initialTime,
      onSetCyclePhase,
      onSetTargetTime,
      repeat,
      timeLeft,
    ],
  );

  useEffect(() => {
    if (!isActive) {
      // Paused/stopped
      setTargetTime(null);
      onPause();
      return;
    }

    const now = Date.now();
    const restored = restoreStoredTarget(now);
    setIsStoredTargetUsed(true);
    if (restored) {
      return;
    }

    // Keep a target that is still in the future; otherwise recalculate it
    // (this covers Start after Pause, or brand-new Start).
    if (targetTime && targetTime >= now) {
      return;
    }
    applyStartTarget(now);
  }, [applyStartTarget, isActive, onPause, restoreStoredTarget, targetTime]);

  return { targetTime, setTargetTime };
}
