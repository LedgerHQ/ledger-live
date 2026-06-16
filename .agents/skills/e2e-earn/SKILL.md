---
name: e2e-earn
description: Check, update, and RUN Earn E2E tests for Ledger Wallet Desktop (Playwright) and Mobile (Detox). Covers the Earn v2 dashboard, the native + redirect staking flows, and the delegate specs (owned by the Earn team). Use to run earn.v2 / delegate locally, adapt earn page objects/flows, and triage failures.
---

# Earn E2E Skill

You are both a **test runner** and a **maintenance guide** for the Earn E2E suites. When invoked as a command (`/e2e-earn`), default behaviour is to **run the relevant Earn tests locally and triage any failures** — but always confirm scope with the user first (see "Running the Earn E2E tests").

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

| Variable             | Required value / note                                                     |
| -------------------- | ------------------------------------------------------------------------- |
| `MOCK`               | `0` (Speculos mode)                                                       |
| `SEED`               | Non-empty. NEVER print or echo it. Read at runtime (e.g. from 1Password). |
| `COINAPPS`           | Path to a cloned, up-to-date `coin-apps` repo                             |
| `SPECULOS_IMAGE_TAG` | See "Speculos image" in Troubleshooting — pin to avoid `:latest` drift    |
| `SPECULOS_DEVICE`    | e.g. `nanoSP` (options: nanoS, nanoSP, nanoX, stax, flex, nanoGen5)       |

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
  - `e2e/desktop/tests/page/earn.base.page.ts` — abstract `EarnBasePage extends WebViewAppPage` (`webviewIdentifier = "earn"`, `goAndWaitForEarnToBeReady`, `verifyProviderURL`).
  - `e2e/desktop/tests/page/earn.v2.dashboard.page.ts` — `EarnV2Page` (dashboard states + deposit/withdrawal + provider selection).
  - `e2e/desktop/tests/page/modal/delegate.modal.ts` — native delegation modal.
- **Desktop utils / flags**: `e2e/desktop/tests/utils/featureFlagUtils.ts` (`EARN_V2_DESKTOP_FLAGS`, `FF_STAKE_PROGRAMS_MODAL`, `useLocalEarnManifest`), `e2e/desktop/tests/utils/earnLocalManifest.json`.
- **Mobile specs/builders**: `e2e/mobile/specs/earn/**` (e.g. `earnV2_iceColdStart_ETH_3.spec.ts`, `earnV2_position_withdrawal_USDT.spec.ts`, `earnInlineAddAccount.spec.ts`), builder `e2e/mobile/specs/earn/earnV2.ts` (includes `runInlineAddAccountTest`). The legacy Earn v1 builder (`earn.ts`) and its consumer specs (`correctEarnPage_*`, `startStakingFromEarnDashboard_*`) have been removed.
- **Mobile page objects**: `e2e/mobile/page/trade/earnV2Dashboard.page.ts`.

## Platform model

- **Desktop**:
  - Electron exposes multiple windows (main app + one or more webviews). The Earn app is a **webview**.
  - Resolve the Earn webview via `EarnBasePage.getWebView()` using `webviewIdentifier = "earn"` (title matching) — never fixed `electronApp.windows()[N]` indexes.
  - The Earn app signals readiness via a console log: `goAndWaitForEarnToBeReady()` waits for the `"Earn Live App Loaded"` info message, then for the `loading-skeleton` test id to be hidden. Prefer this over ad-hoc waits.
  - Native staking (the `delegate` modal) acts on the **main window**; the Earn dashboard/deposit flow acts on the **webview**.
- **Mobile**:
  - Webview operations use Detox web helpers; native operations use regular Detox matchers.
  - Mirror desktop test ids where the Earn web app shares them (e.g. `asset-earn-cta-<ticker>`, `eth-provider-card-<provider>`).

## Earn flow & feature-flag model (critical)

Earn behaviour is feature-flag driven. Get this wrong and the app routes to the legacy modal instead of the Earn dashboard (or vice versa).

- `EARN_V2_DESKTOP_FLAGS` enables the Earn v2 dashboard. When `useLocalEarnManifest` (`USE_LOCAL_EARN_MANIFEST=1`) is set, it also points `ptxEarnLiveApp` at the local `earn-local-manifest` (`earnLocalManifest.json`) and the spec applies `localManifestOverride`.
- `FF_STAKE_PROGRAMS_MODAL` (`stakePrograms`) controls native staking vs redirect-to-Earn per currency:
  - `params.list` — currencies that use **native** staking UI.
  - `params.redirects` — currencies that **redirect** into the Earn app (platform `earn`, with `queryParams`). For native ETH the redirect carries `cryptoAssetId: "ethereum"`, `intent: "deposit"`, and an `ethDepositCohort` (e.g. `"basic_sorting"`). Omitting `ethDepositCohort` yields a `missing_cohort_value` sentinel and the wrong screen.
