# @shared/storage

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The storage port of persistence ([LIVE-35368](https://ledgerhq.atlassian.net/browse/LIVE-35368)).
Persistence reads and writes each record through this port. It does not import a storage engine.

- `StoragePort`: `get` and `set` of JSON values, 1 value for each key. Each storage engine has an
  adapter that implements this port.
- `createMemoryStorage(initial?)`: an adapter that keeps the values in memory, for tests. It
  copies each value through JSON, as a JSON store does.
- `@shared/storage/testing`: `describeStorageContract(name, createAdapter)`. Each adapter runs
  this contract test, so all adapters behave the same.
