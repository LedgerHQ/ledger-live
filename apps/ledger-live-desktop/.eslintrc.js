const currencyFamiliesRules = {
  files: ["src/**"],
  excludedFiles: ["**/families/generated.ts", "**/families/*/**"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["**/families/*/**"],
            message:
              "families files must not be imported directly. use the bridge or export them through the LLDCoinFamily interface instead.",
          },
        ],
      },
    ],
  },
};

module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  plugins: ["react", "react-hooks"],
  extends: ["plugin:react/recommended", "plugin:react-hooks/recommended"],
  globals: {
    __DEV__: "readonly",
    INDEX_URL: "readonly",
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
    __SENTRY_URL__: "readonly",
    __APP_VERSION__: "readonly",
    __GIT_REVISION__: "readonly",
    __PRERELEASE__: "readonly",
    __CHANNEL__: "readonly",
    __static: "readonly",
    $: "readonly",
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: "module",
  },
  rules: {
    "no-prototype-builtins": "off",
    "no-use-before-define": "off",
    "promise/param-names": "off",
    "react/prop-types": "off",
    "react-hooks/rules-of-hooks": "error", // Checks rules of Hooks
    "react-hooks/exhaustive-deps": "error", // Checks effect dependencies
    "react/jsx-filename-extension": "off",
    "space-before-function-paren": "off",
    "@typescript-eslint/ban-types": "off", // FIXME make an error later
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-use-before-define": "off", // FIXME make an error later
    "@typescript-eslint/no-non-null-assertion": "off", // Useful sometimes. Should not be abused.

    // Ignore live-common for the moment because this rule does not work with subpath exports
    // See: https://github.com/import-js/eslint-plugin-import/issues/1810
    // "import/no-unresolved": [
    //   "error",
    //   { ignore: ["^@ledgerhq/live-common/.*", "^@ledgerhq/react-ui/.*"] },
    // ],
  },
  overrides: [
    currencyFamiliesRules,
    {
      files: ["tests/**/*.test.ts", "tests/**/*.test.tsx", "tests/**/*.ts", "tests/**/*.tsx"],
      env: {
        browser: true,
        es6: true,
        node: true,
        "jest/globals": true,
      },
      plugins: ["react", "react-hooks", "jest"],
      extends: [
        "plugin:react/recommended",
        "plugin:react-hooks/recommended",
        "plugin:prettier/recommended",
        "plugin:json/recommended",
        "plugin:jest/recommended",
        "plugin:jest/style",
      ],
      rules: {
        "@typescript-eslint/no-explicit-any": "warn",
      },
    },
  ],
  settings: {
    react: {
      version: "detect",
    },
  },
};
