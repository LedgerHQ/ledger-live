---
name: slack-pr-message
description: Generate a formatted Slack message to share a pull request with the team. Use when the user asks to generate a Slack message for a PR, share a PR on Slack, or after creating a pull request.
---

# Slack PR Message

Generate a formatted Slack message to announce a pull request.

## Instructions

1. Determine the PR URL and short description from the current context (branch, PR title, or user input).
2. Determine the correct prefix based on impacted packages.
3. Output the formatted message.

## Format

```
:pr-open: {{PREFIX}} - {{SHORT_DESCRIPTION}}
{{PR_URL}}
```

## Prefix Rules

| Impacted packages | Prefix |
|---|---|
| `live-mobile` only | `LWM` |
| `ledger-live-desktop` only | `LWD` |
| `@ledgerhq/live-common` or shared libs under `libs/` | `Common` |
| CI, scripts, developer tooling, `support/` presets | `Tooling` |
| Both `live-mobile` and `ledger-live-desktop` | `LWM + LWD` |

When multiple non-app packages are impacted alongside an app, use the app prefix. Combine prefixes only when both apps are affected.

A package under `shared/`, `domain/`, `features/` or `devtools/` takes the prefix of the app(s) it reaches, not `Common`: `@features/flow-app-unlock` only ships on mobile, so a change to it is `LWM`. Derive the apps from the changed files with the Nx command in the [run-builds](../run-builds/SKILL.md) skill, then narrow by platform suffix (`*.web.tsx` → `LWD`, `*.native.tsx` → `LWM`).

## Example

```
:pr-open: LWM - Add portfolio analytics dashboard
https://github.com/LedgerHQ/ledger-live/pull/1234
```
