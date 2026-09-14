---
"@ledgerhq/coin-vechain": patch
---

Report VTHO transfers and both sides of every transfer in `getBlock`

`getBlock` mapped only `output.transfers` from Thor's expanded block, which holds native VET clause
transfers. A VTHO (VIP-180) movement is an ABI-encoded log in `output.events` instead, so every
token transfer came back with an empty `operations` array even though `listOperations` reported it
for the same transaction — on recent mainnet blocks that silently dropped the majority of
transactions. VIP-180 `Transfer` logs emitted by the VTHO contract are now decoded from the same
expanded-block payload, so no extra request is made.

Each transfer also produced a single operation, for the recipient only. `BlockOperation.amount` is
the signed impact on `address`, so a transfer is now reported once per side — negative for the
sender, positive for the recipient — and an outgoing VET or VTHO transfer is no longer invisible to
a block-based consumer.
