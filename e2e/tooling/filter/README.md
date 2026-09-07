# e2e/tooling/filter

CI-time helpers (Node CLIs, run from the **repo root** by the E2E GitHub workflows)
that build and present the Playwright/Detox test filter. These are **not** imported by
the test runtime (specs, page objects, fixtures) — they run inside GitHub Actions only.

> Just want to filter a workflow run? See the user guide:
> [`test-filter-guide.md`](./test-filter-guide.md). This README covers the internals.

| File                 | Role                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `escaping.mjs`       | Single source of truth for the filter grammar: splits patterns on separators (`\|` / `,`) that are not backslash-escaped and is odd-backslash aware, defines the Playwright leaf anchor `(?! [^@])`, and unescapes regex-literal characters (`unescapeLiteral`) for display.                                                                               |
| `resolve.mjs`        | Resolves the workflow `test_filter` input into a Playwright/Detox grep string (expands `@generic-coin-framework`, applies `@smoke`, warns on zero matches). The zero-match check mirrors the target runner (`--runner detox\|playwright`): detox reuses `selectSpecs.filterTestFiles` (path + `@`-tag), playwright matches a regex over spec path/content. |
| `generatedTags.mjs`  | Vocabulary of tags the specs attach at **runtime** (`buildTags`): currency ids + families (from `domain/entity/currency-crypto/src/currencies/*.ts`) and the device tags (from `e2e/desktop/tests/utils/tagsUtils.ts`). Lets the playwright zero-match check downgrade "matched 0 specs" to a notice for a valid-but-unobservable tag, while a real typo still warns. |
| `selectSpecs.mjs`    | Selects which Detox spec files a mobile E2E run executes for a filter — matches a spec by its path or a declared `@` tag (never raw file text). Consumed by `e2e/mobile/scripts/shard-tests.mjs`.                                                                                                                                                          |
| `format-summary.mjs` | Renders a resolved filter as a readable Markdown bullet list for the "Workflow Context" job summary.                                                                                                                                                                                                                                                       |

## Zero-match check

`resolve.mjs` warns when a filter selects nothing, but the two runners are not equally
knowable ahead of the run:

- **detox** — the check *is* the runner's own selection logic (`selectSpecs.filterTestFiles`),
  so a 0-match is a real empty run and always warns.
- **playwright** — the check only approximates `--grep` with a regex over spec path/content, so
  it cannot see tags that `buildTags({ currencyId })` derives at collection time (`@cardano`,
  `@family-cardano`, the device tags). For those, `resolve.mjs` emits a `::notice` ("not
  statically verifiable") instead of a misleading `::warning`. A tag that is *not* in the
  vocabulary (a typo such as `@cardanoo`) still warns.

## Usage

```bash
# Resolve a filter (used by the e2e workflows)
node e2e/tooling/filter/resolve.mjs --input "@bitcoin,@family-evm" --smoke-tests false --check-dir e2e/desktop/tests --runner playwright
node e2e/tooling/filter/resolve.mjs --input "@bitcoin,@family-evm" --smoke-tests false --check-dir e2e/mobile/specs --runner detox

# Format a resolved filter for the job summary
node e2e/tooling/filter/format-summary.mjs "$RESOLVED_FILTER"
```

## Keep in sync

`tools/actions/composites/get-failed-tests-summary/action.yml` re-implements the same
escape set and the `(?! [^@])` anchor in `jq`/bash to emit the rerun filter. Any change to
the grammar in `escaping.mjs` must be mirrored there (and vice versa).

That escaping applies to the **playwright** pattern only (`--grep` is a regex). The **detox**
pattern is emitted as raw spec basenames, because `selectSpecs.mjs` matches specs by literal
substring — regex-escaping a basename there would stop it from matching its own path.
