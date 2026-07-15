---
name: run-builds
description: Trigger the on-demand production build workflows on LedgerHQ/ledger-live-build (Desktop, Android APK, iOS) for a ledger-live branch, then post a PR comment. Use when asked to "run builds", "produce a build", "build the app(s)", or "make an APK/iOS/desktop build" for a PR/branch.
---

# Produce app builds on ledger-live-build CI

**When:** to produce installable artifacts (desktop installers, APK, iOS) of a `ledger-live` branch — for QA, manual testing, or sharing a build with reviewers.

**These workflows live in `LedgerHQ/ledger-live-build`, not `ledger-live`.** That changes how you dispatch them vs. `run-e2e-ci`:

- Target the build repo: `gh workflow run <wf> -R LedgerHQ/ledger-live-build`.
- The branch you want to build is passed as **inputs**, not `--ref`: `-f repo=LedgerHQ/ledger-live -f ref=<branch>`. The workflow checks out `inputs.ref` from `inputs.repo`. `--ref` (if given) would select the *ledger-live-build* ref and should be left at default (`main`).
- `gh` must run **outside the sandbox** (`dangerouslyDisableSandbox: true`).

## 1. Scope by context — only build what the diff impacts

Builds are slow and expensive (especially desktop = macOS + Linux + Windows). Study the PR diff / branch changes and dispatch only the relevant surfaces:

| Diff touches | Build |
|---|---|
| `apps/ledger-live-desktop/**` | Desktop |
| `apps/ledger-live-mobile/**` | Android + iOS |
| shared libs (`libs/**`, e.g. `ledger-live-common`, `coin-modules`) impacting both apps | Desktop + Android + iOS |

If the user explicitly names a platform ("make an APK", "iOS build"), honor that and skip the inference. When in doubt about a shared-lib change, ask which app(s) to build rather than building all three.

**Scope off the PR's file list, not `git diff develop...HEAD`.** A stale merge-base makes the local three-dot diff pull in hundreds of unrelated files. When a PR exists, use `gh pr view <pr> -R LedgerHQ/ledger-live --json files --jq '.files[].path'` for the true change set.

## 2. Workflows & inputs

| Workflow | File | Produces | Extra inputs |
|---|---|---|---|
| Desktop | `build-desktop.yml` | macOS, Linux, Windows bundles | `upload_datadog_sourcemaps` (bool, default false) |
| Android | `build-apk.yml` | `.apk` | — |
| iOS | `build-ios.yml` | iOS build | — |

All three share `repo` (default `LedgerHQ/ledger-live`) and `ref` (default `develop`).

## 3. Dispatch

```bash
# Branch to build: prefer the PR head (robust to detached HEAD on a PR SHA),
# fall back to the current branch only when there's no PR in context.
BR=$(gh pr view <pr> -R LedgerHQ/ledger-live --json headRefName --jq .headRefName 2>/dev/null \
     || git rev-parse --abbrev-ref HEAD)
R=LedgerHQ/ledger-live-build

gh workflow run build-desktop.yml -R "$R" -f repo=LedgerHQ/ledger-live -f ref="$BR"
gh workflow run build-apk.yml     -R "$R" -f repo=LedgerHQ/ledger-live -f ref="$BR"
gh workflow run build-ios.yml     -R "$R" -f repo=LedgerHQ/ledger-live -f ref="$BR"
```

Then grab the run IDs (dispatch is async; give it a few seconds). Filter per workflow since run-names don't echo the source branch:

```bash
gh run list -R "$R" --workflow build-desktop.yml --limit 3
gh run list -R "$R" --workflow build-apk.yml     --limit 3
gh run list -R "$R" --workflow build-ios.yml     --limit 3
```

## 4. Comment on the PR (if a PR is in context)

If the branch has an open `ledger-live` PR, post the dispatched runs on it. The PR lives in `ledger-live`, the runs in `ledger-live-build` — link accordingly. Use `--edit-last` to update an existing comment instead of stacking.

```bash
# First time: post a new comment.
gh pr comment <pr> -R LedgerHQ/ledger-live --body "..."
# On re-dispatch: update the same comment instead of stacking a new one.
gh pr comment <pr> -R LedgerHQ/ledger-live --edit-last --body "..."
```

```markdown
## 📦 Triggered builds

Dispatched on `ledger-live-build` for `<branch>` (commit <short-sha>):

| Platform | Run |
|---|---|
| Desktop (macOS / Linux / Windows) | [run <id>](https://github.com/LedgerHQ/ledger-live-build/actions/runs/<id>) |
| Android (APK) | [run <id>](https://github.com/LedgerHQ/ledger-live-build/actions/runs/<id>) |
| iOS | [run <id>](https://github.com/LedgerHQ/ledger-live-build/actions/runs/<id>) |

Artifacts will be attached to each run on completion.
```

Only include rows for the platforms you actually dispatched. If there's no PR in context, just report the run links back in chat.
