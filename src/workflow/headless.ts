import { GjCommitConfig, HeadlessOptions } from '../types';
import { printError, printInfo, printSuccess } from '../utils/colors';
import { createBranchFromBase, getCurrentBranch, switchBranch } from '../utils/git';
import { JiraService } from '../services/jira';
import {
  assertGitRepo,
  assertNotProtected,
  assertStagedChanges,
  commitChanges,
  pushCurrentBranch,
  requireCurrentBranch,
} from './steps';

const JIRA_KEY_PATTERN = /^[A-Za-z]+-[0-9]+$/;

function validateOptions(options: HeadlessOptions): void {
  // Valid issue inputs: --ticket alone (reuse issue), --message alone (create
  // issue), or both (reuse issue with a custom commit message). Neither is invalid.
  if (!options.message && !options.ticket) {
    printError(
      'Headless mode needs a Jira issue. Pass --ticket <KEY> to use an existing issue ' +
        'or --message <text> to create one.'
    );
    process.exit(1);
  }

  if (options.ticket && !JIRA_KEY_PATTERN.test(options.ticket)) {
    printError(`Invalid Jira ticket key: '${options.ticket}'. Expected a key like PROJ-123.`);
    process.exit(1);
  }

  if (options.createBranch && options.switchBranch) {
    printError('Cannot use --create-branch and --branch together. Choose one branch action.');
    process.exit(1);
  }

  if (options.createBranch && !options.baseBranch) {
    printError('--create-branch requires --base <branch> to create the new branch from.');
    process.exit(1);
  }

  if (options.baseBranch && !options.createBranch) {
    printError('--base only applies to --create-branch. Add --create-branch <name>.');
    process.exit(1);
  }
}

function resolveBranch(options: HeadlessOptions, currentBranch: string): string {
  if (options.createBranch) {
    const base = options.baseBranch as string;
    if (!createBranchFromBase(base, options.createBranch)) {
      printError(`Failed to create branch '${options.createBranch}' from '${base}'`);
      process.exit(1);
    }
    if (!switchBranch(options.createBranch)) {
      printError(`Failed to switch to newly created branch '${options.createBranch}'`);
      process.exit(1);
    }
    printSuccess(`Created and switched to branch '${options.createBranch}' from '${base}'`);
    return options.createBranch;
  }

  if (options.switchBranch) {
    if (!switchBranch(options.switchBranch)) {
      printError(`Failed to switch to branch '${options.switchBranch}'`);
      process.exit(1);
    }
    printSuccess(`Switched to branch '${options.switchBranch}'`);
    return getCurrentBranch() || options.switchBranch;
  }

  return currentBranch;
}

async function resolveCommitMessage(
  jiraService: JiraService,
  options: HeadlessOptions
): Promise<string> {
  if (options.ticket) {
    if (options.message) {
      return `${options.ticket} | ${options.message}`;
    }

    printInfo('Fetching Jira work item details...');
    const { summary, status } = await jiraService.getIssue(options.ticket);
    if (!summary) {
      printError(`Could not read a summary for ${options.ticket}.`);
      process.exit(1);
    }
    printInfo(`Using ${options.ticket} (${status || 'unknown status'}): ${summary}`);
    return `${options.ticket} | Fix: ${summary}`;
  }

  const summary = options.message as string;
  const description = options.description || summary;
  printInfo('Creating Jira work item...');
  const issueKey = await jiraService.createIssue(summary, description);
  printSuccess(`Created Jira work item: ${issueKey}`);
  return `${issueKey} | ${summary}`;
}

export async function runHeadless(config: GjCommitConfig, options: HeadlessOptions): Promise<void> {

  validateOptions(options);

  assertGitRepo();
  let currentBranch = requireCurrentBranch();
  printInfo(`Branch: ${currentBranch}`);

  currentBranch = resolveBranch(options, currentBranch);

  assertStagedChanges();
  assertNotProtected(currentBranch, config);

  const jiraService = new JiraService(config);
  const commitMessage = await resolveCommitMessage(jiraService, options);

  commitChanges(commitMessage);

  if (options.push) {
    pushCurrentBranch();
  } else {
    printInfo('Commit was not pushed to remote. Pass --push to push.');
  }

  printSuccess('Committed successfully!');
}
