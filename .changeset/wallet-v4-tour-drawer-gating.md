---
"@ledgerhq/live-common": patch
"ledger-live-desktop": minor
---

feat(desktop): [LWD] Wallet V4 Tour Drawer trigger gating

- Add `tour` / `shouldDisplayTour` to WalletFeaturesConfig (live-common)
- Gate tour: only open when lwdWallet40.tour enabled, hasSeenWalletV4Tour false, and user on Portfolio page
- Mount WalletV4TourDialog in Portfolio feature; auto-open only on Portfolio (pathname "/")
- Analytics: "Wallet V4 Tour Shown" and "Wallet V4 Tour Dismissed" with platform=LWD, source=portfolio
- Integration tests for flag, hasSeenTour, and portfolio gating
