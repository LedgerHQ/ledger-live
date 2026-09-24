---
"@ledgerhq/coin-concordium": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

fix(concordium): say which list refused a PLT sender

A blocked sender was told to contact the issuer for access, which is wrong for a
deny list. The send flow now reports the two causes separately.

Removes the unused `PltListStatus` type.
