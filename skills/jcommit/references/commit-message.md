# Commit message style (Jira-title)

Reference for writing the `-m` value passed to jcommit. jcommit prepends the
issue key, so the result becomes `KEY | <message>`. The message must read like a
**Jira ticket title** — a single line, not a commit body.

## Style rules

- **One line.** No body, no bullet list, no blank-line-separated paragraphs, no
  `Co-Authored-By`/footer. Detail belongs in the ticket *description*, not here.
- **~50–72 characters.** Hard cap around 72. Tighten ruthlessly.
- **Imperative mood** ("Add…", "Fix…", "Refactor…", "Remove…", "Update…") or a
  clean noun phrase — match how the team titles tickets.
- **Outcome-level**, not a file inventory. Describe what the change achieves, not
  each touched file.
- **No** trailing period. **No** issue key (jcommit adds it). **No** wrapping
  quotes. **No** `type:` prefix (that's commit-convention, not Jira-title).
- **One theme.** If the staged diff mixes unrelated changes, summarize the
  dominant one and suggest the user split the commit rather than cramming
  everything into the title.

## How to write it

1. Read what is actually staged — never guess from the conversation:
   - `git diff --cached --stat`
   - `git diff --cached` (skim hunks; for large diffs lean on the stat plus the
     key changes)
2. Identify the primary, user-facing intent of the change.
3. Write a single Jira-title-style line per the rules above.
4. Show it to the user and let them adjust or confirm — it may also become the
   summary of a real Jira ticket, so it should read well on its own.

## Examples

Good (titles):

- `Fix login redirect loop on expired tokens`
- `Add Redis cache layer for product lookups`
- `Refactor branch resolution into shared workflow steps`
- `Remove deprecated v2 search endpoint`

Avoid (commit-body style — too long / explanatory / prefixed):

- `fix: login kept redirecting in a loop because the refresh token…` — has a
  `type:` prefix and an explanation; the "why" goes in the ticket description.
- A multi-line message with a summary plus paragraphs or bullets.
