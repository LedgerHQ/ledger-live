# @domain/entity-market-countervalues

## 0.2.0

### Minor Changes

- [#22356](https://github.com/LedgerHQ/ledger-live/pull/22356) [`96d2bbf`](https://github.com/LedgerHQ/ledger-live/commit/96d2bbfee1cb1bf91c8afa653e4d4a79ba2b8951) Thanks [@ysitbon](https://github.com/ysitbon)! - Add the countervalues domain entity: the rate state, and the pure logic over it.

  - `@domain/entity-market-countervalues` holds `CounterValuesState` and its serialized twin, the tracking pairs, the settings, and every computation that reads them: `calculate`, `calculateMany`, the rate lookups, `importCountervalues` / `exportCountervalues` and the pair resolution.
  - The shapes are Zod schemas with the types inferred from them, and currencies come from `@domain/entity-currency` rather than the legacy currency types.
  - Nothing consumes the package yet. `@ledgerhq/live-countervalues` keeps its own copy until it is turned into a shim over this one, so no behaviour changes.
  - `@domain/entity-market-countervalues/mock` carries the reference rate table the mock countervalues API derives its answers from.

### Patch Changes

- Updated dependencies []:
  - @domain/entity-currency@0.4.5

## 0.2.0-next.0

### Minor Changes

- [#22356](https://github.com/LedgerHQ/ledger-live/pull/22356) [`96d2bbf`](https://github.com/LedgerHQ/ledger-live/commit/96d2bbfee1cb1bf91c8afa653e4d4a79ba2b8951) Thanks [@ysitbon](https://github.com/ysitbon)! - Add the countervalues domain entity: the rate state, and the pure logic over it.

  - `@domain/entity-market-countervalues` holds `CounterValuesState` and its serialized twin, the tracking pairs, the settings, and every computation that reads them: `calculate`, `calculateMany`, the rate lookups, `importCountervalues` / `exportCountervalues` and the pair resolution.
  - The shapes are Zod schemas with the types inferred from them, and currencies come from `@domain/entity-currency` rather than the legacy currency types.
  - Nothing consumes the package yet. `@ledgerhq/live-countervalues` keeps its own copy until it is turned into a shim over this one, so no behaviour changes.
  - `@domain/entity-market-countervalues/mock` carries the reference rate table the mock countervalues API derives its answers from.

### Patch Changes

- Updated dependencies []:
  - @domain/entity-currency@0.4.5-next.0
