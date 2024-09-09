---
"@ledgerhq/hw-app-eth": patch
---

Fix `destructTypeFromString` not splitting types correctly when they contained a number and weren't native types (Struct with numbers in the name)
