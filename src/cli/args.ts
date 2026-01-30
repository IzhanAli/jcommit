import https from 'https';
import packageJson from '../../package.json';
import { ParsedArgs } from '../types';
import { printInfo, printError, printWarning } from '../utils/colors';

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
┌─────────────────────────────────────────────────────────────────┐
│                     jcommit — Jira + Git CLI                    │
│                Seamlessly integrate Jira and Git                │
└─────────────────────────────────────────────────────────────────┘

Usage:
  jcommit

Commands:
  setup               Start the interactive setup wizard
                      (configure Jira credentials and branch rules)
  (default)           Run the commit workflow

Options:
  -c, --config <path>  Use a custom configuration file path
  -h, --help           Show this help message
  -v, --version        Show current version and check for updates

Quick Start:
  1. Stage changes:    git add .
  2. Run jcommit:      jcommit

The tool will help you:
  • Create or switch branches
  • Fetch or Create Jira ticket
  • Commit and push your work seamlessly

Note: Run inside a Git-initialized repository.
`);
}

function compareVersions(leftVersion: string, rightVersion: string): number {
  const left = leftVersion.replace(/^v/, '').split('.').map((part) => Number.parseInt(part, 10) || 0);
  const right = rightVersion.replace(/^v/, '').split('.').map((part) => Number.parseInt(part, 10) || 0);
  const maxLength = Math.max(left.length, right.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;
    if (leftValue !== rightValue) {
      return leftValue > rightValue ? 1 : -1;
    }
  }

  return 0;
}

function fetchLatestVersion(packageName: string): Promise<string | null> {
  return new Promise((resolve) => {
    const request = https.get(`https://registry.npmjs.org/${packageName}/latest`, (response) => {
      if (response.statusCode !== 200) {
        response.resume();
        resolve(null);
        return;
      }

      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        try {
          const parsed = JSON.parse(body) as { version?: string };
          resolve(parsed.version ?? null);
        } catch {
          resolve(null);
        }
      });
    });

    request.on('error', () => resolve(null));
    request.setTimeout(3000, () => {
      request.destroy();
      resolve(null);
    });
  });
}

export async function checkForUpdates(): Promise<void> {
  const currentVersion = packageJson.version;
  const latestVersion = await fetchLatestVersion(packageJson.name);

  if (!latestVersion) {
    return;
  }

  if (compareVersions(latestVersion, currentVersion) > 0) {
    printWarning(
      `Update available: v${currentVersion} → v${latestVersion}. Run "npm i -g ${packageJson.name}" to update.`
    );
  }
}

export async function showVersion(): Promise<void> {
  printInfo(`jcommit v${packageJson.version}`);
  await checkForUpdates();
}
