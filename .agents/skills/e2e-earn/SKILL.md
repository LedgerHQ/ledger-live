---
name: e2e-earn
description: Check, update, and RUN Earn E2E tests for Ledger Wallet Desktop (Playwright) and Mobile (Detox). Covers the Earn v2 dashboard, the native + redirect staking flows, and the delegate specs (owned by the Earn team). Use to run earn.v2 / delegate locally, adapt earn page objects/flows, and triage failures.
---

# Earn E2E Skill

You are both a **test runner** and a **maintenance guide** for the Earn E2E suites. When invoked as a command (`/e2e-earn`), default behaviour is to **run the relevant Earn tests locally and triage any failures** — but always confirm scope with the user first (see "Running the Earn E2E tests").

Writing rules: when editing desktop, follow [Desktop E2E](../../../e2e/desktop/AGENTS.md). When editing mobile, follow [Mobile E2E](../../../e2e/mobile/AGENTS.md).

## Use this skill when

- Running the Earn E2E tests locally (`earn.v2`, `delegate`, or both) and triaging failures.
- Updating Earn specs/page objects in `e2e/desktop` or `e2e/mobile`.
- Refactoring Earn page objects or moving reusable flow logic out of specs.
- Adapting the Earn v2 dashboard flows (ice/cold/hot start, deposit, withdrawal, provider selection, native vs redirect staking).
- Fixing PR review comments about dead code, selector ownership, brittle amounts, webview/window context, or feature-flag drift.

## Running the Earn E2E tests

This is the primary command behaviour. Follow these steps in order.

### Step 1 — Confirm scope with the user

Do **not** assume. Ask which subset to run before doing anything heavy:

- **Desktop**:
  - `earn.v2` only — `pnpm e2e:desktop test:playwright earn.v2`
  - `delegate` only — `pnpm e2e:desktop test:playwright delegate`
  - both — run `earn.v2` then `delegate`
  - optionally narrow with a `--grep` (e.g. a single currency/provider): `pnpm e2e:desktop test:playwright earn.v2 --grep "Ethereum"`
- **Mobile** (heavier — requires a built app + simulator/emulator): ask whether to include it, and if so iOS (debug) or Android (release). Defer build/setup to `/e2e-mobile-onboard`.

The `earn.v2` / `delegate` argument is a **path substring filter** Playwright matches against spec file paths — `earn.v2` matches `tests/specs/earn.v2.spec.ts`, `delegate` matches `tests/specs/delegate.spec.ts`.

### Step 2 — Verify environment (Speculos mode, MOCK=0)

These must be set in the shell that runs the tests. If any are missing, point the user to `/e2e-desktop-onboard` (or `/e2e-mobile-onboard`) rather than guessing.

| Variable             | Required value / note                                                      |
| -------------------- | -------------------------------------------------------------------------- |
| `MOCK`               | `0` (Speculos mode)                                                        |
| `SEED`               | Non-empty. NEVER print or echo it. Read at runtime (e.g. from 1Password). |
| `COINAPPS`           | Path to a cloned, up-to-date `coin-apps` repo                              |
| `SPECULOS_IMAGE_TAG` | See "Speculos image" in Troubleshooting — pin to avoid `:latest` drift     |
| `SPECULOS_DEVICE`    | e.g. `nanoSP` (options: nanoS, nanoSP, nanoX, stax, flex, nanoGen5)        |

Docker Desktop must be running, and the Speculos image must be pulled.

### Step 3 — Ask whether to rebuild

The Playwright suite runs the **built** desktop app from `apps/ledger-live-desktop/.webpack/main.bundle.js`. A stale or partial build is the #1 cause of `domcontentloaded` timeouts (see Troubleshooting).

- Check the build's freshness: `ls -la apps/ledger-live-desktop/.webpack/main.bundle.js`.
- If it's stale (older than recent app changes), missing, or the user is unsure, **ask** before rebuilding — a rebuild is slow:
  ```bash
  pnpm desktop build:testing
  ```
- Only spec/page-object/util changes under `e2e/` do **not** require a rebuild. Any change to app code under `apps/ledger-live-desktop/src` does.

### Step 4 — Run

From the **repo root**. Example combined run (only after confirming scope + build):

```bash
# Desktop, both suites, fresh build
pnpm desktop build:testing && pnpm e2e:desktop test:playwright earn.v2 && pnpm e2e:desktop test:playwright delegate

# Desktop, earn only, no rebuild
pnpm e2e:desktop test:playwright earn.v2

# Desktop, delegate only
pnpm e2e:desktop test:playwright delegate

# Debugging (Playwright inspector + Ledger Wallet devtools)
PWDEBUG=1 DEV_TOOLS=1 pnpm e2e:desktop test:playwright earn.v2

# Allure report after a run
pnpm e2e:desktop allure
```

