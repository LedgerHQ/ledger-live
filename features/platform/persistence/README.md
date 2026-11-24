# @features/platform-persistence

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Persistence (ADR in Confluence, epic LIVE-35368). It moves records between the Redux state and
the storage: it hydrates the state at start and writes a record when its state changes. Records
come from `@shared/persistence`. The app gives the `StoragePort` adapter.

```ts
const persistence = createPersistence({ storage, bindings, report });
// persistence.middleware goes in the store, then:
await persistence.hydrate(store); // or with { keys }, after an unlock
await persistence.flush(); // quit, background, before a reboot
await persistence.stop(); // hard reset; resume() if the reset fails
```

## Bindings

Each app composition root (`apps/*/src/persistence/`) gives a list of bindings
`{ record, keyScheme?, strategy? }`. The record says what to store; the binding says how this app
stores it. 2 apps can share a record and keep different key schemes.

- No `keyScheme`: the record is 1 storage key, the record key.
- `keyPerEntry({ prefix, orderKey })`, for a collection record: 1 key for each entry, and 1 key
  with the order of the ids. It needs a `ListableStoragePort`.
  - Keys missing from the order load first. An unreadable order key falls back to the key order.
  - A write goes in this order: the changed entries, the removal of the stale keys, the order key.
    MMKV cannot write several keys atomically, so this order is the safety.
  - The logical key (`record.key`) is never read or written.
- `strategy`: `"immediate"` (the default), `{ debounceMs }` or `{ throttleMs }`: the lodash
  `debounce` and `throttle` that the legacy save code uses.

## Hydration

`hydrate()` reads each record alone, so 1 bad record does not stop the others. It returns the
status of each record, also in `state.persistence.records`.

- `pending` during the read. `empty` when nothing (or `null`) is stored: Redux keeps its default.
- `locked` on a `StorageLockedError`: not reported, never written.
- `failed` when the read, the decode or a reducer fails: reported (never with the value), never
  written. The stored value stays. A value from a newer app (a `$v` above the latest version) is
  `failed` too, with a `newer` report: Redux keeps its default for the session.
- `loaded` otherwise. In a collection, each entry reads and decodes alone, and an entry that fails
  is reported with its index. **Every stored entry that does not reach the state stays stored as
  it is**: a read or decode failure, or an entry that `toHydrationActions` drops (an account of an
  unsupported currency). Each write keeps it at its stored position, in the list with 1 key or in
  the order key with 1 key for each entry, and no write removes its key. When the state gets an
  entry with the same id, the state entry replaces it, except for an entry from a newer app: it is
  reported as `newer`, kept and hidden, and a state entry with its id never replaces or removes it.
  This is ADR rule 5: a failed read never becomes a write.
- Each report has an `operation`: `read`, `decode`, `newer` (a value or an entry from a newer
  app) or `write`. `describePersistenceFailure` gives 1 log line for it, with no value.
- `selectUsesPersistence(state, key)` is true once `hydrate` started for the record, whatever its
  status. The legacy save code of an app uses it to leave the record to persistence: see
  [legacy-coexistence.md](docs/legacy-coexistence.md).

## Writes

- On each action, persistence compares 1 reference for each record, `state.select`. The write runs
  later, with the latest state.
- It writes only `loaded` and `empty` records. The first state after the hydration is the
  baseline: persistence does not write back what it just read.
- A collection writes only when an entry changed (`state.changed`), was added or removed, or the
  order changed. The first write after the hydration also removes the old key of an entry that a
  migration gave a new id.
- 1 write at a time for each record. A write error goes to `report`. The next write, after the
  next change of the state, tries the same change again.
- `flush()` runs the scheduled writes now, and waits for the writes that start meanwhile (5 rounds
  at most). It rejects when 1 of them fails, and does not try it again; a scheduled write only
  reports.
- `stop()` cancels the scheduled writes, waits for the write in progress and blocks all writes.
  `resume()` unblocks them and writes what changed in the meantime.

The app composition root sends `report` to its logs and Datadog.
