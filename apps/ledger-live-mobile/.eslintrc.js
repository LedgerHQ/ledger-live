module.exports = {
  env: {
    node: true,
    browser: true,
    es6: true,
  },
  globals: {
    __DEV__: "readonly",
    __REDUX_DEVTOOLS_EXTENSION__: "readonly",
  },
  parser: "@typescript-eslint/parser",
  plugins: ["react", "react-hooks", "i18next", "jsx-a11y"],
  extends: [
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:import/typescript",
    "plugin:jsx-a11y/recommended",
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        vars: "all",
        args: "after-used",
        ignoreRestSiblings: true,
      },
    ],
    "no-undef": "off",
    "no-shadow": "off",
    "no-catch-shadow": "off",
    "no-console": [
      "error",
      {
        allow: ["warn", "error"],
      },
    ],
    "no-unsafe-optional-chaining": "off",
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@ledgerhq/live-common/lib/*"],
            message: '🚨 Please when importing from live-common, remove the "/lib/" in the path 🚨',
          },
        ],
      },
    ],
    "i18next/no-literal-string": [
      "error",
      {
        "jsx-components": {
          include: [],
          exclude: [],
        },
        words: {
          // Maybe move this to a separate file if it becomes too large.
          exclude: [
            "\\s*[A-Z0-9≈•%!-:-@[-`{-~\\s]+\\s*",
            "\\s #LedgerLiveApp\\s*",
            "\\s*ledger.com/academy\\s*",
            "Baking Bad",
          ],
        },
      },
    ],
    "react-native/no-inline-styles": "off",
    "react/display-name": "off",
    "react/jsx-key": "warn", // TODO: delete to make it an error when we are ready
    "react/prop-types": "off",
    "jsx-a11y/no-autofocus": "off",
    "jsx-a11y/anchor-is-valid": [
      "error",
      {
        components: [],
      },
    ],
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  overrides: [
    {
      files: [
        "src/**/*.test.{ts,tsx}",
        "src/screens/Settings/Debug/**/*",
        "src/screens/FeatureFlagsSettings/**/*",
        "src/components/AnalyticsConsole/**/*",
        "src/components/StorylyStories/**/*",
        "src/screens/Settings/Experimental/**/*",
        "src/components/PerformanceConsole/**/*",
        "src/components/CustomImage/TestImage.tsx",
        "**/*Mock*",
      ],
      rules: {
        "i18next/no-literal-string": "off",
        "no-console": "off",
      },
    },
    {
      files: ["**/jest.config.js", "**/jest-setup.js", "**/e2e/**"],
      env: {
        jest: true,
      },
      rules: {
        "@typescript-eslint/no-var-requires": "off",
      },
    },
  ],
};
