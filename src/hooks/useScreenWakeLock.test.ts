/**
 * src/hooks/useScreenWakeLock.test.ts
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

import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, Mock } from 'vitest';
import { useScreenWakeLock } from './useScreenWakeLock';

// Mock WakeLockSentinel
interface MockWakeLockSentinel {
  release: Mock;
  addEventListener: Mock;
}

describe('useScreenWakeLock', () => {
  let requestMock: Mock;
  let releaseMock: Mock;
  let addEventListenerMock: Mock;
  let originalWakeLock: unknown;

  beforeEach(() => {
    originalWakeLock = navigator.wakeLock;

    releaseMock = vi.fn().mockResolvedValue(undefined);
    addEventListenerMock = vi.fn();

    const sentinel: MockWakeLockSentinel = {
      release: releaseMock,
      addEventListener: addEventListenerMock,
    };

    requestMock = vi.fn().mockResolvedValue(sentinel);

    Object.defineProperty(navigator, 'wakeLock', {
      value: {
        request: requestMock,
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'wakeLock', {
      value: originalWakeLock,
      configurable: true,
      writable: true,
    });
  });

  it('does nothing if wakeLock is not supported', () => {
    Object.defineProperty(navigator, 'wakeLock', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    renderHook(() => useScreenWakeLock(true, true));
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('requests wake lock when active and keepAwake is true', async () => {
    renderHook(() => useScreenWakeLock(true, true));

    await waitFor(() => {
      expect(requestMock).toHaveBeenCalledWith('screen');
    });
  });

  it('does not request wake lock when active but keepAwake is false', () => {
    renderHook(() => useScreenWakeLock(true, false));
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('releases wake lock when unmounted', async () => {
    const { unmount } = renderHook(() => useScreenWakeLock(true, true));

    await waitFor(() => {
      expect(requestMock).toHaveBeenCalledWith('screen');
    });

    unmount();

    await waitFor(() => {
      expect(releaseMock).toHaveBeenCalled();
    });
  });

  it('releases wake lock when isActive becomes false', async () => {
    const { rerender } = renderHook(
      ({ isActive, keepAwake }) => useScreenWakeLock(isActive, keepAwake),
      { initialProps: { isActive: true, keepAwake: true } },
    );

    await waitFor(() => {
      expect(requestMock).toHaveBeenCalled();
    });

    rerender({ isActive: false, keepAwake: true });

    await waitFor(() => {
      expect(releaseMock).toHaveBeenCalled();
    });
  });

  it('logs an error when requestWakeLock throws', async () => {
    requestMock.mockRejectedValue(new Error('Permission denied'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    renderHook(() => useScreenWakeLock(true, true));

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith('Failed to request Wake Lock', expect.any(Error));
    });
  });

  it('logs an error when releaseWakeLock throws', async () => {
    releaseMock.mockRejectedValue(new Error('Release failed'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const { rerender } = renderHook(
      ({ isActive, keepAwake }: { isActive: boolean; keepAwake: boolean }) =>
        useScreenWakeLock(isActive, keepAwake),
      { initialProps: { isActive: true, keepAwake: true } },
    );

    await waitFor(() => {
      expect(requestMock).toHaveBeenCalled();
    });

    rerender({ isActive: false, keepAwake: true });

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith('Failed to release Wake Lock', expect.any(Error));
    });
  });

  it('re-requests wake lock on visibility change if visible and active', async () => {
    renderHook(() => useScreenWakeLock(true, true));

    await waitFor(() => {
      expect(requestMock).toHaveBeenCalledTimes(1);
    });

    // Simulate wake lock release by OS
    const releaseCallback = addEventListenerMock.mock.calls.find(
      (call) => call[0] === 'release',
    )?.[1];
    expect(releaseCallback).toBeDefined();

    // Call the release handler so sentinelRef.current becomes null
    if (releaseCallback) {
      releaseCallback();
    }

    // Simulate visibility change
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });

    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => {
      expect(requestMock).toHaveBeenCalledTimes(2);
    });
  });
});
