import fs from 'fs';
import os from 'os';
import path from 'path';
import { GjCommitConfig } from '../types';

const CONFIG_ENV = 'JCOMMIT_CONFIG';
const DEFAULT_CONFIG_PATH = path.join(os.homedir(), '.jcommit.json');
const DEFAULT_PROTECTED_BRANCHES = ['master'];

export function getConfigPath(explicitPath: string | null): string {
  if (explicitPath) {
    return path.resolve(explicitPath);
  }
  if (process.env[CONFIG_ENV]) {
    return path.resolve(process.env[CONFIG_ENV]);
  }
  return DEFAULT_CONFIG_PATH;
}

export function readConfig(configPath: string): GjCommitConfig | null {
  if (!fs.existsSync(configPath)) {
    return null;
  }
  const raw = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(raw) as GjCommitConfig;
}

export function writeConfig(configPath: string, data: GjCommitConfig): void {
  const payload = JSON.stringify(data, null, 2);
  fs.writeFileSync(configPath, `${payload}\n`, { mode: 0o600 });
  try {
    fs.chmodSync(configPath, 0o600);
  } catch (error) {
    // Ignore chmod failures on systems that do not support it.
  }
}

export function ensureRequiredConfig(config: GjCommitConfig): string[] {
  const requiredFields = [
    'jiraDomain',
    'jiraEmail',
    'jiraApiToken',
    'jiraProjectId',
    'jiraIssueTypeId',
  ];
  const missing = requiredFields.filter((field) => !config[field as keyof GjCommitConfig]);
  return missing;
}

export function getDefaultProtectedBranches(): string[] {
  return DEFAULT_PROTECTED_BRANCHES;
}
