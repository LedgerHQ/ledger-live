---
"@ledgerhq/live-common": patch
---

Defer coin bridge loading in generic-alpaca via async import() instead of static imports to avoid eagerly pulling heavy SDKs (ethers/viem, stellar-sdk, solana web3.js, taquito) for all alpaca users
