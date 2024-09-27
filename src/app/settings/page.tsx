/**
 * src/app/settings/page.tsx
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

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FaArrowLeft } from 'react-icons/fa';
import { useSettings } from '@/context/SettingsContext';

const SettingsPage = () => {
  const searchParams = useSearchParams();

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
  const queryParams = {
    hours: searchParams.get('hours') || localStorage.getItem('hours') || '0',
    minutes: searchParams.get('minutes') || localStorage.getItem('minutes') || '1',
    seconds: searchParams.get('seconds') || localStorage.getItem('seconds') || '0',
    repeat: searchParams.get('repeat') || localStorage.getItem('repeat') || 'false',
    active: searchParams.get('active') || localStorage.getItem('active') || 'false',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Link
            href={{ pathname: '/', query: queryParams }}
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
            <span className="text-xl">Count up when timer ends</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={countUp}
                onChange={(e) => setCountUp(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xl">Show notifications when timer ends</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showNotifications}
                onChange={(e) => setShowNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xl">Play sound when timer ends</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={playEndSound}
                onChange={(e) => setPlayEndSound(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xl">Play sound at each of the last 10 seconds</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={playLastTenSecondsSound}
                onChange={(e) => setPlayLastTenSecondsSound(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
