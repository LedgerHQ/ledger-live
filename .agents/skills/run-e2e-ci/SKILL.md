---
name: run-e2e-ci
description: Trigger the on-demand E2E / Coin Tester CI workflows (Desktop E2E, Mobile E2E, Coin Tester) on a branch and post a PR comment. Use when asked to "run e2e", "trigger e2e on CI", or "run coin testers" for a PR/branch.
---

# Run E2E / Coin Tester on CI

**When:** for changes that impact the e2e apps (desktop/mobile/coin logic), once the PR is getting ready for review. Desktop & Mobile E2E only run on a schedule + manual dispatch, so trigger them deliberately. Coin Tester already auto-runs on PRs for affected coins — only dispatch it to force a chain or re-run.

## Scope it down first — filtered is the default, full suite is the exception

**Always run the smallest subset that covers the change.** The full suite is slow, expensive, and competes for shared on-chain accounts, so run it **only** for genuinely cross-cutting changes — and when you do, **say why** in the PR comment. Derive the scope from the diff:

| What the diff touches | How to scope |
|---|---|
| One coin module (`libs/coin-modules/coin-solana`) | `test_filter=@solana` + Coin Tester `chain=solana` |
| A coin family (`**/families/evm`) | `test_filter=@family-evm` (or `@generic-coin-framework`) |
| A specific spec / flow (`swap`, `subAccount`, `newSendFlow`) | `test_filter` with the tag or spec path |
| Everything one team owns | `team=<slug>` — **ANDs** with `test_filter`, Smoke and the device |
| Platform-specific (Android manifest, iOS plist) | narrow Mobile `tests_type` (`Android Only` / `iOS Only`); skip the other surfaces |
| Desktop-only or Mobile-only change | run only that surface; skip the others + Coin Tester |
| Shared / cross-cutting (build tooling, TS upgrade, currency core) | full suite — **and add a one-line rationale** |

Filter tags: `@bitcoin`, `@family-evm`, `@solana`, `@generic-coin-framework`, `@smoke`, … See the [test-filter guide](../../../e2e/tooling/filter/test-filter-guide.md) for the grammar and the mobile (whole spec files by path/`@`-tag) vs desktop (test titles) matching difference.

**`team` vs `test_filter`.** `test_filter` is an **OR** over its patterns; the `team` dropdown is an **AND** that narrows the run to one team's specs. Combine them: `team=bst` + `test_filter=@bitcoin` runs only the bitcoin specs BST owns. Slugs: `bst`, `buy-and-sell`, `coin-integration`, `earn`, `engagement`, `swap`, `wallet-xp` (`all` is the default and changes nothing). List them with their spec counts:

```bash
node e2e/tooling/filter/resolve.mjs --list-teams --check-dir e2e/desktop/tests --runner playwright
node e2e/tooling/filter/resolve.mjs --list-teams --check-dir e2e/mobile/specs  --runner detox
```

Selection is per spec **file**, so a spec two teams share runs for both. `bst` and `coin-integration` each own about half the suite — pair those with a coin tag or you have not narrowed much. Do **not** put `@team-<slug>` in `test_filter`: it is rejected, with a message pointing at the dropdown.

## Dispatch

These are `workflow_dispatch` workflows — **no slash-command triggers them**. Dispatch with `gh`, which must run **outside the sandbox** (`dangerouslyDisableSandbox: true`).

`gh workflow run --ref <branch>` is all you need: the workflows checkout `inputs.ref || github.sha`, so the optional "Specify branch" (`ref`) field can stay blank — it falls back to the commit `--ref` points to. Run-names echo the branch, so use `gh run list` to confirm.

