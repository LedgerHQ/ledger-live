// Rules that need excludedFiles or complex selectors (not supported in oxlint).
// Run: eslint --no-eslintrc -c .eslintrc.guardrails.js src __tests__

// Blocks named re-introductions of feature-flag hooks/data from live-common's barrel.
// Hooks/components live in @features/platform-feature-flags; actions/selectors/types/constants
// live in @shared/feature-flags. Pure utilities (formatDefaultFeatures, formatToFirebaseFeatureId,
// isRecoverDisplayed, etc.) and subpath imports (featureFlags/stakePrograms, featureFlags/mock)
// remain on live-common.
const featureFlagsRestrictions = {
  patterns: [
    {
      group: [
        "@ledgerhq/live-common/featureFlags",
        "@ledgerhq/live-common/featureFlags/index",
        "@ledgerhq/live-common/featureFlags/FeatureFlagsContext",
        "@ledgerhq/live-common/featureFlags/walletFeaturesConfig/*",
        "@ledgerhq/live-common/featureFlags/defaultFeatures",
        "@ledgerhq/live-common/featureFlags/groupedFeatures",
      ],
      importNamePattern:
        "^(useFeature|useFeatureFlags|useHasLocallyOverriddenFeatureFlags|useWalletFeaturesConfig|FeatureToggle|DEFAULT_FEATURES|groupedFeatures|GroupedFeature)$",
      message:
        "Use @features/platform-feature-flags for hooks/FeatureToggle, @shared/feature-flags for actions/selectors/types/constants (e.g. FEATURE_FLAGS_DEFAULTS, groupedFeatures, GroupedFeature).",
    },
  ],
};

module.exports = {
  env: { browser: true, es2022: true, node: true },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 2022,
    sourceType: "module",
  },
  noInlineConfig: true,
  overrides: [
    {
      files: ["src/**/*.ts", "src/**/*.tsx", "__tests__/**/*.ts", "__tests__/**/*.tsx"],
      rules: {
        "no-restricted-imports": ["error", featureFlagsRestrictions],
      },
    },
  ],
};
