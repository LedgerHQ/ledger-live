---
"@ledgerhq/evm-tools": patch
"@ledgerhq/live-common": patch
---

Fix wrong EVM dApp transaction types reported to analytics.

`DAPP_SELECTORS` is a flat merge of 12 per-chain enums, so a later enum silently overwrites an earlier one for the same selector. Two classes of bug were hidden by that:

- `0xba087652` (ERC-4626 `redeem`, i.e. every vault withdrawal / stablecoin redeem) resolved to the typo `"reedeem"`, because a misspelled ETHEREUM entry shadowed the correct BASE one.
- Eight entries resolved to the literal string `"undefined"`, shadowing correct names (`swapOnUniswapFork`, `buyOnUniswapFork`, `multiSwap`, `megaSwap`, `buyOnUniswap`, `buy`, `SimpleBuy`). Removing them restores those names.

Also makes an unrecognised selector reportable: `getTxType` now returns `"unknown"` for call data whose selector is not in the map, instead of `"transfer"`. A transaction with no call data still returns `"transfer"` (it genuinely is one), so only unrecognised *contract calls* change value. Previously a missed staking/DeFi call was indistinguishable from a real ERC-20 transfer, which made the selector-map miss rate unmeasurable.

Adds regression tests pinning the ERC-4626 and ETH-staking (Kiln, Lido) selectors and asserting no selector can resolve to `"undefined"`.
