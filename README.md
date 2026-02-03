
# jcommit

jcommit integrates Jira-Git for your work automating branch & Jira ticket creation and preventing protected-branch commits to help you commit faster with confidence.

- Helps you through seamless branch creation so that your work stays on top of latest changes.

- Eliminates manual Jira work item creation by either:

		
		- Shows open work items based on your email or assignee so that you can use existing work item summary to keep your commit message consistent with the work item
		- Automatic work item creation with assignee and mentioning the work item key in your commit message

Built in TypeScript and designed to keep your accelerate code-push flow and consistent.
> Use only if you want your commits to be linked to Jira issues.
  

### Why it's faster:

  

- **Jira integration**: Uses Jira API to create & assign or fetch issues and include ticket ID in commit messages.
- **Branch safety**: Prevent commits to protected branches.
- **Remote sync with upstream**: Make your work sit on top, so it eliminates merging
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