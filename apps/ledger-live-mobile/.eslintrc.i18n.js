/**
 * ESLint config containing ONLY rules NOT available in oxlint.
 */
module.exports = {
  root: true,
  noInlineConfig: true,
  env: { node: true, browser: true, es6: true },
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } },
  plugins: ["i18next"],
  rules: {
    "i18next/no-literal-string": [
      "error",
      {
        "jsx-components": { include: [], exclude: [] },
        words: {
          exclude: [
            "\\s*[A-Z0-9≈•%!-:-@[-`{-~\\s]+\\s*",
            "\\s #LedgerLiveApp\\s*",
            "\\s*ledger.com/academy\\s*",
            "Baking Bad",
            "&minus;",
            "−",
          ],
        },
      },
    ],
  },
  overrides: [
    {
      files: [
        "src/**/*.test.{ts,tsx}",
        "src/screens/Settings/Debug/**/*",
        "src/screens/FeatureFlagsSettings/**/*",
        "src/components/AnalyticsConsole/**/*",
        "src/screens/Settings/Experimental/**/*",
        "src/components/PerformanceConsole/**/*",
        "src/components/CustomImage/TestImage.tsx",
        /**
         * TODO(LIVE-29434): drop this entry once the polished, translated DIE
         * initializer view ships and replaces this debug-quality view.
         */
        "src/mvvm/components/DeviceIntentExecutor/DeviceContextInitializerComponentLWM/DeviceContextInitializerComponentLWMView.tsx",
        "**/*Mock*",
        "__tests__/**/*",
        "e2e/**/*",
      ],
      rules: { "i18next/no-literal-string": "off" },
    },
  ],
  ignorePatterns: [
    "node_modules",
    "src/locales",
    "generated",
    "scripts",
    "e2e/bridge",
    "*.min.js",
  ],
};
