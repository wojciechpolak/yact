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
    <TimerEditorModal isOpen hours={1} minutes={2} seconds={3} onClose={vi.fn()} onSave={onSave} />,
  );

  const inputs = screen.getAllByRole('spinbutton');
  fireEvent.change(inputs[0], { target: { value: '-4' } });
  fireEvent.change(inputs[1], { target: { value: '77' } });
  fireEvent.change(inputs[2], { target: { value: '61' } });

  fireEvent.click(screen.getByRole('button', { name: 'Save' }));

  expect(onSave).toHaveBeenCalledWith(0, 59, 59);
});

test('TimerEditorModal plus and minus buttons adjust hours value', () => {
  render(
    <TimerEditorModal
      isOpen
      hours={5}
      minutes={0}
      seconds={0}
      onClose={vi.fn()}
      onSave={vi.fn()}
    />,
  );

  const buttons = screen.getAllByRole('button');
  // DOM order: Close, +H, -H, +M, -M, +S, -S, Cancel, Save
  const plusHours = buttons[1];
  const minusHours = buttons[2];
  const [hoursInput] = screen.getAllByRole('spinbutton');

  fireEvent.click(plusHours);
  expect((hoursInput as HTMLInputElement).value).toBe('6');

  fireEvent.click(minusHours);
  expect((hoursInput as HTMLInputElement).value).toBe('5');
});

test('TimerEditorModal onBlur clamps hours to a minimum of 0', () => {
  render(
    <TimerEditorModal
      isOpen
      hours={2}
      minutes={0}
      seconds={0}
      onClose={vi.fn()}
      onSave={vi.fn()}
    />,
  );

  const [hoursInput] = screen.getAllByRole('spinbutton');

  fireEvent.change(hoursInput, { target: { value: '-3' } });
  fireEvent.blur(hoursInput);
  expect((hoursInput as HTMLInputElement).value).toBe('0');
});

test('TimerEditorModal onBlur clamps minutes and seconds to 0-59', () => {
  render(
    <TimerEditorModal
      isOpen
      hours={0}
      minutes={30}
      seconds={30}
      onClose={vi.fn()}
      onSave={vi.fn()}
    />,
  );

  const [, minutesInput, secondsInput] = screen.getAllByRole('spinbutton');

  fireEvent.change(minutesInput, { target: { value: '75' } });
  fireEvent.blur(minutesInput);
  expect((minutesInput as HTMLInputElement).value).toBe('59');

  fireEvent.change(secondsInput, { target: { value: '99' } });
  fireEvent.blur(secondsInput);
  expect((secondsInput as HTMLInputElement).value).toBe('59');
});

test('TimerEditorModal plus and minus buttons adjust minutes and seconds', () => {
  render(
    <TimerEditorModal
      isOpen
      hours={0}
      minutes={5}
      seconds={10}
      onClose={vi.fn()}
      onSave={vi.fn()}
    />,
  );

  const buttons = screen.getAllByRole('button');
  // DOM order: Close, +H, -H, +M, -M, +S, -S, Cancel, Save
  const plusMinutes = buttons[3];
  const minusMinutes = buttons[4];
  const plusSeconds = buttons[5];
  const minusSeconds = buttons[6];
  const [, minutesInput, secondsInput] = screen.getAllByRole('spinbutton');

  fireEvent.click(plusMinutes);
  expect((minutesInput as HTMLInputElement).value).toBe('6');

  fireEvent.click(minusMinutes);
  expect((minutesInput as HTMLInputElement).value).toBe('5');

  fireEvent.click(plusSeconds);
  expect((secondsInput as HTMLInputElement).value).toBe('11');

  fireEvent.click(minusSeconds);
  expect((secondsInput as HTMLInputElement).value).toBe('10');
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
