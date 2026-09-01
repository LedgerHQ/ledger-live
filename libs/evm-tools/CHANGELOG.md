# @ledgerhq/evm-tools

## 1.14.2-next.0

### Patch Changes

- Updated dependencies [[`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/live-env@3.2.0-next.0

## 1.14.1

### Patch Changes

- Updated dependencies [[`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/live-env@3.1.0

## 1.14.1-next.0

### Patch Changes

- Updated dependencies [[`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/live-env@3.1.0-next.0

## 1.14.0

### Minor Changes

- [#20363](https://github.com/LedgerHQ/ledger-live/pull/20363) [`f5b2359`](https://github.com/LedgerHQ/ledger-live/commit/f5b2359ce6aa655b9e39d87c9925cb7469da248c) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Fix wrong EVM dApp transaction types reported to analytics.

  `DAPP_SELECTORS` is a flat merge of 12 per-chain enums, so a later enum silently overwrites an earlier one for the same selector. Two classes of bug were hidden by that:

  - `0xba087652` (ERC-4626 `redeem`, i.e. every vault withdrawal / stablecoin redeem) resolved to the typo `"reedeem"`, because a misspelled ETHEREUM entry shadowed the correct BASE one.
  - Eight entries resolved to the literal string `"undefined"`, shadowing correct names (`swapOnUniswapFork`, `buyOnUniswapFork`, `multiSwap`, `megaSwap`, `buyOnUniswap`, `buy`, `SimpleBuy`). Removing them restores those names.

  Also makes an unrecognised selector reportable: `getTxType` now returns `"unknown"` for call data whose selector is not in the map, instead of `"transfer"`. A transaction with no call data still returns `"transfer"` (it genuinely is one), so only unrecognised _contract calls_ change value. Previously a missed staking/DeFi call was indistinguishable from a real ERC-20 transfer, which made the selector-map miss rate unmeasurable.

  Adds regression tests pinning the ERC-4626 and ETH-staking (Kiln, Lido) selectors and asserting no selector can resolve to `"undefined"`.

## 1.14.0-next.0

### Minor Changes

- [#20363](https://github.com/LedgerHQ/ledger-live/pull/20363) [`f5b2359`](https://github.com/LedgerHQ/ledger-live/commit/f5b2359ce6aa655b9e39d87c9925cb7469da248c) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Fix wrong EVM dApp transaction types reported to analytics.

  `DAPP_SELECTORS` is a flat merge of 12 per-chain enums, so a later enum silently overwrites an earlier one for the same selector. Two classes of bug were hidden by that:

  - `0xba087652` (ERC-4626 `redeem`, i.e. every vault withdrawal / stablecoin redeem) resolved to the typo `"reedeem"`, because a misspelled ETHEREUM entry shadowed the correct BASE one.
  - Eight entries resolved to the literal string `"undefined"`, shadowing correct names (`swapOnUniswapFork`, `buyOnUniswapFork`, `multiSwap`, `megaSwap`, `buyOnUniswap`, `buy`, `SimpleBuy`). Removing them restores those names.

  Also makes an unrecognised selector reportable: `getTxType` now returns `"unknown"` for call data whose selector is not in the map, instead of `"transfer"`. A transaction with no call data still returns `"transfer"` (it genuinely is one), so only unrecognised _contract calls_ change value. Previously a missed staking/DeFi call was indistinguishable from a real ERC-20 transfer, which made the selector-map miss rate unmeasurable.

  Adds regression tests pinning the ERC-4626 and ETH-staking (Kiln, Lido) selectors and asserting no selector can resolve to `"undefined"`.

## 1.13.2

### Patch Changes

- Updated dependencies [[`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010)]:
  - @ledgerhq/live-env@3.0.0

## 1.13.2-next.0

### Patch Changes

- Updated dependencies [[`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010)]:
  - @ledgerhq/live-env@3.0.0-next.0

## 1.13.1

### Patch Changes

- Updated dependencies [[`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003)]:
  - @ledgerhq/live-env@2.42.0

## 1.13.1-next.0

### Patch Changes

- Updated dependencies [[`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003)]:
  - @ledgerhq/live-env@2.42.0-next.0

## 1.13.0

### Minor Changes

- [#18814](https://github.com/LedgerHQ/ledger-live/pull/18814) [`fa0123a`](https://github.com/LedgerHQ/ledger-live/commit/fa0123a1da7b053d58afab498266cf830958e2ff) Thanks [@ysitbon](https://github.com/ysitbon)! - Migrate remaining lint scripts from ESLint to oxlint and drop Prettier (oxfmt is now the sole formatter)

### Patch Changes

- Updated dependencies [[`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11)]:
  - @ledgerhq/live-env@2.41.0

## 1.13.0-next.0

### Minor Changes

- [#18814](https://github.com/LedgerHQ/ledger-live/pull/18814) [`fa0123a`](https://github.com/LedgerHQ/ledger-live/commit/fa0123a1da7b053d58afab498266cf830958e2ff) Thanks [@ysitbon](https://github.com/ysitbon)! - Migrate remaining lint scripts from ESLint to oxlint and drop Prettier (oxfmt is now the sole formatter)

### Patch Changes

- Updated dependencies [[`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11)]:
  - @ledgerhq/live-env@2.41.0-next.0

## 1.12.11

### Patch Changes

- Updated dependencies [[`13aeeb6`](https://github.com/LedgerHQ/ledger-live/commit/13aeeb6186997b433785e542ed1dafa6afde2267), [`798081d`](https://github.com/LedgerHQ/ledger-live/commit/798081db3e427c8d2d09930ceb836703146ca1ba)]:
  - @ledgerhq/live-env@2.40.0

## 1.12.11-next.0

### Patch Changes

- Updated dependencies [[`13aeeb6`](https://github.com/LedgerHQ/ledger-live/commit/13aeeb6186997b433785e542ed1dafa6afde2267), [`798081d`](https://github.com/LedgerHQ/ledger-live/commit/798081db3e427c8d2d09930ceb836703146ca1ba)]:
  - @ledgerhq/live-env@2.40.0-next.0

## 1.12.10

### Patch Changes

- Updated dependencies [[`81ceb34`](https://github.com/LedgerHQ/ledger-live/commit/81ceb347c0b2167358c601a9922e2c7fa14a845b), [`9ab3a61`](https://github.com/LedgerHQ/ledger-live/commit/9ab3a6157abb3a382c3157eb292ce9d9d2c6df93), [`eb1dae8`](https://github.com/LedgerHQ/ledger-live/commit/eb1dae8fc14ff8e0bc1e1ce040712492a0328451)]:
  - @ledgerhq/live-env@2.39.0

## 1.12.10-next.0

### Patch Changes

- Updated dependencies [[`81ceb34`](https://github.com/LedgerHQ/ledger-live/commit/81ceb347c0b2167358c601a9922e2c7fa14a845b), [`9ab3a61`](https://github.com/LedgerHQ/ledger-live/commit/9ab3a6157abb3a382c3157eb292ce9d9d2c6df93), [`eb1dae8`](https://github.com/LedgerHQ/ledger-live/commit/eb1dae8fc14ff8e0bc1e1ce040712492a0328451)]:
  - @ledgerhq/live-env@2.39.0-next.0

## 1.12.9

### Patch Changes

- Updated dependencies [[`b14d5cc`](https://github.com/LedgerHQ/ledger-live/commit/b14d5cc29cc75c6be2e565db3d4d0ab400cc56d9), [`ec38133`](https://github.com/LedgerHQ/ledger-live/commit/ec38133ab6b2c18d329e1c78320b7c2a1f80fbfc)]:
  - @ledgerhq/live-env@2.38.0

## 1.12.9-next.0

### Patch Changes

- Updated dependencies [[`b14d5cc`](https://github.com/LedgerHQ/ledger-live/commit/b14d5cc29cc75c6be2e565db3d4d0ab400cc56d9), [`ec38133`](https://github.com/LedgerHQ/ledger-live/commit/ec38133ab6b2c18d329e1c78320b7c2a1f80fbfc)]:
  - @ledgerhq/live-env@2.38.0-next.0

## 1.12.8

### Patch Changes

- Updated dependencies [[`5fc817a`](https://github.com/LedgerHQ/ledger-live/commit/5fc817a5ee316396a327e5b10eccd8314bfb2df5), [`65f87d9`](https://github.com/LedgerHQ/ledger-live/commit/65f87d938ac4158e0ae706593d2a46561097f5a9)]:
  - @ledgerhq/live-env@2.37.0

## 1.12.8-next.0

### Patch Changes

- Updated dependencies [[`5fc817a`](https://github.com/LedgerHQ/ledger-live/commit/5fc817a5ee316396a327e5b10eccd8314bfb2df5), [`65f87d9`](https://github.com/LedgerHQ/ledger-live/commit/65f87d938ac4158e0ae706593d2a46561097f5a9)]:
  - @ledgerhq/live-env@2.37.0-next.0

## 1.12.7

### Patch Changes

- Updated dependencies [[`2eabd7f`](https://github.com/LedgerHQ/ledger-live/commit/2eabd7f56680e1399926a96b4bdeaf628e435999)]:
  - @ledgerhq/live-env@2.36.0

## 1.12.7-next.0

### Patch Changes

- Updated dependencies [[`2eabd7f`](https://github.com/LedgerHQ/ledger-live/commit/2eabd7f56680e1399926a96b4bdeaf628e435999)]:
  - @ledgerhq/live-env@2.36.0-next.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
