/**
 * src/components/CountdownTimer.tsx
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

import { useEffect, useMemo } from 'react';
import { useAudioManager } from '@/hooks/useAudioManager';
import { useCountdownTimer } from '@/hooks/useCountdownTimer';
import { useScreenWakeLock } from '@/hooks/useScreenWakeLock';
import { useSettings } from '@/context/SettingsContext';
import { withBasePath } from '@/lib/basePath';
import { useTimerTitle } from '@/hooks/useTimerTitle';
import { nextClockOccurrence } from '@/lib/clockTime';
import { showTimerNotification } from '@/lib/notifications';
import { vibrate } from '@/lib/vibration';
import type { CyclePhase } from '@/store/timerSlice';
import TimerDisplay from '@/components/TimerDisplay';
import TimerEditorModal from '@/components/TimerEditorModal';

async function sendTimerNotification(icon: string) {
  const shown = await showTimerNotification({
    title: 'Timer Finished',
    body: 'Your countdown timer has ended.',
    icon,
  });
  if (!shown) {
    console.log('Notification could not be shown');
  }
}

/**
 * What the editor should show when opened.
 *  - Fixed duration mode: the current duration (h/m/s from timeLeft)
 *  - Target time mode: the selected clock time, from targetTime when available,
 *    otherwise from initialTime read as seconds since midnight
 */
function resolveEditorTime({
  countToTime,
  targetTime,
  initialTime,
  h,
  m,
  s,
}: {
  countToTime: boolean;
  targetTime: number | null;
  initialTime: number;
  h: number;
  m: number;
  s: number;
}) {
  if (!countToTime) {
    return { h, m, s };
  }
  if (targetTime) {
    const d = new Date(targetTime);
    return { h: d.getHours(), m: d.getMinutes(), s: d.getSeconds() };
  }
  return {
    h: Math.floor(initialTime / 3600),
    m: Math.floor((initialTime % 3600) / 60),
    s: initialTime % 60,
  };
}

interface CountdownTimerProps {
  countUp: boolean;
  countToTime: boolean;
  initialTime: number;
  cooldownSeconds: number;
  breakColor: string | null;
  cyclePhase: CyclePhase;
  isActive: boolean; // parent sets or toggles
  onActiveChange: (active: boolean) => void;
  onSetTargetTime: (targetTime: number | null) => void;
  onTimeUpdate?: (
    h: number,
    m: number,
    s: number,
    cooldownSeconds?: number,
    breakColor?: string | null,
  ) => void; // called on manual edit
  playEndSound: boolean;
  playLastTenSecondsSound: boolean;
  repeat: boolean;
  targetTime: number | null;
  onSetCyclePhase: (phase: CyclePhase) => void;
  onSetBreakColor: (color: string | null) => void;
}

export default function CountdownTimer({
  countUp,
  countToTime,
  initialTime,
  cooldownSeconds,
  breakColor,
  cyclePhase,
  isActive,
  onActiveChange,
  onSetTargetTime,
  onTimeUpdate,
  playEndSound,
  playLastTenSecondsSound,
  repeat,
  targetTime,
  onSetCyclePhase,
  onSetBreakColor,
}: CountdownTimerProps) {
  const { showNotifications, updateTitle, keepAwake, minCooldownForTickSound, vibrateOnEnd } =
    useSettings();

  useScreenWakeLock(isActive, keepAwake);

  // Audio manager
  const { initializeAudioContext, unlockAudioContext, preloadSounds, playSound } =
    useAudioManager();
  const defaultBreakColor = '#60a5fa';
  const endSoundUrl = withBasePath('/audio/end.mp3');
  const tickSoundUrl = withBasePath('/audio/tick.mp3');
  const notificationIconUrl = withBasePath('/icons/icon-192x192.png');

  const sendNotification = () => sendTimerNotification(notificationIconUrl);

  // Preload audio if we are active
  useEffect(() => {
    if (isActive) {
      initializeAudioContext();
      unlockAudioContext();
      preloadSounds([endSoundUrl, tickSoundUrl]);
    }
  }, [
    endSoundUrl,
    initializeAudioContext,
    isActive,
    preloadSounds,
    tickSoundUrl,
    unlockAudioContext,
  ]);

  // Hook: main timer logic
  const { timeLeft, setTimeLeft, isEditing, openEditor, closeEditor, h, m, s } = useCountdownTimer({
    countUp,
    countToTime,
    initialTime,
    cooldownSeconds,
    cyclePhase,
    endSoundUrl,
    isActive,
    onActiveChange,
    onPlaySound: playSound,
    onSendNotification: sendNotification,
    onVibrate: vibrate,
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
  });

  const isBreakPhase = !countToTime && cyclePhase === 'rest' && cooldownSeconds > 0;
  const isNegative = timeLeft < 0;
  const ariaTimer = useTimerTitle({ h, m, s, isBreakPhase, isNegative, updateTitle });

  // Handle manual editor saving
  const handleSaveEditor = (
    hours: number,
    minutes: number,
    seconds: number,
    restSeconds: number,
    selectedBreakColor: string | null,
  ) => {
    const hh = Math.max(0, hours);
    const mm = Math.max(0, minutes);
    const ss = Math.max(0, seconds);
    const cooldown = Math.max(0, restSeconds);

    localStorage.setItem('hours', hh.toString());
    localStorage.setItem('minutes', mm.toString());
    localStorage.setItem('seconds', ss.toString());
    localStorage.setItem('cooldownSeconds', cooldown.toString());

    const totalSeconds = hh * 3600 + mm * 60 + ss;
    if (countToTime) {
      const now = Date.now();
      const target = nextClockOccurrence(totalSeconds, now);
      setTimeLeft(Math.max(0, Math.round((target - now) / 1000)));
    } else {
      setTimeLeft(totalSeconds);
    }

    closeEditor();
    onTimeUpdate?.(hh, mm, ss, cooldown, selectedBreakColor);
    onSetBreakColor(selectedBreakColor);
  };

  const editorTime = useMemo(
    () => resolveEditorTime({ countToTime, targetTime, initialTime, h, m, s }),
    [countToTime, targetTime, initialTime, h, m, s],
  );

  return (
    <div className="flex flex-col items-center">
      <TimerDisplay
        h={h}
        m={m}
        s={s}
        isNegative={isNegative}
        isBreakPhase={isBreakPhase}
        breakColor={breakColor ?? defaultBreakColor}
        ariaTimer={ariaTimer}
        onOpenEditor={openEditor}
      />

      <TimerEditorModal
        isOpen={isEditing}
        hours={editorTime.h}
        minutes={editorTime.m}
        seconds={editorTime.s}
        onClose={closeEditor}
        onSave={handleSaveEditor}
        cooldownSeconds={cooldownSeconds}
        breakColor={breakColor}
        defaultBreakColor={defaultBreakColor}
      />
    </div>
  );
}