```bash
BR=<branch>            # PR head branch
TAGS=<derived-filter>  # e.g. "@solana" — see the table above. Drop -f test_filter ONLY for a justified full suite.
CHAIN=<derived-chain>  # e.g. "solana" or "evm,solana" — derive from the diff; omit -f chain to auto-detect.

# Filtered runs (preferred). Narrow tests_type when the change is platform-specific.
gh workflow run test-ui-e2e-only-desktop.yml --ref "$BR" -f test_filter="$TAGS"
gh workflow run test-mobile-e2e-reusable.yml --ref "$BR" -f test_filter="$TAGS" -f tests_type="iOS & Android" -f speculos_device=nanoX

# Scope to one team (optional, ANDs with the filter above). Omit -f team for the default "all".
gh workflow run test-ui-e2e-only-desktop.yml --ref "$BR" -f team=swap -f test_filter="$TAGS"
gh workflow run test-mobile-e2e-reusable.yml --ref "$BR" -f team=swap -f test_filter="$TAGS" -f tests_type="iOS & Android" -f speculos_device=nanoX

gh workflow run test-coin-tester.yml --ref "$BR" -f chain="$CHAIN"   # or omit -f chain to auto-detect affected coins

gh run list --branch "$BR" --limit 6   # grab the run IDs
```

Mobile **requires** `tests_type` (`Android Only`|`iOS Only`|`iOS & Android`) and `speculos_device` (`nanoS`|`nanoSP`|`nanoX`|`stax`|`flex`|`nanoGen5`). Desktop defaults to Speculos nanoSP. Coin Tester auto-detects affected coins (or `-f chain="evm,solana"`).

`team` is optional on both and defaults to `all`. Some combinations are refused outright, failing the run in the first minute rather than running the wrong thing:

- **`invert_filter` with `team`, or with `smoke_tests`.** `--grep-invert` is applied to the whole pattern, so anything the resolver folds into it is inverted too: with a team you get every *other* team's specs, and with Smoke you get the whole suite *minus* the smoke tests. Invert only ever applies to `test_filter`, so use it alone.
- **`@team-<slug>` typed into `test_filter`.** Use the dropdown; the error says so.

`-f team=` only exists on branches that already carry the input — a branch cut before it landed will reject the flag.

**Verify the filter took effect:** open the run's Summary → **Workflow Context**. Desktop prints **Filtered pattern**; Mobile prints both **Filtered pattern** (your raw input) and **Resolved filtered pattern** (what the runner selects with). Both print a **Team** line.

A filter that matches 0 specs is wasted, and the failure mode depends on whether a team is set:

- **No team** — `resolve.mjs` warns "filter has no matches"; on **Mobile** the test jobs are then skipped and the run still reports success, on **Desktop** it **fails** ("No tests executed").
- **With a team** — an empty selection, an unknown team, or a team that owns nothing on that app is a **hard error in the first minute**, before any build. Look for `E2E selection is empty` or `Unknown E2E team`. A team that owns nothing on the app you dispatched is the easy way to hit this — check with `--list-teams` first.

Fix the filter and re-dispatch.

## Post the run on the PR

Fill the **Scope** column with the actual filter used (never a hardcoded "full suite"), and add a **rationale** line stating what you scoped to and why the other surfaces were skipped. Post with `gh pr comment <pr> --body ...` (`--edit-last` to update):

```markdown
## 🧪 Triggered test workflows

Manually dispatched on `<branch>` (commit <short-sha>, `git rev-parse --short HEAD`), scoped to <scope>:

| Workflow | Scope | Run |
|---|---|---|
| [Desktop] E2E Only | `<@tag>` filter + `team=<slug>`, Speculos nanoSP | [run <id>](https://github.com/LedgerHQ/ledger-live/actions/runs/<id>) |
| [Mobile] E2E Only | `<@tag>` filter + `team=<slug>`, <tests_type>, nanoX | [run <id>](https://github.com/LedgerHQ/ledger-live/actions/runs/<id>) |
| [Coin] Test Coin modules | `chain=<...>` (or affected coins) | [run <id>](https://github.com/LedgerHQ/ledger-live/actions/runs/<id>) |

Scope rationale: <which surfaces changed, what you filtered to, and why the rest were skipped>.
```

Only write "full suite" when you deliberately ran everything, and keep the rationale line explaining why the change is cross-cutting enough to need it.

