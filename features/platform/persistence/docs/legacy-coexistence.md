# Persistence and the legacy save code

A record moves to persistence while the legacy save code of the app still saves the other records.
This page says how the 2 share the storage until the legacy code is gone (LIVE-41525, epic
LIVE-35368).

## Decision

Keep the pattern of the POC: the legacy code asks `selectUsesPersistence(state, key)`. On mobile,
the gate goes in the legacy save hook, not in the change check of each record.

- **Desktop: no gate.** 1 change removes the `setKey` branch of `renderer/middlewares/db.ts`, the
  `getKey` read in `renderer/init.tsx` and the key in `DatabaseValues` (`renderer/storage.ts`).
  After that, `setKey("app", key)` does not compile. The record has 1 writer.
- **Mobile: 1 gate for each start.** Persistence reads MMKV only, so an install on AsyncStorage
  keeps the legacy code until LIVE-40450. `hydrate` runs on MMKV only, and `selectUsesPersistence`
  is true once it started for the record, whatever its status. The decision stays the same for the
  session, also when the Portfolio screen migrates the install to MMKV.
- **The gate is a record key on the hook.** `useDBSaveEffect({ recordKey })` makes no save while
  persistence owns the record, `saveAtStart` included. The first form, a condition in the change
  check, let a `saveAtStart` hook write at mount, also over a `failed` record (ADR rule 5).

Not chosen:

- Persistence on AsyncStorage too, with no gate: persistence reads MMKV only (LIVE-41525).
- A gate in the `~/db` save functions: it needs the ownership outside Redux, and a "save now" call
  must flush persistence, not do nothing.
- A feature flag: records move with no flag.

## What each record adds

| Part | Desktop | Mobile |
| --- | --- | --- |
| Record | Definition, golden test against a frozen copy of the legacy save, schema snapshot | Same |
| Composition | 1 binding with the timing of the legacy save | Same |
| Legacy write | Delete the `setKey` branch and the `DatabaseValues` key | `recordKey: "<key>"` on its `useDBSaveEffect` |
| Legacy read | Delete the `getKey` read and its import | `&& !selectUsesPersistence(store.getState(), "<key>")` on its import in `LedgerStore` |
| Direct writers | None: the call does not compile | A call to its `~/db` save function flushes persistence instead (`persistAccountsNow`) |

`marketBanner` on mobile shows the minimum: 1 binding, 1 record key, 1 import condition.

## The risk of 2 writers

- A tool stops: the legacy save hook (all options), the legacy import, and every desktop path.
- No tool stops a direct call to a `~/db` save function on mobile. Find them before a record moves:
  `grep -rn "save<Name>" apps/ledger-live-mobile/src`. Today: `saveKnownDevices` (mock server),
  `saveIdentities` (`initIdentities`), `savePostOnboardingState` (`backfillOnboardingDate`) and
  `saveFeatureFlagsState` (`LedgerStore`). `saveAccounts` uses `persistAccountsNow`.
- A record that gets a value from another key at start needs a design first. `knownDevices` gets
  devices from `ble`, `identities` from `user`, and their hooks store that with `saveAtStart`.
  Persistence does not write the first state after the hydration.

## Quit and background flush

The flush is wired once for each app, never for each record.

- Desktop: `db.onFlushRequest` in `renderer/init.tsx` runs `persistence.flush()` and the legacy
  flush.
- Mobile: `flushAll` in `components/DBSave.ts` runs both when the app goes to the background.
- A "save now" before a reboot or a restart flushes persistence when it owns the record.

## Removal of the gate

The gate exists on mobile only, and goes with the legacy code.

1. After LIVE-40450 (no install on AsyncStorage), hydrate at each start: remove `isOnMmkv` from
   `LedgerStore`.
2. For each hook with a `recordKey`: delete the hook, its `~/db` read and save, its legacy read
   and import in `LedgerStore`, and the legacy branch of its "save now" helper.
3. Move the background flush out of `DBSave` before `DBSave` goes.
4. Delete `recordKey`, then `selectUsesPersistence` when it has no caller.

`grep -rn "recordKey\|selectUsesPersistence" apps/ledger-live-mobile/src` lists the work.
