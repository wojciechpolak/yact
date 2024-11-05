/**
 * src/app/layout.tsx
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

import type { Metadata } from 'next';
import { SettingsProvider } from '@/context/SettingsContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Footer from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'YACT',
  description: 'Yet Another Countdown Timer',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased`}
      >
      <ThemeProvider
        attribute="class"
      >
        <SettingsProvider>
          {children}
          <Footer />
        </SettingsProvider>
      </ThemeProvider>
      </body>
    </html>
  );
}
