# Cleanup

Run lint, format, and typecheck on modified files. Use this command when you need to fix code style issues before creating a PR.

> ⚠️ **Note**: These commands can take several minutes to complete on large workspaces.

## Instructions

### Step 1: Identify Impacted Apps

Determine which apps were modified based on the diff:

```bash
git diff --name-only develop..HEAD
```

- Files in `apps/ledger-live-desktop/` → run cleanup for **desktop**
- Files in `apps/ledger-live-mobile/` → run cleanup for **mobile**
- Files in `libs/` → run cleanup for **both** apps

### Step 2: Run Cleanup Commands

Run from the **repository root** for each impacted app:

```bash
pnpm <app> lint --quiet --fix
pnpm <app> prettier
pnpm <app> typecheck
```

Where `<app>` is `desktop` or `mobile` (determined from Step 1).

> ⚠️ Always use `--quiet` with lint to show only errors. Without it, warnings may cause the command to fail.

### Step 3: Check for Changes

After running cleanup:

```bash
git status
git diff --stat
```

### Step 4: Commit Changes (if any)

If files were modified:

**Option 1** — New commit:
```bash
git add -A && git commit -m "chore: fix lint and format issues"
```

**Option 2** — Amend previous commit:
```bash
git add -A && git commit --amend --no-edit
```

## Summary Report

```markdown
## Cleanup Summary

### Workspaces Processed
- [ ] ledger-live-desktop
- [ ] ledger-live-mobile
- [ ] libs/...

### Results
- **Lint**: ✅ Clean / ⚠️ Fixed (X files)
- **Format**: ✅ Clean / ⚠️ Fixed (X files)
- **TypeScript**: ✅ No errors / ❌ X errors

### Files Modified
> List of files changed by lint/format fixes (if any)
```

## Tips

- Run cleanup only on workspaces you modified to save time
- If typecheck fails, fix the errors before proceeding
- Prettier and lint fixes are safe to commit without review
- TypeScript errors require manual fixes
