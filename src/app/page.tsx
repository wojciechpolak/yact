/**
 * src/app/page.tsx
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

import { useEffect, useState } from 'react';
import { FaExpand, FaCog } from 'react-icons/fa';
import Link from 'next/link';

import CountdownTimer from '@/components/CountdownTimer';
import TimerSync from '@/components/TimerSync';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/context/SettingsContext';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  resetTimer, setInitialTime, setIsActive,
  setRepeat, setSavedInitialTime, setTargetTime
} from '@/store/timerSlice';

export default function Home() {

  const isMobile = 'ontouchstart' in window || !!navigator.maxTouchPoints;

  const [timerKey, setTimerKey] = useState(0);
  const dispatch = useAppDispatch();
  const {
    initialTime,
    isActive,
    repeat,
    targetTime,
  } = useAppSelector((state) => state.timer);

  // Load settings from context
  const {
    countUp,
    countToTime,
    playEndSound,
    playLastTenSecondsSound,
  } = useSettings();

  const toggleFullScreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    else {
      document.documentElement.requestFullscreen();
    }
  };

  // Handlers for Start, Pause, Reset
  const handleStart = () => {
    dispatch(setIsActive(true));
  };

  const handlePause = () => {
    dispatch(setIsActive(false));
  };

  const handleReset = () => {
    dispatch(resetTimer());
    setTimerKey((prev) => prev + 1);
  };

  // Build query parameters object to pass to Link components
  const queryParams = new URLSearchParams({
    hours: Math.floor(initialTime / 3600).toString(),
    minutes: Math.floor((initialTime % 3600) / 60).toString(),
    seconds: (initialTime % 60).toString(),
    repeat: repeat.toString(),
    active: isActive.toString(),
    ...(isActive && targetTime !== null ? {targetTime: targetTime.toString()} : {}),
  });

  // Add keyboard event listener for space bar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault();
        if (isActive) {
          handlePause();
        }
        else {
          handleStart();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      // Clean up the event listener on component unmount
      window.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  return (
    <div id="home" className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="absolute top-4 right-4 flex space-x-4 items-center">

        {/* Fullscreen Button */}
        {!isMobile && (
          <button
            onClick={toggleFullScreen}
            title="Full Screen"
            className="flex items-center space-x-1 hover:scale-105"
          >
            <FaExpand size={24} aria-hidden="true"/>
            <span className="hidden sm:inline">Full Screen</span>
          </button>
        )}

        {/* Repeat Toggle */}
        <Label htmlFor="repeat"
               className="text-base text-flex items-center space-x-2">
          Repeat
        </Label>
        <Switch id="repeat"
                aria-label="Repeat"
                checked={repeat}
                onCheckedChange={(checked) => dispatch(setRepeat(checked))}
        />

        {/* Settings Link */}
        <Link href={{pathname: '/settings', hash: queryParams.toString()}}
              accessKey=","
              passHref
        >
          <span className="text-blue-500 hover:text-blue-600 cursor-pointer flex items-center space-x-1">
            <FaCog size={24} aria-hidden="true"/>
            <span className="hidden sm:inline">Settings</span>
          </span>
        </Link>
      </div>

      {/* Timer Component */}
      <TimerSync/>
      <div className="w-full max-w-(--breakpoint-xl)">
        <CountdownTimer
          key={timerKey} // forces re-mount if timerKey changes
          initialTime={initialTime}
          countToTime={countToTime}
          repeat={repeat}
          countUp={countUp}
          playEndSound={playEndSound}
          playLastTenSecondsSound={playLastTenSecondsSound}
          isActive={isActive}
          targetTime={targetTime}
          onTimeUpdate={(hours, minutes, seconds) => {
            const totalSeconds = hours * 3600 + minutes * 60 + seconds;
            dispatch(setInitialTime(totalSeconds));
            dispatch(setSavedInitialTime(totalSeconds)); // Update saved initial time
          }}
          onSetTargetTime={(targetTime: number | null) => {
            dispatch(setTargetTime(targetTime))
          }}
          onActiveChange={(active) => {
            dispatch(setIsActive(active));
          }}
        />
      </div>

      {/* Control Buttons */}
      <div className="mt-8 flex space-x-4">
        {!isActive && (
          <button
            onClick={handleStart}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded text-xl"
          >
            Start
          </button>
        )}
        {isActive && (
          <button
            onClick={handlePause}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded text-xl"
          >
            Pause
          </button>
        )}
        <button
          onClick={handleReset}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded text-xl"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
