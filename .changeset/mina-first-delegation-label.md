---
"@ledgerhq/coin-mina": patch
---

Report a first mina delegation as DELEGATE instead of REDELEGATE

A `delegate_change` transaction does not say whether the account already delegated, and the
synchronisation typed every one of them as REDELEGATE, so a first delegation showed up as
"Redelegated" in the history once confirmed. Delegation operations are now replayed
oldest-first to tell a first delegation from a validator switch, and the optimistic operation
follows the same rule so the label no longer flips after the first sync.

Retyping an operation also re-ids it, and the merge of an account synchronisation dedupes on the
id alone, so an already-synchronised account would have listed its first delegation twice. The
stored operations a synchronisation brings back under other ids are now dropped.
