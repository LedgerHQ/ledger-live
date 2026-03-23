# Create PR

Create a pull request with proper description, changeset, and all required elements.

## Usage

`/create-pr`

You will be asked for:
- Ticket URL (JIRA or GitHub issue)
- Ticket description / acceptance criteria
- Change type: `feat | fix | refactor | test | docs | chore`
- Impacted packages
- Test coverage: `yes | no | partial`
- QA focus areas
- Has UI changes: `yes | no`

## Process

### Step 1: Analyze the changes

```bash
git status
git diff
git log develop..HEAD --oneline
```

Identify all modified packages for the changeset.

### Step 2: Create the changeset

Use `.claude/skills/create-changeset.md` conventions to create `.changeset/<name>.md`.

### Step 3: Prepare the PR body

```markdown
### Checklist

- [x] `npx changeset` was attached.
- [x|_] **Covered by automatic tests.** [explanation if partial/no]
- [x] **Impact of the changes:**
  - [QA focus areas as bullet list]

### Description

[Problem statement]

[Solution approach]

[Before/After table or screenshots if UI changes]

### Context

- **JIRA or GitHub link**: [link]

---

### Checklist for PR Reviewers

- The code aligns with the requirements described in the linked issue.
- The PR description clearly documents the changes and any technical trade-offs.
- There are no undocumented trade-offs, technical debt, or maintainability issues.
- The PR has been tested thoroughly, with edge cases considered.
- Any new dependencies have been justified and documented.
- Performance considerations have been taken into account.
```

### Step 4: Create the PR

```bash
git push -u origin HEAD
PR_URL=$(gh pr create --draft --title "<type>(<scope>): <description>" --body "...")
open "$PR_URL"
```

**Always** run `open "$PR_URL"` after creating the PR.

### Step 5: Generate Slack message

Use `.claude/skills/slack-pr-message.md` to generate the Slack announcement.

## PR Title Format

`<type>(<scope>): <short description>`

Examples:
- `feat(mobile): add dark mode toggle`
- `fix(desktop): resolve transaction signing issue`
