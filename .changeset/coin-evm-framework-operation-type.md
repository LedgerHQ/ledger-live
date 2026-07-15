---
"@ledgerhq/coin-evm": patch
---

Adapters and network explorers now return `Operation<MemoNotSupported>` from `@ledgerhq/coin-module-framework` instead of `Operation` from `@ledgerhq/types-live`, removing the restricted dependency from `adapters/`, `network/`, and `logic/`.
