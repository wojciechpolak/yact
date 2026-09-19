/**
 * src/app/settings/page.tsx
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

import Link from 'next/link';
import { useEffect, useState, type ChangeEvent } from 'react';
import { useTheme } from 'next-themes';
import { FaArrowLeft } from 'react-icons/fa';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useHashParams } from '@/lib/useHashParams';
import { requestNotificationPermission } from '@/lib/notifications';
import { supportsVibration } from '@/lib/vibration';
import { useSettings } from '@/context/SettingsContext';

/** Reads a value from the URL hash, then localStorage, then the fallback. */
function readParam(hashParams: URLSearchParams, key: string, fallback: string) {
  return hashParams.get(key) || localStorage.getItem(key) || fallback;
}

/** Query parameters that carry the timer state back to the main page. */
function buildReturnParams(hashParams: URLSearchParams, countToTime: boolean) {
  const read = (key: string, fallback: string) => readParam(hashParams, key, fallback);
  const params = new URLSearchParams();

  params.set('hours', read('hours', '0'));
  params.set('minutes', read('minutes', '1'));
  params.set('seconds', read('seconds', '0'));
  params.set('repeat', read('repeat', 'false'));
  params.set('active', read('active', 'false'));
  params.set('cooldownSeconds', read('cooldownSeconds', '0'));

  const breakColor = read('breakColor', '');
  if (breakColor) {
    params.set('breakColor', breakColor);
  }

  params.set('cyclePhase', read('cyclePhase', 'work'));

  const targetTime = read('targetTime', '');
  if (targetTime) {
    params.set('targetTime', targetTime);
  }

  if (countToTime) {
    params.set('mode', 'target');
  }

  return params;
}

const SettingsPage = () => {
  const hashParams = useHashParams();
  const { theme, setTheme } = useTheme();

  // Use settings from context
  const {
    countUp,
    setCountUp,
    keepAwake,
    setKeepAwake,
    countToTime,
    playEndSound,
    setPlayEndSound,
    vibrateOnEnd,
    setVibrateOnEnd,
    playLastTenSecondsSound,
    setPlayLastTenSecondsSound,
    minCooldownForTickSound,
    setMinCooldownForTickSound,
    showNotifications,
    setShowNotifications,
    updateTitle,
    setUpdateTitle,
  } = useSettings();

  // Kept as a string so the field can be cleared while typing
  const [localMinCooldown, setLocalMinCooldown] = useState(String(minCooldownForTickSound));

  // iOS has no Vibration API, so the switch would be a dead control there.
  const [canVibrate, setCanVibrate] = useState(false);

  useEffect(() => {
    setCanVibrate(supportsVibration());
  }, []);

  // Query parameters to pass back to the main page
  const queryParams = buildReturnParams(hashParams, countToTime);

  const handleNotificationsChange = async (checked: boolean) => {
    if (!checked) {
      setShowNotifications(false);
      return;
    }

    const permission = await requestNotificationPermission();
    setShowNotifications(permission === 'granted');
  };

  const handleMinCooldownChange = (event: ChangeEvent<HTMLInputElement>) => {
    setLocalMinCooldown(event.target.value);
    const parsed = parseInt(event.target.value, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setMinCooldownForTickSound(parsed);
    }
  };

  const handleMinCooldownBlur = () => {
    const parsed = parseInt(localMinCooldown || '0', 10);
    const clamped = Math.max(0, isNaN(parsed) ? 0 : parsed);
    setLocalMinCooldown(String(clamped));
    setMinCooldownForTickSound(clamped);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Link href={{ pathname: '/', hash: queryParams.toString() }} passHref>
            <span className="text-blue-500 hover:text-blue-600 cursor-pointer flex items-center space-x-1 hover:scale-105">
              <FaArrowLeft size={24} />
              <span className="hidden sm:inline">Back</span>
            </span>
          </Link>
        </div>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="countUp"
              className="text-xl relative inline-flex items-center cursor-pointer"
            >
              Count up when timer ends
            </Label>
            <Switch
              id="countUp"
              checked={countUp}
              onCheckedChange={(checked) => setCountUp(checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label
              htmlFor="keepAwake"
              className="text-xl relative inline-flex items-center cursor-pointer"
            >
              Keep screen awake
            </Label>
            <Switch
              id="keepAwake"
              checked={keepAwake}
              onCheckedChange={(checked) => setKeepAwake(checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label
              htmlFor="showNotifications"
              className="text-xl relative inline-flex items-center cursor-pointer"
            >
              Show notifications when timer ends
            </Label>
            <Switch
              id="showNotifications"
              checked={showNotifications}
              onCheckedChange={handleNotificationsChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label
              htmlFor="playEndSound"
              className="text-xl relative inline-flex items-center cursor-pointer"
            >
              Play sound when timer ends
            </Label>
            <Switch
              id="playEndSound"
              checked={playEndSound}
              onCheckedChange={(checked) => setPlayEndSound(checked)}
            />
          </div>

          {canVibrate && (
            <div className="flex items-center justify-between">
              <Label
                htmlFor="vibrateOnEnd"
                className="text-xl relative inline-flex items-center cursor-pointer"
              >
                Vibrate when timer ends
              </Label>
              <Switch
                id="vibrateOnEnd"
                checked={vibrateOnEnd}
                onCheckedChange={(checked) => setVibrateOnEnd(checked)}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label
              htmlFor="playLastTenSecondsSound"
              className="text-xl relative inline-flex items-center cursor-pointer"
            >
              Play sound at each of the last 10 seconds
            </Label>
            <Switch
              id="playLastTenSecondsSound"
              checked={playLastTenSecondsSound}
              onCheckedChange={(checked) => setPlayLastTenSecondsSound(checked)}
            />
          </div>

          {playLastTenSecondsSound && (
            <div className="flex items-center justify-between pl-4">
              <Label
                htmlFor="minCooldownForTickSound"
                className="text-base text-gray-500 dark:text-gray-400 relative inline-flex items-center cursor-pointer"
              >
                Skip it for breaks up to (seconds)
              </Label>
              <input
                id="minCooldownForTickSound"
                type="number"
                min={0}
                value={localMinCooldown}
                onChange={handleMinCooldownChange}
                onBlur={handleMinCooldownBlur}
                className="w-20 text-center text-xl border-b dark:bg-zinc-900"
                aria-label="Skip it for breaks up to (seconds)"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label
              htmlFor="updateTitle"
              className="text-xl relative inline-flex items-center cursor-pointer"
            >
              Update title
            </Label>
            <Switch
              id="updateTitle"
              checked={updateTitle}
              onCheckedChange={(checked) => setUpdateTitle(checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label
              htmlFor="system-theme"
              className="text-xl relative inline-flex items-center cursor-pointer"
            >
              Use system theme
            </Label>
            <Switch
              id="system-theme"
              checked={theme === 'system'}
              onCheckedChange={(checked) => setTheme(checked ? 'system' : 'light')}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label
              htmlFor="theme"
              className="text-xl relative inline-flex items-center cursor-pointer"
            >
              Use dark theme
            </Label>
            <Switch
              id="theme"
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
