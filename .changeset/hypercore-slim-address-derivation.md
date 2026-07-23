---
"@ledgerhq/live-common": patch
---

Give HyperCore its own lightweight setup/signer instead of reusing the EVM family's. HyperCore only derives an Ethereum-format address and never signs (no send flow), so its setup/signer now expose address derivation only (reusing the EVM getAddress resolver + the eth device signer's `getAddress`), keeping `ethers` and the transaction/message-signing code out of HyperCore's runtime graph.
