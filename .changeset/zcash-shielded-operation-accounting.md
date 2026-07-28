---
"@ledgerhq/coin-bitcoin": patch
---

Fix how a Zcash account holding shielded funds accounts for its own history. The account is described by two syncs that see different things — the transparent one reads an explorer, the shielded one scans compact blocks with the viewing key — and where they meet, five things were wrong:

- **A shielded-to-transparent send looked like an internal transfer of 0 ZEC.** Classification only looked at the shielded pools, where such a send nets out; the value that left had gone to a transparent output nobody was reading. It is now classified on what left the pools _and_ what reached the transparent bundle, using the transparent totals the native scanner reports.
- **An outgoing shielded operation reported an amount excluding the fee**, unlike every other outgoing operation and unlike the optimistic operation shown before confirmation — so the displayed amount changed once the transaction confirmed. The fee is now counted in the amount.
- **Spendable balance dropped to the transparent balance** each time a transparent sync landed, then recovered on the next shielded sync. The chain now states its balance once and it serves as both balance and spendable balance.
- **The shielded scan cursor could move backwards**, notably to zero when the scanner was already at the tip, triggering a full rescan on the next sync. The cursor now only ever advances.
- **The optimistic operation was never reconciled**, since a confirmed shielded operation carries a different identifier than the pending one it replaces, leaving the send listed twice. Pending operations are now matched by transaction hash.
