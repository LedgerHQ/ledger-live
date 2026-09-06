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
- `@team-<slug>` expands to the specs owned by that team — one more OR alternative, so
  `@team-swap,@team-earn` runs both teams' specs.

## Filter by team

Both workflows have a **`team`** dropdown next to `test_filter`. The two are different tools:

| Where | Meaning |
| ----- | ------- |
| the **`team` dropdown** | **AND** — narrows the run to that team, *combined with* `test_filter`, Smoke and the device. `team=swap` + `test_filter=@solana` runs the specs that are **both**. |
| **`@team-<slug>`** inside `test_filter` | **OR** — one more alternative, like any other token. Use it to run two teams at once. |

Teams: `bst`, `buy-and-sell`, `coin-integration`, `earn`, `engagement`, `swap`, `wallet-xp`
(the dropdown's `all` is the default and changes nothing). List them with their spec counts:

```bash
node e2e/tooling/filter/resolve.mjs --list-teams --check-dir e2e/mobile/specs --runner detox
```

Things worth knowing before you rely on it:

- **Selection is per spec _file_, never per test.** A spec two teams share runs in full for
  both — the filter over-selects rather than silently dropping a spec.
- **`bst` and `coin-integration` own about half the suite each**, because the owner of the
  shared send/addAccount/delegate flows is decided per currency. Pair them with a coin tag
  (`team=bst` + `test_filter=@bitcoin`) to get a run worth waiting for.
- **Smoke is a separate axis.** `team=swap` + **Smoke** selects nothing, because swap tags its
  smoke tests `@swapSmoke`, not `@smoke` — use `test_filter=@swapSmoke` instead. The run warns
  about this in the first minute rather than failing at the end.
- **An unknown team, an empty team ∩ filter, or a team that owns nothing on that app fails the run
  immediately**, with the valid list printed. It never falls back to running everything —
  `engagement` owns no desktop spec today, so picking it on Desktop is always an error.
- **`team` and `invert_filter` cannot be combined.** Inversion is applied to the whole pattern, so
  "only earn" would become "everything except earn". The run fails in the first minute instead.
- **A spec can have more than one owning team**, because ownership is recorded per test — the
  shared send/addAccount flows are split per currency between `bst` and `coin-integration`.

## Verify your filter did what you meant

1. Open the run's **Summary** → **Workflow Context** → **Resolved filtered pattern**.
2. If a pattern matches nothing, the run emits a warning annotation, e.g.
   `E2E filter has no matches` or `Missing E2E tag`. A filter that resolves to 0 specs
   is wasted — on **Mobile** the test jobs are skipped, on **Desktop** the run **fails**
   ("No tests executed"). Fix the pattern and re-dispatch.
3. With a **team** selected, an empty selection is a hard failure on both apps, raised by the
   resolve step before any build — look for `E2E selection is empty`.

## See also

- Filter grammar, escaping, and internals: [`README.md`](./README.md)

