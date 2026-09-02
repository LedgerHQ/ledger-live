---
"@ledgerhq/coin-zcash": patch
---

Fix a transparent↔shielded transaction (shielding or de-shielding) being recorded twice in `account.operations` — once by the transparent leg's sync and once by the shielded leg's, for the same transaction hash. `reconcileLegOperations` now keeps only the transparent leg's record when both legs see the same hash.
