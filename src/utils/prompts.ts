import readline from 'readline/promises';
import { printWarning } from './colors';
import { PromptOptions, SecretPromptOptions } from '../types';

export async function promptInput(
  rl: readline.Interface,
  question: string,
  options: PromptOptions = {}
): Promise<string> {
  const { required = false, defaultValue } = options;
  const suffix = defaultValue ? ` (${defaultValue})` : '';
  while (true) {
    const answer = (await rl.question(`${question}${suffix}: `)).trim();
    if (answer) {
      return answer;
    }
    if (!answer && defaultValue !== undefined) {
      return defaultValue;
    }
    if (!required) {
      return '';
    }
    printWarning('Input cannot be empty.');
  }
}

export async function promptSecret(
  rl: readline.Interface,
  question: string,
  options: SecretPromptOptions = {}
): Promise<string> {
  const { allowEmpty = false, hasExisting = false } = options;
  const hint = hasExisting ? ' (leave blank to keep current)' : '';
  while (true) {
    const answer = (await rl.question(`${question}${hint}: `)).trim();
    if (answer) {
      return answer;
    }
    if (allowEmpty && hasExisting) {
      return '';
    }
    if (!allowEmpty && !hasExisting) {
      printWarning('Input cannot be empty.');
    } else {
      return '';
    }
  }
}

export async function promptYesNo(rl: readline.Interface, question: string): Promise<boolean> {
  while (true) {
    const answer = (await rl.question(`${question} (y/n): `)).trim().toLowerCase();
    if (['y', 'yes'].includes(answer)) {
      return true;
    }
    if (['n', 'no'].includes(answer)) {
      return false;
    }
    printWarning('Please answer y or n.');
  }
}
