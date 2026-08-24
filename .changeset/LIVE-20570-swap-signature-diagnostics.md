---
"@ledgerhq/live-common": patch
---

Enrich swap `CHECK_TRANSACTION_SIGNATURE` failures with privacy-safe diagnostics.

When the Exchange app rejects a partner signature with `SIGN_VERIFICATION_FAIL` (0x9d1a), the swap completion flow now re-verifies the Swap NG signature locally (secp256k1/secp256r1) and appends a stable, non-sensitive diagnostic code to the error message forwarded to `/swap/cancelled`. This distinguishes the suspected firmware R/S-to-DER edge case (leading-zero `r`/`s`) from actionable backend signing mistakes (missing JWS dot prefix, signing the raw protobuf bytes) and a genuine payload/signature mismatch. The device error stays authoritative and its title is unchanged; no payload, signature, key, address or hash is ever included in the diagnostic.
