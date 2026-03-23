/**
 * src/hooks/useScreenWakeLock.ts
 *
 * YACT Copyright (C) 2026 Wojciech Polak
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

import { useEffect, useRef } from 'react';

export function useScreenWakeLock(isActive: boolean, keepAwake: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    const requestWakeLock = async () => {
      if (!isActive || !keepAwake || !navigator.wakeLock) {
        return;
      }
      try {
        sentinelRef.current = await navigator.wakeLock.request('screen');
        sentinelRef.current.addEventListener('release', () => {
          sentinelRef.current = null;
        });
      } catch (err) {
        console.error('Failed to request Wake Lock', err);
      }
    };

    const releaseWakeLock = async () => {
      if (sentinelRef.current) {
        try {
          await sentinelRef.current.release();
        } catch (err) {
          console.error('Failed to release Wake Lock', err);
        }
        sentinelRef.current = null;
      }
    };

    if (isActive && keepAwake) {
      if (sentinelRef.current === null) {
        void requestWakeLock();
      }
    } else {
      void releaseWakeLock();
    }

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        isActive &&
        keepAwake &&
        sentinelRef.current === null
      ) {
        void requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      void releaseWakeLock();
    };
  }, [isActive, keepAwake]);
}
