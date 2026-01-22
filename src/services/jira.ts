import { GjCommitConfig, JiraIssue, JiraCreateRequest, JiraCreateResponse } from '../types';

export class JiraService {
  private config: GjCommitConfig;

  constructor(config: GjCommitConfig) {
    this.config = config;
  }

  private getAuthHeaders(): { Authorization: string } {
    const credentials = Buffer.from(`${this.config.jiraEmail}:${this.config.jiraApiToken}`).toString('base64');
    return {
      Authorization: `Basic ${credentials}`,
    };
  }

  async createIssue(summary: string, description: string): Promise<string> {
    const fields: JiraCreateRequest['fields'] = {
      description: {
        content: [
          {
            content: [
              {
                text: description,
                type: 'text',
              },
            ],
            type: 'paragraph',
          },
        ],
        type: 'doc',
        version: 1,
      },
      issuetype: { id: this.config.jiraIssueTypeId },
      project: { id: this.config.jiraProjectId },
      summary,
    };

    if (this.config.jiraAssigneeId) {
      fields.assignee = { accountId: this.config.jiraAssigneeId };
    }

    const requestBody: JiraCreateRequest = {
      fields,
      update: {},
    };

    const response = await fetch(`https://${this.config.jiraDomain}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(text || 'Failed to create Jira issue.');
    }
    const data: JiraCreateResponse = JSON.parse(text);
    if (!data.key) {
      throw new Error('Failed to extract issue key from Jira response.');
    }
    return data.key;
  }

  async getIssue(issueId: string): Promise<JiraIssue> {
    const response = await fetch(
      `https://${this.config.jiraDomain}/rest/api/3/issue/${issueId}?fields=summary,status`,
      {
        method: 'GET',
        headers: {
          ...this.getAuthHeaders(),
          Accept: 'application/json',
        },
      }
    );

    const text = await response.text();
    if (!response.ok) {
      throw new Error(text || 'Failed to fetch Jira issue.');
    }
    const data = JSON.parse(text);
    return {
      summary: data.fields?.summary || '',
      status: data.fields?.status?.name || '',
    };
  }
}
