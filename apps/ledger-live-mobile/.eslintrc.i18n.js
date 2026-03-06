/**
 * ESLint config for i18next/no-literal-string only.
 * Oxlint does not support this rule, so we run it separately via: pnpm mobile lint:i18n
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
