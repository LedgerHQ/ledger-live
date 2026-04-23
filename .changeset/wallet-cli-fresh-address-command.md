---
"@ledgerhq/wallet-cli": minor
---

Add `account fresh-address` command: resolves the fresh receive address from a V1 descriptor without requiring a device. For address-based chains (EVM, Solana) the address is extracted directly — no sync. For UTXO chains (Bitcoin) the bridge sync finds the next unused address.
