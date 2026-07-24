---
"@ledgerhq/coin-sui": patch
---

Fix `getValidators` to omit optional fields (`description`, `imageUrl`, `projectUrl`) when the underlying on-chain data is an empty string, instead of propagating empty strings to callers.
