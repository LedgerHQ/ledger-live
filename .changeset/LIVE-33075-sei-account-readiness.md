---
"@ledgerhq/live-common": patch
---

Expose Sei EVM account readiness to live apps through the Wallet API.

A Sei account can only swap once its EVM (0x) address is associated on-chain with its Cosmos (sei1) address. The EVM bridge now implements `getAccountReadiness` for `sei_evm`, resolving the association through the address precompile (`getSeiAddr` on `0x0000000000000000000000000000000000001004`) — the same lookup the staking warning already uses, so a revert or RPC failure reads as unassociated. Unassociated accounts sync with `readiness: { ready: false, reason: "activationRequired" }`, which the Wallet API account converter already forwards. Other EVM chains have no activation concept, so the hook is not exposed for them and their readiness stays undefined (consumers treat undefined as ready).
