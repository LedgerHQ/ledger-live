---
name: legacy-migration
description: Move code out of `libs/` or `apps/*/src` into the layers (`shared/`, `domain/`, `features/`) in three steps, addition, deprecation and deletion, and give a new-architecture package what only legacy code provides through injection (ports, thunk `extraArgument`) instead of an import. Use when moving, extracting or porting code out of `libs/` or `apps/*/src`, replacing a legacy module with a new package, deprecating or deleting legacy code, or when a new package seems to need a `libs/` import.
---

# Legacy migration

Code leaves `libs/` and `apps/*/src` in three steps: **addition, deprecation, deletion**. Each step
is its own PR and leaves `develop` working. [structure-flow](../structure-flow/SKILL.md) decides
which layer receives the code; this skill covers how it gets there. The layer model and the status
of each `libs/` area live in [the architecture guide](../../../docs/monorepo-architecture.md).

## Boundary rules this relies on

- `shared/`, `domain/` and `features/` never import a `libs/` package (`scope:libs` tag), neither as
  a declared dependency nor as a source import.
- Only `apps/` imports both sides. Legacy code may consume new code as migration glue, never the
  reverse.
- **No new exception.** `BOUNDARY_EXCEPTIONS` in
  [`constraints.js`](../../../tools/nx-plugins/enforce-boundaries/constraints.js) holds one entry,
  `shared/env` to `@ledgerhq/live-env`, until that package leaves the repo. When a new package
  needs legacy code, inject it (below); never add an entry.
- Never re-export a legacy type from a new-architecture barrel.

`pnpm lint:boundaries` enforces the import rules: it checks the Nx graph against the layer
constraints, scans source imports under `shared/`, `domain/` and `features/` for legacy packages,
and rejects manifests that declare a banned package. Run it before every migration commit.

## 1. Addition

Build the replacement in the lowest valid layer, with its tests, while the legacy code keeps
working. Keep the public names when the new package is a drop-in replacement: callers then switch
by changing an import path.

Example: `@features/platform-feature-flags` was added as a Redux-backed drop-in replacement for the
Context-based hooks of `@ledgerhq/live-common/featureFlags` (`useFeature`, `useFeatureFlags`,
`FeatureToggle`), reading the slice that `@shared/feature-flags` owns. No caller moved in that PR.

## 2. Deprecation

Point every caller at the replacement and stop new ones from appearing:

- Mark each legacy export `@deprecated`, naming the replacement package and export.
- Migrate the callers. Legacy code that stays may import the new package.
- Ban the old import in the apps with an `eslint/no-restricted-imports` pattern in their
  `.oxlintrc.json`, with `importNamePattern` and a `message` naming the new package. Desktop and
  mobile do not enable `typescript/no-deprecated`, so `@deprecated` alone blocks nothing there.
- Notify open PRs still using the old path: [impacting-prs](../impacting-prs/SKILL.md).

Example: the currency accessors moved to `@domain/entity-currency-crypto` and
`@domain/entity-currency-fiat`. Both apps' `.oxlintrc.json` reject `findCryptoCurrencyById` and its
siblings from `@ledgerhq/live-common/currencies` with a message naming the domain packages. For the
JSDoc form, see `libs/types-live/src/feature.ts`: "`@deprecated` Moved to `@shared/feature-flags`".

## 3. Deletion

Delete once nothing imports the legacy code: search the import path and every exported name
separately (static imports, `require`, `jest.mock` factories, string literals). Where the package
runs `knip`, let it confirm the exports are unused.

- Delete the module, its tests, the app bridges that adapted it, and the restricted-import entries
  that named its paths.
- A whole package that must stay published but that no workspace package may depend on goes into
  `BANNED_DEPENDENCIES` in `constraints.js` first; delete the package in a later PR.
- Deleting a published package or a public export needs a changeset:
  [create-changeset](../create-changeset/SKILL.md).

Example: once both apps used `@features/platform-feature-flags`, one PR deleted the live-common
`featureFlags` module and the app feature-flag bridges, about 1,800 lines. `@ledgerhq/errors`
followed the package route: banned in `BANNED_DEPENDENCIES`, then dropped from `libs/`.

## Crossing the frontier with injection

A new package that needs behavior only legacy code has declares the contract itself and receives
the implementation. The app, the only place allowed to import both sides, builds the
implementation from legacy code and hands it over at the composition root.

**Port**: a type in the new package, implemented by the app and passed in.

```ts
// features/flow/flow-contacts-add-address/src/state/ports.ts
export type ContactsCurrencySelectionPort = Readonly<{
  selectCurrency(networkIds: readonly CryptoCurrency["id"][]): Promise<AddAddressCurrencySelection | null>;
}>;
```

Desktop implements it in
`apps/ledger-live-desktop/src/mvvm/features/Contacts/hooks/useContactsCurrencySelectionAdapter.ts`
on top of the live-common modular drawer, and the Contacts screen view model hands it to the flow.
The flow package never sees `@ledgerhq/live-common`.

**Thunk `extraArgument`**: for thunks and RTK Query endpoints, the contract is a typed slice of the
store's `extraArgument`, built by an `xxxExtra()` function the package exports.

```ts
// apps/ledger-live-desktop/src/state-manager/configureStore.ts
thunk: {
  extraArgument: {
    ...accountDataExtra(accountDataSources(getState, dispatch)),
  },
},
```

`@domain/api-account-data` declares `AccountDataSource`; live-common implements it with
`createFullSyncSource`, and `apps/*/src/config/account-data-setup.ts` feeds it the legacy accounts
and bridge cache. The domain package reads its router from `extraArgument` and stays legacy-free.

More patterns and their trade-offs: [references/injection.md](references/injection.md).

## Checklist

- [ ] The target layer follows [structure-flow](../structure-flow/SKILL.md).
- [ ] Addition, deprecation and deletion land as separate PRs.
- [ ] No new package imports or declares a `libs/` package; `BOUNDARY_EXCEPTIONS` is unchanged.
- [ ] Legacy behavior reaches new code through a port or `extraArgument` wired in `apps/`.
- [ ] `pnpm lint:boundaries` passes.
