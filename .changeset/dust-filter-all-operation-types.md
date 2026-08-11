---
"@ledgerhq/ledger-wallet-framework": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Fix dust filter so it hides every operation type below the threshold, not just IN/OUT. The dust predicate now uses the amount displayed in the operation row (IN/OUT/STAKE families, staking ops via fee), converted at the operation's own date so it matches the historical countervalue shown in the row (previously it compared against the latest rate, letting rows that display e.g. "$0.00" escape the filter). Day-grouping re-filters flattened internal and NFT child operations so sub-threshold children no longer leak into the list on mobile. The Asset Detail transactions/chart and the mobile operations pipeline now also request the USD→countervalue rate needed by the threshold, so filtering works on those screens for non-USD users.
