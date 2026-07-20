---
"ledger-live-desktop-e2e-tests": minor
"ledger-live-mobile-e2e-tests": minor
"@ledgerhq/live-e2e-shared": minor
---

Add E2E coverage for the swap cross-account warning across DEX providers (1inch, Velora, Uniswap, OKX) on Desktop (Playwright) and Mobile (Detox): swapping a token to a different account of the destination currency must surface the "Cross-account swaps are not currently supported" message. Mobile now selects a specific destination account via `modularDrawer.selectAssetAndAccount` / the opt-in `selectSpecificToAccount` flag in `performSwapUntilQuoteSelectionStep` (previously the drawer always kept the first account), and relaunches a fresh app per provider for test isolation. `@ledgerhq/live-e2e-shared` exports `keepRunningProviders` for provider-health skipping.
