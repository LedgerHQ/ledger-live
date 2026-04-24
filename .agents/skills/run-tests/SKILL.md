---
name: run-tests
description: Run unit tests scoped to files changed in the current branch. Use when the user asks to run tests, validate changes, or before a PR.
---

# Run Tests

Run tests only on files touched in this branch:

```bash
git diff --name-only develop..HEAD
```

Map to scope:
- `apps/ledger-live-desktop/` → `pnpm desktop test:jest "path/to/file"`
- `apps/ledger-live-mobile/` → `pnpm mobile test:jest "path/to/file"`
- `libs/<name>/` → `pnpm --filter <package-name> test "path/to/file"`

Fix failures one at a time — never skip or comment out a test.

Report: `✅ X suites pass` or `❌ failure in ... → Fixed: [description]`
