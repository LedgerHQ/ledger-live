---
"@ledgerhq/coin-zcash": minor
---

Fix an incorrect fee on shielded and shielding sends when the leftover change was small enough to
be folded into the fee instead of kept as a change note.

The native Ironwood (V6) builder requires the fee to equal the exact ZIP-317 fee for the resulting
spend/output layout; a fee larger than that by even a few zatoshis is rejected at build time. Coin
selection no longer absorbs a small residual into the fee for any flow that builds through that
builder ("shielded", "shielded-to-transparent", "transparent-to-shielded") -- the residual now
always stays as change.
