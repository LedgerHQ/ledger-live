---
"@ledgerhq/native-ui": minor
"live-mobile": patch
---

Remove the `CryptoIcon` passthrough component from `@ledgerhq/native-ui/pre-ldls` and consume `@ledgerhq/crypto-icons/native` directly in ledger-live-mobile. `@ledgerhq/crypto-icons` is no longer a dependency of `@ledgerhq/native-ui`, and the `@ledgerhq/lumen-ui-rnative` / `@ledgerhq/lumen-design-core` peer dependencies it required are dropped as well.
