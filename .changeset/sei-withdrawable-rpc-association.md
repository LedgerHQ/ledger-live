---
"@ledgerhq/coin-evm": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

fix(sei): determine Sei EVM account association via on-chain RPC

`isSeiAccountUnassociated` now resolves whether a Sei EVM (0x) address is linked
on-chain to its Cosmos (sei1) address by querying the chain's address precompile
(`getSeiAddr`) instead of inferring it from the local operation history. The
function is now async and no longer takes an `operations` argument; the delegation
flow screens (desktop & mobile) resolve the warning asynchronously.
