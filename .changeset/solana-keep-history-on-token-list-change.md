---
"@ledgerhq/ledger-wallet-framework": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

A Solana account no longer resyncs its whole history when the CAL token list changes. The sync resumes from its watermark unless the account holds a token that just became listed (or is no longer blacklisted), the only case where the stored history misses operations a sub-account needs.

A family opts in with the new `BridgeApi.balanceListsEveryToken` flag, which declares that `getBalance` lists every token the address holds without scanning its history. Solana is the only family that sets it.
