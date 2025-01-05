/**
 * src/components/Footer.tsx
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

const Footer = () => {
  return (
    <footer className="fixed bottom-2 w-full text-center text-gray-400 text-sm">
      <a
        href="https://github.com/wojciechpolak/yact"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-gray-600"
      >
        View on GitHub
      </a>
    </footer>
  );
};

export default Footer;
