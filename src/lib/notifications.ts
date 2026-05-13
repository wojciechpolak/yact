/**
 * src/lib/notifications.ts
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

interface TimerNotificationOptions {
  body: string;
  icon: string;
  title: string;
}

const supportsNotifications = () =>
  typeof window !== 'undefined' && typeof Notification !== 'undefined';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!supportsNotifications()) {
    return 'denied';
  }

  if (Notification.permission !== 'default') {
    return Notification.permission;
  }

  return await new Promise<NotificationPermission>((resolve) => {
    let settled = false;

    const finish = (permission: NotificationPermission) => {
      if (!settled) {
        settled = true;
        resolve(permission);
      }
    };

    const maybePromise = Notification.requestPermission(finish);
    if (maybePromise && typeof maybePromise.then === 'function') {
      maybePromise.then(finish).catch(() => finish('denied'));
    }
  });
}

export async function showTimerNotification({
  body,
  icon,
  title,
}: TimerNotificationOptions): Promise<boolean> {
  if (!supportsNotifications() || Notification.permission !== 'granted') {
    return false;
  }

  const options = { body, icon };

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, options);
        return true;
      }
    } catch (err) {
      console.error('Failed to show notification through service worker', err);
    }
  }

  try {
    new Notification(title, options);
    return true;
  } catch (err) {
    console.error('Failed to show notification', err);
    return false;
  }
}
