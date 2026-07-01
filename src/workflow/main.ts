import readline from 'readline/promises';
import { GjCommitConfig } from '../types';
import { printInfo, printSuccess, printError, printWarning } from '../utils/colors';
import { listRemoteBranches, listLocalBranches, switchBranch, createBranchFromBase, getCurrentBranch } from '../utils/git';
import { promptInput, promptSecret, promptYesNo } from '../utils/prompts';
import { JiraService } from '../services/jira';
import { readConfig, writeConfig, ensureRequiredConfig, getDefaultProtectedBranches } from '../config/config';
import {
  assertGitRepo,
  assertNotProtected,
  assertStagedChanges,
  commitChanges,
  pushCurrentBranch,
  requireCurrentBranch,
} from './steps';

export async function runSetup(configPath: string): Promise<void> {
  const existingConfig = readConfig(configPath) || {} as Partial<GjCommitConfig>;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  printInfo(`
┌─────────────────────────────────────────────────────────────────┐
│                 jcommit configuration setup                     │
└─────────────────────────────────────────────────────────────────┘

This interactive setup will create or update your jcommit configuration for Jira-Git integration.
• Leave fields blank to keep existing values
• Manual edit path: ${configPath}
`);

  const jiraDomain = await promptInput(rl, 'Jira URL (e.g., company.atlassian.net)', {
    required: true,
    defaultValue: existingConfig.jiraDomain,
  });
  const jiraEmail = await promptInput(rl, 'Email (e.g., user@company.com)', {
    required: true,
    defaultValue: existingConfig.jiraEmail,
  });
  const jiraApiToken = await promptSecret(
    rl,
    'Jira API token (create at https://id.atlassian.com/manage-profile/security/api-tokens; copy token, not label)',
    {
      allowEmpty: true,
      hasExisting: Boolean(existingConfig.jiraApiToken),
    }
  );
  const jiraAssigneeId = await promptInput(rl, 'Default Jira assignee account ID (press enter to leave unassigned)', {
    required: false,
    defaultValue: existingConfig.jiraAssigneeId,
  });
  const jiraProjectId = await promptInput(rl, 'Jira project ID (e.g., 11203)', {
    required: true,
    defaultValue: existingConfig.jiraProjectId,
  });
  const jiraIssueTypeId = await promptInput(rl, 'Jira issue type ID (e.g., 3)', {
    required: true,
    defaultValue: existingConfig.jiraIssueTypeId,
  });
  const protectedBranchesRaw = await promptInput(
    rl,
    'Enter protected branches (separated by commas)',
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
    jiraAssigneeId: jiraAssigneeId || '',
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

  printSuccess('Hi, ' + config.jiraEmail.split('@')[0]);

  printInfo('Committing changes to git');

  assertGitRepo();

  let currentBranch = requireCurrentBranch();

  printInfo(`You are on branch:`);
  printWarning(`${currentBranch}`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const branchAction = await promptInput(
    rl,
    'Select branch action: [c]reate new branch from different branch, [s]witch branch, [u]se current branch',
    { required: true }
  );
  const normalizedAction = branchAction.trim().toLowerCase();

  if (normalizedAction === 'c' || normalizedAction === 'create') {
    printInfo('Available base branches:');
    const remoteBranches = listRemoteBranches();
    remoteBranches.forEach((branch) => console.log(`  - ${branch}`));

    const baseBranch = await promptInput(rl, 'Name of the source/base branch', { required: true });
    const newBranchName = await promptInput(rl, 'Name for the new branch', { required: true });

    if (!createBranchFromBase(baseBranch, newBranchName)) {
      rl.close();
      printError(`Failed to create branch '${newBranchName}' from '${baseBranch}'`);
      process.exit(1);
    }

    if (!switchBranch(newBranchName)) {
      rl.close();
      printError(`Failed to switch to newly created branch '${newBranchName}'`);
      process.exit(1);
    }

    currentBranch = newBranchName;
    printSuccess(`Created and switched to branch '${newBranchName}' from '${baseBranch}'`);
  } else if (normalizedAction === 's' || normalizedAction === 'switch') {
    printInfo('Available local branches:');
    listLocalBranches().forEach((branch) => console.log(`  - ${branch}`));

    const targetBranchName = await promptInput(rl, 'Name of the local branch to checkout', {
      required: true,
    });
    if (!switchBranch(targetBranchName)) {
      rl.close();
      printError(`Failed to switch to branch '${targetBranchName}'`);
      process.exit(1);
    }

    printSuccess(`Switched to branch '${targetBranchName}'`);
    currentBranch = getCurrentBranch();
  } else if (normalizedAction !== 'u' && normalizedAction !== 'use') {
    rl.close();
    printError('Invalid branch action. Use create, switch, or use current.');
    process.exit(1);
  }

  assertStagedChanges();

  assertNotProtected(currentBranch, config);

  const jiraService = new JiraService(config);

  const openIssues = config.jiraAssigneeId
    ? await jiraService.getOpenIssues(config.jiraEmail, config.jiraAssigneeId)
    : await jiraService.getOpenIssues(config.jiraEmail);

  if (openIssues.length > 0) {
    console.log('');
    printInfo('You have the following open Jira Work items:');
    openIssues.forEach((issue) => printWarning(`${issue.id}: ${issue.summary}`));
    console.log('');
  }

  const userInput = await promptInput(rl, 'Enter commit message to create a new Jira ticket OR Enter existing Jira ticket key (e.g., PROJ-1234)', {
    required: true,
  });

  let summary = userInput;
  let commitMessage = '';
  let skipJiraCreation = false;

  if (/^[A-Za-z]+-[0-9]+$/.test(userInput)) {
    const jiraTicket = userInput;
    printInfo('Fetching Jira work item details...');
    try {
      const { summary: jiraSummary, status: jiraStatus, priority: jiraPriority } = await jiraService.getIssue(jiraTicket);
      if (jiraSummary && jiraStatus) {
        console.log('');
        printInfo('Found Jira work item:');
        console.log(`Ticket: ${jiraTicket}`);
        console.log(`Status: ${jiraStatus}`);
        console.log(`Summary: ${jiraSummary}`);
        console.log(`Priority: ${jiraPriority}`);
        console.log('');

        if (
          await promptYesNo(
            rl,
            'Confirm: Use this Jira ticket for the commit message? [y]es or enter custom summary [n]: '
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
    const descriptionInput = await promptInput(rl, 'Provide a detailed description (or \'n\' to skip & use summary)');
    const description = /^(n|N)$/.test(descriptionInput) ? summary : descriptionInput || summary;

    printInfo('Creating Jira work item...');
    try {
      const issueKey = await jiraService.createIssue(summary, description);
      printSuccess(`Created Jira work item: ${issueKey}`);
      commitMessage = `${issueKey} | ${summary}`;
    } catch (error) {
      rl.close();
      printError('Failed to create Jira work item');
      printError((error as Error).message);
      process.exit(1);
    }
  }

  rl.close();

  commitChanges(commitMessage);

  const rlPush = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  if (await promptYesNo(rlPush, 'Push changes to the remote repository now? [y]es or [n]o: ')) {
    pushCurrentBranch();
  } else {
    printInfo('Commit was not pushed to remote.');
  }
  rlPush.close();

  printSuccess('Committed successfully!');
}
