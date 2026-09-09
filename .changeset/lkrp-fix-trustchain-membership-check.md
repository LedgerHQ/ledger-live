---
"@ledgerhq/hw-ledger-key-ring-protocol": patch
---

Fix the trustchain membership check, which accepted any public key of the right length and therefore let a block issued by a non-member be replayed. Seed and Derive, which grant ownership to their issuer, now also require an existing owner when the stream is already created, and two unreachable conditions were removed from the key publication check.
