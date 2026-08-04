# Project Context

## Overview

"Ledger Wallet" (formerly "ledger-live") is a crypto wallet. This pnpm and Nx monorepo contains multiple frontend apps and over 150 library packages. See the root [README](./README.md) for an overview.

We are working towards consistency across all those packages but each workspace has it's own details. Read local README files relevant to where you are working.

## Where to add new code

When creating a new package, follow [docs/new-library.md](./docs/new-library.md) guidelines.

## Repo Commands

Prefer commands given in local README files. For example appls like [Ledger Wallet Desktop](./apps/ledger-live-desktop/README.md) and [Ledger Wallet Mobile](./apps/ledger-live-mobile/README.md) have very specific commands for setup, dev and build commands.

For general test, build and check recipes see [/docs/repo-commands.md](/docs/repo-commands.md), which also contains notes on Nx, filtering and aliases.

## External Work Links

When a task includes Jira or Confluence links, use Atlassian MCP to fetch and read the referenced ticket or page by default before summarizing, planning, or implementing.

When a task involves GitHub — pull requests, issues, CI checks, or releases — use the `gh` CLI by default.

## Validate Before Finishing

Always follow the [validate-before-finishing](/docs/validate-before-finishing.md) instructions before completing code changes.

## Keep the external services catalog up to date

- [/docs/services.md](/docs/services.md) lists every external service the apps contact (domain, how it's managed, scope/team).
- When you add, remove, or change a service — a new entry in `libs/env/src/env.ts`, a hardcoded endpoint, a coin/family config change, or a new SDK dependency that phones home — update the matching table in `docs/services.md`.

## Read READMEs for packages where you're working

See examples:

- **Entity packages** (`domain/entity/`): read `domain/entity/README.md`
- **API packages** (`domain/api/`): read `domain/api/README.md`
- **Shared packages** (`shared/**`): read `shared/README.md`
