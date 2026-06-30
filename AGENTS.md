# Project Context

## Overview

"Ledger Wallet" (formerly "ledger-live") is a crypto wallet. This pnpm and Nx monorepo contains multiple frontend apps and over 150 library packages. See the root [README](./README.md) for an overview.

We are working towards consistency across all those packages but each workspace has it's own details. Read local README files relevant to where you are working.

## Where to add new code

New shared code goes in a new `libs/*` package; `libs/ledger-live-common` is maintenance-only (no new features/folders). See [libs/README.md](./libs/README.md).

## Repo Commands

Prefer commands given in local README files. For example appls like [Ledger Wallet Desktop](./apps/ledger-live-desktop/README.md) and [Ledger Wallet Mobile](./apps/ledger-live-mobile/README.md) have very specific commands for setup, dev and build commands.

For general test, build and check recipes see [/docs/repo-commands.md](/docs/repo-commands.md), which also contains notes on Nx, filtering and aliases.

## Validate Before Finishing

Always follow the [validate-before-finishing](/docs/validate-before-finishing.md) instructions before completing code changes.
