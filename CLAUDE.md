# Project Context

## "Ledger Wallet" (formerly "ledger-live") overview

- Ledger Wallet is a crypto wallet with desktop and mobile applications
- This monorepo (pnpm + turbo) provides frontend application code
- Backend code (REST APIs) is outside this repo

### Key Directories

- `apps/` – Frontend applications for mobile, desktop, etc.
- `domain/` NEW – Domain entities shared by apps (React, TypeScript)
- `features/` NEW – Features shared by apps (React, TypeScript)
- `shared/` NEW – Cross-cutting packages used by more than one feature or domain entity (React, TypeScript)
- `libs/` LEGACY — Shared libraries
- `tools/` — Build and deploy related tooling (GitHub actions, scripts)

## General Principles

- Prioritize cleanliness over cleverness
- Note ideas for regular incremental improvement
- Prefer community best-practice over legacy code

## Common Commands

- Use pnpm commands for build, dev, linting and testing.
- See [/docs/common-commands.md](/docs/common-commands.md)

## Validate Before Finishing

- Before finishing any agentic code changes, run static checks for the affected scope.
- See [/docs/dev/validate-before-finishing.md](/docs/dev/validate-before-finishing.md)
