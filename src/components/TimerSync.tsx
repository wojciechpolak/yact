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

    // fallback to localStorage if no hash param
    const hoursParam = hashParams.get('hours') || localStorage.getItem('hours');
    const minutesParam = hashParams.get('minutes') || localStorage.getItem('minutes');
    const secondsParam = hashParams.get('seconds') || localStorage.getItem('seconds');
    const repeatParam = hashParams.get('repeat') || localStorage.getItem('repeat');
    const activeParam = hashParams.get('active') || localStorage.getItem('active');
    const targetTimeParam = hashParams.get('targetTime') || localStorage.getItem('targetTime');
    const cooldownSecondsParam =
      hashParams.get('cooldownSeconds') || localStorage.getItem('cooldownSeconds');
    const breakColorParam = hashParams.get('breakColor') || localStorage.getItem('breakColor');
    const cyclePhaseParam = hashParams.get('cyclePhase') || localStorage.getItem('cyclePhase');
    const modeParam = hashParams.get('mode');

    const hours = hoursParam ? parseInt(hoursParam, 10) : 0;
    const minutes = minutesParam ? parseInt(minutesParam, 10) : 1;
    const seconds = secondsParam ? parseInt(secondsParam, 10) : 0;

    dispatch(setRepeat(repeatParam === 'true'));
    dispatch(setIsActive(activeParam === 'true'));
    dispatch(
      setCooldownSeconds(
        cooldownSecondsParam ? Math.max(0, parseInt(cooldownSecondsParam, 10) || 0) : 0,
      ),
    );
    dispatch(setBreakColor(breakColorParam || null));
    dispatch(setCyclePhase(cyclePhaseParam === 'rest' ? 'rest' : 'work'));

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    dispatch(setInitialTime(totalSeconds));
    dispatch(setSavedInitialTime(totalSeconds));

    if (targetTimeParam) {
      dispatch(setTargetTime(parseInt(targetTimeParam, 10)));
    } else {
      dispatch(setTargetTime(null));
    }

    // Apply mode to settings context
    if (modeParam === 'target') {
      setCountToTime(true);
    } else if (modeParam === null) {
      const saved = localStorage.getItem('countToTime');
      if (saved !== null) {
        setCountToTime(saved === 'true');
      }
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
