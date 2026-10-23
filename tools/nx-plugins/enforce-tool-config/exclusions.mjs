// Packages the conformance rules do not check yet, keyed by a directory: an entry covers that
// directory and every package below it.
//
// `rules` names the rules an entry exempts the subtree from. A rule added before every package
// conforms adds entries scoped to it, and its tool migration deletes them. Give every entry an exit
// condition. A PERMANENT entry records a decision to keep a config as it is: its exit condition
// says when to revisit that decision.

const LINT_LEAVES =
  "keep their own oxlint config, which no support/lint preset reproduces yet. Exit condition: " +
  "the subtree moves onto its layer's preset and its config is deleted.";

const PERMANENT_LEAF =
  "PERMANENT: a leaf config with one consumer, which a preset would only wrap. Exit condition: " +
  "revisit when a second package needs the same config.";

// The jest rule: consumers of @support/jest whose config does not come out of a preset factory.
const JEST_ESM_HELPER_ONLY =
  "TEMPORARY. A hand-rolled jest config that only takes withEsmDeps from @support/jest/shared. " +
  "Exit condition: the package builds its config with a preset factory, or stops depending on " +
  "@support/jest.";

/** @type {Record<string, { rules: string[], reason: string }>} */
export const EXCLUSIONS = {
  apps: {
    rules: ["lint", "tsconfig"],
    reason:
      `lint: the applications keep their own oxlint config. ${PERMANENT_LEAF} ` +
      "tsconfig: TEMPORARY. Application configs carry bundler, platform and build settings no " +
      "preset covers yet. Exit condition: an application archetype in @support/tsconfig, then " +
      "each application moved onto it.",
  },
  "apps/web-tools": {
    rules: ["jest"],
    reason:
      "A jsdom app config that only takes withEsmDeps from @support/jest/shared. " + PERMANENT_LEAF,
  },
  e2e: {
    rules: ["lint", "tsconfig"],
    reason:
      `lint: the end-to-end suites keep their own oxlint config. ${PERMANENT_LEAF} ` +
      "tsconfig: TEMPORARY. End-to-end suites run their own TypeScript setups (Playwright, " +
      "Detox). Exit condition: the suites moved onto a @support/tsconfig preset.",
  },
  "features/platform/app-lock": {
    rules: ["jest"],
    reason:
      "TEMPORARY. A features/platform package: it hand-rolls a node project and borrows the " +
      "native project of @support/jest/features-flow for its UI folders. Exit condition: a preset " +
      "covers features/platform packages.",
  },
  "libs/coin-modules/coin-bitcoin": { rules: ["jest"], reason: JEST_ESM_HELPER_ONLY },
  "libs/coin-modules/coin-zcash": { rules: ["jest"], reason: JEST_ESM_HELPER_ONLY },
  "libs/ledger-live-common": {
    rules: ["lint", "tsconfig"],
    reason:
      `TEMPORARY. lint: live-common and its tools ${LINT_LEAVES} ` +
      "tsconfig: a composite project rooted at the package directory, with a nested src/ " +
      "project that references it; no lib preset emits from that layout. Exit condition: the " +
      "package builds from src/ like the other libs, then extends @support/tsconfig/lib.",
  },
  "libs/ledgerjs": {
    rules: ["lint", "tsconfig", "jest"],
    reason:
      `TEMPORARY. lint: the ledgerjs packages ${LINT_LEAVES} ` +
      "tsconfig: the 22 ledgerjs packages extend the shared libs/ledgerjs/tsconfig.json across " +
      "package boundaries; moving them onto the lib preset would spell its six options out in " +
      "each package. Exit condition: those options are dropped or folded into a preset, then " +
      "each package extends @support/tsconfig/lib. " +
      "jest: their jest config only takes withEsmDeps from @support/jest/shared. Exit " +
      "condition: it is built by a preset factory.",
  },
  "libs/ui": {
    rules: ["lint", "tsconfig"],
    reason:
      `TEMPORARY. lint: the legacy UI packages ${LINT_LEAVES} ` +
      "tsconfig: the design-system packages carry their own layouts: icons generates src/ and " +
      "emits next to it, react builds ES2019 with preserveSymlinks, native extends nothing and " +
      "shared emits without rootDir. Exit condition: each package builds from src/ to lib/ and " +
      "extends a @support/tsconfig preset.",
  },
  "libs/wallet-btc": {
    rules: ["jest"],
    reason:
      "TEMPORARY. Its jest configs only take withEsmDeps from @support/jest/shared. Exit " +
      "condition: they are built by a preset factory.",
  },
  tests: {
    rules: ["lint", "tsconfig"],
    reason:
      `lint: the test apps keep their own oxlint config. ${PERMANENT_LEAF} ` +
      "tsconfig: TEMPORARY. The dummy apps the end-to-end suites load are standalone web apps " +
      "with their own compiler options. Exit condition: they move onto a @support/tsconfig preset " +
      "with the e2e suites.",
  },
  tools: {
    rules: ["tsconfig"],
    reason:
      "TEMPORARY. Repository tooling runs as Node scripts on the NodeNext defaults, which no " +
      "package preset targets. Exit condition: a node tooling archetype in @support/tsconfig, " +
      "then each tool moved onto it.",
  },
  "libs/coin-tester-modules": {
    rules: ["tsconfig"],
    reason:
      "TEMPORARY. The coin testers are composite projects, half of them typechecked with bundler " +
      "resolution and built with NodeNext, which no preset reproduces. Exit condition: a preset " +
      "for them in @support/tsconfig, then each coin tester moved onto it.",
  },
};
