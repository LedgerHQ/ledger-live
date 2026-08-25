---
"@ledgerhq/coin-zcash": minor
---

Send transparent funds without the account's UFVK. Every Zcash send required one, so a public t→t send failed at the device step with "Missing UFVK — account not yet synced" on any account that had not run the viewing-key export flow — which is a device confirmation, and which the send flow deliberately does not ask for (only the private transfer option is gated on it). Transparent funds were therefore unspendable until the user activated their private balance.

This needs `@ledgerhq/zcash-utils` 2.2.0, which the catalog now pins: earlier versions require the viewing key for every build, whatever the flow.

The shielded pools stay out of reach in exchange: a unified address carrying an Orchard receiver is now refused as a recipient when the account has no UFVK, reported on the address field instead of accepted and failed at the device step. A malformed or Sapling address keeps its own error, so the user is not sent to the export flow over a typo.

A transparent send carries no shielded bundle and reads no shielded key material: the only key it needs is the account-level transparent pubkey, which is the payload of the account xpub the account already holds. It is now read from there (`accountPubkeyFromXpub`, the counterpart of the existing `composeXpub`) and passed to the builder in place of the UFVK, whose absence no longer blocks the flow. An account that does have a UFVK keeps using it, so its code path is unchanged. Flows that spend or create shielded value still require the UFVK and now report it as a typed `ZcashShieldedKeyMissing` rather than a bare error.
