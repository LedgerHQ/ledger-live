---
"@ledgerhq/live-signer-zcash": minor
"@ledgerhq/coin-bitcoin": minor
---

Route transparent Zcash signing through the DMK signer. `DmkSignerZcash` now implements `createPaymentTransaction`, mapping the Bitcoin signer's `CreateTransaction` onto `@ledgerhq/device-signer-kit-zcash`'s `signTransaction(LegacyCreateTransactionArg)` and returning the broadcast-ready signed-tx hex (the device's `0x` prefix is stripped). The Zcash chain adapter wires this method into its `createSigner` augmentation, so transparent transactions are signed via the Device Management Kit instead of `hw-app-btc`, leaving other UTXO chains and the broadcast path unchanged.
