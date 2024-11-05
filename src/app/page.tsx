/**
 * src/app/page.tsx
 *
 * YACT Copyright (C) 2024 Wojciech Polak
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

import { useState, useEffect } from 'react';
import { FaExpand, FaCog } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import CountdownTimer from '@/components/CountdownTimer';
import { useSettings } from '@/context/SettingsContext';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = 'ontouchstart' in window || !!navigator.maxTouchPoints;

  // Timer settings from URL parameters
  const [initialTime, setInitialTime] = useState(60); // Default to 60 seconds
  const [savedInitialTime, setSavedInitialTime] = useState(60); // For Reset functionality
  const [repeat, setRepeat] = useState(false);
  const [isActive, setIsActive] = useState(false); // Timer active state
  const [resetFlag, setResetFlag] = useState(false); // Flag to trigger reset
  const [targetTime, setTargetTime] = useState<number | null>(null);

  const _setIsActive = ((val: boolean) => {
    localStorage.setItem('active', val.toString());
    setIsActive(val);
  });

  const _setRepeat = ((val: boolean) => {
    localStorage.setItem('repeat', val.toString());
    setRepeat(val);
  });

  // Load settings from context
  const {
    countUp,
    playEndSound,
    playLastTenSecondsSound,
  } = useSettings();

  // Load timer settings from URL parameters whenever they change
  useEffect(() => {
    // Parse URL parameters using useSearchParams
    const hoursParam = searchParams.get('hours') || localStorage.getItem('hours');
    const minutesParam = searchParams.get('minutes') || localStorage.getItem('minutes');
    const secondsParam = searchParams.get('seconds') || localStorage.getItem('seconds');
    const repeatParam = searchParams.get('repeat') || localStorage.getItem('repeat');
    const activeParam = searchParams.get('active') || localStorage.getItem('active');
    const targetTimeParam = searchParams.get('targetTime') || localStorage.getItem('targetTime');

    const hours = hoursParam ? parseInt(hoursParam) : 0;
    const minutes = minutesParam ? parseInt(minutesParam) : 1; // Default to 1 minute
    const seconds = secondsParam ? parseInt(secondsParam) : 0;

    setRepeat(repeatParam === 'true');
    setIsActive(activeParam === 'true');

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    setInitialTime(totalSeconds);
    setSavedInitialTime(totalSeconds);

    // Set targetTime from URL if available
    if (targetTimeParam) {
      const targetTimeFromURL = parseInt(targetTimeParam);
      setTargetTime(targetTimeFromURL);
    }
    else {
      setTargetTime(null);
    }
  }, [searchParams]);

  // Update URL parameters when settings change
  useEffect(() => {
    updateURLParams(undefined, undefined, undefined, targetTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTime, repeat, isActive, targetTime]);

  const updateURLParams = (
    hours?: number,
    minutes?: number,
    seconds?: number,
    targetTimeParam?: number | null
  ) => {
    const params = new URLSearchParams();

    const totalSeconds =
      hours !== undefined && minutes !== undefined && seconds !== undefined
        ? hours * 3600 + minutes * 60 + seconds
        : initialTime;

    const currentHours = hours !== undefined ? hours : Math.floor(totalSeconds / 3600);
    const currentMinutes =
      minutes !== undefined ? minutes : Math.floor((totalSeconds % 3600) / 60);
    const currentSeconds = seconds !== undefined ? seconds : totalSeconds % 60;

    params.set('hours', currentHours.toString());
    params.set('minutes', currentMinutes.toString());
    params.set('seconds', currentSeconds.toString());
    params.set('repeat', repeat.toString());
    params.set('active', isActive.toString());

    // Include targetTime in the URL if the timer is active
    if (isActive && targetTimeParam) {
      params.set('targetTime', targetTimeParam.toString());
    }
    else {
      // Remove targetTime from URL if timer is not active
      params.delete('targetTime');
    }

    const url = `${window.location.pathname}?${params.toString()}`;
    router.replace(url);
  };

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
    _setIsActive(true);
    updateURLParams(undefined, undefined, undefined, targetTime);
  };

  const handlePause = () => {
    _setIsActive(false);
    updateURLParams(undefined, undefined, undefined, null);
  };

  const handleReset = () => {
    _setIsActive(false);
    setTargetTime(null);
    // Reset to saved initial time
    setInitialTime(savedInitialTime);
    setResetFlag((prev) => !prev); // Toggle resetFlag to trigger reset
    updateURLParams(undefined, undefined, undefined, null);
  };

  // Update repeat in URL when it changes
  useEffect(() => {
    updateURLParams(undefined, undefined, undefined, targetTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeat]);

  // Build query parameters object to pass to Link components
  const queryParams = {
    hours: Math.floor(initialTime / 3600).toString(),
    minutes: Math.floor((initialTime % 3600) / 60).toString(),
    seconds: (initialTime % 60).toString(),
    repeat: repeat.toString(),
    active: isActive.toString(),
    // Include targetTime if the timer is active
    ...(isActive && targetTime !== null ? {targetTime: targetTime.toString()} : {}),
  };

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
            <FaExpand size={24} />
            <span className="hidden sm:inline">Full Screen</span>
          </button>
        )}
        {/* Repeat Toggle */}
        <Label htmlFor="repeat"
               className="text-base text-flex items-center space-x-2">
          Repeat
        </Label>
        <Switch id="repeat"
          checked={repeat}
          onCheckedChange={(checked) => _setRepeat(checked)}
        />
        {/* Settings Link */}
        <Link
          href={{ pathname: '/settings', query: queryParams }}
          passHref
        >
          <span className="text-blue-500 hover:text-blue-600 cursor-pointer flex items-center space-x-1">
            <FaCog size={24} />
            <span className="hidden sm:inline">Settings</span>
          </span>
        </Link>
      </div>

      {/* Timer Component */}
      <div className="w-full max-w-screen-xl">
        <CountdownTimer
          initialTime={initialTime}
          repeat={repeat}
          countUp={countUp}
          playEndSound={playEndSound}
          playLastTenSecondsSound={playLastTenSecondsSound}
          isActive={isActive}
          resetFlag={resetFlag}
          targetTime={targetTime}
          onTimeUpdate={(hours, minutes, seconds) => {
            const totalSeconds = hours * 3600 + minutes * 60 + seconds;
            setInitialTime(totalSeconds);
            setSavedInitialTime(totalSeconds); // Update saved initial time
            updateURLParams(hours, minutes, seconds, targetTime);
          }}
          onActiveChange={(active) => {
            setIsActive(active);
            updateURLParams(undefined, undefined, undefined, targetTime);
          }}
          onSetTargetTime={(newTargetTime) => {
            setTargetTime(newTargetTime);
            updateURLParams(undefined, undefined, undefined, newTargetTime);
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
