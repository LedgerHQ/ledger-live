---
"@ledgerhq/coin-filecoin": minor
---

Fix Filecoin transaction broadcast failing for amounts >= 1000 FIL. The amount was serialized with `BigNumber.toString()`, which emits exponential notation ("1e+21") at 1e21 attoFIL (1000 FIL) and up, causing the broadcast backend to reject it with a 500. Serialize with `toFixed()` so the value is always a plain integer string.