- Per-test `featureFlags` (passed via `test.use`) override env/remote flags. This is how specs force a deterministic flow.

## Desktop patterns (current API)

- Keep assertion method prefixes consistent within a page object (`verify*`).
- In `EarnV2Page`, resolve the webview with `const webview = await this.getWebView()`; act on `webview.getByTestId(...)`. Do not pass `electronApp` unless a method needs non-webview windows/events.
- Keep test ids as class properties / id-builder functions in the page object (e.g. `asset-item-ticker-<ticker>`, `asset-earn-cta-<ticker>`, `eth-provider-card-<provider>`), never inline literals repeated across specs.
- Current dashboard-state helpers: `verifyIceColdStartPage()`, `verifyColdStartPage()`, `verifyHotStartPage()`, `verifyAssetReadyToEarn(ticker)`, `verifyRewardsSummaryBoxes()`.
- Deposit/withdrawal/provider helpers: `clickAssetEarnCta(ticker)`, `verifyDepositFlowVisible()` (URL `/deposit`), `verifyWithdrawalFlowVisible()` (URL `/redeem|intent=withdraw`), `selectEthProvider(providerId)` (clicks `eth-provider-card-<provider>`), `verifyProviderVisible()`, modular-selector helpers (`expectModularSelectorToBeVisible`, `selectAssetInModularSelector`, `addExistingAccountViaModularSelector`).
- Provider redirect URL assertions live in `EarnBasePage.verifyProviderURL(provider, account)` — extend that switch rather than asserting URLs inline.
- Native ETH "select validator" now flows through the Earn deposit screen (`delegate.spec.ts` uses `verifyDepositFlowVisible()` + `selectEthProvider(...)` for ETH), not the old `stake-provider-container-lido` modal. Don't reintroduce removed Lido-modal helpers.

## Mobile patterns (current API)

- Use the Page Object Model; native vs webview matchers as in "Platform model".
- Keep flows in builders (`earnV2.ts` / `earn.ts`) and page objects, not inline in specs.
- Custom flags can be injected globally via `E2E_FEATURE_FLAGS_JSON` (merged with defaults; per-test flags still win). Use this to force the Earn v2 / redirect behaviour on mobile.
- Use the `.skip.spec.ts` suffix to temporarily exclude a spec from CI (don't comment-out).

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

## Validation before finishing (for code changes)

Run validation for the impacted E2E package(s), not the whole monorepo:

- Desktop: `pnpm --filter ledger-live-desktop-e2e-tests typecheck`; run targeted `earn.v2` / `delegate` Playwright tests when the environment allows.
- Mobile: `pnpm --filter ledger-live-mobile-e2e-tests typecheck`; run targeted Detox earn specs when the environment allows.
- Pre-commit runs `oxfmt` (formatting) + `gitleaks`. If `oxfmt` flags a file, apply exactly its suggested change.

Reuse an existing watch terminal when available before starting a new watcher. If unrelated pre-existing failures appear, report them as pre-existing and keep scope focused on Earn changes.

## PR review comment workflow

For each comment:

1. Verify current code and usages (`rg` for symbol usage).
2. Classify: real change needed / duplicate / stale (already addressed).
3. Implement only real changes.
4. Prepare explicit PR replies for stale/duplicate/already-fixed comments.

## Quick checklist

- [ ] Scope confirmed with the user (earn.v2 / delegate / both; desktop and/or mobile).
- [ ] Env verified (`MOCK=0`, `SEED` set but never printed, `COINAPPS`, pinned `SPECULOS_IMAGE_TAG`, `SPECULOS_DEVICE`); Docker running + image pulled.
- [ ] Build freshness checked; rebuilt only when needed (and confirmed with the user).
- [ ] Webview resolved via `webviewIdentifier = "earn"`; readiness via `goAndWaitForEarnToBeReady`.
- [ ] No inline repeated test ids in specs when a page object exists; no dead selectors/helpers added.
- [ ] Feature flags correct for the intended flow (`list` vs `redirects`, `ethDepositCohort`).
- [ ] Failures classified (environment vs build vs test-flow) with a concrete fix.
- [ ] Typecheck + relevant test commands attempted/reported.
