# @domain/api-swap-quotes

## 0.2.3-next.0

### Patch Changes

- Updated dependencies [[`ce47443`](https://github.com/LedgerHQ/ledger-live/commit/ce47443e97f559210443547a7948ef61c01f7feb), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8)]:
  - @shared/api-services@0.6.0-next.0
  - @shared/auth@0.6.0-next.0

## 0.2.2

### Patch Changes

- Updated dependencies [[`f64ceec`](https://github.com/LedgerHQ/ledger-live/commit/f64ceecbdaccec2c56ace4cc459d670db5920b68), [`d5ea888`](https://github.com/LedgerHQ/ledger-live/commit/d5ea888d3a154feeb29b452841749d358629b8c1)]:
  - @shared/api-services@0.5.0

## 0.2.2-next.0

### Patch Changes

- Updated dependencies [[`f64ceec`](https://github.com/LedgerHQ/ledger-live/commit/f64ceecbdaccec2c56ace4cc459d670db5920b68), [`d5ea888`](https://github.com/LedgerHQ/ledger-live/commit/d5ea888d3a154feeb29b452841749d358629b8c1)]:
  - @shared/api-services@0.5.0-next.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`696f871`](https://github.com/LedgerHQ/ledger-live/commit/696f871fc89aedd6a2a50fe3f0dd442bbd7ebf07), [`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc)]:
  - @shared/auth@0.5.0
  - @shared/api-services@0.4.0

## 0.2.1-next.0

### Patch Changes

- Updated dependencies [[`696f871`](https://github.com/LedgerHQ/ledger-live/commit/696f871fc89aedd6a2a50fe3f0dd442bbd7ebf07), [`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc)]:
  - @shared/auth@0.5.0-next.0
  - @shared/api-services@0.4.0-next.0

## 0.2.0

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

### Patch Changes

- Updated dependencies [[`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf)]:
  - @shared/api-services@0.3.0
  - @shared/auth@0.4.0

## 0.2.0-next.0

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

### Patch Changes

- Updated dependencies [[`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf)]:
  - @shared/api-services@0.3.0-next.0
  - @shared/auth@0.4.0-next.0
