---
name: create-pr
description: Create a pull request with proper description, changeset, and Slack message for the Ledger Live monorepo.
---

# Create PR

Create a pull request with proper description, changeset, and all required elements.

## Inputs

Collect the following from the user before starting. Ask for all of them upfront in a single message if they were not provided with the skill invocation:

| Input | Description |
|-------|-------------|
| `TICKET_URL` | JIRA or GitHub issue URL (e.g. `https://ledgerhq.atlassian.net/browse/LIVE-1234`) |
| `TICKET_DESCRIPTION` | Context: what is the problem, what should be done, acceptance criteria if available |
| `CHANGE_TYPE` | `feat` / `fix` / `refactor` / `test` / `docs` / `chore` |
| `CHANGE_SCOPE` | Impacted packages (e.g. `live-mobile`, `ledger-live-desktop`, `@ledgerhq/live-common`) |
| `TEST_COVERAGE` | `yes` / `no` / `partial` — if not fully covered, explain why |
| `QA_FOCUS_AREAS` | What should QA focus on when testing this PR |
| `HAS_UI_CHANGES` | `yes` / `no` — if yes, screenshots must be added to the PR description manually |

---

## Step 1: Analyze the changes

1. Read `.cursor/rules/git-workflow.mdc` (if present) or use the conventions below to load commit conventions
2. Run `git status` and `git diff` to understand current changes
3. Run `git log develop..HEAD --oneline` to see commits on this branch
4. Identify all modified packages for the changeset

**Commit conventions:**
- Format: `<type>[optional scope]: <description>`
- Description: imperative, clear, lowercase
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`
- Examples: `feat(desktop): add dark mode toggle`, `fix(mobile): resolve transaction signing issue`

---

## Step 2: Create the changeset

Use the `create-changeset` skill to add a changeset for the modified packages.

See [/docs/dev/changesets.md](/docs/dev/changesets.md) for package names and impact levels.

---

## Step 3: Commit the changeset

Stage and commit only the changeset file:

```bash
git add .changeset/
git commit -m "chore: add changeset"
```

---

## Step 4: Push and create the PR

Push the branch:

```bash
git push -u origin HEAD
```

Generate the PR body using the template from [/docs/dev/pr-template.md](/docs/dev/pr-template.md), filled with the provided inputs.

Create the PR as a draft and capture the URL:

```bash
PR_URL=$(gh pr create --draft --title "{{PR_TITLE}}" --body "$(cat <<'EOF'
{{GENERATED_PR_BODY}}
EOF
)")
```

Then open the PR in the browser:

```bash
open "$PR_URL"
```

**Always run `open "$PR_URL"` after creating the PR to ensure it opens in the browser. Do NOT skip this step.**

**If there are UI changes** (`HAS_UI_CHANGES` is "yes"):

1. The PR opens in your browser
2. Click the **"..."** menu (top-right of the PR description) → **"Edit"**
3. Scroll to the Before/After table
4. Drag & drop your screenshots into the table cells
5. Click **"Update comment"**
6. When ready, click **"Ready for review"** to publish the PR

---

## Step 5: Generate Slack message

Use the `slack-pr-message` skill to generate the Slack announcement message for the PR.

See [/docs/dev/slack-pr-message.md](/docs/dev/slack-pr-message.md) for format and prefix rules.
