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
> Are changes covered by tests? yes | no | partial — If not fully covered, explain why.

$QA_FOCUS_AREAS
> What specific areas should QA focus on when testing this PR?

$HAS_UI_CHANGES
> Are there visual/UI changes? yes | no — If yes, you will need to edit the PR description to add screenshots.

**IMPORTANT**: Before any git commit, read and follow `.cursor/rules/git-workflow.mdc`. All commit messages MUST use the gitmoji shortcode format (`:gitmoji: type(scope): description`).

See [@docs/dev/create-pr.md](@docs/dev/create-pr.md) for the full workflow.
