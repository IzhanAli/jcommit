import { ParsedArgs } from '../types';
import { printInfo, printError } from '../utils/colors';

export function parseArgs(argv: string[]): ParsedArgs {
  const args = [...argv];
  const parsed: ParsedArgs = {
    command: null,
    configPath: null,
    help: false,
    version: false,
  };
  const validCommands = ['setup'];

  while (args.length) {
    const current = args.shift();

    if (!current) continue;

    if (current === '-h' || current === '--help') {
      parsed.help = true;
    } else if (current === '-v' || current === '--version') {
      parsed.version = true;
    } else if (current === '-c' || current === '--config') {
      parsed.configPath = args.shift() || null;
    } else if (!parsed.command) {
      // If it doesn't start with a dash and we don't have a command yet, 
      // check if it's a known command or an unknown one.
      parsed.command = current;
    }
  }

  // Check if the user entered an unrecognized command
  if (parsed.command && !validCommands.includes(parsed.command)) {
    printError(`Unknown command: '${parsed.command}'`);
    parsed.help = true; // Force help to show for guidance
  }

  return parsed;
}

export function showUsage(): void {
  console.log(`
**jcommit** — Integrate Jira and Git seamlessly

**Usage:**
  $ jcommit [command] [options]

**Core Commands:**
  setup               Start the interactive setup wizard to configure 
                      Jira credentials and repository branch rules.
  
  (default)           Run the commit workflow

**Options:**
  -c, --config <path>  Specify a custom path for the configuration file.
  -h, --help           Display this help menu.
  -v, --version        Display the current version of jcommit.

**Quick Start Workflow:**
  1. Stage changes:       git add .
  2. Start jcommit:       jcommit

  The tool will help you create a branch, fetch Jira details, and format your commit.

  Note: Ensure you are running this command from within a Git-initialized folder.
  `);
}

export function showVersion(): void {
  printInfo('jcommit v1.0.1');
}
