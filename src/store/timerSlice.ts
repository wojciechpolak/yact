/**
 * src/store/timerSlice.ts
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

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TimerState {
  initialTime: number;
  savedInitialTime: number; // for reset
  isActive: boolean;
  repeat: boolean;
  targetTime: number | null;
}

const initialState: TimerState = {
  initialTime: 60, // default
  savedInitialTime: 60, // for reset
  isActive: false,
  repeat: false,
  targetTime: null,
};

export const timerSlice = createSlice({
  name: 'timer',
  initialState,
  reducers: {
    setInitialTime: (state, action: PayloadAction<number>) => {
      state.initialTime = action.payload;
    },
    setSavedInitialTime: (state, action: PayloadAction<number>) => {
      state.savedInitialTime = action.payload;
    },
    setIsActive: (state, action: PayloadAction<boolean>) => {
      state.isActive = action.payload;
    },
    setRepeat: (state, action: PayloadAction<boolean>) => {
      state.repeat = action.payload;
    },
    setTargetTime: (state, action: PayloadAction<number | null>) => {
      state.targetTime = action.payload;
    },
    resetTimer: (state) => {
      state.isActive = false;
      state.targetTime = null;
      state.initialTime = state.savedInitialTime;
    },
  },
});

export const {
  setInitialTime,
  setSavedInitialTime,
  setIsActive,
  setRepeat,
  setTargetTime,
  resetTimer,
} = timerSlice.actions;

export const timerReducer = timerSlice.reducer;
