---
name: validate-changes
description: Run the checks a change must pass before it is pushed, in order - format with oxfmt, `nx affected` lint, typecheck and test, then `pnpm lint:arch` (CI's required module-boundaries job) - and fix each architecture lint code with its usual fix. Use before committing or pushing, when asked to validate, clean up or test the current changes, or when `lint:boundaries`, `lint:structure` or `lint:tool-config` fails.
---

# Validate Changes

Run every step from the repository root, in order, and fix what a step reports before the next one.
A step that fails is fixed in the code, never by skipping a test, disabling a rule or adding an
exception.

Compare against the point where the branch left `develop`, so the affected scope is the branch's
own work, uncommitted files included:

```bash
BASE=$(git merge-base origin/develop HEAD)
```

## 1. Format

Formatting is `oxfmt`, with the single repository config `support/fmt/oxfmt.config.mts`. Format
the changed files; the config already skips Markdown and the generated trees:

```bash
git diff --name-only --diff-filter=d "$BASE" | xargs -r pnpm exec oxfmt --no-error-on-unmatched-pattern
```

The pre-commit hook (`hk.pkl`) runs `oxfmt` on staged sources too, so a commit never lands
unformatted, but formatting first keeps the next steps' diffs clean.

## 2. Lint

```bash
pnpm nx affected -t lint --base="$BASE"
```

Apply the automatic fixes of one project with `pnpm nx run <project>:lint:fix`, then rerun `lint`.

## 3. Typecheck

```bash
pnpm nx affected -t typecheck --base="$BASE"
```

An import error from another workspace package usually means its build is stale: see the
`rebuild-to-fix-lib-import-errors` skill.

## 4. Test

```bash
pnpm nx affected -t test --base="$BASE" --exclude=ledger-live-desktop
```

The desktop `test` target also runs Playwright end-to-end tests. When the desktop app is affected,
run its unit tests only, scoped to the changed paths:

```bash
pnpm desktop test:jest "src/path/to/changed"
pnpm mobile test:jest "src/path/to/changed"   # the same scoping, for a quick mobile loop
```

Fix one failure at a time. Never skip, comment out or loosen a test to get green. Write or update
tests with the `testing` skill.

## 5. Architecture checks

When the change touches `shared/`, `domain/`, `features/`, `support/`, `devtools/` or any
`package.json`, run the checks of CI's required module-boundaries job:

```bash
pnpm lint:arch
```

It runs `lint:boundaries`, `lint:structure`, `lint:tool-config` and `lint:i18n-keys`, and stops at
the first failure. Rerun only the failing one while fixing:

| Check | Rerun | Fix guide |
| --- | --- | --- |
| `lint:boundaries` | `pnpm lint:boundaries` | [arch-lint-fixes.md](references/arch-lint-fixes.md#lintboundaries) |
| `lint:structure` | `pnpm nx run <project>:lint:structure` | [arch-lint-fixes.md](references/arch-lint-fixes.md#lintstructure) |
| `lint:tool-config` | `pnpm nx run <project>:lint:tool-config` | [arch-lint-fixes.md](references/arch-lint-fixes.md#linttool-config) |
| `lint:i18n-keys` | `pnpm lint:i18n-keys` | the `i18n-keys` skill |

Then run `pnpm lint:arch` once more, since it stopped at the first failing check.

## 6. Skills and docs

When the change touches `.agents/` or `docs/`, and the root `package.json` defines a
`skills:check` script, run it:

```bash
pnpm skills:check
```

Follow the `docs-update-or-create` skill for the content itself.

## Commit and report

Commit the fixes with the `git-conventions` skill. Report each step as passed, fixed (with what
changed) or failing (with the first error), for example:

```markdown
- Format: fixed (3 files)
- Lint: passed
- Typecheck: passed
- Test: passed (12 suites)
- lint:arch: fixed (`cross-package-reexport` in `@features/flow-contacts`)
```

See [repo-commands](../../../docs/repo-commands.md) for the general commands and Nx notes.
