import readline from 'readline/promises';
import { GjCommitConfig } from '../types';
import { printInfo, printSuccess, printError, printWarning } from '../utils/colors';
import { runGit, listRemoteBranches, listLocalBranches, switchBranch, createBranchFromBase, getCurrentBranch } from '../utils/git';
import { promptInput, promptYesNo } from '../utils/prompts';
import { JiraService } from '../services/jira';
import { getDefaultProtectedBranches } from '../config/config';

export async function runSetup(configPath: string): Promise<void> {
  const { readConfig, writeConfig, ensureRequiredConfig } = await import('../config/config');
  const existingConfig = readConfig(configPath) || {} as Partial<GjCommitConfig>;
  const { promptInput, promptSecret } = await import('../utils/prompts');
  const { printInfo, printSuccess, printError } = await import('../utils/colors');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  printInfo(`Config path: ${configPath}`);
  const jiraDomain = await promptInput(rl, 'Jira URL', {
    required: true,
    defaultValue: existingConfig.jiraDomain,
  });
  const jiraEmail = await promptInput(rl, 'Email', {
    required: true,
    defaultValue: existingConfig.jiraEmail,
  });
  const jiraApiToken = await promptSecret(rl, 'Jira API token', {
    allowEmpty: true,
    hasExisting: Boolean(existingConfig.jiraApiToken),
  });
  const jiraAssigneeId = await promptInput(rl, 'Jira assignee account ID', {
    required: false,
    defaultValue: existingConfig.jiraAssigneeId,
  });
  const jiraProjectId = await promptInput(rl, 'Jira project ID', {
    required: true,
    defaultValue: existingConfig.jiraProjectId,
  });
  const jiraIssueTypeId = await promptInput(rl, 'Jira issue type ID', {
    required: true,
    defaultValue: existingConfig.jiraIssueTypeId,
  });
  const protectedBranchesRaw = await promptInput(
    rl,
    'Protected branches (comma-separated)',
    {
      defaultValue: (existingConfig.protectedBranches || getDefaultProtectedBranches()).join(','),
    }
  );
  rl.close();

  const protectedBranches = protectedBranchesRaw
    .split(',')
    .map((branch) => branch.trim())
    .filter(Boolean);

  const updatedConfig: GjCommitConfig = {
    ...existingConfig,
    jiraDomain,
    jiraEmail,
    jiraApiToken: jiraApiToken || existingConfig.jiraApiToken || '',
    jiraAssigneeId: jiraAssigneeId || undefined,
    jiraProjectId,
    jiraIssueTypeId,
    protectedBranches,
  };

  const missing = ensureRequiredConfig(updatedConfig);
  if (missing.length) {
    printError(`Missing required config values: ${missing.join(', ')}`);
    process.exit(1);
  }

  writeConfig(configPath, updatedConfig);
  printSuccess('Config saved. You can now use jcommit command.');
}

