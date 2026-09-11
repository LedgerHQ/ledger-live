---
"@ledgerhq/coin-concordium": patch
---

Report Concordium fee errors under a key the send flow renders

`getTransactionStatus` filed fee errors under `errors.fee`, which no file in the
desktop `modals/Send/` tree reads, so an unpriced transfer greyed out Continue with
no message. They are now reported under `amount`, after the checks for the states
that leave a PLT fee unset, so the specific cause still wins.
