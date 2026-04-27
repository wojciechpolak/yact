import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function rgbToHex(color: string) {
  const match = color.trim().match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/i);

  if (!match) {
    if (/^#[0-9a-f]{3}$/i.test(color) || /^#[0-9a-f]{6}$/i.test(color)) {
      return color;
    }
    return '#000000';
  }

  const [r, g, b] = match.slice(1, 4).map((value) => Number.parseInt(value, 10));
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}
