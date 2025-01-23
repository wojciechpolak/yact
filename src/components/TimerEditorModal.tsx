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

interface TimerEditorModalProps {
  isOpen: boolean;
  hours: number;
  minutes: number;
  seconds: number;
  onClose: () => void;
  onSave: (hours: number, minutes: number, seconds: number) => void;
}

export default function TimerEditorModal({
  isOpen,
  hours,
  minutes,
  seconds,
  onClose,
  onSave,
}: TimerEditorModalProps) {

  const [localHours, setLocalHours] = useState(hours);
  const [localMinutes, setLocalMinutes] = useState(minutes);
  const [localSeconds, setLocalSeconds] = useState(seconds);

  useEffect(() => {
    // Reset local state when the modal opens
    if (isOpen) {
      setLocalHours(hours);
      setLocalMinutes(minutes);
      setLocalSeconds(seconds);
    }
  }, [isOpen, hours, minutes, seconds]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    onSave(localHours, localMinutes, localSeconds);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg max-w-3xl w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl">Set Timer</h2>
          <button
            onClick={onClose}
            aria-label="Close"
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
              onClick={() => setLocalHours(localHours + 1)}
              className="text-4xl hover:scale-110"
            >
              <FaPlus/>
            </button>
            <input
              type="number"
              value={localHours}
              onChange={(e) => setLocalHours(Number(e.target.value))}
              className="w-24 text-center text-4xl border-b dark:bg-zinc-900"
            />
            <button
              onClick={() => setLocalHours(localHours > 0 ? localHours - 1 : 0)}
              className="text-4xl hover:scale-110"
            >
              <FaMinus/>
            </button>
            <span className="mt-2 text-xl">Hours</span>
          </div>

          {/* Minutes */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => setLocalMinutes(localMinutes + 1)}
              className="text-4xl hover:scale-110"
            >
              <FaPlus/>
            </button>
            <input
              type="number"
              value={localMinutes}
              onChange={(e) => setLocalMinutes(Number(e.target.value))}
              className="w-24 text-center text-4xl border-b dark:bg-zinc-900"
            />
            <button
              onClick={() =>setLocalMinutes(localMinutes > 0 ? localMinutes - 1 : 0)}
              className="text-4xl hover:scale-110"
            >
              <FaMinus/>
            </button>
            <span className="mt-2 text-xl">Minutes</span>
          </div>

          {/* Seconds */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => setLocalSeconds(localSeconds + 1)}
              className="text-4xl hover:scale-110"
            >
              <FaPlus/>
            </button>
            <input
              type="number"
              value={localSeconds}
              onChange={(e) => setLocalSeconds(Number(e.target.value))}
              className="w-24 text-center text-4xl border-b dark:bg-zinc-900"
            />
            <button
              onClick={() => setLocalSeconds(localSeconds > 0 ? localSeconds - 1 : 0)}
              className="text-4xl hover:scale-110"
            >
              <FaMinus/>
            </button>
            <span className="mt-2 text-xl">Seconds</span>
          </div>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded text-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded text-xl"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
