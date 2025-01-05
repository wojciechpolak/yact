/**
 * src/lib/useHashParams.ts
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

import { useState, useEffect } from 'react';

export const useHashParams = () => {
  const [params, setParams] = useState(
    new URLSearchParams(window.location.hash.substring(1)));

  useEffect(() => {
    const onHashChange = () => {
      setParams(new URLSearchParams(window.location.hash.substring(1)));
    };

    // Initial load
    onHashChange();

    window.addEventListener('hashchange', onHashChange);

    return () => {
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  return params;
};
