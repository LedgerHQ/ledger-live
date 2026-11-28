---
name: slice-selectors
description: Put a selector that reads one Redux slice inside `createSlice({ selectors })` and export it from `slice.selectors`, bind it to another mount point with `getSelectors`, and keep cross-slice and generic selectors standalone. Use when writing or reviewing a selector, a `createSlice`, a `selectors.ts` file or a `getSelectors` call in `shared/`, `domain/` or `features/`, or when the `redux-slices/selectors-in-slice` lint rule fails.
---

# Slice selectors

A selector that reads one slice lives in that slice's `selectors` field. The package exports the
bound selectors with `export const { selectX } = xSlice.selectors`. RTK binds them to
`rootState[reducerPath]`, so no hand-written root type (`{ contacts: ContactsState }`) and no
`selectors.ts` is needed for them. The lint rule `redux-slices/selectors-in-slice` points here.

From [`@domain/entity-predictions`](../../../domain/entity/predictions/src/slice.ts):

```ts
export const predictionsSlice = createSlice({
  name: "predictions",
  initialState: initialPredictionsState,
  reducers: { ... },
  selectors: {
    selectHasSeenIntro: (state): boolean => state.hasSeenIntro,
  },
});

export const { selectHasSeenIntro } = predictionsSlice.selectors;
```

Each nested selector receives the slice state and its own arguments; the bound version takes the
root state first (`selectHasSeenIntro(rootState)`).

## Where a selector goes

1. **It reads one slice, with no type parameter**: nest it in `selectors`.
2. **It reads several slices**: keep it standalone, a `createSelector` whose inputs are the
   owners' nested selectors. It types its root as the intersection the inputs need.
3. **It has a type parameter**: keep it standalone. RTK's `RemappedSelector` infers the return
   and parameter types once, so a nested generic loses `T`: `selectFeature<T>` in
   `shared/feature-flags/src/data/selectors.ts` and `selectAccountDataStatus<K>` in
   `domain/entity/account-data/src/status.ts` stay functions.
4. **The package does not own the slice**: compose the owner's exported selectors, never re-read
   its state shape.

## Another mount point

When an app or a parent reducer mounts the slice under a key other than its `name`, the mount
owner rebinds the same selectors with `slice.getSelectors(selectState)`, at module scope:

```ts
// apps/ledger-live-desktop/src/config/account-data-setup.ts: accountsSlice is mounted at accountEntries
const { selectAccountEntry } = accountsSlice.getSelectors((state: State) => state.accountEntries);
```

`countervaluesSyncSlice` is mounted under `countervalues.sync` by the `combineReducers` in
`features/platform/market-countervalues/src/state/reducer.ts`, which binds its selectors the same
way. `getSelectors` caches the bound set per `selectState` reference: an inline arrow in a
component or a hook builds a new set on each call, so keep the call at module scope.

- **Never rename a slice `name`** to match a mount key, and **never set `reducerPath`** to a
  value other than `name`. The action type prefix of a `createSlice` is its `name`, and desktop
  persistence starts a save on that prefix (`${predictionsSlice.name}/` in
  `apps/ledger-live-desktop/src/renderer/middlewares/db.ts`, the hard-coded
  `"payCardFeatureTour/"` in `apps/ledger-live-desktop/src/renderer/middlewares/payPersistence.ts`).
  A rename makes a hard-coded prefix stop matching, and the state stops being saved with no error.
  For an RTK Query api the prefix is `reducerPath` (`${cryptoAssetsApi.reducerPath}/`), so a slice
  whose `reducerPath` differs from its `name` makes the two conventions disagree. Rebind with
  `getSelectors` instead.
- `slice.selectSlice` reads the whole slice state from the root. Use it as the lens a store helper
  or a `createSelector` input needs, rather than a hand-written `state => state.x`.

## Memoize inside `selectors`

A derived value that allocates (a filtered list, a mapped object) is a `createSelector` whose
inputs read the slice state, nested like any other selector:

```ts
selectors: {
  selectVisibleItems: createSelector(
    [(state: ItemsState) => state.items, (state: ItemsState) => state.filter],
    (items, filter) => items.filter(item => item.kind === filter),
  ),
},
```

A selector that returns a field as is needs no `createSelector`.

## Missing subtree

A bound selector throws in development when its subtree is undefined (`selectSlice returned
undefined for an uninjected slice reducer`, or `selectState returned undefined ...` for a
`getSelectors` binding). In production it passes `undefined` to the selector instead. The throw
catches a slice the app forgot to register or a wrong mount key; register the reducer, do not
guard the selector.

## Test

Test against the slice state, without an app store:

- `xSlice.selectors.selectX({ [xSlice.name]: mock })`, the bound selector on a minimal root;
- `selectX.unwrapped(mock)`, the inner selector on the slice state;
- `xSlice.getSelectors()`, every selector bound to the slice state itself, as
  `domain/entity/predictions/src/slice.test.ts` and `domain/entity/account/src/slice.test.ts` do.

Build `mock` from the package's `slice.mock.ts` (see [`domain-data`](../domain-data/SKILL.md)).

## Review checklist

- [ ] A one-slice, non-generic selector is in `createSlice({ selectors })`, exported from
      `slice.selectors`; no hand-written root type for it
- [ ] Cross-slice and generic selectors are standalone and compose the nested ones
- [ ] Another mount point uses `getSelectors(selectState)` at module scope
- [ ] No slice `name` renamed, no `reducerPath` that differs from `name`
