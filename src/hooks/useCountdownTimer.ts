/**
 * src/hooks/useCountdownTimer.ts
 *
 * YACT Copyright (C) 2024-2025 Wojciech Polak
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

interface UseCountdownTimerOptions {
  countUp: boolean;
  // If true, interpret initialTime as time-of-day (HH:MM:SS) seconds since midnight
  // and count down to the next occurrence of that clock time.
  countToTime: boolean;
  initialTime: number; // in seconds
  isActive: boolean; // from the parent
  onActiveChange: (active: boolean) => void; // parent can set isActive
  onPlaySound: (url: string) => void;
  onSendNotification: () => void;
  onSetTargetTime?: (targetTime: number | null) => void; // optional
  playEndSound: boolean;
  playLastTenSecondsSound: boolean;
  repeat: boolean;
  showNotifications: boolean;
  targetTime?: number | null; // optional
}

export function useCountdownTimer({
  countUp,
  countToTime,
  initialTime,
  isActive,
  onActiveChange,
  onPlaySound,
  onSendNotification,
  onSetTargetTime,
  playEndSound,
  playLastTenSecondsSound,
  repeat,
  showNotifications,
  targetTime,
}: UseCountdownTimerOptions) {

  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [targetTimeState, setTargetTimeState] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isInitialTargetTimeUsed, setIsInitialTargetTimeUsed] = useState(false);

  // Helper to compute the next target timestamp from a time-of-day in seconds
  const computeNextClockTarget = useCallback((secondsSinceMidnight: number) => {
    const now = new Date();
    const hours = Math.floor(secondsSinceMidnight / 3600);
    const minutes = Math.floor((secondsSinceMidnight % 3600) / 60);
    const seconds = secondsSinceMidnight % 60;

    const target = new Date(now);
    target.setHours(hours, minutes, seconds, 0);
    if (target.getTime() <= now.getTime()) {
      // target already passed today -> use tomorrow
      target.setDate(target.getDate() + 1);
    }
    return target.getTime();
  }, []);

  // 1) Keep local timeLeft in sync if `initialTime` changes externally
  useEffect(() => {
    if (countToTime) {
      const nextTarget = computeNextClockTarget(initialTime);
      const now = Date.now();
      const diff = Math.max(0, Math.round((nextTarget - now) / 1000));
      setTimeLeft(diff);
    }
    else {
      setTimeLeft(initialTime);
    }
  }, [computeNextClockTarget, countToTime, initialTime]);

  /**
   * 2) Start/Pause logic:
   *    - If isActive goes from false → true, recalc a fresh targetTime from current timeLeft
   *    - If isActive = false, nullify targetTime => "pause"
   */
  useEffect(() => {
    if (!isActive) {
      // Paused/stopped
      setTargetTimeState(null);
      return;
    }

    const now = Date.now();

    // If the local `targetTimeState` is null, but we have a valid
    // "targetTime" from the store that is still in the future,
    // use that first:
    if (!isInitialTargetTimeUsed && !targetTimeState &&
      (targetTime && targetTime > now)) {
      setTargetTimeState(targetTime);
      setIsInitialTargetTimeUsed(true);
      return;
    }
    setIsInitialTargetTimeUsed(true);

    // If we don't have a valid future targetTime, recalc it
    // (this covers Start after Pause, or brand-new Start).
    if (!targetTimeState || targetTimeState < now) {
      if (countToTime) {
        // In target-time mode:
        // - If counting up and not repeating and we've already passed the target (timeLeft <= 0),
        //   set a past target so we keep counting up after resume.
        // - Otherwise, compute the next occurrence of the desired clock time.
        if (countUp && !repeat && timeLeft <= 0) {
          const pastTarget = now + timeLeft * 1000; // timeLeft is negative
          setTargetTimeState(pastTarget);
          // Do not persist past targets to store/url
        }
        else {
          const newTarget = computeNextClockTarget(initialTime);
          setTargetTimeState(newTarget);
          onSetTargetTime?.(newTarget);
        }
      }
      else {
        const adjustedTime = timeLeft <= 0 && !countUp ? initialTime : timeLeft;
        const newTarget = now + adjustedTime * 1000;
        setTargetTimeState(newTarget);
        if (timeLeft > 0) {
          onSetTargetTime?.(newTarget);
        }
      }
    }
  }, [
    countUp,
    countToTime,
    computeNextClockTarget,
    initialTime,
    isActive,
    isInitialTargetTimeUsed,
    onActiveChange,
    onSetTargetTime,
    repeat,
    targetTime,
    targetTimeState,
    timeLeft,
  ]);

  /**
   * 3) The main interval:
   *    - If active + not editing + targetTimeState => tick each second
   */
  useEffect(() => {
    if (!isActive || isEditing || targetTimeState === null) {
      return;
    }

    const timerId = setInterval(() => {
      const now = Date.now();
      let newTimeLeft = Math.round((targetTimeState - now) / 1000);

      if (newTimeLeft <= 0) {
        if (newTimeLeft === 0) {
          if (playEndSound) {
            onPlaySound('/audio/end.mp3');
          }
          if (showNotifications) {
            onSendNotification();
          }
        }

        if (repeat) {
          // Repeat behavior differs by mode
          if (countToTime) {
            const dayMs = 24 * 60 * 60 * 1000;
            const nextTarget = targetTimeState + dayMs;
            setTargetTimeState(nextTarget);
            onSetTargetTime?.(nextTarget);
            newTimeLeft = Math.round((nextTarget - now) / 1000);
          }
          else {
            // Reset to the initial duration
            const nextTarget = now + initialTime * 1000;
            setTargetTimeState(nextTarget);
            onSetTargetTime?.(nextTarget);
            newTimeLeft = initialTime;
          }
        }
        else if (countUp) {
          // keep going negative
        }
        else {
          // Hard stop at 0
          newTimeLeft = 0;
          onActiveChange(false);
        }
      }
      else {
        // We have time > 0
        if (playLastTenSecondsSound && newTimeLeft <= 10) {
          onPlaySound('/audio/tick.mp3');
        }
      }

      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timerId);
  }, [
    countUp,
    countToTime,
    initialTime,
    isActive,
    isEditing,
    onActiveChange,
    onPlaySound,
    onSendNotification,
    onSetTargetTime,
    playEndSound,
    playLastTenSecondsSound,
    repeat,
    showNotifications,
    targetTimeState,
  ]);

  // Editor open/close
  const openEditor = useCallback(() => {
    setIsEditing(true);
    onActiveChange(false);
  }, [onActiveChange]);

  const closeEditor = useCallback(() => {
    setIsEditing(false);
  }, []);

  // Derived hours, mins, secs from timeLeft
  const absTimeLeft = Math.abs(timeLeft);
  const h = Math.floor(absTimeLeft / 3600);
  const m = Math.floor((absTimeLeft % 3600) / 60);
  const s = absTimeLeft % 60;

  return {
    timeLeft,
    setTimeLeft,
    isEditing,
    openEditor,
    closeEditor,
    h,
    m,
    s,
  };
}
