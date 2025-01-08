/**
 * src/app/settings/page.tsx
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

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { FaArrowLeft } from 'react-icons/fa';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useHashParams } from '@/lib/useHashParams';
import { useSettings } from '@/context/SettingsContext';

const SettingsPage = () => {
  const hashParams = useHashParams();
  const {theme, setTheme} = useTheme();

  // Use settings from context
  const {
    countUp,
    setCountUp,
    playEndSound,
    setPlayEndSound,
    playLastTenSecondsSound,
    setPlayLastTenSecondsSound,
    showNotifications,
    setShowNotifications,
  } = useSettings();

  // Build query parameters object to pass back to the main page
  const queryParams = new URLSearchParams({
    hours: hashParams.get('hours') || localStorage.getItem('hours') || '0',
    minutes: hashParams.get('minutes') || localStorage.getItem('minutes') || '1',
    seconds: hashParams.get('seconds') || localStorage.getItem('seconds') || '0',
    repeat: hashParams.get('repeat') || localStorage.getItem('repeat') || 'false',
    active: hashParams.get('active') || localStorage.getItem('active') || 'false',
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Link
            href={{pathname: '/', hash: queryParams.toString()}}
            passHref
          >
            <span className="text-blue-500 hover:text-blue-600 cursor-pointer flex items-center space-x-1 hover:scale-105">
              <FaArrowLeft size={24} />
              <span className="hidden sm:inline">Back</span>
            </span>
          </Link>
        </div>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="countUp"
                   className="text-xl relative inline-flex items-center cursor-pointer">
              Count up when timer ends
            </Label>
            <Switch id="countUp"
                    checked={countUp}
                    onCheckedChange={(checked) => setCountUp(checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="showNotifications"
                   className="text-xl relative inline-flex items-center cursor-pointer">
              Show notifications when timer ends
            </Label>
            <Switch id="showNotifications"
                    checked={showNotifications}
                    onCheckedChange={(checked) => setShowNotifications(checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="playEndSound"
                   className="text-xl relative inline-flex items-center cursor-pointer">
              Play sound when timer ends
            </Label>
            <Switch id="playEndSound"
                    checked={playEndSound}
                    onCheckedChange={(checked) => setPlayEndSound(checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="playLastTenSecondsSound"
                   className="text-xl relative inline-flex items-center cursor-pointer">
              Play sound at each of the last 10 seconds
            </Label>
            <Switch id="playLastTenSecondsSound"
                    checked={playLastTenSecondsSound}
                    onCheckedChange={(checked) => setPlayLastTenSecondsSound(checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="system-theme"
                   className="text-xl relative inline-flex items-center cursor-pointer">
              Use system theme
            </Label>
            <Switch id="system-theme"
                    checked={theme === 'system'}
                    onCheckedChange={(checked) => setTheme(checked ? 'system' : 'light')}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="theme"
                   className="text-xl relative inline-flex items-center cursor-pointer">
              Use dark theme
            </Label>
            <Switch id="theme"
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
