# @devtools/env

## 0.3.0-next.0

### Minor Changes

- [#24320](https://github.com/LedgerHQ/ledger-live/pull/24320) [`d02425e`](https://github.com/LedgerHQ/ledger-live/commit/d02425e29efe55595b51556e598fde0f9c34574f) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Align the native devtools with Lumen and the desktop: tiles for the categories, kind and owner tags, one icon per tool, Lumen inputs, one horizontal gutter

- [#24300](https://github.com/LedgerHQ/ledger-live/pull/24300) [`43d4d30`](https://github.com/LedgerHQ/ledger-live/commit/43d4d308546a4013f2e230a42235015377eaa694) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Build the web env, cloud sync and trustchain devtools on Lumen: inputs, buttons, banners and tags replace the raw elements, and the env table uses the Lumen data table

## 0.2.0

### Minor Changes

- [#22145](https://github.com/LedgerHQ/ledger-live/pull/22145) [`6844ca4`](https://github.com/LedgerHQ/ledger-live/commit/6844ca4e220c98ff99dd5d259dab339223624847) Thanks [@ysitbon](https://github.com/ysitbon)! - Put every devtools package under knip and remove the dead code it found

  Dual-platform packages run knip once per platform through `createDualPlatformKnipConfig`, so a
  suffix-less `./Tool` specifier resolves to the right twin instead of orphaning both. Removed: the
  unreachable `Expand` component, the `metadata` and web-only `hooks` barrels, and the named exports
  that duplicated a default export. `@devtools/protocols` now enumerates its two subpath exports
  instead of a `./*` wildcard.

## 0.2.0-next.0

### Minor Changes

- [#22145](https://github.com/LedgerHQ/ledger-live/pull/22145) [`6844ca4`](https://github.com/LedgerHQ/ledger-live/commit/6844ca4e220c98ff99dd5d259dab339223624847) Thanks [@ysitbon](https://github.com/ysitbon)! - Put every devtools package under knip and remove the dead code it found

  Dual-platform packages run knip once per platform through `createDualPlatformKnipConfig`, so a
  suffix-less `./Tool` specifier resolves to the right twin instead of orphaning both. Removed: the
  unreachable `Expand` component, the `metadata` and web-only `hooks` barrels, and the named exports
  that duplicated a default export. `@devtools/protocols` now enumerates its two subpath exports
  instead of a `./*` wildcard.
