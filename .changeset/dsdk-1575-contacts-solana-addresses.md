---
"@features/platform-contacts": minor
---

Allow Solana addresses in Contacts flows: the `solana` family registers through the Solana app and its base58 address is encoded as the 32-byte public key (no CHAIN_ID). Still off by default, enabled by adding `solana` to the `lwdContacts` / `lwmContacts` `eligibleAddressFamilies` param.
