---
"@ledgerhq/react-native-hw-transport-ble": minor
"@ledgerhq/hw-transport": patch
"@ledgerhq/errors": patch
---

Feat: new abort timeout on opening transport and APDU exchange

On `@ledgerhq/hw-transport`

- `exchange` adding an optional `abortTimeoutMs` arg to its definition
- `send` taking an optional `abortTimeoutMs` and passing it to `exchange`
- Some documentation and tracing

On `@ledgerhq/react-native-hw-transport-ble`

- `open`: enabling optional timeout when opening a transport instance
- `exchange`: enabling optional timeout on APDU exchange, calling `cancelPendingOperations` on timeout
- `cancelPendingOperations`: using a `currentTransactionIds` array of transactions id for each `write`, we can try to abort completely pending writes
- More documentation + tracing + simple unit tests
