
# jcommit

jcommit integrates Jira-Git for your work so that you can commit faster and confidently

- Helps you through seamless branch creation so that your work stays on top of latest changes.

- Eliminates manual Jira work item creation by either:

		- Automatic work item creation with assignee and mentioning the work item key in your commit message
		- Using the existing work item summary to help you close the work item so that the commit message is consistent with the work item

Built in TypeScript and designed to keep your accelerate code-push flow and consistent.

  

### Why is it faster:

  

- **Jira integration**: Uses Jira API to create & assign or fetch issues and include keys in commit messages.
- **Branch safety**: Prevent commits to protected branches.
- **Remote sync**: Make your work sit on top, so it eliminates rebasing
- **Push after commit**: Never forget creating PR again

  

## Install

  

```sh

npm install -g jcommit

```

## Configuration

  

By default, config is stored at `~/.jcommit.json`. Override with:

  

```sh

JCOMMIT_CONFIG=/path/to/config.json jcommit setup

```

  

Required configuration fields (references attached):

- `jiraURL`: Your Jira domain (e.g., `company.atlassian.net`)

- `jiraEmail`: Your Jira email

- `jiraApiToken`: [Create Jira API token]([https://id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)) and add

- `jiraProjectId`: Your [Jira project ID](https://support.atlassian.com/jira/kb/how-to-get-the-id-of-a-jira-project-from-a-web-browser/)

- `jiraIssueTypeId`: [Default issue type ID](https://support.atlassian.com/jira/kb/finding-the-id-for-issue-types-in-jira-server-or-data-center/)

  

Optional fields:
- `jiraAssigneeId`: Your [Jira account ID](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-users#api-group-users) for assigning
- `protectedBranches`: Array of protected branch names (default: `["master"]`)

  
  

## Quick Start

  

```sh

jcommit setup


```



## Usage

  

```sh

jcommit

```

  

Optional flags:

  

```sh

jcommit --config /path/to/config.json

jcommit --help

jcommit --version

```

## Examples

  

Push your work tied to an issue and commit:

  

```sh

jcommit

```

  

Run with a custom config location:

  

```sh

jcommit --config ./config/jcommit.json

```

  

## Development
Integrate and customize according to your needs

  

### Prerequisites

- Node.js >= 18.16.1

- npm

  

### Setup

```bash

npm install

```

  

### Build

```bash

npm run build

```

  

### Development Mode

```bash

npm run dev

```

  

## Local Install (from repo)

  

```sh

npm install -g .

```

  

## Project Structure

  

```

src/

├── types.ts # TypeScript type definitions

├── index.ts # Main entry point

├── cli/

│ └── args.ts # CLI argument parsing

├── config/

│ └── config.ts # Configuration management

├── services/

│ └── jira.ts # Jira API service

├── utils/

│ ├── colors.ts # Console color utilities

│ ├── git.ts # Git command utilities

│ └── prompts.ts # Interactive prompt utilities

└── workflow/

└── main.ts # Main workflow logic

```