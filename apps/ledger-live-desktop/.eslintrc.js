const currencyFamiliesRules = {
  files: ["src/**"],
  excludedFiles: [
    "src/generated/**",
    "src/renderer/families/**",
    "src/renderer/screens/lend/**", // FIXME lend screen should be migrated to ethereum family (if we don't sunset it)
  ],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["**/families/**"],
            message:
              "families files must not be imported directly. use the bridge or export through 'generated/' folder instead.",
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
    "jest/globals": true,
  },
  extends: [
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "standard",
    "plugin:prettier/recommended",
    "plugin:jest/recommended",
    "plugin:jest/style",
    "plugin:json/recommended",
  ],
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
  plugins: ["react", "react-hooks", "jest"],
  rules: {
    "space-before-function-paren": 0,
    "comma-dangle": 0,
    "no-prototype-builtins": 0,
    "promise/param-names": 0,
    "react-hooks/rules-of-hooks": "error", // Checks rules of Hooks
    "react-hooks/exhaustive-deps": "error", // Checks effect dependencies
    "jest/no-done-callback": 0,
    "react/jsx-filename-extension": "error",
    "no-restricted-imports": ["error", { paths: ["lodash"] }],
  },
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      plugins: ["react", "react-hooks", "@typescript-eslint"],
      extends: [
        "plugin:react/recommended",
        "plugin:react-hooks/recommended",
        "standard",
        "plugin:prettier/recommended",
        "plugin:jest/recommended",
        "plugin:jest/style",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
      ],
      parser: "@typescript-eslint/parser",
      rules: {
        "space-before-function-paren": 0,
        "no-prototype-builtins": 0,
        "promise/param-names": 0,
        "react-hooks/rules-of-hooks": "error", // Checks rules of Hooks
        "react-hooks/exhaustive-deps": "error", // Checks effect dependencies
        "no-use-before-define": "off",
        "@typescript-eslint/ban-types": 0, // FIXME make an error later
        "@typescript-eslint/no-use-before-define": 0, // FIXME make an error later
        "react/jsx-filename-extension": 0,

        // Ignore live-common for the moment because this rule does not work with subpath exports
        // See: https://github.com/import-js/eslint-plugin-import/issues/1810
        // "import/no-unresolved": [
        //   "error",
        //   { ignore: ["^@ledgerhq/live-common/.*", "^@ledgerhq/react-ui/.*"] },
        // ],
      },
    },
    currencyFamiliesRules,
  ],
  settings: {
    react: {
      version: "detect",
    },
  },
};
