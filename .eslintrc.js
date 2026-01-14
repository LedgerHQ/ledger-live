module.exports = {
  root: true,
  env: {
    node: true,
  },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "json"],
  extends: [
    "eslint:recommended",
    "plugin:prettier/recommended",
    "plugin:json/recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  rules: {
    "prettier/prettier": "error",
    "no-inner-declarations": "off",
    // Enables no-unused-vars only from TypeScript
    "no-unused-vars": "off",
    "no-restricted-imports": [
      2,
      {
        paths: [
          "lodash", // you must use the lodash/fp module import style to avoid importing the entire library
        ],
      },
    ],
    "@typescript-eslint/consistent-type-assertions": [
      "warn",
      {
        assertionStyle: "never",
      },
    ],
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

    // Will be removed once we have migrated all packages
    "@typescript-eslint/no-require-imports": "warn",
    "@typescript-eslint/no-unused-expressions": "warn",
    "@typescript-eslint/no-empty-object-type": "warn",
    "@typescript-eslint/no-unsafe-function-type": "warn",
  },
  overrides: [
    {
      // Enable type-aware linting for TypeScript files only
      files: ["**/*.ts", "**/*.tsx"],
      excludedFiles: [
        "**/*.test.ts",
        "**/*.test.tsx",
        "spec.ts",
        "spec.tsx",
        "**/__tests__/**",
        "**/tests/**",
        "**/__mocks__/**",
        "**/mocks/**",
      ],
      parserOptions: {
        project: true,
      },
      rules: {
        "@typescript-eslint/no-deprecated": "warn",
      },
    },
  ],
};
