---
"@ledgerhq/coin-tezos": patch
---

Fix "Unable to normalize sender public key" on tz1 first-tx delegation/send

normalizePublicKeyForAddress did not strip the leading curve-prefix byte from
the 33-byte ED25519 payload returned by the Ledger Tezos app, producing a b58
string without the `edpk` prefix that craftTransaction rejected before any APDU
was sent. The function is now curve-aware and explicitly handles the 33-byte
ED25519 format (introduced when `@taquito/ledger-signer` was removed in favor
of `hw-app-tezos`), the 32-byte raw ED25519 form, and SEC1 33/65-byte shapes
for tz2/tz3. Malformed tz1 inputs now return undefined rather than emitting
a bogus key. Regression tests cover the production payload captured from CI.
