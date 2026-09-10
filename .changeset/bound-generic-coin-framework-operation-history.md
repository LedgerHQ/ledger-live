---
"@ledgerhq/live-common": minor
---

Add an optional bound on the synchronised operation history for `generic-coin-framework`
accounts (evm, hypercore, xrp, stellar, tezos, tron, casper). The bound is off by default —
existing accounts are unaffected — and, once set, is resolved per network through remote
config rather than hardcoded: the retained operations are always the most recent ones, kept
stable across repeated syncs.

Once a bound applies, it now also drives the module's paginated `listOperations` walk through a
`limit`, sized from a configurable per-page size (falling back to a safe default): without this,
the walk's first "page" was the entire history in one unbounded call, and the bound never had a
chance to stop it before memory ran out. With the bound left unset — the shipped default — no
`limit` is sent at all, so every family's behaviour is unchanged.
