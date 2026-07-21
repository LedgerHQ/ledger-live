---
"@ledgerhq/live-e2e-shared": patch
"ledger-live-mobile-e2e-tests": patch
---

Fix `floatNumberRegex` quantifier bug that rejected well-formed single-digit values (including "0"), which was masking the real cause of intermittent swap e2e timeouts. `clickSwapMax` now explicitly rejects a zero "to" amount instead of relying on the regex to do it.
