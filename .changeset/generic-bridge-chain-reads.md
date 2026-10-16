---
"@ledgerhq/live-common": minor
---

The generic bridge builds its address accounts from one shared assembly, which the legacy path feeds from the coin module, and its family hooks read the chain only through chain reads: the coin module plus the family's declared `legacyChainReads` on the legacy path, the portfolio layer when the currency enables it. Tezos and Sei readiness, Tron resources, Solana token account details, Cosmos and EVM redelegations, EVM pending refresh and broadcast checks, and the Hedera address lookup now read through them. Operations sharing a date take one order (newest first, then by id)
