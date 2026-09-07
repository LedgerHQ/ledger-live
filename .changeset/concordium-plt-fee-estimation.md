---
"@ledgerhq/coin-concordium": minor
---

Estimate PLT transfer fees through the wallet-proxy `tokenUpdate` cost endpoint

`getTransactionCost` is parameterized on transaction type instead of hardcoding
`simpleTransfer`. PLT preparation encodes the CBOR operations blob first, since
its byte length is a required cost parameter, then applies a 20% energy buffer
and persists the result. Signing reads that persisted pair rather than
re-estimating, so the fee shown in the wallet and the energy in the signed
header cannot disagree. Native CCD estimation is unchanged.