export async function mainWorkflow(config: GjCommitConfig): Promise<void> {
  printInfo('Committing changes to git');

  const gitCheck = runGit(['rev-parse', '--git-dir']);
  if (gitCheck.status !== 0) {
    printError('Not in a git repository!');
    process.exit(1);
  }

  let currentBranch = getCurrentBranch();
  if (!currentBranch) {
    printError('Failed to get current branch');
    process.exit(1);
  }

  printInfo(`You are on branch '${currentBranch}'`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  if (await promptYesNo(rl, 'Do you want to create a new branch from another branch?')) {
    printInfo('Available base branches:');
    const branches = listRemoteBranches();
    branches.forEach((branch) => console.log(`  - ${branch}`));

    const baseBranch = await promptInput(rl, 'Enter base branch name', { required: true });
    const newBranch = await promptInput(rl, 'Enter new branch name', { required: true });

    if (!createBranchFromBase(baseBranch, newBranch)) {
      rl.close();
      printError(`Failed to create branch '${newBranch}' from '${baseBranch}'`);
      process.exit(1);
    }
    
    // Switch to the newly created branch
    if (!switchBranch(newBranch)) {
      rl.close();
      printError(`Failed to switch to newly created branch '${newBranch}'`);
      process.exit(1);
    }
    
    currentBranch = newBranch;
    printSuccess(`Created and switched to branch '${newBranch}' from '${baseBranch}'`);
  }

  if (!(await promptYesNo(rl, 'Do you want to continue with this branch?'))) {
    printInfo('Available local branches:');
    listLocalBranches().forEach((branch) => console.log(`  - ${branch}`));

    const newBranch = await promptInput(rl, 'Enter the branch name to checkout', {
      required: true,
    });
    if (!switchBranch(newBranch)) {
      rl.close();
      printError(`Failed to switch to branch '${newBranch}'`);
      process.exit(1);
    }

    printSuccess(`Switched to branch '${newBranch}'`);
    currentBranch = getCurrentBranch();

    if (!(await promptYesNo(rl, `You are now on branch '${currentBranch}'. Do you want to continue?`))) {
      rl.close();
      printInfo('Operation cancelled.');
      process.exit(0);
    }
  }

  const diffResult = runGit(['diff', '--cached', '--quiet']);
  if (diffResult.status === 0) {
    rl.close();
    printError('No staged changes found. Please stage your changes before committing.');
    process.exit(1);
  }

  const protectedBranches = Array.isArray(config.protectedBranches) && config.protectedBranches.length
    ? config.protectedBranches
    : getDefaultProtectedBranches();

  if (protectedBranches.includes(currentBranch)) {
    rl.close();
    printError(`Operation cancelled. '${currentBranch}' is protected.`);
    process.exit(1);
  }

  const userInput = await promptInput(rl, 'Enter the summary or Jira work item ID (e.g., ORG-12345)', {
    required: true,
  });

  let summary = userInput;
  let commitMessage = '';
  let skipJiraCreation = false;
  const jiraService = new JiraService(config);

  if (/^[A-Za-z]+-[0-9]+$/.test(userInput)) {
    const jiraTicket = userInput;
    printInfo('Fetching Jira ticket details...');
    try {
      const { summary: jiraSummary, status: jiraStatus } = await jiraService.getIssue(jiraTicket);
      if (jiraSummary && jiraStatus) {
        console.log('');
        printInfo('Found Jira issue:');
        console.log(`Ticket: ${jiraTicket}`);
        console.log(`Status: ${jiraStatus}`);
        console.log(`Summary: ${jiraSummary}`);
        console.log('');

        if (
          await promptYesNo(
            rl,
            'Use this Jira ticket for the commit message? (y) or enter custom summary (n): '
          )
        ) {
          commitMessage = `${jiraTicket} | Fix: ${jiraSummary}`;
          skipJiraCreation = true;
        } else {
          const customSummary = await promptInput(rl, 'Enter custom commit message', {
            required: true,
          });
          commitMessage = `${jiraTicket} | ${customSummary}`;
          skipJiraCreation = true;
        }
      } else {
        printWarning('Failed to parse Jira issue details. Continuing with manual commit message...');
        summary = userInput;
      }
    } catch (error) {
      printError('Failed to fetch Jira issue. Continuing with manual commit message...');
      summary = userInput;
    }
  }

  if (!skipJiraCreation) {
    const descriptionInput = await promptInput(rl, 'Enter the description (or \'n\' to skip)');
    const description = /^(n|N)$/.test(descriptionInput) ? summary : descriptionInput || summary;

    printInfo('Creating Jira issue...');
    try {
      const issueKey = await jiraService.createIssue(summary, description);
      printSuccess(`Created Jira issue: ${issueKey}`);
      commitMessage = `${issueKey} | ${summary}`;
    } catch (error) {
      rl.close();
      printError('Failed to create Jira issue');
      printError((error as Error).message);
      process.exit(1);
    }
  }

  rl.close();

  printInfo('Committing...');
  const commitResult = runGit(['commit', '-m', commitMessage], { stdio: 'inherit' });
  if (commitResult.status !== 0) {
    printError('Git commit failed');
    process.exit(1);
  }
  printSuccess(`Git commit successful with message: ${commitMessage}`);

  const rlPush = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  if (await promptYesNo(rlPush, 'Do you want to push this commit to remote?')) {
    currentBranch = getCurrentBranch();
    printInfo('Pushing to remote...');
    const pushResult = runGit(['push', '--set-upstream', 'origin', currentBranch], {
      stdio: 'inherit',
    });
    if (pushResult.status !== 0) {
      rlPush.close();
      printError('Git push failed');
      process.exit(1);
    }
    printSuccess('Git push successful');
  } else {
    printInfo('Commit was not pushed to remote.');
  }
  rlPush.close();

  printSuccess('Workflow completed successfully!');
}
