/**
 * src/app/page.test.tsx
 *
 * YACT Copyright (C) 2024 Wojciech Polak
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

import { expect, test, vi } from 'vitest';
import { render } from '@testing-library/react';
import Page from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

vi.mock('@/context/SettingsContext', () => ({
  useSettings: () => ({
    countUp: true,
    playEndSound: true,
    playLastTenSecondsSound: true,
    showNotifications: false,
    setCountUp: vi.fn(),
    setPlayEndSound: vi.fn(),
    setPlayLastTenSecondsSound: vi.fn(),
    setShowNotifications: vi.fn(),
  }),
}));

test('Page', () => {
  const result = render(<Page />);
  expect(result.container.querySelector('#home')).not.toBeNull();
})
