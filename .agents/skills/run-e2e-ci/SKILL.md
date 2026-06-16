---
name: run-e2e-ci
description: Trigger the on-demand E2E / Coin Tester CI workflows (Desktop E2E, Mobile E2E, Coin Tester) on a branch and post a PR comment. Use when asked to "run e2e", "trigger e2e on CI", or "run coin testers" for a PR/branch.
---

# Run E2E / Coin Tester on CI

**When:** for changes that impact the e2e apps (desktop/mobile/coin logic), once the PR is getting ready for review. Desktop & Mobile E2E only run on a schedule + manual dispatch, so trigger them deliberately. Coin Tester already auto-runs on PRs for affected coins — only dispatch it to force a chain or re-run.

**First scope it down.** Study the PR diff and its impact, then run only the subset that's truly needed instead of the full suite: choose which surfaces to run at all (desktop / mobile / coin), narrow with `test_filter` tags (`@bitcoin`, `@family-evm`, `@solana`, `@generic-coin-framework`, …), set Coin Tester `chain`, and limit Mobile `tests_type`. Full suite is slow and expensive — reserve it for broad/cross-cutting changes.

These are `workflow_dispatch` workflows — **no slash-command triggers them**. Dispatch with `gh`, which must run **outside the sandbox** (`dangerouslyDisableSandbox: true`).

`gh workflow run --ref <branch>` is all you need: the workflows checkout `inputs.ref || github.sha`, so the optional "Specify branch" (`ref`) field can stay blank — it falls back to the commit `--ref` points to, which is the code actually pulled and tested. Run-names echo the branch, so use `gh run list` to confirm.

```bash
BR=<branch>   # PR head branch
gh workflow run test-ui-e2e-only-desktop.yml --ref "$BR"
gh workflow run test-mobile-e2e-reusable.yml --ref "$BR" -f tests_type="iOS & Android" -f speculos_device=nanoX
gh workflow run test-coin-tester.yml --ref "$BR"
gh run list --branch "$BR" --limit 6   # grab the 3 run IDs
```

Mobile **requires** `tests_type` (`Android Only`|`iOS Only`|`iOS & Android`) and `speculos_device` (`nanoS`|`nanoSP`|`nanoX`|`stax`|`flex`|`nanoGen5`). Desktop defaults to Speculos nanoSP. Coin Tester auto-detects affected coins (or `-f chain="evm,solana"`). Optional Desktop/Mobile filter: `-f test_filter="@bitcoin,@family-evm"`.

Then post the run on the PR (`gh pr comment <pr> --body ...`, use `--edit-last` to update):

```markdown
## 🧪 Triggered test workflows

Manually dispatched on `<branch>` (commit <short-sha>, `git rev-parse --short HEAD`), full suite:

| Workflow | Scope | Run |
|---|---|---|
| [Desktop] E2E Only | full suite, Speculos nanoSP | [run <id>](https://github.com/LedgerHQ/ledger-live/actions/runs/<id>) |
| [Mobile] E2E Only | full suite, iOS & Android, nanoX | [run <id>](https://github.com/LedgerHQ/ledger-live/actions/runs/<id>) |
| [Coin] Test Coin modules | affected coins (auto-detected) | [run <id>](https://github.com/LedgerHQ/ledger-live/actions/runs/<id>) |
```
