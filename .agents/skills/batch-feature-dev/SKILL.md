---
name: batch-feature-dev
description: Handle batches of Jira tickets through shared analysis, per-ticket feature-dev, Lumen UI guardrails, changesets, and draft PRs. Use when the user provides multiple Jira tickets or asks to deliver tickets one by one with PRs.
---

# Batch Feature Dev

Deliver ticket batches as coordinated PRs while keeping each ticket scoped and reviewable.

## Load First

Read relevant skills before entering their phase:

- `feature-dev` per ticket or coupled group.
- `git-workflow` before branch, commit, rebase, or push work.
- `create-changeset` before changesets; `create-pr` for draft PRs.
- `ldls-native` or `ldls-web` before Lumen UI work.
- `mvvm-architecture` before app feature code.
- `run-tests` for validation.

## Workflow

1. Intake every Jira ticket link, description, attachment, mockup, and constraint. Fetch details with available Jira/Atlassian tools; ask if anything is inaccessible.
2. Before coding, produce a compact matrix: id/link, area, UI impact, tests/screenshots, dependencies, shared work, blockers. Ask consolidated questions for missing mockups, conflicts, unclear copy, APIs, analytics, navigation, flags, and edge cases.
3. Branch via `git-workflow`. Start unrelated tickets from updated `develop`; chain only for real dependencies, target the previous branch, and state it in the PR. For shared groundwork, prefer one small foundation PR plus dependent PRs.
4. For each ticket/group, run full `feature-dev`. Treat tickets and mockups as source of truth; ask on conflicts; use Lumen components; add only English source translations; keep shared utilities owned and justified.
5. Validate affected scope with lint, relevant tests, typecheck, and screenshots or manual visual checks for UI. Add a changeset with exact package names; use `create-pr` for draft PR and Slack message.
6. Handoff each PR with ticket, branch, target, URL, changeset, validation results, screenshots/status, risks, and follow-ups. After the batch, summarize dependency graph and review order.

## Stop When

Pause for missing ticket/mockup details, incompatible tickets, product/design decisions, meaningless validation, or changed chaining strategy.
