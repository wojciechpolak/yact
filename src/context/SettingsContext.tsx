/**
 * src/context/SettingsContext.tsx
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

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Settings {
  countUp: boolean;
  playEndSound: boolean;
  playLastTenSecondsSound: boolean;
  showNotifications: boolean;
  updateTitle: boolean;
}

interface SettingsContextProps extends Settings {
  setCountUp: (value: boolean) => void;
  setPlayEndSound: (value: boolean) => void;
  setPlayLastTenSecondsSound: (value: boolean) => void;
  setShowNotifications: (value: boolean) => void;
  setUpdateTitle: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextProps | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    // Load settings from localStorage
    const savedCountUp = localStorage.getItem('countUp');
    const savedPlayEndSound = localStorage.getItem('playEndSound');
    const savedPlayLastTenSecondsSound = localStorage.getItem('playLastTenSecondsSound');
    const savedShowNotifications = localStorage.getItem('showNotifications');
    const savedUpdateTitle = localStorage.getItem('updateTitle');

    const countUp = savedCountUp !== null ? savedCountUp === 'true' : true;
    const playEndSound = savedPlayEndSound !== null ? savedPlayEndSound === 'true' : true;
    const playLastTenSecondsSound =
      savedPlayLastTenSecondsSound !== null ? savedPlayLastTenSecondsSound === 'true' : true;
    const showNotifications = savedShowNotifications !== null ? savedShowNotifications === 'true' : false;
    const updateTitle = savedUpdateTitle !== null ? savedUpdateTitle === 'true' : true;

    setSettings({
      countUp,
      playEndSound,
      playLastTenSecondsSound,
      showNotifications,
      updateTitle,
    });
  }, []);

  useEffect(() => {
    // Save settings to localStorage whenever they change
    if (settings) {
      localStorage.setItem('countUp', settings.countUp.toString());
      localStorage.setItem('playEndSound', settings.playEndSound.toString());
      localStorage.setItem('playLastTenSecondsSound', settings.playLastTenSecondsSound.toString());
      localStorage.setItem('showNotifications', settings.showNotifications.toString());
      localStorage.setItem('updateTitle', settings.updateTitle.toString());
    }
  }, [settings]);

  if (!settings) {
    // Render null or a loading state until settings are loaded
    return null;
  }

  const setCountUp = (value: boolean) => setSettings({ ...settings, countUp: value });
  const setPlayEndSound = (value: boolean) => setSettings({ ...settings, playEndSound: value });
  const setPlayLastTenSecondsSound = (value: boolean) =>
    setSettings({ ...settings, playLastTenSecondsSound: value });
  const setShowNotifications = (value: boolean) => setSettings({ ...settings, showNotifications: value });
  const setUpdateTitle = (value: boolean) => setSettings({ ...settings, updateTitle: value });

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        setCountUp,
        setPlayEndSound,
        setPlayLastTenSecondsSound,
        setShowNotifications,
        setUpdateTitle,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
