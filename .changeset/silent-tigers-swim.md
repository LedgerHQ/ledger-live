---
"@ledgerhq/coin-aleo": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Add the Aleo private-send quick amount selector (Fast/Balanced/Full record tiers, spendable balance summary, and records-per-send info banner) to the mobile Amount screen, matching desktop. Extracts the shared tier-selection logic into `@ledgerhq/coin-aleo` so both platforms use the same Fast/Balanced/Full boundaries.
