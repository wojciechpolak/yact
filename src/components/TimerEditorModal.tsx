/**
 * src/components/TimerEditorModal.tsx
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
import { FaPlus, FaMinus } from 'react-icons/fa';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/context/SettingsContext';

interface TimerEditorModalProps {
  isOpen: boolean;
  hours: number; // For duration mode: duration HH; for clock mode: HH target
  minutes: number; // For duration mode: duration MM; for clock mode: MM target
  seconds: number; // For duration mode: duration SS; for clock mode: SS target
  cooldownSeconds: number;
  breakColor: string | null;
  defaultBreakColor: string;
  onClose: () => void;
  onSave: (
    hours: number,
    minutes: number,
    seconds: number,
    cooldownSeconds: number,
    breakColor: string | null,
  ) => void;
}

export default function TimerEditorModal({
  isOpen,
  hours,
  minutes,
  seconds,
  cooldownSeconds,
  breakColor,
  defaultBreakColor,
  onClose,
  onSave,
}: TimerEditorModalProps) {
  const { countToTime, setCountToTime } = useSettings();

  const [localHours, setLocalHours] = useState<string>(String(hours));
  const [localMinutes, setLocalMinutes] = useState<string>(String(minutes));
  const [localSeconds, setLocalSeconds] = useState<string>(String(seconds));
  const [localCooldownSeconds, setLocalCooldownSeconds] = useState<string>(String(cooldownSeconds));
  const [localBreakColor, setLocalBreakColor] = useState<string>(breakColor ?? defaultBreakColor);

  useEffect(() => {
    // Reset local state when the modal opens
    if (isOpen) {
      setLocalHours(String(hours));
      setLocalMinutes(String(minutes));
      setLocalSeconds(String(seconds));
      setLocalCooldownSeconds(String(cooldownSeconds));
      setLocalBreakColor(breakColor ?? defaultBreakColor);
    }
  }, [breakColor, cooldownSeconds, defaultBreakColor, isOpen, hours, minutes, seconds]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    const parsedH = parseInt(localHours || '0', 10);
    const parsedM = parseInt(localMinutes || '0', 10);
    const parsedS = parseInt(localSeconds || '0', 10);
    const parsedCooldown = parseInt(localCooldownSeconds || '0', 10);
    const hh = Math.max(0, isNaN(parsedH) ? 0 : parsedH);
    const mm = Math.min(59, Math.max(0, isNaN(parsedM) ? 0 : parsedM));
    const ss = Math.min(59, Math.max(0, isNaN(parsedS) ? 0 : parsedS));
    const rest = Math.max(0, isNaN(parsedCooldown) ? 0 : parsedCooldown);
    const selectedBreakColor = localBreakColor || defaultBreakColor;
    onSave(hh, mm, ss, rest, selectedBreakColor === defaultBreakColor ? null : selectedBreakColor);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg max-w-3xl w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl">Set Time</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-500 hover:text-gray-600 hover:scale-110 text-3xl cursor-pointer"
          >
            ✕
          </button>
        </div>
        {/* Mode Toggle */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">Fixed duration</span>
            <Switch
              id="mode"
              aria-label="Toggle target time mode"
              checked={countToTime}
              onCheckedChange={(checked) => setCountToTime(checked)}
            />
            <span className="text-sm text-gray-500">Target time</span>
          </div>
        </div>
        {/* Time Editing Controls */}
        <div className="flex space-x-8 mb-8 justify-center">
          {/* Hours */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => {
                const cur = Math.max(0, parseInt(localHours || '0', 10));
                setLocalHours(String(cur + 1));
              }}
              className="text-4xl hover:scale-110 cursor-pointer"
            >
              <FaPlus />
            </button>
            <input
              type="number"
              value={localHours}
              onChange={(e) => setLocalHours(e.target.value)}
              onBlur={() => {
                const v = parseInt(localHours || '0', 10);
                const clamped = Math.max(0, isNaN(v) ? 0 : v);
                setLocalHours(String(clamped));
              }}
              min={0}
              className="w-24 text-center text-4xl border-b dark:bg-zinc-900"
            />
            <button
              onClick={() => {
                const cur = Math.max(0, parseInt(localHours || '0', 10));
                setLocalHours(String(cur > 0 ? cur - 1 : 0));
              }}
              className="text-4xl hover:scale-110 cursor-pointer"
            >
              <FaMinus />
            </button>
            <span className="mt-2 text-xl">Hours</span>
          </div>

          {/* Minutes */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => {
                const cur = Math.max(0, parseInt(localMinutes || '0', 10));
                setLocalMinutes(String(Math.min(59, cur + 1)));
              }}
              className="text-4xl hover:scale-110 cursor-pointer"
            >
              <FaPlus />
            </button>
            <input
              type="number"
              value={localMinutes}
              onChange={(e) => setLocalMinutes(e.target.value)}
              onBlur={() => {
                const v = parseInt(localMinutes || '0', 10);
                const clamped = Math.min(59, Math.max(0, isNaN(v) ? 0 : v));
                setLocalMinutes(String(clamped));
              }}
              min={0}
              max={59}
              className="w-24 text-center text-4xl border-b dark:bg-zinc-900"
            />
            <button
              onClick={() => {
                const cur = Math.max(0, parseInt(localMinutes || '0', 10));
                setLocalMinutes(String(cur > 0 ? cur - 1 : 0));
              }}
              className="text-4xl hover:scale-110 cursor-pointer"
            >
              <FaMinus />
            </button>
            <span className="mt-2 text-xl">Minutes</span>
          </div>

          {/* Seconds */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => {
                const cur = Math.max(0, parseInt(localSeconds || '0', 10));
                setLocalSeconds(String(Math.min(59, cur + 1)));
              }}
              className="text-4xl hover:scale-110 cursor-pointer"
            >
              <FaPlus />
            </button>
            <input
              type="number"
              value={localSeconds}
              onChange={(e) => setLocalSeconds(e.target.value)}
              onBlur={() => {
                const v = parseInt(localSeconds || '0', 10);
                const clamped = Math.min(59, Math.max(0, isNaN(v) ? 0 : v));
                setLocalSeconds(String(clamped));
              }}
              min={0}
              max={59}
              className="w-24 text-center text-4xl border-b dark:bg-zinc-900"
            />
            <button
              onClick={() => {
                const cur = Math.max(0, parseInt(localSeconds || '0', 10));
                setLocalSeconds(String(cur > 0 ? cur - 1 : 0));
              }}
              className="text-4xl hover:scale-110 cursor-pointer"
            >
              <FaMinus />
            </button>
            <span className="mt-2 text-xl">Seconds</span>
          </div>
        </div>
        <div className="mb-8 border-t border-dashed border-gray-200 pt-6 dark:border-zinc-700">
          <div className="mb-6 flex items-center justify-center gap-3 text-gray-500">
            <span className="h-px w-12 bg-gray-200 dark:bg-zinc-700" />
            <span className="text-sm uppercase tracking-[0.3em]">Break settings</span>
            <span className="h-px w-12 bg-gray-200 dark:bg-zinc-700" />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            <div className="flex w-44 flex-col items-center gap-3">
              <label htmlFor="rest-seconds" className="text-xl">
                Rest seconds
              </label>
              <input
                id="rest-seconds"
                type="number"
                value={localCooldownSeconds}
                onChange={(e) => setLocalCooldownSeconds(e.target.value)}
                onBlur={() => {
                  const v = parseInt(localCooldownSeconds || '0', 10);
                  const clamped = Math.max(0, isNaN(v) ? 0 : v);
                  setLocalCooldownSeconds(String(clamped));
                }}
                min={0}
                className="w-36 text-center text-3xl border-b dark:bg-zinc-900"
                aria-label="Rest seconds"
              />
            </div>

            <div className="flex w-44 flex-col items-center gap-3">
              <label htmlFor="break-color" className="text-xl">
                Break color
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="break-color"
                  type="color"
                  value={localBreakColor}
                  onChange={(e) => setLocalBreakColor(e.target.value)}
                  className="h-16 w-24 cursor-pointer rounded border border-gray-300 bg-transparent p-1 dark:border-zinc-700"
                  aria-label="Break color"
                />
                <button
                  type="button"
                  onClick={() => setLocalBreakColor(defaultBreakColor)}
                  className="whitespace-nowrap text-sm text-gray-500 cursor-pointer hover:text-gray-700"
                >
                  Use default
                </button>
              </div>
            </div>
          </div>

          <span className="mt-4 block text-center text-sm text-gray-500">
            Used between repeated countdowns when Repeat is on.
          </span>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded text-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded text-xl cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
