import { defineConfig } from "oxlint";
import {
  ACCOUNT_DATA_SETUP_FILES,
  ACCOUNT_DATA_SOURCES,
  BIGNUMBER_NAMED_IMPORT,
  ELECTRON_CLIPBOARD,
  EXPO_CLIPBOARD,
  LIVE_COMMON_CURRENCY_ACCESSORS,
  LIVE_COMMON_FEATURE_FLAGS,
  LIVE_COMMON_LIB,
  LODASH,
  NAVIGATOR_CLIPBOARD,
  WALLET_FRAMEWORK_CURRENCY_TYPES,
} from "@support/lint/restricted-imports";

export default defineConfig({
  env: { browser: true, es6: true, node: true },
  globals: {
    __DEV__: "readonly",
    INDEX_URL: "readonly",
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
    __APP_VERSION__: "readonly",
    __GIT_REVISION__: "readonly",
    __PRERELEASE__: "readonly",
    __CHANNEL__: "readonly",
    __static: "readonly",
    $: "readonly",
  },
  categories: { correctness: "error", suspicious: "warn", pedantic: "off" },
  plugins: ["eslint", "import", "oxc", "unicorn", "typescript", "react", "jest"],
  ignorePatterns: ["*.min.js", "src/mvvm/hooks/redux.ts", "tests/artifacts/**"],
  rules: {
    "eslint/no-unused-vars": "warn",
    "eslint/no-empty-pattern": "warn",
    "eslint/no-constant-binary-expression": "warn",
    "react/no-did-mount-set-state": "warn",
    "react/globals": "warn",
    "react/immutability": "warn",
    "react/incompatible-library": "warn",
    "react/no-did-update-set-state": "warn",
    "react/preserve-manual-memoization": "warn",
    "react/purity": "warn",
    "react/refs": "warn",
    "react/set-state-in-effect": "warn",
    "react/static-components": "warn",
    "react/use-memo": "warn",
    "react/void-use-memo": "warn",
    "import/namespace": "warn",
    "unicorn/no-useless-fallback-in-spread": "off",
    "unicorn/no-useless-spread": "off",
    "unicorn/no-new-array": "off",
    "unicorn/no-array-sort": "off",
    "unicorn/no-array-reverse": "off",
    "jest/no-conditional-expect": "warn",
    "jest/expect-expect": "warn",
    "jest/require-to-throw-message": "warn",
    "jest/valid-title": "warn",
    "jest/no-disabled-tests": "warn",
    "typescript/no-explicit-any": "error",
    "typescript/no-deprecated": "error",
    "eslint/no-restricted-properties": ["error", NAVIGATOR_CLIPBOARD],
    "import/no-duplicates": "error",
    "import/no-named-as-default": "off",
    "eslint/no-restricted-imports": [
      "error",
      {
        paths: [
          LODASH,
          BIGNUMBER_NAMED_IMPORT,
          EXPO_CLIPBOARD,
          ELECTRON_CLIPBOARD,
          {
            name: "react-redux",
            importNames: ["useSelector", "useDispatch", "useStore"],
            message:
              "Import typed hooks from 'LLD/hooks/redux' instead of 'react-redux' to ensure proper TypeScript typing.",
          },
          {
            name: "i18next",
            importNames: ["default", "t", "i18n"],
            message:
              "The app no longer initialises the i18next global singleton. Import the app instance (or its 't') from '~/renderer/i18n/init'.",
          },
          ...WALLET_FRAMEWORK_CURRENCY_TYPES,
        ],
        patterns: [
          LIVE_COMMON_LIB,
          {
            group: ["~/mvvm/**"],
            message:
              "Use 'LLD' alias instead of '~/mvvm'. Replace '~/mvvm' with 'LLD' in your imports.",
          },
          {
            group: ["**/renderer/families/*/**", "~/renderer/families/*/**"],
            message:
              "families files must not be imported directly. use the bridge or export them through the LLDCoinFamily interface instead.",
          },
          LIVE_COMMON_FEATURE_FLAGS,
          LIVE_COMMON_CURRENCY_ACCESSORS,
          ACCOUNT_DATA_SOURCES,
        ],
      },
    ],
  },
  overrides: [
    {
      files: ["src/main/systemHandlers.ts", "src/main/systemHandlers.test.ts"],
      rules: { "eslint/no-restricted-imports": ["error", { paths: [BIGNUMBER_NAMED_IMPORT] }] },
    },
    {
      files: ACCOUNT_DATA_SETUP_FILES,
      rules: { "eslint/no-restricted-imports": ["error", { paths: [BIGNUMBER_NAMED_IMPORT] }] },
    },
    {
      files: ["src/renderer/families/**"],
      rules: { "eslint/no-restricted-imports": ["error", { paths: [BIGNUMBER_NAMED_IMPORT] }] },
    },
    {
      files: [
        "tests/**/*.ts",
        "tests/**/*.tsx",
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.integration.ts",
        "**/*.integration.tsx",
      ],
      env: { jest: true },
      plugins: ["jest"],
      rules: { "typescript/no-explicit-any": "warn" },
    },
  ],
});
