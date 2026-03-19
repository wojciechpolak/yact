/**
 * src/hooks/useAudioManager.test.tsx
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

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { useAudioManager } from './useAudioManager';

type MockAudioSource = {
  buffer: AudioBuffer | null;
  connect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
};

type MockAudioContext = {
  state: 'suspended' | 'running';
  destination: AudioDestinationNode;
  resume: ReturnType<typeof vi.fn>;
  createBufferSource: ReturnType<typeof vi.fn>;
  decodeAudioData: ReturnType<typeof vi.fn>;
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (window as typeof window & { AudioContext?: typeof AudioContext }).AudioContext;
});

test('initializeAudioContext creates a single AudioContext instance', () => {
  const context = {
    state: 'running',
    destination: {} as AudioDestinationNode,
    resume: vi.fn(),
    createBufferSource: vi.fn(),
    decodeAudioData: vi.fn(),
  } satisfies MockAudioContext;
  const ctor = vi.fn(() => context);

  Object.defineProperty(window, 'AudioContext', {
    value: ctor,
    configurable: true,
  });

  const { result } = renderHook(() => useAudioManager());

  act(() => {
    result.current.initializeAudioContext();
    result.current.initializeAudioContext();
  });

  expect(ctor).toHaveBeenCalledTimes(1);
});

test('unlockAudioContext resumes suspended audio and wires user interaction handlers', () => {
  const context = {
    state: 'suspended',
    destination: {} as AudioDestinationNode,
    resume: vi.fn(async () => {
      context.state = 'running';
    }),
    createBufferSource: vi.fn(),
    decodeAudioData: vi.fn(),
  } satisfies MockAudioContext;
  const ctor = vi.fn(() => context);
  const addEventListenerSpy = vi.spyOn(document.body, 'addEventListener');
  const removeEventListenerSpy = vi.spyOn(document.body, 'removeEventListener');

  Object.defineProperty(window, 'AudioContext', {
    value: ctor,
    configurable: true,
  });

  const { result } = renderHook(() => useAudioManager());

  act(() => {
    result.current.initializeAudioContext();
    result.current.unlockAudioContext();
  });

  expect(context.resume).toHaveBeenCalled();
  expect(addEventListenerSpy).toHaveBeenCalledTimes(3);

  act(() => {
    document.body.dispatchEvent(new Event('click'));
  });

  expect(context.resume).toHaveBeenCalledTimes(2);
  expect(removeEventListenerSpy).toHaveBeenCalledTimes(3);
});

test('preloadSounds caches decoded buffers and playSound uses the cached buffer', async () => {
  const source: MockAudioSource = {
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
  };
  const audioBuffer = {} as AudioBuffer;
  const context = {
    state: 'running',
    destination: {} as AudioDestinationNode,
    resume: vi.fn(),
    createBufferSource: vi.fn(() => source),
    decodeAudioData: vi.fn(async () => audioBuffer),
  } satisfies MockAudioContext;
  const ctor = vi.fn(() => context);
  const fetchMock = vi.fn(async () => ({
    arrayBuffer: async () => new ArrayBuffer(8),
  }));

  Object.defineProperty(window, 'AudioContext', {
    value: ctor,
    configurable: true,
  });
  vi.stubGlobal('fetch', fetchMock);

  const { result } = renderHook(() => useAudioManager());

  act(() => {
    result.current.initializeAudioContext();
    result.current.preloadSounds(['/audio/end.mp3']);
  });

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(context.decodeAudioData).toHaveBeenCalledTimes(1);
  });

  act(() => {
    result.current.preloadSounds(['/audio/end.mp3']);
  });

  expect(fetchMock).toHaveBeenCalledTimes(1);

  act(() => {
    result.current.playSound('/audio/end.mp3');
  });

  expect(context.createBufferSource).toHaveBeenCalledTimes(1);
  expect(source.connect).toHaveBeenCalledTimes(1);
  expect(source.start).toHaveBeenCalledTimes(1);
  expect(source.buffer).toBe(audioBuffer);
});

test('playSound warns if the audio context has not been initialized', () => {
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  const { result } = renderHook(() => useAudioManager());

  act(() => {
    result.current.playSound('/audio/end.mp3');
  });

  expect(warnSpy).toHaveBeenCalledWith('Cannot play sound before user interaction');
});
