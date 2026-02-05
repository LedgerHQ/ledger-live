# Cleanup

Run lint, format, and typecheck on modified files.

## Process

1. **Identify apps**: `git diff --name-only develop..HEAD`
   - `apps/ledger-live-desktop/` → desktop
   - `apps/ledger-live-mobile/` → mobile
   - `libs/` → both

2. **Run commands** (from repo root):
   ```bash
   pnpm <app> lint --quiet --fix
   pnpm <app> prettier
   pnpm <app> typecheck
   ```

3. **Commit fixes** (if any):
   ```bash
   git add -A && git commit -m "chore: fix lint and format issues"
   ```

## Summary Template

```markdown
## Cleanup Summary

- **Lint**: ✅ / ⚠️ Fixed (X files)
- **Format**: ✅ / ⚠️ Fixed (X files)
- **TypeScript**: ✅ / ❌ X errors
```
