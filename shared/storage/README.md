# @shared/storage

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The storage port of persistence (ADR in Confluence, epic LIVE-35368).

- `StoragePort`: `get` and `set` on JSON-serializable values: what a record stored in 1 key
  needs. Each engine has its own adapter package (`@shared/storage-electron`,
  `@shared/storage-mmkv`, `@shared/storage-node-file`).
- `ListableStoragePort`: a `StoragePort` with `keys(prefix)` and `remove`: what a record stored
  as 1 key for each entry (mobile `accounts.active.<id>`) needs. There is no `writeMany`: MMKV
  cannot write several keys atomically, so persistence orders its writes instead.
- `StorageLockedError`: an adapter throws it when it reads an encrypted key while the storage is
  locked. The error has the key, never the value. Persistence gives the record the `locked`
  status.
- `createMemoryStorage`: a listable adapter in memory, for tests.
- `@shared/storage/testing`: `describeStorageContract(name, createAdapter)`,
  `describeListableStorageContract` and `describeLockedStorageContract`. Each adapter runs the
  contracts that apply to it, so all adapters behave the same.

Only persistence, the adapters and the app composition roots import this package or an adapter
(`@shared/storage-*`). The lint rule `storage/no-port-import` flags any other import; the apps run
it as a warning for now.
