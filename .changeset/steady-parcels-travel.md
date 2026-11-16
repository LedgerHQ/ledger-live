---
"@ledgerhq/coin-canton": major
---

Implement `craftTransaction`, `estimateFees` and `broadcast` in the CoinModuleApi. A crafted transaction is now a JSON envelope carrying the party and the payload the device signs, `combine` and `broadcast` take the envelope formats instead of a bare serialized transaction and a party appended to the signature, and `createFrameworkSigner` adapts the device signer to the generic framework.
