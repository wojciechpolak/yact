/**
 * src/hooks/useAudioManager.ts
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

import { useRef, useCallback } from 'react';

/**
 * Handles creation of the AudioContext, unlocking on user interaction,
 * preloading audio files, and playing them.
 */
export function useAudioManager() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBuffersRef = useRef<{ [key: string]: AudioBuffer }>({});
  const pendingLoadsRef = useRef<{ [key: string]: Promise<AudioBuffer | null> }>({});

  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      if (window.AudioContext) {
        audioContextRef.current = new window.AudioContext();
      }
    }
  }, []);

  const unlockAudioContext = useCallback(() => {
    const audioCtx = audioContextRef.current;
    if (!audioCtx || audioCtx.state !== 'suspended') {
      return;
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const resume = () => {
      audioCtx.resume();
      document.body.removeEventListener('touchstart', resume, false);
      document.body.removeEventListener('touchend', resume, false);
      document.body.removeEventListener('click', resume, false);
    };

    document.body.addEventListener('touchstart', resume, false);
    document.body.addEventListener('touchend', resume, false);
    document.body.addEventListener('click', resume, false);
  }, []);

  /**
   * Fetches and decodes a sound once. Concurrent requests for the same url
   * share a single fetch, and the decoded buffer is cached for later plays.
   */
  const loadSound = useCallback((url: string): Promise<AudioBuffer | null> => {
    const audioCtx = audioContextRef.current;
    if (!audioCtx) {
      return Promise.resolve(null);
    }

    const cachedBuffer = audioBuffersRef.current[url];
    if (cachedBuffer) {
      return Promise.resolve(cachedBuffer);
    }

    const pendingLoad = pendingLoadsRef.current[url];
    if (pendingLoad) {
      return pendingLoad;
    }

    const load = fetch(url)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => audioCtx.decodeAudioData(arrayBuffer))
      .then((audioBuffer) => {
        audioBuffersRef.current[url] = audioBuffer;
        return audioBuffer;
      })
      .catch((error) => {
        console.error('Error preloading sound:', error);
        return null;
      })
      .finally(() => {
        delete pendingLoadsRef.current[url];
      });

    pendingLoadsRef.current[url] = load;
    return load;
  }, []);

  const preloadSounds = useCallback(
    (urls: string[]) => {
      urls.forEach((url) => {
        void loadSound(url);
      });
    },
    [loadSound],
  );

  const playBuffer = useCallback((audioBuffer: AudioBuffer) => {
    const audioCtx = audioContextRef.current;
    if (!audioCtx) {
      return;
    }
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.start(0);
  }, []);

  const playSound = useCallback(
    (url: string) => {
      if (!audioContextRef.current) {
        console.warn('Cannot play sound before user interaction');
        return;
      }

      const audioBuffer = audioBuffersRef.current[url];
      if (audioBuffer) {
        playBuffer(audioBuffer);
        return;
      }

      // Still preloading, which happens when the timer is started with only
      // a few seconds left. Play the sound as soon as it has been decoded.
      void loadSound(url).then((loadedBuffer) => {
        if (loadedBuffer) {
          playBuffer(loadedBuffer);
        }
      });
    },
    [loadSound, playBuffer],
  );

  return {
    initializeAudioContext,
    unlockAudioContext,
    preloadSounds,
    playSound,
  };
}
