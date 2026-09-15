---
"@ledgerhq/coin-concordium": minor
"@ledgerhq/live-signer-concordium": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Craft and sign PLT transfers

`craftPltTransaction` builds a `TokenUpdate` payload from the CAL-resolved token id, the
CAL unit magnitude as the amount's exponent, and the energy persisted at estimation time,
and `signOperation` routes a transaction carrying a token sub-account to it. The signer
interface widens to `AnyTransaction`; its body already serialized both kinds. A PLT send
now reports the CCD fee on the parent account and the token amount on the sub-account,
matching the pair sync builds once the transfer is indexed. `updateTransaction` drops the
persisted energy alongside the fee, so a re-selected token cannot inherit the previous
token's energy limit. Adds the English error strings for the two signer failures this path
can surface.

Signing on a device needs the PLT-capable Concordium app; until it ships, an attempt
surfaces as a translated "update your Concordium app" error. PLT sub-accounts remain behind
the `enableTokens` config switch.
