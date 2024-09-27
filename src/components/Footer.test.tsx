/**
 * src/components/Footer.test.tsx
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

import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from './Footer';

test('Footer', () => {
  render(<Footer />);
  expect(screen.getByRole('link', {name: 'View on GitHub'})).toBeDefined();
})
