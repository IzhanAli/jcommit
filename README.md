
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

- `jiraDomain`: Your Jira domain (e.g., `company.atlassian.net`)

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

  

## Headless mode (CI, scripts & git hooks)

  

Run the full workflow with **no interactive prompts** — every input comes from flags. Headless mode turns on when you pass `--headless`/`-y`, or automatically when you pass `--ticket` or `--message`.

  

```sh

# Commit against an existing Jira issue, then push

jcommit --ticket PROJ-123 --push

  

# Create a new Jira issue from the message, commit, and push

jcommit --message "fix login redirect" --push

  

# Existing issue, but with a custom commit message (no Jira lookup)

jcommit --ticket PROJ-123 --message "revert hotfix"

  

# Create a branch from a base, then commit

jcommit --message "add cache layer" --create-branch feat/cache --base main

```

  

Flags:

  

| Flag | Description |
| --- | --- |
| `-y`, `--headless` | Run without prompts (implied by `--ticket`/`--message`) |
| `-t`, `--ticket <KEY>` | Use an existing Jira issue, e.g. `PROJ-123` |
| `-m`, `--message <text>` | Summary for a new issue, or a custom message when paired with `--ticket` |
| `-d`, `--description <text>` | Description for the new issue (defaults to the message) |
| `-b`, `--branch <name>` | Switch to an existing branch before committing |
| `--create-branch <name>` | Create a new branch (requires `--base`) |
| `--base <name>` | Base branch for `--create-branch` |
| `--push` / `--no-push` | Push after committing (default: no push) |

  

Pass exactly one of `--ticket` or `--message` (or both, to set a custom message on an existing issue). On any missing or conflicting input, headless mode prints a clear error and exits non-zero instead of hanging on a prompt — safe for CI.

  

## AI skill

  

This repo ships an AI skill — a standard `SKILL.md` — so an AI coding agent can drive jcommit for you, always non-interactively. It lives under `.agents/skills/jcommit/`:

  

- `SKILL.md` — installing/configuring jcommit and running it headless: choosing or creating a Jira issue, branch actions, committing/pushing, plus troubleshooting.
- `references/commit-message.md` — writing Jira-title-style commit messages.

  

Point a compatible agent at the repo and ask, e.g. _"commit this with jcommit against PROJ-123"_ or _"create a Jira ticket for these changes and commit"_ — it runs the right headless flags for you.

  

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

    ├── main.ts # Interactive workflow + setup wizard

    ├── headless.ts # Headless (non-interactive) workflow

    └── steps.ts # Shared steps (git checks, commit, push)

```