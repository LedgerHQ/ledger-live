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

### Step 1: Analyze the changes

1. Run `git status` and `git diff` to understand current changes
2. Run `git log develop..HEAD --oneline` to see commits on this branch
3. Identify all modified packages for the changeset

### Step 2: Create the changeset

Run `npx changeset` interactively OR create a changeset file manually:

```bash
# Interactive mode (recommended)
npx changeset

# Or create manually in .changeset/ with format:
# ---
# "package-name": minor | major
# ---
#
# Description of the change
```

**Changeset naming convention:**

- Use the change description from the ticket
- Keep it concise but descriptive
- Format: `<verb> <what>` (e.g., "Add dark mode toggle", "Fix transaction signing issue")

### Step 3: Prepare the PR

Generate the PR body using this template, filled with the provided information:

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

After creating the PR, use the URL from the `gh pr create` output to generate a Slack message:

```
:pr-open: {{SLACK_PREFIX}} - {{SHORT_DESCRIPTION}}
<PR_URL from gh pr create output>
```

**Slack prefix rules:**

- `LWM` for Ledger Live Mobile changes
- `LWD` for Ledger Live Desktop changes
- `Common` for @ledgerhq/live-common or shared libs
- `Tooling` for CI, scripts, or developer tooling
- `LWM + LWD` if both apps are impacted

## Template Fill Rules

1. **PR Title**: `:gitmoji: {{CHANGE_TYPE}}({{SCOPE}}): {{SHORT_DESCRIPTION}}`

   Map `$CHANGE_TYPE` to gitmoji:
   - `feat` → `:sparkles:`
   - `fix` → `:bug:`
   - `refactor` → `:recycle:`
   - `test` → `:white_check_mark:`
   - `docs` → `:memo:`
   - `chore` → `:wrench:`

   - Example: `:sparkles: feat(mobile): add dark mode toggle`
   - Example: `:bug: fix(desktop): resolve transaction signing issue`

2. **TEST_CHECKBOX**:

   - `x` if $TEST_COVERAGE is "yes"
   - ` ` (space) if "no" or "partial"

3. **TEST_EXPLANATION**:

   - Empty if fully covered
   - Add explanation in italics if partial/no: `_Explanation here_`

4. **QA_FOCUS_AREAS**: Format as bullet list from $QA_FOCUS_AREAS

5. **DESCRIPTION**: Generate from $TICKET_DESCRIPTION:

   - First paragraph: Problem statement
   - Second paragraph: Solution approach
   - Include code samples for library changes
   - Include before/after for bug fixes

6. **SCREENSHOTS_SECTION**:

   - If $HAS_UI_CHANGES is "yes":
     - Add the table with placeholders:
       ```
       | Before | After |
       | ------ | ----- |
       | _Drag & drop screenshot here_ | _Drag & drop screenshot here_ |
       ```
     - Tell the user: "Click '...' → 'Edit' on the PR description, then drag & drop your screenshots into the table."
   - If "no", omit the section entirely

7. **TICKET_LINK**: Format properly:
   - JIRA: `[LIVE-1234](https://ledgerhq.atlassian.net/browse/LIVE-1234)`
   - GitHub: `#123`

## Changeset Guidelines

From CONTRIBUTING.md:

- Always add a changeset with `pnpm changeset`
- Package names must match exactly (check package.json):
  - `live-mobile` for mobile app
  - `ledger-live-desktop` for desktop app
  - `@ledgerhq/live-common` for common lib
- Impact levels:
  - `minor`: New features, bug fixes, non-breaking changes
  - `major`: Breaking changes (rare, requires discussion)

## Example Output

For a feature adding portfolio analytics:

**Changeset** (`.changeset/blue-tigers-smile.md`):

```markdown
---
"live-mobile": minor
"ledger-live-desktop": minor
---

Add portfolio analytics dashboard with performance metrics
```

**PR Title**: `:sparkles: feat(portfolio): add analytics dashboard`

**PR Body**:

```markdown
### ✅ Checklist

- [x] `npx changeset` was attached.
- [x] **Covered by automatic tests.**
- [x] **Impact of the changes:**
  - Portfolio screen rendering and performance
  - Analytics data fetching and caching
  - Chart interactions and accessibility

### 📝 Description

This PR introduces a new analytics dashboard to the portfolio feature, providing users with detailed performance metrics and historical data visualization.

**Problem**: Users currently have no way to track their portfolio performance over time.

**Solution**: Added a new analytics screen with:

- Performance charts (daily, weekly, monthly views)
- Key metrics summary (gains, losses, total value)
- Export functionality for data

### ❓ Context

- **JIRA or GitHub link**: [LIVE-5678](https://ledgerhq.atlassian.net/browse/LIVE-5678)
```

**Slack Message**:

```
:pr-open: LWM + LWD - Add portfolio analytics dashboard
https://github.com/LedgerHQ/ledger-live/pull/1234
```
