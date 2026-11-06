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
| a package under `shared/`, `domain/`, `features/`, `devtools/` | the app(s) that depend on it, see below |
| `support/**` only (development-only presets) | nothing |
| shared libs (`libs/**`, e.g. `ledger-live-common`, `coin-modules`) impacting both apps | Desktop + Android + iOS |

If the user explicitly names a platform ("make an APK", "iOS build"), honor that and skip the inference. When in doubt about a shared-lib change, ask which app(s) to build rather than building all three.

**Derive the app from a change in the layers with the Nx graph.** Pass the changed source files; a package depended on by one app only reaches that app (`@features/flow-app-unlock` → mobile, `@features/platform-app-update` → desktop):

```bash
FILES=$(gh pr view <pr> -R LedgerHQ/ledger-live --json files \
  --jq '[.files[].path | select(test("^(shared|domain|features|devtools)/") and (test("^devtools/.+/package\\.json$") or (endswith("package.json") | not)))] | join(",")')
pnpm nx show projects --affected --files="$FILES" --json \
  | jq -r '.[] | select(. == "ledger-live-desktop" or . == "live-mobile")'
```

`ledger-live-desktop` → Desktop, `live-mobile` → Android + iOS. Then narrow by platform suffix, which Nx does not see: a change only in `*.web.ts(x)` files ships on desktop, only in `*.native.ts(x)` on mobile. For `shared/`, `domain/`, and `features/` packages, a `package.json` change marks every dependent app as affected, so read what it changes before building all three. For `devtools/` packages, the `FILES` list above includes `devtools/*/package.json`, so Nx can still mark the right apps when only the manifest changes.

**`devtools/` packages:** Nx lists which projects are affected, but both `ledger-live-desktop` and `live-mobile` often stay in that list for many `devtools/*` edits because each app declares the workspace dependency. Treat Nx output as **candidate** apps only. Before you map candidates to Desktop or Android plus iOS builds, check **real app imports** under each app’s `src` tree (next paragraph). Ignore `apps/web-tools/**` here: this skill does not dispatch web-tools builds, so `@devtools/*` usage in web-tools must not force Desktop, Android, or iOS.

For each candidate, map the platform the way you already do in this section (`ledger-live-desktop` → Desktop, `live-mobile` → Android plus iOS). For **Desktop**, build only if `ledger-live-desktop` appears among the affected projects **and** at least one hit exists under `apps/ledger-live-desktop/src` **outside** `**/DevTools/**` from the import checks below. For **Mobile**, build only if `live-mobile` appears **and** at least one such hit exists under `apps/ledger-live-mobile/src` outside `**/DevTools/**`.

Collect the npm package `name` values to search:

1. Start with every `devtools/*` package you changed (read each `package.json` `name`).
2. **Transitive `@devtools/*` consumers:** another package may depend on the one you changed (for example `@devtools/bindings` depends on `@devtools/env`). Grow the set until it stops changing: for each name `P` in the set, run `pnpm nx graph --focus="$P" --print --open=false`, then take every `source` in `.graph.dependencies` where `target` is `P` and `source` matches `^@devtools/`; add any new name to the set and repeat.

Use each collected name `P` in two passes. **Package-name imports:** anchor the pattern so `@devtools/transport` does not match `@devtools/transport-panel`. Include **dynamic** imports the repo allows from outside the DevTools screen folder (`import()` / `lazy(() => import(...))` per `DEVTOOLS_HOST_FOLDER_RULE` in `tools/nx-plugins/enforce-boundaries/constraints.js`), not only `from` forms. Omit test-only trees from both passes: `*.test.*`, `*.spec.*`, `__tests__/`, and `__integrations__/` files never ship in a production bundle.

```bash
rg --no-ignore-vcs -l -e "from ['\"]${P}(['\"/]|$)" -e "import\s*\(\s*['\"]${P}['\"]" apps/ledger-live-desktop/src apps/ledger-live-mobile/src \
  --glob '!**/DevTools/**' \
  --glob '!**/*.test.*' \
  --glob '!**/*.spec.*' \
  --glob '!**/__tests__/**' \
  --glob '!**/__integrations__/**'
```

**Imports of `DevTools/` by path** (covers files that reach DevTools through a relative or aliased path, for example `../../DevTools/DeviceOnboarding/useDeviceOnboardingTool` from production code outside the DevTools screen tree). Prefer **static** `from` lines for the path pass; if you only see a dynamic `import('...DevTools/...')`, apply the same **screen-entry** filter below (drop paths that only load the screen entry module).

```bash
rg --no-ignore-vcs -n -e "from ['\"][^'\"]*DevTools/" -e "import\s*\(\s*['\"][^'\"]*DevTools/" apps/ledger-live-desktop/src apps/ledger-live-mobile/src \
  --glob '!**/DevTools/**' \
  --glob '!**/*.test.*' \
  --glob '!**/*.spec.*' \
  --glob '!**/__tests__/**' \
  --glob '!**/__integrations__/**' \
  | rg -v "from ['\"][^'\"]*/(DevToolsWindow|DevToolsScreen|devToolsWindow)['\"]|import\s*\(\s*['\"][^'\"]*/(DevToolsWindow|DevToolsScreen|devToolsWindow)['\"]"
```

A path hit points at an **app** module under `apps/*/src/**/DevTools/**` (the file the `from` or `import()` resolves to, following re-exports and barrel files). Count the line as a build driver when that module's dependency graph eventually imports **by package name** at least one workspace package in your collected `P` set (changed packages plus transitive `@devtools/*` dependents). Walk `import` / `export ... from` edges inside the app tree until you can tell; dynamic `import()` counts the same way once you see the string target. If no chain from that app file reaches any `P`, ignore the hit for skip-or-build decisions. If the hit only wires DevTools to a different subtree than your change and nothing in `P` appears on the chain, ignore it. If you cannot follow the graph confidently, treat the pass as inconclusive and keep the builds.

**Screen mount, not a consumer:** a hit whose import path ends at the developer tools **screen entry** (the module that mounts only that screen), for example paths ending in `DevToolsWindow`, `DevToolsScreen`, or `devToolsWindow`, is wiring the developer tools surface into the app shell. It does not mean non-DevTools product code depends on your package; treat it like navigation to the screen. The pipeline above drops those lines; when tools or naming change, apply the same idea to whatever module replaces that entry.

The literal package search can miss a workspace package that is only used through a path import or a barrel re-export; the `DevTools/` path search can miss a consumer that only imports by package name. If either pass is inconclusive or the change is risky, keep the builds.

**No hits for an app tree in either pass** means every way that app reaches the changed devtools surface is under the DevTools screen, so skip that app’s builds for this change **unless someone needs to test the developer tools screen**. **Any hit** means a non-screen path depends on the change, so keep the matching build (Desktop and/or Android plus iOS). If `rg` fails while reading a workspace ignore file, rerun with `--no-ignore-vcs` as in the commands above. You can cross-check what Nx considers affected with the same `pnpm nx show projects --affected --files="$FILES" --json` you used earlier; it does not replace the import pass.

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
