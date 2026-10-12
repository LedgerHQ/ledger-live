---
"@ledgerhq/hw-app-canton": patch
"@ledgerhq/hw-app-exchange": patch
"@ledgerhq/hw-app-multiversx": patch
"@ledgerhq/coin-multiversx": patch
---

Bump `protobufjs` to 8.4.1 and `protobufjs-cli` to 2.4.1 (security), regenerate hw-app-exchange protobuf bindings. Absent protobuf string fields now decode as `undefined` instead of `""`.
