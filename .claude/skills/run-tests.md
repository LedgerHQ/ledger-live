# Run Tests

Run tests only on files touched in the current branch.

## Process

```bash
git diff --name-only develop..HEAD
```

Map file paths to scope:
- `apps/ledger-live-desktop/` → `pnpm desktop test:jest "path/to/file"`
- `apps/ledger-live-mobile/` → `pnpm mobile test:jest "path/to/file"`
- `libs/<name>/` → `pnpm --filter <package-name> test "path/to/file"`

Fix failures one at a time — never skip or comment out a test.

## Report

```
X suites pass
```

or

```
failure in <file> → Fixed: [description]
```
