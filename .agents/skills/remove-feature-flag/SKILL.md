---
name: remove-feature-flag
description: >-
  Remove a Ledger Wallet feature flag while preserving its resolved production
  behavior, then validate, create a draft PR, and watch CI to green. Invoke only
  through /remove-feature-flag; this command may stash local work, push a new
  branch, create or update Jira work, and publish a PR.
disable-model-invocation: true
---

# Remove Feature Flag

Run the complete removal workflow. Never write to Firebase.

## Invocation

```text
/remove-feature-flag <FEATURE_ID> [FLAG_VALUE_JSON] [TICKET_URL]
```

Optional modifiers:

- `proposal only` — analyze and propose without changing files
- `no pr` — implement and validate without publishing
- `no watch` — create the PR without waiting for CI

Only `FEATURE_ID` is required. Treat invoking this command as authorization for
the complete workflow unless a modifier limits it. Accept optional arguments in
any trailing order: recognize the JSON object, an `http(s)` ticket URL, and the
exact modifier phrases independently.

For `proposal only`, stop after read-only analysis. Do not create Jira work,
stash files, create a branch, commit, push, or publish a PR. Report the resolved
behavior, owner, affected scope, proposed edits, planned validation, and skipped
Jira/PR/CI actions.

## 1. Resolve the production behavior

Derive the Firebase key with the repository's canonical snake-case mapping.

1. Parse and use `FLAG_VALUE_JSON` when supplied. Validate it against the flag
   definition and consumers. If it is invalid, lacks a boolean `enabled`, or
   omits `params` that code consumes, ask for a corrected production value.
2. Otherwise run:
   ```bash
   node .agents/skills/remove-feature-flag/scripts/read-production-flag.mjs "$FEATURE_ID"
   ```
3. If the lookup is unavailable, missing, malformed, or unauthorized, ask the
   user for the production value. Never fall back to development.
4. If Firebase reports conditional values, or the JSON describes A/B variants,
   show them and ask which behavior to preserve. Do not choose a
   client-specific variant automatically.

Preserve the resolved production behavior whether `enabled` is `true` or
`false`, including the selected production `params`.

## 2. Protect local work and create the branch

Record the initial branch/ref and worktree state. If dirty, stash staged,
unstaged, and untracked files with a unique descriptive message; do not ask.

Fetch the latest remote base and always create a new branch:

```text
support/remove-<feature-id>-flag-<YYYYMMDD-HHmm>
```

Create it directly from the freshly fetched `origin/develop`. If the name
collides, append a numeric suffix. Never reuse an existing branch or PR.

## 3. Resolve Jira context

Identify the owning team from `flags/team-*` and `CODEOWNERS`; use the
`codeownership` skill when a team directory is involved.

When no ticket is supplied and Jira tools are available:

1. Search the owning team's backlog by feature id and Firebase key.
2. Reuse one clearly relevant removal ticket; ask if several match.
3. If none match, create an unassigned `Task` in project `LIVE` for the owning
   team.

If Jira is unavailable, continue without a ticket and add this to the PR
description: `No Jira linked: Jira access was unavailable during PR creation.`

## 4. Remove the flag

Search tracked source across the whole repository for the feature id and
Firebase key; ignore generated and build artifacts. Load and use all applicable
repository skills for the files involved.

- Delete the flag definition and barrel export.
- Remove legacy `types-live`, defaults, devtools, analytics, E2E, mocks, and
  test references when present.
- Inline only the selected production behavior; remove unreachable branches.
- Update focused tests and snapshots without weakening coverage.
- Keep the change isolated from unrelated cleanup.

Firebase remains read-only. Add a post-release PR note to delete the remote key
manually.

## 5. Validate and publish

Use `cleanup` and `run-tests` for the affected packages and files, including
`@shared/feature-flags` checks when its registry changes. Follow
`docs/validate-before-finishing.md`. When those skills do not map a `shared/`,
`features/`, `domain/`, or nested package, read its README and `package.json`
and run the equivalent scoped commands directly.

Unless `no pr` is set, invoke `create-pr` end-to-end as the single source of
truth for Git conventions, changesets, commits, push, draft PR content, browser
opening, and the generated (not posted) Slack message. Pass it the resolved
behavior, Firebase key, Jira result, validation evidence, affected flows, and
the manual Firebase cleanup note.

For `no pr`, follow `git-workflow`, create a local commit after validation, and
do not push. Preserve that commit on the removal branch before restoring the
initial workspace.

## 6. Watch CI

Skip this section for `no pr` or `no watch`.

1. Watch required checks on the draft PR. Accept `skipped` or `neutral` only for
   optional checks.
2. Use `fix-ci` for related failures, with at most three diagnose/fix/push
   cycles.
3. Re-run an apparently unrelated failure once. If it fails again, report it
   and stop without changing unrelated code.
4. When required draft checks pass, mark the PR Ready for review.
5. Continue watching checks triggered by that transition under the same rules.
6. Finish only when all required checks are green, or when a guardrail stops
   the workflow.

## 7. Restore the workspace

On success or early stop, preserve any removal work on its branch or a recovery
stash, then return to the initial branch/ref and restore the saved stash so the
workspace matches its starting state. Never discard work. If restoration
conflicts, stop and report the conflict without resolving unrelated user
changes.
