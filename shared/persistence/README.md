# @shared/persistence

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Record definitions for persistence (ADR in Confluence, epic LIVE-35368). This package has no I/O
and must not import a storage package. Persistence in `@features/platform-persistence` reads and
writes the records.

Each record has its versions and 2 groups, so a reader sees at once what touches the stored bytes
and what touches Redux:

- `versions`: the stored shape of each version, and the steps between them (see "Versions").
- `codec`: the latest version and back. `decode` gets a value of the latest version: the versions
  upgrade an older stored value first.
- `state`: the Redux access. `select` gives the reference that persistence compares to find a
  change. `toHydrationAction(s)` puts the decoded value in the state, only at hydration, never for
  a write.

The definition's `codec.decode` upgrades the stored value to the latest version first and throws
`RecordDecodeError`, or `NewerRecordVersionError` for a value of a newer app. Neither error ever
contains the value. A schema is a function of the `z` that it gets, so the apps do not depend on
zod. The definition's `version` is the latest version, and `storedSchemas` holds the stored schema
of each version.

## Versions

```ts
const prefsVersions = recordVersions(z => z.strictObject({ theme: z.string() }))
  // v1, desktop x, mobile y: stores the font size
  .next(
    z => z.strictObject({ theme: z.string(), fontSize: z.number() }),
    v0 => ({ ...v0, fontSize: 12 }),
  );
```

`recordVersions(v0Schema)` starts at v0, and each `.next(schema, step)` adds 1 version with a
pure step from the previous version. `.next` returns new versions and leaves its receiver as it
is. A step must return the type of its schema, or the typecheck fails.

- **`$v` marks the version.** v0 is the bare value, with no `$v`. v1 and later are stored as a
  strict `{ $v: n, data }`. A stored object with an own `$v` is always an envelope, so a v0 schema
  never accepts a top-level `$v`.
- **`$v` is checked before any schema.** A `$v` above the latest version throws
  `NewerRecordVersionError`, whatever the payload. A `$v` that is not an integer from 1 throws
  `RecordDecodeError`.
- **The steps run in order** from the stored version to the latest, then the latest schema checks
  the result. A step that throws gives a `RecordDecodeError` with the error name only.
- **`encode`** writes the bare value at v0, and `{ $v: latest, data }` after.
- **`payloadOf(stored)`** gives the payload of any version, newer included: `data` of an envelope,
  the value itself at v0.
- **No transforms** in a stored schema: a decode then an encode must give the same value.

When and how to add a version: the
[record-versions-and-migrations skill](../../.agents/skills/record-versions-and-migrations/SKILL.md).

## Value record

`defineRecord({ key, versions, codec: { encode, decode }, state: { select, toHydrationAction } })`
gives a `ValueRecordDefinition`, for a record stored as 1 value, such as `history`.

## Collection record

1 stored list of entries, such as the accounts. Each entry decodes alone, so a bad entry does not
stop the others. `defineCollectionRecord` gives a `CollectionRecordDefinition` from:

- `key`, and `versions`: the versions of 1 stored entry.
- `entryId(entry)`, and `storedEntryId(payload)`: the id in the payload of a stored entry, read
  without a decode, so that persistence keeps an entry that does not decode. It gets the payload
  of any version, newer included: the id stays at the same place in each version's payload.
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
- **Unreadable data stays stored.** Persistence writes only what is in the state. A collection
  entry that does not reach the state (it does not read or decode, or the app drops it) stays
  stored as it is (ADR rule 5).
- **Snapshot each version.** `@shared/persistence/testing` has
  `storedSchemaSnapshot(definition, version)`. Each record has a snapshot test of the stored
  schema of each version, so a change to a stored shape shows in review.
- **Add a version** with `.next` on the record's versions, never by editing a published schema.
  `features/platform/persistence/src/__tests__/versions.test.ts` shows a record that moves from v0
  to v1.

The app binds each record to its storage in its composition root. See
`@features/platform-persistence`.
