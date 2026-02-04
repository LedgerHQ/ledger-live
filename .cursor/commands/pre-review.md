# Pre-Review

Run automated checks before submitting for code review.

## Process

1. **Identify changes**: `git diff --name-only develop..HEAD`
2. **Launch agents in parallel**:
   - `test-runner` — Run tests, fix failures
   - `code-reviewer` — Check rules compliance (see `.cursor/rules/`)
3. **Fix issues** found by agents
4. **Report summary**

## Summary Template

```markdown
## Pre-Review Summary

### Tests
✅ / ❌ — X passed, Y failed

### Code Review
✅ / ⚠️ — Issues found (if any)

### Ready for Review
- [ ] Tests passing
- [ ] Critical issues addressed
```

**Next**: `/cleanup` if needed, then `/create-pr`
