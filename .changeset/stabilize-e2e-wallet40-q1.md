---
"ledger-live-mobile-e2e-tests": patch
"live-mobile": patch
---

Stabilize mobile e2e with the Wallet 4.0 Q1 feature flags enabled: default `operationsList` to the wallet 4.0 state and make the portfolio transaction-history, assets and operation counter-value checks branch on `isWallet40`. Adds a `operationRow-counterValue-label` testID to the wallet 4.0 operations list item so the counter-value assertion can target it.
