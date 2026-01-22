#!/usr/bin/env node

import { parseArgs, showUsage, showVersion } from './cli/args';
import { getConfigPath, readConfig, ensureRequiredConfig } from './config/config';
import { runSetup, mainWorkflow } from './workflow/main';
import { printError, printInfo } from './utils/colors';

async function run(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help) {
    showUsage();
    return;
  }
  if (parsed.version) {
    showVersion();
    return;
  }

  const configPath = getConfigPath(parsed.configPath);
  if (parsed.command === 'setup') {
    await runSetup(configPath);
    return;
  }

  const config = readConfig(configPath);
  if (!config) {
    printError(`Config not found at ${configPath}`);
    printInfo('Run `jcommit setup` to create it.');
    process.exit(1);
  }
  const missing = ensureRequiredConfig(config);
  if (missing.length) {
    printError(`Config is missing: ${missing.join(', ')}`);
    printInfo('Run `jcommit setup` to update it.');
    process.exit(1);
  }

  await mainWorkflow(config);
}

run().catch((error) => {
  printError(error.message || 'Unexpected error');
  process.exit(1);
});
