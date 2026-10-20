---
"ledger-live-desktop-e2e-tests": minor
"ledger-live-mobile-e2e-tests": minor
"@ledgerhq/live-e2e-shared": minor
---

Send from each Bitcoin derivation's own account in the send E2E tests, so the legacy, segwit, native segwit and taproot tests no longer race for one account's UTXO. Desktop new send flow tests now fail as soon as the flow ends on an error or info screen instead of after the 41s expect timeout.
