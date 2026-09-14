---
"@ledgerhq/coin-zcash": patch
---

Report both legs of a Zcash self-transfer in the account history

A send from the private balance to the account's own transparent address — the send flow's "Self transfer" — appeared only as `Received`, never as `Sent`. One such transaction is recorded by both sync legs: the transparent leg credits the address it paid (`IN`), the shielded leg debits the pool it drained (`SHIELDED_TX_*_OUT`). `reconcileLegOperations` collapsed the two records by transaction hash alone, on the premise that a hash both legs see is one event seen twice, and kept the transparent one — dropping the send.

Two records of one transaction are now collapsed only when they report the same direction, which is the case the rule exists for: a shield paying someone else, where the transparent leg debits the UTXOs and the shielded leg sees, through the outgoing viewing key, the note it created. Opposite directions are the two legs of a movement between the account's own pools and both are kept, the way a self-send is reported elsewhere. A superseded record's memo is still copied onto the transparent operation that replaces it; a record that survives keeps its own memo, so it is not printed on both rows.

The same collapse hid the `Received` leg of the mirror flow, shielding to the account's own shielded address.
