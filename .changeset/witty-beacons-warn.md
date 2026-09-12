---
"@ledgerhq/coin-concordium": minor
"ledger-live-desktop": patch
"live-mobile": patch
---

Check a PLT recipient against the token's allow and deny lists before signing

A transfer the lists refuse is rejected on chain after the user has signed and paid the
fee, so `getTransactionStatus` now resolves the recipient's standing and reports it under
the recipient field. The token's own state is read first, and a token declaring neither
list never looks the recipient up. An undecodable state or a failed lookup blocks as
unverifiable rather than passing as allowed. Adds the English error strings.
