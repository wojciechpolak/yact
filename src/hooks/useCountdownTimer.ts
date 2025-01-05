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
  initialTime: number; // in seconds
  isActive: boolean; // from the parent
  countUp: boolean;
  repeat: boolean;
  playEndSound: boolean;
  playLastTenSecondsSound: boolean;
  showNotifications: boolean;
  resetFlag: boolean; // toggled from parent to force a reset
  targetTime?: number | null; // optional
  onActiveChange: (active: boolean) => void; // parent can set isActive
  onSetTargetTime?: (targetTime: number | null) => void; // optional
  onPlaySound: (url: string) => void;
  onSendNotification: () => void;
  onResetHandled: () => void;
}

export function useCountdownTimer({
  initialTime,
  isActive,
  countUp,
  repeat,
  playEndSound,
  playLastTenSecondsSound,
  showNotifications,
  resetFlag,
  onActiveChange,
  onSetTargetTime,
  onPlaySound,
  onSendNotification,
  onResetHandled,
}: UseCountdownTimerOptions) {

  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [targetTimeState, setTargetTimeState] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  /**
   * 1) Handle resetFlag from parent:
   *    - If it changes to true, do a full reset: timeLeft=initialTime, clear targetTime, pause.
   *    - Then call `onResetHandled` so parent sets resetFlag=false.
   */
  useEffect(() => {
    if (!resetFlag) return; // Only run when resetFlag becomes true

    // Perform the reset
    setTimeLeft(initialTime);
    setTargetTimeState(null);
    onActiveChange(false);  // Pause the timer if it's running

    // Tell the parent: "Reset is handled, you can set resetFlag to false now!"
    onResetHandled();

  }, [resetFlag, initialTime, onActiveChange, onResetHandled]);

  /**
   * 2) Keep local timeLeft in sync if `initialTime` changes externally
   */
  useEffect(() => {
    setTimeLeft(initialTime);
  }, [initialTime]);

  /**
   * 3) Start/Pause logic:
   *    - If isActive goes from false → true, recalc a fresh targetTime from current timeLeft
   *    - If isActive = false, nullify targetTime => "pause"
   */
  useEffect(() => {
    if (isActive) {
      // If timeLeft <= 0 and not counting up, reset to initialTime
      let adjustedTime = timeLeft;
      if (timeLeft <= 0 && !countUp) {
        adjustedTime = initialTime;
        setTimeLeft(adjustedTime);
      }

      const now = Date.now();
      // If we don't have a valid future targetTime, recalc it
      // (this covers Start after Pause, or brand-new Start).
      if (!targetTimeState || targetTimeState < now) {
        const newTarget = now + adjustedTime * 1000;
        setTargetTimeState(newTarget);
        onSetTargetTime?.(newTarget);
      }
    }
    else {
      // Paused/stopped
      setTargetTimeState(null);
    }
  }, [
    isActive,
    timeLeft,
    initialTime,
    countUp,
    targetTimeState,
    onActiveChange,
    onSetTargetTime,
  ]);

  /**
   * 4) The main interval:
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
          // Reset to initialTime
          const nextTarget = now + initialTime * 1000;
          setTargetTimeState(nextTarget);
          onSetTargetTime?.(nextTarget);
          newTimeLeft = initialTime;
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
    isActive,
    isEditing,
    targetTimeState,
    initialTime,
    repeat,
    countUp,
    playEndSound,
    playLastTenSecondsSound,
    showNotifications,
    onPlaySound,
    onSendNotification,
    onActiveChange,
    onSetTargetTime,
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
