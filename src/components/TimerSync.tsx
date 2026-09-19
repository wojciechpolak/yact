/**
 * src/components/TimerSync.tsx
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

import { useEffect, useRef } from 'react';
import { useHashParams } from '@/lib/useHashParams';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useSettings } from '@/context/SettingsContext';
import {
  setCooldownSeconds,
  setBreakColor,
  setCyclePhase,
  setInitialTime,
  setIsActive,
  setRepeat,
  setSavedInitialTime,
  setTargetTime,
} from '@/store/timerSlice';

/** Reads a value from the URL hash, falling back to localStorage. */
function readParam(hashParams: URLSearchParams, key: string) {
  return hashParams.get(key) || localStorage.getItem(key);
}

function toInt(value: string | null, fallback: number) {
  return value ? parseInt(value, 10) : fallback;
}

/** Resolves the persisted timer state from the URL hash and localStorage. */
function readStoredTimerState(hashParams: URLSearchParams) {
  const read = (key: string) => readParam(hashParams, key);

  const hours = toInt(read('hours'), 0);
  const minutes = toInt(read('minutes'), 1);
  const seconds = toInt(read('seconds'), 0);
  const cooldownSecondsParam = read('cooldownSeconds');
  const targetTimeParam = read('targetTime');

  return {
    totalSeconds: hours * 3600 + minutes * 60 + seconds,
    repeat: read('repeat') === 'true',
    isActive: read('active') === 'true',
    cooldownSeconds: cooldownSecondsParam
      ? Math.max(0, parseInt(cooldownSecondsParam, 10) || 0)
      : 0,
    breakColor: read('breakColor') || null,
    cyclePhase: read('cyclePhase') === 'rest' ? ('rest' as const) : ('work' as const),
    targetTime: targetTimeParam ? parseInt(targetTimeParam, 10) : null,
  };
}

/**
 * TimerSync:
 *  - On mount, read from URL hash (or localStorage) => dispatch to store
 *  - On store changes, update URL hash & localStorage
 */
export default function TimerSync() {
  const hashParams = useHashParams();
  const dispatch = useAppDispatch();
  const { countToTime, setCountToTime } = useSettings();
  const {
    initialTime,
    isActive,
    repeat,
    savedInitialTime,
    targetTime,
    cooldownSeconds,
    breakColor,
    cyclePhase,
  } = useAppSelector((state) => state.timer);

  // This ref ensures we only parse the hash once on mount
  const hasLoadedRef = useRef(false);

  // read from the URL or localStorage on mount
  useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }
    hasLoadedRef.current = true;

    const stored = readStoredTimerState(hashParams);
    dispatch(setRepeat(stored.repeat));
    dispatch(setIsActive(stored.isActive));
    dispatch(setCooldownSeconds(stored.cooldownSeconds));
    dispatch(setBreakColor(stored.breakColor));
    dispatch(setCyclePhase(stored.cyclePhase));
    dispatch(setInitialTime(stored.totalSeconds));
    dispatch(setSavedInitialTime(stored.totalSeconds));
    dispatch(setTargetTime(stored.targetTime));

    // Apply mode to settings context
    const modeParam = hashParams.get('mode');
    if (modeParam === 'target') {
      setCountToTime(true);
      return;
    }
    if (modeParam !== null) {
      return;
    }
    const saved = localStorage.getItem('countToTime');
    if (saved !== null) {
      setCountToTime(saved === 'true');
    }
  }, [dispatch, hashParams, setCountToTime]);

  // watch relevant fields in the Redux store, update URL & localStorage
  useEffect(() => {
    const totalSeconds = initialTime;
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    // localStorage
    localStorage.setItem('hours', hours.toString());
    localStorage.setItem('minutes', mins.toString());
    localStorage.setItem('seconds', secs.toString());
    localStorage.setItem('repeat', repeat.toString());
    localStorage.setItem('active', isActive.toString());
    localStorage.setItem('cooldownSeconds', cooldownSeconds.toString());
    if (breakColor) {
      localStorage.setItem('breakColor', breakColor);
    } else {
      localStorage.removeItem('breakColor');
    }
    localStorage.setItem('cyclePhase', cyclePhase);
    if (targetTime !== null) {
      localStorage.setItem('targetTime', targetTime.toString());
    } else {
      localStorage.removeItem('targetTime');
    }
    localStorage.setItem('countToTime', countToTime.toString());

    const params = new URLSearchParams();
    params.set('hours', hours.toString());
    params.set('minutes', mins.toString());
    params.set('seconds', secs.toString());
    params.set('repeat', repeat.toString());
    params.set('active', isActive.toString());
    params.set('cooldownSeconds', cooldownSeconds.toString());
    if (breakColor) {
      params.set('breakColor', breakColor);
    }
    params.set('cyclePhase', cyclePhase);
    if (targetTime !== null) {
      params.set('targetTime', targetTime.toString());
    }
    if (countToTime) {
      params.set('mode', 'target');
    }

    const newHash = params.toString();
    const newUrl = `${window.location.pathname}${window.location.search}#${newHash}`;

    window.history.replaceState(null, '', newUrl);
  }, [
    initialTime,
    savedInitialTime,
    isActive,
    repeat,
    targetTime,
    countToTime,
    cooldownSeconds,
    breakColor,
    cyclePhase,
  ]);

  return null; // This component doesn't render anything
}
