// Packages that do not meet the strictness of their preset yet. A package tsconfig may set one of
// the RELAXATIONS, to its relaxed value, only while this list names the option for that file.
//
// This list only shrinks. The tsconfig rule reports an entry the config no longer relaxes, so
// fixing a package means deleting its entry here.

/** The relaxations of its preset a package may carry, with the only value allowed. */
export const RELAXATIONS = {
  noImplicitAny: false,
  noImplicitThis: false,
  isolatedModules: false,
  // @support/tsconfig/coin. The coin modules listed below compile the sources of npm releases of
  // @ledgerhq packages (hw-transport, logs, live-config, live-currency-format) through the
  // @ledgerhq/source condition, and those sources do not pass it. Exit condition: they resolve
  // the workspace packages, or releases that pass it.
  exactOptionalPropertyTypes: false,
};

// A package typechecks the sources of the private libs it imports with its own options, so it
// cannot be stricter than them. The entries marked "reads live-common" compile live-common's
// sources, which are not noImplicitAny clean. Exit condition: live-common meets noImplicitAny.
const READS_LIVE_COMMON = ["noImplicitAny"];

/** @type {Record<string, string[]>} repo-relative config path to the relaxations it may set */
export const TSCONFIG_DEBT = {
  "libs/asset-detail/tsconfig.json": READS_LIVE_COMMON,
  "libs/coin-modules/coin-cardano/tsconfig.json": ["exactOptionalPropertyTypes"],
  "libs/coin-modules/coin-icon/tsconfig.json": ["exactOptionalPropertyTypes"],
  "libs/coin-modules/coin-kaspa/tsconfig.json": ["exactOptionalPropertyTypes"],
  "libs/coin-modules/coin-stacks/tsconfig.json": ["exactOptionalPropertyTypes", "noImplicitAny"],
  "libs/coin-modules/coin-ton/tsconfig.json": ["exactOptionalPropertyTypes"],
  "libs/coin-modules/coin-tron/tsconfig.json": ["exactOptionalPropertyTypes"],
  "libs/coin-modules-monitoring/tsconfig.json": READS_LIVE_COMMON,
  "libs/deeplink-module/tsconfig.json": ["noImplicitAny", "noImplicitThis"],
  "libs/ethereum-provider/tsconfig.json": ["noImplicitAny", "noImplicitThis"],
  "libs/exchange-module/tsconfig.json": ["noImplicitAny", "noImplicitThis"],
  "libs/feature-flag-module/tsconfig.json": ["noImplicitAny", "noImplicitThis"],
  "libs/hw-transport-http/tsconfig.json": ["noImplicitAny", "noImplicitThis", "isolatedModules"],
  "libs/live-e2e-shared/tsconfig.json": ["noImplicitAny", "noImplicitThis"],
  "libs/live-send/tsconfig.json": READS_LIVE_COMMON,
  "libs/live-signer-aleo/tsconfig.json": ["noImplicitAny", "noImplicitThis"],
  "libs/live-signer-canton/tsconfig.json": ["noImplicitAny", "noImplicitThis"],
  "libs/live-signer-celo/tsconfig.json": ["noImplicitAny", "noImplicitThis"],
  "libs/live-signer-concordium/tsconfig.json": ["noImplicitAny", "noImplicitThis"],
  "libs/live-signer-cosmos/tsconfig.json": ["noImplicitAny", "noImplicitThis"],
  "libs/live-signer-evm/tsconfig.json": ["noImplicitAny", "noImplicitThis"],
  "libs/live-signer-hyperliquid/tsconfig.json": ["noImplicitAny", "noImplicitThis"],
  "libs/live-signer-icp/tsconfig.json": ["noImplicitAny", "noImplicitThis"],
  "libs/live-signer-polkadot/tsconfig.json": ["noImplicitAny", "noImplicitThis"],
  "libs/live-signer-solana/tsconfig.json": ["noImplicitAny", "noImplicitThis"],
  "libs/live-signer-tron/tsconfig.json": ["noImplicitAny", "noImplicitThis"],
  "libs/live-signer-xrp/tsconfig.json": ["noImplicitAny", "noImplicitThis"],
  "libs/live-signer-zcash/tsconfig.json": ["noImplicitAny", "noImplicitThis"],
  "libs/types-devices/tsconfig.json": ["noImplicitAny", "noImplicitThis", "isolatedModules"],
  "libs/types-live/tsconfig.json": ["noImplicitAny", "noImplicitThis", "isolatedModules"],
};
