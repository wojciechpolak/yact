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
  const audioBuffersRef = useRef<{[key: string]: AudioBuffer}>({});

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

  const preloadSounds = useCallback((urls: string[]) => {
    if (!audioContextRef.current) {
      return;
    }

    urls.forEach((url) => {
      if (!(url in audioBuffersRef.current)) {
        fetch(url)
          .then((response) => response.arrayBuffer())
          .then((arrayBuffer) => audioContextRef.current!.decodeAudioData(arrayBuffer))
          .then((audioBuffer) => {
            audioBuffersRef.current[url] = audioBuffer;
          })
          .catch((error) => console.error('Error preloading sound:', error));
      }
    });
  }, []);

  const playSound = useCallback((url: string) => {
    if (!audioContextRef.current) {
      console.warn('Cannot play sound before user interaction');
      return;
    }
    const audioBuffer = audioBuffersRef.current[url];
    if (!audioBuffer) {
      console.error('Audio buffer not found for url:', url);
      return;
    }
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.start(0);
  }, []);

  return {
    initializeAudioContext,
    unlockAudioContext,
    preloadSounds,
    playSound,
  };
}
