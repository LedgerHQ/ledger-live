---
name: e2e-swap
description: Write or update Swap E2E tests for Ledger Live Desktop (Playwright) and Mobile (Detox). Use for swap spec updates, provider flows, multi-step approvals, page-object refactors, swap-history checks, KYC/validation banners, and review-driven cleanup.
---

# Swap E2E Skill

Writing rules: when editing desktop, follow [Desktop E2E](../../../e2e/desktop/AGENTS.md). When editing mobile, follow [Mobile E2E](../../../e2e/mobile/AGENTS.md).

## Use this skill when

- Updating swap tests in `e2e/desktop` or `e2e/mobile`.
- Refactoring swap page objects or moving reusable flow logic out of specs.
- Fixing PR review comments about dead code, selector ownership, brittle amounts, or multi-step approval assertions.

## Current source of truth

- Desktop specs: `e2e/desktop/tests/specs/*swap*.spec.ts`
- Desktop swap shared utils: `e2e/desktop/tests/utils/swapUtils.ts`
- Desktop page objects:
  - `e2e/desktop/tests/page/swap.page.ts` — swap webview.
  - `e2e/desktop/tests/page/drawer/swap.confirmation.drawer.ts` — main window.
- Mobile builders/specs:
  - `e2e/mobile/specs/swap/otherTestCases/swap.other.ts`
  - `e2e/mobile/specs/swap/**/*.spec.ts`
- Mobile page objects:
  - `e2e/mobile/page/liveApps/swapLiveApp.ts`
  - `e2e/mobile/page/trade/swap.page.ts`

## Swap rules

- Reuse `selectSpecificProvider(...)` before adding a new provider helper.
- Assert what the UI shows. Do not assert swap state by reading another repo on disk.
- Fragile amounts come from the provider minimum, not a hardcoded value:
  - `app.swap.getMinimumAmount(...)` (desktop)
  - `app.swapLiveApp.getMinimumAmount(...)` (mobile)

## Desktop API

Quote selection takes a `SwapProvider`. `SwapProvider.CHANGELLY` is disabled.

- `performSwapUntilQuoteSelectionStep({ app, swap, minAmount })`
- `app.swap.selectSpecificProvider(provider)`
- `await app.swap.getAmountToSend()` only when a later assertion needs the amount

`selectSpecificProvider` and `getAmountToSend` do not take `electronApp`.

Do not reintroduce removed helpers:

- `checkBannerVisibility(...)`
- `verifyContinueButtonVisible()` on the desktop swap page
- `selectProviderQuoteWithRetry(...)` in swap utils

## Mobile API

Quote selection uses the provider UI name:

- `performSwapUntilQuoteSelectionStep(...)`
- `app.swapLiveApp.selectSpecificProvider(provider.uiName)`
- `await app.swapLiveApp.getAmountToSend()` only when a later assertion needs the amount

A multi-step flow asserts progression, not only the click:

- `tapExecuteSwap(provider.uiName)`
- `tapExecuteSwapOnStepApproval()` waits for the approval button to become enabled and taps it; assert the post-click destination separately (for example, `app.walletApiSignatureDrawer.expectVisible()`).

Do not reintroduce `tapSwapOnMultiStepApproval()` unless a regression is proven and the reason is written down.

Swap history feedback is page-object driven: `app.swap.checkSwapHistoryFeedbackFormUrl(expectedUrl)`. Assert the URL with `value` on iOS and `label` on Android.

Do not add unused icon selector fields (`networkFeesInfoIcon`, `rateInfoIcon`).

## Quick checklist

 - [ ] Follow the conventions docs and typecheck each changed package (`pnpm --filter ledger-live-desktop-e2e-tests typecheck` and/or `pnpm --filter ledger-live-mobile-e2e-tests typecheck`).
- [ ] Multi-step mobile flow has a post-click state assertion.
- [ ] Amounts are not hardcoded where the minimum is provider-dependent.
- [ ] Removed helpers above were not reintroduced.
