// Private libraries that CI calls `build` on by name, keyed by project root, each with the CI job
// that calls it. See CHECKS["no-build"] in source-only.mjs.

const LIVE_COMMON =
  "`nx run @ledgerhq/live-common:build` in the test-bridge-pr, test-integration, " +
  "test-integration-pr and test-integration-weekly workflows and the monitor composite";

const COIN_TESTER =
  "`nx run-many -t build --projects=tag:type:coin-tester` in setup-coin-tester-env";

/** @type {Record<string, string>} */
export const SOURCE_ONLY_ENTRY_POINTS = {
  "libs/coin-tester": COIN_TESTER,
  "libs/coin-tester-modules/coin-tester-aleo": COIN_TESTER,
  "libs/coin-tester-modules/coin-tester-bitcoin": COIN_TESTER,
  "libs/coin-tester-modules/coin-tester-cardano": COIN_TESTER,
  "libs/coin-tester-modules/coin-tester-casper": COIN_TESTER,
  "libs/coin-tester-modules/coin-tester-cosmos": COIN_TESTER,
  "libs/coin-tester-modules/coin-tester-evm": COIN_TESTER,
  "libs/coin-tester-modules/coin-tester-internet_computer": COIN_TESTER,
  "libs/coin-tester-modules/coin-tester-kaspa": COIN_TESTER,
  "libs/coin-tester-modules/coin-tester-multiversx": COIN_TESTER,
  "libs/coin-tester-modules/coin-tester-near": COIN_TESTER,
  "libs/coin-tester-modules/coin-tester-polkadot": COIN_TESTER,
  "libs/coin-tester-modules/coin-tester-solana": COIN_TESTER,
  "libs/coin-tester-modules/coin-tester-stacks": COIN_TESTER,
  "libs/coin-tester-modules/coin-tester-stellar": COIN_TESTER,
  "libs/coin-tester-modules/coin-tester-tezos": COIN_TESTER,
  "libs/coin-tester-modules/coin-tester-ton": COIN_TESTER,
  "libs/coin-tester-modules/coin-tester-tron": COIN_TESTER,
  "libs/coin-tester-modules/coin-tester-vechain": COIN_TESTER,
  "libs/coin-tester-modules/coin-tester-xrp": COIN_TESTER,
  "libs/coin-tester-modules/coin-tester-zcash": COIN_TESTER,
  "libs/ledger-live-common": LIVE_COMMON,
};
