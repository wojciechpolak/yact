/**
 * src/components/CountdownTimer.tsx
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
import { FaPlus, FaMinus } from 'react-icons/fa';
import { useSettings } from '@/context/SettingsContext';

interface CountdownTimerProps {
  initialTime: number;
  repeat: boolean;
  countUp: boolean;
  playEndSound: boolean;
  playLastTenSecondsSound: boolean;
  isActive: boolean;
  resetFlag: boolean;
  targetTime: number | null;
  onTimeUpdate: (hours: number, minutes: number, seconds: number) => void;
  onActiveChange: (active: boolean) => void;
  onSetTargetTime: (targetTime: number | null) => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  initialTime,
  repeat,
  countUp,
  playEndSound,
  playLastTenSecondsSound,
  isActive,
  resetFlag,
  targetTime,
  onTimeUpdate,
  onActiveChange,
  onSetTargetTime,
}) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [targetTimeState, setTargetTimeState] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hours, setHours] = useState(Math.floor(Math.abs(initialTime) / 3600));
  const [minutes, setMinutes] = useState(
    Math.floor((Math.abs(initialTime) % 3600) / 60)
  );
  const [seconds, setSeconds] = useState(Math.abs(initialTime) % 60);

  // Use settings from context
  const { showNotifications } = useSettings();

  // Function to handle notification permission and sending
  const sendNotification = () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification('Timer Finished', {
        body: 'Your countdown timer has ended.',
        icon: '/icons/icon-192x192.png',
      });
    }
    else if (Notification.permission !== 'denied') {
      // Ask for permission
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('Timer Finished', {
            body: 'Your countdown timer has ended.',
            icon: '/icons/icon-192x192.png',
          });
        }
      });
    }
  };

  // Update targetTimeState when timer starts or resets
  useEffect(() => {
    if (isActive) {
      let adjustedTimeLeft = timeLeft;

      // Only reset timeLeft if countUp is disabled
      if (timeLeft <= 0 && !countUp) {
        adjustedTimeLeft = initialTime;
        setTimeLeft(initialTime);
      }

      if (targetTime !== null) {
        const now = Date.now();
        if (targetTime > now) {
          // targetTime is in the future
          setTargetTimeState(targetTime);
        }
        else {
          // targetTime is in the past
          if (countUp) {
            // Continue counting up from the past targetTime
            setTargetTimeState(targetTime);
          }
          else {
            // Timer should have ended; set timeLeft to 0 and stop the timer
            setTimeLeft(0);
            onActiveChange(false);
          }
        }
      }
      else {
        const now = Date.now();
        const duration = adjustedTimeLeft * 1000; // Remaining time in milliseconds
        const newTargetTime = now + duration;
        setTargetTimeState(newTargetTime);
        onSetTargetTime(newTargetTime); // Inform parent of new targetTime
      }
    }
    else {
      setTargetTimeState(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, timeLeft, targetTime]);

  // Reset timeLeft when initialTime or resetFlag changes
  useEffect(() => {
    setTimeLeft(initialTime);
  }, [initialTime, resetFlag]);

  // Timer logic using targetTimeState
  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;

    if (isActive && !isEditing && targetTimeState !== null) {
      timerId = setInterval(() => {
        const now = Date.now();
        let newTimeLeft = Math.round((targetTimeState - now) / 1000); // In seconds

        if (newTimeLeft <= 0) {
          if (newTimeLeft === 0) {
            if (playEndSound) {
              const audio = new Audio('/audio/end.mp3');
              audio.play();
            }
            if (showNotifications) {
              sendNotification();
            }
          }

          if (repeat) {
            const newTargetTime = now + initialTime * 1000;
            setTargetTimeState(newTargetTime);
            onSetTargetTime(newTargetTime); // Inform parent of new targetTime
            newTimeLeft = initialTime;
          }
          else if (countUp) {
            // Continue counting up (negative values)
            // newTimeLeft is already negative
          }
          else {
            newTimeLeft = 0;
            onActiveChange(false); // Stop the timer
          }
        }
        else {
          if (playLastTenSecondsSound && newTimeLeft <= 10 && newTimeLeft > 0) {
            const audio = new Audio('/audio/tick.mp3');
            audio.play();
          }
        }

        setTimeLeft(newTimeLeft);
      }, 1000);
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
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
    onActiveChange,
    onSetTargetTime,
  ]);

  // Update hours, minutes, and seconds when timeLeft changes
  useEffect(() => {
    if (!isEditing) {
      const absTimeLeft = Math.abs(timeLeft);
      setHours(Math.floor(absTimeLeft / 3600));
      setMinutes(Math.floor((absTimeLeft % 3600) / 60));
      setSeconds(absTimeLeft % 60);
    }
  }, [timeLeft, isEditing]);

  // Update the document title with the timer
  useEffect(() => {
    // Determine the sign for "Count up" phase
    const sign = timeLeft < 0 ? '+' : '';

    // Format the time based on whether hours are zero
    const formattedTime =
      hours === 0
        ? `${sign}${formatTime(minutes)}:${formatTime(seconds)}`
        : `${sign}${hours}:${formatTime(minutes)}:${formatTime(seconds)}`;

    // Update the document title
    document.title = `${formattedTime} Countdown | YACT`;
  }, [timeLeft, hours, minutes, seconds]);

  const formatTime = (value: number) => {
    return value.toString().padStart(2, '0');
  };

  const openEditor = () => {
    setIsEditing(true);
    // Pause timer while editing
    onActiveChange(false);
  };

  const closeEditor = () => {
    setIsEditing(false);
  };

  const saveAndCloseEditor = () => {
    // Ensure values are non-negative
    const sanitizedHours = Math.max(0, hours);
    const sanitizedMinutes = Math.max(0, minutes);
    const sanitizedSeconds = Math.max(0, seconds);

    localStorage.setItem('hours', sanitizedHours.toString());
    localStorage.setItem('minutes', sanitizedMinutes.toString());
    localStorage.setItem('seconds', sanitizedSeconds.toString());

    const totalSeconds =
      sanitizedHours * 3600 + sanitizedMinutes * 60 + sanitizedSeconds;
    setTimeLeft(totalSeconds);
    setIsEditing(false);
    if (onTimeUpdate) {
      onTimeUpdate(sanitizedHours, sanitizedMinutes, sanitizedSeconds);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Timer Display */}
      <div
        className="text-[15vw] font-mono cursor-pointer select-none w-full text-center leading-none"
        onClick={openEditor}
      >
        {timeLeft < 0 && '+'}
        {formatTime(hours)}:{formatTime(minutes)}:{formatTime(seconds)}
      </div>

      {/* Editing Modal */}
      {isEditing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg max-w-3xl w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl">Set Timer</h2>
              <button
                onClick={closeEditor}
                className="text-gray-500 hover:text-gray-600 hover:scale-110 text-3xl"
              >
                ✕
              </button>
            </div>
            {/* Time Editing Controls */}
            <div className="flex space-x-8 mb-8 justify-center">
              {/* Hours */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setHours(hours + 1)}
                  className="text-4xl hover:scale-110"
                >
                  <FaPlus />
                </button>
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-24 text-center text-4xl border-b dark:bg-zinc-900"
                />
                <button
                  onClick={() => setHours(hours > 0 ? hours - 1 : 0)}
                  className="text-4xl hover:scale-110"
                >
                  <FaMinus />
                </button>
                <span className="mt-2 text-xl">Hours</span>
              </div>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setMinutes(minutes + 1)}
                  className="text-4xl hover:scale-110"
                >
                  <FaPlus />
                </button>
                <input
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  className="w-24 text-center text-4xl border-b dark:bg-zinc-900"
                />
                <button
                  onClick={() =>
                    setMinutes(minutes > 0 ? minutes - 1 : 0)
                  }
                  className="text-4xl hover:scale-110"
                >
                  <FaMinus />
                </button>
                <span className="mt-2 text-xl">Minutes</span>
              </div>

              {/* Seconds */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setSeconds(seconds + 1)}
                  className="text-4xl hover:scale-110"
                >
                  <FaPlus />
                </button>
                <input
                  type="number"
                  value={seconds}
                  onChange={(e) => setSeconds(Number(e.target.value))}
                  className="w-24 text-center text-4xl border-b dark:bg-zinc-900"
                />
                <button
                  onClick={() =>
                    setSeconds(seconds > 0 ? seconds - 1 : 0)
                  }
                  className="text-4xl hover:scale-110"
                >
                  <FaMinus />
                </button>
                <span className="mt-2 text-xl">Seconds</span>
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeEditor}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded text-xl"
              >
                Cancel
              </button>
              <button
                onClick={saveAndCloseEditor}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded text-xl"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CountdownTimer;
