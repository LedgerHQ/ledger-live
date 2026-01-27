# Pre-Review

Run automated checks before submitting for code review. Executes test-runner and code-reviewer agents in parallel.

## Instructions

### Step 1: Identify Changes

First, understand what was modified:

```bash
git status
git diff --name-only develop..HEAD
```

Identify the impacted apps/packages:
- `apps/ledger-live-mobile` → Mobile
- `apps/ledger-live-desktop` → Desktop
- `libs/*` → Libraries

### Step 2: Run Agents in Parallel

**Launch both agents simultaneously:**

1. **Test Runner Agent** (`test-runner`)
   - Run Jest tests for modified files
   - Fix any test failures
   - Ensure all tests pass

2. **Code Reviewer Agent** (`code-reviewer`)
   - Check MVVM compliance (if applicable)
   - Verify Lumen UI usage (src/mvvm/ only)
   - Review new dependencies
   - Check for Sonar issues
   - Security review

Wait for both agents to complete and report their findings.

### Step 3: Summary Report

Generate a final report:

```markdown
## Pre-Review Summary

### Test Results
- **Status**: ✅ Passed / ❌ Failed
- **Tests run**: X passed, Y failed

### Code Review
- **MVVM Compliance**: ✅ / ⚠️ / ❌
- **Lumen UI**: ✅ / ⚠️ / ❌ / N/A (not in src/mvvm/)
- **Dependencies**: ✅ / ⚠️ (list new deps)
- **Sonar**: ✅ / ⚠️ (list issues)
- **Security**: ✅ / ⚠️

### Ready for Review
- [ ] All tests passing
- [ ] Code review issues addressed
- [ ] TypeScript compiles

**Optional**: Run `/cleanup` if you need to fix lint/format issues.

**Next step**: Run `/create-pr` to create the pull request.
```

## Workflow

```
1. Analyze changes
     ↓
2. Launch agents (parallel)
   ├── test-runner
   └── code-reviewer
     ↓
3. Fix issues found
     ↓
4. Report summary
     ↓
5. Ready for /create-pr (or /cleanup first)
```

## Notes

- If tests fail, fix them before proceeding
- If code review finds issues, address critical ones before review
- Warnings can be documented and addressed in follow-up PRs
- Run `/cleanup` separately if you need lint/format/typecheck fixes
