# @shared/persistence

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Record definitions for persistence (ADR in Confluence, epic LIVE-35368). This package has no I/O
and must not import a storage package. Persistence in `@features/platform-persistence` reads and
writes the records.

Each record has 2 groups, so a reader sees at once what touches the stored bytes and what touches
Redux:

- `codec`: the stored value and back. `decode` gets a value that the schema accepted. A migration
  of an older shape goes here.
- `state`: the Redux access. `select` gives the reference that persistence compares to find a
  change. `toHydrationAction(s)` puts the decoded value in the state, only at hydration, never for
  a write.

The definition keeps the same 2 groups. Its `codec.decode` checks the stored value with the schema
first and throws `RecordDecodeError`, which never contains the value. `schema` is a function of the
`z` that it gets, so the apps do not depend on zod. `version` labels the reports and the schema
snapshot: persistence does not store it (see "Add a version").

## Value record

`defineRecord({ key, version, schema, codec: { encode, decode }, state: { select,
toHydrationAction } })` gives a `ValueRecordDefinition`, for a record stored as 1 value, such as
`history`.

## Collection record

1 stored list of entries, such as the accounts. Each entry decodes alone, so a bad entry does not
stop the others. `defineCollectionRecord` gives a `CollectionRecordDefinition` from:

- `key`, `version` and `entrySchema`, the stored shape of 1 entry.
- `entryId(entry)`, and `storedEntryId(stored)`: the id of a stored entry, read without a decode,
  so that persistence keeps an entry that does not decode.
- `codec`: the async `decode(stored)` and `encode(entry, state)`, and `decodedId(decoded)`. A
  migration can change the id of an entry, so the decoded id can differ from the stored id.
- `state`: `select(state)`, `changed(previous, next)` and `toHydrationActions(decoded)`. These
  actions can drop an entry (an account of an unsupported currency): that entry does not reach the
  state, so it stays stored (ADR rule 5).

`RecordDefinition` is either kind.

For Node tools with no Redux (`apps/cli`, the e2e seeds), `defineCollectionCodec` gives the checked
codec alone. `decodeEntries(codec, stored)` gives the decoded entries and the failures by index,
`encodeEntries(codec, entries, state)` encodes, and `appendEntries(storedEntryId, stored, added)`
adds new entries to a stored list and keeps the stored ones as they are.

## Rules for each record

- **v0 is the shape of today.** A record moves to persistence at v0, with the key and the shape
  that the legacy code writes. The golden tests compare persistence with a frozen copy of the
  legacy code, byte for byte. A stored version number of the legacy code (the account migrations)
  keeps its meaning: each app reads and writes it as before.
- **Strict schemas.** Use `z.strictObject` for the parts that the record owns. zod strips the
  unknown keys of a `z.object`, so an older app would erase a field that a newer app added. Keep
  `z.looseObject` only for a part that the record does not own (the account `data`).
- **Put the known maximum version in the schema** (`z.number().int().min(0).max(n)`). An entry
  from a newer app is then a decode error, as any other unreadable entry.
- **Unreadable data stays stored.** Persistence writes only what is in the state. A collection
  entry that does not reach the state (it does not read or decode, or the app drops it) stays
  stored as it is (ADR rule 5).
- **Snapshot the schema.** `@shared/persistence/testing` has `storedSchemaSnapshot(definition)`.
  Each record has a snapshot test of its schema, so a change to the stored shape shows in review.
- **Add a version.** v0 has no version in the stored value, so v1 adds a version envelope:
  1. The schema accepts the v1 envelope and the v0 shape (`z.union`).
  2. `codec.decode` migrates a v0 value in memory. `codec.encode` writes v1. The next change stores
     v1; persistence never writes back what it just read.
  3. Raise `version` and update the snapshot.
  4. Set the minimum app version of the release. An older app does not decode v1, reports it and
     never writes over it.

  `features/platform/persistence/src/__tests__/versions.test.ts` shows the 4 steps on 1 record.

The app binds each record to its storage in its composition root. See
`@features/platform-persistence`.
