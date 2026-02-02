"use strict";

const js = require("@eslint/js");
const globals = require("globals");
const tsPluginRaw = require("@typescript-eslint/eslint-plugin/use-at-your-own-risk/raw-plugin");
const jsonPlugin = require("eslint-plugin-json");
const prettierPlugin = require("eslint-plugin-prettier");
const eslintConfigPrettier = require("eslint-config-prettier/flat");

module.exports = [
  // Consolidated ignores (replaces all .eslintignore files; flat config no longer supports them)
  {
    ignores: [
      "**/.*",
      "**/node_modules/**",
      "**/dist/**",
      "**/lib/**",
      "**/lib-es/**",
      "**/build/**",
      "**/coverage/**",
      "**/examples/**",
      "**/scripts/**",
      "**/*.min.js",
      "apps/ledger-live-desktop/src/renderer/families/generated.ts",
      "apps/ledger-live-mobile/src/locales/**",
      "apps/ledger-live-mobile/generated/**",
      "apps/ledger-live-mobile/e2e/bridge/**",
      "apps/ledger-live-mobile/index.d.ts",
      "libs/ledger-live-common/src/families/*/types.js",
      "libs/ledger-live-common/src/generated/**",
      "libs/ledger-live-common/src/load/tokens/**",
      "libs/ledgerjs/packages/cryptoassets/src/data/**",
    ],
  },

  // Base ESLint recommended
  js.configs.recommended,

  // TypeScript: eslint-recommended (disables conflicting core rules) + recommended
  tsPluginRaw.flatConfigs["flat/eslint-recommended"],
  ...tsPluginRaw.flatConfigs["flat/recommended"],

  // Global language options: Node env
  {
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // TypeScript/JavaScript source files: parser, plugin, and shared rules
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.mjs", "**/*.cjs"],
    languageOptions: {
      parser: tsPluginRaw.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPluginRaw.plugin,
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "error",
      "no-inner-declarations": "off",
      "no-unused-vars": "off",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "lodash",
              message: "Use lodash/fp module import style to avoid importing the entire library",
            },
          ],
        },
      ],
      "@typescript-eslint/consistent-type-assertions": ["warn", { assertionStyle: "never" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          ignoreRestSiblings: true,
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
    },
  },

  // Type-aware linting for TS/TSX (exclude tests and mocks)
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/spec.ts",
      "**/spec.tsx",
      "**/__tests__/**",
      "**/tests/**",
      "**/__mocks__/**",
      "**/mocks/**",
    ],
    languageOptions: {
      parser: tsPluginRaw.parser,
      parserOptions: {
        project: true,
      },
    },
    plugins: {
      "@typescript-eslint": tsPluginRaw.plugin,
    },
    rules: {
      "@typescript-eslint/no-deprecated": "warn",
    },
  },

  // JSON files
  {
    files: ["**/*.json"],
    plugins: {
      json: jsonPlugin,
    },
    ...jsonPlugin.configs.recommended,
  },

  // Prettier last to override formatting rules
  eslintConfigPrettier,

  // Allow require() in config files (CommonJS)
  {
    files: ["**/eslint.config.js", "**/*.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];
