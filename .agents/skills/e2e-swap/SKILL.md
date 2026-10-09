---
name: e2e-swap
description: Write or update Swap E2E tests for Ledger Live Desktop (Playwright) and Mobile (Detox). Use for swap spec updates, provider flows, multi-step approvals, page-object refactors, swap-history checks, KYC/validation banners, and review-driven cleanup.
---

# Swap E2E Skill

## Use this skill when

- Updating swap tests in `e2e/desktop` or `e2e/mobile`.
- Refactoring swap page objects or moving reusable flow logic out of specs.
- Fixing PR review comments about dead code, selector ownership, brittle amounts, or multi-step approval assertions.

## Current source of truth

- Desktop specs: `e2e/desktop/tests/specs/*swap*.spec.ts`
- Desktop swap shared utils:
  - `e2e/desktop/tests/utils/swapUtils.ts`
- Desktop page objects:
  - `e2e/desktop/tests/page/swap.page.ts`
  - `e2e/desktop/tests/page/drawer/swap.confirmation.drawer.ts`
- Mobile builders/specs:
  - `e2e/mobile/specs/swap/otherTestCases/swap.other.ts`
  - `e2e/mobile/specs/swap/**/*.spec.ts`
- Mobile page objects:
  - `e2e/mobile/page/liveApps/swapLiveApp.ts`
  - `e2e/mobile/page/trade/swap.page.ts`

## Platform model

- Desktop:
  - Electron can expose multiple windows (main app + one or more webviews).
  - Resolve swap webview via `WebViewAppPage.getWebView()` using `webviewIdentifier` title matching, not fixed `electronApp.windows()[N]` indexes.
  - `SwapPage` methods usually receive `electronApp`.
  - `SwapConfirmationDrawer` methods act on the main window.
- Mobile:
  - Webview operations use Detox web helpers.
  - Native operations use regular Detox matchers.

## Implementation rules

- Keep selectors centralized in page objects, not inline in specs.
- Keep test IDs as class properties in page objects (avoid repeated string literals in methods).
- Do not define reusable workflow methods in spec files. Put them in page objects (for atomic UI actions) or shared utils (for multi-step flows).
- Remove dead methods/fields quickly; do not keep unused helpers.
- Keep single-use constants local to the narrowest scope that uses them.
- Reuse existing provider helper `selectSpecificProvider(...)` before adding new variants.
- Prefer runtime UI assertions over cross-repo filesystem assertions.
- Prefer `if/else` in `@Step` methods over early `return` branches for readability and reporting consistency.
- When replacing all occurrences in strings, prefer `replaceAll()` over regex-based `replace()` where equivalent.
- Avoid unnecessary non-null assertions (`!`); prefer type-safe narrowing/guards.
- For fragile swap amounts, fetch minimum dynamically with:
  - `app.swap.getMinimumAmount(...)` (desktop)
  - `app.swapLiveApp.getMinimumAmount(...)` (mobile)

## Desktop patterns (current API)

- Keep assertion method prefixes consistent within a page object (`check*`).
- In `SwapPage`, prefer `const webview = await this.getWebView()` for swap webview context.
  Do not pass `electronApp` unless a method explicitly needs non-webview Electron windows/events.
- Current Changelly UI swap pattern:
  - `performSwapUntilQuoteSelectionStep(...)`
  - `app.swap.selectSpecificProvider(Provider.CHANGELLY, electronApp)`
  - `const amountToSend = await app.swap.getAmountToSend(electronApp)` (only when needed by follow-up assertions)
- Avoid reintroducing removed generic/dead helpers:
  - `checkBannerVisibility(...)` (removed)
  - `verifyContinueButtonVisible()` in desktop swap page (removed)
  - `selectProviderQuoteWithRetry(...)` in swap utils (removed)

### Swap partner payload check

`tests/utils/swapPayloadCheck.ts` checks the partner payload of every desktop swap without spec changes:

- `app.swap.clickExchangeButton(...)` starts a pass-through watch of the app `POST ${SWAP_API_BASE}/swap` call (traffic is never modified, one watch per page, stopped by the device steps, the reject step and the `page` fixture).
- `app.speculos.verifyAmountsAndAcceptSwap*` run `checkSwapPayload` (`@ledgerhq/hw-app-exchange`) on the latest 2xx `/swap` answer, with the partner key and format from `getSwapProvider`, comparing the nonce, payout and refund addresses and amount with the request.
- The result is attached as "Swap payload check" (with the number of `/swap` calls). An invalid payload fails the test with the issue codes and messages; if the device step itself failed, the codes are appended to its error after `↳ Invalid swap partner payload:`.
- DEX providers, unknown providers, non-2xx answers and flows without a `/swap` call are reported as skipped or not captured, never failed.
- `SWAP_API_BASE` lives in `tests/utils/swapApiBase.ts` and is also passed to the launched app. A local run without it uses staging for both.

## Mobile patterns (current API)

- Multi-step flow should assert progression, not only click:
  - `tapExecuteSwap()`
  - `tapExecuteSwapOnStepApproval()` (includes post-click wait to send summary)
- Do not reintroduce removed JS-click helper `tapSwapOnMultiStepApproval()`
  unless there is a proven regression and a documented reason.
- Swap history feedback link assertion should be page-object driven:
  - `app.swap.checkSwapHistoryFeedbackFormUrl(expectedUrl)`
  - Prefer platform-specific attributes for URL assertion (`value` on iOS, `label` on Android).
- Do not add unused icon selector fields (`networkFeesInfoIcon`, `rateInfoIcon`).

## Validation before finishing

Run validation for the impacted E2E package(s), not the whole monorepo:

- Desktop:
  - `pnpm --filter ledger-live-desktop-e2e-tests typecheck`
  - Run targeted Playwright tests for changed swap specs when environment allows.
- Mobile:
  - `pnpm --filter ledger-live-mobile-e2e-tests typecheck`
  - Run targeted Detox tests for changed swap specs when environment allows.

Validation workflow notes:

- Reuse an existing watch terminal when available before starting a new watcher.
- Prefer watch mode where scripts support it.

If unrelated pre-existing failures appear, explicitly report them as pre-existing and keep scope focused on swap changes.

## PR review comment workflow

For each comment:

1. Verify current code and usages (`rg` for symbol usage).
2. Classify:
   - real change needed,
   - duplicate comment,
   - stale/already addressed.
3. Implement only real changes.
4. Prepare explicit PR replies for stale/duplicate/already-fixed comments.

## Quick checklist

- [ ] No inline repeated test IDs in specs when page object exists.
- [ ] No dead selectors/helpers added.
- [ ] Multi-step mobile flow has a post-click state assertion.
- [ ] Amounts are not hardcoded where minimum is provider-dependent.
- [ ] Desktop assertions use correct window context.
- [ ] Typecheck and relevant test commands were attempted/reported.
