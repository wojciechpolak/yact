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

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTimerTarget } from '@/hooks/useTimerTarget';
import { nextClockOccurrence } from '@/lib/clockTime';
import type { CyclePhase } from '@/store/timerSlice';

interface RepeatStep {
  target: number;
  phase: CyclePhase;
  timeLeft: number;
}

/** The next cycle to run once the timer reaches zero while `repeat` is on. */
function nextRepeatStep({
  now,
  countToTime,
  cooldownSeconds,
  cyclePhase,
  initialTime,
  targetTime,
}: {
  now: number;
  countToTime: boolean;
  cooldownSeconds: number;
  cyclePhase: CyclePhase;
  initialTime: number;
  targetTime: number;
}): RepeatStep {
  if (countToTime) {
    const target = targetTime + 24 * 60 * 60 * 1000;
    return { target, phase: 'work', timeLeft: Math.round((target - now) / 1000) };
  }
  const phase: CyclePhase = cyclePhase === 'rest' ? 'work' : cooldownSeconds > 0 ? 'rest' : 'work';
  const duration = phase === 'rest' ? cooldownSeconds : initialTime;
  return { target: now + duration * 1000, phase, timeLeft: duration };
}

interface UseCountdownTimerOptions {
  countUp: boolean;
  // If true, interpret initialTime as time-of-day (HH:MM:SS) seconds since midnight
  // and count down to the next occurrence of that clock time.
  countToTime: boolean;
  initialTime: number; // in seconds
  cooldownSeconds: number;
  cyclePhase: CyclePhase;
  endSoundUrl: string;
  isActive: boolean; // from the parent
  onActiveChange: (active: boolean) => void; // parent can set isActive
  onPlaySound: (url: string) => void;
  onSendNotification: () => void;
  onVibrate: () => void;
  onSetTargetTime?: (targetTime: number | null) => void; // optional
  onSetCyclePhase?: (phase: CyclePhase) => void;
  playEndSound: boolean;
  playLastTenSecondsSound: boolean;
  // Breaks of at most this many seconds are too short to tick through.
  minCooldownForTickSound: number;
  repeat: boolean;
  showNotifications: boolean;
  targetTime?: number | null; // optional
  tickSoundUrl: string;
  vibrateOnEnd: boolean;
}

