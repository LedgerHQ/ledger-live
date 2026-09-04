# @features/platform-aggregated-assets

## 0.5.1-next.0

### Patch Changes

- Updated dependencies []:
  - @domain/api-aggregated-assets@0.4.2-next.0
  - @features/platform-env@0.2.3-next.0
  - @domain/entity-currency@0.4.2-next.0

## 0.5.0

### Minor Changes

- [#20942](https://github.com/LedgerHQ/ledger-live/pull/20942) [`8c438f9`](https://github.com/LedgerHQ/ledger-live/commit/8c438f9bec55614174c6faca7ebeb77c8e64aaef) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Plug the Modular Asset Drawer into the Pay tab Request and Add stablecoin actions, filtering selection to the stablecoin category so users can pick asset, network and account without over-long request URLs

### Patch Changes

- Updated dependencies []:
  - @domain/api-aggregated-assets@0.4.1
  - @features/platform-env@0.2.2

## 0.5.0-next.0

### Minor Changes

- [#20942](https://github.com/LedgerHQ/ledger-live/pull/20942) [`8c438f9`](https://github.com/LedgerHQ/ledger-live/commit/8c438f9bec55614174c6faca7ebeb77c8e64aaef) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Plug the Modular Asset Drawer into the Pay tab Request and Add stablecoin actions, filtering selection to the stablecoin category so users can pick asset, network and account without over-long request URLs

### Patch Changes

- Updated dependencies []:
  - @domain/api-aggregated-assets@0.4.1-next.0
  - @features/platform-env@0.2.2-next.0

## 0.4.0

### Minor Changes

- [#20755](https://github.com/LedgerHQ/ledger-live/pull/20755) [`e291645`](https://github.com/LedgerHQ/ledger-live/commit/e291645e8acb488323bf2ef8a26f045e6415c3fd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the mobile stable balance filter (native select under the hero + queued bottom-sheet picker) and share the filter option and stablecoin logic between desktop and mobile

### Patch Changes

- Updated dependencies [[`14cf5b8`](https://github.com/LedgerHQ/ledger-live/commit/14cf5b8fad43788bdd7c682f53ab9d4fe03f9a8f), [`e72d6ff`](https://github.com/LedgerHQ/ledger-live/commit/e72d6ffbd8b1a1ac79d272e1823ecfdfd06ed0ee), [`5a96e09`](https://github.com/LedgerHQ/ledger-live/commit/5a96e096169e44731117becf9c204666c4509364)]:
  - @domain/api-aggregated-assets@0.4.0
  - @features/platform-env@0.2.1
  - @domain/entity-currency@0.4.1

## 0.4.0-next.0

### Minor Changes

- [#20755](https://github.com/LedgerHQ/ledger-live/pull/20755) [`e291645`](https://github.com/LedgerHQ/ledger-live/commit/e291645e8acb488323bf2ef8a26f045e6415c3fd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the mobile stable balance filter (native select under the hero + queued bottom-sheet picker) and share the filter option and stablecoin logic between desktop and mobile

### Patch Changes

- Updated dependencies [[`14cf5b8`](https://github.com/LedgerHQ/ledger-live/commit/14cf5b8fad43788bdd7c682f53ab9d4fe03f9a8f), [`e72d6ff`](https://github.com/LedgerHQ/ledger-live/commit/e72d6ffbd8b1a1ac79d272e1823ecfdfd06ed0ee), [`5a96e09`](https://github.com/LedgerHQ/ledger-live/commit/5a96e096169e44731117becf9c204666c4509364)]:
  - @domain/api-aggregated-assets@0.4.0-next.0
  - @features/platform-env@0.2.1-next.0
  - @domain/entity-currency@0.4.1-next.0

## 0.3.0

### Minor Changes

- [#20595](https://github.com/LedgerHQ/ledger-live/pull/20595) [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf) Thanks [@ysitbon](https://github.com/ysitbon)! - Make every new-architecture barrel a pure regrouping point, and enforce it.

  An `index.*` under `shared/`, `domain/` or `features/` may now contain only `export * from "./x"`
  lines, plus an optional default re-export. Having to sort in the export
  (`export { a, b } from "./x"`) proved the target file mixed public and private code; an `index.*`
  holding actual code proved it more loudly. A new nx plugin infers a `lint:structure` target on each
  of the 49 packages and fails on both, along with two related rules: a barrel may not re-export a
  private `internals` location, and it may not re-export another workspace package.

  That last rule removes the proxies. A package that re-exported a neighbour gave the same symbol two
  import paths and hid who actually provided it. Consumers now import the original provider and
  declare the dependency, which is why the two apps gain `@features/flow-contacts-add-contact` and the
  desktop app gains `@features/platform-contacts`.

  Renamed or relocated, with the import specifier unchanged for consumers in every case except where
  noted:

  - `@domain/entity-account-name` no longer exports the `setAccountNames` alias; use
    `bulkSetAccountNames`, the name the slice actually defines.
  - `@shared/cloud-sync` exports `getCloudSyncApi` as a named export from its api module instead of
    re-exporting a default under a different name.

  Five packages are left untouched behind temporary exclusions, each recording how to remove it:

  - `@shared/env`, the facade over the legacy `@ledgerhq/live-env`, which carries the wrapping in its
    barrel.
  - the `@ledgerhq/engagement` and `@ledgerhq/ptx` packages (`flow-analytics-consent`,
    `flow-large-screen-upsell`, `flow-lazy-onboarding-banner`, `flow-pay-card-auth`), so each owning
    team lands the change on its own schedule. Conformant barrels were prepared and verified for them
    before being reverted, so the work is deferred rather than open.

- [#20540](https://github.com/LedgerHQ/ledger-live/pull/20540) [`64bb8cf`](https://github.com/LedgerHQ/ledger-live/commit/64bb8cfa5bffde5a1e2c24615f1dd11b864094d2) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the dada-client platform layer (hooks, cache selectors, discovery and currency selection) into
  @features/platform-aggregated-assets, leaving re-export shims at the old paths so no consumer changes

### Patch Changes

- Updated dependencies [[`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf), [`64bb8cf`](https://github.com/LedgerHQ/ledger-live/commit/64bb8cfa5bffde5a1e2c24615f1dd11b864094d2), [`bbfc8cf`](https://github.com/LedgerHQ/ledger-live/commit/bbfc8cf7929d9bffc1aa1b9a5e3b9593e3016436)]:
  - @domain/entity-currency@0.4.0
  - @features/platform-env@0.2.0
  - @domain/api-aggregated-assets@0.3.0
  - @domain/entity-interest-rate@0.3.0
  - @domain/entity-aggregated-asset@0.3.0

## 0.3.0-next.0

### Minor Changes

- [#20595](https://github.com/LedgerHQ/ledger-live/pull/20595) [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf) Thanks [@ysitbon](https://github.com/ysitbon)! - Make every new-architecture barrel a pure regrouping point, and enforce it.

  An `index.*` under `shared/`, `domain/` or `features/` may now contain only `export * from "./x"`
  lines, plus an optional default re-export. Having to sort in the export
  (`export { a, b } from "./x"`) proved the target file mixed public and private code; an `index.*`
  holding actual code proved it more loudly. A new nx plugin infers a `lint:structure` target on each
  of the 49 packages and fails on both, along with two related rules: a barrel may not re-export a
  private `internals` location, and it may not re-export another workspace package.

  That last rule removes the proxies. A package that re-exported a neighbour gave the same symbol two
  import paths and hid who actually provided it. Consumers now import the original provider and
  declare the dependency, which is why the two apps gain `@features/flow-contacts-add-contact` and the
  desktop app gains `@features/platform-contacts`.

  Renamed or relocated, with the import specifier unchanged for consumers in every case except where
  noted:

  - `@domain/entity-account-name` no longer exports the `setAccountNames` alias; use
    `bulkSetAccountNames`, the name the slice actually defines.
  - `@shared/cloud-sync` exports `getCloudSyncApi` as a named export from its api module instead of
    re-exporting a default under a different name.

  Five packages are left untouched behind temporary exclusions, each recording how to remove it:

  - `@shared/env`, the facade over the legacy `@ledgerhq/live-env`, which carries the wrapping in its
    barrel.
  - the `@ledgerhq/engagement` and `@ledgerhq/ptx` packages (`flow-analytics-consent`,
    `flow-large-screen-upsell`, `flow-lazy-onboarding-banner`, `flow-pay-card-auth`), so each owning
    team lands the change on its own schedule. Conformant barrels were prepared and verified for them
    before being reverted, so the work is deferred rather than open.

- [#20540](https://github.com/LedgerHQ/ledger-live/pull/20540) [`64bb8cf`](https://github.com/LedgerHQ/ledger-live/commit/64bb8cfa5bffde5a1e2c24615f1dd11b864094d2) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the dada-client platform layer (hooks, cache selectors, discovery and currency selection) into
  @features/platform-aggregated-assets, leaving re-export shims at the old paths so no consumer changes

### Patch Changes

- Updated dependencies [[`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf), [`64bb8cf`](https://github.com/LedgerHQ/ledger-live/commit/64bb8cfa5bffde5a1e2c24615f1dd11b864094d2), [`bbfc8cf`](https://github.com/LedgerHQ/ledger-live/commit/bbfc8cf7929d9bffc1aa1b9a5e3b9593e3016436)]:
  - @domain/entity-currency@0.4.0-next.0
  - @features/platform-env@0.2.0-next.0
  - @domain/api-aggregated-assets@0.3.0-next.0
  - @domain/entity-interest-rate@0.3.0-next.0
  - @domain/entity-aggregated-asset@0.3.0-next.0

## 0.2.0

### Minor Changes

- [#20285](https://github.com/LedgerHQ/ledger-live/pull/20285) [`d96324e`](https://github.com/LedgerHQ/ledger-live/commit/d96324e53bb42cf6ca645a71d242ee2d6d49e0b4) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Scaffold the DDD packages that will receive the dada-client code: the aggregated-asset and interest-rate entities, the aggregated-assets API client and its app-facing platform layer

## 0.2.0-next.0

### Minor Changes

- [#20285](https://github.com/LedgerHQ/ledger-live/pull/20285) [`d96324e`](https://github.com/LedgerHQ/ledger-live/commit/d96324e53bb42cf6ca645a71d242ee2d6d49e0b4) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Scaffold the DDD packages that will receive the dada-client code: the aggregated-asset and interest-rate entities, the aggregated-assets API client and its app-facing platform layer