Mobile (from `e2e/mobile/`, after `/e2e-mobile-onboard` build): `pnpm test:android <earnSpecFile>` / `pnpm test:ios:debug <earnSpecFile>`.

### Step 5 — Triage failures

On any failure, classify using the Troubleshooting taxonomy below and tell the user the category (environment vs build vs test-flow mismatch) and the concrete fix. Read the run's `error-context.md` and per-test `logs.log` under `e2e/desktop/tests/artifacts/test-results/<test>/` for the real cause.

## Current source of truth

- **Desktop specs**: `e2e/desktop/tests/specs/earn.v2.spec.ts`, `e2e/desktop/tests/specs/delegate.spec.ts` (delegate is owned by the Earn team). The legacy Earn v1 suite (`earn.spec.ts`) has been removed.
- **Desktop page objects**:
  - `e2e/desktop/tests/page/earn.base.page.ts` — abstract `EarnBasePage extends WebViewAppPage` (`webviewIdentifier = "earn"`, `goAndWaitForEarnToBeReady`).
  - `e2e/desktop/tests/page/earn.v2.dashboard.page.ts` — `EarnV2Page` (dashboard states + deposit/withdrawal + provider selection). Assertion methods use `verify*`.
  - `e2e/desktop/tests/page/modal/delegate.modal.ts` — native delegation modal.
- **Desktop utils / flags**: `e2e/desktop/tests/utils/featureFlagUtils.ts` (`EARN_V2_DESKTOP_FLAGS`, `FF_STAKE_PROGRAMS_MODAL`, `useLocalEarnManifest`), `e2e/desktop/tests/utils/earnLocalManifest.json`.
- **Mobile specs/builders**: `e2e/mobile/specs/earn/**` (e.g. `earnV2_iceColdStart_ETH_3.spec.ts`, `earnV2_position_withdrawal_USDT.spec.ts`, `earnInlineAddAccount.spec.ts`), builder `e2e/mobile/specs/earn/earnV2.ts` (includes `runInlineAddAccountTest`). The legacy Earn v1 builder (`earn.ts`) and its consumer specs (`correctEarnPage_*`, `startStakingFromEarnDashboard_*`) have been removed.
- **Mobile page objects**: `e2e/mobile/page/trade/earnV2Dashboard.page.ts`.

## Earn surfaces

- **Desktop**: the Earn app is a webview with `webviewIdentifier = "earn"`. `goAndWaitForEarnToBeReady(earnFunction)` runs that navigation callback, waits for `earn-app-container`, then resolves the webview. It does not watch the console or `loading-skeleton`. Prefer that over an ad-hoc wait. Native staking (the `delegate` modal) acts on the main window. The dashboard and deposit flow act on the webview.
- **Mobile**: force Earn v2 or the redirect flow with `E2E_FEATURE_FLAGS_JSON`. Per-test flags still win.

## Earn flow and feature flags

Earn behaviour is feature-flag driven. Get this wrong and the app routes to the legacy modal instead of the Earn dashboard (or vice versa).

- `EARN_V2_DESKTOP_FLAGS` enables the Earn v2 dashboard. When `useLocalEarnManifest` (`USE_LOCAL_EARN_MANIFEST=1`) is set, it also points `ptxEarnLiveApp` at the local `earn-local-manifest` (`earnLocalManifest.json`) and the spec applies `localManifestOverride`.
- `FF_STAKE_PROGRAMS_MODAL` (`stakePrograms`) controls native staking vs redirect-to-Earn per currency:
  - `params.list` — currencies that use **native** staking UI.
  - `params.redirects` — currencies that **redirect** into the Earn app (platform `earn`, with `queryParams`). For native ETH the redirect carries `cryptoAssetId: "ethereum"`, `intent: "deposit"`, and an `ethDepositCohort` (e.g. `"basic_sorting"`). Omitting `ethDepositCohort` yields a `missing_cohort_value` sentinel and the wrong screen.
- Per-test `featureFlags` (passed via `test.use`) override env flags. That is how a spec forces one flow.

## Desktop API

- Dashboard state: `verifyIceColdStartPage()`, `verifyColdStartPage()`, `verifyHotStartPage()`, `verifyAssetReadyToEarn(ticker)`, `verifyRewardsSummaryBoxes()`.
- Deposit, withdrawal, and provider: `clickAssetEarnCta(ticker)`, `verifyDepositFlowVisible()` (URL `/deposit`, excluding `/v2/`), `verifyWithdrawalFlowVisible()` (URL `/redeem` or `intent=withdraw`), `selectEthProvider(providerId)` (clicks `eth-provider-card-<cardId>`), `selectAssetInModularSelector(app, currency)`, `addExistingAccountViaModularSelector(app)`.
- Native ETH "select validator" flows through the Earn deposit screen (`delegate.spec.ts` uses `verifyDepositFlowVisible()` + `selectEthProvider(...)` for ETH), not the old `stake-provider-container-lido` modal. Do not reintroduce removed Lido-modal helpers.

