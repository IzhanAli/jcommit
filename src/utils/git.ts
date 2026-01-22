import { spawnSync, SpawnSyncOptions } from 'child_process';

interface GitResult {
  status: number;
  stdout: string;
  stderr: string;
  error?: Error;
}

function runCommand(command: string, args: string[], options: SpawnSyncOptions = {}): GitResult {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.error) {
    throw result.error;
  }
  return {
    status: result.status || 0,
    stdout: (result.stdout as string) || '',
    stderr: (result.stderr as string) || '',
  };
}

export function runGit(args: string[], options: SpawnSyncOptions = {}): GitResult {
  return runCommand('git', args, options);
}

export function listLocalBranches(): string[] {
  const result = runGit(['branch']);
  if (result.status !== 0) {
    throw new Error(result.stderr || 'Failed to list branches.');
  }
  return result.stdout
    .split('\n')
    .map((line) => line.replace(/^[* ]\s?/, '').trim())
    .filter(Boolean);
}

export function listRemoteBranches(): string[] {
  const result = runGit(['branch', '-r']);
  if (result.status !== 0) {
    throw new Error(result.stderr || 'Failed to list remote branches.');
  }
  const branches = result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('origin/') && !line.includes('HEAD'))
    .map((line) => line.replace(/^origin\//, ''));
  return [...new Set(branches)].sort();
}

export function getCurrentBranch(): string {
  const result = runGit(['rev-parse', '--abbrev-ref', 'HEAD']);
  if (result.status !== 0) {
    return '';
  }
  return result.stdout.trim();
}

export function switchBranch(branchName: string): boolean {
  const result = runGit(['checkout', branchName], { stdio: 'inherit' });
  return result.status === 0;
}

export function createBranchFromBase(baseBranch: string, newBranch: string): boolean {
  // Fetch the latest from remote base branch
  const fetchResult = runGit(['fetch', 'origin', baseBranch], { stdio: 'inherit' });
  if (fetchResult.status !== 0) {
    return false;
  }

  // Try to create branch from remote base branch first
  let result = runGit(['branch', newBranch, `origin/${baseBranch}`], { stdio: 'inherit' });
  if (result.status === 0) {
    return true;
  }

  // Fallback to local base branch if remote doesn't exist
  result = runGit(['branch', newBranch, baseBranch], { stdio: 'inherit' });
  return result.status === 0;
}
