// Packages that break a source-only check and cannot be fixed yet, keyed by project root. An entry
// silences the checks it names for that package only, and says when it goes away.
//
// This list only shrinks. The source-only rule reports an entry the package no longer needs, so
// fixing a package means deleting its entry here.

const READS_PUBLISHED_FROM_SOURCE =
  "Its Jest config sets the @ledgerhq/source condition so the published @ledgerhq packages it " +
  "tests against are read from src instead of their build. Exit condition: the tests run " +
  "against the built packages, or those packages are no longer published.";

const COIN_TESTER_READING_SOURCE = {
  checks: /** @type {const} */ (["no-source-condition"]),
  reason: READS_PUBLISHED_FROM_SOURCE,
};

/**
 * @type {Record<string, {
 *   checks: readonly (keyof typeof import("./source-only.mjs").CHECKS)[],
 *   reason: string,
 * }>}
 */
export const SOURCE_ONLY_DEBT = {
  "apps/cli": {
    checks: ["published-deps"],
    reason:
      "PERMANENT: the CLI is published as one rslib bundle that inlines its workspace " +
      "dependencies, and its build script strips them from the published manifest. Exit " +
      "condition: revisit if the CLI stops bundling its dependencies.",
  },
  "libs/coin-modules-monitoring": {
    checks: ["no-build", "exports-to-src"],
    reason:
      "A runnable CLI, not a library: its build produces the lib/cli.js its `start` script runs " +
      "to monitor the coin modules. Exit condition: it runs from src (e.g. through a TypeScript " +
      "loader) or moves under apps/.",
  },
  "libs/coin-modules/coin-zcash": {
    checks: ["published-deps"],
    reason:
      "This published coin module depends on the private @ledgerhq/live-signer-zcash, which " +
      "keeps its build for it. Exit condition: live-signer-zcash is published, or coin-zcash " +
      "stops depending on it.",
  },
  "libs/coin-tester-modules/coin-tester-aleo": COIN_TESTER_READING_SOURCE,
  "libs/coin-tester-modules/coin-tester-bitcoin": COIN_TESTER_READING_SOURCE,
  "libs/coin-tester-modules/coin-tester-cardano": COIN_TESTER_READING_SOURCE,
  "libs/coin-tester-modules/coin-tester-casper": COIN_TESTER_READING_SOURCE,
  "libs/coin-tester-modules/coin-tester-cosmos": COIN_TESTER_READING_SOURCE,
  "libs/coin-tester-modules/coin-tester-internet_computer": COIN_TESTER_READING_SOURCE,
  "libs/coin-tester-modules/coin-tester-kaspa": COIN_TESTER_READING_SOURCE,
  "libs/coin-tester-modules/coin-tester-stacks": COIN_TESTER_READING_SOURCE,
  "libs/coin-tester-modules/coin-tester-ton": COIN_TESTER_READING_SOURCE,
  "libs/coin-tester-modules/coin-tester-vechain": COIN_TESTER_READING_SOURCE,
  "libs/coin-tester-modules/coin-tester-zcash": COIN_TESTER_READING_SOURCE,
  "libs/ethereum-provider": {
    checks: ["no-build", "exports-to-src"],
    reason:
      "Its build produces the UMD bundle (and its JSON wrapper) that live apps inject into " +
      "webviews, which src cannot replace. Exit condition: the bundle is produced by its " +
      "consumer, or the package is published.",
  },
  "libs/live-signer-evm": {
    checks: ["no-source-condition"],
    reason: READS_PUBLISHED_FROM_SOURCE,
  },
  "libs/live-signer-tron": {
    checks: ["no-source-condition"],
    reason: READS_PUBLISHED_FROM_SOURCE,
  },
  "libs/live-signer-zcash": {
    checks: ["no-build", "exports-to-src"],
    reason:
      "The published @ledgerhq/coin-zcash depends on it, so it ships a build its npm consumers " +
      "can load. Exit condition: it is published, or coin-zcash stops depending on it.",
  },
  "libs/ui/packages/icons": {
    checks: ["no-build"],
    reason:
      "Its build is codegen: it generates the React and React Native components under src from " +
      "the SVG sources. Exit condition: the generated components are committed, or the codegen " +
      'moves to a target that is not named "build".',
  },
};
