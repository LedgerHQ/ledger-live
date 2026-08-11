---
"@ledgerhq/coin-zcash": minor
"ledger-live-desktop": minor
---

Add `deriveShieldedAddress(ufvk)` to derive the Orchard unified address host-side from a UFVK without requiring a device connection. Persists `shieldedAddress` in `ZcashPrivateInfo` with backward-compatible serialisation (null fallback for legacy accounts).
