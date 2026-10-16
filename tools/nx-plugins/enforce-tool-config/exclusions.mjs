// Packages the conformance rules do not check yet, keyed by a directory: an entry covers that
// directory and every package below it.
//
// `rules` scopes an entry to the named rules; without it the entry exempts the subtree from every
// rule. Each tool migration narrows or deletes the entries it makes obsolete, so this file shrinks
// to nothing. Give every entry an exit condition.

// The jest rule: consumers of @support/jest whose config does not come out of a preset factory.
const JEST_ESM_HELPER_ONLY =
  "TEMPORARY. A hand-rolled jest config that only takes withEsmDeps from @support/jest/shared. " +
  "Exit condition: the package builds its config with a preset factory, or stops depending on " +
  "@support/jest.";
const JEST_FLOW_NATIVE_ONLY =
  "TEMPORARY. Native-only tests: the config drops the web project from createFlowJestConfig() " +
  "instead of passing overrides. Exit condition: @support/jest/features-flow offers a native-only " +
  "factory, as @support/jest/shared does with createSharedUiNativeJestConfig.";

/** @type {Record<string, { rules?: string[], reason: string }>} */
export const EXCLUSIONS = {
  apps: {
    reason:
      "TEMPORARY. Application configs are out of scope of the support/ migration: they carry " +
      "bundler, platform and build settings no preset covers yet. Exit condition: each tool " +
      "migration that moves the apps onto its preset removes them from this entry.",
  },
  e2e: {
    reason:
      "TEMPORARY. End-to-end suites run their own jest, lint and TypeScript setups (Playwright, " +
      "Detox). Exit condition: each tool migration that moves the suites onto its preset removes " +
      "them from this entry.",
  },
  libs: {
    reason:
      "TEMPORARY. Legacy libraries keep hand-rolled configs, down to one jest config per coin " +
      "module. Exit condition: each tool migration that moves libs/ onto its " +
      "preset scopes this entry away from that tool's rule, then the entry is deleted.",
  },
  "apps/web-tools": { rules: ["jest"], reason: JEST_ESM_HELPER_ONLY },
  "features/flow/app-availability": {
    rules: ["jest"],
    reason:
      "TEMPORARY. The config edits the projects createFlowJestConfig() returns, adding a web " +
      "setup file and a native module mapping. Exit condition: the features-flow factory takes " +
      "per-project overrides.",
  },
  "features/flow/app-longer-password": { rules: ["jest"], reason: JEST_FLOW_NATIVE_ONLY },
  "features/flow/app-password-removal": { rules: ["jest"], reason: JEST_FLOW_NATIVE_ONLY },
  "features/flow/app-password-setup": { rules: ["jest"], reason: JEST_FLOW_NATIVE_ONLY },
  "features/flow/app-protection-prompt": { rules: ["jest"], reason: JEST_FLOW_NATIVE_ONLY },
  "features/flow/app-unlock": { rules: ["jest"], reason: JEST_FLOW_NATIVE_ONLY },
  "features/platform/app-lock": {
    rules: ["jest"],
    reason:
      "TEMPORARY. A features/platform package: it hand-rolls a node project and borrows the " +
      "native project of @support/jest/features-flow for its UI folders. Exit condition: a preset " +
      "covers features/platform packages.",
  },
  "libs/coin-modules/coin-bitcoin": { rules: ["jest"], reason: JEST_ESM_HELPER_ONLY },
  "libs/ledgerjs": { rules: ["jest"], reason: JEST_ESM_HELPER_ONLY },
  "libs/live-signer-celo": { rules: ["jest"], reason: JEST_ESM_HELPER_ONLY },
  "libs/live-signer-evm": { rules: ["jest"], reason: JEST_ESM_HELPER_ONLY },
  "libs/transaction-observability": { rules: ["jest"], reason: JEST_ESM_HELPER_ONLY },
};
