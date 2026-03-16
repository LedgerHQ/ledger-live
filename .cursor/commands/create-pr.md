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

### Step 5: Trigger E2E CI (scoped to affected tests)

Trigger Desktop and/or Mobile E2E workflows **only when relevant code is impacted**, with a `test_filter` scoped to the affected test suites.

Run `git diff develop...HEAD --stat` once and use the result for both sub-steps.

**Shared rules (apply to both Desktop and Mobile):**
- Combine multiple filter matches with `,` (e.g. `addAccount,send,deposit`)
- If the mapping is ambiguous or touches foundational code (e.g. transport, device, bridge), skip the filter and run all tests (pass no `test_filter`)
- If no paths relevant to a given platform are changed, skip that platform's workflow entirely

---

#### 5.1 Desktop E2E (workflow: `test-ui-e2e-only-desktop.yml`)

**Trigger when:** changes touch `apps/ledger-live-desktop/`, `e2e/desktop/`, or shared libs (`libs/ledger-live-common/`, `libs/ui/`, etc.)

| Changed path pattern | `test_filter` value |
|---|---|
| `e2e/desktop/tests/specs/<name>.spec.ts` | Use the spec file name directly (e.g. `add.account`) |
| `e2e/desktop/tests/models/` or `e2e/desktop/tests/page/` | Map to the spec(s) that use the changed model/page |
| `apps/ledger-live-desktop/src/**/account*` | `add.account,delete.account,rename.account,subAccount` |
| `apps/ledger-live-desktop/src/**/send*` | `send.tx` |
| `apps/ledger-live-desktop/src/**/receive*` | `receive.address` |
| `apps/ledger-live-desktop/src/**/swap*` or `**/exchange*` | `accounts.swap,entrypoint.swap,provider.swap,send.swap,validation.swap` |
| `apps/ledger-live-desktop/src/**/earn*` or `**/stake*` or `**/delegate*` | `earn,delegate` |
| `apps/ledger-live-desktop/src/**/market*` | `market,marketBanner` |
| `apps/ledger-live-desktop/src/**/dashboard*` or `**/portfolio*` | `portfolio` |
| `apps/ledger-live-desktop/src/**/settings*` | `settings` |
| `apps/ledger-live-desktop/src/**/buy*` or `**/sell*` | `buySell` |
| `apps/ledger-live-desktop/src/**/sync*` | `ledgerSync` |
| `libs/ledger-live-common/src/**/account*` | `add.account,delete.account,subAccount` |
| `libs/ledger-live-common/src/**/send*` or `**/transaction*` | `send.tx` |
| `libs/ledger-live-common/src/**/receive*` | `receive.address` |
| `libs/ledger-live-common/src/**/swap*` or `**/exchange*` | `accounts.swap,entrypoint.swap,provider.swap,send.swap,validation.swap` |
| `libs/ledger-live-common/src/**/delegate*` or `**/staking*` | `delegate` |
| `libs/ledger-live-common/src/e2e/**` | Map based on the specific enum/model changed and which specs use it |

```bash
gh workflow run test-ui-e2e-only-desktop.yml \
  --ref "$(git branch --show-current)" \
  -f test_filter="{{DESKTOP_TEST_FILTER}}"
```

---

#### 5.2 Mobile E2E (workflow: `test-mobile-e2e-reusable.yml`)

**Trigger when:** changes touch `apps/ledger-live-mobile/`, `e2e/mobile/`, or shared libs (`libs/ledger-live-common/`, `libs/ui/`, etc.)

| Changed path pattern | `test_filter` value |
|---|---|
| `e2e/mobile/specs/<folder>/*.spec.ts` | Use the folder name directly (e.g. `send`, `addAccount`, `deposit`) |
| `e2e/mobile/page/` or `e2e/mobile/models/` | Map to the spec folder(s) that use the changed page/model |
| `apps/ledger-live-mobile/src/**/account*` | `addAccount,deleteAccount,account,subAccount` |
| `apps/ledger-live-mobile/src/**/send*` | `send` |
| `apps/ledger-live-mobile/src/**/receive*` or `**/deposit*` | `deposit,verifyAddress` |
| `apps/ledger-live-mobile/src/**/swap*` or `**/exchange*` | `swap` |
| `apps/ledger-live-mobile/src/**/earn*` or `**/stake*` or `**/delegate*` | `earn,delegate` |
| `apps/ledger-live-mobile/src/**/market*` | `market` |
| `apps/ledger-live-mobile/src/**/portfolio*` | `portfolio` |
| `apps/ledger-live-mobile/src/**/settings*` | `settings` |
| `apps/ledger-live-mobile/src/**/buy*` or `**/sell*` | `buySell` |
| `apps/ledger-live-mobile/src/**/sync*` | `ledgerSync` |
| `apps/ledger-live-mobile/src/**/deeplink*` or `**/linking*` | `deeplinks` |
| `apps/ledger-live-mobile/src/**/onboarding*` | `onboardingReadOnly` |
| `libs/ledger-live-common/src/**/account*` | `addAccount,deleteAccount,subAccount` |
| `libs/ledger-live-common/src/**/send*` or `**/transaction*` | `send` |
| `libs/ledger-live-common/src/**/receive*` | `deposit,verifyAddress` |
| `libs/ledger-live-common/src/**/swap*` or `**/exchange*` | `swap` |
| `libs/ledger-live-common/src/**/delegate*` or `**/staking*` | `delegate` |
| `libs/ledger-live-common/src/e2e/**` | Map based on the specific enum/model changed and which specs use it |

```bash
gh workflow run test-mobile-e2e-reusable.yml \
  --ref "$(git branch --show-current)" \
  -f test_filter="{{MOBILE_TEST_FILTER}}" \
  -f tests_type="iOS & Android"
```

---

#### 5.3 Retrieve the run URLs

Wait a few seconds for GitHub to register the runs, then fetch their URLs:

```bash
sleep 5
DESKTOP_CI_URL=$(gh run list \
  --workflow test-ui-e2e-only-desktop.yml \
  --branch "$(git branch --show-current)" \
  --limit 1 \
  --json url \
  --jq '.[0].url')

MOBILE_CI_URL=$(gh run list \
  --workflow test-mobile-e2e-reusable.yml \
  --branch "$(git branch --show-current)" \
  --limit 1 \
  --json url \
  --jq '.[0].url')
```

#### 5.4 Add the CI links to the PR description

Append a **🔄 CI Execution** section to the PR body (use `gh pr edit`).
Only include lines for the workflows that were actually triggered.
If no filter was applied (full run), write `all tests` instead of the filter value.

```bash
gh pr edit "$PR_URL" --body "$(gh pr view "$PR_URL" --json body --jq .body)

### 🔄 CI Execution

- **Desktop E2E** (filter: \`{{DESKTOP_TEST_FILTER}}\`): $DESKTOP_CI_URL
- **Mobile E2E** (filter: \`{{MOBILE_TEST_FILTER}}\`): $MOBILE_CI_URL"
```

### Step 6: Generate Slack Message

Use the `slack-pr-message` skill (`.cursor/skills/slack-pr-message/SKILL.md`) to generate the Slack announcement message for the PR.

## Template Fill Rules

1. **PR Title**: `{{CHANGE_TYPE}}({{SCOPE}}): {{SHORT_DESCRIPTION}}`

   - Example: `feat(mobile): add dark mode toggle`
   - Example: `fix(desktop): resolve transaction signing issue`

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

## Example Output

For a feature adding portfolio analytics:

**PR Title**: `feat(portfolio): add analytics dashboard`

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

**Slack Message**: Generated via the `slack-pr-message` skill.
