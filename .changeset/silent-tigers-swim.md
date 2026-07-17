---
"@ledgerhq/coin-aleo": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
---

Extract the Aleo private-send quick amount tier selection logic (Fast/Balanced/Full record boundaries) into `@ledgerhq/coin-aleo` and a shared `useAleoQuickAmountSelector` hook in `@ledgerhq/live-common`, and refactor the desktop QuickAmountSelector to consume it instead of duplicating the logic locally.
