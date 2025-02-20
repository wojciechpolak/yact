/**
 * src/components/CountdownTimer.tsx
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
import { useAudioManager } from '@/hooks/useAudioManager';
import { useCountdownTimer } from '@/hooks/useCountdownTimer';
import { useSettings } from '@/context/SettingsContext';
import TimerEditorModal from '@/components/TimerEditorModal';

interface CountdownTimerProps {
  countUp: boolean;
  initialTime: number;
  isActive: boolean; // parent sets or toggles
  onActiveChange: (active: boolean) => void;
  onSetTargetTime: (targetTime: number | null) => void;
  onTimeUpdate?: (h: number, m: number, s: number) => void; // called on manual edit
  playEndSound: boolean;
  playLastTenSecondsSound: boolean;
  repeat: boolean;
  targetTime: number | null;
}

export default function CountdownTimer({
  countUp,
  initialTime,
  isActive,
  onActiveChange,
  onSetTargetTime,
  onTimeUpdate,
  playEndSound,
  playLastTenSecondsSound,
  repeat,
  targetTime,
}: CountdownTimerProps) {

  const { showNotifications, updateTitle } = useSettings();

  // Audio manager
  const {
    initializeAudioContext,
    unlockAudioContext,
    preloadSounds,
    playSound,
  } = useAudioManager();

  // Notification function
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

  // Preload audio if we are active
  useEffect(() => {
    if (isActive) {
      initializeAudioContext();
      unlockAudioContext();
      preloadSounds([
        '/audio/end.mp3',
        '/audio/tick.mp3'
      ]);
    }
  }, [
    initializeAudioContext,
    isActive,
    preloadSounds,
    unlockAudioContext,
  ]);

  // Hook: main timer logic
  const {
    timeLeft,
    setTimeLeft,
    isEditing,
    openEditor,
    closeEditor,
    h,
    m,
    s,
  } = useCountdownTimer({
    countUp,
    initialTime,
    isActive,
    onActiveChange,
    onPlaySound: playSound,
    onSendNotification: sendNotification,
    onSetTargetTime,
    playEndSound,
    playLastTenSecondsSound,
    repeat,
    showNotifications,
    targetTime,
  });

  const [ariaTimer, setAriaTimer] = useState('');

  // Update the document title with the timer
  useEffect(() => {
    const sign = timeLeft < 0 ? '+' : '';
    const fmt = (val: number) => val.toString().padStart(2, '0');
    const formattedTime =
      h === 0 ? `${sign}${fmt(m)}:${fmt(s)}` : `${sign}${h}:${fmt(m)}:${fmt(s)}`;
    if (updateTitle) {
      document.title = `${formattedTime} Countdown | YACT`;
    }
    if (s % 5 === 0) {
      setAriaTimer(formattedTime);
    }
  }, [updateTitle, timeLeft, h, m, s]);

  // Handle manual editor saving
  const handleSaveEditor = (hours: number, minutes: number, seconds: number) => {
    const hh = Math.max(0, hours);
    const mm = Math.max(0, minutes);
    const ss = Math.max(0, seconds);

    localStorage.setItem('hours', hh.toString());
    localStorage.setItem('minutes', mm.toString());
    localStorage.setItem('seconds', ss.toString());

    const totalSeconds = hh * 3600 + mm * 60 + ss;
    setTimeLeft(totalSeconds);

    closeEditor();
    onTimeUpdate?.(hh, mm, ss);
  };

  const fmt = (val: number) => val.toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center">
      {/* Timer Display */}
      <div
        className="text-[15vw] font-mono cursor-pointer select-none text-center leading-none"
        role="timer"
        tabIndex={0}
        aria-label={`Countdown Timer: ${h} hours, ${m} minutes, ${s} seconds`}
        onClick={openEditor}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openEditor();
          }
        }}
      >
        {timeLeft < 0 && '+'}
        {fmt(h)}:{fmt(m)}:{fmt(s)}
      </div>

      <div id="screen-reader-update" aria-live="polite">{ariaTimer}</div>

      <TimerEditorModal
        isOpen={isEditing}
        hours={h}
        minutes={m}
        seconds={s}
        onClose={closeEditor}
        onSave={handleSaveEditor}
      />
    </div>
  );
}
