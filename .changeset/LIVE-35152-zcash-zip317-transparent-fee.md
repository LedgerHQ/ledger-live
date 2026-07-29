---
"@ledgerhq/coin-bitcoin": patch
---

Fix Zcash transparent sends being rejected from the mempool for "unpaid actions is higher than the limit" (LIVE-35152).

ZIP-317 charges per logical action — `max(inputs, outputs)`, floored at two actions, so 10 000 zats minimum — while the shared Bitcoin path prices transactions in sat/vByte. The account-wide rate was derived from the marginal fee spread over one input (5000 zats over ~148 vBytes ⇒ 34 sat/vB), which billed only 7684 zats on a one-input, two-output send: below the floor, and rejected by the node.

A single rate cannot express ZIP-317, since the floor stays flat while the byte count grows — a rate covering a one-input send would charge nearly double the fee owed on a two-input one. The rate is now chosen per transaction: `getAccountNetworkInfo` provides the rate that covers ZIP-317 for any layout (~53 sat/vB, set by the smallest transaction), and the Zcash chain adapter tightens it to the transaction's actual layout through the new `ChainAdapter.resolveFeePerByte` hook, falling back to the safe rate whenever the tighter one cannot be confirmed. Resulting fees land within ~2% above the ZIP-317 amount instead of under it.

Only the legacy transparent path is affected — the flows routed to the PCZT builder already compute their ZIP-317 fee directly.
