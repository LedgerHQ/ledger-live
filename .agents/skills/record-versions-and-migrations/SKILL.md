---
name: record-versions-and-migrations
description: |
  Change the stored shape of a persisted record: decide if it needs a new version, where the
  migration goes, and which tests and release steps it needs. Read before changing a record schema,
  a `codec`, `recordVersions` or `defineRecord`, an app `accountModel`, or a boot-time fix of
  stored data (`init.tsx`, `LedgerStore.tsx`).
---
# Record versions and migrations

Persistence moves data in records between the Redux state and storage on devices (Electron, iOS, Android). When a record changes its stored shape a new version is required and a function for migrating to it from the previous version.

The API is in the [`@shared/persistence` README](../../../shared/persistence/README.md).

## Is a new version required?

- **Yes when**: the shape of the record changes in a way that previous releases cannot read, e.g. new required field or renames.
- **No when**: the shape of the record stays the same, and only the mapping to state or storage changes.
- **No when:** it is a Cloud Sync payload. This is a separate concern detailed in the `cloud-sync-module` skill.

## Where the migration goes


| Kind                                                                         | Where                            | Rule                                                                                                                                                     |
| ---------------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Legacy migrations: e.g. account `DataModel` steps, settings boot fixes, etc. | Stay in the apps                 | These migrations allow old, app specific versions to be migrated to the current design.                                                                  |
| The move to persistence (v0)                                                 | The record definition            | No migration: same key, same bytes, just the introduction of a version (v0)                                                                              |
| New versions (v1 and beyond)                                                 | The package that owns the record | Going forward, migrations and versions are shared across apps. If a record needs a new version it should be managed by the package that owns the record. |


The owner package is the feature package that owns the slice, or a new `@features/platform-persistence-<record>` package. A record that is still in an app moves to its own package if a new version is needed.

Migration code never goes in `@shared/persistence` (the helpers), `domain/entity/*`, `DataModel.ts`, a Cloud Sync module or boot code.

## Add a version

```ts
export const prefsVersions = recordVersions(z => z.strictObject({ theme: z.string() }))
  // v1, desktop 2.130.0, mobile 3.90.0: stores the font size
  .next(
    z => z.strictObject({ theme: z.string(), fontSize: z.number() }),
    v0 => ({ ...v0, fontSize: 12 }),
  );
```

Pass it to the record: `defineRecord({ key, versions: prefsVersions, codec, state })`.

1. Move the record definition to its owner package, if it is still in an app.
2. Add 1 `.next(schema, step)` at the end of the list. Put the first app versions in a comment.
3. Use a strict schema. `z.object` drops the unknown keys, so an older app erases a newer field.
Do not use `transform` or `preprocess`: the encode must write a value that the schema reads.
4. Write a pure, synchronous step from stored n-1 to stored n. It reads nothing else: no other
key, no network, no clock, no device.
5. Make sure that the step never throws on a value that the previous schema accepts.
6. Change the `codec` so that it maps the new latest shape to the state.
7. Add the tests below, and write the first app versions in the changeset.

## Rules

- Never edit or delete a published schema or step. Add a version. Old values can stay stored with
no time limit.
- `$v` marks the version: v0 is the bare legacy value, v1 and later are `{ $v: n, data }`. The
account `version` is the legacy step count. Never use it for a new version.
- A stored object with `$v` is always an envelope. A v0 schema never accepts `$v`.
- Each writer (app, `apps/cli`, e2e seeds) encodes through the record definition, never with a
fixed version number.

## Tests for each version

- Store samples of each version in `__fixtures__/`, taken from a released app.
- 1 schema snapshot for each version, `storedSchemaSnapshot(record, n)`. The snapshot of a
published version never changes.
- Each sample upgrades to the latest version.

See the [`@shared/persistence` tests](../../../shared/persistence/src/recordVersions.test.ts) for
an example.

## Older apps

An older app does not read a value that a newer app stored: the decode throws
`NewerRecordVersionError` before any schema. So a downgrade loses no data, but it hides it until
the user updates.

## Not a version

- Data that moves between records (e.g. account names that were stored in `wallet` and `accounts`) needs other changes.
- Work with the network or the device is a feature job after hydration – not suitable for a typical version migration.
