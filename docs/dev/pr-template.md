# PR Template

## PR Body Template

Use the following template for all pull requests. Fill each placeholder using the rules below.

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

---

## Template Fill Rules

| Placeholder | Rule |
|---|---|
| `{{PR_TITLE}}` | `CHANGE_TYPE(SCOPE): short description` — e.g. `feat(mobile): add dark mode toggle` |
| `{{TEST_CHECKBOX}}` | `x` if TEST_COVERAGE is "yes", ` ` (space) if "no" or "partial" |
| `{{TEST_EXPLANATION}}` | Empty if fully covered; italicised explanation if partial/no: `_Explanation here_` |
| `{{QA_FOCUS_AREAS}}` | Bullet list of areas QA should focus on |
| `{{DESCRIPTION}}` | Problem statement paragraph + solution approach paragraph; include code samples for lib changes, before/after for bug fixes |
| `{{SCREENSHOTS_SECTION}}` | If UI changes: add the table below. If no UI changes: omit entirely. |
| `{{TICKET_LINK}}` | JIRA: `[LIVE-1234](url)` / GitHub: `#123` |

### Screenshots table (when UI changes are present)

```markdown
| Before | After |
| ------ | ----- |
| _Drag & drop screenshot here_ | _Drag & drop screenshot here_ |
```

After creating the PR, remind the user:
> Click **"..."** → **"Edit"** on the PR description in GitHub, then drag & drop your screenshots into the table cells.

---

## Example Output

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