export function useCountdownTimer({
  countUp,
  countToTime,
  initialTime,
  cooldownSeconds,
  cyclePhase,
  endSoundUrl,
  isActive,
  onActiveChange,
  onPlaySound,
  onSendNotification,
  onVibrate,
  onSetTargetTime,
  onSetCyclePhase,
  playEndSound,
  playLastTenSecondsSound,
  minCooldownForTickSound,
  repeat,
  showNotifications,
  targetTime,
  tickSoundUrl,
  vibrateOnEnd,
}: UseCountdownTimerOptions) {
  const [timeLeft, setTimeLeftState] = useState(initialTime);
  const [isEditing, setIsEditing] = useState(false);
  // Mirrors `timeLeft` so a tick can read the previous value without re-subscribing.
  const timeLeftRef = useRef(timeLeft);
  const lastTickSoundSecondRef = useRef<number | null>(null);

  // Every write goes through here, so the ref can never drift from the state.
  const setTimeLeft = useCallback((value: number) => {
    timeLeftRef.current = value;
    setTimeLeftState(value);
  }, []);

  const resetTickSound = useCallback(() => {
    lastTickSoundSecondRef.current = null;
  }, []);

  // 1) Keep local timeLeft in sync if `initialTime` changes externally
  useEffect(() => {
    if (countToTime) {
      const now = Date.now();
      setTimeLeft(Math.max(0, Math.round((nextClockOccurrence(initialTime, now) - now) / 1000)));
    } else {
      setTimeLeft(initialTime);
    }
  }, [countToTime, initialTime, setTimeLeft]);

  // 2) The timestamp we are counting towards (start/pause lives in here)
  const { targetTime: targetTimeState, setTargetTime: setTargetTimeState } = useTimerTarget({
    countUp,
    countToTime,
    cooldownSeconds,
    cyclePhase,
    initialTime,
    isActive,
    onPause: resetTickSound,
    onSetCyclePhase,
    onSetTargetTime,
    repeat,
    storedTargetTime: targetTime,
    timeLeft,
  });

  const announceEnd = useCallback(() => {
    if (playEndSound) {
      onPlaySound(endSoundUrl);
    }
    if (vibrateOnEnd) {
      onVibrate();
    }
    if (showNotifications && (countToTime || cyclePhase === 'work')) {
      onSendNotification();
    }
  }, [
    countToTime,
    cyclePhase,
    endSoundUrl,
    onPlaySound,
    onSendNotification,
    onVibrate,
    playEndSound,
    showNotifications,
    vibrateOnEnd,
  ]);

  const updateTickSound = useCallback(
    (secondsLeft: number) => {
      // Breaks at or under the configured cooldown are too short to tick through.
      const ticking =
        playLastTenSecondsSound &&
        !(cyclePhase === 'rest' && cooldownSeconds <= minCooldownForTickSound);
      if (!ticking || secondsLeft > 10) {
        lastTickSoundSecondRef.current = null;
        return;
      }
      if (lastTickSoundSecondRef.current !== secondsLeft) {
        onPlaySound(tickSoundUrl);
        lastTickSoundSecondRef.current = secondsLeft;
      }
    },
    [
      cooldownSeconds,
      cyclePhase,
      minCooldownForTickSound,
      onPlaySound,
      playLastTenSecondsSound,
      tickSoundUrl,
    ],
  );

  /**
   * 3) The main interval:
   *    - If active + not editing + targetTimeState => tick each second
   */
  const updateTimeLeft = useCallback(() => {
    if (targetTimeState === null) {
      return;
    }

    const now = Date.now();
    const newTimeLeft = Math.round((targetTimeState - now) / 1000);

    if (newTimeLeft > 0) {
      updateTickSound(newTimeLeft);
      setTimeLeft(newTimeLeft);
      return;
    }

    if (timeLeftRef.current > 0) {
      announceEnd();
    }

    if (repeat) {
      const step = nextRepeatStep({
        now,
        countToTime,
        cooldownSeconds,
        cyclePhase,
        initialTime,
        targetTime: targetTimeState,
      });
      setTargetTimeState(step.target);
      onSetCyclePhase?.(step.phase);
      onSetTargetTime?.(step.target);
      resetTickSound();
      setTimeLeft(step.timeLeft);
      return;
    }

    if (countUp) {
      // keep going negative
      setTimeLeft(newTimeLeft);
      return;
    }

    // Hard stop at 0
    onActiveChange(false);
    resetTickSound();
    setTimeLeft(0);
  }, [
    announceEnd,
    countUp,
    countToTime,
    cooldownSeconds,
    cyclePhase,
    initialTime,
    onActiveChange,
    onSetCyclePhase,
    onSetTargetTime,
    repeat,
    resetTickSound,
    setTargetTimeState,
    setTimeLeft,
    targetTimeState,
    updateTickSound,
  ]);

  useEffect(() => {
    if (!isActive || isEditing || targetTimeState === null) {
      return;
    }

    const resyncTimer = () => {
      updateTimeLeft();
    };

    updateTimeLeft();

    const timerId = setInterval(updateTimeLeft, 1000);
    document.addEventListener('visibilitychange', resyncTimer);
    window.addEventListener('focus', resyncTimer);
    window.addEventListener('pageshow', resyncTimer);

    return () => {
      clearInterval(timerId);
      document.removeEventListener('visibilitychange', resyncTimer);
      window.removeEventListener('focus', resyncTimer);
      window.removeEventListener('pageshow', resyncTimer);
    };
  }, [isActive, isEditing, targetTimeState, updateTimeLeft]);

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