## Troubleshooting / failure taxonomy

Classify every failure as **environment**, **build**, or **test-flow mismatch**, then apply the fix.

1. **`page.waitForLoadState: Timeout ... domcontentloaded` (build)** — the app launched but the renderer never loaded. Almost always a **stale/partial `.webpack` build** (e.g. built under a restricted sandbox, or never rebuilt after app changes). Fix in the user's own terminal:
   ```bash
   rm -rf apps/ledger-live-desktop/.webpack && pnpm desktop build:testing
   ```
   Validate with one simple spec (`tests/specs/add.account.spec.ts --grep "Bitcoin"`). If it still hangs, launch the built app standalone to see it: `cd apps/ledger-live-desktop && npx electron .webpack/main.bundle.js --user-data-dir=/tmp/lld-debug` (blank/crash ⇒ bad build or native-module ABI mismatch ⇒ `pnpm build:lld:deps && pnpm desktop build:testing`).
2. **`Invariant Violation: SEED is not set` (environment)** — `process.env.SEED` is empty in the test process. Ensure the test runs in a shell where `SEED` is exported (e.g. an `e2e_env` function sourcing it from 1Password). Never print the value.
3. **`speculos.py: error: unrecognized arguments: -p` (environment)** — image/code mismatch. The harness sets `PLAYWRIGHT_RUN`, so `speculos-transport` passes `-p` to `speculos.py`; an **old cached `:latest` image** doesn't support it. Fix by pinning to the tag the code expects and pulling it:
   ```bash
   export SPECULOS_IMAGE_TAG=ghcr.io/ledgerhq/speculos:sha-e262a0c   # matches libs/speculos-transport default
   docker pull ghcr.io/ledgerhq/speculos:sha-e262a0c
   ```
   `:latest` is a _moving_ tag and is NOT pinning; if you stay on it you must `docker pull` to refresh, and setting the env var alone never changes the cached image. (See "Speculos image" note below.)
4. **`WARNING: ... platform (linux/amd64) does not match host (arm64)` (benign)** — the Speculos image is amd64-only and runs under emulation on Apple Silicon. Not a failure; ignore.
5. **`speculos already in use` / `address already in use` / port conflicts (environment)** — stale Speculos containers from interrupted runs. Clean up: `docker rm -f $(docker ps -a --filter name=speculos -q)`.
6. **`TypeError: Invalid Version: DS_Store` (environment)** — `.DS_Store` files in `coin-apps` break semver lookup: `find "$COINAPPS" -name ".DS_Store" -type f -delete`.
7. **App + Speculos connect, but a specific Earn element isn't found (test-flow mismatch, not setup)** — e.g. expecting the legacy stake modal when the flow now redirects to the Earn dashboard, or a provider card id changed. Check feature flags (`FF_STAKE_PROGRAMS_MODAL` list vs redirects, `ethDepositCohort`) and the current test ids in the Earn web app. Report it as a test/scenario issue, not an environment one.

**Speculos image note:** pin (`sha-...` / `v...`) for reproducible, comparable runs (this is what the bot/smoke CI jobs do); `:latest` tracks the current device/firmware matrix (what the broad e2e matrix uses) but drifts and must be re-pulled. A SHA hardcoded in your shell unblocks a run now but becomes a liability long-term as the code's expected image advances — prefer pinning per-run, or unset `SPECULOS_IMAGE_TAG` to follow the code's own default.

## Quick checklist

- [ ] Scope confirmed with the user (earn.v2 / delegate / both; desktop and/or mobile).
- [ ] Env verified (`MOCK=0`, `SEED` set but never printed, `COINAPPS`, pinned `SPECULOS_IMAGE_TAG`, `SPECULOS_DEVICE`); Docker running + image pulled.
- [ ] Build freshness checked; rebuilt only when needed (and confirmed with the user).
- [ ] Readiness goes through `goAndWaitForEarnToBeReady` (`webviewIdentifier = "earn"`).
- [ ] Feature flags match the intended flow (`list` vs `redirects`, `ethDepositCohort`).
- [ ] Failures classified (environment vs build vs test-flow) with a concrete fix.
- [ ] Follow the conventions docs and typecheck each changed package (`pnpm --filter ledger-live-desktop-e2e-tests typecheck` and/or `pnpm --filter ledger-live-mobile-e2e-tests typecheck`).
