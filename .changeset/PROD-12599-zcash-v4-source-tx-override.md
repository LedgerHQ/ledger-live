---
"@ledgerhq/live-signer-zcash": patch
---

Fix Zcash sends failing before the device prompt when the coin being spent came from a V4-format transaction (PROD-12599).

Signing a transparent Zcash transaction whose input came from a V4 (Sapling-format) transaction failed immediately: no review screen appeared on the device, and Ledger Live showed "Something went wrong" with no detail. V4 is still valid on mainnet and still emitted by exchanges and older wallets, while Ledger Live itself emits V5 — so an account funded from within Ledger Live never hit this, which is why the failure looked intermittent. It is in fact deterministic, decided by which software created the funding transaction.

`serializedPreviousTransactionOverride` carries the source transaction's raw on-chain bytes so the device can compute the correct ZIP-244 txid for a V5 transaction, whose Orchard bundle the signer kit's serialization would otherwise strip. It was being set for every version. The kit chunks a V4 transaction expecting Ledger's internal serialization, whose header carries a consensus branch id absent from the on-chain bytes; given those bytes it read the input count four bytes late and threw while chunking that input. The override is now restricted to the versions that need it, and a V4 source transaction goes back through the serialization path that has always handled it, its Sapling fields travelling in `extraData` as before.

The decision is made per input, which is what a send spending several coins looks like from the outside: the V5 inputs are chunked and their trusted inputs obtained from the device first, then the transaction dies when the V4 input's turn comes. The device has already answered several times by then, yet no review screen is ever reached — so the failure looks like a device problem rather than a serialization one.

Untagged device action errors are also no longer flattened into a message-less `Error`, so a failure inside a device action task names itself in the logs instead of surfacing only as "Something went wrong".
