---
"ledger-live-mobile-e2e-tests": minor
---

Add the Borrow cold-start E2E test to the Ledger Wallet Mobile suite (B2CQA-6062): the portfolio
entry point opens the Borrow live app and shows the "Introducing Crypto Loan" modal. Broadcasts
nothing and runs on an isolated seed, so it needs no device and is safe to run in parallel.
Verified on Android and iOS. The portfolio entry point taps the card that was scrolled into view
rather than the CTA nested inside it — both share the same `onPress`, but only the card is
guaranteed on screen after the scroll.
