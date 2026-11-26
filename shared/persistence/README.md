# @shared/persistence

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Record definitions for persistence ([LIVE-35368](https://ledgerhq.atlassian.net/browse/LIVE-35368)).
A record is 1 key on the device. Its definition gives the stored shape of each version and the
mapping to the Redux state. This package has no I/O, and depends only on `zod`.

## Value record

`defineRecord` defines a record that holds 1 value, and gives a `RecordDefinition`:

```ts
const historyRecord = defineRecord({
  key: "history",
  versions: recordVersions(z => z.strictObject({ lastSeenOperationDate: z.string().nullable() })),
  codec: { encode: history => ({ ...history }), decode: stored => stored },
  state: { select: state => state.history, toHydrationAction: initHistory },
});
```

- `versions`: the stored shape of each version, and the steps between them.
- `codec`: `encode` gives the stored value of the latest version. `decode` gets a value of the
  latest version: the definition upgrades an older stored value first. A `decode` that throws
  gives a `RecordDecodeError`.
- `state`: `select` gives the reference that persistence compares to find a change.
  `toHydrationAction` puts the decoded value in the state, only at hydration.

A schema is a function of the `z` that it gets, so a record package does not depend on `zod`.

A stored schema checks a value and does not change it, so a decode of an encoded value gives the
same value. Do not use `transform` or `preprocess` in a stored schema. The typecheck refuses a
schema that decodes to a type that it does not accept, e.g. a `transform` from a string to a number.

## Versions

`recordVersions(v0Schema)` starts at v0. Each `.next(schema, step)` adds 1 version, with a pure
step from the previous version. `.next` returns new versions and does not change its receiver.

- v0 is the bare value, with no `$v`. v1 and later are stored as a strict `{ $v: n, data }`.
- The decode reads `$v` before any schema. A `$v` above the latest version throws
  `NewerRecordVersionError`. A `$v` that is not an integer from 1 throws `RecordDecodeError`.
- The steps run in order from the stored version to the latest. Then the latest schema checks the
  result. A step that throws gives a `RecordDecodeError`.
- The encode writes the bare value at v0, and `{ $v: latest, data }` after v0.

No error message contains a stored value or key: a schema mismatch gives the zod issue codes only,
with no path.

## Tests

`@shared/persistence/testing` gives `storedSchemaSnapshot(definition, version)`: the JSON schema
of the stored values that 1 version accepts. Each record has 1 snapshot test for each version,
so a change to a stored shape shows in review. [`recordVersions.test.ts`](./src/recordVersions.test.ts)
shows a record with 3 versions.

When and how to add a version: the
[record-versions-and-migrations](../../.agents/skills/record-versions-and-migrations/SKILL.md) skill.
