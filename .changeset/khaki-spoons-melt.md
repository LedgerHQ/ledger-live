---
"@ledgerhq/concordium-core": minor
---

Remove unused exports left over after the `@ledgerhq/hw-app-concordium` removal: `chunkBuffer`, `pathToBuffer`, and `serializePath` (no consumer used them), and the `VerifyAddressResponse` type. The `bip32-path` dependency, only needed by `pathToBuffer`, is dropped.
