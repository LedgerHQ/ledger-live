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
| Platform-specific (Android manifest, iOS plist) | narrow Mobile `tests_type` (`Android Only` / `iOS Only`); skip the other surfaces |
| Desktop-only or Mobile-only change | run only that surface; skip the others + Coin Tester |
| Shared / cross-cutting (build tooling, TS upgrade, currency core) | full suite — **and add a one-line rationale** |

Filter tags: `@bitcoin`, `@family-evm`, `@solana`, `@generic-coin-framework`, `@smoke`, … See the [test-filter guide](../../../e2e/tooling/filter/test-filter-guide.md) for the grammar and the mobile (whole spec files by path/`@`-tag) vs desktop (test titles) matching difference.

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
gh workflow run test-coin-tester.yml --ref "$BR" -f chain="$CHAIN"   # or omit -f chain to auto-detect affected coins

gh run list --branch "$BR" --limit 6   # grab the run IDs
```

Mobile **requires** `tests_type` (`Android Only`|`iOS Only`|`iOS & Android`) and `speculos_device` (`nanoS`|`nanoSP`|`nanoX`|`stax`|`flex`|`nanoGen5`). Desktop defaults to Speculos nanoSP. Coin Tester auto-detects affected coins (or `-f chain="evm,solana"`).

**Verify the filter took effect:** open the run's Summary → **Resolved filtered pattern** and confirm it matched specs. A filter that matches 0 specs is wasted — on **Mobile** the test jobs are skipped, on **Desktop** the run **fails** ("No tests executed") — and `resolve.mjs` emits a "filter has no matches" warning. Fix the filter and re-dispatch.

## Post the run on the PR

Fill the **Scope** column with the actual filter used (never a hardcoded "full suite"), and add a **rationale** line stating what you scoped to and why the other surfaces were skipped. Post with `gh pr comment <pr> --body ...` (`--edit-last` to update):

```markdown
## 🧪 Triggered test workflows

Manually dispatched on `<branch>` (commit <short-sha>, `git rev-parse --short HEAD`), scoped to <scope>:

| Workflow | Scope | Run |
|---|---|---|
| [Desktop] E2E Only | `<@tag>` filter, Speculos nanoSP | [run <id>](https://github.com/LedgerHQ/ledger-live/actions/runs/<id>) |
| [Mobile] E2E Only | `<@tag>` filter, <tests_type>, nanoX | [run <id>](https://github.com/LedgerHQ/ledger-live/actions/runs/<id>) |
| [Coin] Test Coin modules | `chain=<...>` (or affected coins) | [run <id>](https://github.com/LedgerHQ/ledger-live/actions/runs/<id>) |

Scope rationale: <which surfaces changed, what you filtered to, and why the rest were skipped>.
```

Only write "full suite" when you deliberately ran everything, and keep the rationale line explaining why the change is cross-cutting enough to need it.

