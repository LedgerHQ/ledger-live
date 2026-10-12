---
"@ledgerhq/hw-app-canton": minor
"@ledgerhq/hw-app-exchange": minor
"@ledgerhq/hw-app-multiversx": minor
"@ledgerhq/coin-multiversx": minor
---

Bump `protobufjs` to 8.4.1 and `protobufjs-cli` to 2.4.1 (security), regenerate hw-app-exchange protobuf bindings. Absent protobuf string fields now decode as `undefined` instead of `""`.
