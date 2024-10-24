---
"@ledgerhq/hw-app-eth": minor
---

Refactoring of transaction decoding and fix EIP-155 applied incorrectly for legacy transactions (type 0). The `v` can now be used as is, representing either the EIP-155 value or the parity (0/1) for transactions using EIP-2718. Ethers full library has now also been removes from dependencies to decrease install and bundle sizes.
