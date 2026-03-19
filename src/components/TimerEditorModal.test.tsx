/**
 * src/components/TimerEditorModal.test.tsx
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

import { fireEvent, render, screen, within, cleanup } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import TimerEditorModal from './TimerEditorModal';

const setCountToTime = vi.fn();

vi.mock('@/context/SettingsContext', () => ({
  useSettings: () => ({
    countToTime: false,
    setCountToTime,
  }),
}));

afterEach(() => {
  setCountToTime.mockClear();
  cleanup();
});

test('TimerEditorModal renders nothing when closed', () => {
  const { container } = render(
    <TimerEditorModal
      isOpen={false}
      hours={1}
      minutes={2}
      seconds={3}
      onClose={vi.fn()}
      onSave={vi.fn()}
    />,
  );

  expect(container.firstChild).toBeNull();
});

test('TimerEditorModal clamps values before saving', () => {
  const onSave = vi.fn();

  render(
    <TimerEditorModal
      isOpen
      hours={1}
      minutes={2}
      seconds={3}
      onClose={vi.fn()}
      onSave={onSave}
    />,
  );

  const inputs = screen.getAllByRole('spinbutton');
  fireEvent.change(inputs[0], { target: { value: '-4' } });
  fireEvent.change(inputs[1], { target: { value: '77' } });
  fireEvent.change(inputs[2], { target: { value: '61' } });

  fireEvent.click(screen.getByRole('button', { name: 'Save' }));

  expect(onSave).toHaveBeenCalledWith(0, 59, 59);
});

test('TimerEditorModal closes and toggles target time mode', () => {
  const onClose = vi.fn();

  const view = render(
    <TimerEditorModal
      isOpen
      hours={1}
      minutes={2}
      seconds={3}
      onClose={onClose}
      onSave={vi.fn()}
    />,
  );

  fireEvent.click(within(view.container).getByRole('button', { name: 'Close' }));
  fireEvent.click(screen.getByRole('switch', { name: 'Toggle target time mode' }));

  expect(onClose).toHaveBeenCalledTimes(1);
  expect(setCountToTime).toHaveBeenCalledWith(true);
});
