---
"@ledgerhq/coin-bitcoin": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Use the node's min relay fee as the minimum for manual Bitcoin-family fees in the send flow (BTC falls back to 1 sat/vB). A fee below it is now rejected in the form instead of at broadcast.
