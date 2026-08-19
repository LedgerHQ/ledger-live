# @domain/api-aggregated-assets

## 0.4.0

### Minor Changes

- [#20678](https://github.com/LedgerHQ/ledger-live/pull/20678) [`14cf5b8`](https://github.com/LedgerHQ/ledger-live/commit/14cf5b8fad43788bdd7c682f53ab9d4fe03f9a8f) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Split the DADA api into per-use-case endpoint modules and route every request through RTK's injected base query, so aborts, shared headers and HTTP error statuses are preserved

- [#20667](https://github.com/LedgerHQ/ledger-live/pull/20667) [`e72d6ff`](https://github.com/LedgerHQ/ledger-live/commit/e72d6ffbd8b1a1ac79d272e1823ecfdfd06ed0ee) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Delete the dada-client shim tree; the DADA code now lives only in its DDD packages

- [#20708](https://github.com/LedgerHQ/ledger-live/pull/20708) [`5a96e09`](https://github.com/LedgerHQ/ledger-live/commit/5a96e096169e44731117becf9c204666c4509364) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Stop the DADA category pagination walk when the server repeats a cursor, so a proxy echoing `x-ledger-next` can no longer leave the Stocks or Stablecoins query loading forever

### Patch Changes

- Updated dependencies [[`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc), [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a), [`840de0d`](https://github.com/LedgerHQ/ledger-live/commit/840de0d43c75962ab91f0f1dc232dbcef10356a3), [`3c36af2`](https://github.com/LedgerHQ/ledger-live/commit/3c36af2185860d32bfaad670df7c49a3458e44c3), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2)]:
  - @shared/api-services@0.4.0
  - @shared/env@0.3.0
  - @domain/entity-currency-token@0.5.0
  - @domain/api-currency-token@0.5.0
  - @domain/entity-currency@0.4.1

## 0.4.0-next.0

### Minor Changes

- [#20678](https://github.com/LedgerHQ/ledger-live/pull/20678) [`14cf5b8`](https://github.com/LedgerHQ/ledger-live/commit/14cf5b8fad43788bdd7c682f53ab9d4fe03f9a8f) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Split the DADA api into per-use-case endpoint modules and route every request through RTK's injected base query, so aborts, shared headers and HTTP error statuses are preserved

- [#20667](https://github.com/LedgerHQ/ledger-live/pull/20667) [`e72d6ff`](https://github.com/LedgerHQ/ledger-live/commit/e72d6ffbd8b1a1ac79d272e1823ecfdfd06ed0ee) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Delete the dada-client shim tree; the DADA code now lives only in its DDD packages

- [#20708](https://github.com/LedgerHQ/ledger-live/pull/20708) [`5a96e09`](https://github.com/LedgerHQ/ledger-live/commit/5a96e096169e44731117becf9c204666c4509364) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Stop the DADA category pagination walk when the server repeats a cursor, so a proxy echoing `x-ledger-next` can no longer leave the Stocks or Stablecoins query loading forever

### Patch Changes

- Updated dependencies [[`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc), [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a), [`840de0d`](https://github.com/LedgerHQ/ledger-live/commit/840de0d43c75962ab91f0f1dc232dbcef10356a3), [`3c36af2`](https://github.com/LedgerHQ/ledger-live/commit/3c36af2185860d32bfaad670df7c49a3458e44c3), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2)]:
  - @shared/api-services@0.4.0-next.0
  - @shared/env@0.3.0-next.0
  - @domain/entity-currency-token@0.5.0-next.0
  - @domain/api-currency-token@0.5.0-next.0
  - @domain/entity-currency@0.4.1-next.0

## 0.3.0

### Minor Changes

- [#20540](https://github.com/LedgerHQ/ledger-live/pull/20540) [`64bb8cf`](https://github.com/LedgerHQ/ledger-live/commit/64bb8cfa5bffde5a1e2c24615f1dd11b864094d2) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the dada-client platform layer (hooks, cache selectors, discovery and currency selection) into
  @features/platform-aggregated-assets, leaving re-export shims at the old paths so no consumer changes

- [#20345](https://github.com/LedgerHQ/ledger-live/pull/20345) [`bbfc8cf`](https://github.com/LedgerHQ/ledger-live/commit/bbfc8cf7929d9bffc1aa1b9a5e3b9593e3016436) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the dada-client domain layer into the aggregated-assets DDD packages, leaving re-export shims at the old paths so no consumer changes

### Patch Changes

- Updated dependencies [[`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3), [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf), [`64bb8cf`](https://github.com/LedgerHQ/ledger-live/commit/64bb8cfa5bffde5a1e2c24615f1dd11b864094d2), [`bbfc8cf`](https://github.com/LedgerHQ/ledger-live/commit/bbfc8cf7929d9bffc1aa1b9a5e3b9593e3016436)]:
  - @domain/entity-currency-crypto@0.10.0
  - @domain/entity-currency-token@0.4.0
  - @domain/api-currency-token@0.4.0
  - @domain/entity-currency@0.4.0
  - @shared/api-services@0.3.0
  - @domain/entity-interest-rate@0.3.0
  - @domain/entity-aggregated-asset@0.3.0

## 0.3.0-next.0

### Minor Changes

- [#20540](https://github.com/LedgerHQ/ledger-live/pull/20540) [`64bb8cf`](https://github.com/LedgerHQ/ledger-live/commit/64bb8cfa5bffde5a1e2c24615f1dd11b864094d2) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the dada-client platform layer (hooks, cache selectors, discovery and currency selection) into
  @features/platform-aggregated-assets, leaving re-export shims at the old paths so no consumer changes

- [#20345](https://github.com/LedgerHQ/ledger-live/pull/20345) [`bbfc8cf`](https://github.com/LedgerHQ/ledger-live/commit/bbfc8cf7929d9bffc1aa1b9a5e3b9593e3016436) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the dada-client domain layer into the aggregated-assets DDD packages, leaving re-export shims at the old paths so no consumer changes

### Patch Changes

- Updated dependencies [[`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3), [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf), [`64bb8cf`](https://github.com/LedgerHQ/ledger-live/commit/64bb8cfa5bffde5a1e2c24615f1dd11b864094d2), [`bbfc8cf`](https://github.com/LedgerHQ/ledger-live/commit/bbfc8cf7929d9bffc1aa1b9a5e3b9593e3016436)]:
  - @domain/entity-currency-crypto@0.10.0-next.0
  - @domain/entity-currency-token@0.4.0-next.0
  - @domain/api-currency-token@0.4.0-next.0
  - @domain/entity-currency@0.4.0-next.0
  - @shared/api-services@0.3.0-next.0
  - @domain/entity-interest-rate@0.3.0-next.0
  - @domain/entity-aggregated-asset@0.3.0-next.0

## 0.2.0

### Minor Changes

- [#20285](https://github.com/LedgerHQ/ledger-live/pull/20285) [`d96324e`](https://github.com/LedgerHQ/ledger-live/commit/d96324e53bb42cf6ca645a71d242ee2d6d49e0b4) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Scaffold the DDD packages that will receive the dada-client code: the aggregated-asset and interest-rate entities, the aggregated-assets API client and its app-facing platform layer

## 0.2.0-next.0

### Minor Changes

- [#20285](https://github.com/LedgerHQ/ledger-live/pull/20285) [`d96324e`](https://github.com/LedgerHQ/ledger-live/commit/d96324e53bb42cf6ca645a71d242ee2d6d49e0b4) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Scaffold the DDD packages that will receive the dada-client code: the aggregated-asset and interest-rate entities, the aggregated-assets API client and its app-facing platform layer
