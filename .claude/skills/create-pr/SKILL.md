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

Run these commands to understand the current state of the branch:

```bash
git status
git diff
git log develop..HEAD --oneline
```

Use the output to:
- Confirm which packages are modified (cross-check with `CHANGE_SCOPE`)
- Draft the PR title: `CHANGE_TYPE(SCOPE): short description`

**Commit conventions** (from `git-workflow.mdc`):
- Format: `<type>[optional scope]: <description>`
- Description: imperative, clear, lowercase
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`
- Examples: `feat(desktop): add dark mode toggle`, `fix(mobile): resolve transaction signing issue`

---

## Step 2: Create the changeset

Create a `.changeset/<adjective-noun-verb>.md` file using the `@changesets/cli` naming convention (random human-readable identifier, e.g. `brave-foxes-sing.md`).

Format:

```markdown
---
"package-name": minor
---

Short description of the change
```

**Package name reference:**

| App / Lib | Package name |
|-----------|-------------|
| Mobile app | `live-mobile` |
| Desktop app | `ledger-live-desktop` |
| Common lib | `@ledgerhq/live-common` |
| Coin modules | `@ledgerhq/coin-<name>` |
| Other libs | Check the lib's `package.json` `name` field |

**Impact levels:**

| Level | When to use |
|-------|-------------|
| `minor` | New features, bug fixes, non-breaking changes |
| `major` | Breaking changes (rare, requires discussion) |
| `patch` | Internal-only changes, dependency bumps |

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

Generate the PR body from this template, filled with the provided inputs:

```markdown
### ✅ Checklist

- [x] `npx changeset` was attached.
- [{{TEST_CHECKBOX}}] **Covered by automatic tests.** {{TEST_EXPLANATION}}
- [x] **Impact of the changes:**
      {{QA_FOCUS_AREAS}}

### 📝 Description

{{DESCRIPTION}}

{{SCREENSHOTS_SECTION}}

### ❓ Context

- **JIRA or GitHub link**: {{TICKET_LINK}}

---

### 🧐 Checklist for the PR Reviewers

- **The code aligns with the requirements** described in the linked JIRA or GitHub issue.
- **The PR description clearly documents the changes** made and explains any technical trade-offs or design decisions.
- **There are no undocumented trade-offs**, technical debt, or maintainability issues.
- **The PR has been tested** thoroughly, and any potential edge cases have been considered and handled.
- **Any new dependencies** have been justified and documented.
- **Performance** considerations have been taken into account. (changes have been profiled or benchmarked if necessary)
```

Create the PR as a draft:

```bash
gh pr create --draft --title "{{PR_TITLE}}" --body "$(cat <<'EOF'
{{GENERATED_PR_BODY}}
EOF
)"
```

Then open it in the browser:

```bash
gh pr view --web
```

**Always open the PR in the browser after creating it.**

---

## Step 5: Generate Slack message

Output a Slack message using the format below, then ask the user to post it in the relevant channel.

```
:pr-open: {{PREFIX}} - {{SHORT_DESCRIPTION}}
{{PR_URL}}
```

**Prefix rules:**

| Impacted packages | Prefix |
|---|---|
| `live-mobile` only | `LWM` |
| `ledger-live-desktop` only | `LWD` |
| `@ledgerhq/live-common` or shared libs | `Common` |
| CI, scripts, developer tooling | `Tooling` |
| Both `live-mobile` and `ledger-live-desktop` | `LWM + LWD` |

---

## Template fill rules

| Placeholder | Rule |
|---|---|
| `{{PR_TITLE}}` | `CHANGE_TYPE(SCOPE): short description` — e.g. `feat(mobile): add dark mode toggle` |
| `{{TEST_CHECKBOX}}` | `x` if TEST_COVERAGE is "yes", ` ` (space) if "no" or "partial" |
| `{{TEST_EXPLANATION}}` | Empty if fully covered; italicised explanation if partial/no |
| `{{QA_FOCUS_AREAS}}` | Bullet list from QA_FOCUS_AREAS input |
| `{{DESCRIPTION}}` | Problem statement paragraph + solution approach paragraph; include code samples for lib changes, before/after for bug fixes |
| `{{SCREENSHOTS_SECTION}}` | If HAS_UI_CHANGES=yes: add the table below and instruct the user to drag & drop screenshots via the GitHub UI. If no, omit entirely. |
| `{{TICKET_LINK}}` | JIRA: `[LIVE-1234](url)` / GitHub: `#123` |

Screenshots table (when HAS_UI_CHANGES=yes):

```markdown
| Before | After |
| ------ | ----- |
| _Drag & drop screenshot here_ | _Drag & drop screenshot here_ |
```

If UI changes are present, remind the user:
> Click **"..."** → **"Edit"** on the PR description in GitHub, then drag & drop your screenshots into the table cells.
