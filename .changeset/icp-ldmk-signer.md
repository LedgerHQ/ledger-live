---
"@ledgerhq/live-signer-icp": minor
"@ledgerhq/coin-internet_computer": minor
"@ledgerhq/live-common": minor
---

Add a DMK-based Internet Computer signer and use it as the sole device signer, replacing the legacy `@zondax/ledger-icp` transport.

The new `@ledgerhq/live-signer-icp` package provides `DmkSignerICP` (built on `@ledgerhq/device-signer-kit-icp`), and the `internet_computer` family now requires a DMK transport — mirroring the aleo and concordium signers. `@zondax/ledger-icp` is removed from Ledger Live.

The ICP signer contract also exposes the neuron-management signing surface: `signUpdateCall` (signs a governance update call together with its read-state request, returning both signatures and the read-state body) and a `stake` flag on `sign` for neuron-creation transfers.
