# libs/

Shared library packages — the home for new shared code today.

> **Note:** These are low-level shared libraries containing non-domain-specific code. They cannot import from the domain or feature layers. If you need to add shared business logic, put it in `features/platform` instead.

## Adding new code?

1. **A new dedicated `libs/*` package** — for new shared code (e.g. a self-contained library, a coin module under `libs/coin-modules/`).
   - New packages **must be private** (`"private": true` in `package.json`) to prepare for the upcoming domain transition.
2. **Never grow `libs/ledger-live-common`** — it is in maintenance mode. Bugfixes and edits to existing code are fine; new features, folders or top-level modules are not.

The repo is moving toward a DDD layout (`domain/`, `features/`, `shared/`); it is not yet the default for new code.
