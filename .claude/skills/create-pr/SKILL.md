---
name: create-pr
description: Create a pull request with proper description, changeset, and Slack message for the Ledger Live monorepo.
---

# Create PR

Collect the following from the user before starting. Ask for all upfront in a single message if not already provided:

| Input | Description |
|-------|-------------|
| `TICKET_URL` | JIRA or GitHub issue URL |
| `TICKET_DESCRIPTION` | Problem context and acceptance criteria |
| `CHANGE_TYPE` | `feat` / `fix` / `refactor` / `test` / `docs` / `chore` |
| `CHANGE_SCOPE` | Impacted packages |
| `TEST_COVERAGE` | `yes` / `no` / `partial` — explain if not fully covered |
| `QA_FOCUS_AREAS` | What QA should focus on |
| `HAS_UI_CHANGES` | `yes` / `no` |

See [/docs/dev/create-pr.md](/docs/dev/create-pr.md) for the full workflow.
