export interface GjCommitConfig {
  jiraDomain: string;
  jiraEmail: string;
  jiraApiToken: string;
  jiraAssigneeId?: string;
  jiraProjectId: string;
  jiraIssueTypeId: string;
  protectedBranches?: string[];
}

export interface ParsedArgs {
  command: string | null;
  configPath: string | null;
  help: boolean;
  version: boolean;
}

export interface JiraIssue {
  summary: string;
  status: string;
}

export interface JiraCreateRequest {
  fields: {
    description: {
      type: string;
      version: number;
      content: Array<{
        type: string;
        content: Array<{
          type: string;
          text: string;
        }>;
      }>;
    };
    issuetype: { id: string };
    project: { id: string };
    summary: string;
    assignee?: { accountId: string };
  };
  update: Record<string, never>;
}

export interface JiraCreateResponse {
  key: string;
}

export interface PromptOptions {
  required?: boolean;
  defaultValue?: string;
}

export interface SecretPromptOptions {
  allowEmpty?: boolean;
  hasExisting?: boolean;
}

export type ColorType = 'red' | 'green' | 'yellow' | 'blue' | 'reset';
