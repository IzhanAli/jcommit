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

  private async fetchJiraJson(url: string, errorMessage: string): Promise<any> {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
        Accept: 'application/json',
      },
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(text || errorMessage);
    }
    return JSON.parse(text);
  }

  private toJiraIssue(fields: any): JiraIssue {
    return {
      id: fields?.key || '',
      summary: fields?.summary || '',
      status: fields?.status?.name || '',
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
    const data = await this.fetchJiraJson(
      `https://${this.config.jiraDomain}/rest/api/3/issue/${issueId}?fields=summary,status`,
      'Failed to fetch Jira issue.'
    );
    return this.toJiraIssue(data.fields);
  }

  async getOpenIssues(jiraEmail: string, jiraAssigneeId?: string): Promise<JiraIssue[]> {
  const assignee = jiraAssigneeId ? `"${jiraAssigneeId}"` : `"${jiraEmail}"`;
  
  const jql = `assignee = ${assignee} AND statusCategory != Done ORDER BY created ASC`;

  const response = await fetch(`https://${this.config.jiraDomain}/rest/api/3/search/jql`, {
    method: 'POST', 
    headers: {
      ...this.getAuthHeaders(),
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jql: jql,
      fields: ['status'],
      maxResults: 100,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Failed to fetch open issues via search/jql.');
  }

  const data = await response.json();
  return data.issues?.map((issue: any) => this.toJiraIssue(issue)) || [];
}
}
