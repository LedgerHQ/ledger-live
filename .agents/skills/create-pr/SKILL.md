---
name: create-pr
description: Create a pull request with a valid title, description, changeset, and all required elements
disable-model-invocation: true
---

> [!TIP]
> 
> Note: this skill is for manual, user-invocation only. 
> Agents should only read this only when it is specifically invoked. 
> Canonical [Git conventions](../../../docs/contributing/git-conventions.md) take precedence over this command.

# Create PR

Create a pull request with a valid title, description, changeset, and all required elements.

## Prompt Variables

$TICKET_URL

> Paste the JIRA or GitHub issue URL (e.g., https://ledgerhq.atlassian.net/browse/LIVE-1234)

$TICKET_DESCRIPTION

> Describe the ticket context: What is the problem? What should be done? Include acceptance criteria if available.

$CHANGE_TYPE

> Select the type of change: feat | fix | refactor | test | docs | chore

$CHANGE_SCOPE

> Summarise the scope in a single term? (e.g. architecture, coin-evm, counter-values, e2e, portfolio, swap)

$TEST_COVERAGE

> Are changes covered by tests? yes | no | partial - If not fully covered, explain why.

$QA_FOCUS_AREAS

> What specific areas should QA focus on when testing this PR?

$HAS_UI_CHANGES

> Are there visual/UI changes? yes | no - If yes, you will need to edit the PR description to add screenshots.

## Instructions

### Step 1: Analyze the changes

1. Follow `docs/contributing/git-conventions.md` for valid commit messages
2. Run `git status` and `git diff` to understand current changes
3. Run `git log develop..HEAD --oneline` to see commits on this branch
4. Identify all modified packages for the changeset

### Step 2: Create the changeset

1. Use the `create-changeset` skill to add a changeset for the modified packages.

### Step 3: Prepare the PR

Generate the PR body using [.github/pull_request_template.md](../../../.github/pull_request_template.md).

### Step 4: Create the Pull Request

First, push the branch:

```bash
git push -u origin HEAD
```

Then create the PR as draft and capture the URL:

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

**Important**: Always run `open "$PR_URL"` after creating the PR to ensure it opens in the browser. Do NOT skip this step.

**If there are UI changes** (`$HAS_UI_CHANGES` is "yes"):

1. The PR opens in your browser
2. Click the **"..."** menu (top-right of the PR description) → **"Edit"**
3. Scroll to the Before/After table
4. Drag & drop your screenshots into the table cells
5. Click **"Update comment"**
6. When ready, click **"Ready for review"** to publish the PR

### Step 5: Generate Slack Message

Use the `slack-pr-message` skill (`.agents/skills/slack-pr-message/SKILL.md`) to generate the Slack announcement message for the PR.

## Template Fill Rules

1. **PR Title**: `{{CHANGE_TYPE}}({{SCOPE}}): {{SHORT_DESCRIPTION}}`

   - Example: `feat(mobile): add dark mode toggle`
   - Example: `fix(desktop): resolve transaction signing issue`

2. **DESCRIPTION**: Generate from $TICKET_DESCRIPTION:

   - First paragraph: Problem statement
   - Second paragraph: Solution approach
   - Include code samples for library changes
   - Include before/after for bug fixes

3. **SCREENSHOTS_SECTION**:

   - If $HAS_UI_CHANGES is "yes":
     - Add the table with placeholders:
       ```
       | Before                        | After                         |
       |-------------------------------|-------------------------------|
       | _Drag & drop screenshot here_ | _Drag & drop screenshot here_ |
       ```
     - Tell the user: "Click '...' → 'Edit' on the PR description, then drag & drop your screenshots into the table."
   - If "no", omit the section entirely

4. **CONTEXT**: Link to issues and references:
   - `**JIRA issue**: [LIVE-1234](https://ledgerhq.atlassian.net/browse/LIVE-1234)`
   - `**ADR** (if any): https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/1234`

## Example Output

For a feature adding portfolio analytics:

**PR Title**: `feat(portfolio): add analytics dashboard`

**PR Body**:

```markdown

### 📝 Description

This PR introduces a new analytics dashboard to the portfolio feature, providing users with detailed performance metrics and historical data visualization.

**Problem**: Users currently have no way to track their portfolio performance over time.

**Solution**: Added a new analytics screen with:

- Performance charts (daily, weekly, monthly views)
- Key metrics summary (gains, losses, total value)
- Export functionality for data

### ❓ Context

- **JIRA issue**: [LIVE-5678](https://ledgerhq.atlassian.net/browse/LIVE-5678)
```

**Slack Message**: Generated via the `slack-pr-message` skill.
