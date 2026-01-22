import { ParsedArgs } from '../types';

export function parseArgs(argv: string[]): ParsedArgs {
  const args = [...argv];
  const parsed: ParsedArgs = {
    command: null,
    configPath: null,
    help: false,
    version: false,
  };

  while (args.length) {
    const current = args.shift();
    if (current === 'setup') {
      parsed.command = 'setup';
    } else if (current === '-c' || current === '--config') {
      parsed.configPath = args.shift() || null;
    } else if (current === '-h' || current === '--help') {
      parsed.help = true;
    } else if (current === '-v' || current === '--version') {
      parsed.version = true;
    } else if (!parsed.command) {
      parsed.command = current || null;
    }
  }

  return parsed;
}

export function showUsage(): void {
  console.log(`jcommit - Jira-Git commit integration

Usage:
  jcommit setup           Create or update the config file
  jcommit                 Run the commit workflow

Options:
  -c, --config <path>      Use a custom config path
  -h, --help               Show help
  -v, --version            Show version`);
}

export function showVersion(): void {
  console.log('jcommit v1.0.1');
}
