---
"@ledgerhq/coin-vechain": patch
"@ledgerhq/live-common": patch
---

Report the real gas and the fee payer on VeChain operations

`listOperations` never set `tx.feesPayer`, and forced `tx.fees` to `0` on every native VET
operation — so a VET transfer came back with no fee and no payer, while `getBlock` reported both for
the same transaction.

The payer was already in hand: the Thor receipt that `getFees` fetches for each transfer carries
`gasPayer` (the VIP-191 delegated payer, falling back to the origin) alongside `paid`, and only
`paid` was read. It is now carried through to `tx.feesPayer` for VET and VTHO alike, at no extra
request.

The zeroed fee was a workaround for the framework's single-currency fee model, now addressed
upstream: VeChain declares VTHO as its fees currency — the same `feesCurrency` its legacy account
bridge already sets — so the real gas is reported on every operation.
