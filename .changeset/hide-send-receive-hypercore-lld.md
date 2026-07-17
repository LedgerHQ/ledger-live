---
"@ledgerhq/live-common": patch
"ledger-live-desktop": patch
---

Hide Send and Receive for HyperCore accounts on desktop: HyperCore has no on-chain send on Ledger Wallet and a plain receive is misleading (deposits go through bridging). Both actions are now hidden across the account page, the account context menu, the empty-account state and the token list, and the corresponding send/receive deeplinks are ignored for the family.
