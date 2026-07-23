# libs/

Shared library packages — the home for new shared code today.

## Adding new code?

Follow [docs/new-library.md](../docs/new-library.md) for the full checklist (private flag, README, TypeScript target…).

1. **A new dedicated `libs/*` package** — for new shared code (e.g. a self-contained library, a coin module under `libs/coin-modules/`).
2. **Never grow `libs/ledger-live-common`** — it is in maintenance mode. Bugfixes and edits to existing code are fine; new features, folders or top-level modules are not.
