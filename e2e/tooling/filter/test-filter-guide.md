# Using `test_filter` in the E2E workflows

How to run **only the E2E specs you care about** when you dispatch an E2E workflow,
instead of the whole suite. Applies to both apps:

- **Mobile** — `[Mobile] - E2E Only - Scheduled/Manual` (`test-mobile-e2e-reusable.yml`)
- **Desktop** — `test-ui-e2e-only-desktop.yml`

> ⚠️ Leaving `test_filter` **empty runs every spec on every selected platform**. That is
> slow, runner-heavy, and (with broadcast on) contends for shared on-chain accounts.
> Filter down to what you need, and use `tests_type` to pick a single platform when you can.

## The `test_filter` input

Free-text field on the workflow dispatch form. Separate multiple patterns with `,` or `|`
— a spec runs if it matches **any** of them (OR). Prefer simple tags (`@solana`) or a
path/filename substring:

```text
@smoke
@bitcoin,@family-evm
@generic-coin-framework,@solana
addAccount,deeplinks
```

> **Separators and escaping differ per runner — keep patterns simple.** `,` and `|` work
> on both runners. On **mobile**, whitespace *also* separates patterns (a space starts
> another OR alternative) and backslash-escaping is **not** applied. On **desktop**, the
> patterns become a `--grep` **regex**, so spaces and regex metacharacters are significant.
> Avoid spaces inside a single pattern, and don't rely on escaping separators.

### What a pattern matches

| App                 | Matching (via `--runner`)                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------- |
| **Mobile** (detox)  | Whole **spec files** by path substring or a declared `@`-tag. It does **not** match individual test titles or file content — a TMS id or a `describe`/`it` title selects nothing. |
| **Desktop** (playwright) | Test **titles** via `--grep` (a regex over the resolved patterns).                    |

### Special tokens

- `@generic-coin-framework` / `@generic-family` expands to all **enabled** generic-coin-framework
  families (from `genericCoinFrameworkFamilies.json`).
- `@smoke` is added automatically when you enable the **Smoke tests** toggle.

## Verify your filter did what you meant

1. Open the run's **Summary** → **Workflow Context** → **Resolved filtered pattern**.
2. If a pattern matches nothing, the run emits a warning annotation, e.g.
   `E2E filter has no matches` or `Missing E2E tag`. A filter that resolves to 0 specs
   is wasted — on **Mobile** the test jobs are skipped, on **Desktop** the run **fails**
   ("No tests executed"). Fix the pattern and re-dispatch.

## See also

- Filter grammar, escaping, and internals: [`README.md`](./README.md)

