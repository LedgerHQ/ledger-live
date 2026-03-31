# Create PR

Create a pull request with proper description, changeset, and all required elements.

## Prompt Variables

$TICKET_URL

> Paste the JIRA or GitHub issue URL (e.g., https://ledgerhq.atlassian.net/browse/LIVE-1234)

$TICKET_DESCRIPTION

> Describe the ticket context: What is the problem? What should be done? Include acceptance criteria if available.

$CHANGE_TYPE

> Select the type of change: feat | fix | refactor | test | docs | chore

$CHANGE_SCOPE

> What packages are impacted? (e.g., live-mobile, ledger-live-desktop, @ledgerhq/live-common)

$TEST_COVERAGE

> Are changes covered by tests? yes | no | partial - If not fully covered, explain why.

$QA_FOCUS_AREAS

> What specific areas should QA focus on when testing this PR?

$HAS_UI_CHANGES

> Are there visual/UI changes? yes | no - If yes, you will need to edit the PR description to add screenshots.

## Instructions

**IMPORTANT**: Before any git commit, read and follow the `.cursor/rules/git-workflow.mdc` rule. All commit messages MUST use the gitmoji shortcode format defined there (`:gitmoji: type(scope): description`). Analyze the staged diff to pick the correct gitmoji and scope.

### Step 1: Analyze the changes

1. Read `.cursor/rules/git-workflow.mdc` to load commit conventions
2. Run `git status` and `git diff` to understand current changes
3. Run `git log develop..HEAD --oneline` to see commits on this branch
4. Identify all modified packages for the changeset

### Step 2: Create the changeset

Use the `create-changeset` skill to add a changeset for the modified packages.

See [@docs/dev/changesets.md](@docs/dev/changesets.md) for package names and impact levels.

### Step 3: Prepare the PR

Generate the PR body using the template from [@docs/dev/pr-template.md](@docs/dev/pr-template.md), filled with the provided information.

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

Use the `slack-pr-message` skill to generate the Slack announcement message for the PR.

See [@docs/dev/slack-pr-message.md](@docs/dev/slack-pr-message.md) for format and prefix rules.

## Template Fill Rules

See [@docs/dev/pr-template.md](@docs/dev/pr-template.md) for the full template and fill rules.
