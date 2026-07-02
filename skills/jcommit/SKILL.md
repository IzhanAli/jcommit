---
name: jcommit
description: Drive the `jcommit` CLI to commit staged changes linked to a Jira issue — reference or create a Jira ticket, prefix the commit with its key, optionally create/switch branches, and optionally push. Also covers installing/updating jcommit and creating its config file. Use when the user asks to commit with jcommit, make a Jira-linked commit, create a Jira ticket for their changes, set up jcommit, or run the jcommit workflow. Always uses jcommit's headless (non-interactive) flags.
---

# jcommit — Jira-linked Git commits

`jcommit` commits staged changes with a message tied to a Jira issue: it either
**references an existing ticket** or **creates a new one**, writes a commit
message of the form `KEY | message`, and can create/switch branches and push.

## Critical rule: headless only

Always invoke jcommit with headless flags. **Never run bare `jcommit` or
`jcommit setup`** from this skill — they read answers from stdin and will hang,
since an agent cannot respond to the prompts. Every commit invocation must
include `-t` (existing ticket) or `-m` (new ticket); either turns headless mode
on automatically (`-y`/`--headless` is the explicit form).

## Install & update

- Install globally: `npm install -g jcommit` (needs Node.js ≥ 18.16.1).
- From a local clone: `npm install -g .` (build first if needed: `npm run build`).
- Check the installed version and whether a newer one exists: `jcommit --version`.
- Update to latest: `npm install -g jcommit@latest`.
- If `jcommit` is "command not found" after install, npm's global bin dir isn't
  on `PATH` — check `npm bin -g`.

## Configure (`~/.jcommit.json`)

jcommit reads `~/.jcommit.json` (override with `$JCOMMIT_CONFIG` or `-c <path>`).
The `jcommit setup` wizard is interactive, so either **ask the user to run it
themselves**, or (preferred for an agent) **write the file directly**:

```json
{
  "jiraDomain": "company.atlassian.net",
  "jiraEmail": "you@company.com",
  "jiraApiToken": "<api-token>",
  "jiraProjectId": "11203",
  "jiraIssueTypeId": "3",
  "jiraAssigneeId": "",
  "protectedBranches": ["master"]
}
```

- **Required:** `jiraDomain`, `jiraEmail`, `jiraApiToken`, `jiraProjectId`,
  `jiraIssueTypeId`. **Optional:** `jiraAssigneeId`, `protectedBranches`
  (defaults to `["master"]`).
- The **API token is a secret** — collect real values from the user; never
  fabricate a token. Create one at
  `https://id.atlassian.com/manage-profile/security/api-tokens` (copy the token
  itself, not its label).
- `jiraProjectId` and `jiraIssueTypeId` are the numeric project / issue-type IDs
  from the user's Jira instance.
- After writing the file, restrict it: `chmod 600 ~/.jcommit.json` (it holds a
  credential).

## Before you commit

1. **In a git repo?** jcommit exits if not.
2. **Changes staged?** jcommit only commits the index — check `git status` /
   `git diff --cached --stat`; `git add` the intended files if nothing is staged.
3. **Branch not protected?** jcommit refuses protected branches (default
   `master`, plus any in `protectedBranches`). If the current branch is
   protected, create/switch to a feature branch.
4. **Configured?** See *Configure* above if the config is missing or incomplete.

## Pick the Jira mode

| Situation | Command |
| --- | --- |
| Commit against an existing ticket | `jcommit -t PROJ-123` → `PROJ-123 \| Fix: <ticket summary>` |
| Existing ticket, custom commit text | `jcommit -t PROJ-123 -m "revert hotfix"` → `PROJ-123 \| revert hotfix` |
| No ticket yet — create one | `jcommit -m "fix login redirect" [-d "longer description"]` |

`-t KEY` alone reads the ticket summary from Jira. `-t KEY -m "…"` skips the
lookup and uses your text. `-m` alone **creates a new Jira issue**.

### Message (`-m`) — Jira-title style

When you author the commit text yourself (a new ticket, or a custom message on an
existing one), write a single-line, **Jira-title-style** summary from the staged
diff — not a long commit body. See
[`references/commit-message.md`](references/commit-message.md) for the rules and
examples. With `-t KEY` alone, jcommit pulls the summary from Jira, so no message
is needed.

### Description (`-d`) — optional, new tickets only

The description is the new issue's body. It's **optional**: if omitted, jcommit
reuses the message, so add `-d` only when extra context helps — 1–3 short
sentences (what changed and why). It has no effect with `-t`.

## Branch & push

- Switch to an existing branch first: `-b <name>` (alias `--switch`).
- Create a branch first: `--create-branch <name> --base <base-branch>`.
- Push after commit: `--push` (default is **no push**; `--no-push` is explicit).

## Full flag reference

| Flag | Meaning |
| --- | --- |
| `-t`, `--ticket <KEY>` | Use existing Jira issue, e.g. `PROJ-123` |
| `-m`, `--message <text>` | New-issue summary, or custom message with `-t` |
| `-d`, `--description <text>` | Description for the new issue (defaults to message) |
| `-b`, `--branch <name>` | Switch to an existing branch before committing |
| `--create-branch <name>` | Create a branch (requires `--base`) |
| `--base <name>` | Base branch for `--create-branch` |
| `--push` / `--no-push` | Push to remote after commit (default: no push) |
| `-y`, `--headless` | Force headless (implied by `-t`/`-m`) |
| `-c`, `--config <path>` | Custom config file |

Bad or conflicting input → jcommit prints a clear error and exits non-zero (it
never falls back to a prompt). Mutually exclusive: `--branch` vs
`--create-branch`; `--create-branch` requires `--base`.

## Confirm outward-facing steps

Two effects reach beyond the local repo — get the user's go-ahead first unless
they already asked:

- **`-m` without `-t` creates a real Jira ticket.** Don't invent tickets silently.
- **`--push` publishes to the remote.** Default to committing only; add `--push`
  when the user wants it pushed.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `Not in a git repository!` | Run inside a git repo. |
| `No staged changes found.` | `git add` your changes first — jcommit commits only the index. |
| `Operation cancelled. '<b>' is protected.` | Use a feature branch, or edit `protectedBranches` in the config. |
| `Config not found` / `configuration is incomplete` | Create/complete `~/.jcommit.json` (see *Configure*). |
| `Invalid Jira ticket key: '…'` | Use the `PROJ-123` form (letters, dash, digits). |
| 401/403 or `Failed to fetch/create Jira issue` | Bad/expired token or wrong `jiraEmail`; regenerate the token and confirm it belongs to that email. |
| `Failed to create Jira work item` | Check `jiraProjectId` / `jiraIssueTypeId` are valid IDs for the project; `jiraAssigneeId`, if set, must be a real accountId. |
| `Git push failed` | No upstream/remote or auth issue — check `git remote -v`. |
| Seems to hang waiting for input | You ran it without `-t`/`-m`/`--headless`; bare `jcommit` is interactive. |

## Examples

```sh
# Stage, then commit against an existing ticket (no push)
git add -A
jcommit -t PROJ-123

# New ticket from a summary, on a fresh branch, then push
jcommit -m "add Redis cache layer" -d "Cache product lookups for 60s" \
  --create-branch feat/cache --base main --push

# Existing ticket with a custom message, switching branch first
jcommit -t PROJ-456 -m "tidy up logging" -b feat/logging
```
