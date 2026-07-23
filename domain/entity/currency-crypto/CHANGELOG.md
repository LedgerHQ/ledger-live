# @domain/entity-currency-crypto

## 0.6.0

### Minor Changes

- [#19403](https://github.com/LedgerHQ/ledger-live/pull/19403) [`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7) Thanks [@ysitbon](https://github.com/ysitbon)! - Add list and search accessors to `@domain/entity-currency-crypto`: `listCryptoCurrencies`, `findCryptoCurrency`, `findCryptoCurrencyByScheme`, `findCryptoCurrencyByTicker`, and `findCryptoCurrencyByKeyword`. These match the legacy `@ledgerhq/cryptoassets` accessor semantics (including the keyword-tiebreak ticker disambiguation) and are built once at module load over the static `CRYPTO_CURRENCIES_REGISTRY`.

- [#19425](https://github.com/LedgerHQ/ledger-live/pull/19425) [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(xion): rebrand Xion to Verona (display name/ticker XION -> VERONA, main unit code XION -> VERONA, base denom uxion unchanged) and backport the coin-cosmos default LCD to verona-api.polkachu.com

## 0.6.0-next.0

### Minor Changes

- [#19403](https://github.com/LedgerHQ/ledger-live/pull/19403) [`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7) Thanks [@ysitbon](https://github.com/ysitbon)! - Add list and search accessors to `@domain/entity-currency-crypto`: `listCryptoCurrencies`, `findCryptoCurrency`, `findCryptoCurrencyByScheme`, `findCryptoCurrencyByTicker`, and `findCryptoCurrencyByKeyword`. These match the legacy `@ledgerhq/cryptoassets` accessor semantics (including the keyword-tiebreak ticker disambiguation) and are built once at module load over the static `CRYPTO_CURRENCIES_REGISTRY`.

- [#19425](https://github.com/LedgerHQ/ledger-live/pull/19425) [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(xion): rebrand Xion to Verona (display name/ticker XION -> VERONA, main unit code XION -> VERONA, base denom uxion unchanged) and backport the coin-cosmos default LCD to verona-api.polkachu.com

## 0.5.0

### Minor Changes

- [#19185](https://github.com/LedgerHQ/ledger-live/pull/19185) [`86ca231`](https://github.com/LedgerHQ/ledger-live/commit/86ca231ea9e0ec5996258b1abfa9742a7df3f9ec) Thanks [@ysitbon](https://github.com/ysitbon)! - Add by-id accessors to `@domain/entity-currency-crypto`: `getCryptoCurrencyById` (throws on miss), `findCryptoCurrencyById` (returns `undefined` on miss) and `hasCryptoCurrencyId`, resolving over the static `CRYPTO_CURRENCIES_REGISTRY` including the legacy alias keys. These let DA-layer and app consumers resolve currencies by id from the domain package directly, matching the legacy `@ledgerhq/cryptoassets` accessor semantics. Extended the domain parity test accordingly.

  Raised the CLI's TypeScript `lib` to `es2022` (was `es2020`, matching desktop and mobile) so it can typecheck domain source that uses ES2022 APIs such as `Object.hasOwn`.

- [#19137](https://github.com/LedgerHQ/ledger-live/pull/19137) [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e) Thanks [@ysitbon](https://github.com/ysitbon)! - chore: make new domain/shared/features packages "born migrated" for knip

  Add an explicit, minimal `package.json#exports` surface (no `./*` wildcard) and a `knip.json` workspace entry to every new `@domain/*`, `@shared/*`, and `@features/*` package, plus an `unimported` script that runs knip scoped to the workspace. This lets dead-code / unused-dependency detection actually analyze these packages and detect zombie top-level source files. Also removes the unused `cn` util and its `clsx` / `tailwind-merge` dependencies from `@features/flow-market-banner` (surfaced by knip).

- [#18867](https://github.com/LedgerHQ/ledger-live/pull/18867) [`7c39ea3`](https://github.com/LedgerHQ/ledger-live/commit/7c39ea39ca8999bcb8ce2294f4884430b6d1b2dc) Thanks [@ysitbon](https://github.com/ysitbon)! - Seed `@domain/entity-currency-crypto` to parity with the legacy `@ledgerhq/cryptoassets` registry and add a CI parity test (in cryptoassets) that fails if the two diverge. The domain registry is now the primary source of truth; both are dual-maintained until legacy is dropped. The generator now dedupes by currency `.id` and removes stale files, so legacy alias/casing keys no longer produce duplicate entries.

- [#19007](https://github.com/LedgerHQ/ledger-live/pull/19007) [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303) Thanks [@ysitbon](https://github.com/ysitbon)! - `setCryptoCurrenciesStore` now accepts an optional `aliases` map (alias key → canonical id) and registers those keys in the injected by-id index, so legacy alias lookups (e.g. `getCryptoCurrencyById("osmosis")`) keep resolving after injection, matching the bundled map. `@domain/entity-currency-crypto` exposes `CRYPTO_CURRENCY_ALIASES` (`osmosis`→`osmo`, `groestlcoin`→`groestcoin`, `lbry`→`LBRY`) for apps to pass at bootstrap.

- [#19007](https://github.com/LedgerHQ/ledger-live/pull/19007) [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303) Thanks [@ysitbon](https://github.com/ysitbon)! - Loosen `LedgerExplorerId` to `string` and mark `CryptoCurrency.explorerId` as `@deprecated` (kept only for backward compatibility; the explorer-id concept is being phased out). The domain crypto registry stays assignable to the legacy `CryptoCurrency` type, so it injects via `setCryptoCurrenciesStore` with no cast.

### Patch Changes

- Updated dependencies [[`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e)]:
  - @domain/entity-currency-unit@0.3.0
  - @shared/schema-primitives@0.3.0

## 0.5.0-next.0

### Minor Changes

- [#19185](https://github.com/LedgerHQ/ledger-live/pull/19185) [`86ca231`](https://github.com/LedgerHQ/ledger-live/commit/86ca231ea9e0ec5996258b1abfa9742a7df3f9ec) Thanks [@ysitbon](https://github.com/ysitbon)! - Add by-id accessors to `@domain/entity-currency-crypto`: `getCryptoCurrencyById` (throws on miss), `findCryptoCurrencyById` (returns `undefined` on miss) and `hasCryptoCurrencyId`, resolving over the static `CRYPTO_CURRENCIES_REGISTRY` including the legacy alias keys. These let DA-layer and app consumers resolve currencies by id from the domain package directly, matching the legacy `@ledgerhq/cryptoassets` accessor semantics. Extended the domain parity test accordingly.

  Raised the CLI's TypeScript `lib` to `es2022` (was `es2020`, matching desktop and mobile) so it can typecheck domain source that uses ES2022 APIs such as `Object.hasOwn`.

- [#19137](https://github.com/LedgerHQ/ledger-live/pull/19137) [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e) Thanks [@ysitbon](https://github.com/ysitbon)! - chore: make new domain/shared/features packages "born migrated" for knip

  Add an explicit, minimal `package.json#exports` surface (no `./*` wildcard) and a `knip.json` workspace entry to every new `@domain/*`, `@shared/*`, and `@features/*` package, plus an `unimported` script that runs knip scoped to the workspace. This lets dead-code / unused-dependency detection actually analyze these packages and detect zombie top-level source files. Also removes the unused `cn` util and its `clsx` / `tailwind-merge` dependencies from `@features/flow-market-banner` (surfaced by knip).

- [#18867](https://github.com/LedgerHQ/ledger-live/pull/18867) [`7c39ea3`](https://github.com/LedgerHQ/ledger-live/commit/7c39ea39ca8999bcb8ce2294f4884430b6d1b2dc) Thanks [@ysitbon](https://github.com/ysitbon)! - Seed `@domain/entity-currency-crypto` to parity with the legacy `@ledgerhq/cryptoassets` registry and add a CI parity test (in cryptoassets) that fails if the two diverge. The domain registry is now the primary source of truth; both are dual-maintained until legacy is dropped. The generator now dedupes by currency `.id` and removes stale files, so legacy alias/casing keys no longer produce duplicate entries.

- [#19007](https://github.com/LedgerHQ/ledger-live/pull/19007) [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303) Thanks [@ysitbon](https://github.com/ysitbon)! - `setCryptoCurrenciesStore` now accepts an optional `aliases` map (alias key → canonical id) and registers those keys in the injected by-id index, so legacy alias lookups (e.g. `getCryptoCurrencyById("osmosis")`) keep resolving after injection, matching the bundled map. `@domain/entity-currency-crypto` exposes `CRYPTO_CURRENCY_ALIASES` (`osmosis`→`osmo`, `groestlcoin`→`groestcoin`, `lbry`→`LBRY`) for apps to pass at bootstrap.

- [#19007](https://github.com/LedgerHQ/ledger-live/pull/19007) [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303) Thanks [@ysitbon](https://github.com/ysitbon)! - Loosen `LedgerExplorerId` to `string` and mark `CryptoCurrency.explorerId` as `@deprecated` (kept only for backward compatibility; the explorer-id concept is being phased out). The domain crypto registry stays assignable to the legacy `CryptoCurrency` type, so it injects via `setCryptoCurrenciesStore` with no cast.

### Patch Changes

- Updated dependencies [[`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e)]:
  - @domain/entity-currency-unit@0.3.0-next.0
  - @shared/schema-primitives@0.3.0-next.0

## 0.4.0

### Minor Changes

- [#18012](https://github.com/LedgerHQ/ledger-live/pull/18012) [`d149f27`](https://github.com/LedgerHQ/ledger-live/commit/d149f271f18a1727558fa046aa6bc38c391c2649) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: add hedera_testnet

## 0.4.0-next.0

### Minor Changes

- [#18012](https://github.com/LedgerHQ/ledger-live/pull/18012) [`d149f27`](https://github.com/LedgerHQ/ledger-live/commit/d149f271f18a1727558fa046aa6bc38c391c2649) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: add hedera_testnet

## 0.3.0

### Minor Changes

- [#17657](https://github.com/LedgerHQ/ledger-live/pull/17657) [`a61f904`](https://github.com/LedgerHQ/ledger-live/commit/a61f90478795bff6956d2a9083ec47d44e6e9a46) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Trigger Sei app instead of Ethereum app for SEI EVM send & receive

## 0.3.0-next.0

### Minor Changes

- [#17657](https://github.com/LedgerHQ/ledger-live/pull/17657) [`a61f904`](https://github.com/LedgerHQ/ledger-live/commit/a61f90478795bff6956d2a9083ec47d44e6e9a46) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Trigger Sei app instead of Ethereum app for SEI EVM send & receive

## 0.2.0

### Minor Changes

- [#17322](https://github.com/LedgerHQ/ledger-live/pull/17322) [`1368afd`](https://github.com/LedgerHQ/ledger-live/commit/1368afdc7218a68c803672e6e412f8f9f6e62142) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Fix Cronos explorer URLs, update RPC node to Ledger endpoint, and remove broken explorer API link

- [#17137](https://github.com/LedgerHQ/ledger-live/pull/17137) [`2257d43`](https://github.com/LedgerHQ/ledger-live/commit/2257d43630933127549300f39ade1e2b01f94cb8) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore: drop `sonic_blaze` support

## 0.2.0-next.0

### Minor Changes

- [#17322](https://github.com/LedgerHQ/ledger-live/pull/17322) [`1368afd`](https://github.com/LedgerHQ/ledger-live/commit/1368afdc7218a68c803672e6e412f8f9f6e62142) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Fix Cronos explorer URLs, update RPC node to Ledger endpoint, and remove broken explorer API link

- [#17137](https://github.com/LedgerHQ/ledger-live/pull/17137) [`2257d43`](https://github.com/LedgerHQ/ledger-live/commit/2257d43630933127549300f39ade1e2b01f94cb8) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore: drop `sonic_blaze` support

## 0.1.0

### Minor Changes

- [#16799](https://github.com/LedgerHQ/ledger-live/pull/16799) [`9f50129`](https://github.com/LedgerHQ/ledger-live/commit/9f50129d6b4d7769524fcb6cd4f86bd0597418d6) Thanks [@ysitbon](https://github.com/ysitbon)! - Wire SonarQube coverage aggregation for `shared/*` and `domain/entity/*` packages (LIVE-29779): add `coverage` scripts and jest-sonar reporter config, tag the packages via the Nx project-tags plugin, and introduce dedicated `test-shared` / `test-domain` reusable workflows that feed coverage into both the PR and scheduled Sonar scans.

### Patch Changes

- Updated dependencies [[`9f50129`](https://github.com/LedgerHQ/ledger-live/commit/9f50129d6b4d7769524fcb6cd4f86bd0597418d6)]:
  - @shared/schema-primitives@0.2.0
  - @domain/entity-currency-unit@0.2.0

## 0.1.0-next.0

### Minor Changes

- [#16799](https://github.com/LedgerHQ/ledger-live/pull/16799) [`9f50129`](https://github.com/LedgerHQ/ledger-live/commit/9f50129d6b4d7769524fcb6cd4f86bd0597418d6) Thanks [@ysitbon](https://github.com/ysitbon)! - Wire SonarQube coverage aggregation for `shared/*` and `domain/entity/*` packages (LIVE-29779): add `coverage` scripts and jest-sonar reporter config, tag the packages via the Nx project-tags plugin, and introduce dedicated `test-shared` / `test-domain` reusable workflows that feed coverage into both the PR and scheduled Sonar scans.

### Patch Changes

- Updated dependencies [[`9f50129`](https://github.com/LedgerHQ/ledger-live/commit/9f50129d6b4d7769524fcb6cd4f86bd0597418d6)]:
  - @shared/schema-primitives@0.2.0-next.0
  - @domain/entity-currency-unit@0.2.0-next.0
