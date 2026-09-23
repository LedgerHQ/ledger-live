---
"@ledgerhq/ledger-wallet-framework": minor
"@ledgerhq/live-countervalues": minor
"@ledgerhq/live-common": minor
---

Portfolio graphs no longer end on a false drop, and the percentage beside them no longer reads as a loss while the market is up.

The balance series behind every portfolio graph is built from two sources: the stored balance history for all points but the last, and the account's live balance for the final one. The stored series is itself anchored to that balance, produced by rewinding it through the account's operations, but it was handed back on a timestamp check alone. A series left anchored to a balance the account no longer has therefore sat at a different level than the final point, and the graph fell off a cliff at its right edge, which the trend reported as an outgoing transfer that never happened. The stored series is now checked against the live balance and rebuilt when the two disagree.

Two further defects in the same reconstruction are fixed. Its loop was bounded by the number of operations rather than by the requested time window, so an account with few or no operations produced a series shorter than the graph, which was then padded with zeros and rendered as a spike out of nothing. And when extending a stored series it recomputed the slot that series already ended on, duplicating it on concatenation and shifting every older point by one interval.

On the counter-values side, the first tracking pair skipped the batching decision entirely and was always folded into a batch. Pairs sort by counter-currency then currency, so the pair that lost its own spot request was consistently bitcoin. The retry backoff for historical rates is also capped correctly now: the ceiling was expressed in milliseconds but consumed as seconds, so instead of a week a pair that hit a run of HTTP failures stopped refetching its history for what amounted to forever.
