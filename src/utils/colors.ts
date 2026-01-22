import { ColorType } from '../types';

const COLORS: Record<ColorType, string> = {
  red: '\u001b[0;31m',
  green: '\u001b[0;32m',
  yellow: '\u001b[1;33m',
  blue: '\u001b[0;34m',
  reset: '\u001b[0m',
};

export function colorize(color: ColorType, message: string): string {
  return `${COLORS[color]}${message}${COLORS.reset}`;
}

export function printInfo(message: string): void {
  console.log(colorize('blue', message));
}

export function printSuccess(message: string): void {
  console.log(colorize('green', message));
}

export function printWarning(message: string): void {
  console.warn(colorize('yellow', message));
}

export function printError(message: string): void {
  console.error(colorize('red', message));
}
