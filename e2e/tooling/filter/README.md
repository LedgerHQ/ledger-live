# e2e/tooling/filter

CI-time helpers (Node CLIs, run from the **repo root** by the E2E GitHub workflows)
that build and present the Playwright/Detox test filter. These are **not** imported by
the test runtime (specs, page objects, fixtures) — they run inside GitHub Actions only.

| File | Role |
|------|------|
| `escaping.mjs` | Single source of truth for the filter grammar: separator split (unescaped `\|` / `,`, odd-backslash aware), the Playwright leaf anchor `(?! [^@])`, and (un)escaping of regex-literal characters. |
| `resolve.mjs` | Resolves the workflow `test_filter` input into a Playwright/Detox grep string (expands `@generic-coin-framework`, applies `@smoke`, warns on zero matches). |
| `format-summary.mjs` | Renders a resolved filter as a readable Markdown bullet list for the "Workflow Context" job summary. |

## Usage

```bash
# Resolve a filter (used by the e2e workflows)
node e2e/tooling/filter/resolve.mjs --input "@bitcoin,@family-evm" --smoke-tests false --check-dir e2e/desktop/tests

# Format a resolved filter for the job summary
node e2e/tooling/filter/format-summary.mjs "$RESOLVED_FILTER"
```

## Keep in sync

`tools/actions/composites/get-failed-tests-summary/action.yml` re-implements the same
escape set and the `(?! [^@])` anchor in `jq`/bash to emit the rerun filter. Any change to
the grammar in `escaping.mjs` must be mirrored there (and vice versa).

