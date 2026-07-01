#!/usr/bin/env node

import { checkForUpdates, parseArgs, showUsage, showVersion } from './cli/args';
import { getConfigPath, readConfig, ensureRequiredConfig } from './config/config';
import { runSetup, mainWorkflow } from './workflow/main';
import { runHeadless } from './workflow/headless';
import { printError, printInfo, printSuccess, printWarning } from './utils/colors';

async function run(): Promise<void> {

  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help) {
    showUsage();
    return;
  }
  if (parsed.version) {
    await showVersion();
    return;
  }

  // Keep headless output clean and fast — skip the banner and the network update check.
  if (!parsed.headless) {
    printInfo('~ jcommit ~');
    await checkForUpdates();
    console.log('');
  }

  const configPath = getConfigPath(parsed.configPath);
  if (parsed.command === 'setup') {
    await runSetup(configPath);
    return;
  }

  const config = readConfig(configPath);
  if (!config) {
    printWarning(`Config not found at ${configPath}`);
    printInfo('It looks like this is your first time using jcommit. To get started, please run: jcommit setup');
    process.exit(1);
  }
  const missing = ensureRequiredConfig(config);
  if (missing.length) {
    printError('Your configuration is incomplete or outdated.');
    printInfo(`The following fields are required: ${missing.join(', ')}`);
    printInfo('Please update your settings by running: jcommit setup');
    process.exit(1);
  }

  if (parsed.headless) {
    await runHeadless(config, {
      message: parsed.message,
      ticket: parsed.ticket,
      description: parsed.description,
      switchBranch: parsed.switchBranch,
      createBranch: parsed.createBranch,
      baseBranch: parsed.baseBranch,
      push: parsed.push === true,
    });
    return;
  }

  await mainWorkflow(config);
}

run().catch((error) => {
  printError('Execution halted due to an unexpected error:');
  printError(error.message || String(error));
  process.exit(1);
});
