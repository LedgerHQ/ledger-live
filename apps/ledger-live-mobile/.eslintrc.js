// Common import restrictions
const commonImportRestrictions = [
  {
    group: ["@ledgerhq/live-common/lib/**", "@ledgerhq/live-common/lib-es/**"],
    message: "Please remove the /lib import from live-common import.",
  },
  {
    group: ["~/newArch", "~/newArch/*", "~/newArch/**"],
    message:
      "Use 'LLM' alias instead of '~/newArch'. Replace '~/newArch' with 'LLM' in your imports.",
  },
];

// Lodash import restriction
const lodashImportRestriction = [
  "lodash", // you must use the lodash/fp module import style to avoid importing the entire library
];

// React-redux import restrictions
const reactReduxImportRestrictions = [
  {
    name: "react-redux",
    importNames: ["useSelector", "useDispatch", "useStore"],
    message:
      "Import typed hooks from '~/context/store' instead of 'react-redux' to ensure proper TypeScript typing.",
  },
];

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
        varsIgnorePattern: "^_",
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
        patterns: commonImportRestrictions,
        paths: [...lodashImportRestriction, ...reactReduxImportRestrictions],
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
    "react-hooks/rules-of-hooks": "error", // Checks rules of Hooks
    "react-hooks/exhaustive-deps": [
      "error", // Checks effect dependencies
      {
        additionalHooks: "(useInViewContext|useAnimatedStyle|useDerivedValue|useAnimatedProps)",
      },
    ],
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
      // Allow direct react-redux imports in store.ts where typed hooks are defined
      files: ["src/context/store.ts"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: commonImportRestrictions,
            paths: lodashImportRestriction,
          },
        ],
      },
    },
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
      ],
      rules: {
        "i18next/no-literal-string": "off",
        "no-console": "off",
        // Allow direct react-redux imports in test files for mocking purposes
        "no-restricted-imports": [
          "error",
          {
            patterns: commonImportRestrictions,
            paths: lodashImportRestriction,
          },
        ],
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
    {
      // Enable type-aware linting for TypeScript files only
      files: ["*.ts", "*.tsx"],
      excludedFiles: ["src/mocks/**"],
      parserOptions: {
        project: true,
      },
      rules: {
        "@typescript-eslint/no-deprecated": "error",
      },
    },
  ],
};
