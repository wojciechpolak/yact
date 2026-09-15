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
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { FaArrowLeft } from 'react-icons/fa';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useHashParams } from '@/lib/useHashParams';
import { requestNotificationPermission } from '@/lib/notifications';
import { supportsVibration } from '@/lib/vibration';
import { useSettings } from '@/context/SettingsContext';

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

  // Build query parameters object to pass back to the main page
  const queryParams = new URLSearchParams({
    hours: hashParams.get('hours') || localStorage.getItem('hours') || '0',
    minutes: hashParams.get('minutes') || localStorage.getItem('minutes') || '1',
    seconds: hashParams.get('seconds') || localStorage.getItem('seconds') || '0',
    repeat: hashParams.get('repeat') || localStorage.getItem('repeat') || 'false',
    active: hashParams.get('active') || localStorage.getItem('active') || 'false',
    cooldownSeconds:
      hashParams.get('cooldownSeconds') || localStorage.getItem('cooldownSeconds') || '0',
    ...(hashParams.get('breakColor') || localStorage.getItem('breakColor')
      ? { breakColor: hashParams.get('breakColor') || localStorage.getItem('breakColor') || '' }
      : {}),
    cyclePhase: hashParams.get('cyclePhase') || localStorage.getItem('cyclePhase') || 'work',
    ...(hashParams.get('targetTime') || localStorage.getItem('targetTime')
      ? { targetTime: hashParams.get('targetTime') || localStorage.getItem('targetTime') || '0' }
      : {}),
  });
  if (countToTime) {
    queryParams.set('mode', 'target');
  }

  const handleNotificationsChange = async (checked: boolean) => {
    if (!checked) {
      setShowNotifications(false);
      return;
    }

    const permission = await requestNotificationPermission();
    setShowNotifications(permission === 'granted');
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
                onChange={(e) => {
                  setLocalMinCooldown(e.target.value);
                  const parsed = parseInt(e.target.value, 10);
                  if (!isNaN(parsed) && parsed >= 0) {
                    setMinCooldownForTickSound(parsed);
                  }
                }}
                onBlur={() => {
                  const parsed = parseInt(localMinCooldown || '0', 10);
                  const clamped = Math.max(0, isNaN(parsed) ? 0 : parsed);
                  setLocalMinCooldown(String(clamped));
                  setMinCooldownForTickSound(clamped);
                }}
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
