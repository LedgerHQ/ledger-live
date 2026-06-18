---
"@ledgerhq/wallet-cli": patch
---

Fix Solana `send --memo` failing before the signing prompt. The wallet-cli bridge was projecting `--memo` as a top-level transaction field, but `@ledgerhq/coin-solana` only reads it from `tx.model.uiState.memo`. The memo never reached the command descriptor, no Memo program instruction was added to the message, and the resulting half-prepared transaction broke the USB/DMK transport. `--memo` is now projected into `tx.model.uiState.memo` for both native and SPL-token transfers.
