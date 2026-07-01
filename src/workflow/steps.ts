import { GjCommitConfig } from '../types';
import { printError, printInfo, printSuccess } from '../utils/colors';
import { runGit, getCurrentBranch } from '../utils/git';
import { getDefaultProtectedBranches } from '../config/config';

/**
 * Shared, non-interactive workflow steps used by both the interactive and the
 * headless flows. Each step prints its own feedback and exits the process on a
 * fatal error, so callers can compose them top-to-bottom without re-checking.
 */

export function assertGitRepo(): void {
  const gitCheck = runGit(['rev-parse', '--git-dir']);
  if (gitCheck.status !== 0) {
    printError('Not in a git repository!');
    process.exit(1);
  }
}

export function requireCurrentBranch(): string {
  const currentBranch = getCurrentBranch();
  if (!currentBranch) {
    printError('Failed to get current branch');
    process.exit(1);
  }
  return currentBranch;
}

export function assertStagedChanges(): void {
  const diffResult = runGit(['diff', '--cached', '--quiet']);
  if (diffResult.status === 0) {
    printError('No staged changes found. Please stage your changes before committing.');
    process.exit(1);
  }
}

export function resolveProtectedBranches(config: GjCommitConfig): string[] {
  return Array.isArray(config.protectedBranches) && config.protectedBranches.length
    ? config.protectedBranches
    : getDefaultProtectedBranches();
}

export function assertNotProtected(branch: string, config: GjCommitConfig): void {
  if (resolveProtectedBranches(config).includes(branch)) {
    printError(`Operation cancelled. '${branch}' is protected.`);
    process.exit(1);
  }
}

export function commitChanges(commitMessage: string): void {
  printInfo('Committing...');
  const commitResult = runGit(['commit', '-m', commitMessage], { stdio: 'inherit' });
  if (commitResult.status !== 0) {
    printError('Git commit failed');
    process.exit(1);
  }
  printSuccess(`Git commit successful with message: ${commitMessage}`);
}

export function pushCurrentBranch(): void {
  const currentBranch = getCurrentBranch();
  printInfo('Pushing to remote...');
  const pushResult = runGit(['push', '--set-upstream', 'origin', currentBranch], {
    stdio: 'inherit',
  });
  if (pushResult.status !== 0) {
    printError('Git push failed');
    process.exit(1);
  }
  printSuccess('Git push successful');
}
