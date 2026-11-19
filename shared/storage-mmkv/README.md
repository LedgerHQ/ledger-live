# @shared/storage-mmkv

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The `StoragePort` adapter of Ledger Wallet Mobile, for persistence
(`@features/platform-persistence`).

`createMmkvStorage({ id = "ledger-live" })` reads and writes MMKV with the same keys and values as the
legacy MMKV wrapper of the app: 1 MMKV key for each record, and the value as a JSON string. A value
that is not valid JSON rejects, so persistence marks the record `failed`. The adapter never logs a
value. It does not read AsyncStorage: the app turns a record on only for installs on MMKV.

The adapter is a `ListableStoragePort`: `keys(prefix)` filters `getAllKeys()`. `set` writes to
the engine before it resolves, because MMKV is synchronous.

`react-native-mmkv` is a peer dependency: the app keeps the native module.
