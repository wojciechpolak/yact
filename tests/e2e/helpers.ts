/**
 * tests/e2e/helpers.ts
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

import type { Page } from '@playwright/test';

export type StorageEntries = Record<string, string>;

export async function seedLocalStorage(page: Page, entries: StorageEntries) {
  await page.addInitScript((initialEntries) => {
    const storageEntries = initialEntries as StorageEntries;
    for (const [key, value] of Object.entries(storageEntries)) {
      window.localStorage.setItem(key, value);
    }
  }, entries);
}

export async function freezeTime(page: Page, now: string | number | Date) {
  const fixedTimestamp = new Date(now).getTime();

  await page.addInitScript(
    ({ timestamp }) => {
      const OriginalDate = Date;

      class MockDate extends OriginalDate {
        constructor();
        constructor(value: string | number | Date);
        constructor(...args: [] | [string | number | Date]) {
          if (args.length === 0) {
            super(timestamp);
            return;
          }
          super(args[0]);
        }

        static now() {
          return timestamp;
        }
      }

      // Keep the browser clock stable for deterministic timer tests.
      globalThis.Date = MockDate as unknown as DateConstructor;
    },
    { timestamp: fixedTimestamp },
  );
}
