/**
 * src/context/SettingsContext.tsx
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

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Settings {
  countUp: boolean;
  keepAwake: boolean;
  // When true, the timer counts down to a specific time of day (HH:MM:SS)
  // rather than for a fixed duration.
  countToTime: boolean;
  playEndSound: boolean;
  playLastTenSecondsSound: boolean;
  // Skip the last seconds tick sound for breaks of at most this many seconds.
  minCooldownForTickSound: number;
  showNotifications: boolean;
  updateTitle: boolean;
  // Vibrate when the countdown ends, on devices with the Vibration API.
  vibrateOnEnd: boolean;
}

interface SettingsContextProps extends Settings {
  setCountUp: (value: boolean) => void;
  setKeepAwake: (value: boolean) => void;
  setCountToTime: (value: boolean) => void;
  setPlayEndSound: (value: boolean) => void;
  setPlayLastTenSecondsSound: (value: boolean) => void;
  setMinCooldownForTickSound: (value: number) => void;
  setShowNotifications: (value: boolean) => void;
  setUpdateTitle: (value: boolean) => void;
  setVibrateOnEnd: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextProps | undefined>(undefined);

// Breaks of at most this many seconds are too short to tick through.
const DEFAULT_MIN_COOLDOWN_FOR_TICK_SOUND = 30;

function readStoredFlag(key: string, fallback: boolean) {
  const saved = localStorage.getItem(key);
  return saved !== null ? saved === 'true' : fallback;
}

function readStoredCount(key: string, fallback: number) {
  const parsed = parseInt(localStorage.getItem(key) ?? '', 10);
  return isNaN(parsed) ? fallback : Math.max(0, parsed);
}

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    // Load settings from localStorage
    setSettings({
      countUp: readStoredFlag('countUp', true),
      keepAwake: readStoredFlag('keepAwake', false),
      countToTime: readStoredFlag('countToTime', false),
      playEndSound: readStoredFlag('playEndSound', true),
      playLastTenSecondsSound: readStoredFlag('playLastTenSecondsSound', true),
      minCooldownForTickSound: readStoredCount(
        'minCooldownForTickSound',
        DEFAULT_MIN_COOLDOWN_FOR_TICK_SOUND,
      ),
      showNotifications: readStoredFlag('showNotifications', false),
      updateTitle: readStoredFlag('updateTitle', true),
      vibrateOnEnd: readStoredFlag('vibrateOnEnd', false),
    });
  }, []);

  useEffect(() => {
    // Save settings to localStorage whenever they change
    if (settings) {
      localStorage.setItem('countUp', settings.countUp.toString());
      localStorage.setItem('keepAwake', settings.keepAwake.toString());
      localStorage.setItem('countToTime', settings.countToTime.toString());
      localStorage.setItem('playEndSound', settings.playEndSound.toString());
      localStorage.setItem('playLastTenSecondsSound', settings.playLastTenSecondsSound.toString());
      localStorage.setItem('minCooldownForTickSound', settings.minCooldownForTickSound.toString());
      localStorage.setItem('showNotifications', settings.showNotifications.toString());
      localStorage.setItem('updateTitle', settings.updateTitle.toString());
      localStorage.setItem('vibrateOnEnd', settings.vibrateOnEnd.toString());
    }
  }, [settings]);

  if (!settings) {
    // Render null or a loading state until settings are loaded
    return null;
  }

  const setCountUp = (value: boolean) => setSettings({ ...settings, countUp: value });
  const setKeepAwake = (value: boolean) => setSettings({ ...settings, keepAwake: value });
  const setPlayEndSound = (value: boolean) => setSettings({ ...settings, playEndSound: value });
  const setCountToTime = (value: boolean) => setSettings({ ...settings, countToTime: value });
  const setPlayLastTenSecondsSound = (value: boolean) =>
    setSettings({ ...settings, playLastTenSecondsSound: value });
  const setMinCooldownForTickSound = (value: number) =>
    setSettings({ ...settings, minCooldownForTickSound: Math.max(0, Math.floor(value) || 0) });
  const setShowNotifications = (value: boolean) =>
    setSettings({ ...settings, showNotifications: value });
  const setUpdateTitle = (value: boolean) => setSettings({ ...settings, updateTitle: value });
  const setVibrateOnEnd = (value: boolean) => setSettings({ ...settings, vibrateOnEnd: value });

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        setCountUp,
        setKeepAwake,
        setCountToTime,
        setPlayEndSound,
        setPlayLastTenSecondsSound,
        setMinCooldownForTickSound,
        setShowNotifications,
        setUpdateTitle,
        setVibrateOnEnd,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
